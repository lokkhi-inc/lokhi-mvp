/**
 * Dream Lab — calculation engine.
 *
 * Pure, deterministic math. The Dream Engine (AI layer) decides WHAT
 * variables matter for a dream; this file decides HOW the numbers come out.
 * No randomness, no network calls, nothing dream-specific baked in beyond
 * the two named shapes below (home purchase, generic savings goal) — every
 * other dream category reuses the generic goal calculator.
 *
 * Swappable later: none of this depends on DreamEngine or the UI. It only
 * consumes plain variable maps ({ id: value }) and returns plain result
 * objects.
 */
(function () {
  "use strict";

  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

  function yearsBetween(fromIso, toIso) {
    const from = new Date(fromIso).getTime();
    const to = new Date(toIso).getTime();
    if (isNaN(from) || isNaN(to) || to <= from) return 1;
    return (to - from) / MS_PER_YEAR;
  }

  // r = monthly rate, n = months
  function amortizedMonthlyPayment(principal, annualRate, years) {
    const n = Math.max(1, Math.round(years * 12));
    const r = annualRate / 12;
    if (principal <= 0) return 0;
    if (r === 0) return principal / n;
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  function futureValue(principal, monthly, annualReturn, months) {
    const r = annualReturn / 12;
    if (r === 0) return principal + monthly * months;
    return principal * Math.pow(1 + r, months) + monthly * ((Math.pow(1 + r, months) - 1) / r);
  }

  // How many months (capped) until `monthly` contributions from `principal`
  // at `annualReturn` reach `target`. Deterministic simulation, not a
  // closed-form solve, so it stays correct even when target <= principal.
  function monthsToReach(principal, monthly, annualReturn, target, capMonths) {
    capMonths = capMonths || 600;
    if (principal >= target) return 0;
    const r = annualReturn / 12;
    let balance = principal;
    for (let m = 1; m <= capMonths; m++) {
      balance = balance * (1 + r) + monthly;
      if (balance >= target) return m;
    }
    return null; // does not reach within cap — UI should say so plainly, not alarmingly
  }

  const DEFAULT_LOAN_TERM_YEARS = 35; // Example assumption — typical long-horizon JP mortgage term.

  /**
   * Home-purchase simulation. Expects a variable map keyed by the ids used
   * in the "home" fixture template (see dreamlab-data.js).
   */
  function computeHomeSimulation(vars, dream) {
    const propertyPrice = num(vars.property_price);
    const mortgageRate = num(vars.mortgage_rate);
    const downPayment = num(vars.down_payment);
    const upfrontCosts = num(vars.upfront_costs);
    const comfortableMonthly = num(vars.monthly_payment);
    const inflation = num(vars.inflation);
    const priceGrowth = num(vars.tokyo_property_growth != null ? vars.tokyo_property_growth : vars.price_growth);
    const rentalIncome = num(vars.rental_income);

    const loanAmount = Math.max(0, propertyPrice - downPayment);
    const requiredMonthlyPayment = amortizedMonthlyPayment(loanAmount, mortgageRate, DEFAULT_LOAN_TERM_YEARS);
    const totalPaidOverLoan = requiredMonthlyPayment * DEFAULT_LOAN_TERM_YEARS * 12;
    const totalInterest = Math.max(0, totalPaidOverLoan - loanAmount);
    const totalInitialCash = downPayment + upfrontCosts;
    const monthlyAfterRental = Math.max(0, requiredMonthlyPayment - rentalIncome);
    const monthlyGap = requiredMonthlyPayment - comfortableMonthly;

    const yearsToTarget = dream && dream.targetDate ? yearsBetween(new Date().toISOString(), dream.targetDate) : 5;
    const futurePrice = propertyPrice * Math.pow(1 + priceGrowth, yearsToTarget);
    const futureUpfrontCosts = upfrontCosts * Math.pow(1 + inflation, yearsToTarget);

    return {
      loanAmount,
      requiredMonthlyPayment,
      comfortableMonthly,
      monthlyGap,
      totalInitialCash,
      totalInterest,
      totalPaidOverLoan,
      monthlyAfterRental,
      futurePrice,
      futureUpfrontCosts,
      yearsToTarget,
      loanTermYears: DEFAULT_LOAN_TERM_YEARS
    };
  }

  /**
   * Generic goal simulation — used for any dream category without a
   * dedicated calculator (vehicle, travel, wedding, gadget, and every
   * category the Dream Engine hasn't been taught a specialized model for
   * yet).
   */
  function computeGenericGoalSimulation(vars) {
    const target = num(vars.target_amount != null ? vars.target_amount : vars.baseline_amount);
    const current = num(vars.current_progress);
    const monthly = num(vars.monthly_contribution);
    const expectedReturn = num(vars.expected_return);

    const monthsToGoal = monthsToReach(current, monthly, expectedReturn, target);
    const projected3yr = futureValue(current, monthly, expectedReturn, 36);
    const gapToGoal = Math.max(0, target - current);

    return {
      target,
      current,
      monthly,
      monthsToGoal,
      yearsToGoal: monthsToGoal == null ? null : Math.round((monthsToGoal / 12) * 10) / 10,
      projected3yr,
      gapToGoal
    };
  }

  /**
   * Runs `computeFn` once at baseline, then once per editable variable with
   * that variable bumped +10% (or +2 percentage points for values already
   * expressed as a 0..1 rate), and ranks variables by how much they moved
   * `outputKey`. This is intentionally naive — a placeholder for a real
   * sensitivity-analysis engine — but the interface (variables in, ranked
   * list out) won't need to change when that engine arrives.
   */
  function computeSensitivity(variables, varsMap, computeFn, outputKey) {
    const baseline = computeFn(varsMap);
    const baseOut = baseline[outputKey];
    if (baseOut == null || !isFinite(baseOut)) return [];

    const impacts = variables
      .filter((v) => v.editable)
      .map((v) => {
        const bumped = Object.assign({}, varsMap);
        const current = num(varsMap[v.id]);
        const isRate = Math.abs(current) > 0 && Math.abs(current) < 1;
        bumped[v.id] = isRate ? current + 0.02 : current * 1.1;
        const result = computeFn(bumped);
        const out = result[outputKey];
        const delta = out == null ? 0 : Math.abs(out - baseOut);
        return { id: v.id, name: v.name, delta };
      })
      .sort((a, b) => b.delta - a.delta);

    const max = impacts.length ? impacts[0].delta : 0;
    return impacts.map((i, idx) => ({
      id: i.id,
      name: i.name,
      rank: idx + 1,
      impactPct: max > 0 ? Math.round((i.delta / max) * 100) : 0
    }));
  }

  function num(v) {
    return typeof v === "number" && !isNaN(v) ? v : 0;
  }

  window.DreamCalculations = {
    amortizedMonthlyPayment,
    futureValue,
    monthsToReach,
    computeHomeSimulation,
    computeGenericGoalSimulation,
    computeSensitivity,
    DEFAULT_LOAN_TERM_YEARS
  };
})();
