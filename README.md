# JobLens architecture

The existing `JobLensPanel.jsx` remains the frontend component. The backend and extension are companion implementations under `backend/`, `frontend/`, and `extension/`.

## Run the backend

1. Start MongoDB.
2. Copy `backend/.env.example` to `backend/.env` and configure Google OAuth and Groq.
3. Install and run:

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Google must allow `http://localhost:8000/auth/google/callback`. The extension can be loaded unpacked from `extension/` in Chrome. The exact selection debounce is owned by `extension/content.js`: every selection clears the previous timer and schedules analysis after exactly 5000 ms.

The ML adapter is intentionally unavailable in `backend/app/services/ml_detector.py`. It returns nullable fields and `available: false`; the aggregator uses Groq for the current final result and never converts ML absence into a prediction.
