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
      activeProfileTab: "info",
      activeDreamLabTab: "quests"
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
    dormant: { src: "./lokhi-assets/owl-dormant.svg", label: "Behind pace — still early days.", halo: "var(--coral)" },
    ontrack: { src: "./lokhi-assets/owl-ontrack.svg", label: "On track for your Golden Path.", halo: "var(--gold)" },
    crowned: { src: "./lokhi-assets/owl-crowned.svg", label: "Ahead of your Golden Path.", halo: "var(--moss)" }
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
    const dot = current ? `<circle cx="${x(current.age)}" cy="${y(current.actual != null ? current.actual : current.target)}" r="4" fill="var(--primary)" />` : "";

    return `<svg class="golden-path-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <polyline points="${targetPts}" fill="none" stroke="var(--ink-faint)" stroke-width="2" stroke-dasharray="5 5" />
      <polyline points="${actualPts}" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      ${dot}
    </svg>`;
  }

  function renderHome() {
    const p = state.profile;
    const derived = computeDerived(p);
    const root = document.getElementById("screen-home");

    document.getElementById("greeting-name").textContent = p.preferredName || p.name;
    document.getElementById("header-level").textContent = "Lv " + p.level;
    document.getElementById("header-streak").textContent = p.streakWeeks + "w";

    // character card
    const avatarIcon = (DATA.avatars.find((a) => a.id === p.avatar) || {}).icon || "compass";
    root.querySelector("#character-avatar").innerHTML = comicIcon(avatarIcon);
    root.querySelector("#character-level").textContent = "Level " + p.level;
    root.querySelector("#character-archetype").textContent = capitalize(p.archetype) + " · " + p.streakWeeks + "-week streak";
    root.querySelector("#xp-fill").style.width = pct(p.xp / p.xpForNextLevel);
    root.querySelector("#xp-label").textContent = p.xp + " / " + p.xpForNextLevel + " XP";
    root.querySelector("#health-value").textContent = p.financialHealth;

    const powerLabels = { savings: "Savings", investing: "Investing", optimization: "Optimization", goalReadiness: "Goal readiness", freedom: "Freedom" };
    root.querySelector("#power-bars").innerHTML = Object.keys(p.powers).map((k) => `
      <div class="power-row">
        <div class="power-row-head"><span class="label">${powerLabels[k] || k}</span><span class="value">${p.powers[k]}</span></div>
        <div class="power-track"><div class="power-fill" style="width:${p.powers[k]}%"></div></div>
      </div>`).join("");

    // net worth / owl / golden path
    const owl = owlState(p);
    const meta = OWL_META[owl];
    root.querySelector("#owl-img").src = meta.src;
    root.querySelector("#owl-figure").style.setProperty("--halo-color", meta.halo);
    root.querySelector("#owl-status-line").textContent = meta.label;
    root.querySelector("#networth-value").textContent = yen(derived.netWorth);
    root.querySelector("#golden-path-wrap").innerHTML = renderGoldenPathSvg(p.netWorthPath.points, p.netWorthPath.currentAge);

    // stat grid
    const stats = [
      { label: "Monthly income", value: yen(p.income) },
      { label: "Monthly spending", value: yen(p.monthlyExpenses) },
      { label: "Monthly surplus", value: yen(derived.surplus), cls: derived.surplus >= 0 ? "positive" : "negative" },
      { label: "Cash savings", value: yen(p.savings) },
      { label: "Investments", value: yen(p.investments) },
      { label: "Debt", value: yen(p.debt), cls: p.debt > 0 ? "negative" : "" },
      { label: "Net worth", value: yen(derived.netWorth), cls: "positive" },
      { label: "Investable capacity", value: yen(derived.investableCapacity) + "/mo" }
    ];
    root.querySelector("#stat-grid").innerHTML = stats.map((s) => `
      <div class="stat-tile">
        <div class="stat-label">${s.label}</div>
        <div class="stat-value ${s.cls || ""}">${s.value}</div>
      </div>`).join("");

    // insights
    const insights = DATA.homeInsights.slice();
    if (getJourneyState().status === "completed") {
      insights.push({ id: "hi_plan", icon: "star", text: "Your personalized financial plan is live — check your journey below." });
    }
    const shared = getPendingShare();
    if (shared) {
      const label = shared.title || shared.text || shared.url || (shared.fileCount ? shared.fileCount + " file(s)" : "content");
      insights.unshift({
        id: "hi_shared",
        icon: "paperclip",
        text: "Received from Share Sheet: “" + escapeHtml(label) + "”",
        dismissable: true
      });
    }
    root.querySelector("#insights-list").innerHTML = insights.map((i) => `
      <div class="insight-banner"><span class="icon">${comicIcon(i.icon)}</span><p>${i.text}</p>${i.dismissable ? '<button class="close-btn" data-dismiss-insight="' + i.id + '">' + lineIcon("x") + "</button>" : ""}</div>`).join("");
    root.querySelectorAll("[data-dismiss-insight]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.dismissInsight === "hi_shared") clearPendingShare();
        renderHome();
      });
    });

    // continue plan card
    const journey = getJourneyState();
    const continueWrap = root.querySelector("#continue-plan-wrap");
    if (journey.status === "in_progress") {
      continueWrap.style.display = "";
      continueWrap.innerHTML = `
        <button class="card continue-plan-card" id="continue-plan-btn" style="border:none;width:100%;cursor:pointer;">
          <span class="icon">${comicIcon("compass")}</span>
          <span class="body">
            <span class="title">Continue building your plan</span>
            <span class="meta">Step ${journey.currentStep + 1} of ${DATA.guidedPlanJourney.steps.length}</span>
          </span>
          <span>${lineIcon("arrow-right")}</span>
        </button>`;
      continueWrap.querySelector("#continue-plan-btn").addEventListener("click", () => openGuidedJourney(journey.currentStep));
    } else {
      continueWrap.style.display = "none";
      continueWrap.innerHTML = "";
    }

    // journey map (quests)
    const quests = DATA.quests.slice().sort((a, b) => a.order - b.order);
    root.querySelector("#journey-map").innerHTML = quests.map((q) => {
      const qs = state.quests[q.id];
      const progress = qs.currentAmount / q.goalAmount;
      const status = qs.status;
      return `
      <div class="journey-item is-${status === "active" && progress >= 1 ? "completed" : status}">
        <div class="journey-node">${status === "locked" ? lineIcon("lock") : (progress >= 1 ? lineIcon("check") : "")}</div>
        <button class="card journey-card" data-quest="${q.id}" style="border:none;width:100%;cursor:pointer;">
          <span class="icon">${comicIcon(q.icon)}</span>
          <span class="body">
            <span class="title">${q.title}</span>
            <span class="meta">${yen(qs.currentAmount)} of ${yen(q.goalAmount)}</span>
          </span>
        </button>
      </div>`;
    }).join("");
    root.querySelectorAll("[data-quest]").forEach((b) => b.addEventListener("click", () => openQuestSimulator(b.dataset.quest)));

    // this week missions
    root.querySelector("#mission-list").innerHTML = DATA.weeklyMissions.map((m) => {
      const done = state.missions[m.id].completed;
      return `
      <button class="mission-item ${done ? "is-done" : ""}" data-mission="${m.id}" style="border:none;">
        <span class="mission-check">${done ? lineIcon("check") : ""}</span>
        <span class="mission-title">${m.title}</span>
        <span class="mission-xp">+${m.xpReward} XP</span>
      </button>`;
    }).join("");
    root.querySelectorAll("[data-mission]").forEach((b) => b.addEventListener("click", () => toggleMission(b.dataset.mission)));
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
  // DREAM LAB
  // ---------------------------------------------------------------------
  function renderDreamLab() {
    const root = document.getElementById("screen-dreamlab");
    root.querySelectorAll(".section-tab-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.section === state.activeDreamLabTab));
    root.querySelectorAll(".pg-section").forEach((s) => s.style.display = s.dataset.section === state.activeDreamLabTab ? "" : "none");

    root.querySelector("#quest-grid").innerHTML = DATA.quests.map((q) => {
      const qs = state.quests[q.id];
      const progress = Math.min(1, qs.currentAmount / q.goalAmount);
      const locked = qs.status === "locked";
      return `
      <button class="quest-card ${locked ? "is-locked" : ""}" data-quest="${q.id}" ${locked ? "disabled" : ""}>
        <span class="icon">${comicIcon(q.icon)}</span>
        <span class="title">${q.title}</span>
        <div class="progress-track"><div class="progress-fill" style="width:${pct(progress)}"></div></div>
        <span class="progress-label">${yen(qs.currentAmount)} / ${yen(q.goalAmount)}</span>
        <div class="quest-card-foot">
          <span class="chip chip-${q.difficulty.toLowerCase()}">${q.difficulty}</span>
          <span class="xp-reward">+${q.xpReward} XP</span>
        </div>
      </button>`;
    }).join("");
    root.querySelectorAll("#quest-grid [data-quest]").forEach((b) => b.addEventListener("click", () => openQuestSimulator(b.dataset.quest)));

    root.querySelector("#suggested-goals").innerHTML = DATA.suggestedGoals.map((g) => `
      <div class="card goal-card">
        <div class="card-row"><span class="icon">${comicIcon(g.icon)}</span><span class="card-title">${g.title}</span></div>
        <span class="chip chip-neutral">${g.category}</span>
      </div>`).join("");

    root.querySelector("#personalized-goals").innerHTML = DATA.personalizedGoals.map((g) => `
      <div class="card goal-card">
        <div class="card-row"><span class="icon">${comicIcon(g.icon)}</span><span class="card-title">${g.title}</span></div>
        <p class="why">${g.why}</p>
        <div class="card-row">
          <span class="chip chip-neutral">${g.recommendedAction}</span>
        </div>
      </div>`).join("");
  }

  document.querySelectorAll("#screen-dreamlab .section-tab-btn").forEach((b) => {
    b.addEventListener("click", () => { state.activeDreamLabTab = b.dataset.section; renderDreamLab(); });
  });

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
      <p style="font-size:12px;color:var(--ink-soft);">This is a scenario based on your inputs, not a guaranteed outcome.</p>
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
      <button class="theme-card" data-theme="${t.id}" style="border:none;">
        <span class="icon">${comicIcon(t.icon)}</span>
        <span class="body"><span class="title">${t.title}</span><span class="summary">${t.summary}</span></span>
        <span class="exposure">${pct(t.userExposurePct)}<br><span style="font-weight:600;color:var(--ink-faint);">exposure</span></span>
      </button>`).join("");
    root.querySelectorAll("[data-theme]").forEach((b) => b.addEventListener("click", () => openThemeDetail(b.dataset.theme)));

    root.querySelector("#investment-quests").innerHTML = DATA.investmentQuests.map((q) => {
      const done = state.investmentQuests[q.id].completed;
      return `
      <button class="mission-item ${done ? "is-done" : ""}" data-iquest="${q.id}" style="border:none;">
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
      <p style="font-size:14px;line-height:1.6;">${t.summary}</p>
      <div class="card-flat">
        <div class="card-eyebrow">Why it matters</div>
        <p style="font-size:14px;line-height:1.6;margin-top:6px;">${t.whyItMatters}</p>
      </div>
      <div class="compare-grid">
        <div class="compare-tile"><div class="label">Your exposure</div><div class="value">${pct(t.userExposurePct)}</div></div>
        <div class="compare-tile"><div class="label">Risk level</div><div class="value" style="font-size:15px;">${t.riskLevel}</div></div>
      </div>
      <p style="font-size:12px;color:var(--ink-soft);">Educational only — this is not a recommendation to buy or sell.</p>
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
    root.querySelector("#profile-avatar-icon").innerHTML = comicIcon((DATA.avatars.find((a) => a.id === p.avatar) || {}).icon || "compass");

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
    renderHome();
    renderDreamLab();
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
