const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://fake-job-api-xeuu.onrender.com";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Request failed");
  return data;
}

const authHeaders = (token, extra = {}) => ({ ...extra, Authorization: `Bearer ${token}` });

export function openGoogleLogin() {
  window.open(`${API_BASE_URL}/auth/google/login`, "joblens-google-login", "width=520,height=680");
}

export const getCurrentUser = (token) => request("/auth/me", { headers: authHeaders(token) });

export const analyzeJob = (text, resumeId, token) => request("/analysis/analyze", {
  method: "POST", headers: authHeaders(token, { "Content-Type": "application/json" }), body: JSON.stringify({ text, resume_id: resumeId || null }),
});

export const uploadResume = (file, token) => {
  const form = new FormData();
  form.append("file", file);
  return request("/resumes", { method: "POST", headers: authHeaders(token), body: form });
};

export const createPaymentOrder = (amount, token) => request("/payments/order", {
  method: "POST", headers: authHeaders(token, { "Content-Type": "application/json" }), body: JSON.stringify({ amount }),
});

export const verifyPayment = (payment, token) => request("/payments/verify", {
  method: "POST", headers: authHeaders(token, { "Content-Type": "application/json" }), body: JSON.stringify(payment),
});

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Razorpay checkout could not be loaded"));
    document.head.appendChild(script);
  });
}
