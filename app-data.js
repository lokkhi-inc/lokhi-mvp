/**
 * Lokhi — mock data layer.
 * Everything the UI reads comes from window.APP_DATA. Swap this file for a
 * real API client later without touching any screen code.
 */

window.APP_DATA = {

  userProfile: {
    name: "Megha",
    preferredName: "Megha",
    avatar: "explorer",
    archetype: "explorer",
    age: 32,
    dateOfBirth: "1994-03-12",
    prefecture: "Tokyo",
    residencyStatus: "resident",
    employmentStatus: "full_time",
    targetRetirementAge: 55,

    // monthly figures, JPY
    income: 900000,
    monthlyExpenses: 470000,

    savings: 8000000,
    investments: 3200000,
    nisaUsage: 0.45,
    nisaAnnualLimit: 3600000,
    debt: 1000000,
    debtDetails: [
      { id: "auto_loan", label: "Auto loan", outstanding: 1000000, monthlyPayment: 28000, interestRate: 0.021 }
    ],

    household: { situation: "single", dependents: 0 },
    riskTolerance: "moderate",
    goals: ["buy_home", "retirement", "travel"],

    level: 14,
    xp: 3150,
    xpForNextLevel: 3500,
    streakWeeks: 26,
    financialHealth: 72,

    powers: { savings: 81, investing: 64, optimization: 73, goalReadiness: 58, freedom: 41 },
    financialPower: { total: 78, savings: 84, investing: 68, optimization: 76, protection: 72, goalReadiness: 81 },

    // Golden Path — dashed target vs solid actual net worth, by age.
    // actual: null means "not yet lived" — chart draws dashed-only beyond this point.
    netWorthPath: {
      currentAge: 32,
      points: [
        { age: 25, target: 3200000, actual: 2800000 },
        { age: 27, target: 4600000, actual: 4900000 },
        { age: 29, target: 6400000, actual: 7100000 },
        { age: 30, target: 7600000, actual: 8300000 },
        { age: 32, target: 9500000, actual: 10200000 },
        { age: 35, target: 15000000, actual: null },
        { age: 40, target: 26000000, actual: null },
        { age: 45, target: 41000000, actual: null },
        { age: 50, target: 61000000, actual: null },
        { age: 55, target: 88000000, actual: null }
      ]
    }
  },

  // ---- Flow 2: financial archetypes -----------------------------------
  archetypes: [
    { id: "explorer", label: "Explorer", icon: "compass", description: "You like to understand the whole map before picking a direction.", evolvesTo: "Strategist" },
    { id: "strategist", label: "Strategist", icon: "chess-pawn", description: "You think in moves ahead — every yen has a job to do.", evolvesTo: "Investor" },
    { id: "builder", label: "Builder", icon: "building-construction", description: "You'd rather construct something durable than chase a quick win.", evolvesTo: "Investor" },
    { id: "dreamer", label: "Dreamer", icon: "crescent-moon", description: "Money is a means to the life you're imagining, not a spreadsheet.", evolvesTo: "Adventurer" },
    { id: "adventurer", label: "Adventurer", icon: "world-map", description: "You want your money to fund experiences, not just balances.", evolvesTo: "Explorer" },
    { id: "investor", label: "Investor", icon: "chart-increasing", description: "You're comfortable letting time and markets do the work.", evolvesTo: "Strategist" },
    { id: "creator", label: "Creator", icon: "artist-palette", description: "You build your own income streams and think outside a salary.", evolvesTo: "Builder" },
    { id: "custom", label: "Design your own", icon: "sparkles", description: "None of these quite fit — write your own in a few words.", evolvesTo: null }
  ],

  avatars: [
    { id: "explorer", label: "Explorer", icon: "compass" },
    { id: "strategist", label: "Strategist", icon: "chess-pawn" },
    { id: "builder", label: "Builder", icon: "building-construction" },
    { id: "dreamer", label: "Dreamer", icon: "crescent-moon" },
    { id: "adventurer", label: "Adventurer", icon: "world-map" },
    { id: "investor", label: "Investor", icon: "chart-increasing" },
    { id: "creator", label: "Creator", icon: "artist-palette" }
  ],

  // ---- Flow 1: minimal onboarding checklist ----------------------------
  onboardingFields: [
    { id: "name", label: "Full name", category: "Basics", type: "text", required: true },
    { id: "dob", label: "Date of birth", category: "Basics", type: "date", required: true },
    { id: "prefecture", label: "Prefecture / residency status", category: "Basics", type: "select", required: true },
    { id: "employment", label: "Employment status & monthly income", category: "Basics", type: "number", required: true },
    { id: "bank_statement", label: "Bank statement", category: "Accounts", type: "upload", required: true, helpText: "We read balances only — never share this with anyone." },
    { id: "credit_statement", label: "Credit card statement", category: "Accounts", type: "upload", required: true },
    { id: "nisa_statement", label: "Investment / NISA account statement", category: "Accounts", type: "upload", required: false, helpText: "Skip if you don't have one yet." },
    { id: "cash_savings", label: "Current cash savings total", category: "Accounts", type: "number", required: false, helpText: "Only needed if you skipped the bank statement." },
    { id: "debts", label: "Existing loans / debt", category: "Accounts", type: "list", required: true },
    { id: "household", label: "Household situation", category: "Basics", type: "select", required: true }
  ],

  // ---- Flow 3: progressive enrichment, asked in context ---------------
  laterPrompts: [
    { id: "ideco", icon: "seedling", question: "Do you have an iDeCo account you'd like to add?", category: "Retirement", status: "pending" },
    { id: "insurance", icon: "shield", question: "Do you currently have life or income insurance?", category: "Protection", status: "pending" },
    { id: "real_estate", icon: "house", question: "Do you own any real estate, in Japan or abroad?", category: "Assets", status: "pending" },
    { id: "extra_cards", icon: "credit-card", question: "Any other credit cards you'd like us to include?", category: "Accounts", status: "pending" },
    { id: "outside_brokerage", icon: "chart-increasing", question: "Any brokerage accounts outside NISA?", category: "Investing", status: "pending" }
  ],

  // ---- Dream Lab: quests ----------------------------------------------
  quests: [
    {
      id: "emergency_fund", title: "Emergency Fund", icon: "ring-buoy", category: "saving",
      description: "Build a cushion worth 6 months of expenses.",
      goalAmount: 2820000, currentAmount: 1400000, monthlyContribution: 80000,
      difficulty: "Easy", timeHorizonMonths: 18, xpReward: 150, status: "active", order: 1
    },
    {
      id: "nisa_ninja", title: "NISA Ninja", icon: "ninja", category: "investing",
      description: "Use more of your annual NISA allowance before it resets.",
      goalAmount: 3600000, currentAmount: 1620000, monthlyContribution: 150000, expectedReturn: 0.05,
      difficulty: "Medium", timeHorizonMonths: 14, xpReward: 300, status: "active", order: 2
    },
    {
      id: "savings_builder", title: "Savings Builder", icon: "brick", category: "saving",
      description: "Grow everyday cash savings on autopilot.",
      goalAmount: 10000000, currentAmount: 8000000, monthlyContribution: 100000,
      difficulty: "Easy", timeHorizonMonths: 20, xpReward: 120, status: "active", order: 3
    },
    {
      id: "travel", title: "Travel Fund", icon: "airplane", category: "saving",
      description: "A trip to Kyoto and Okinawa, fully funded, no credit card hangover.",
      goalAmount: 600000, currentAmount: 210000, monthlyContribution: 40000,
      difficulty: "Easy", timeHorizonMonths: 10, xpReward: 100, status: "active", order: 4
    },
    {
      id: "jimny_quest", title: "Jimny Quest", icon: "suv", category: "saving",
      description: "Save for a Suzuki Jimny in cash, no auto loan needed.",
      goalAmount: 2800000, currentAmount: 300000, monthlyContribution: 90000,
      difficulty: "Medium", timeHorizonMonths: 28, xpReward: 180, status: "locked", order: 5
    },
    {
      id: "future_family", title: "Future Family", icon: "baby", category: "saving",
      description: "Start a dedicated fund ahead of a growing household.",
      goalAmount: 4000000, currentAmount: 0, monthlyContribution: 60000,
      difficulty: "Medium", timeHorizonMonths: 48, xpReward: 220, status: "locked", order: 6
    },
    {
      id: "retirement_freedom", title: "Retirement Freedom", icon: "dove", category: "investing",
      description: "Reach a retirement number that lets you stop optionally, not out of necessity.",
      goalAmount: 88000000, currentAmount: 11200000, monthlyContribution: 180000, expectedReturn: 0.06,
      difficulty: "Hard", timeHorizonMonths: 276, xpReward: 500, status: "active", order: 7
    },
    {
      id: "wealth_builder", title: "Wealth Builder", icon: "deciduous-tree", category: "investing",
      description: "Grow a taxable brokerage account alongside your NISA.",
      goalAmount: 15000000, currentAmount: 1580000, monthlyContribution: 70000, expectedReturn: 0.055,
      difficulty: "Hard", timeHorizonMonths: 120, xpReward: 350, status: "active", order: 8
    }
  ],

  suggestedGoals: [
    { id: "sg_emergency", icon: "ring-buoy", title: "3-6 months of expenses saved", category: "Safety", defaultTargetAmount: 2820000, defaultHorizonYears: 2 },
    { id: "sg_debt_free", icon: "bullseye", title: "Become debt-free", category: "Debt", defaultTargetAmount: 0, defaultHorizonYears: 3 },
    { id: "sg_home", icon: "house-with-garden", title: "Save a home down payment", category: "Home", defaultTargetAmount: 8000000, defaultHorizonYears: 6 },
    { id: "sg_retire_early", icon: "palm-tree", title: "Retire earlier than 65", category: "Retirement", defaultTargetAmount: 80000000, defaultHorizonYears: 25 },
    { id: "sg_education", icon: "graduation-cap", title: "Fund further education", category: "Education", defaultTargetAmount: 3000000, defaultHorizonYears: 4 }
  ],

  personalizedGoals: [
    {
      id: "pg_unassigned_cash", icon: "zzz", title: "Put your idle cash to work",
      why: "Your savings (¥8,000,000) are well past a 6-month emergency cushion (¥2,820,000). The extra ¥5,180,000 is sitting in low-yield cash.",
      recommendedAction: "Move a portion into your NISA account over the next 12 months.",
      targetAmount: 3600000, horizonMonths: 12
    },
    {
      id: "pg_nisa_gap", icon: "ninja", title: "Close your NISA gap before it resets",
      why: "You've used 45% of this year's ¥3,600,000 NISA allowance. At your current pace you'll leave roughly ¥1,980,000 of tax-free room unused.",
      recommendedAction: "Increase your monthly NISA contribution from ¥150,000 to ¥210,000.",
      targetAmount: 1980000, horizonMonths: 8
    },
    {
      id: "pg_debt_payoff", icon: "chequered-flag", title: "Clear your auto loan ahead of schedule",
      why: "Your auto loan carries a 2.1% rate — lower than your expected investment return, but clearing it still frees up ¥28,000/month of cash flow.",
      recommendedAction: "Add ¥15,000/month toward the loan to close it 14 months early.",
      targetAmount: 1000000, horizonMonths: 22
    }
  ],

  weeklyMissions: [
    { id: "wm_review_budget", icon: "receipt", title: "Review this month's spending", xpReward: 20, completed: true },
    { id: "wm_nisa_topup", icon: "ninja", title: "Top up your NISA contribution", xpReward: 40, completed: false },
    { id: "wm_read_theme", icon: "open-book", title: "Read one market theme in Grow", xpReward: 15, completed: false },
    { id: "wm_check_goal", icon: "bullseye", title: "Check progress on one active quest", xpReward: 15, completed: true },
    { id: "wm_answer_prompt", icon: "speech-balloon", title: "Answer a question from your Fairy Godmother", xpReward: 10, completed: false }
  ],

  // ---- Optimize ----------------------------------------------------------
  opportunities: [
    {
      id: "op_nisa_room", icon: "ninja", title: "Unused NISA allowance",
      effort: "Low", lifetimeValue: 4100000, monthlyImpact: 60000,
      why: "You've used ¥1,620,000 of your ¥3,600,000 annual NISA limit. Gains inside NISA are never taxed.",
      benefit: "Sheltering an extra ¥1,980,000 from the standard ~20% capital gains tax could be worth roughly ¥4,100,000 over 25 years, assuming a 5% average return.",
      action: "Increase your automatic NISA contribution.",
      confidence: "High", downside: "Contributions are less liquid — treat this as long-term money."
    },
    {
      id: "op_idle_cash", icon: "zzz", title: "Cash earning near-zero interest",
      effort: "Low", lifetimeValue: 6200000, monthlyImpact: 0,
      why: "¥5,180,000 of your savings sits above a healthy emergency cushion, in an account paying close to 0% interest.",
      benefit: "Investing the surplus at a moderate 5% average return instead of holding cash could be worth roughly ¥6,200,000 over 20 years.",
      action: "Move idle cash into your Wealth Builder quest gradually, not all at once.",
      confidence: "Medium", downside: "Markets fluctuate — this is a scenario, not a guarantee."
    },
    {
      id: "op_auto_loan", icon: "automobile", title: "Auto loan interest vs. investing",
      effort: "Medium", lifetimeValue: 90000, monthlyImpact: 28000,
      why: "Your auto loan rate (2.1%) is below typical long-term market returns, so paying it off early has a small opportunity cost.",
      benefit: "Paying it off 14 months early frees ¥28,000/month of cash flow sooner, worth about ¥90,000 in saved interest.",
      action: "Add ¥15,000/month toward the loan principal.",
      confidence: "High", downside: "This is optional — investing the same amount could out-earn the interest saved."
    },
    {
      id: "op_furusato", icon: "wrapped-gift", title: "Furusato Nozei not yet used this year",
      effort: "Low", lifetimeValue: 55000, monthlyImpact: 0,
      why: "Based on your income, your estimated furusato nozei donation ceiling is around ¥110,000 before the deadline.",
      benefit: "Donating up to your limit returns local goods worth roughly 30% of the donation, worth about ¥33,000 in goods, for a net cost of about ¥2,000.",
      action: "Make your furusato nozei donations before December 31.",
      confidence: "High", downside: "You must file the paperwork (or use One-Stop Exception) correctly to receive the deduction."
    },
    {
      id: "op_ideco", icon: "seedling", title: "iDeCo not yet opened",
      effort: "Medium", lifetimeValue: 2600000, monthlyImpact: -23000,
      why: "As a full-time employee, you likely qualify for iDeCo contributions that reduce taxable income today.",
      benefit: "Contributing ¥23,000/month could lower your annual tax bill while compounding toward retirement, worth roughly ¥2,600,000 in combined tax savings and growth by 55.",
      action: "Open an iDeCo account and set a contribution amount.",
      confidence: "Medium", downside: "Funds are locked until age 60 — only use money you won't need sooner."
    },
    {
      id: "op_insurance_review", icon: "shield", title: "Insurance coverage unconfirmed",
      effort: "Low", lifetimeValue: 0, monthlyImpact: 0,
      why: "We don't yet have a record of life or income insurance on your profile.",
      benefit: "Confirming your coverage (or lack of it) helps us tell you whether your emergency fund and goals are actually protected.",
      action: "Answer one question from your Fairy Godmother to add this.",
      confidence: "High", downside: "None — this just fills in a gap in your picture."
    }
  ],

  // ---- Grow ---------------------------------------------------------------
  investmentCategories: [
    { id: "index_funds", name: "Index funds", allocationPct: 0.52, currentValue: 1664000, plantStage: "tree", color: "moss" },
    { id: "etfs", name: "ETFs", allocationPct: 0.21, currentValue: 672000, plantStage: "bloom", color: "primary" },
    { id: "stocks", name: "Individual stocks", allocationPct: 0.14, currentValue: 448000, plantStage: "sprout", color: "gold" },
    { id: "bonds", name: "Bonds", allocationPct: 0.09, currentValue: 288000, plantStage: "sprout", color: "terracotta" },
    { id: "reits", name: "REITs", allocationPct: 0.04, currentValue: 128000, plantStage: "seed", color: "coral" }
  ],

  investmentExplorer: [
    { id: "ie_index", name: "Index funds", icon: "bar-chart", description: "Broad, low-cost baskets that track an entire market.", risk: "Low–Medium", horizon: "5+ years" },
    { id: "ie_etf", name: "ETFs", icon: "basket", description: "Traded like a stock, but holding a diversified basket inside.", risk: "Low–Medium", horizon: "3+ years" },
    { id: "ie_stocks", name: "Individual stocks", icon: "office-building", description: "Ownership in a single company — higher risk, higher dispersion.", risk: "High", horizon: "5+ years" },
    { id: "ie_bonds", name: "Bonds", icon: "scroll", description: "Loans to governments or companies, generally steadier.", risk: "Low", horizon: "1+ years" },
    { id: "ie_reits", name: "REITs", icon: "cityscape", description: "Real estate exposure without buying property directly.", risk: "Medium", horizon: "5+ years" }
  ],

  marketThemes: [
    {
      id: "mt_ai_infra", title: "AI Infrastructure", icon: "desktop-computer",
      summary: "The physical build-out of chips, data centers, and power behind AI systems.",
      whyItMatters: "Spending on AI infrastructure has grown faster than most other sectors over the past two years, reshaping several major indexes.",
      userExposurePct: 0.18, riskLevel: "Medium-High"
    },
    {
      id: "mt_japan", title: "Japan", icon: "map-of-japan",
      summary: "Corporate governance reform and a weaker yen have renewed interest in Japanese equities.",
      whyItMatters: "As a Japan resident, your income and expenses are already yen-denominated — this theme is about equity exposure, not currency risk.",
      userExposurePct: 0.22, riskLevel: "Medium"
    },
    {
      id: "mt_us_tech", title: "US Technology", icon: "light-bulb",
      summary: "A small number of large technology companies now make up a large share of US indexes.",
      whyItMatters: "Many broad 'global' index funds are more concentrated in this theme than investors expect.",
      userExposurePct: 0.31, riskLevel: "Medium-High"
    },
    {
      id: "mt_demographics", title: "Aging Demographics", icon: "old-man",
      summary: "Healthcare, robotics, and automation tied to aging populations across developed markets.",
      whyItMatters: "This is a slower, structural theme rather than a short-term trade.",
      userExposurePct: 0.06, riskLevel: "Low-Medium"
    },
    {
      id: "mt_clean_energy", title: "Clean Energy Transition", icon: "battery",
      summary: "The multi-decade shift toward renewables, grid upgrades, and storage.",
      whyItMatters: "Policy-sensitive — returns can swing with subsidy and regulation changes.",
      userExposurePct: 0.03, riskLevel: "High"
    }
  ],

  investmentQuests: [
    { id: "iq_index_basics", title: "How index funds actually work", icon: "bar-chart", xpReward: 40, completed: true, estMinutes: 4 },
    { id: "iq_nisa_rules", title: "NISA rules in plain language", icon: "ninja", xpReward: 60, completed: true, estMinutes: 6 },
    { id: "iq_risk_tolerance", title: "What 'risk tolerance' really means", icon: "thermometer", xpReward: 40, completed: false, estMinutes: 5 },
    { id: "iq_diversification", title: "Why diversification isn't about owning more things", icon: "basket", xpReward: 50, completed: false, estMinutes: 5 },
    { id: "iq_compounding", title: "Compounding, visualized", icon: "cyclone", xpReward: 30, completed: false, estMinutes: 3 },
    { id: "iq_dollar_cost", title: "Investing on a schedule vs. timing the market", icon: "calendar", xpReward: 45, completed: false, estMinutes: 5 }
  ],

  // ---- Gamification ---------------------------------------------------
  badges: [
    { id: "b_streak_26", name: "Half-Year Streak", icon: "fire", description: "26 consecutive weeks of checking in.", earned: true, earnedDate: "2026-08-30", category: "streak" },
    { id: "b_nisa_starter", name: "NISA Starter", icon: "ninja", description: "Opened and funded a NISA account.", earned: true, earnedDate: "2025-11-12", category: "investing" },
    { id: "b_emergency_half", name: "Halfway to Safety", icon: "ring-buoy", description: "Reached 50% of your emergency fund goal.", earned: true, earnedDate: "2026-04-02", category: "saving" },
    { id: "b_first_optimization", name: "First Optimization", icon: "sparkles", description: "Acted on your first Optimize opportunity.", earned: true, earnedDate: "2026-02-18", category: "optimization" },
    { id: "b_level_10", name: "Level 10", icon: "military-medal", description: "Reached level 10 on your journey.", earned: true, earnedDate: "2026-06-01", category: "milestone" },
    { id: "b_debt_free", name: "Debt Free", icon: "bullseye", description: "Paid off all outstanding debt.", earned: false, category: "saving" },
    { id: "b_nisa_maxed", name: "NISA Maxed", icon: "trophy", description: "Used your full annual NISA allowance.", earned: false, category: "investing" },
    { id: "b_year_streak", name: "One-Year Streak", icon: "candle", description: "52 consecutive weeks of checking in.", earned: false, category: "streak" }
  ],

  // ---- Home insights & journey -----------------------------------------
  homeInsights: [
    { id: "hi_unassigned", icon: "zzz", text: "You have about ¥430,000/month unassigned after expenses and current contributions." },
    { id: "hi_nisa_pace", icon: "ninja", text: "At your current pace, you'll use 68% of this year's NISA allowance." },
    { id: "hi_streak", icon: "fire", text: "You're on a 26-week streak — your longest yet." }
  ],

  // ---- Guided Financial Plan Journey (~20 steps) ------------------------
  guidedPlanJourney: {
    totalXp: 620,
    steps: [
      { id: 1, phase: "Understand", title: "Welcome, Megha", body: "Let's build your financial plan together. This takes about 10 minutes and you can save and continue anytime.", actionType: "info", xpReward: 0 },
      { id: 2, phase: "Understand", title: "Here's your starting picture", body: "¥8,000,000 in savings, ¥3,200,000 invested, ¥1,000,000 in debt. Cash-rich, underinvested — a very common place to start from.", actionType: "info", xpReward: 10 },
      { id: 3, phase: "Understand", title: "What does 'financial freedom' mean to you?", body: "Pick what matters most right now — you can change this later.", actionType: "input", xpReward: 15 },
      { id: 4, phase: "Protect", title: "Every plan starts with a floor", body: "Before growth, we make sure a bad month can't knock you backward.", actionType: "info", xpReward: 0 },
      { id: 5, phase: "Protect", title: "Your emergency fund", body: "6 months of expenses is ¥2,820,000. You're already at ¥1,400,000 — half way there.", actionType: "info", xpReward: 20 },
      { id: 6, phase: "Protect", title: "Set your emergency fund pace", body: "How much can you set aside monthly until it's full?", actionType: "simulate", xpReward: 25 },
      { id: 7, phase: "Plan", title: "Where your money goes each month", body: "¥900,000 in, ¥470,000 out. That leaves ¥430,000 before any saving or investing goals.", actionType: "info", xpReward: 15 },
      { id: 8, phase: "Plan", title: "Give every yen a job", body: "We'll split your surplus across safety, goals, and growth — not just let it sit.", actionType: "input", xpReward: 25 },
      { id: 9, phase: "NISA Ninja", title: "Tax-free growth, explained", body: "NISA shelters investment gains from tax entirely, up to an annual limit.", actionType: "info", xpReward: 15 },
      { id: 10, phase: "NISA Ninja", title: "Your NISA room this year", body: "You've used ¥1,620,000 of ¥3,600,000. Closing this gap is one of the highest-value moves available to you.", actionType: "info", xpReward: 20 },
      { id: 11, phase: "NISA Ninja", title: "Set your NISA contribution", body: "Try a few monthly amounts and see the tax-free growth difference.", actionType: "simulate", xpReward: 40 },
      { id: 12, phase: "Build", title: "What to do with remaining cash", body: "Once your emergency fund and NISA are on track, idle cash beyond that is your next lever.", actionType: "info", xpReward: 15 },
      { id: 13, phase: "Build", title: "Set a cash-to-invest glide path", body: "Move surplus cash gradually rather than all at once, to smooth out market timing risk.", actionType: "simulate", xpReward: 30 },
      { id: 14, phase: "Grow", title: "A taxable strategy alongside NISA", body: "Once NISA room is used, a taxable brokerage account keeps the growth going.", actionType: "info", xpReward: 20 },
      { id: 15, phase: "Grow", title: "Shape your portfolio", body: "Based on a moderate risk tolerance, here's a starting mix across funds, stocks, and bonds.", actionType: "input", xpReward: 35 },
      { id: 16, phase: "Grow", title: "See it compound", body: "A projection of your investments over the next 20 years under a few scenarios.", actionType: "simulate", xpReward: 30 },
      { id: 17, phase: "Optimize", title: "A quick protection check", body: "Before we call this plan done, let's make sure the basics are covered.", actionType: "input", xpReward: 20 },
      { id: 18, phase: "Optimize", title: "Two more opportunities found", body: "Furusato nozei and an unopened iDeCo account could add meaningful value with low effort.", actionType: "info", xpReward: 25 },
      { id: 19, phase: "Financial Freedom", title: "Before and after", body: "See how today's plan compares with where you started.", actionType: "info", xpReward: 40 },
      { id: 20, phase: "Financial Freedom", title: "Your plan is live", body: "This is now reflected on your Home journey map. Your Fairy Godmother will check in as you go.", actionType: "info", xpReward: 200 }
    ]
  },

  // ---- Fairy Godmother contextual nudges, per tab -----------------------
  fairyNudges: {
    global: [
      "I'm here whenever you have a question — no judgment, ever.",
      "Small, steady moves beat big, occasional ones. You're doing fine."
    ],
    home: [
      "You have about ¥430,000/month unassigned. Want to see where it could go?",
      "Your streak is 26 weeks. Consistency is doing more than any single big move would."
    ],
    dreamlab: [
      "Try dragging the sliders on NISA Ninja — small monthly changes add up more than you'd expect.",
      "Not sure where to start? Emergency Fund is the lowest-risk quest to make progress on this week."
    ],
    optimize: [
      "The NISA opportunity below is low effort and high value — a good place to start.",
      "None of these are urgent. Take your time, and act on what feels right."
    ],
    grow: [
      "Your Wealth Garden is a little concentrated in index funds — that's not a bad thing, just worth knowing.",
      "Market themes are here to help you understand exposure, not to suggest a trade."
    ],
    profile: [
      "Adding your iDeCo account takes under a minute and sharpens your whole picture.",
      "Your archetype can evolve as you do — feel free to revisit it anytime."
    ]
  }
};
