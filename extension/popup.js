const enabled = document.querySelector("#enabled");
const status = document.querySelector("#status");
chrome.storage.local.set({ enabled: true });
chrome.storage.local.get(["token"], (state) => { enabled.checked = true; status.textContent = state.token ? "Connected" : "Ready - select text"; });
enabled.addEventListener("change", () => chrome.storage.local.set({ enabled: enabled.checked }));
window.addEventListener("message", (event) => { if (event.data?.type === "JOBLENS_AUTH") { chrome.storage.local.set({ token: event.data.token }); status.textContent = "Connected"; } });
