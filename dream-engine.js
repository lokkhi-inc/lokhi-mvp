/**
 * Dream Lab — Dream Engine service.
 *
 * This is the abstraction the UI talks to. Today it's backed by local JSON
 * fixtures (dreamlab-data.js) and keyword heuristics — a MockDreamEngineService
 * in spirit. Later this file can be replaced with an LLMDreamEngineService
 * that calls a real model, WITHOUT changing dreamlab.js, as long as the
 * function names and return shapes below stay the same.
 *
 * No network calls. No API keys. Everything here is deterministic.
 */
(function () {
  "use strict";

  const D = window.DREAM_LAB_DATA;

  function lower(s) {
    return (s || "").toLowerCase();
  }

  function matchAny(text, words) {
    return words.some((w) => text.indexOf(w) !== -1);
  }

  // Split free text into short, bullet-sized fragments — a stand-in for an
  // LLM turning a paragraph into distinct "why" statements.
  function toFragments(text) {
    if (!text) return [];
    return text
      .split(/[.;\n]|(?:,\s+and\s+)|(?:\s+and\s+)/i)
      .map((f) => f.trim())
      .filter((f) => f.length > 2)
      .map((f) => f.charAt(0).toUpperCase() + f.slice(1).replace(/[.]$/, ""));
  }

  function dedupe(arr) {
    return Array.from(new Set(arr));
  }

  /**
   * analyzeDream({ what, why, change, excited, worried, success })
   * → { title, description, category, type, icon, why[], values[], concerns[] }
   */
  function analyzeDream(answers) {
    answers = answers || {};
    const allText = lower([answers.what, answers.why, answers.change, answers.excited, answers.worried, answers.success].join(" "));

    // Category detection prioritizes the "what" answer (the most direct
    // signal) and takes the first match, not the last — otherwise a broad
    // word used incidentally elsewhere (e.g. "freedom" in a "why" answer)
    // can clobber an already-correct match (e.g. "Jimny" → vehicle).
    let category = "generic", type = "micro", icon = "star";
    const whatText = lower(answers.what);
    const primaryMatch = D.interpretation.categoryKeywords.find((c) => matchAny(whatText, c.match));
    const fallbackMatch = primaryMatch || D.interpretation.categoryKeywords.find((c) => matchAny(allText, c.match));
    if (fallbackMatch) {
      category = fallbackMatch.category;
      type = fallbackMatch.type;
      icon = fallbackMatch.icon;
    }

    const values = [];
    D.interpretation.valueKeywords.forEach((v) => {
      if (matchAny(allText, v.match)) values.push(v.value);
    });

    const concerns = [];
    const worryText = lower([answers.worried, answers.change].join(" "));
    D.interpretation.concernKeywords.forEach((c) => {
      if (matchAny(worryText, c.match)) concerns.push(c.concern);
    });

    const why = dedupe([]
      .concat(toFragments(answers.why))
      .concat(toFragments(answers.change))
      .concat(toFragments(answers.excited)));

    const title = titleFromWhat(answers.what);

    return {
      title,
      description: (answers.what || "").trim() || title,
      category,
      type,
      icon,
      why: why.length ? why.slice(0, 5) : ["Something worth exploring further"],
      values: dedupe(values).length ? dedupe(values) : ["curiosity"],
      concerns: dedupe(concerns)
    };
  }

  function titleFromWhat(what) {
    if (!what) return "New Dream";
    const trimmed = what.trim().replace(/^i (want|would like|wish) to\s*/i, "").replace(/^to\s+/i, "");
    const capped = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return capped.length > 60 ? capped.slice(0, 57) + "…" : capped;
  }

  /**
   * generateDreamStructure(interpretation) → a full Dream object, minus id.
   * Decides type, icon, and whether a baseline can be suggested yet.
   */
  function generateDreamStructure(interpretation) {
    const suggestion = D.interpretation.suggestedBaseline[interpretation.category];
    const baseline = suggestion
      ? { label: suggestion.label, value: suggestion.value, currency: "JPY", editable: true, status: "suggested" }
      : null;

    return {
      type: interpretation.type,
      category: interpretation.category,
      title: interpretation.title,
      description: interpretation.description,
      icon: interpretation.icon,
      status: "exploring",
      progress: 0,
      why: interpretation.why,
      values: interpretation.values,
      concerns: interpretation.concerns,
      baseline: baseline,
      targetDate: null,
      parentId: null
    };
  }
  // alias used in some of the spec's function naming
  const generateGoalStructure = generateDreamStructure;

  /**
   * identifyVariables(dream) → 4–8 curated variable objects for this dream.
   * Falls back to the generic template for categories without a dedicated
   * one. If the dream has a baseline, the primary variable is seeded from
   * it so edits to "baseline price" and "the simulation" stay in sync.
   */
  function identifyVariables(dream) {
    const template = D.variableTemplates[dream.category] || D.variableTemplates.generic;
    const clone = template.map((v) => Object.assign({}, v));
    if (dream.baseline && clone[0]) {
      clone[0].value = dream.baseline.value;
    }
    return clone;
  }

  function generateQuests(dream) {
    const template = D.questTemplates[dream.category] || D.questTemplates.generic;
    return template.map((q, i) => Object.assign({ order: i }, q));
  }

  function generateConsiderations(dream) {
    const template = D.considerationTemplates[dream.category] || D.considerationTemplates.generic;
    return template.map((c) => Object.assign({ bookmarked: false, considered: false, note: "" }, c));
  }

  function generatePlans(dream) {
    return D.scenarioPresets[dream.category] || D.scenarioPresets.generic;
  }

  function generateQuestions() {
    return D.createDreamQuestions;
  }

  /**
   * generateSimulation(dream) → { variables: [...] }, the shape from the
   * spec's JSON contract, ready to hand to DreamCalculations.
   */
  function generateSimulation(dream) {
    return { variables: identifyVariables(dream) };
  }

  /**
   * generateFairyGodmotherResponse({ dream, memory }, message)
   * Keyword-matches the user's message against the fixture Q&A, with a
   * light personalization layer that references stored memory when it's
   * directly relevant — the closest a fixture can get to "she remembers."
   */
  function generateFairyGodmotherResponse(context, message) {
    const text = lower(message);
    const memory = (context && context.memory) || {};

    for (let i = 0; i < D.fairyConversation.qa.length; i++) {
      const entry = D.fairyConversation.qa[i];
      if (matchAny(text, entry.keywords)) {
        const callback = personalizedCallback(text, memory);
        return callback ? callback + " " + entry.response : entry.response;
      }
    }

    const fallback = D.fairyConversation.fallback;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  function personalizedCallback(text, memory) {
    if ((text.indexOf("sooner") !== -1 || text.indexOf("faster") !== -1) && (memory.values || []).some((v) => lower(v).indexOf("freedom") !== -1)) {
      return "You told me freedom was more important than moving quickly.";
    }
    return null;
  }

  function introFor(dream) {
    return D.fairyConversation.intros[dream.category] || D.fairyConversation.intros.generic;
  }

  window.DreamEngine = {
    analyzeDream,
    generateDreamStructure,
    generateGoalStructure,
    identifyVariables,
    generateQuestions,
    generateConsiderations,
    generateQuests,
    generatePlans,
    generateSimulation,
    generateFairyGodmotherResponse,
    introFor
  };
})();
