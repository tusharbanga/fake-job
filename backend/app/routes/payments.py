import hashlib
import hmac
from datetime import datetime, timezone
from uuid import uuid4

import razorpay
from fastapi import APIRouter, Depends, HTTPException, Request
from pymongo import ReturnDocument

from ..config import settings
from ..db import database
from ..dependencies import current_user
from ..schemas import CreateOrderRequest, UserResponse, VerifyPaymentRequest

router = APIRouter(prefix="/payments", tags=["payments"])


def razorpay_client() -> razorpay.Client:
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(503, "Razorpay is not configured")
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


@router.post("/order")
async def create_order(payload: CreateOrderRequest, user: UserResponse = Depends(current_user)):
    credits = payload.amount * settings.credits_per_rupee
    order = razorpay_client().order.create({
        "amount": payload.amount * 100,
        "currency": "INR",
        "receipt": f"jl_{uuid4().hex[:24]}",
        "notes": {"user_id": user.id, "credits": str(credits)},
    })
    await database.payments.insert_one({
        "_id": str(uuid4()), "user_id": user.id, "razorpay_order_id": order["id"],
        "amount": payload.amount, "credits": credits, "status": "created",
        "created_at": datetime.now(timezone.utc),
    })
    return {"order_id": order["id"], "amount": payload.amount * 100, "currency": "INR", "credits": credits, "key_id": settings.razorpay_key_id}


@router.post("/verify")
async def verify_payment(payload: VerifyPaymentRequest, user: UserResponse = Depends(current_user)):
    payment = await database.payments.find_one({"razorpay_order_id": payload.razorpay_order_id, "user_id": user.id})
    if not payment:
        raise HTTPException(404, "Payment order not found")
    if payment["status"] == "paid":
        user_doc = await database.users.find_one({"_id": user.id})
        return {"credits": user_doc.get("credits", 0), "credited": False}
    try:
        razorpay_client().utility.verify_payment_signature(payload.model_dump())
    except Exception as exc:
        raise HTTPException(400, "Invalid payment signature") from exc
    updated = await database.payments.find_one_and_update(
        {"_id": payment["_id"], "status": {"$ne": "paid"}},
        {"$set": {"status": "paid", "razorpay_payment_id": payload.razorpay_payment_id, "paid_at": datetime.now(timezone.utc)}},
    )
    if updated:
        user_doc = await database.users.find_one_and_update({"_id": user.id}, {"$inc": {"credits": payment["credits"]}}, return_document=ReturnDocument.AFTER)
        return {"credits": user_doc.get("credits", 0), "credited": True}
    user_doc = await database.users.find_one({"_id": user.id})
    return {"credits": user_doc.get("credits", 0), "credited": False}


@router.post("/webhook")
async def razorpay_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")
    expected = hmac.new(settings.razorpay_webhook_secret.encode(), body, hashlib.sha256).hexdigest()
    if not settings.razorpay_webhook_secret or not hmac.compare_digest(expected, signature):
        raise HTTPException(400, "Invalid webhook signature")
    event = await request.json()
    if event.get("event") != "payment.captured":
        return {"ok": True}
    entity = event["payload"]["payment"]["entity"]
    payment = await database.payments.find_one_and_update(
        {"razorpay_order_id": entity["order_id"], "status": {"$ne": "paid"}},
        {"$set": {"status": "paid", "razorpay_payment_id": entity["id"], "paid_at": datetime.now(timezone.utc)}},
    )
    if payment:
        await database.users.update_one({"_id": payment["user_id"]}, {"$inc": {"credits": payment["credits"]}})
    return {"ok": True}
