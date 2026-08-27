const API_BASE_URL = "http://127.0.0.1:8000";

function responseError(data, fallback) {
  if (typeof data?.detail === "string") return data.detail;
  if (data?.detail) return JSON.stringify(data.detail);
  return fallback;
}

async function readResponse(response) {
  const body = await response.text();
  try { return JSON.parse(body); } catch { return { detail: body || "Empty server response" }; }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "ANALYZE_SELECTION") return;
  chrome.storage.local.get(["token", "enabled"], async ({ token, enabled = true }) => {
    if (!enabled) return sendResponse({ error: "Enable JobLens first" });
    if (!token) {
      try {
        const response = await fetch(`${API_BASE_URL}/analysis/demo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: message.text }) });
        const data = await readResponse(response);
        return sendResponse(response.ok ? { data } : { error: responseError(data, "AI analysis failed") });
      } catch (error) { return sendResponse({ error: error.message }); }
    }
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/analyze`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ text: message.text }) });
      const data = await readResponse(response);
      sendResponse(response.ok ? { data } : { error: responseError(data, "Analysis failed") });
    } catch (error) { sendResponse({ error: error.message }); }
  });
  return true;
});
