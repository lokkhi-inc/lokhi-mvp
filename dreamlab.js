/**
 * Dream Lab — UI controller.
 *
 * Owns #screen-dreamlab entirely (mounted at #dreamlab-root), plus four
 * overlay mount points defined in index.html:
 *   #dreamlab-create-overlay  — the "Create Dream" conversational flow
 *   #dreamlab-detail-overlay  — the Dream Detail page
 *   #fairy-convo-overlay      — Fairy Godmother chat, scoped to one dream
 *   #dl-sheet-overlay         — small generic sheet (variable detail, etc.)
 *
 * All content comes from DREAM_LAB_DATA (fixtures) via DreamEngine (the
 * swappable AI layer) and DreamCalculations (deterministic math). This file
 * never invents numbers or copy on its own — it only renders what those two
 * layers hand it, plus whatever the user has typed.
 *
 * State lives in localStorage under DL_STORAGE_KEY, seeded once from the
 * fixtures on first run, then owned entirely by this module from there on
 * (same pattern as app.js's own state, kept separate so the two features
 * don't collide).
 */
(function () {
  "use strict";

  const DATA = window.DREAM_LAB_DATA;
  const ENGINE = window.DreamEngine;
  const CALC = window.DreamCalculations;
  const DL_KEY = "lokhi_dreamlab_state";

  const TYPE_LABEL = { micro: "Micro Dream", life_goal: "Life Goal", super_goal: "Super Goal" };
  const STATUS_LABEL = { active: "Active", completed: "Completed", exploring: "Exploring" };

  // -----------------------------------------------------------------------
  // Formatting helpers (small intentional duplication of app.js's — this
  // module has no shared runtime with it beyond the DOM)
  // -----------------------------------------------------------------------
  function yen(n) {
    const sign = n < 0 ? "-" : "";
    return sign + "¥" + Math.round(Math.abs(n)).toLocaleString("en-US");
  }
  function pct(n) {
    return Math.round(n * 100) + "%";
  }
  function comicIcon(key, size) {
    return `<img class="icon-comic" style="${size ? `width:${size}px;height:${size}px;` : ""}" src="./lokhi-assets/icons/comic/${key}.svg" alt="">`;
  }
  function lineIcon(name) {
    return `<span class="icon-line icon-line-${name}"></span>`;
  }
  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }
  function fmtVar(v) {
    if (v.unit === "percent") return (v.value * 100).toFixed(1) + "%";
    if (v.unit === "guests") return Math.round(v.value) + " guests";
    if (v.unit === "JPY/month") return yen(v.value) + "/mo";
    if (v.unit === "JPY/year") return yen(v.value) + "/yr";
    if (v.unit === "JPY") return yen(v.value);
    return String(v.value);
  }
  function uid(prefix) {
    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // -----------------------------------------------------------------------
  // State: seed once from fixtures, then own it locally.
  // -----------------------------------------------------------------------
  let DL = null;

  function persist() {
    localStorage.setItem(DL_KEY, JSON.stringify(DL));
  }

  function buildDreamBundle(dream) {
    const variables = ENGINE.identifyVariables(dream).map((v) => Object.assign({}, v, { originalValue: v.value }));
    return {
      variables: variables,
      quests: ENGINE.generateQuests(dream),
      considerations: ENGINE.generateConsiderations(dream),
      scenarios: [],
      decisions: (DATA.decisionJournal[dream.id] || []).map((d) => Object.assign({}, d)),
      savedItems: (DATA.savedItems[dream.id] || []).map((s) => Object.assign({}, s)),
      memory: DATA.fairyMemory[dream.id]
        ? JSON.parse(JSON.stringify(DATA.fairyMemory[dream.id]))
        : { why: dream.why.slice(), concerns: dream.concerns.slice(), values: dream.values.slice(), constraints: [], preferences: [] },
      conversations: []
    };
  }

  function buildInitialState() {
    const state = {
      activeView: "dreamscape",
      order: [],
      dreams: {},
      variables: {},
      quests: {},
      considerations: {},
      scenarios: {},
      decisions: {},
      savedItems: {},
      memory: {},
      conversations: {},
      hiddenSections: {}
    };
    DATA.dreams.forEach((seed) => {
      const dream = Object.assign({}, seed, { why: seed.why.slice(), values: seed.values.slice(), concerns: seed.concerns.slice() });
      const bundle = buildDreamBundle(dream);
      state.dreams[dream.id] = dream;
      state.variables[dream.id] = bundle.variables;
      state.quests[dream.id] = bundle.quests;
      state.considerations[dream.id] = bundle.considerations;
      state.scenarios[dream.id] = bundle.scenarios;
      state.decisions[dream.id] = bundle.decisions;
      state.savedItems[dream.id] = bundle.savedItems;
      state.memory[dream.id] = bundle.memory;
      state.conversations[dream.id] = bundle.conversations;
      state.order.push(dream.id);
    });
    return state;
  }

  function loadState() {
    const saved = JSON.parse(localStorage.getItem(DL_KEY) || "null");
    if (saved) {
      saved.hiddenSections = saved.hiddenSections || {}; // migrate state saved before removable sections existed
      return saved;
    }
    const initial = buildInitialState();
    localStorage.setItem(DL_KEY, JSON.stringify(initial));
    return initial;
  }

  function getHiddenSections(dreamId) {
    return DL.hiddenSections[dreamId] || (DL.hiddenSections[dreamId] = {});
  }

  function addDream(structure) {
    const id = uid("dream");
    const dream = Object.assign({
      id: id,
      parentId: null,
      status: "exploring",
      progress: 0,
      createdAt: new Date().toISOString().slice(0, 10)
    }, structure);
    const bundle = buildDreamBundle(dream);
    DL.dreams[id] = dream;
    DL.variables[id] = bundle.variables;
    DL.quests[id] = bundle.quests;
    DL.considerations[id] = bundle.considerations;
    DL.scenarios[id] = bundle.scenarios;
    DL.decisions[id] = bundle.decisions;
    DL.savedItems[id] = bundle.savedItems;
    DL.memory[id] = bundle.memory;
    DL.conversations[id] = bundle.conversations;
    DL.order.unshift(id);
    persist();
    return id;
  }

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------
  function getTopLevel() {
    return DL.order.map((id) => DL.dreams[id]).filter((d) => !d.parentId);
  }
  function getChildren(dreamId) {
    return DL.order.map((id) => DL.dreams[id]).filter((d) => d.parentId === dreamId);
  }
  function toVarsMap(variables) {
    const m = {};
    variables.forEach((v) => (m[v.id] = v.value));
    return m;
  }
  function computeProgress(dreamId) {
    const dream = DL.dreams[dreamId];
    if (dream.type === "super_goal") {
      const kids = getChildren(dreamId);
      if (!kids.length) return dream.progress || 0;
      return kids.reduce((s, k) => s + computeProgress(k.id), 0) / kids.length;
    }
    const vars = toVarsMap(DL.variables[dreamId] || []);
    if (vars.target_amount != null && vars.current_progress != null && vars.target_amount > 0) {
      return Math.max(0, Math.min(1, vars.current_progress / vars.target_amount));
    }
    const quests = DL.quests[dreamId] || [];
    if (quests.length) return quests.filter((q) => q.done).length / quests.length;
    return dream.progress || 0;
  }
  function nextAction(dreamId) {
    const quests = DL.quests[dreamId] || [];
    const next = quests.slice().sort((a, b) => a.order - b.order).find((q) => !q.done);
    return next ? next.title : null;
  }
  function activeQuestCount(dreamId) {
    const dream = DL.dreams[dreamId];
    if (dream.type === "super_goal") {
      return getChildren(dreamId).reduce((s, k) => s + activeQuestCount(k.id), 0);
    }
    return (DL.quests[dreamId] || []).filter((q) => !q.done).length;
  }
  function statusOf(dreamId) {
    const progress = computeProgress(dreamId);
    if (progress >= 1) return "completed";
    return DL.dreams[dreamId].status || "active";
  }

  function setBaseline(dreamId, value) {
    const dream = DL.dreams[dreamId];
    const hadBaseline = !!dream.baseline;
    dream.baseline = Object.assign({ label: dream.baseline ? dream.baseline.label : "Baseline estimate", currency: "JPY", editable: true }, dream.baseline, { value: value, status: "set" });
    if (!hadBaseline) {
      const bundle = buildDreamBundle(dream);
      DL.variables[dreamId] = bundle.variables;
    } else if (DL.variables[dreamId] && DL.variables[dreamId][0]) {
      DL.variables[dreamId][0].value = value;
    }
    persist();
  }

  function updateVariable(dreamId, varId, value) {
    const variables = DL.variables[dreamId] || [];
    const v = variables.find((x) => x.id === varId);
    if (!v) return;
    v.value = value;
    if (variables[0] && variables[0].id === varId && DL.dreams[dreamId].baseline) {
      DL.dreams[dreamId].baseline.value = value;
      DL.dreams[dreamId].baseline.status = "set";
    }
  }

  // -----------------------------------------------------------------------
  // Root render: view toggle + Dreamscape / Plan
  // -----------------------------------------------------------------------
  function renderRoot() {
    const root = document.getElementById("dreamlab-root");
    root.innerHTML = `
      <h1 class="screen-title">Dream Lab</h1>
      <p class="screen-subtitle">Turn what you're dreaming about into something you can explore, then work toward.</p>
      <div class="dl-toolbar">
        <div class="dl-view-toggle">
          <button class="dl-view-btn ${DL.activeView === "dreamscape" ? "is-active" : ""}" data-view="dreamscape">✨ Dreamscape</button>
          <button class="dl-view-btn ${DL.activeView === "plan" ? "is-active" : ""}" data-view="plan">🗒️ Plan</button>
        </div>
        <button class="btn btn-primary btn-sm" id="dl-new-dream-btn">+ New Dream</button>
      </div>
      <div id="dl-view-body"></div>
    `;
    root.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
      DL.activeView = b.dataset.view;
      persist();
      renderRoot();
    }));
    document.getElementById("dl-new-dream-btn").addEventListener("click", openCreateDreamFlow);
    renderViewBody();
  }

  function renderViewBody() {
    const body = document.getElementById("dl-view-body");
    if (DL.activeView === "dreamscape") renderDreamscape(body);
    else renderPlanView(body);
  }

  // -----------------------------------------------------------------------
  // Dreamscape view
  // -----------------------------------------------------------------------
  // The avatar at the center reflects whichever archetype the user was
  // classified with during onboarding (same lookup app.js's Home/Profile
  // screens use) — a DiceBear SVG from the avatar library, not a generic icon.
  function getAvatarId() {
    try {
      const overrides = JSON.parse(localStorage.getItem("lokhi_profile_overrides") || "{}");
      const saved = JSON.parse(localStorage.getItem("lokhi_state") || "{}");
      return (saved.profile && saved.profile.avatar) || overrides.avatar || window.APP_DATA.userProfile.avatar;
    } catch (e) {
      return window.APP_DATA.userProfile.avatar;
    }
  }
  function avatarImgHtml(avatarId) {
    const avatar = window.APP_DATA.avatars.find((a) => a.id === avatarId);
    if (!avatar || !avatar.avatarImage) return comicIcon((avatar && avatar.icon) || "compass");
    return `<img class="avatar-img" src="${avatar.avatarImage}" alt="">`;
  }

  function renderDreamscape(container) {
    const topLevel = getTopLevel();
    if (!topLevel.length) {
      container.innerHTML = emptyStateHtml();
      wireEmptyState(container);
      return;
    }
    // Super goals are never their own orbiting node — they're a dotted
    // "constellation" cluster holding their children (shown small, like
    // micro dreams) so it's obvious at a glance which dreams belong to a
    // bigger goal versus standing on their own.
    const superGoals = topLevel.filter((d) => d.type === "super_goal");
    const standaloneLife = topLevel.filter((d) => d.type === "life_goal");
    const standaloneMicro = topLevel.filter((d) => d.type === "micro");

    const outerItems = standaloneLife.map((d) => ({ kind: "dream", dream: d }))
      .concat(superGoals.map((d) => ({ kind: "cluster", dream: d, children: getChildren(d.id) })));
    const innerItems = standaloneMicro.map((d) => ({ kind: "dream", dream: d }));

    const nodes = []
      .concat(layoutOrbit(outerItems, 40, -90, 130))
      .concat(layoutOrbit(innerItems, 24, -90 + (innerItems.length ? 180 / innerItems.length : 0), 80));

    const avatarId = getAvatarId();

    container.innerHTML = `
      <div class="dreamscape-canvas">
        <div class="dreamscape-orbit-track" style="width:80cqw;height:80cqw;"></div>
        <div class="dreamscape-orbit-track" style="width:48cqw;height:48cqw;"></div>
        <div class="dreamscape-avatar">
          <div class="dreamscape-avatar-badge">${avatarImgHtml(avatarId)}</div>
          <span class="dreamscape-avatar-label">You</span>
        </div>
        ${nodes.map((n) => (n.item.kind === "cluster" ? dreamscapeClusterHtml(n) : dreamscapeNodeHtml(n))).join("")}
      </div>
      <p class="dl-canvas-caption">This is the life you're imagining, slowly turning around you — tap anything to look closer.</p>
    `;
    container.querySelectorAll("[data-dream-node]").forEach((el) => {
      el.addEventListener("click", () => openDreamDetail(el.dataset.dreamNode));
    });
  }

  // Lays items out on a circular orbit around the avatar. Rather than a
  // fixed x/y position, each item gets an angle (as a negative animation
  // delay, so it starts already at that point on the ring) and shares a
  // duration with its counter-rotating content — see .dreamscape-orbit-ring
  // / .dreamscape-node in dreamlab-styles.css for how that stays upright.
  function layoutOrbit(items, radiusCqw, startDeg, durationSec) {
    const n = items.length;
    if (!n) return [];
    return items.map((item, i) => {
      const angleDeg = startDeg + (i * 360) / n;
      const delay = -((((angleDeg % 360) + 360) % 360) / 360) * durationSec;
      return { item, radiusCqw, durationSec, delay };
    });
  }

  function dreamscapeNodeHtml(n) {
    const d = n.item.dream;
    const progress = computeProgress(d.id);
    const status = statusOf(d.id);
    const sizeClass = d.type === "life_goal" ? "is-life" : "is-micro";
    const ringDeg = Math.round(progress * 360);
    const timing = `animation-duration:${n.durationSec}s;animation-delay:${n.delay.toFixed(2)}s;`;
    return `
      <div class="dreamscape-orbit-ring" style="--radius:${n.radiusCqw}cqw;${timing}">
        <button class="dreamscape-node ${sizeClass} status-${status}" data-dream-node="${d.id}" style="${timing}">
          <span class="dreamscape-node-badge" style="--ring:${ringDeg}deg;">${comicIcon(d.icon)}</span>
          <span class="dreamscape-node-label">${escapeHtml(d.title)}</span>
          <span class="dreamscape-node-type">${TYPE_LABEL[d.type]}</span>
          <span class="dreamscape-node-meta">${pct(progress)}</span>
        </button>
      </div>`;
  }

  // A super goal's cluster: a dotted, not-quite-circular "constellation"
  // boundary with the goal's name on it, holding its children as small
  // micro-dream-sized bubbles. Tapping the boundary/label opens the super
  // goal itself; tapping a child bubble opens that dream directly.
  function dreamscapeClusterHtml(n) {
    const superDream = n.item.dream;
    const kids = n.item.children;
    const timing = `animation-duration:${n.durationSec}s;animation-delay:${n.delay.toFixed(2)}s;`;
    const miniAngleStart = -90;
    const kidsHtml = kids.map((k, i) => {
      const angle = ((miniAngleStart + (i * 360) / kids.length) * Math.PI) / 180;
      const x = 50 + 34 * Math.cos(angle);
      const y = 50 + 34 * Math.sin(angle);
      const progress = computeProgress(k.id);
      const status = statusOf(k.id);
      return `
        <button class="dreamscape-cluster-node status-${status}" data-dream-node="${k.id}" style="left:${x}%;top:${y}%;--ring:${Math.round(progress * 360)}deg;" title="${escapeHtml(k.title)}">
          ${comicIcon(k.icon, 18)}
        </button>`;
    }).join("");
    return `
      <div class="dreamscape-orbit-ring" style="--radius:${n.radiusCqw}cqw;${timing}">
        <div class="dreamscape-cluster" style="${timing}">
          <div class="dreamscape-cluster-boundary" data-dream-node="${superDream.id}"></div>
          <button class="dreamscape-cluster-label" data-dream-node="${superDream.id}">${escapeHtml(superDream.title).toUpperCase()}</button>
          ${kidsHtml}
        </div>
      </div>`;
  }

  function emptyStateHtml() {
    return `
      <div class="card dl-empty-state">
        <span class="icon">${comicIcon("crescent-moon", 40)}</span>
        <p class="title">Your dreamscape is empty</p>
        <p class="sub">Plant your first dream and watch this space fill in around you.</p>
        <button class="btn btn-primary" id="dl-empty-new-dream">+ New Dream</button>
      </div>`;
  }
  function wireEmptyState(container) {
    const b = container.querySelector("#dl-empty-new-dream");
    if (b) b.addEventListener("click", openCreateDreamFlow);
  }

  // -----------------------------------------------------------------------
  // Plan view — grouped by Super Goal / Life Goal / Micro Dream, with
  // super goals expandable in place to browse their micro dreams.
  // -----------------------------------------------------------------------
  let expandedSuperGoals = new Set();

  function renderPlanView(container) {
    const topLevel = getTopLevel();
    if (!topLevel.length) {
      container.innerHTML = emptyStateHtml();
      wireEmptyState(container);
      return;
    }
    const groups = [
      { key: "super_goal", label: "Super Goals", items: topLevel.filter((d) => d.type === "super_goal") },
      { key: "life_goal", label: "Life Goals", items: topLevel.filter((d) => d.type === "life_goal") },
      { key: "micro", label: "Micro Dreams", items: topLevel.filter((d) => d.type === "micro") }
    ].filter((g) => g.items.length);

    container.innerHTML = groups.map((g) => `
      <div class="dl-plan-group">
        <div class="card-eyebrow dl-plan-group-label">${g.label}</div>
        <div class="dl-plan-list">
          ${g.items.map((d) => (d.type === "super_goal" ? superGoalPlanCardHtml(d) : planCardHtml(d))).join("")}
        </div>
      </div>`).join("");

    container.querySelectorAll("[data-toggle-super]").forEach((el) => el.addEventListener("click", () => {
      const id = el.dataset.toggleSuper;
      if (expandedSuperGoals.has(id)) expandedSuperGoals.delete(id);
      else expandedSuperGoals.add(id);
      renderPlanView(container);
    }));
    container.querySelectorAll("[data-dream-node]").forEach((el) => {
      el.addEventListener("click", () => openDreamDetail(el.dataset.dreamNode));
    });
  }

  function superGoalPlanCardHtml(d) {
    const kids = getChildren(d.id);
    const expanded = expandedSuperGoals.has(d.id);
    return `
      <div class="card dl-plan-card dl-plan-card-super">
        <button class="dl-plan-card-head dl-plan-card-toggle" data-toggle-super="${d.id}">
          <span class="icon">${comicIcon(d.icon, 30)}</span>
          <div class="dl-plan-card-title-wrap">
            <span class="dl-plan-card-title">${escapeHtml(d.title)}</span>
            <span class="chip chip-neutral">Super Goal</span>
          </div>
          <span class="dl-plan-chevron ${expanded ? "is-open" : ""}">▾</span>
        </button>
        <span class="dl-plan-card-meta">${activeQuestCount(d.id)} active quests across ${kids.length} dream${kids.length === 1 ? "" : "s"}</span>
        ${expanded ? `<div class="dl-plan-children">${kids.map((k) => planCardHtml(k)).join("") || `<p style="font-size:13px;color:var(--ink-soft);">No dreams inside this goal yet.</p>`}</div>` : ""}
      </div>`;
  }

  // Renders a Life Goal or Micro Dream card — Super Goals get their own
  // expandable card (see superGoalPlanCardHtml above).
  function planCardHtml(d) {
    const progress = computeProgress(d.id);
    const status = statusOf(d.id);
    const next = nextAction(d.id);
    const metaLine = `
        <div class="progress-track"><div class="progress-fill" style="width:${pct(progress)}"></div></div>
        <span class="dl-plan-card-meta">${next ? "Next: " + escapeHtml(next) : (progress >= 1 ? "🎉 All quests complete for now" : "No quests yet")}</span>`;
    return `
      <button class="card dl-plan-card" data-dream-node="${d.id}" style="text-align:left;cursor:pointer;">
        <div class="dl-plan-card-head">
          <span class="icon">${comicIcon(d.icon, 30)}</span>
          <div class="dl-plan-card-title-wrap">
            <span class="dl-plan-card-title">${escapeHtml(d.title)}</span>
            <span class="chip chip-neutral">${TYPE_LABEL[d.type]}</span>
          </div>
          <span class="chip ${status === "completed" ? "chip-easy" : status === "exploring" ? "chip-neutral" : "chip-medium"}">${STATUS_LABEL[status]}</span>
        </div>
        ${metaLine}
      </button>`;
  }

  // =========================================================================
  // CREATE DREAM FLOW
  // =========================================================================
  let cd = null; // { stepIndex, answers, interpretation, edited }

  function openCreateDreamFlow() {
    cd = {
      stepIndex: 0,
      answers: { what: "", why: "", change: "", excited: "", worried: "", success: "" },
      interpretation: null,
      edited: null
    };
    renderCreateStep();
    document.getElementById("dreamlab-create-overlay").classList.add("is-open");
  }
  function closeCreateDreamFlow() {
    document.getElementById("dreamlab-create-overlay").classList.remove("is-open");
    cd = null;
  }

  function createSteps() {
    return ENGINE.generateQuestions().map((q) => q.id).concat(["review"]);
  }

  function renderCreateStep() {
    const overlay = document.getElementById("dreamlab-create-overlay");
    const steps = createSteps();
    const stepId = steps[cd.stepIndex];
    const questions = ENGINE.generateQuestions();

    if (stepId === "review") {
      overlay.innerHTML = reviewStepHtml();
      wireReviewStep(overlay);
      return;
    }

    const q = questions.find((x) => x.id === stepId);
    const isRequired = stepId === "what";
    overlay.innerHTML = `
      <div class="journey-overlay-head">
        <img src="./lokhi-assets/fairy-mark.svg" alt="" style="width:28px;height:28px;">
        <div class="journey-overlay-progress"><div class="progress-track"><div class="progress-fill" style="width:${pct((cd.stepIndex + 1) / steps.length)}"></div></div></div>
        <button class="close-btn" id="dl-cd-close">${lineIcon("x")}</button>
      </div>
      <div class="journey-overlay-body">
        <div class="journey-overlay-phase">${q.eyebrow}</div>
        <div class="journey-overlay-title">${q.prompt}</div>
        ${q.help ? `<p class="journey-overlay-text">${q.help}</p>` : ""}
        <textarea class="dl-answer-textarea" id="dl-cd-answer" rows="4" placeholder="${escapeHtml(q.placeholder || "")}">${escapeHtml(cd.answers[stepId])}</textarea>
      </div>
      <div class="journey-overlay-foot">
        ${cd.stepIndex > 0 ? `<button class="btn btn-ghost" id="dl-cd-back">Back</button>` : ""}
        ${!isRequired ? `<button class="btn btn-ghost btn-sm" id="dl-cd-skip" style="flex:0;white-space:nowrap;">Skip</button>` : ""}
        <button class="btn btn-primary" id="dl-cd-next" style="flex:1;" ${isRequired ? "disabled" : ""}>Continue</button>
      </div>
    `;
    const textarea = document.getElementById("dl-cd-answer");
    const nextBtn = document.getElementById("dl-cd-next");
    textarea.addEventListener("input", () => {
      cd.answers[stepId] = textarea.value;
      if (isRequired) nextBtn.disabled = !textarea.value.trim();
    });
    document.getElementById("dl-cd-close").addEventListener("click", closeCreateDreamFlow);
    const backBtn = document.getElementById("dl-cd-back");
    if (backBtn) backBtn.addEventListener("click", () => { cd.stepIndex--; renderCreateStep(); });
    const skipBtn = document.getElementById("dl-cd-skip");
    if (skipBtn) skipBtn.addEventListener("click", () => { cd.stepIndex++; renderCreateStep(); });
    nextBtn.addEventListener("click", () => {
      cd.stepIndex++;
      renderCreateStep();
    });
  }

  function ensureInterpretation() {
    if (!cd.interpretation) {
      cd.interpretation = ENGINE.analyzeDream(cd.answers);
      cd.edited = {
        title: cd.interpretation.title,
        why: cd.interpretation.why.slice(),
        values: cd.interpretation.values.slice(),
        concerns: cd.interpretation.concerns.slice()
      };
    }
  }

  function reviewStepHtml() {
    ensureInterpretation();
    const e = cd.edited;
    return `
      <div class="journey-overlay-head">
        <img src="./lokhi-assets/fairy-mark.svg" alt="" style="width:28px;height:28px;">
        <div class="journey-overlay-progress"><div class="progress-track"><div class="progress-fill" style="width:100%"></div></div></div>
        <button class="close-btn" id="dl-cd-close">${lineIcon("x")}</button>
      </div>
      <div class="journey-overlay-body">
        <div class="journey-overlay-phase">Here's what I understood</div>
        <div class="journey-overlay-title">${escapeHtml(e.title)}</div>
        <p class="journey-overlay-text">Tell me if I got anything wrong — everything below is editable.</p>

        <div class="dl-review-block">
          <div class="card-eyebrow">Why</div>
          ${editableListHtml("why", e.why, "+ Add a reason")}
        </div>
        <div class="dl-review-block">
          <div class="card-eyebrow">Values</div>
          ${editableChipsHtml("values", e.values, "+ Add a value")}
        </div>
        <div class="dl-review-block">
          <div class="card-eyebrow">Concerns</div>
          ${e.concerns.length ? editableListHtml("concerns", e.concerns, "+ Add a concern") : editableListHtml("concerns", [], "+ Add a concern")}
        </div>
      </div>
      <div class="journey-overlay-foot">
        <button class="btn btn-ghost" id="dl-cd-back">Back</button>
        <button class="btn btn-primary" id="dl-cd-create" style="flex:1;">Create this Dream</button>
      </div>
    `;
  }

  function editableListHtml(key, items, addLabel) {
    return `
      <div class="dl-editable-list" data-list="${key}">
        ${items.map((item, i) => `
          <div class="dl-editable-row">
            <span>${escapeHtml(item)}</span>
            <button class="close-btn" data-remove="${key}:${i}">${lineIcon("x")}</button>
          </div>`).join("")}
        <input type="text" class="dl-add-input" data-add="${key}" placeholder="${addLabel}">
      </div>`;
  }
  function editableChipsHtml(key, items, addLabel) {
    return `
      <div class="dl-chip-list" data-list="${key}">
        ${items.map((item, i) => `<span class="chip chip-neutral dl-removable-chip">${escapeHtml(item)}<button data-remove="${key}:${i}">${lineIcon("x")}</button></span>`).join("")}
      </div>
      <input type="text" class="dl-add-input" data-add="${key}" placeholder="${addLabel}">`;
  }

  function wireReviewStep(overlay) {
    document.getElementById("dl-cd-close").addEventListener("click", closeCreateDreamFlow);
    document.getElementById("dl-cd-back").addEventListener("click", () => { cd.stepIndex--; renderCreateStep(); });
    document.getElementById("dl-cd-create").addEventListener("click", () => {
      const interpretation = Object.assign({}, cd.interpretation, cd.edited);
      const structure = ENGINE.generateDreamStructure(interpretation);
      structure.why = cd.edited.why;
      structure.values = cd.edited.values;
      structure.concerns = cd.edited.concerns;
      const id = addDream(structure);
      closeCreateDreamFlow();
      renderRoot();
      openDreamDetail(id);
    });
    overlay.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [key, idx] = btn.dataset.remove.split(":");
        cd.edited[key].splice(Number(idx), 1);
        overlay.innerHTML = reviewStepHtml();
        wireReviewStep(overlay);
      });
    });
    overlay.querySelectorAll("[data-add]").forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && input.value.trim()) {
          cd.edited[input.dataset.add].push(input.value.trim());
          overlay.innerHTML = reviewStepHtml();
          wireReviewStep(overlay);
        }
      });
    });
  }

  // =========================================================================
  // DREAM DETAIL PAGE
  // =========================================================================
  let detailStack = [];
  let activeDetailId = null;

  function openDreamDetail(id, opts) {
    if (!opts || !opts.viaBack) {
      if (activeDetailId && activeDetailId !== id) detailStack.push(activeDetailId);
    }
    activeDetailId = id;
    renderDreamDetail(id);
    document.getElementById("dreamlab-detail-overlay").classList.add("is-open");
  }
  function closeDreamDetail() {
    document.getElementById("dreamlab-detail-overlay").classList.remove("is-open");
    detailStack = [];
    activeDetailId = null;
    renderRoot();
  }
  function backDreamDetail() {
    if (detailStack.length) {
      const prev = detailStack.pop();
      openDreamDetail(prev, { viaBack: true });
    } else {
      closeDreamDetail();
    }
  }

  // A category (Psychological / Logistical / Financial) can be dismissed by
  // the user — it collapses into a small tab up top and can be brought back.
  // `justRestoredCategory` is a one-render flag so the "appear" animation
  // only plays right after a restore, not on every incidental re-render.
  let justRestoredCategory = null;
  const CATEGORY_DEFS = [
    { key: "psychological", emoji: "🧠", label: "Psychological" },
    { key: "logistical", emoji: "🗺️", label: "Logistical" },
    { key: "financial", emoji: "💰", label: "Financial" }
  ];

  function categoryBlockHtml(id, key, innerHtml) {
    const def = CATEGORY_DEFS.find((c) => c.key === key);
    if (getHiddenSections(id)[key]) return "";
    const enterCls = justRestoredCategory === key ? "dl-category-enter" : "";
    return `
      <div class="dl-category ${enterCls}" data-category="${key}">
        <div class="dl-category-head">
          <span class="dl-category-title">${def.emoji} ${def.label}</span>
          <button class="dl-category-remove" data-remove-category="${key}" aria-label="Hide ${def.label} section">${lineIcon("x")}</button>
        </div>
        <div class="dl-category-body">${innerHtml}</div>
      </div>`;
  }

  function hiddenCategoryTabsHtml(id) {
    const hidden = getHiddenSections(id);
    const hiddenOnes = CATEGORY_DEFS.filter((c) => hidden[c.key]);
    if (!hiddenOnes.length) return "";
    return `<div class="dl-hidden-tabs">${hiddenOnes.map((c) => `
      <button class="dl-hidden-tab" data-restore-category="${c.key}">${c.emoji} ${c.label} <span class="dl-hidden-tab-plus">+</span></button>`).join("")}</div>`;
  }

  function removeCategorySection(overlay, dreamId, key) {
    const el = overlay.querySelector(`[data-category="${key}"]`);
    if (!el || el.classList.contains("is-vanishing")) return;
    el.classList.add("is-vanishing");
    const burst = document.createElement("div");
    burst.className = "dl-pixie-burst";
    for (let i = 0; i < 12; i++) {
      const s = document.createElement("span");
      s.className = "dl-pixie-particle";
      const angle = (i / 12) * 2 * Math.PI + Math.random() * 0.4;
      const dist = 40 + Math.random() * 50;
      s.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      s.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      s.style.left = 25 + Math.random() * 50 + "%";
      s.style.top = 15 + Math.random() * 40 + "%";
      s.style.animationDelay = Math.random() * 150 + "ms";
      burst.appendChild(s);
    }
    el.appendChild(burst);
    setTimeout(() => {
      getHiddenSections(dreamId)[key] = true;
      persist();
      renderDreamDetail(dreamId);
    }, 620);
  }

  function restoreCategorySection(dreamId, key) {
    getHiddenSections(dreamId)[key] = false;
    persist();
    justRestoredCategory = key;
    renderDreamDetail(dreamId);
  }

  function renderDreamDetail(id) {
    const dream = DL.dreams[id];
    const overlay = document.getElementById("dreamlab-detail-overlay");
    const variables = DL.variables[id] || [];
    const isSuper = dream.type === "super_goal";

    overlay.innerHTML = `
      <div class="journey-overlay-head">
        <button class="close-btn dl-back-arrow" id="dl-dd-back">←</button>
        <div style="flex:1;display:flex;align-items:center;gap:8px;">
          <span class="icon">${comicIcon(dream.icon, 26)}</span>
          <span style="font-weight:700;font-size:16px;">${escapeHtml(dream.title)}</span>
        </div>
        <button class="btn btn-secondary btn-sm" id="dl-dd-fairy-btn">🧚 Ask</button>
        <button class="close-btn" id="dl-dd-close">${lineIcon("x")}</button>
      </div>
      <div class="journey-overlay-body dl-detail-body">
        <div class="dl-type-row">
          <span class="chip chip-neutral">${TYPE_LABEL[dream.type]}</span>
          <span class="chip ${statusOf(id) === "completed" ? "chip-easy" : "chip-medium"}">${STATUS_LABEL[statusOf(id)]}</span>
        </div>

        ${isSuper ? `
        <div class="card dl-section">
          <div class="card-eyebrow">Dream</div>
          <p class="dl-dream-statement">${escapeHtml(dream.description)}</p>
          <div class="card-eyebrow" style="margin-top:12px;">Why</div>
          ${memoryListEditor(id, "why", "+ Add a reason")}
        </div>
        ${superGoalSectionsHtml(id)}
        <div class="card dl-section">
          <div class="card-eyebrow">Things worth thinking about</div>
          ${considerationsHtml(id)}
        </div>
        <div class="card dl-section">
          <div class="card-eyebrow">Decisions I've made</div>
          ${decisionsHtml(id)}
        </div>
        <div class="card dl-section dl-fairy-card">
          <span class="icon">🧚</span>
          <p>${escapeHtml(ENGINE.introFor(dream))}</p>
          <button class="btn btn-secondary btn-sm" data-open-fairy>Chat with your Fairy Godmother</button>
        </div>
        <div class="card dl-section">
          <div class="card-eyebrow">What your Fairy Godmother knows</div>
          ${memoryPanelHtml(id)}
        </div>
        ` : `
        ${hiddenCategoryTabsHtml(id)}
        ${categoryBlockHtml(id, "psychological", psychologicalSectionHtml(id, dream))}
        ${categoryBlockHtml(id, "logistical", logisticalSectionHtml(id, dream, variables))}
        ${categoryBlockHtml(id, "financial", financialSectionHtml(id, dream, variables))}
        `}

        <div class="card dl-section">
          <div class="card-eyebrow">Bookmarks</div>
          ${savedItemsHtml(id)}
        </div>
      </div>
    `;
    justRestoredCategory = null;

    document.getElementById("dl-dd-back").addEventListener("click", backDreamDetail);
    document.getElementById("dl-dd-close").addEventListener("click", closeDreamDetail);
    document.getElementById("dl-dd-fairy-btn").addEventListener("click", () => openFairyConvo(id));
    overlay.querySelectorAll("[data-open-fairy]").forEach((b) => b.addEventListener("click", () => openFairyConvo(id)));
    overlay.querySelectorAll("[data-remove-category]").forEach((b) => b.addEventListener("click", () => removeCategorySection(overlay, id, b.dataset.removeCategory)));
    overlay.querySelectorAll("[data-restore-category]").forEach((b) => b.addEventListener("click", () => restoreCategorySection(id, b.dataset.restoreCategory)));

    wireMemoryListEditor(overlay, id, "why");
    wireConsiderations(overlay, id);
    wireDecisions(overlay, id);
    wireSavedItems(overlay, id);
    wireMemoryPanel(overlay, id);

    if (isSuper) {
      overlay.querySelectorAll("[data-child-dream]").forEach((el) => {
        el.addEventListener("click", () => openDreamDetail(el.dataset.childDream));
      });
    } else {
      wireBaseline(overlay, id);
      wireQuests(overlay, id);
      wireVariables(overlay, id);
      if (overlay.querySelectorAll("[data-slider]").length) wireSlidersLive(overlay, id);
      wireScenarios(overlay, id);
    }
  }

  function superGoalSectionsHtml(id) {
    const kids = getChildren(id);
    return `
      <div class="card dl-section">
        <div class="card-eyebrow">Inside this goal</div>
        <p style="font-size:13px;color:var(--ink-soft);margin:-4px 0 4px;">${activeQuestCount(id)} active quests across ${kids.length} dream${kids.length === 1 ? "" : "s"}.</p>
        <div class="dl-children-list">
          ${kids.map((k) => `
            <button class="card dl-plan-card" data-child-dream="${k.id}" style="text-align:left;cursor:pointer;">
              <div class="dl-plan-card-head">
                <span class="icon">${comicIcon(k.icon, 26)}</span>
                <div class="dl-plan-card-title-wrap">
                  <span class="dl-plan-card-title">${escapeHtml(k.title)}</span>
                  <span class="chip chip-neutral">${TYPE_LABEL[k.type]}</span>
                </div>
              </div>
              <div class="progress-track"><div class="progress-fill" style="width:${pct(computeProgress(k.id))}"></div></div>
            </button>`).join("") || `<p style="font-size:13px;color:var(--ink-soft);">No dreams inside this goal yet.</p>`}
        </div>
      </div>`;
  }

  // ---- Psychological: the why, the emotional context, the Fairy's memory --
  function psychologicalSectionHtml(id, dream) {
    return `
      <div class="card dl-section">
        <div class="card-eyebrow">Dream</div>
        <p class="dl-dream-statement">${escapeHtml(dream.description)}</p>
        <div class="card-eyebrow" style="margin-top:12px;">Why</div>
        ${memoryListEditor(id, "why", "+ Add a reason")}
      </div>
      <div class="card dl-section dl-fairy-card">
        <span class="icon">🧚</span>
        <p>${escapeHtml(ENGINE.introFor(dream))}</p>
        <button class="btn btn-secondary btn-sm" data-open-fairy>Chat with your Fairy Godmother</button>
      </div>
      <div class="card dl-section">
        <div class="card-eyebrow">What your Fairy Godmother knows</div>
        ${memoryPanelHtml(id)}
      </div>`;
  }

  // ---- Logistical: progress, what's shaping it, what to weigh, decisions --
  function logisticalSectionHtml(id, dream, variables) {
    return `
      <div class="card dl-section">
        <div class="card-eyebrow">Progress &amp; next step</div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct(computeProgress(id))}"></div></div>
        ${questsHtml(id)}
      </div>
      <div class="card dl-section">
        <div class="card-eyebrow">What's shaping this dream</div>
        <p style="font-size:12px;color:var(--ink-soft);margin-top:-4px;">Curated by your Dream Engine — tap anything to see why it's here.</p>
        <div id="dl-vartree-region">${variableVisualizationHtml(dream, variables)}</div>
      </div>
      <div class="card dl-section">
        <div class="card-eyebrow">Things worth thinking about</div>
        ${considerationsHtml(id)}
      </div>
      <div class="card dl-section">
        <div class="card-eyebrow">Decisions I've made</div>
        ${decisionsHtml(id)}
      </div>`;
  }

  // ---- Financial: baseline, simulation, sensitivity, scenarios ------------
  function financialSectionHtml(id, dream, variables) {
    return `
      ${baselineHtml(id, dream)}
      <div class="card dl-section">
        <div class="card-eyebrow">Simulation playground</div>
        ${simulationSlidersHtml(id, variables)}
        <div class="card-eyebrow" style="margin-top:16px;">What this means</div>
        <div id="dl-consequences-region">${consequencesHtml(dream, variables)}</div>
      </div>
      <div class="card dl-section">
        <div class="card-eyebrow">What matters most?</div>
        <div id="dl-sensitivity-region">${sensitivityHtml(dream, variables)}</div>
      </div>
      <div class="card dl-section">
        <div class="card-eyebrow">Scenarios</div>
        ${scenariosHtml(id, dream)}
      </div>`;
  }

  // ---- Baseline -----------------------------------------------------------
  function baselineHtml(id, dream) {
    if (!dream.baseline) {
      return `
        <div class="card dl-section dl-baseline-card">
          <div class="card-eyebrow">Baseline</div>
          <p style="font-size:13px;color:var(--ink-soft);">This dream doesn't have a cost estimate yet.</p>
          <button class="btn btn-secondary btn-sm" id="dl-add-cost-btn">Add estimated cost</button>
          <div id="dl-add-cost-form" style="display:none;"></div>
        </div>`;
    }
    return `
      <div class="card dl-section dl-baseline-card">
        <div class="card-eyebrow">${escapeHtml(dream.baseline.label)}</div>
        <div class="dl-baseline-value" id="dl-baseline-display">
          <span class="hero-number" id="dl-baseline-amount">${yen(dream.baseline.value)}</span>
          <button class="btn btn-ghost btn-sm" id="dl-baseline-edit-btn">Edit</button>
        </div>
        <p class="dl-baseline-caption">${dream.baseline.status === "suggested" ? "Example assumption — not yet confirmed by you." : "Baseline assumption — change it anytime."}</p>
        <div id="dl-baseline-edit-form" style="display:none;"></div>
      </div>`;
  }

  function wireBaseline(overlay, id) {
    const editBtn = overlay.querySelector("#dl-baseline-edit-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        const dream = DL.dreams[id];
        const form = overlay.querySelector("#dl-baseline-edit-form");
        overlay.querySelector("#dl-baseline-display").style.display = "none";
        overlay.querySelector(".dl-baseline-caption").style.display = "none";
        form.style.display = "flex";
        form.className = "dl-inline-form";
        form.innerHTML = `
          <input type="number" id="dl-baseline-input" value="${dream.baseline.value}">
          <button class="btn btn-primary btn-sm" id="dl-baseline-save">Save</button>`;
        overlay.querySelector("#dl-baseline-save").addEventListener("click", () => {
          const val = Number(overlay.querySelector("#dl-baseline-input").value) || 0;
          setBaseline(id, val);
          renderDreamDetail(id);
        });
      });
    }
    const addBtn = overlay.querySelector("#dl-add-cost-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const form = overlay.querySelector("#dl-add-cost-form");
        form.style.display = "flex";
        form.className = "dl-inline-form";
        form.innerHTML = `
          <input type="number" id="dl-baseline-input" placeholder="Estimated cost (¥)">
          <button class="btn btn-primary btn-sm" id="dl-baseline-save">Save</button>`;
        addBtn.style.display = "none";
        overlay.querySelector("#dl-baseline-save").addEventListener("click", () => {
          const val = Number(overlay.querySelector("#dl-baseline-input").value) || 0;
          setBaseline(id, val);
          renderDreamDetail(id);
        });
      });
    }
  }

  // ---- Quests ---------------------------------------------------------------
  function questsHtml(id) {
    const quests = (DL.quests[id] || []).slice().sort((a, b) => a.order - b.order);
    if (!quests.length) return `<p style="font-size:13px;color:var(--ink-soft);">No quests yet.</p>`;
    const next = quests.find((q) => !q.done);
    return `
      ${next ? `
        <div class="dl-next-quest">
          <span class="card-eyebrow">Next</span>
          <label class="dl-quest-row"><input type="checkbox" data-quest="${next.id}"><span>${escapeHtml(next.title)}</span></label>
        </div>` : `<p class="dl-next-quest-done">🎉 All quests complete for now.</p>`}
      <button class="skip-link" id="dl-toggle-all-quests" style="margin-top:8px;">Show all quests</button>
      <div class="dl-quest-list" id="dl-all-quests" style="display:none;">
        ${quests.map((q) => `<label class="dl-quest-row ${q.done ? "is-done" : ""}"><input type="checkbox" data-quest="${q.id}" ${q.done ? "checked" : ""}><span>${escapeHtml(q.title)}</span></label>`).join("")}
      </div>`;
  }

  function wireQuests(overlay, id) {
    overlay.querySelectorAll("[data-quest]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const q = DL.quests[id].find((x) => x.id === cb.dataset.quest);
        q.done = cb.checked;
        persist();
        renderDreamDetail(id);
      });
    });
    const toggle = overlay.querySelector("#dl-toggle-all-quests");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const list = overlay.querySelector("#dl-all-quests");
        const showing = list.style.display !== "none";
        list.style.display = showing ? "none" : "flex";
        toggle.textContent = showing ? "Show all quests" : "Hide full list";
      });
    }
  }

  // ---- Variable visualization -------------------------------------------
  function variableVisualizationHtml(dream, variables) {
    if (dream.category === "home") return homeVariableTreeHtml(variables);
    const groups = {};
    variables.forEach((v) => {
      groups[v.category] = groups[v.category] || [];
      groups[v.category].push(v);
    });
    const labels = { world: "World", user: "Your inputs", personal: "Personal", dream_specific: "Specific to this dream" };
    return `<div class="dl-var-groups">${Object.keys(groups).map((k) => `
      <div class="dl-var-group">
        <span class="dl-var-group-label">${labels[k] || k}</span>
        <div class="dl-var-chip-row">${groups[k].map((v) => varChipHtml(v)).join("")}</div>
      </div>`).join("")}</div>`;
  }

  function varChipHtml(v) {
    return `<button class="dl-var-chip" data-var="${v.id}"><span class="name">${escapeHtml(v.name)}</span><span class="value" id="dl-var-value-${v.id}">${fmtVar(v)}</span></button>`;
  }

  function findVar(variables, id) {
    return variables.find((v) => v.id === id);
  }

  function homeVariableTreeHtml(variables) {
    const byId = (id) => findVar(variables, id) || { id, name: id, value: 0, unit: "" };
    return `
      <div class="dl-var-tree">
        <div class="dl-var-tree-row dl-var-tree-single">${varChipHtml(byId("property_price"))}</div>
        <div class="dl-var-tree-connector"></div>
        <div class="dl-var-tree-row">${varChipHtml(byId("down_payment"))}${varChipHtml(byId("mortgage_rate"))}${varChipHtml(byId("upfront_costs"))}</div>
        <div class="dl-var-tree-connector"></div>
        <div class="dl-var-tree-row dl-var-tree-single">${varChipHtml(byId("monthly_payment"))}</div>
        <div class="dl-var-tree-connector"></div>
        <div class="dl-var-tree-row">${varChipHtml(byId("inflation"))}${varChipHtml(byId("tokyo_property_growth"))}${varChipHtml(byId("rental_income"))}</div>
      </div>`;
  }

  function wireVariables(overlay, id) {
    overlay.querySelectorAll("[data-var]").forEach((el) => {
      el.addEventListener("click", () => openVariableDetail(id, el.dataset.var));
    });
  }

  function openVariableDetail(dreamId, varId) {
    const variables = DL.variables[dreamId];
    const v = findVar(variables, varId);
    if (!v) return;
    const body = document.getElementById("dl-sheet-body");
    body.innerHTML = `
      <div class="sheet-modal-handle"></div>
      <div class="sheet-modal-head"><span class="title">${escapeHtml(v.name)}</span><button class="close-btn" id="dl-sheet-close">${lineIcon("x")}</button></div>
      <div class="dl-var-detail-value">${fmtVar(v)}</div>
      <p style="font-size:14px;line-height:1.5;">${escapeHtml(v.description)}</p>
      <div class="card-flat">
        <div class="card-eyebrow">Why it matters</div>
        <p style="font-size:13px;line-height:1.5;margin-top:6px;">${escapeHtml(v.why_it_matters)}</p>
      </div>
      <div class="dl-var-source-row">
        <span class="chip ${v.source_type === "user_input" ? "chip-easy" : "chip-medium"}">${v.source_type === "user_input" ? "Your input" : "Placeholder"}</span>
        <span class="chip chip-neutral">Priority: ${v.priority}</span>
      </div>
      ${v.source_type !== "user_input" ? `<p style="font-size:12px;color:var(--ink-soft);">${escapeHtml(v.source || "Not yet researched")}${v.source_date ? " · " + v.source_date : ""} — not verified market data.</p>` : ""}
      ${v.editable ? `
      <div class="dl-inline-form">
        <input type="number" id="dl-var-edit-input" step="any" value="${v.unit === "percent" ? (v.value * 100).toFixed(2) : v.value}">
        ${v.unit === "percent" ? `<span style="font-size:14px;color:var(--ink-soft);">%</span>` : ""}
        <button class="btn btn-primary btn-sm" id="dl-var-edit-save">Save</button>
      </div>` : ""}
    `;
    document.getElementById("dl-sheet-close").addEventListener("click", () => closeSheet());
    const saveBtn = document.getElementById("dl-var-edit-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const raw = Number(document.getElementById("dl-var-edit-input").value);
        const val = v.unit === "percent" ? raw / 100 : raw;
        updateVariable(dreamId, varId, val);
        persist();
        closeSheet();
        renderDreamDetail(dreamId);
      });
    }
    document.getElementById("dl-sheet-overlay").classList.add("is-open");
  }
  function closeSheet() {
    document.getElementById("dl-sheet-overlay").classList.remove("is-open");
  }

  // ---- Simulation sliders + consequences ----------------------------------
  function sliderConfig(v) {
    if (v.unit === "percent") return { min: 0, max: Math.max(0.15, v.value * 2), step: 0.001 };
    if (v.unit === "guests") return { min: 0, max: Math.max(200, v.value * 2), step: 5 };
    const max = Math.max(v.value * 3, v.value + 1000000);
    let step = 10000;
    if (v.value >= 10000000) step = 500000;
    else if (v.value >= 1000000) step = 50000;
    else if (v.value >= 100000) step = 5000;
    return { min: 0, max, step };
  }

  function simulationSlidersHtml(id, variables) {
    const editable = variables.filter((v) => v.editable);
    return `<div class="dl-slider-groups">${editable.map((v) => {
      const cfg = sliderConfig(v);
      return `
      <div class="slider-field">
        <div class="slider-field-head"><span>${escapeHtml(v.name)}</span><span class="value" id="dl-slider-label-${v.id}">${fmtVar(v)}</span></div>
        <input type="range" data-slider="${v.id}" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${v.value}">
      </div>`;
    }).join("")}</div>`;
  }

  function consequencesHtml(dream, variables) {
    const varsMap = toVarsMap(variables);
    if (dream.category === "home") {
      const r = CALC.computeHomeSimulation(varsMap, dream);
      const gapLine = r.monthlyGap > 0
        ? `¥${Math.round(r.monthlyGap).toLocaleString("en-US")}/mo above your comfortable target — worth exploring, not a problem to solve today.`
        : `Comfortably within your target monthly payment.`;
      return `
        <div class="dl-consequence-grid">
          <div class="compare-tile"><div class="label">Loan amount</div><div class="value">${yen(r.loanAmount)}</div></div>
          <div class="compare-tile"><div class="label">Est. monthly payment</div><div class="value">${yen(r.requiredMonthlyPayment)}</div></div>
          <div class="compare-tile"><div class="label">Total initial cash</div><div class="value">${yen(r.totalInitialCash)}</div></div>
          <div class="compare-tile"><div class="label">Future price (at target date)</div><div class="value">${yen(r.futurePrice)}</div></div>
          <div class="compare-tile"><div class="label">Est. total interest</div><div class="value">${yen(r.totalInterest)}</div></div>
          <div class="compare-tile"><div class="label">After rental income</div><div class="value">${yen(r.monthlyAfterRental)}/mo</div></div>
        </div>
        <div class="insight-banner"><span class="icon">🧚</span><p>${gapLine}</p></div>
        <p style="font-size:11px;color:var(--ink-faint);">Assumes a ${r.loanTermYears}-year loan — an example assumption, editable later.</p>`;
    }
    const r = CALC.computeGenericGoalSimulation(varsMap);
    const timeLine = r.monthsToGoal === 0 ? "You're already there!" : r.monthsToGoal == null ? "Not within the modeled range yet — try adjusting the pace above." : `About ${r.yearsToGoal} years (${r.monthsToGoal} months) at this pace.`;
    return `
      <div class="dl-consequence-grid">
        <div class="compare-tile"><div class="label">Remaining to save</div><div class="value">${yen(r.gapToGoal)}</div></div>
        <div class="compare-tile is-optimized"><div class="label">Time to reach this</div><div class="value" style="font-size:15px;">${timeLine}</div></div>
        <div class="compare-tile"><div class="label">Projected in 3 years</div><div class="value">${yen(r.projected3yr)}</div></div>
      </div>`;
  }

  function sensitivityHtml(dream, variables) {
    let ranked;
    if (dream.category === "home") {
      ranked = CALC.computeSensitivity(variables, toVarsMap(variables), (m) => CALC.computeHomeSimulation(m, dream), "requiredMonthlyPayment");
    } else {
      const wrap = (m) => {
        const r = CALC.computeGenericGoalSimulation(m);
        return Object.assign({}, r, { monthsToGoal: r.monthsToGoal == null ? 600 : r.monthsToGoal });
      };
      ranked = CALC.computeSensitivity(variables, toVarsMap(variables), wrap, "monthsToGoal");
    }
    if (!ranked.length) return `<p style="font-size:13px;color:var(--ink-soft);">Not enough editable variables yet to rank.</p>`;
    return `<div class="dl-sensitivity-list">${ranked.slice(0, 6).map((r) => `
      <div class="dl-sensitivity-row">
        <span class="rank">${r.rank}</span>
        <span class="name">${escapeHtml(r.name)}</span>
        <div class="dl-sensitivity-bar-track"><div class="dl-sensitivity-bar" style="width:${Math.max(4, r.impactPct)}%"></div></div>
      </div>`).join("")}</div>
      <p style="font-size:11px;color:var(--ink-faint);margin-top:6px;">A placeholder ranking — swap in a real sensitivity engine later.</p>`;
  }

  function refreshComputedRegions(dreamId) {
    const dream = DL.dreams[dreamId];
    const variables = DL.variables[dreamId];
    const cRegion = document.getElementById("dl-consequences-region");
    if (cRegion) cRegion.innerHTML = consequencesHtml(dream, variables);
    const sRegion = document.getElementById("dl-sensitivity-region");
    if (sRegion) sRegion.innerHTML = sensitivityHtml(dream, variables);
    const baselineAmount = document.getElementById("dl-baseline-amount");
    if (baselineAmount && dream.baseline) baselineAmount.textContent = yen(dream.baseline.value);
    variables.forEach((v) => {
      const chip = document.getElementById("dl-var-value-" + v.id);
      if (chip) chip.textContent = fmtVar(v);
    });
  }

  function wireSlidersLive(overlay, id) {
    overlay.querySelectorAll("[data-slider]").forEach((input) => {
      input.addEventListener("input", () => {
        const varId = input.dataset.slider;
        const value = Number(input.value);
        updateVariable(id, varId, value);
        const label = document.getElementById("dl-slider-label-" + varId);
        const v = findVar(DL.variables[id], varId);
        if (label && v) label.textContent = fmtVar(v);
        refreshComputedRegions(id);
      });
      input.addEventListener("change", persist);
    });
  }

  // ---- Scenarios ------------------------------------------------------------
  function scenariosHtml(id, dream) {
    const presets = ENGINE.generatePlans(dream);
    const saved = DL.scenarios[id] || [];
    return `
      <p style="font-size:12px;color:var(--ink-soft);margin-top:-4px;">Try a quick-start, then save what you like. No option here is "the best" — just different tradeoffs.</p>
      <div class="dl-scenario-presets">
        ${presets.map((p) => `<button class="dl-scenario-chip" data-preset="${p.id}">${p.emoji} ${escapeHtml(p.name)}</button>`).join("")}
      </div>
      <button class="btn btn-secondary btn-sm" id="dl-save-scenario-btn" style="margin-top:10px;">Save current as a scenario</button>
      <div id="dl-save-scenario-form"></div>
      <div class="dl-scenario-list">
        ${saved.map((s) => scenarioCardHtml(s)).join("")}
      </div>
      ${saved.filter((s) => s.compare).length === 2 ? compareScenariosHtml(dream, saved.filter((s) => s.compare)) : ""}
    `;
  }

  function scenarioCardHtml(s) {
    return `
      <div class="card-flat dl-scenario-card">
        <div class="dl-scenario-card-head">
          <span class="name">${s.bookmarked ? "★" : "☆"} ${escapeHtml(s.name)}</span>
          <label class="dl-compare-check"><input type="checkbox" data-compare="${s.id}" ${s.compare ? "checked" : ""}> Compare</label>
        </div>
        <div class="dl-scenario-actions">
          <button class="skip-link" data-bookmark="${s.id}">${s.bookmarked ? "Unbookmark" : "Bookmark"}</button>
          <button class="skip-link" data-rename="${s.id}">Rename</button>
          <button class="skip-link" data-delete-scenario="${s.id}">Delete</button>
        </div>
      </div>`;
  }

  function compareScenariosHtml(dream, pair) {
    const outKeys = dream.category === "home"
      ? [["requiredMonthlyPayment", "Monthly payment", "money"], ["totalInitialCash", "Initial cash", "money"], ["futurePrice", "Future price", "money"]]
      : [["monthsToGoal", "Months to goal", "raw"], ["gapToGoal", "Remaining", "money"], ["projected3yr", "In 3 years", "money"]];
    const compute = (vals) => dream.category === "home" ? CALC.computeHomeSimulation(vals, dream) : CALC.computeGenericGoalSimulation(vals);
    const results = pair.map((s) => compute(s.values));
    return `
      <div class="card-flat" style="margin-top:10px;">
        <div class="card-eyebrow">Comparing</div>
        <div class="compare-grid">
          ${pair.map((s, i) => `
            <div class="compare-tile">
              <div class="label">${escapeHtml(s.name)}</div>
              ${outKeys.map(([k, label]) => `<div style="font-size:12px;color:var(--ink-soft);margin-top:6px;">${label}<br><strong style="color:var(--ink);">${results[i][k] == null ? "—" : (typeof results[i][k] === "number" && k !== "monthsToGoal" ? yen(results[i][k]) : results[i][k])}</strong></div>`).join("")}
            </div>`).join("")}
        </div>
      </div>`;
  }

  function wireScenarios(overlay, id) {
    const dream = DL.dreams[id];
    overlay.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const preset = ENGINE.generatePlans(dream).find((p) => p.id === btn.dataset.preset);
        const variables = DL.variables[id];
        Object.keys(preset.overrides || {}).forEach((varId) => {
          const v = findVar(variables, varId);
          if (v) v.value = Math.max(0, v.value + preset.overrides[varId]);
        });
        persist();
        renderDreamDetail(id);
      });
    });
    const saveBtn = overlay.querySelector("#dl-save-scenario-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const form = overlay.querySelector("#dl-save-scenario-form");
        form.className = "dl-inline-form";
        form.innerHTML = `<input type="text" id="dl-scenario-name-input" placeholder="Name this scenario"><button class="btn btn-primary btn-sm" id="dl-scenario-name-save">Save</button>`;
        overlay.querySelector("#dl-scenario-name-save").addEventListener("click", () => {
          const name = overlay.querySelector("#dl-scenario-name-input").value.trim() || "Untitled scenario";
          DL.scenarios[id].push({ id: uid("scn"), name: name, values: toVarsMap(DL.variables[id]), bookmarked: false, compare: false });
          persist();
          renderDreamDetail(id);
        });
      });
    }
    overlay.querySelectorAll("[data-bookmark]").forEach((b) => b.addEventListener("click", () => {
      const s = DL.scenarios[id].find((x) => x.id === b.dataset.bookmark);
      s.bookmarked = !s.bookmarked;
      persist();
      renderDreamDetail(id);
    }));
    overlay.querySelectorAll("[data-delete-scenario]").forEach((b) => b.addEventListener("click", () => {
      DL.scenarios[id] = DL.scenarios[id].filter((x) => x.id !== b.dataset.deleteScenario);
      persist();
      renderDreamDetail(id);
    }));
    overlay.querySelectorAll("[data-rename]").forEach((b) => b.addEventListener("click", () => {
      const s = DL.scenarios[id].find((x) => x.id === b.dataset.rename);
      const name = window.prompt("Rename scenario", s.name);
      if (name && name.trim()) { s.name = name.trim(); persist(); renderDreamDetail(id); }
    }));
    overlay.querySelectorAll("[data-compare]").forEach((cb) => cb.addEventListener("change", () => {
      const checked = overlay.querySelectorAll("[data-compare]:checked");
      if (checked.length > 2) { cb.checked = false; return; }
      const s = DL.scenarios[id].find((x) => x.id === cb.dataset.compare);
      s.compare = cb.checked;
      persist();
      renderDreamDetail(id);
    }));
  }

  // ---- Considerations ---------------------------------------------------
  function considerationsHtml(id) {
    const list = DL.considerations[id] || [];
    if (!list.length) return `<p style="font-size:13px;color:var(--ink-soft);">Nothing surfaced yet.</p>`;
    return `<div class="dl-consideration-list">${list.map((c) => `
      <div class="dl-consideration-row ${c.considered ? "is-considered" : ""}">
        <div class="dl-consideration-head">
          <span class="title">${escapeHtml(c.title)}</span>
          <button class="dl-star-btn" data-bookmark-c="${c.id}">${c.bookmarked ? "★" : "☆"}</button>
        </div>
        <p class="desc">${escapeHtml(c.description)}</p>
        <div class="dl-consideration-actions">
          <label><input type="checkbox" data-considered="${c.id}" ${c.considered ? "checked" : ""}> Considered</label>
          <button class="skip-link" data-note-toggle="${c.id}">Note</button>
          <button class="skip-link" data-ask-fairy-c="${c.id}">Ask Fairy Godmother</button>
        </div>
        <div class="dl-note-form" id="dl-note-form-${c.id}" style="display:none;">
          <textarea rows="2" placeholder="Add a note...">${escapeHtml(c.note)}</textarea>
          <button class="btn btn-secondary btn-sm" data-save-note="${c.id}">Save note</button>
        </div>
      </div>`).join("")}</div>`;
  }

  function wireConsiderations(overlay, id) {
    overlay.querySelectorAll("[data-bookmark-c]").forEach((b) => b.addEventListener("click", () => {
      const c = DL.considerations[id].find((x) => x.id === b.dataset.bookmarkC);
      c.bookmarked = !c.bookmarked;
      persist();
      renderDreamDetail(id);
    }));
    overlay.querySelectorAll("[data-considered]").forEach((cb) => cb.addEventListener("change", () => {
      const c = DL.considerations[id].find((x) => x.id === cb.dataset.considered);
      c.considered = cb.checked;
      persist();
      renderDreamDetail(id);
    }));
    overlay.querySelectorAll("[data-note-toggle]").forEach((b) => b.addEventListener("click", () => {
      const form = overlay.querySelector("#dl-note-form-" + b.dataset.noteToggle);
      form.style.display = form.style.display === "none" ? "flex" : "none";
    }));
    overlay.querySelectorAll("[data-save-note]").forEach((b) => b.addEventListener("click", () => {
      const cId = b.dataset.saveNote;
      const c = DL.considerations[id].find((x) => x.id === cId);
      c.note = overlay.querySelector("#dl-note-form-" + cId + " textarea").value;
      persist();
      renderDreamDetail(id);
    }));
    overlay.querySelectorAll("[data-ask-fairy-c]").forEach((b) => b.addEventListener("click", () => {
      const c = DL.considerations[id].find((x) => x.id === b.dataset.askFairyC);
      openFairyConvo(id, "Why does " + c.title.toLowerCase() + " matter?");
    }));
  }

  // ---- Decision journal ---------------------------------------------------
  function decisionsHtml(id) {
    const list = DL.decisions[id] || [];
    return `
      <div class="dl-decision-list">
        ${list.map((d) => `
          <div class="card-flat dl-decision-card">
            <p class="decision">${escapeHtml(d.decision)}</p>
            <p class="why"><strong>Why:</strong> ${escapeHtml(d.why)}</p>
            ${d.alternatives && d.alternatives.length ? `<div class="dl-chip-list">${d.alternatives.map((a) => `<span class="chip chip-neutral">${escapeHtml(a)}</span>`).join("")}</div>` : ""}
          </div>`).join("") || `<p style="font-size:13px;color:var(--ink-soft);">No decisions logged yet.</p>`}
      </div>
      <button class="btn btn-secondary btn-sm" id="dl-add-decision-btn" style="margin-top:8px;">+ Add a decision</button>
      <div id="dl-add-decision-form"></div>`;
  }

  function wireDecisions(overlay, id) {
    const btn = overlay.querySelector("#dl-add-decision-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const form = overlay.querySelector("#dl-add-decision-form");
      form.className = "dl-decision-form";
      form.innerHTML = `
        <input type="text" id="dl-dec-decision" placeholder="What did you decide?">
        <input type="text" id="dl-dec-why" placeholder="Why?">
        <input type="text" id="dl-dec-alts" placeholder="Alternatives you considered (comma separated)">
        <button class="btn btn-primary btn-sm" id="dl-dec-save">Save decision</button>`;
      btn.style.display = "none";
      overlay.querySelector("#dl-dec-save").addEventListener("click", () => {
        const decision = overlay.querySelector("#dl-dec-decision").value.trim();
        if (!decision) return;
        const why = overlay.querySelector("#dl-dec-why").value.trim();
        const alts = overlay.querySelector("#dl-dec-alts").value.split(",").map((s) => s.trim()).filter(Boolean);
        DL.decisions[id].push({ id: uid("dec"), decision, why, alternatives: alts, date: new Date().toISOString().slice(0, 10) });
        persist();
        renderDreamDetail(id);
      });
    });
  }

  // ---- Saved items ----------------------------------------------------------
  function savedItemsHtml(id) {
    const explicit = (DL.savedItems[id] || []).map((s) => ({ id: s.id, label: s.label, url: s.url, kind: "item" }));
    const bookmarkedScenarios = (DL.scenarios[id] || []).filter((s) => s.bookmarked).map((s) => ({ id: s.id, label: "Scenario: " + s.name, kind: "scenario" }));
    const bookmarkedConsiderations = (DL.considerations[id] || []).filter((c) => c.bookmarked).map((c) => ({ id: c.id, label: "Consideration: " + c.title, kind: "consideration" }));
    const all = explicit.concat(bookmarkedScenarios, bookmarkedConsiderations);
    const listHtml = all.length
      ? `<div class="dl-saved-list">${all.map((s) => `
          <div class="dl-saved-row">
            ${s.url ? `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>` : `<span>${escapeHtml(s.label)}</span>`}
            <button class="skip-link" data-remove-saved="${s.kind}:${s.id}">Remove</button>
          </div>`).join("")}</div>`
      : `<p style="font-size:13px;color:var(--ink-soft);">Nothing bookmarked yet — bookmark a link, a scenario, or a consideration, and it'll show up here.</p>`;
    return `
      ${listHtml}
      <button class="btn btn-secondary btn-sm" id="dl-add-link-btn" style="margin-top:8px;">+ Bookmark a link</button>
      <div id="dl-add-link-form"></div>`;
  }

  function wireSavedItems(overlay, id) {
    overlay.querySelectorAll("[data-remove-saved]").forEach((b) => b.addEventListener("click", () => {
      const [kind, itemId] = b.dataset.removeSaved.split(":");
      if (kind === "item") DL.savedItems[id] = DL.savedItems[id].filter((x) => x.id !== itemId);
      if (kind === "scenario") { const s = DL.scenarios[id].find((x) => x.id === itemId); if (s) s.bookmarked = false; }
      if (kind === "consideration") { const c = DL.considerations[id].find((x) => x.id === itemId); if (c) c.bookmarked = false; }
      persist();
      renderDreamDetail(id);
    }));
    const addLinkBtn = overlay.querySelector("#dl-add-link-btn");
    if (addLinkBtn) {
      addLinkBtn.addEventListener("click", () => {
        const form = overlay.querySelector("#dl-add-link-form");
        form.className = "dl-link-form";
        form.innerHTML = `
          <input type="text" id="dl-link-label" placeholder="What is it? (e.g. Listing on Suumo)">
          <input type="url" id="dl-link-url" placeholder="https://...">
          <button class="btn btn-primary btn-sm" id="dl-link-save">Save bookmark</button>`;
        addLinkBtn.style.display = "none";
        overlay.querySelector("#dl-link-save").addEventListener("click", () => {
          const label = overlay.querySelector("#dl-link-label").value.trim();
          const url = overlay.querySelector("#dl-link-url").value.trim();
          if (!label || !url) return;
          DL.savedItems[id].push({ id: uid("link"), type: "link", label, url, createdAt: new Date().toISOString().slice(0, 10) });
          persist();
          renderDreamDetail(id);
        });
      });
    }
  }

  // ---- Memory (WHY block + full panel) -------------------------------------
  function memoryListEditor(id, key, addLabel) {
    const items = DL.memory[id][key] || [];
    return `
      <div class="dl-editable-list" data-memory-list="${key}">
        ${items.map((item, i) => `
          <div class="dl-editable-row">
            <span>${escapeHtml(item)}</span>
            <button class="close-btn" data-memory-remove="${key}:${i}">${lineIcon("x")}</button>
          </div>`).join("")}
        <input type="text" class="dl-add-input" data-memory-add="${key}" placeholder="${addLabel}">
      </div>`;
  }
  function wireMemoryListEditor(overlay, id, key) {
    overlay.querySelectorAll(`[data-memory-remove^="${key}:"]`).forEach((b) => b.addEventListener("click", () => {
      const idx = Number(b.dataset.memoryRemove.split(":")[1]);
      DL.memory[id][key].splice(idx, 1);
      persist();
      renderDreamDetail(id);
    }));
    overlay.querySelectorAll(`[data-memory-add="${key}"]`).forEach((input) => input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim()) {
        DL.memory[id][key].push(input.value.trim());
        persist();
        renderDreamDetail(id);
      }
    }));
  }

  function memoryPanelHtml(id) {
    const categories = [
      ["concerns", "What I'm worried about"],
      ["values", "My values"],
      ["constraints", "My constraints"],
      ["preferences", "My preferences"],
      ["decisions", "My decisions"]
    ];
    return `<div class="dl-memory-grid">${categories.map(([key, label]) => `
      <div class="dl-memory-category">
        <span class="card-eyebrow">${label}</span>
        ${memoryListEditor(id, key, "+ Add")}
      </div>`).join("")}</div>`;
  }
  function wireMemoryPanel(overlay, id) {
    ["concerns", "values", "constraints", "preferences", "decisions"].forEach((key) => wireMemoryListEditor(overlay, id, key));
  }

  // =========================================================================
  // FAIRY GODMOTHER CONVERSATION
  // =========================================================================
  function openFairyConvo(dreamId, prefill) {
    if (!DL.conversations[dreamId] || !DL.conversations[dreamId].length) {
      DL.conversations[dreamId] = [{ role: "fairy", text: ENGINE.introFor(DL.dreams[dreamId]) }];
      persist();
    }
    renderFairyConvo(dreamId);
    document.getElementById("fairy-convo-overlay").classList.add("is-open");
    if (prefill) sendFairyMessage(dreamId, prefill);
  }
  function closeFairyConvo() {
    document.getElementById("fairy-convo-overlay").classList.remove("is-open");
  }

  function renderFairyConvo(dreamId) {
    const dream = DL.dreams[dreamId];
    const body = document.getElementById("fairy-convo-body");
    body.innerHTML = `
      <div class="sheet-modal-handle"></div>
      <div class="sheet-modal-head">
        <span class="title">🧚 ${escapeHtml(dream.title)}</span>
        <button class="close-btn" id="dl-fc-close">${lineIcon("x")}</button>
      </div>
      <div class="fairy-convo-messages" id="dl-fc-messages"></div>
      <div class="quick-question-row">
        <button class="quick-question-btn" data-fc-quick="What should I prioritize?">What should I prioritize?</button>
        <button class="quick-question-btn" data-fc-quick="I'm worried about this">I'm worried about this</button>
      </div>
      <div class="dl-fc-input-row">
        <input type="text" id="dl-fc-input" placeholder="Ask your Fairy Godmother anything...">
        <button class="btn btn-primary btn-sm" id="dl-fc-send">Send</button>
      </div>
    `;
    renderFairyMessages(dreamId);
    document.getElementById("dl-fc-close").addEventListener("click", closeFairyConvo);
    const input = document.getElementById("dl-fc-input");
    document.getElementById("dl-fc-send").addEventListener("click", () => {
      if (input.value.trim()) { sendFairyMessage(dreamId, input.value.trim()); input.value = ""; }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim()) { sendFairyMessage(dreamId, input.value.trim()); input.value = ""; }
    });
    body.querySelectorAll("[data-fc-quick]").forEach((b) => b.addEventListener("click", () => sendFairyMessage(dreamId, b.dataset.fcQuick)));
  }

  function renderFairyMessages(dreamId) {
    const wrap = document.getElementById("dl-fc-messages");
    wrap.innerHTML = (DL.conversations[dreamId] || []).map((m) => `<div class="fairy-msg ${m.role === "user" ? "is-user" : "is-fairy"}">${escapeHtml(m.text)}</div>`).join("");
    wrap.scrollTop = wrap.scrollHeight;
  }

  function sendFairyMessage(dreamId, text) {
    DL.conversations[dreamId].push({ role: "user", text });
    const response = ENGINE.generateFairyGodmotherResponse({ dream: DL.dreams[dreamId], memory: DL.memory[dreamId] }, text);
    DL.conversations[dreamId].push({ role: "fairy", text: response });
    persist();
    renderFairyMessages(dreamId);
  }

  // -----------------------------------------------------------------------
  // Init
  // -----------------------------------------------------------------------
  function init() {
    DL = loadState();
    renderRoot();
  }

  document.getElementById("dl-sheet-overlay").addEventListener("click", (e) => {
    if (e.target.id === "dl-sheet-overlay") closeSheet();
  });
  document.getElementById("fairy-convo-overlay").addEventListener("click", (e) => {
    if (e.target.id === "fairy-convo-overlay") closeFairyConvo();
  });

  window.DreamLabUI = { render: renderRoot, init };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
