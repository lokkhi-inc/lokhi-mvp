/**
 * Dream Lab — mock AI fixture layer.
 *
 * This is the JSON data contract described in the Dream Lab spec, expressed
 * as a JS object literal (same pattern as app-data.js) since the app has no
 * build step and no JSON import. Everything here stands in for what an LLM
 * would eventually generate. Nothing here should be read as verified,
 * researched fact — see the `source_type` / `confidence` fields on each
 * variable, and the "Example assumption" / "Placeholder" labels the UI
 * attaches to them.
 *
 * Swap this file (and dream-engine.js's fixture lookups) for a real LLM
 * provider later without touching dreamlab.js.
 */
window.DREAM_LAB_DATA = {

  // ---- Create Dream flow: conversational questions, asked in order -------
  createDreamQuestions: [
    { id: "what", eyebrow: "Dream Lab", prompt: "What are you dreaming about?", help: "No wrong answers — just say it the way you'd say it to a friend.", placeholder: "e.g. A place in Tokyo where my parents can stay when they visit" },
    { id: "why", eyebrow: "The why", prompt: "Why does this matter to you?", help: "", placeholder: "e.g. I want somewhere that feels like mine, not a landlord's" },
    { id: "change", eyebrow: "The why", prompt: "What would achieving this change about your life?", help: "", placeholder: "e.g. I'd stop feeling like I'm always about to move again" },
    { id: "excited", eyebrow: "Curiosity", prompt: "What are you most excited about?", help: "", placeholder: "e.g. Finally having space for a family" },
    { id: "worried", eyebrow: "Curiosity", prompt: "What are you most worried about?", help: "This helps your Fairy Godmother know what to watch for — not to talk you out of anything.", placeholder: "e.g. Taking on more debt than feels comfortable" },
    { id: "success", eyebrow: "Almost there", prompt: "What would make this feel successful?", help: "", placeholder: "e.g. Moving in without feeling financially stretched" }
  ],

  // ---- Mock "NLP": keyword dictionaries used by DreamEngine.analyzeDream --
  interpretation: {
    categoryKeywords: [
      { category: "home", type: "life_goal", icon: "house-with-garden", match: ["house", "home", "apartment", "condo", "property", "mansion", "flat"] },
      { category: "vehicle", type: "micro", icon: "suv", match: ["jimny", "car", "suv", "automobile", "vehicle", "motorbike"] },
      { category: "travel", type: "micro", icon: "airplane", match: ["trip", "travel", "vacation", "kyoto", "okinawa", "abroad trip", "holiday"] },
      { category: "wedding", type: "micro", icon: "party-popper", match: ["wedding", "marry", "marriage", "propose"] },
      { category: "gadget", type: "micro", icon: "desktop-computer", match: ["laptop", "camera", "computer", "gadget", "phone"] },
      { category: "business", type: "life_goal", icon: "building-construction", match: ["business", "startup", "company", "entrepreneur", "shop", "freelance"] },
      { category: "relocation", type: "life_goal", icon: "world-map", match: ["abroad", "move overseas", "emigrate", "relocate", "another country"] },
      { category: "sabbatical", type: "life_goal", icon: "palm-tree", match: ["sabbatical", "career break", "time off", "gap year"] },
      { category: "investing", type: "life_goal", icon: "chart-increasing", match: ["portfolio", "investment", "invest", "brokerage"] },
      { category: "runway", type: "super_goal", icon: "dove", match: ["financial independence", "runway", "freedom", "retire early", "fire"] },
      { category: "emergency", type: "micro", icon: "ring-buoy", match: ["emergency fund", "safety net", "cushion", "rainy day"] },
      { category: "family", type: "life_goal", icon: "baby", match: ["family", "baby", "children", "kids", "raise a family"] }
    ],
    valueKeywords: [
      { value: "family", match: ["family", "parents", "kids", "children", "household", "partner"] },
      { value: "stability", match: ["stable", "stability", "secure", "security", "safe", "settle"] },
      { value: "freedom", match: ["free", "freedom", "flexib", "independence", "optionality", "no one telling me"] },
      { value: "belonging", match: ["own", "mine", "belong", "roots"] },
      { value: "adventure", match: ["adventure", "explore", "experience", "spontaneous"] },
      { value: "creativity", match: ["creative", "create", "art", "build something", "make things"] },
      { value: "wellbeing", match: ["health", "wellbeing", "rest", "slow down", "peace"] },
      { value: "legacy", match: ["legacy", "future generations", "kids' future", "my children"] }
    ],
    concernKeywords: [
      { concern: "Taking on too much debt", match: ["debt", "loan", "borrow", "mortgage size"] },
      { concern: "Losing financial flexibility", match: ["flexib", "locked in", "stuck", "trapped", "tied up"] },
      { concern: "Whether this is affordable right now", match: ["afford", "expensive", "cost too much", "stretch"] },
      { concern: "Moving before the timing is right", match: ["timing", "too soon", "too early", "rush", "not ready"] },
      { concern: "Market conditions changing unfavorably", match: ["market", "prices going up", "rates rising", "interest rate"] },
      { concern: "Making a decision I might regret", match: ["regret", "wrong choice", "mistake", "second guess"] }
    ],
    // Category → placeholder baseline suggestion. Clearly a placeholder —
    // the UI must label it "Example assumption", never fact.
    suggestedBaseline: {
      home: { value: 60000000, label: "Estimated home price" },
      vehicle: { value: 2800000, label: "Estimated vehicle price" },
      travel: { value: 500000, label: "Estimated trip cost" },
      wedding: { value: 3000000, label: "Estimated wedding cost" },
      gadget: { value: 300000, label: "Estimated cost" },
      business: { value: 5000000, label: "Estimated starting capital" },
      relocation: { value: 4000000, label: "Estimated relocation cost" },
      sabbatical: { value: 3000000, label: "Estimated runway needed" },
      investing: { value: 10000000, label: "Portfolio target" },
      runway: { value: 6000000, label: "Estimated runway needed" },
      emergency: { value: 1000000, label: "Emergency fund target" },
      family: { value: 3000000, label: "Estimated cost" }
    }
  },

  // ---- Seed dreams ---------------------------------------------------------
  // A mix of standalone Micro Dreams / Life Goals, plus a Super Goal
  // ("Freedom") containing several Life Goals, to demonstrate the hierarchy.
  dreams: [
    {
      id: "freedom-001", type: "super_goal", parentId: null, category: "runway",
      title: "Freedom", description: "A chapter of life where money is a tool, not a worry.",
      icon: "dove", status: "active", progress: 0.22,
      why: ["Options, not obligations", "Never feeling stuck in a job or a place"],
      values: ["freedom", "stability"], concerns: ["Losing financial flexibility"],
      baseline: null, targetDate: null,
      createdAt: "2025-11-01"
    },
    {
      id: "home-tokyo-001", type: "life_goal", parentId: "freedom-001", category: "home",
      title: "Buy My Home", description: "Buy a home in Tokyo",
      icon: "house-with-garden", status: "active", progress: 0.32,
      why: [
        "Have a place that feels like mine",
        "Create space for family",
        "Allow parents to stay",
        "Potentially generate rental income"
      ],
      values: ["family", "stability", "freedom"],
      concerns: ["Taking on too much debt", "Losing financial flexibility"],
      baseline: { label: "Baseline property price", value: 80000000, currency: "JPY", editable: true, status: "set" },
      targetDate: "2031-12-31",
      createdAt: "2025-11-02"
    },
    {
      id: "portfolio-30m", type: "life_goal", parentId: "freedom-001", category: "investing",
      title: "Build a ¥30M Portfolio", description: "Grow a taxable + NISA investment portfolio to ¥30,000,000.",
      icon: "chart-increasing", status: "active", progress: 0.11,
      why: ["A cushion that grows on its own", "Less dependence on a single paycheck"],
      values: ["freedom", "stability"], concerns: ["Market conditions changing unfavorably"],
      baseline: { label: "Portfolio target", value: 30000000, currency: "JPY", editable: true, status: "set" },
      targetDate: "2035-12-31",
      createdAt: "2025-11-05"
    },
    {
      id: "business-001", type: "life_goal", parentId: "freedom-001", category: "business",
      title: "Start a Business", description: "Start a small business on the side, then maybe full-time.",
      icon: "building-construction", status: "exploring", progress: 0.05,
      why: ["Build something that's mine", "Income that isn't tied to one employer"],
      values: ["creativity", "freedom"], concerns: ["Whether this is affordable right now"],
      baseline: { label: "Estimated starting capital", value: 5000000, currency: "JPY", editable: true, status: "suggested" },
      targetDate: "2028-06-30",
      createdAt: "2025-12-01"
    },
    {
      id: "runway-18mo", type: "life_goal", parentId: "freedom-001", category: "runway",
      title: "Build an 18-Month Runway", description: "Enough saved to cover 18 months of expenses with no income.",
      icon: "shield", status: "active", progress: 0.4,
      why: ["The ability to leave a job that isn't working", "Room to take a risk without panicking"],
      values: ["freedom", "stability"], concerns: ["Whether this is affordable right now"],
      baseline: { label: "Runway target", value: 8460000, currency: "JPY", editable: true, status: "set" },
      targetDate: "2029-12-31",
      createdAt: "2025-12-10"
    },
    {
      id: "sabbatical-001", type: "life_goal", parentId: "freedom-001", category: "sabbatical",
      title: "Take a Sabbatical", description: "Take 6 months off between roles.",
      icon: "palm-tree", status: "exploring", progress: 0.0,
      why: ["Rest before the next chapter", "Time to think without a calendar full of meetings"],
      values: ["wellbeing", "freedom"], concerns: ["Moving before the timing is right"],
      baseline: { label: "Estimated cost of 6 months off", value: 3600000, currency: "JPY", editable: true, status: "suggested" },
      targetDate: "2030-06-30",
      createdAt: "2026-01-15"
    },
    {
      id: "jimny-001", type: "micro", parentId: null, category: "vehicle",
      title: "Jimny", description: "Buy a Suzuki Jimny, in cash, no loan.",
      icon: "suv", status: "active", progress: 0.68,
      why: ["Weekend trips off the beaten path", "Something that's just fun, not just useful"],
      values: ["adventure"], concerns: [],
      baseline: { label: "Baseline vehicle price", value: 2800000, currency: "JPY", editable: true, status: "set" },
      targetDate: "2027-06-30",
      createdAt: "2026-02-01"
    },
    {
      id: "travel-001", type: "micro", parentId: null, category: "travel",
      title: "Kyoto & Okinawa Trip", description: "A trip to Kyoto and Okinawa, fully funded, no credit card hangover.",
      icon: "airplane", status: "active", progress: 0.35,
      why: ["A proper break, not a rushed long weekend", "See more of the country I live in"],
      values: ["adventure", "wellbeing"], concerns: [],
      baseline: { label: "Baseline trip cost", value: 600000, currency: "JPY", editable: true, status: "set" },
      targetDate: "2027-04-01",
      createdAt: "2026-03-01"
    },
    {
      id: "family-001", type: "life_goal", parentId: null, category: "family",
      title: "Raise a Family", description: "Be financially ready to grow our household.",
      icon: "baby", status: "exploring", progress: 0.08,
      why: ["Space and stability for kids", "Not feeling financially stretched by the decision"],
      values: ["family", "stability"], concerns: ["Whether this is affordable right now"],
      baseline: { label: "Estimated cost", value: 4000000, currency: "JPY", editable: true, status: "suggested" },
      targetDate: "2030-12-31",
      createdAt: "2026-04-01"
    }
  ],

  // ---- Curated variables by category (the "Dream Engine" output) --------
  // 4–8 high-impact variables per category. Matches the JSON contract shape:
  // id, name, category(world|user|personal|dream_specific), value, unit,
  // editable, priority, why_it_matters, source_type, source, source_date,
  // confidence, description.
  variableTemplates: {
    home: [
      { id: "property_price", name: "Property Price", category: "user", value: 80000000, unit: "JPY", editable: true, priority: "critical", description: "The price of the home you're modeling.", why_it_matters: "Determines the size of the required purchase and financing.", source_type: "user_input", source: "Your baseline", confidence: "n/a" },
      { id: "mortgage_rate", name: "Mortgage Interest Rate", category: "world", value: 0.012, unit: "percent", editable: true, priority: "critical", description: "The annual interest rate on a home loan.", why_it_matters: "Changes monthly payments and total financing cost.", source_type: "research_placeholder", source: "Example assumption — not yet researched", source_date: "2026-01-01", confidence: "low" },
      { id: "down_payment", name: "Down Payment", category: "user", value: 10000000, unit: "JPY", editable: true, priority: "critical", description: "Cash you put down up front.", why_it_matters: "Changes the amount that needs to be financed.", source_type: "user_input", source: "Your input", confidence: "n/a" },
      { id: "upfront_costs", name: "Other Upfront Costs", category: "user", value: 5000000, unit: "JPY", editable: true, priority: "important", description: "Taxes, agent fees, registration, and other one-time purchase costs.", why_it_matters: "Purchase costs beyond the property price affect the initial cash requirement.", source_type: "research_placeholder", source: "Example assumption — not yet researched", source_date: "2026-01-01", confidence: "low" },
      { id: "monthly_payment", name: "Comfortable Monthly Payment", category: "user", value: 300000, unit: "JPY", editable: true, priority: "critical", description: "What you'd like your monthly housing cost to be.", why_it_matters: "Represents your preferred monthly housing commitment — not a limit imposed on you.", source_type: "user_input", source: "Your input", confidence: "n/a" },
      { id: "inflation", name: "Inflation", category: "world", value: 0.02, unit: "percent", editable: true, priority: "important", description: "General rise in prices over time.", why_it_matters: "Changes future purchasing power and future costs.", source_type: "research_placeholder", source: "Example assumption — not yet researched", source_date: "2026-01-01", confidence: "low" },
      { id: "tokyo_property_growth", name: "Tokyo Property Price Growth", category: "world", value: 0.02, unit: "percent", editable: true, priority: "important", description: "How much property prices in the area might grow per year.", why_it_matters: "Changes the modeled future purchase price.", source_type: "research_placeholder", source: "Example assumption — not yet researched", source_date: "2026-01-01", confidence: "low" },
      { id: "rental_income", name: "Potential Rental Income", category: "dream_specific", value: 100000, unit: "JPY/month", editable: true, priority: "important", description: "Income if part of the home is rented out.", why_it_matters: "Relevant because you mentioned wanting part of the property to potentially generate income.", source_type: "user_input", source: "Your input", confidence: "n/a" }
    ],
    vehicle: [
      { id: "target_amount", name: "Vehicle Price", category: "user", value: 2800000, unit: "JPY", editable: true, priority: "critical", description: "The cash price of the vehicle.", why_it_matters: "This is what you're saving toward.", source_type: "user_input", source: "Your baseline", confidence: "n/a" },
      { id: "current_progress", name: "Saved So Far", category: "user", value: 300000, unit: "JPY", editable: true, priority: "critical", description: "How much you've already put aside.", why_it_matters: "Shows how much further there is to go.", source_type: "user_input", source: "Your input", confidence: "n/a" },
      { id: "monthly_contribution", name: "Monthly Savings", category: "user", value: 90000, unit: "JPY/month", editable: true, priority: "critical", description: "How much you set aside toward this each month.", why_it_matters: "The main lever for how soon you reach this.", source_type: "user_input", source: "Your input", confidence: "n/a" },
      { id: "insurance_estimate", name: "Annual Insurance (est.)", category: "world", value: 80000, unit: "JPY/year", editable: true, priority: "optional", description: "Rough estimate of yearly vehicle insurance.", why_it_matters: "An ongoing cost worth knowing about before you buy, not after.", source_type: "research_placeholder", source: "Example assumption — not yet researched", confidence: "low" },
      { id: "resale_value_pct", name: "Est. Resale Value (5yr)", category: "dream_specific", value: 0.55, unit: "percent", editable: true, priority: "optional", description: "Rough estimate of value retained after 5 years.", why_it_matters: "Useful context if this is ever a trade-in later.", source_type: "research_placeholder", source: "Placeholder", confidence: "low" }
    ],
    travel: [
      { id: "target_amount", name: "Trip Budget", category: "user", value: 600000, unit: "JPY", editable: true, priority: "critical", description: "Total budget for the trip.", why_it_matters: "This is what you're saving toward.", source_type: "user_input", source: "Your baseline", confidence: "n/a" },
      { id: "current_progress", name: "Saved So Far", category: "user", value: 210000, unit: "JPY", editable: true, priority: "critical", description: "How much you've already put aside.", why_it_matters: "Shows how much further there is to go.", source_type: "user_input", source: "Your input", confidence: "n/a" },
      { id: "monthly_contribution", name: "Monthly Savings", category: "user", value: 40000, unit: "JPY/month", editable: true, priority: "critical", description: "How much you set aside toward this each month.", why_it_matters: "The main lever for how soon you reach this.", source_type: "user_input", source: "Your input", confidence: "n/a" },
      { id: "flight_seasonality", name: "Flight Price Swing (seasonal)", category: "world", value: 0.25, unit: "percent", editable: false, priority: "optional", description: "How much flight costs can swing by season.", why_it_matters: "Booking timing can meaningfully change the total budget needed.", source_type: "research_placeholder", source: "Placeholder", confidence: "low" }
    ],
    wedding: [
      { id: "target_amount", name: "Wedding Budget", category: "user", value: 3000000, unit: "JPY", editable: true, priority: "critical", description: "Total budget for the wedding.", why_it_matters: "This is what you're saving toward.", source_type: "user_input", source: "Your baseline", confidence: "n/a" },
      { id: "current_progress", name: "Saved So Far", category: "user", value: 0, unit: "JPY", editable: true, priority: "critical", description: "How much you've already put aside.", why_it_matters: "Shows how much further there is to go.", source_type: "user_input", source: "Your input", confidence: "n/a" },
      { id: "monthly_contribution", name: "Monthly Savings", category: "user", value: 100000, unit: "JPY/month", editable: true, priority: "critical", description: "How much you set aside toward this each month.", why_it_matters: "The main lever for how soon you reach this.", source_type: "user_input", source: "Your input", confidence: "n/a" },
      { id: "guest_count", name: "Guest Count (est.)", category: "dream_specific", value: 60, unit: "guests", editable: true, priority: "optional", description: "Rough expected guest count.", why_it_matters: "One of the biggest levers on total cost.", source_type: "user_input", source: "Your input", confidence: "n/a" }
    ],
    generic: [
      { id: "target_amount", name: "Target Amount", category: "user", value: 1000000, unit: "JPY", editable: true, priority: "critical", description: "What this dream is estimated to cost.", why_it_matters: "This is what you're saving toward.", source_type: "user_input", source: "Your baseline", confidence: "n/a" },
      { id: "current_progress", name: "Saved So Far", category: "user", value: 0, unit: "JPY", editable: true, priority: "critical", description: "How much you've already put aside.", why_it_matters: "Shows how much further there is to go.", source_type: "user_input", source: "Your input", confidence: "n/a" },
      { id: "monthly_contribution", name: "Monthly Savings", category: "user", value: 30000, unit: "JPY/month", editable: true, priority: "critical", description: "How much you set aside toward this each month.", why_it_matters: "The main lever for how soon you reach this.", source_type: "user_input", source: "Your input", confidence: "n/a" }
    ]
  },

  // ---- Curated quests by category ----------------------------------------
  questTemplates: {
    home: [
      { id: "q_why", title: "Define why I want this home", done: true },
      { id: "q_baseline", title: "Understand my baseline budget", done: true },
      { id: "q_monthly", title: "Decide comfortable monthly payment", done: false },
      { id: "q_neighborhoods", title: "Research neighborhoods", done: false },
      { id: "q_mortgage", title: "Understand mortgage options", done: false },
      { id: "q_down_payment", title: "Build down payment", done: false },
      { id: "q_criteria", title: "Define property criteria", done: false },
      { id: "q_visit", title: "Visit first property", done: false }
    ],
    vehicle: [
      { id: "q_why", title: "Define why I want this", done: true },
      { id: "q_baseline", title: "Set a baseline price", done: true },
      { id: "q_pace", title: "Set a monthly savings pace", done: true },
      { id: "q_models", title: "Compare a couple of models or trims", done: false },
      { id: "q_insurance", title: "Get a rough insurance estimate", done: false },
      { id: "q_buy", title: "Buy it", done: false }
    ],
    travel: [
      { id: "q_why", title: "Define why this trip matters", done: true },
      { id: "q_budget", title: "Set a trip budget", done: true },
      { id: "q_dates", title: "Pick rough dates", done: false },
      { id: "q_book_flights", title: "Book flights", done: false },
      { id: "q_book_stay", title: "Book accommodation", done: false }
    ],
    generic: [
      { id: "q_why", title: "Define why this matters to me", done: true },
      { id: "q_baseline", title: "Set a baseline cost estimate", done: false },
      { id: "q_pace", title: "Set a monthly savings pace", done: false },
      { id: "q_next", title: "Decide the next concrete step", done: false }
    ]
  },

  // ---- Considerations ("Things worth thinking about") --------------------
  considerationTemplates: {
    home: [
      { id: "c_rates", title: "Mortgage rates", description: "Rates can move between now and when you actually buy." },
      { id: "c_upfront", title: "Upfront costs", description: "Agent fees, taxes, and registration beyond the sticker price." },
      { id: "c_tax", title: "Property taxes", description: "An ongoing cost that continues for as long as you own the home." },
      { id: "c_insurance", title: "Insurance", description: "Fire, earthquake, and life insurance tied to a mortgage." },
      { id: "c_maintenance", title: "Maintenance", description: "Older properties and houses (vs. mansions) often cost more to maintain." },
      { id: "c_renovation", title: "Renovation", description: "Whether the place needs work before or after moving in." },
      { id: "c_location", title: "Location", description: "Commute, schools, and how the neighborhood might change." },
      { id: "c_transport", title: "Transportation", description: "Distance to a station, or whether you'll want a car too." },
      { id: "c_emergency_fund", title: "Emergency fund", description: "Whether a cushion still exists after the down payment." },
      { id: "c_value_change", title: "Property value changes", description: "Prices can move in either direction after you buy." },
      { id: "c_rental", title: "Rental income", description: "Realistic vacancy and management costs if you rent out part of it." },
      { id: "c_family", title: "Family needs", description: "Space for parents, children, or a home office, now or later." }
    ],
    vehicle: [
      { id: "c_insurance", title: "Insurance", description: "Ongoing cost that varies by model and driving history." },
      { id: "c_parking", title: "Parking", description: "Monthly parking costs if you don't already have a spot." },
      { id: "c_maintenance", title: "Maintenance & shaken", description: "Japan's biennial inspection can be a meaningful cost." },
      { id: "c_resale", title: "Resale value", description: "Some models hold value better than others." }
    ],
    travel: [
      { id: "c_season", title: "Seasonality", description: "Flight and hotel prices can swing a lot by season." },
      { id: "c_currency", title: "Currency movement", description: "If traveling abroad, exchange rates can shift the budget." },
      { id: "c_insurance", title: "Travel insurance", description: "Worth pricing in, especially for longer trips." }
    ],
    generic: [
      { id: "c_timing", title: "Timing", description: "Whether now is the right moment, or a later date changes things." },
      { id: "c_cost_drift", title: "Cost drift", description: "Estimated costs often move once you research further." },
      { id: "c_tradeoffs", title: "What this trades off against", description: "Every dream competes with others for the same money." }
    ]
  },

  // ---- Scenario presets by category (quick-start deltas) -------------------
  // Applied as overrides on top of current variable values when a user taps
  // a preset chip. Values are deltas (added to current), not absolutes.
  scenarioPresets: {
    home: [
      { id: "conservative", name: "Conservative", emoji: "🌱", description: "Later purchase, higher emergency buffer, lower monthly payment.", overrides: { monthly_payment: -50000, down_payment: 3000000 } },
      { id: "balanced", name: "Balanced", emoji: "⚖️", description: "Moderate down payment, moderate monthly payment.", overrides: {} },
      { id: "ambitious", name: "Ambitious", emoji: "🚀", description: "Earlier purchase, higher monthly payment.", overrides: { monthly_payment: 80000, down_payment: -2000000 } }
    ],
    generic: [
      { id: "conservative", name: "Conservative", emoji: "🌱", description: "Slower pace, more breathing room each month.", overrides: { monthly_contribution: -10000 } },
      { id: "balanced", name: "Balanced", emoji: "⚖️", description: "Your current pace.", overrides: {} },
      { id: "ambitious", name: "Ambitious", emoji: "🚀", description: "Faster pace, less left over each month.", overrides: { monthly_contribution: 15000 } }
    ]
  },

  // ---- Fairy Godmother memory seed, per dream ------------------------------
  fairyMemory: {
    "home-tokyo-001": {
      why: ["I want a home where my parents can stay.", "I want a place that feels like mine, not a landlord's."],
      concerns: ["I don't want housing costs to reduce my freedom.", "I don't want to take on more debt than feels comfortable."],
      values: ["Family", "Stability", "Freedom"],
      constraints: ["Keep monthly housing cost near ¥300,000."],
      preferences: ["Near a train station.", "Space for family.", "Potential rental income."],
      decisions: ["Keep housing costs below ¥300K/month."]
    },
    "jimny-001": {
      why: ["I want something fun for weekend trips, not just practical."],
      concerns: [],
      values: ["Adventure"],
      constraints: ["Buy in cash — no auto loan."],
      preferences: ["Manual transmission if the price is right."],
      decisions: []
    },
    "freedom-001": {
      why: ["I want to reach a point where work is a choice, not a requirement."],
      concerns: ["Spreading myself too thin across too many goals at once."],
      values: ["Freedom", "Stability"],
      constraints: [],
      preferences: ["Prioritize the home and the runway before the business."],
      decisions: []
    }
  },

  // ---- Decision journal seed -----------------------------------------------
  decisionJournal: {
    "home-tokyo-001": [
      { id: "d1", decision: "Wait until 2031 to buy.", why: "I want to build a larger emergency fund first, and let the down payment grow.", alternatives: ["Buy in 2029", "Buy in 2031", "Continue renting"], date: "2026-06-12" }
    ]
  },

  // ---- Saved items seed ------------------------------------------------------
  savedItems: {
    "home-tokyo-001": [
      { id: "s1", type: "note", label: "Explained: why mortgage rate matters", createdAt: "2026-06-10" }
    ]
  },

  // ---- Fairy Godmother conversation fixtures --------------------------------
  fairyConversation: {
    intros: {
      home: "I found 7 factors that could meaningfully affect your home plan. Want me to explain them?",
      vehicle: "This one's simpler — mostly a question of pace. Ask me anything about it.",
      travel: "I love this one. Ask me anything, or just tell me what's on your mind.",
      generic: "I'm here whenever you want to think out loud about this."
    },
    qa: [
      { keywords: ["interest rate", "mortgage rate", "rate"], response: "Interest rate changes how much the loan costs over time and can change your monthly payment. I've included it as a critical variable in this simulation." },
      { keywords: ["down payment"], response: "A bigger down payment lowers your loan amount and monthly payment, but ties up more cash today. It's a tradeoff, not a rule — want to try a couple of amounts?" },
      { keywords: ["inflation"], response: "Inflation quietly raises future costs. I've included it so the plan reflects tomorrow's prices, not just today's." },
      { keywords: ["growth", "price growth", "property growth"], response: "This models how much the price of what you're saving for might rise before you get there. It's a placeholder assumption, not a forecast — worth revisiting as real data comes in." },
      { keywords: ["rental", "rental income"], response: "Since you mentioned wanting rental income, I've kept an eye on how that could offset your monthly costs. It's currently modeled as a reduction to your effective monthly payment." },
      { keywords: ["monthly payment", "afford"], response: "There's something interesting here — your comfortable monthly payment and the required payment aren't the same number right now. That's not a problem to panic about, just something worth exploring together." },
      { keywords: ["worried", "worry", "scared", "anxious", "nervous"], response: "That's worth sitting with, not rushing past. What specifically feels most uncertain right now?" },
      { keywords: ["behind", "late", "too slow", "far away"], response: "There's no clock you're racing against here — we're just mapping out what's possible at your pace." },
      { keywords: ["should i", "what should", "recommend"], response: "I won't tell you what to do — but I can show you what a few different choices would look like. Want to try that?" },
      { keywords: ["freedom"], response: "You told me freedom mattered more to you than moving fast. Let's keep that in mind as we look at this." },
      { keywords: ["debt"], response: "Taking on debt isn't inherently good or bad — it depends on what it buys you and what it costs you in flexibility. That's exactly why it's in your concerns list." },
      { keywords: ["thanks", "thank you"], response: "Always. That's what I'm here for. 🧚" }
    ],
    fallback: [
      "There's something interesting here — tell me more?",
      "Want to see what happens if we change one thing?",
      "I don't have a ready answer for that yet, but I'm keeping it in mind for this dream.",
      "Good question. Let's come back to that once you've played with the numbers a bit."
    ]
  }
};
