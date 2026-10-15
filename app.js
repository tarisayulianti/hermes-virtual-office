const AGENTS = [
  { id: "scout", name: "Scout", role: "Market Data · public klines", color: "#28e0c8", status: "busy",
    meta: { Source: "data-api.binance.vision", Symbol: "BTCUSDT", Interval: "15m", "API errors": "0", Mode: "PUBLIC only" },
    log: "fetch klines OK\n499 candles context\nno private endpoints" },
  { id: "strategist", name: "Strategist", role: "Strategy V1 · EMA / RSI / MACD", color: "#e0c050", status: "idle",
    meta: { Strategy: "V1_SPOT_BTCUSDT_15M", Threshold: "0.60", SHORT: "disabled", Signal: "NO_TRADE", SHA: "5acd81ae…" },
    log: "indicators stable\nno lookahead\nwaiting forward candle" },
  { id: "brain", name: "Brain", role: "Trade Proposal · never executes", color: "#b48cff", status: "idle",
    meta: { Proposals: "0 (session)", Last: "—", Executes: "never", Output: "TradeProposal only" },
    log: "idle — no new signal above threshold" },
  { id: "risk", name: "Risk Officer", role: "Risk Engine · mandatory barrier", color: "#3dcc7a", status: "idle",
    meta: { "Risk / trade": "0.5%", "Max positions": "1", "Max DD": "10%", "Order type": "LIMIT_ONLY", Bypass: "impossible" },
    log: "barrier armed\nno pending proposal" },
  { id: "executor", name: "Executor", role: "Demo Executor · simulated fills", color: "#ff8c32", status: "idle",
    meta: { Mode: "DEMO", "Real orders": "0", Fills: "simulated only", LIVE: "disabled" },
    log: "DEMO badge active\nawaiting approved proposal" },
  { id: "portfolio", name: "Portfolio", role: "Virtual Portfolio · cash / exposure / PnL", color: "#3dcc7a", status: "busy",
    meta: { Cash: "1170.06", Exposure: "8821.12", Fees: "8.82", "Open pos": "1 LONG BTCUSDT", Realized: "0" },
    log: "books consistent\nentry 85826.89 · qty 0.102778" },
  { id: "scribe", name: "Scribe", role: "Journal · append-only audit", color: "#c49a6c", status: "busy",
    meta: { Journal: "append-only", Idempotency: "UNIQUE guards", Schema: "v10", Writes: "event stream" },
    log: "SYSTEM_START logged\nSTATE_UPDATE heartbeats" },
  { id: "sentinel", name: "Sentinel", role: "Monitoring · integrity / alerts", color: "#4ec8ff", status: "busy",
    meta: { Heartbeat: "ok", DEGRADED: "false", "Emergency stop": "absent", Lock: "absent" },
    log: "integrity monitor green\nno EMERGENCY_STOP" },
  { id: "conductor", name: "Conductor", role: "Orchestrator · cycle / runtime", color: "#ff5a8a", status: "busy",
    meta: { Loop: "RUNNING", Forward: "active", Entry: "soak_harness", "Single instance": "lock aware" },
    log: "cycle running\nDEMO path only" },
  { id: "auditor", name: "Auditor", role: "Evidence · SHA / session gate", color: "#9aa4b0", status: "idle",
    meta: { "Canonical DB": "4dcfbf41…", Evidence: "docs/evidence_phase40_*", "6h gate": "pending host DB", Mode: "read-only verify" },
    log: "waiting complete 6h evidence session\nSHA checks ready" },
];

const TIMELINE_SEED = [
  { t: "boot", msg: "SYSTEM_START · DEMO mode" },
  { t: "scout", msg: "Market data path healthy" },
  { t: "sentinel", msg: "No EMERGENCY_STOP / lock" },
  { t: "conductor", msg: "Runtime state RUNNING" },
  { t: "portfolio", msg: "Virtual books loaded" },
  { t: "auditor", msg: "Evidence gate armed" },
];

const agentsEl = document.getElementById("agents");
const panel = document.getElementById("panel");
const timeline = document.getElementById("timeline");
const alerts = document.getElementById("alerts");
let selected = null;
const startTs = Date.now();

function renderAgents() {
  agentsEl.innerHTML = "";
  AGENTS.forEach((a) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "agent";
    el.dataset.id = a.id;
    el.dataset.status = a.status;
    el.innerHTML = `
      <div class="avatar" style="--c:${a.color}">${a.name[0]}</div>
      <span class="label"><span class="dot"></span>${a.name}</span>
    `;
    el.addEventListener("click", () => openPanel(a.id));
    agentsEl.appendChild(el);
  });
}

function openPanel(id) {
  const a = AGENTS.find((x) => x.id === id);
  if (!a) return;
  selected = id;
  document.querySelectorAll(".agent").forEach((el) => {
    el.classList.toggle("active", el.dataset.id === id);
  });
  panel.hidden = false;
  const pi = document.getElementById("panelImg");
  if (pi) {
    pi.style.setProperty("--c", a.color);
    pi.textContent = a.name[0];
  }
  document.getElementById("panelName").textContent = a.name;
  document.getElementById("panelRole").textContent = a.role;
  document.getElementById("panelStatus").textContent = a.status.toUpperCase();
  document.getElementById("panelMeta").innerHTML = Object.entries(a.meta)
    .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  document.getElementById("panelLog").textContent = a.log;
}

document.getElementById("panelClose").addEventListener("click", () => {
  panel.hidden = true;
  selected = null;
  document.querySelectorAll(".agent").forEach((el) => el.classList.remove("active"));
});

function renderTimeline() {
  timeline.innerHTML = TIMELINE_SEED.map(
    (e) => `<li><b>${e.t}</b> · ${e.msg}</li>`
  ).join("");
}

function pushEvent(t, msg) {
  TIMELINE_SEED.unshift({ t, msg });
  if (TIMELINE_SEED.length > 12) TIMELINE_SEED.pop();
  renderTimeline();
}

function tick() {
  const s = Math.floor((Date.now() - startTs) / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  document.getElementById("uptime").textContent = `${hh}:${mm}:${ss}`;
}

function mockPulse() {
  const busyPool = ["scout", "sentinel", "scribe", "conductor"];
  AGENTS.forEach((a) => {
    if (busyPool.includes(a.id)) a.status = Math.random() > 0.35 ? "busy" : "idle";
  });
  document.querySelectorAll(".agent").forEach((el) => {
    const a = AGENTS.find((x) => x.id === el.dataset.id);
    if (a) el.dataset.status = a.status;
  });
  if (selected) openPanel(selected);
  const msgs = [
    ["scout", "klines poll ok"],
    ["sentinel", "heartbeat ok"],
    ["scribe", "journal append"],
    ["conductor", "cycle tick"],
    ["portfolio", "books unchanged"],
  ];
  const pick = msgs[Math.floor(Math.random() * msgs.length)];
  pushEvent(pick[0], pick[1]);
  alerts.innerHTML = [
    "● integrity: OK",
    "● api_errors: 0",
    "● emergency_stop: absent",
    "● runtime.lock: absent",
    "● mode: DEMO (LIVE off)",
  ].map((l) => `<div>${l}</div>`).join("");
}

renderAgents();
renderTimeline();
tick();
mockPulse();
setInterval(tick, 1000);
setInterval(mockPulse, 4000);
