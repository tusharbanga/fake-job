let debounceTimer = null;
let panelFrame = null;

function showPanel(text) {
  if (panelFrame) {
    panelFrame.remove();
  }

  panelFrame = document.createElement("iframe");

  panelFrame.title = "JobLens analysis";

  panelFrame.src =
    `https://fake-job.vercel.app/?selection=${encodeURIComponent(text)}`;

  panelFrame.style.cssText = `
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 2147483647;
    width: 360px;
    height: min(700px, calc(100vh - 40px));
    border: 0;
    border-radius: 22px;
    box-shadow: 0 18px 48px #0003;
    background: #fff;
  `;

  document.body.appendChild(panelFrame);
}

function scheduleAnalysis() {
  clearTimeout(debounceTimer);

  const selection = window.getSelection();
  const text = selection?.toString().trim();

  if (!text) return;

  debounceTimer = setTimeout(() => {
    const currentSelection = window.getSelection();
    const currentText = currentSelection?.toString().trim();

    if (!currentText) return;

    // Capture the text BEFORE clearing the browser selection
    const textToAnalyze = currentText.slice(0, 20000);

    // Clear the blue browser selection.
    // This prevents the injected JobLens iframe from
    // appearing blue when Cmd+A is used.
    currentSelection.removeAllRanges();

    // Open JobLens
    showPanel(textToAnalyze);
  }, 1000);
}

// ----------------------------------------------------
// TEXT SELECTION
// ----------------------------------------------------

// Normal mouse selection
document.addEventListener("mouseup", scheduleAnalysis);

// Cmd+A / Ctrl+A selection
document.addEventListener("selectionchange", scheduleAnalysis);


// ----------------------------------------------------
// RESUME STORAGE BRIDGE
// ----------------------------------------------------
//
// The JobLens frontend is running inside an iframe:
//
// https://fake-job.vercel.app
//
// It cannot directly use chrome.storage.local because
// it is a normal web page, not an extension page.
//
// So we communicate between iframe <-> content script
// using window.postMessage().
// ----------------------------------------------------

window.addEventListener("message", (event) => {
  // Only accept messages from our JobLens iframe
  if (event.source !== panelFrame?.contentWindow) {
    return;
  }

  const {
    type,
    payload,
    requestId
  } = event.data || {};


  // --------------------------------------------------
  // SAVE RESUME
  // --------------------------------------------------

  if (type === "JOBLENS_SAVE_RESUME") {
    chrome.storage.local.set(
      {
        joblensResume: payload
      },
      () => {
        panelFrame?.contentWindow?.postMessage(
          {
            type: "JOBLENS_SAVE_RESUME_ACK",
            requestId,
            ok: !chrome.runtime.lastError
          },
          "*"
        );
      }
    );
  }


  // --------------------------------------------------
  // GET RESUME
  // --------------------------------------------------

  if (type === "JOBLENS_GET_RESUME") {
    chrome.storage.local.get(
      ["joblensResume"],
      (result) => {
        panelFrame?.contentWindow?.postMessage(
          {
            type: "JOBLENS_RESUME_DATA",
            requestId,
            payload: result.joblensResume || null
          },
          "*"
        );
      }
    );
  }


  // --------------------------------------------------
  // REMOVE RESUME
  // --------------------------------------------------

  if (type === "JOBLENS_REMOVE_RESUME") {
    chrome.storage.local.remove(
      "joblensResume",
      () => {
        panelFrame?.contentWindow?.postMessage(
          {
            type: "JOBLENS_REMOVE_RESUME_ACK",
            requestId
          },
          "*"
        );
      }
    );
  }
});