import pandas as pd
df = pd.read_csv("fake_job_postings.csv")
import numpy as np
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

print("Loading dataset...")
data = pd.read_csv("fake_job_postings.csv")  

print("Cleaning dataset...")
data = data[["title", "description", "fraudulent"]]
data = data.dropna()

data["text"] = data["title"] + " " + data["description"]

print("Vectorizing text...")
vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
X = vectorizer.fit_transform(data["text"])
y = data["fraudulent"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training model...")
model = LogisticRegression(class_weight="balanced", max_iter=1000)
model.fit(X_train, y_train)

print("Evaluating model...")
y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Classification Report:\n", classification_report(y_test, y_pred))

print("Saving model and vectorizer...")
os.makedirs("model", exist_ok=True)
joblib.dump(model, "model/model.pkl")
joblib.dump(vectorizer, "model/vectorizer.pkl")

print("Model training complete. Files saved in /model/")
print("Class distribution:\n", df['fraudulent'].value_counts())