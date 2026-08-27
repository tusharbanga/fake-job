"""Stable seam for the user-provided ML model.

Loads the TF-IDF + LogisticRegression fake-job-posting model and exposes it
through analyze_job(text). The rest of the application treats an unavailable
ML model as unavailable, never as a prediction — so any load or inference
failure here just falls back to available=False instead of crashing.
"""

import os

import joblib

_MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
_MODEL_PATH = os.path.join(_MODEL_DIR, "model.pkl")
_VECTORIZER_PATH = os.path.join(_MODEL_DIR, "vectorizer.pkl")

_FAKE_THRESHOLD = 0.4  # matches the threshold used when the model was trained/evaluated

try:
    _model = joblib.load(_MODEL_PATH)
    _vectorizer = joblib.load(_VECTORIZER_PATH)
except Exception as e:
    print("ML LOAD ERROR:", repr(e))
    _model = None
    _vectorizer = None


def analyze_job(text: str) -> dict:
    if _model is None or _vectorizer is None:
        return {"classification": None, "score": None, "reasons": [], "available": False}

    try:
        vector = _vectorizer.transform([text])
        fake_probability = float(_model.predict_proba(vector)[0][1])
    except Exception as e:
        print("ML INFERENCE ERROR:", repr(e))
        return {"classification": None, "score": None, "reasons": [], "available": False}

    is_fake = fake_probability > _FAKE_THRESHOLD
    # classification follows the same positive/negative convention as the Groq
    # classifier (positive = looks genuine, negative = looks fake), and score
    # is the model's confidence in *that* classification (0-100) so it can be
    # averaged directly with the Groq score in aggregator.py.
    classification = "negative" if is_fake else "positive"
    confidence = fake_probability if is_fake else (1 - fake_probability)
    score = round(confidence * 100)
    reason = (
        f"ML model estimates a {fake_probability * 100:.1f}% chance this posting is fraudulent."
        if is_fake
        else f"ML model estimates only a {fake_probability * 100:.1f}% chance this posting is fraudulent."
    )
    return {"classification": classification, "score": score, "reasons": [reason], "available": True}
