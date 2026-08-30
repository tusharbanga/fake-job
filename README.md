# JobLens architecture

The existing `JobLensPanel.jsx` remains the frontend component. The backend and extension are companion implementations under `backend/`, `frontend/`, and `extension/`.

## Run the backend

1. Start MongoDB.
2. Copy `backend/.env.example` to `backend/.env` and configure MongoDB, Google OAuth, Groq, and Razorpay.
3. Install and run:

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Google must allow `https://fake-job-api-xeuu.onrender.com/auth/google/callback`. The extension can be loaded unpacked from `extension/` in Chrome. The exact selection debounce is owned by `extension/content.js`: every selection clears the previous timer and schedules analysis after exactly 5000 ms.

## Credits and Razorpay

Login is mandatory. Each successful analysis costs one credit; a zero balance returns HTTP 402 and cannot run an analysis. Razorpay orders are created server-side and the payment signature is verified before credits are added. Configure the Razorpay webhook at `POST /payments/webhook` for `payment.captured` as a fallback when a browser closes before verification. Pricing is ₹25 for 100 credits, with ₹50, ₹100 and a ₹10–₹10,000 custom recharge option (4 credits per rupee).

The ML adapter is intentionally unavailable in `backend/app/services/ml_detector.py`. It returns nullable fields and `available: false`; the aggregator uses Groq for the current final result and never converts ML absence into a prediction.
