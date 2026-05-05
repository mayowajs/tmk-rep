document.getElementById("year").textContent = new Date().getFullYear();

let selectedNetwork = null;
let selectedAmount  = null;
let generatedCards  = [];

// ── Network data — real Nigerian USSD recharge codes ──────────
const NETWORKS = {
  MTN: {
    color:    "#ffcc00",
    ussdFmt:  (pin) => `*555*${pin}#`,
    dialCode: "*555*PIN#",
    prefix:   ["0803","0806","0813","0816","0703","0706","0813","0814","0903","0906"]
  },
  Airtel: {
    color:    "#ff4444",
    ussdFmt:  (pin) => `*126*${pin}#`,
    dialCode: "*126*PIN#",
    prefix:   ["0802","0808","0812","0701","0708","0902","0907","0901"]
  },
  Glo: {
    color:    "#00c853",
    ussdFmt:  (pin) => `*123*${pin}#`,
    dialCode: "*123*PIN#",
    prefix:   ["0805","0807","0811","0815","0905","0915"]
  },
  "9mobile": {
    color:    "#69f0ae",
    ussdFmt:  (pin) => `*200*${pin}#`,
    dialCode: "*200*PIN#",
    prefix:   ["0809","0817","0818","0908","0909"]
  }
};

// ── Generate a 16-digit PIN in Nigerian recharge format ────────
// Format: XXXX-XXXX-XXXX-XXXX (all digits)
function generatePIN() {
  return Array.from({length: 4}, () =>
    String(Math.floor(1000 + Math.random() * 9000))
  ).join("-");
}

// ── Generate a Nigerian-style phone number for the network ─────
function generatePhoneNumber(network) {
  const prefixes = NETWORKS[network].prefix;
  const prefix   = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix   = String(Math.floor(1000000 + Math.random() * 9000000));
  return prefix + suffix;
}

