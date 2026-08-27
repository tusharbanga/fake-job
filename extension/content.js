let debounceTimer = null;
let panelFrame = null;

function showPanel(text) {
  if (panelFrame) panelFrame.remove();
  panelFrame = document.createElement("iframe");
  panelFrame.title = "JobLens analysis";
  panelFrame.src = `http://127.0.0.1:5173/?selection=${encodeURIComponent(text)}`;
  panelFrame.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:2147483647;width:360px;height:min(700px,calc(100vh - 40px));border:0;border-radius:22px;box-shadow:0 18px 48px #0003;background:#fff;";
  document.body.appendChild(panelFrame);
}

function scheduleAnalysis() {
  clearTimeout(debounceTimer);
  const text = window.getSelection()?.toString().trim();
  if (!text) return;
  debounceTimer = setTimeout(() => showPanel(text.slice(0, 20000)), 2000);
}

document.addEventListener("selectionchange", scheduleAnalysis);
document.addEventListener("mouseup", scheduleAnalysis);

// Relay resume persistence between the JobLens iframe and chrome.storage.local.
// The iframe (http://127.0.0.1:5173) cannot call chrome.storage directly since
// it's not an extension page, and its own localStorage gets partitioned per
// top-level site by the browser — so a resume saved on one job site would not
// show up on another. chrome.storage.local is extension-scoped and global.
window.addEventListener("message", (event) => {
  if (event.source !== panelFrame?.contentWindow) return;
  const { type, payload, requestId } = event.data || {};

  if (type === "JOBLENS_SAVE_RESUME") {
    chrome.storage.local.set({ joblensResume: payload }, () => {
      panelFrame?.contentWindow?.postMessage({ type: "JOBLENS_SAVE_RESUME_ACK", requestId, ok: !chrome.runtime.lastError }, "*");
    });
  }

  if (type === "JOBLENS_GET_RESUME") {
    chrome.storage.local.get(["joblensResume"], (result) => {
      panelFrame?.contentWindow?.postMessage({ type: "JOBLENS_RESUME_DATA", requestId, payload: result.joblensResume || null }, "*");
    });
  }

  if (type === "JOBLENS_REMOVE_RESUME") {
    chrome.storage.local.remove("joblensResume", () => {
      panelFrame?.contentWindow?.postMessage({ type: "JOBLENS_REMOVE_RESUME_ACK", requestId }, "*");
    });
  }
});
