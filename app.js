/**
 * Lokhi — app logic. Reads window.APP_DATA as the source of truth,
 * layers in locally-persisted progress, and renders all five tabs.
 * No framework, no build step.
 */
(function () {
  "use strict";

  const DATA = window.APP_DATA;
  const STORAGE_KEY = "lokhi_state";
  const JOURNEY_KEY = "lokhi_guided_journey";
  const ONBOARD_KEY = "lokhi_onboarded";
  const PROFILE_KEY = "lokhi_profile_overrides";
  const SHARE_KEY = "lokhi_pending_share";

  // ---------------------------------------------------------------------
  // Boot guard: no profile yet → send to onboarding.
  // ---------------------------------------------------------------------
  if (!localStorage.getItem(ONBOARD_KEY) && !location.pathname.endsWith("onboarding.html")) {
    location.replace("./onboarding.html");
    return;
  }

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  function loadState() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const profileOverrides = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    const profile = Object.assign({}, DATA.userProfile, profileOverrides, saved.profile || {});

    return {
      profile: profile,
      missions: Object.assign({}, autoMap(DATA.weeklyMissions, "completed"), saved.missions || {}),
      quests: Object.assign({}, autoMap(DATA.quests, "currentAmount", "status"), saved.quests || {}),
      badges: Object.assign({}, autoMap(DATA.badges, "earned"), saved.badges || {}),
      laterPrompts: Object.assign({}, autoMap(DATA.laterPrompts, "status"), saved.laterPrompts || {}),
      investmentQuests: Object.assign({}, autoMap(DATA.investmentQuests, "completed"), saved.investmentQuests || {}),
      activeTab: "home",
      activeProfileTab: "info"
    };
  }

  function autoMap(list, ...fields) {
    const out = {};
    list.forEach((item) => {
      out[item.id] = {};
      fields.forEach((f) => (out[item.id][f] = item[f]));
    });
    return out;
  }

  function persist() {
    const toSave = {
      profile: diffProfile(state.profile),
      missions: state.missions,
      quests: state.quests,
      badges: state.badges,
      laterPrompts: state.laterPrompts,
      investmentQuests: state.investmentQuests
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }

  function diffProfile(p) {
    // Only persist the mutable gamification fields; facts live in PROFILE_KEY.
    const keys = ["level", "xp", "xpForNextLevel", "streakWeeks", "financialHealth", "powers", "financialPower", "archetype"];
    const out = {};
    keys.forEach((k) => (out[k] = p[k]));
    return out;
  }

  const state = loadState();

  // ---------------------------------------------------------------------
  // Formatting helpers
  // ---------------------------------------------------------------------
  function yen(n) {
    const sign = n < 0 ? "-" : "";
    return sign + "¥" + Math.round(Math.abs(n)).toLocaleString("en-US");
  }
  function pct(n) {
    return Math.round(n * 100) + "%";
  }
  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  // ---------------------------------------------------------------------
  // Icons — comic (Fluent Emoji Flat, colorful, for gamified content) and
  // line (Feather, monochrome, inherits text color, for UI chrome)
  // ---------------------------------------------------------------------
  function comicIcon(key, opts) {
    opts = opts || {};
    const size = opts.size ? `width:${opts.size}px;height:${opts.size}px;` : "";
    return `<img class="icon-comic ${opts.cls || ""}" style="${size}" src="./lokhi-assets/icons/comic/${key}.svg" alt="">`;
  }
  function lineIcon(name, opts) {
    opts = opts || {};
    const size = opts.size ? `width:${opts.size}px;height:${opts.size}px;` : "";
    return `<span class="icon-line icon-line-${name} ${opts.cls || ""}" style="${size}"></span>`;
  }
  // Profile avatar — a DiceBear SVG keyed by archetype (lokhi-assets/avatars/),
  // reflecting whichever archetype the user was classified with during
  // onboarding. Fills its container edge-to-edge like a profile photo (see
  // .avatar-img in app-styles.css) rather than floating small like an emoji
  // icon — falls back to the flat comic icon if the id is unknown.
  function avatarImg(avatarId, opts) {
    opts = opts || {};
    const avatar = DATA.avatars.find((a) => a.id === avatarId);
    if (!avatar || !avatar.avatarImage) return comicIcon((avatar && avatar.icon) || "compass", opts);
    return `<img class="avatar-img ${opts.cls || ""}" src="${avatar.avatarImage}" alt="">`;
  }

  // ---------------------------------------------------------------------
  // Web Share Target: content received via share-target.html
  // ---------------------------------------------------------------------
  function getPendingShare() {
    try {
      return JSON.parse(localStorage.getItem(SHARE_KEY) || "null");
    } catch (e) {
      return null;
    }
  }
  function clearPendingShare() {
    localStorage.removeItem(SHARE_KEY);
  }

  // ---------------------------------------------------------------------
  // Derived numbers
  // ---------------------------------------------------------------------
  function computeDerived(p) {
    const surplus = p.income - p.monthlyExpenses;
    const debtPayments = (p.debtDetails || []).reduce((s, d) => s + d.monthlyPayment, 0);
    const netWorth = p.savings + p.investments - p.debt;
    const investableCapacity = Math.max(0, surplus - debtPayments);
    return { surplus, netWorth, investableCapacity, debtPayments };
  }

  // ---------------------------------------------------------------------
  // XP / leveling
  // ---------------------------------------------------------------------
  function awardXp(amount, opts) {
    opts = opts || {};
    const p = state.profile;
    p.xp += amount;
    showXpToast(amount);
    let leveledUp = false;
    while (p.xp >= p.xpForNextLevel) {
      p.xp -= p.xpForNextLevel;
      p.level += 1;
      p.xpForNextLevel = Math.round(p.xpForNextLevel * 1.15 / 10) * 10;
      leveledUp = true;
    }
    persist();
    renderHome();
    renderProfile();
    if (leveledUp && !opts.silentLevelUp) openLevelUp(p.level);
  }

  let xpToastTimer = null;
  function showXpToast(amount) {
    const toast = document.getElementById("xp-toast");
    toast.textContent = "+" + amount + " XP";
    toast.classList.add("is-visible");
    clearTimeout(xpToastTimer);
    xpToastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }

  function openLevelUp(level) {
    document.getElementById("levelup-value").textContent = "Level " + level;
    openOverlay("levelup-overlay");
  }

  // ---------------------------------------------------------------------
  // Tab navigation
  // ---------------------------------------------------------------------
  function showTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("is-active", s.dataset.screen === tab));
    document.querySelectorAll(".tab-bar-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tab));
    renderFairyNudge(tab);
    window.scrollTo(0, 0);
  }

  document.querySelectorAll(".tab-bar-btn").forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });

  // ---------------------------------------------------------------------
  // Overlays / sheets
  // ---------------------------------------------------------------------
  function openOverlay(id) {
    document.getElementById(id).classList.add("is-open");
  }
  function closeOverlay(id) {
    document.getElementById(id).classList.remove("is-open");
  }
  document.querySelectorAll("[data-close-overlay]").forEach((btn) => {
    btn.addEventListener("click", () => closeOverlay(btn.dataset.closeOverlay));
  });
  document.querySelectorAll(".overlay-scrim").forEach((scrim) => {
    scrim.addEventListener("click", (e) => {
      if (e.target === scrim) scrim.classList.remove("is-open");
    });
  });

  // ---------------------------------------------------------------------
  // Fairy Godmother widget
  // ---------------------------------------------------------------------
  function renderFairyNudge(tab) {
    const pool = DATA.fairyNudges[tab] || DATA.fairyNudges.global;
    const msg = pool[Math.floor(Math.random() * pool.length)];
    document.getElementById("fairy-message").textContent = msg;
  }
  document.getElementById("fairy-fab").addEventListener("click", () => {
    const pop = document.getElementById("fairy-popover");
    pop.classList.toggle("is-open");
  });
  document.getElementById("fairy-dismiss").addEventListener("click", () => {
    document.getElementById("fairy-popover").classList.remove("is-open");
  });

  // ---------------------------------------------------------------------
  // HOME
  // ---------------------------------------------------------------------
  function owlState(p) {
    const path = p.netWorthPath;
    const current = path.points.find((pt) => pt.age === path.currentAge);
    if (!current || current.actual == null) return "ontrack";
    if (current.actual >= current.target * 1.05) return "crowned";
    if (current.actual >= current.target * 0.9) return "ontrack";
    return "dormant";
  }
  const OWL_META = {
    dormant: { src: "./lokhi-assets/owl-dormant.svg", label: "Behind pace — still early days.", halo: "var(--state-over)" },
    ontrack: { src: "./lokhi-assets/owl-ontrack.svg", label: "On track for your Golden Path.", halo: "var(--state-on-track)" },
    crowned: { src: "./lokhi-assets/owl-crowned.svg", label: "Ahead of your Golden Path.", halo: "var(--ink)" }
  };

  function renderGoldenPathSvg(points, currentAge) {
    const w = 320, h = 120, pad = 8;
    const ages = points.map((p) => p.age);
    const vals = points.flatMap((p) => [p.target, p.actual].filter((v) => v != null));
    const minAge = Math.min(...ages), maxAge = Math.max(...ages);
    const minVal = 0, maxVal = Math.max(...vals) * 1.05;
    const x = (age) => pad + ((age - minAge) / (maxAge - minAge)) * (w - pad * 2);
    const y = (val) => h - pad - (val / maxVal) * (h - pad * 2);

    const targetPts = points.map((p) => `${x(p.age)},${y(p.target)}`).join(" ");
    const actualPts = points.filter((p) => p.actual != null).map((p) => `${x(p.age)},${y(p.actual)}`).join(" ");
    const current = points.find((p) => p.age === currentAge);
    const dot = current ? `<circle cx="${x(current.age)}" cy="${y(current.actual != null ? current.actual : current.target)}" r="3.5" fill="var(--ink)" />` : "";

    return `<svg class="golden-path-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <polyline points="${targetPts}" fill="none" stroke="var(--ink-muted)" stroke-width="1" stroke-dasharray="4 4" vector-effect="non-scaling-stroke" />
      <polyline points="${actualPts}" fill="none" stroke="var(--ink)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
      ${dot}
    </svg>`;
  }

  // ---------------------------------------------------------------------
  // Money-flow Sankey (Home). Hand-drawn on purpose: seeded jitter keeps the
  // wobble stable between renders, SVG filters give ink and watercolour edges.
  // ---------------------------------------------------------------------
  function seededRandom(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Mock data is monthly, so a longer range scales the monthly figures by the
  // number of months it covers; the split stays the same shape.
  function periodMonths(period) {
    const now = new Date();
    const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
    if (period.kind === "ytd") return now.getMonth() + now.getDate() / daysIn(now.getFullYear(), now.getMonth());
    if (period.kind === "lastyear") return 12;
    if (period.kind === "custom") {
      const days = (new Date(period.to) - new Date(period.from)) / 864e5 + 1;
      return Math.max(1, days) / (365.25 / 12);
    }
    return 1;
  }

  function periodPhrase(period) {
    const year = new Date().getFullYear();
    if (period.kind === "ytd") return `in ${year} so far`;
    if (period.kind === "lastyear") return `in ${year - 1}`;
    if (period.kind === "custom") return `from ${period.from} to ${period.to}`;
    return "this month";
  }

  function moneyFlows(p, months) {
    const declared = p.incomeSources || [];
    const declaredTotal = declared.reduce((s, x) => s + x.amount, 0);
    // An onboarded income that no longer matches the mock sources is shown as one source.
    const monthly = declaredTotal === p.income && declared.length
      ? declared
      : [{ id: "income", label: "Income", amount: p.income }];
    const scale = (n) => Math.round(n * months);
    const sources = monthly.map((x) => ({ id: x.id, label: x.label, amount: scale(x.amount) }));
    const income = sources.reduce((s, x) => s + x.amount, 0);
    const spent = scale(p.monthlyExpenses);
    const expenses = Math.min(spent, income);
    const grow = Math.max(0, Math.min(scale(p.monthlyGrow || 0), income - expenses));
    const idle = income - expenses - grow;
    const outflows = [
      { id: "expenses", label: "Expenses", amount: expenses, wash: "var(--bloom-rose)", strength: 0.5 },
      { id: "grow", label: "Grow", amount: grow, wash: "var(--sprout)", strength: 0.9 },
      { id: "idle", label: "Idle", amount: idle, wash: null }
    ].filter((f) => f.amount > 0);
    return { sources, outflows, income, shortfall: Math.max(0, spent - income) };
  }

  function setupSankeyPeriod() {
    const select = document.getElementById("sankey-period");
    const range = document.getElementById("sankey-range");
    const from = document.getElementById("sankey-from");
    const to = document.getElementById("sankey-to");
    const now = new Date();
    const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
    const year = now.getFullYear();

    select.innerHTML = [
      ["month", now.toLocaleString("en-US", { month: "short" })], ["ytd", String(year)], ["lastyear", String(year - 1)], ["custom", "Custom"]
    ].map(([v, t]) => `<option value="${v}">${t}</option>`).join("");
    from.value = iso(new Date(year, now.getMonth() - 2, 1));
    to.value = iso(now);
    from.max = to.max = iso(now);

    const apply = () => {
      if (from.value > to.value) to.value = from.value;
      state.sankeyPeriod = { kind: select.value, from: from.value, to: to.value };
      range.hidden = select.value !== "custom";
      renderSankey(state.profile);
    };
    select.addEventListener("change", apply);
    from.addEventListener("change", apply);
    to.addEventListener("change", apply);
  }

  function stack(items, k, minCentreGap, minGap) {
    let y = 0, prevH = null;
    items.forEach((it) => {
      it.h = Math.max(3, it.amount * k);
      if (prevH !== null) y += Math.max(minGap, minCentreGap - (prevH + it.h) / 2);
      it.y0 = y; it.y1 = y + it.h;
      y = it.y1; prevH = it.h;
    });
    return y;
  }

  // Left stack: an outside label must clear a neighbouring band that runs
  // through the label column.
  function stackSources(items, k) {
    let y = 0, prev = null;
    items.forEach((it) => {
      it.h = Math.max(3, it.amount * k);
      if (prev) {
        let gap = Math.max(4, 32 - (prev.h + it.h) / 2);
        if (prev.inside !== it.inside) gap = Math.max(gap, 22 - (it.inside ? prev.h : it.h) / 2);
        y += gap;
      }
      it.y0 = y; it.y1 = y + it.h;
      y = it.y1; prev = it;
    });
    return y;
  }

  function shortYen(n) {
    if (n >= 1e6) return "¥" + (Math.round(n / 1e5) / 10) + "M";
    if (n >= 1000) return "¥" + Math.round(n / 1000) + "k";
    return yen(n);
  }

  function renderSankey(p) {
    const wrap = document.getElementById("sankey-wrap");
    const caption = document.getElementById("sankey-caption");
    if (!wrap) return;
    const period = state.sankeyPeriod || { kind: "month" };
    const phrase = periodPhrase(period);
    const { sources, outflows, income, shortfall } = moneyFlows(p, periodMonths(period));
    const rand = seededRandom(income);
    const j = (n) => (rand() - 0.5) * 2 * n;

    const W = 300, XP = 142, X1 = 212, TIP = 7, PAD = 14;
    const k = 140 / income;
    // Bands thick enough to hold their own label run out to the card edge and
    // carry it inside, as in the sketch; thin ones are labelled in a column
    // sized to the widest of those labels.
    sources.forEach((s) => { s.inside = Math.max(3, s.amount * k) >= 34; });
    const outside = sources.filter((s) => !s.inside);
    const X0 = outside.length
      ? Math.ceil(Math.max(...outside.map((s) => Math.max(s.label.length * 5.95, shortYen(s.amount).length * 7.6)))) + 8
      : 0;
    const leftH = stackSources(sources, k);
    const rightH = stack(outflows, k, 54, 16);
    const pinchH = income * k;
    const H = Math.max(leftH, rightH, pinchH) + PAD * 2;
    const offL = (H - leftH) / 2, offR = (H - rightH) / 2, offP = (H - pinchH) / 2;

    let cursor = offP;
    const slot = (amount) => { const s = [cursor, cursor + amount * k]; cursor += amount * k; return s; };
    const curve = (xa, ya, xb, yb) => {
      const cx = (xa + xb) / 2 + j(3);
      return `C ${cx} ${ya + j(1.5)}, ${cx} ${yb + j(1.5)}, ${xb} ${yb}`;
    };

    const flows = [];
    sources.forEach((s) => {
      const [p0, p1] = slot(s.amount);
      const a0 = offL + s.y0, a1 = offL + s.y1, xs = s.inside ? 0 : X0;
      flows.push({
        side: "in", item: s, wash: "var(--bloom-amber)", strength: 0.95,
        fill: `M ${xs} ${a0} ${curve(xs, a0, XP, p0)} L ${XP} ${p1} ${curve(XP, p1, xs, a1)} Z`,
        ink: `M ${xs + j(2)} ${a0} ${curve(xs, a0, XP, p0)} M ${XP} ${p1} ${curve(XP, p1, xs + j(2), a1)}`,
        label: s.inside
          ? { x: 8, y: offL + (s.y0 + s.y1) / 2, anchor: "start" }
          : { x: X0 - 6, y: offL + (s.y0 + s.y1) / 2, anchor: "end" }
      });
    });
    cursor = offP;
    outflows.forEach((o) => {
      const [p0, p1] = slot(o.amount);
      const b0 = offR + o.y0, b1 = offR + o.y1, mid = (b0 + b1) / 2;
      const tip = `L ${X1 + TIP} ${mid + j(1)} L ${X1} ${b1}`;
      flows.push({
        side: "out", item: o, wash: o.wash, strength: o.strength,
        fill: `M ${XP} ${p0} ${curve(XP, p0, X1, b0)} ${tip} ${curve(X1, b1, XP, p1)} Z`,
        ink: `M ${XP} ${p0} ${curve(XP, p0, X1, b0)} ${tip} ${curve(X1, b1, XP, p1)}`,
        label: { x: X1 + TIP + 7, y: mid, anchor: "start" }
      });
    });

    const share = (n) => pct(n / income);
    const labelSvg = (f) => {
      const { x, y, anchor } = f.label;
      const lines = f.side === "in"
        ? [["sk-name", f.item.label, -7], ["sk-amount", shortYen(f.item.amount), 10]]
        : [["sk-name", f.item.label, -13], ["sk-amount", shortYen(f.item.amount), 5], ["sk-share", share(f.item.amount) + " of income", 19]];
      return lines.map(([cls, t, dy]) => `<text class="${cls}" x="${x}" y="${y + dy}" text-anchor="${anchor}">${escapeHtml(t)}</text>`).join("");
    };

    const flowSvg = flows.map((f) => `
      <g class="sk-flow">
        ${f.wash ? `<path class="sk-wash" d="${f.fill}" style="fill:${f.wash};fill-opacity:${f.strength}" filter="url(#sk-wash)"/>` : ""}
        <path class="sk-ink" d="${f.ink}" filter="url(#sk-ink)"/>
        ${labelSvg(f)}
      </g>`).join("");

    const pinch = `M ${XP + j(0.6)} ${offP - 7} L ${XP + j(0.6)} ${offP + pinchH + 7} M ${XP + 1.2} ${offP - 4} L ${XP + 0.8} ${offP + pinchH + 5}`;

    wrap.innerHTML = `
      <svg class="sankey" viewBox="0 0 ${W} ${H}" role="img" aria-label="Where your income goes ${phrase}">
        <defs>
          <filter id="sk-ink" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
          <filter id="sk-wash" x="-6%" y="-12%" width="112%" height="124%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="7" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G" result="d"/>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="11" result="grain"/>
            <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.3 0.72" result="mask"/>
            <feComposite in="d" in2="mask" operator="in"/>
          </filter>
        </defs>
        ${flowSvg}
        <path class="sk-ink sk-pinch" d="${pinch}" filter="url(#sk-ink)"/>
      </svg>
      <div class="visually-hidden"><table>
        <caption>Where your income goes ${phrase}</caption>
        <tr><th>Flow</th><th>Amount</th><th>Share of income</th></tr>
        ${flows.map((f) => `<tr><td>${f.side === "in" ? "Income: " : ""}${escapeHtml(f.item.label)}</td><td>${yen(f.item.amount)}</td><td>${share(f.item.amount)}</td></tr>`).join("")}
      </table></div>`;

    caption.hidden = shortfall === 0;
    caption.textContent = shortfall > 0 ? `Spending is ${yen(shortfall)} over income ${phrase}.` : "";
  }

  // ---------------------------------------------------------------------
  // Expenses card (Home): last three complete months as hand-drawn stacked
  // columns, plus the trend fitted over twelve — the personal inflation rate.
  // ---------------------------------------------------------------------
  const EXPENSE_GROUPS = [
    { key: "taxes", label: "Taxes & insurance", fill: "url(#ex-hatch)" },
    { key: "housing", label: "Rent & loans", fill: "var(--bloom-rose)", strength: 0.5 },
    { key: "card", label: "Card spending", fill: "var(--bloom-amber)", strength: 0.95 },
    { key: "other", label: "Utilities & other", fill: null }
  ];

  function monthName(iso, style) {
    const [y, m] = iso.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleString("en-US", { month: style || "short" });
  }

  function niceStep(raw) {
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    return [1, 2, 2.5, 5, 10].map((f) => f * mag).find((v) => v >= raw);
  }

  function renderExpenses(p) {
    const card = document.querySelector(".expense-card");
    const hist = p.expenseHistory || [];
    if (!card) return;
    card.hidden = hist.length < 3;
    if (card.hidden) return;

    const total = (m) => EXPENSE_GROUPS.reduce((s, g) => s + (m[g.key] || 0), 0);
    const totals = hist.map(total);
    const n = totals.length;
    const meanX = (n - 1) / 2, meanY = totals.reduce((a, b) => a + b, 0) / n;
    const slope = totals.reduce((s, y, i) => s + (i - meanX) * (y - meanY), 0) /
      totals.reduce((s, _, i) => s + (i - meanX) ** 2, 0);
    const fit = (i) => meanY + slope * (i - meanX);
    const yearlyRate = (slope * 12) / meanY;

    const recent = hist.slice(-3);
    const latest = recent[recent.length - 1];
    document.getElementById("expense-period").textContent =
      `${monthName(recent[0].month)} – ${monthName(latest.month)}`;
    document.getElementById("expense-stats").innerHTML = `
      <div class="chart-stat">
        <span class="chart-stat-value">${shortYen(total(latest))}</span>
        <span class="chart-stat-label">Spent in ${monthName(latest.month, "long")}</span>
      </div>
      <div class="chart-stat chart-stat-end">
        <span class="chart-stat-value">${yearlyRate >= 0 ? "+" : "−"}${Math.abs(yearlyRate * 100).toFixed(1)}%</span>
        <span class="chart-stat-label">Your inflation · 12 mo</span>
      </div>`;

    const rand = seededRandom(totals[n - 1]);
    const j = (v) => (rand() - 0.5) * 2 * v;
    const W = 300, H = 206, PL = 34, PR = 300, PT = 24, PB = 184, BAR = 46;
    const recentMax = Math.max(...recent.map(total), fit(n - 1), fit(n - 3));
    const step = niceStep(recentMax / 3);
    const yMax = Math.ceil((recentMax * 1.12) / step) * step;
    const y = (v) => PB - (v / yMax) * (PB - PT);
    const slotW = (PR - PL) / recent.length;
    const cx = (i) => PL + slotW * (i + 0.5);
    const box = (x0, y0, x1, y1) =>
      `M ${x0 + j(0.8)} ${y0 + j(0.8)} L ${x1 + j(0.8)} ${y0 + j(0.8)} L ${x1 + j(0.8)} ${y1} L ${x0 + j(0.8)} ${y1} Z`;

    const ticks = [];
    for (let v = 0; v <= yMax; v += step) ticks.push(v);
    const grid = ticks.map((v) => `
      <line class="ex-grid${v === 0 ? " is-base" : ""}" x1="${PL}" x2="${PR}" y1="${y(v)}" y2="${y(v)}"/>
      <text class="ex-tick" x="${PL - 6}" y="${y(v) + 3}" text-anchor="end">${v === 0 ? "0" : shortYen(v).slice(1)}</text>`).join("");

    const columns = recent.map((m, i) => {
      const x0 = cx(i) - BAR / 2, x1 = cx(i) + BAR / 2;
      let base = 0;
      const segs = EXPENSE_GROUPS.map((g, gi) => {
        const v = m[g.key] || 0;
        const yb = y(base), yt = y(base + v);
        base += v;
        const top = yt + 1, bottom = gi === 0 ? yb : yb - 1;
        const fill = g.fill
          ? `<path d="${box(x0, top, x1, bottom)}" style="fill:${g.fill};fill-opacity:${g.strength || 1}"${g.key === "taxes" ? "" : ' filter="url(#ex-wash)"'}/>`
          : "";
        const label = bottom - top >= 15
          ? `<text class="ex-seg" x="${cx(i)}" y="${(top + bottom) / 2 + 3}" text-anchor="middle">${shortYen(v)}</text>`
          : "";
        return fill + label;
      }).join("");
      const capY = y(total(m));
      return `
        ${segs}
        <path class="sk-ink" d="M ${x0} ${y(0)} L ${x0 + j(1)} ${capY + j(1)} L ${x1 + j(1)} ${capY + j(1)} L ${x1} ${y(0)}" filter="url(#ex-ink)"/>
        <text class="ex-cap" x="${cx(i)}" y="${capY - 9}" text-anchor="middle">${shortYen(total(m))}</text>
        <text class="ex-month" x="${cx(i)}" y="${H - 4}" text-anchor="middle">${monthName(m.month)}</text>`;
    }).join("");

    // The fitted line, carried a little past the first and last columns.
    const idx = (x) => n - 3 + (x - cx(0)) / slotW;
    const tx0 = PL + 6, tx1 = PR - 6;
    const trend = `<path class="ex-trend" d="M ${tx0} ${y(fit(idx(tx0)))} L ${tx1} ${y(fit(idx(tx1)))}"/>`;

    document.getElementById("expense-chart").innerHTML = `
      <svg class="expense-svg" viewBox="0 0 ${W} ${H}" role="img"
        aria-label="Expenses for the last three months, rising about ${Math.abs(yearlyRate * 100).toFixed(1)}% a year">
        <defs>
          <pattern id="ex-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" style="stroke:var(--ink);stroke-width:0.9;opacity:0.6"/>
          </pattern>
          <filter id="ex-ink" x="-10%" y="-5%" width="120%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="5" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
          <filter id="ex-wash" x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="9" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G" result="d"/>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="13" result="grain"/>
            <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.3 0.72" result="mask"/>
            <feComposite in="d" in2="mask" operator="in"/>
          </filter>
        </defs>
        ${grid}
        ${columns}
        ${trend}
      </svg>
      <div class="visually-hidden"><table>
        <caption>Expenses by month</caption>
        <tr><th>Month</th>${EXPENSE_GROUPS.map((g) => `<th>${g.label}</th>`).join("")}<th>Total</th></tr>
        ${recent.map((m) => `<tr><td>${monthName(m.month, "long")}</td>${EXPENSE_GROUPS.map((g) => `<td>${yen(m[g.key] || 0)}</td>`).join("")}<td>${yen(total(m))}</td></tr>`).join("")}
      </table></div>`;

    document.getElementById("expense-legend").innerHTML = EXPENSE_GROUPS.map((g) => `
      <span class="chart-legend-item">
        <svg class="chart-swatch" viewBox="0 0 14 10" aria-hidden="true">
          <rect x="0.5" y="0.5" width="13" height="9" rx="2" style="fill:${g.fill || "var(--paper)"};fill-opacity:${g.strength || 1};stroke:var(--ink);stroke-width:1"/>
        </svg>${g.label}
      </span>`).join("") + `
      <span class="chart-legend-item">
        <svg class="chart-swatch" viewBox="0 0 14 10" aria-hidden="true"><path class="ex-trend" d="M 1 5 L 13 5"/></svg>12-month trend
      </span>`;
  }

  // Shown only when something has been shared into Lokhi from another app.
  function renderShareNotice() {
    const wrap = document.getElementById("share-notice");
    const shared = getPendingShare();
    if (!shared) { wrap.innerHTML = ""; return; }
    const label = shared.title || shared.text || shared.url || (shared.fileCount ? shared.fileCount + " file(s)" : "content");
    wrap.innerHTML = `
      <div class="insight-banner"><span class="icon">${comicIcon("paperclip")}</span>
        <p>Received from Share Sheet: “${escapeHtml(label)}”</p>
        <button class="close-btn" data-dismiss-share>${lineIcon("x")}</button>
      </div>`;
    wrap.querySelector("[data-dismiss-share]").addEventListener("click", () => {
      clearPendingShare();
      renderShareNotice();
    });
  }

  function renderHome() {
    const p = state.profile;
    document.getElementById("greeting-name").textContent = p.preferredName || p.name;
    document.getElementById("header-level").textContent = "Lv " + p.level;
    document.getElementById("header-streak").textContent = p.streakWeeks + "w";

    renderShareNotice();
    renderSankey(p);
    renderExpenses(p);
  }


  function toggleMission(id) {
    const m = state.missions[id];
    const def = DATA.weeklyMissions.find((x) => x.id === id);
    if (m.completed) return; // no un-completing, avoids XP farming
    m.completed = true;
    persist();
    renderHome();
    awardXp(def.xpReward);
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  // ---------------------------------------------------------------------
  // DREAM LAB — owned entirely by dreamlab.js (screen-dreamlab is just a
  // mount point). See dreamlab.js, dream-engine.js, dream-calculations.js.
  // ---------------------------------------------------------------------

  // ---- Simulator modal ---------------------------------------------------
  let simState = null;
  function futureValue(principal, monthly, annualReturn, months) {
    const r = annualReturn / 12;
    if (r === 0) return principal + monthly * months;
    return principal * Math.pow(1 + r, months) + monthly * ((Math.pow(1 + r, months) - 1) / r);
  }

  function openQuestSimulator(questId) {
    const q = DATA.quests.find((x) => x.id === questId);
    const qs = state.quests[questId];
    simState = {
      questId,
      monthly: q.monthlyContribution,
      months: q.timeHorizonMonths,
      returnRate: q.expectedReturn || 0
    };
    document.getElementById("sim-title").textContent = q.title;
    document.getElementById("sim-description").textContent = q.description;
    document.getElementById("sim-is-investing").style.display = q.category === "investing" ? "" : "none";
    renderSimulator(q, qs);
    openOverlay("simulator-overlay");
  }

  function renderSimulator(q, qs) {
    const wrap = document.getElementById("simulator-body");
    const showReturn = q.category === "investing";
    wrap.innerHTML = `
      <div class="slider-field">
        <div class="slider-field-head"><span>Monthly amount</span><span class="value" id="sim-monthly-val">${yen(simState.monthly)}</span></div>
        <input type="range" id="sim-monthly" min="0" max="${Math.max(q.monthlyContribution * 4, 50000)}" step="5000" value="${simState.monthly}">
      </div>
      <div class="slider-field">
        <div class="slider-field-head"><span>Time horizon</span><span class="value" id="sim-months-val">${Math.round(simState.months / 12 * 10) / 10} yrs</span></div>
        <input type="range" id="sim-months" min="6" max="${Math.max(q.timeHorizonMonths * 2, 60)}" step="1" value="${simState.months}">
      </div>
      ${showReturn ? `
      <div class="slider-field">
        <div class="slider-field-head"><span>Expected return</span><span class="value" id="sim-return-val">${(simState.returnRate * 100).toFixed(1)}%</span></div>
        <input type="range" id="sim-return" min="0" max="9" step="0.5" value="${simState.returnRate * 100}">
      </div>` : ""}
      <div class="compare-grid">
        <div class="compare-tile">
          <div class="label">Current pace</div>
          <div class="value" id="sim-current-val"></div>
        </div>
        <div class="compare-tile is-optimized">
          <div class="label">This scenario</div>
          <div class="value" id="sim-optimized-val"></div>
        </div>
      </div>
      ${showReturn ? `<div class="insight-banner"><span class="icon">${comicIcon("ninja")}</span><p id="sim-tax-note"></p></div>` : ""}
      <div>
        <div class="card-eyebrow" style="margin-bottom:8px;">What if</div>
        <div class="quick-question-row">
          <button class="quick-question-btn" data-bump="monthly:10000">+¥10,000/mo</button>
          <button class="quick-question-btn" data-bump="months:12">+1 year</button>
          ${showReturn ? `<button class="quick-question-btn" data-bump="return:0.01">+1% return</button>` : ""}
        </div>
      </div>
      <p style="font-size:12px;color:var(--ink-muted);">This is a scenario based on your inputs, not a guaranteed outcome.</p>
      <button class="btn btn-primary btn-block" id="sim-save-btn">Save this plan · +${q.xpReward} XP</button>
    `;

    function recompute() {
      const current = futureValue(qs.currentAmount, q.monthlyContribution, q.expectedReturn || 0, q.timeHorizonMonths);
      const optimized = futureValue(qs.currentAmount, simState.monthly, simState.returnRate, simState.months);
      document.getElementById("sim-current-val").textContent = yen(current);
      document.getElementById("sim-optimized-val").textContent = yen(optimized);
      if (showReturn) {
        const contributions = qs.currentAmount + simState.monthly * simState.months;
        const gains = Math.max(0, optimized - contributions);
        document.getElementById("sim-tax-note").textContent = `Inside a NISA-style account, roughly ${yen(gains)} of gains here could be shielded from the standard ~20% capital gains tax — about ${yen(gains * 0.2)} saved.`;
      }
    }

    document.getElementById("sim-monthly").addEventListener("input", (e) => {
      simState.monthly = Number(e.target.value);
      document.getElementById("sim-monthly-val").textContent = yen(simState.monthly);
      recompute();
    });
    document.getElementById("sim-months").addEventListener("input", (e) => {
      simState.months = Number(e.target.value);
      document.getElementById("sim-months-val").textContent = Math.round(simState.months / 12 * 10) / 10 + " yrs";
      recompute();
    });
    const returnInput = document.getElementById("sim-return");
    if (returnInput) {
      returnInput.addEventListener("input", (e) => {
        simState.returnRate = Number(e.target.value) / 100;
        document.getElementById("sim-return-val").textContent = Number(e.target.value).toFixed(1) + "%";
        recompute();
      });
    }
    wrap.querySelectorAll("[data-bump]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [field, amt] = btn.dataset.bump.split(":");
        if (field === "monthly") { simState.monthly += Number(amt); document.getElementById("sim-monthly").value = simState.monthly; document.getElementById("sim-monthly-val").textContent = yen(simState.monthly); }
        if (field === "months") { simState.months += Number(amt); document.getElementById("sim-months").value = simState.months; document.getElementById("sim-months-val").textContent = Math.round(simState.months / 12 * 10) / 10 + " yrs"; }
        if (field === "return" && returnInput) { simState.returnRate += Number(amt); returnInput.value = simState.returnRate * 100; document.getElementById("sim-return-val").textContent = (simState.returnRate * 100).toFixed(1) + "%"; }
        recompute();
      });
    });
    document.getElementById("sim-save-btn").addEventListener("click", () => {
      closeOverlay("simulator-overlay");
      awardXp(q.xpReward);
    });

    recompute();
  }

  // ---------------------------------------------------------------------
  // OPTIMIZE
  // ---------------------------------------------------------------------
  function renderOptimize() {
    const root = document.getElementById("screen-optimize");
    const total = DATA.opportunities.reduce((s, o) => s + o.lifetimeValue, 0);
    root.querySelector("#hero-intel-number").textContent = yen(total);
    root.querySelector("#hero-intel-basis").textContent = `Based on ${DATA.opportunities.length} opportunities found across your NISA usage, cash allocation, debt, and tax filings.`;

    root.querySelector("#opportunity-list").innerHTML = DATA.opportunities.map((o) => `
      <div class="card opportunity-card">
        <div class="opportunity-head">
          <span class="icon">${comicIcon(o.icon)}</span>
          <span class="title">${o.title}</span>
        </div>
        <div class="opportunity-badges">
          <span class="chip chip-${o.effort.toLowerCase()}">Effort: ${o.effort}</span>
          <span class="chip chip-${o.confidence.toLowerCase().replace(" ", "-")}-confidence">Confidence: ${o.confidence}</span>
        </div>
        <div class="opportunity-lifetime">Lifetime value: <strong>${yen(o.lifetimeValue)}</strong></div>
        <div class="opportunity-detail">
          <div class="row"><span class="label">Why</span><span class="text">${o.why}</span></div>
          <div class="row"><span class="label">Benefit</span><span class="text">${o.benefit}</span></div>
          <div class="row"><span class="label">Action</span><span class="text">${o.action}</span></div>
          <div class="row downside"><span class="label">Downside</span><span class="text">${o.downside}</span></div>
        </div>
      </div>`).join("");
  }

  // ---------------------------------------------------------------------
  // GROW
  // ---------------------------------------------------------------------
  const PLANT_EMOJI = { seed: "seedling", sprout: "herb", bloom: "cherry-blossom", tree: "deciduous-tree" };
  function renderGrow() {
    const root = document.getElementById("screen-grow");
    root.querySelector("#garden-plot").innerHTML = DATA.investmentCategories.map((c) => `
      <div class="plant-tile">
        <span class="plant-emoji">${comicIcon(PLANT_EMOJI[c.plantStage], { size: 18 + c.allocationPct * 40 })}</span>
        <span class="plant-name">${c.name}</span>
        <span class="plant-pct">${pct(c.allocationPct)} · ${yen(c.currentValue)}</span>
      </div>`).join("");

    root.querySelector("#investment-explorer").innerHTML = DATA.investmentExplorer.map((i) => `
      <div class="explorer-item">
        <span class="icon">${comicIcon(i.icon)}</span>
        <span class="body"><span class="name">${i.name}</span><span class="desc">${i.description}</span></span>
        <span class="meta">${i.risk}<br>${i.horizon}</span>
      </div>`).join("");

    root.querySelector("#theme-grid").innerHTML = DATA.marketThemes.map((t) => `
      <button class="theme-card" data-theme="${t.id}">
        <span class="icon">${comicIcon(t.icon)}</span>
        <span class="body"><span class="title">${t.title}</span><span class="summary">${t.summary}</span></span>
        <span class="exposure">${pct(t.userExposurePct)}<br><span style="font-size:10px;letter-spacing:0.1em;color:var(--ink-muted);">exposure</span></span>
      </button>`).join("");
    root.querySelectorAll("[data-theme]").forEach((b) => b.addEventListener("click", () => openThemeDetail(b.dataset.theme)));

    root.querySelector("#investment-quests").innerHTML = DATA.investmentQuests.map((q) => {
      const done = state.investmentQuests[q.id].completed;
      return `
      <button class="mission-item ${done ? "is-done" : ""}" data-iquest="${q.id}">
        <span class="mission-check">${done ? lineIcon("check") : ""}</span>
        <span class="mission-title">${comicIcon(q.icon)} ${q.title} · ${q.estMinutes} min</span>
        <span class="mission-xp">+${q.xpReward} XP</span>
      </button>`;
    }).join("");
    root.querySelectorAll("[data-iquest]").forEach((b) => b.addEventListener("click", () => {
      const rec = state.investmentQuests[b.dataset.iquest];
      if (rec.completed) return;
      rec.completed = true;
      persist();
      renderGrow();
      awardXp(DATA.investmentQuests.find((q) => q.id === b.dataset.iquest).xpReward);
    }));
  }

  function openThemeDetail(themeId) {
    const t = DATA.marketThemes.find((x) => x.id === themeId);
    document.getElementById("theme-detail-body").innerHTML = `
      <div class="sheet-modal-handle"></div>
      <div class="sheet-modal-head"><span class="title">${comicIcon(t.icon)} ${t.title}</span><button class="close-btn" data-close-overlay="theme-detail-overlay">${lineIcon("x")}</button></div>
      <p>${t.summary}</p>
      <div class="card-flat">
        <div class="card-eyebrow">Why it matters</div>
        <p style="margin-top:6px;">${t.whyItMatters}</p>
      </div>
      <div class="compare-grid">
        <div class="compare-tile"><div class="label">Your exposure</div><div class="value">${pct(t.userExposurePct)}</div></div>
        <div class="compare-tile"><div class="label">Risk level</div><div class="value" style="font-size:22px;">${t.riskLevel}</div></div>
      </div>
      <p style="font-size:12px;color:var(--ink-muted);">Educational only — this is not a recommendation to buy or sell.</p>
    `;
    document.getElementById("theme-detail-body").querySelector("[data-close-overlay]").addEventListener("click", () => closeOverlay("theme-detail-overlay"));
    openOverlay("theme-detail-overlay");
  }

  // ---------------------------------------------------------------------
  // PROFILE
  // ---------------------------------------------------------------------
  function renderProfile() {
    const root = document.getElementById("screen-profile");
    const p = state.profile;
    root.querySelector("#profile-name").textContent = p.name;
    root.querySelector("#profile-archetype-label").textContent = capitalize(p.archetype);
    root.querySelector("#profile-avatar-icon").innerHTML = avatarImg(p.avatar);

    root.querySelectorAll(".profile-subtab-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.profileTab === state.activeProfileTab));
    root.querySelectorAll(".profile-section").forEach((s) => s.style.display = s.dataset.profileSection === state.activeProfileTab ? "" : "none");

    // My Info checklist
    const filled = { name: true, dob: true, prefecture: true, employment: true, bank_statement: true, credit_statement: true, household: true, debts: true };
    root.querySelector("#info-checklist").innerHTML = DATA.onboardingFields
      .filter((f) => !(f.id === "cash_savings" && filled.bank_statement))
      .map((f) => {
      const complete = !!filled[f.id] || (f.id === "nisa_statement" && p.nisaUsage > 0);
      return `
      <div class="checklist-item ${complete ? "is-complete" : "is-incomplete"}">
        <span class="status-dot">${complete ? lineIcon("check") : ""}</span>
        <span class="body">
          <span class="field-label">${f.label}</span>
          ${f.helpText ? `<span class="field-help">${f.helpText}</span>` : ""}
        </span>
        ${!complete ? `<button class="btn btn-secondary btn-sm">${f.type === "upload" ? "Upload" : "Add"}</button>` : ""}
      </div>`;
    }).join("");

    root.querySelector("#later-prompts").innerHTML = DATA.laterPrompts.map((lp) => {
      const status = state.laterPrompts[lp.id].status;
      if (status !== "pending") return "";
      return `
      <div class="card later-prompt-card">
        <span class="icon">${comicIcon(lp.icon)}</span>
        <span class="question">${lp.question}</span>
        <button class="btn btn-secondary btn-sm" data-answer="${lp.id}">Add</button>
        <button class="btn btn-ghost btn-sm" data-skip="${lp.id}">Skip</button>
      </div>`;
    }).join("");
    root.querySelectorAll("[data-answer]").forEach((b) => b.addEventListener("click", () => resolvePrompt(b.dataset.answer, "answered")));
    root.querySelectorAll("[data-skip]").forEach((b) => b.addEventListener("click", () => resolvePrompt(b.dataset.skip, "skipped")));

    // archetype
    root.querySelector("#archetype-grid").innerHTML = DATA.archetypes.map((a) => `
      <button class="archetype-card ${p.archetype === a.id ? "is-selected" : ""}" data-archetype="${a.id}">
        <span class="icon">${comicIcon(a.icon)}</span>
        <span class="name">${a.label}</span>
      </button>`).join("");
    root.querySelectorAll("[data-archetype]").forEach((b) => b.addEventListener("click", () => {
      p.archetype = b.dataset.archetype;
      persist();
      renderProfile();
      renderHome();
    }));
    const current = DATA.archetypes.find((a) => a.id === p.archetype);
    root.querySelector("#archetype-description").textContent = current ? current.description : "";

    // badges
    root.querySelector("#badge-grid").innerHTML = DATA.badges.map((b) => {
      const earned = state.badges[b.id].earned;
      return `
      <div class="badge-tile ${earned ? "" : "is-locked"}">
        <div class="badge-circle">${comicIcon(b.icon)}</div>
        <span class="badge-name">${b.name}</span>
      </div>`;
    }).join("");
  }

  function resolvePrompt(id, status) {
    state.laterPrompts[id].status = status;
    persist();
    renderProfile();
    if (status === "answered") awardXp(15);
  }

  document.querySelectorAll(".profile-subtab-btn").forEach((b) => {
    b.addEventListener("click", () => { state.activeProfileTab = b.dataset.profileTab; renderProfile(); });
  });

  // ---------------------------------------------------------------------
  // Guided Financial Plan Journey
  // ---------------------------------------------------------------------
  function getJourneyState() {
    return JSON.parse(localStorage.getItem(JOURNEY_KEY) || '{"status":"not_started","currentStep":0}');
  }
  function setJourneyState(s) {
    localStorage.setItem(JOURNEY_KEY, JSON.stringify(s));
  }

  let journeyStepIndex = 0;
  function openGuidedJourney(startAt) {
    journeyStepIndex = startAt || 0;
    renderJourneyStep();
    openOverlay("journey-overlay");
  }

  function renderJourneyStep() {
    const steps = DATA.guidedPlanJourney.steps;
    const step = steps[journeyStepIndex];
    document.getElementById("journey-progress-fill").style.width = pct((journeyStepIndex + 1) / steps.length);
    document.getElementById("journey-phase").textContent = step.phase;
    document.getElementById("journey-title").textContent = step.title;
    document.getElementById("journey-text").textContent = step.body;

    const choiceWrap = document.getElementById("journey-choices");
    if (step.actionType === "input") {
      choiceWrap.style.display = "";
      const options = ["Pay off debt sooner", "Grow my investments", "Build a bigger safety net", "Retire earlier"];
      choiceWrap.innerHTML = options.map((o) => `<button class="journey-choice" data-choice="${o}">${o}</button>`).join("");
      choiceWrap.querySelectorAll("[data-choice]").forEach((b) => b.addEventListener("click", () => {
        choiceWrap.querySelectorAll(".journey-choice").forEach((c) => c.classList.remove("is-selected"));
        b.classList.add("is-selected");
      }));
    } else if (step.actionType === "simulate") {
      choiceWrap.style.display = "";
      choiceWrap.innerHTML = `<div class="insight-banner"><span class="icon">${comicIcon("video-game")}</span><p>Try this in the Dream Lab simulator anytime — for now, tap Continue to keep your plan moving.</p></div>`;
    } else {
      choiceWrap.style.display = "none";
      choiceWrap.innerHTML = "";
    }

    document.getElementById("journey-back-btn").style.visibility = journeyStepIndex === 0 ? "hidden" : "visible";
    document.getElementById("journey-next-btn").textContent = journeyStepIndex === steps.length - 1 ? "Finish plan" : "Continue";
  }

  document.getElementById("journey-next-btn").addEventListener("click", () => {
    const steps = DATA.guidedPlanJourney.steps;
    const step = steps[journeyStepIndex];
    if (step.xpReward) awardXp(step.xpReward, { silentLevelUp: true });
    if (journeyStepIndex === steps.length - 1) {
      finishGuidedJourney();
      return;
    }
    journeyStepIndex += 1;
    setJourneyState({ status: "in_progress", currentStep: journeyStepIndex });
    renderJourneyStep();
  });
  document.getElementById("journey-back-btn").addEventListener("click", () => {
    if (journeyStepIndex === 0) return;
    journeyStepIndex -= 1;
    renderJourneyStep();
  });
  document.getElementById("journey-save-later-btn").addEventListener("click", () => {
    setJourneyState({ status: "in_progress", currentStep: journeyStepIndex });
    closeOverlay("journey-overlay");
    renderHome();
  });

  function finishGuidedJourney() {
    setJourneyState({ status: "completed", currentStep: DATA.guidedPlanJourney.steps.length });
    DATA.quests.forEach((q) => {
      if (state.quests[q.id].status === "locked") state.quests[q.id].status = "active";
    });
    persist();
    closeOverlay("journey-overlay");
    renderHome();
  }

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  function init() {
    document.getElementById("levelup-value").textContent = "";
    setupSankeyPeriod();
    renderHome();
    renderOptimize();
    renderGrow();
    renderProfile();
    showTab("home");

    const journey = getJourneyState();
    if (journey.status === "not_started") {
      setJourneyState({ status: "in_progress", currentStep: 0 });
      openGuidedJourney(0);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
