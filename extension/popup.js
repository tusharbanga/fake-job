const API_BASE_URL = "https://fake-job-api-xeuu.onrender.com";
const STORAGE_KEY = "joblens_token";
const CREDITS_PER_RUPEE = 8;
const PRESET_AMOUNTS = [25, 50, 100, 200, 500, 1000];
let selectedAmount = PRESET_AMOUNTS[0];

const el = (id) => document.getElementById(id);

function setToken(token) {
  chrome.storage.local.set({ [STORAGE_KEY]: token });
}

function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => resolve(result[STORAGE_KEY] || null));
  });
}

async function api(path, opts = {}) {
  const token = await getToken();
  const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, { ...opts, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof body.detail === "string" ? body.detail : (body.detail?.message || "Something went wrong");
    throw new Error(detail);
  }
  return body;
}

function renderPackGrid() {
  const grid = el("packGrid");
  grid.innerHTML = "";
  PRESET_AMOUNTS.forEach((amount) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `pack-chip${amount === selectedAmount ? " active" : ""}`;
    chip.innerHTML = `<div class="price">₹${amount}</div><div class="qty">+${amount * CREDITS_PER_RUPEE} credits</div>`;
    chip.addEventListener("click", () => {
      selectedAmount = amount;
      el("customAmount").value = "";
      el("customCreditsOut").textContent = "";
      renderPackGrid();
    });
    grid.appendChild(chip);
  });
}

function showLoggedOut(message = "", isErr = false) {
  el("loggedOut").classList.remove("hidden");
  el("loggedIn").classList.add("hidden");
  el("loginStatus").textContent = message || "";
  el("loginStatus").className = `status${isErr ? " err" : ""}`;
}

function showLoggedIn(user) {
  el("loggedOut").classList.add("hidden");
  el("loggedIn").classList.remove("hidden");
  el("userName").textContent = user.name;
  el("userEmail").textContent = user.email;
  el("userPic").src = user.picture || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
  el("creditCount").textContent = user.credits;
}

async function loadMe() {
  try {
    const user = await api("/auth/me");
    showLoggedIn(user);
  } catch (err) {
    chrome.storage.local.remove([STORAGE_KEY]);
    showLoggedOut();
  }
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Razorpay checkout could not be loaded"));
    document.head.appendChild(script);
  });
}

el("googleLoginBtn").addEventListener("click", () => {
  showLoggedOut("Waiting for Google sign-in…");
  window.open(`${API_BASE_URL}/auth/google/login`, "joblens-google-login", "width=520,height=680");
});

window.addEventListener("message", (event) => {
  if (event.data?.type === "JOBLENS_AUTH" && event.data.token) {
    setToken(event.data.token);
    loadMe();
  }
});

el("logoutBtn").addEventListener("click", () => {
  chrome.storage.local.remove([STORAGE_KEY]);
  showLoggedOut();
});

el("customAmount").addEventListener("input", (event) => {
  const raw = parseInt(event.target.value, 10);
  if (!raw || raw < 10 || raw > 1000) {
    el("customCreditsOut").textContent = raw ? "10–1000 only" : "";
    selectedAmount = null;
    return;
  }
  selectedAmount = raw;
  el("customCreditsOut").textContent = `= ${raw * CREDITS_PER_RUPEE} credits`;
  document.querySelectorAll(".pack-chip").forEach((chip) => chip.classList.remove("active"));
});

renderPackGrid();

(async () => {
  const token = await getToken();
  if (token) {
    loadMe();
  } else {
    showLoggedOut();
  }
})();

el("payBtn").addEventListener("click", async () => {
  const payStatus = el("payStatus");
  const payBtn = el("payBtn");
  payStatus.className = "status";

  if (!selectedAmount || selectedAmount < 10 || selectedAmount > 1000) {
    payStatus.className = "status err";
    payStatus.textContent = "Pick a pack or enter an amount between ₹10 and ₹1000.";
    return;
  }

  payStatus.textContent = "Creating order…";
  payBtn.disabled = true;

  try {
    await loadRazorpay();
    const order = await api("/payments/order", {
      method: "POST",
      body: JSON.stringify({ amount: selectedAmount }),
    });

    const rzp = new window.Razorpay({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: "JobLens",
      description: `${order.credits} scan credits`,
      order_id: order.order_id,
      theme: { color: "#5eead4" },
      handler: async (response) => {
        payStatus.textContent = "Verifying payment…";
        try {
          const result = await api("/payments/verify", {
            method: "POST",
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          el("creditCount").textContent = result.credits;
          payStatus.className = "status ok";
          payStatus.textContent = result.credited ? `+${order.credits} credits added. New balance: ${result.credits}.` : `Current balance: ${result.credits}.`;
        } catch (error) {
          payStatus.className = "status err";
          payStatus.textContent = error.message;
        } finally {
          payBtn.disabled = false;
        }
      },
      modal: {
        ondismiss: () => {
          payStatus.textContent = "Payment cancelled.";
          payBtn.disabled = false;
        }
      }
    });

    rzp.on("payment.failed", (resp) => {
      payStatus.className = "status err";
      payStatus.textContent = "Payment failed: " + resp.error.description;
      payBtn.disabled = false;
    });

    payStatus.textContent = "Opening checkout…";
    rzp.open();
  } catch (error) {
    payStatus.className = "status err";
    payStatus.textContent = error.message;
    payBtn.disabled = false;
  }
});
