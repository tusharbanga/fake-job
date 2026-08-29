

let debounceTimer = null;
let panelFrame = null;
let panelWindow = null;

function showPanel(text) {
  // Prefer injecting an inline iframe (restores previous UX). If injection fails
  // (exceptions or popup/blocking), fall back to opening a popup window.
  const url = `http://127.0.0.1:5173/?selection=${encodeURIComponent(text)}`;
  try {
    if (panelFrame && panelFrame.parentNode) panelFrame.remove();
    panelFrame = document.createElement('iframe');
    panelFrame.title = 'JobLens analysis';
    panelFrame.src = url;
    console.log('content.js: creating panel iframe with selection', text.slice(0, 100));
    panelFrame.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483647;width:360px;height:min(700px,calc(100vh - 40px));border:0;border-radius:22px;box-shadow:0 18px 48px #0003;background:#fff;';
    document.body.appendChild(panelFrame);
    // Clear any previous popup reference since iframe is primary now
    try { if (panelWindow && !panelWindow.closed) panelWindow.close(); } catch {}
    panelWindow = null;
  } catch (err) {
    console.warn('content.js: iframe injection failed, opening popup as fallback', err);
    const features = 'width=420,height=700,menubar=no,toolbar=no,location=no,resizable=yes';
    try {
      if (!panelWindow || panelWindow.closed) {
        panelWindow = window.open(url, 'joblens-panel', features);
        console.log('content.js: opened panel window', url);
      } else {
        panelWindow.focus();
        panelWindow.location = url;
      }
    } catch (err2) {
      console.error('content.js: failed to open popup fallback', err2);
    }
  }
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
window.addEventListener('message', (event) => {
  // Accept messages from either the inline iframe (`panelFrame`) or the popup (`panelWindow`).
  if (!(event.source === (panelFrame?.contentWindow) || event.source === panelWindow)) return;
  const { type, payload, requestId } = event.data || {};
  console.log('content.js: received message from panel', { type, requestId, payload });

  const target = panelFrame?.contentWindow || panelWindow;

  function sendMessage(message) {
    try {
      target?.postMessage(message, '*');
    } catch (err) {
      console.warn('content.js: postMessage failed', err);
    }
  }

  if (!chrome?.storage?.local) {
    console.warn('content.js: chrome.storage.local is unavailable; extension context may be invalidated');
    return;
  }

  if (type === 'JOBLENS_SAVE_RESUME') {
    try {
      chrome.storage.local.set({ joblensResume: payload }, () => {
        if (chrome.runtime?.lastError) {
          console.warn('content.js: storage set failed', chrome.runtime.lastError.message);
          return;
        }
        const ack = { type: 'JOBLENS_SAVE_RESUME_ACK', requestId, ok: true };
        console.log('content.js: saving resume, posting ack', ack);
        sendMessage(ack);
      });
    } catch (err) {
      console.warn('content.js: failed to save resume to storage', err);
    }
  }

  if (type === 'JOBLENS_GET_RESUME') {
    try {
      chrome.storage.local.get(['joblensResume'], (result) => {
        if (chrome.runtime?.lastError) {
          console.warn('content.js: storage get failed', chrome.runtime.lastError.message);
          sendMessage({ type: 'JOBLENS_RESUME_DATA', requestId, payload: null });
          return;
        }
        const msg = { type: 'JOBLENS_RESUME_DATA', requestId, payload: result.joblensResume || null };
        console.log('content.js: returning resume data to panel', msg);
        sendMessage(msg);
      });
    } catch (err) {
      console.warn('content.js: failed to read resume from storage', err);
      sendMessage({ type: 'JOBLENS_RESUME_DATA', requestId, payload: null });
    }
  }

  if (type === 'JOBLENS_REMOVE_RESUME') {
    try {
      chrome.storage.local.remove('joblensResume', () => {
        if (chrome.runtime?.lastError) {
          console.warn('content.js: storage remove failed', chrome.runtime.lastError.message);
          return;
        }
        const ack = { type: 'JOBLENS_REMOVE_RESUME_ACK', requestId };
        console.log('content.js: removed resume, posting ack', ack);
        sendMessage(ack);
      });
    } catch (err) {
      console.warn('content.js: failed to remove resume from storage', err);
    }
  }
});