// ── Network & Amount selection ────────────────────────────────
function selectNetwork(name) {
  selectedNetwork = name;
  document.querySelectorAll(".net-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("net-" + name).classList.add("active");
  clearPreview();
}

function selectAmount(val) {
  selectedAmount = val;
  document.querySelectorAll(".amt-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("amt-" + val).classList.add("active");
  clearPreview();
}

// ── Generate card(s) ──────────────────────────────────────────
function generateCard() {
  if (!selectedNetwork) { alert("Please select a network."); return; }
  if (!selectedAmount)  { alert("Please select an amount.");  return; }

  const qty = Math.min(Math.max(parseInt(document.getElementById("quantity").value) || 1, 1), 20);
  const net = NETWORKS[selectedNetwork];

  generatedCards = Array.from({length: qty}, () => {
    const pin   = generatePIN();
    const phone = generatePhoneNumber(selectedNetwork);
    return {
      id:      Date.now() + Math.random(),
      network: selectedNetwork,
      amount:  selectedAmount,
      pin,
      phone,
      ussd:    net.ussdFmt(pin),
      status:  "unused",
      date:    new Date().toLocaleDateString()
    };
  });

  // Show preview of first card
  const first = generatedCards[0];
  const netData = NETWORKS[first.network];

  document.getElementById("previewNetwork").textContent = first.network;
  document.getElementById("previewNetwork").style.color = netData.color;
  document.getElementById("previewUssd").textContent    = `Dial: ${first.ussd}`;
  document.getElementById("previewAmount").textContent  = "₦" + Number(first.amount).toLocaleString();
  document.getElementById("previewPin").textContent     = first.pin;
  document.getElementById("previewCode").textContent    = qty > 1 ? `+${qty - 1} more card(s) will be saved` : "";

  // reset phone input and load result
  document.getElementById("phoneInput").value = "";
  const res = document.getElementById("loadResult");
  res.className = "load-result";
  res.textContent = "";

  document.getElementById("previewWrap").classList.add("show");
}

// ── Save card(s) ──────────────────────────────────────────────
function saveCard() {
  if (!generatedCards.length) return;
  const saved = getSaved();
  saved.push(...generatedCards);
  setSaved(saved);
  generatedCards = [];
  clearPreview();
  renderTable();
}

// ── localStorage ──────────────────────────────────────────────
function getSaved() {
  return JSON.parse(localStorage.getItem("tmk_recharge") || "[]");
}
function setSaved(data) {
  localStorage.setItem("tmk_recharge", JSON.stringify(data));
}

// ── Render table ──────────────────────────────────────────────
function renderTable() {
  const query = (document.getElementById("searchInput").value || "").toLowerCase();
  const all   = getSaved();
  const saved = all.filter(c =>
    c.network.toLowerCase().includes(query) ||
    c.pin.includes(query) ||
    (c.phone || "").includes(query) ||
    String(c.amount).includes(query)
  );

  const body  = document.getElementById("cardsBody");
  const empty = document.getElementById("emptyState");
  document.getElementById("cardCount").textContent = all.length;

  if (!saved.length) {
    body.innerHTML = "";
    empty.classList.add("show");
    return;
  }
  empty.classList.remove("show");

  body.innerHTML = saved.map((c, i) => {
    const net  = NETWORKS[c.network];
    const ussd = net ? net.ussdFmt(c.pin) : c.ussd || "";
    return `
    <tr>
      <td style="color:var(--muted)">${i + 1}</td>
      <td><span class="net-badge ${c.network}">${c.network}</span></td>
      <td class="ussd-cell">${ussd}</td>
      <td class="pin-cell">${c.pin}</td>
      <td style="font-weight:700;color:#fff">₦${Number(c.amount).toLocaleString()}</td>
      <td class="code-cell">📱 ${c.phone || "—"}</td>
      <td>
        <button class="status-badge ${c.status}" onclick="toggleStatus('${c.id}')">
          <i class="fas fa-${c.status === 'unused' ? 'check-circle' : 'times-circle'}"></i>
          ${c.status === "unused" ? "Unused" : "Used"}
        </button>
      </td>
      <td>
        <button class="del-btn" onclick="deleteCard('${c.id}')" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join("");
}

// ── Toggle status ─────────────────────────────────────────────
function toggleStatus(id) {
  const saved = getSaved();
  const card  = saved.find(c => String(c.id) === String(id));
  if (!card) return;
  card.status = card.status === "unused" ? "used" : "unused";
  setSaved(saved);
  renderTable();
}

// ── Delete card ───────────────────────────────────────────────
function deleteCard(id) {
  setSaved(getSaved().filter(c => String(c.id) !== String(id)));
  renderTable();
}

// ── Clear all ─────────────────────────────────────────────────
function clearAll() {
  if (!getSaved().length) return;
  if (confirm("Delete all saved cards? This cannot be undone.")) {
    setSaved([]);
    renderTable();
  }
}

// ── Load card simulation ──────────────────────────────────────
const LOAD_MESSAGES = [
  { type: "loading", text: "⏳ Connecting to network..." },
  { type: "loading", text: "📡 Sending request to {network}..." },
  { type: "loading", text: "🔄 Verifying PIN..." },
  { type: "success", text: "✅ {amount} airtime loaded to {phone} on {network} successfully!" },
];

function loadCard() {
  const phone = document.getElementById("phoneInput").value.trim();
  const res   = document.getElementById("loadResult");
  const btn   = document.querySelector(".load-btn");

  if (!phone || phone.length < 10) {
    res.className = "load-result show error";
    res.textContent = "❌ Please enter a valid 11-digit phone number.";
    return;
  }
  if (!generatedCards.length) {
    res.className = "load-result show error";
    res.textContent = "❌ No card generated yet.";
    return;
  }

  const card   = generatedCards[0];
  const amount = "₦" + Number(card.amount).toLocaleString();
  btn.disabled = true;

  let step = 0;
  function nextStep() {
    if (step >= LOAD_MESSAGES.length) { btn.disabled = false; return; }
    const msg = LOAD_MESSAGES[step];
    res.className = `load-result show ${msg.type}`;
    res.textContent = msg.text
      .replace("{network}", card.network)
      .replace("{phone}", phone)
      .replace("{amount}", amount);
    step++;
    if (step < LOAD_MESSAGES.length) setTimeout(nextStep, 1200);
    else btn.disabled = false;
  }
  nextStep();
}

// ── Clear preview ─────────────────────────────────────────────
function clearPreview() {
  document.getElementById("previewWrap").classList.remove("show");
  generatedCards = [];
}

// ── Init ──────────────────────────────────────────────────────
renderTable();
