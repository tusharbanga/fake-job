const API_BASE_URL = "http://127.0.0.1:8000";

export function openGoogleLogin() {
  window.open(`${API_BASE_URL}/auth/google/login`, "joblens-google-login", "width=520,height=680");
}

export async function analyzeJob(text, resumeId, token) {
  const response = await fetch(`${API_BASE_URL}/analysis/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text, resume_id: resumeId || null }),
  });
  if (!response.ok) throw new Error((await response.json()).detail || "Analysis failed");
  return response.json();
}

export async function analyzeDemoJob(text) {
  const response = await fetch(`${API_BASE_URL}/analysis/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error((await response.json()).detail || "AI analysis failed");
  return response.json();
}

export async function matchDemoResume(text, resume, jobSkills) {
  const form = new FormData();
  form.append("text", text);
  form.append("file", resume, resume.name);
  if (jobSkills?.length) form.append("job_skills", jobSkills.join("||"));
  const response = await fetch(`${API_BASE_URL}/analysis/demo-match`, { method: "POST", body: form });
  if (!response.ok) throw new Error((await response.json()).detail || "Resume matching failed");
  return response.json();
}
