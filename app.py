from flask import Flask, request, render_template
import joblib
import os

app = Flask(__name__)

MODEL_PATH = "model/model.pkl"
VECTORIZER_PATH = "model/vectorizer.pkl"

if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
    raise FileNotFoundError("Model or vectorizer file not found. Please run train_model.py first.")

print("Loading model and vectorizer...")
model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)

@app.route("/", methods=["GET", "POST"])
def index():
    prediction = None
    job_text = ""
    if request.method == "POST":
        job_text = request.form.get("job_text", "")
        if job_text.strip() != "":
            text_vector = vectorizer.transform([job_text])
            proba = model.predict_proba(text_vector)[0][1]  
            confidence = proba * 100 
            result = 1 if proba > 0.4 else 0
            prediction = f"Fake Job Posting (There's {confidence:.1f}%  chance that this job might be fake.)" if result == 1 else f"Genuine Job Posting (There's only {confidence:.1f}% chance that this job might be fake.)"
        else:
            prediction = "Please enter job description."
    return render_template("index.html", prediction=prediction, job_text=job_text)

if __name__ == "__main__":
    print("Starting Flask app...")
    app.run(debug=True)