import { useState, useEffect, useRef } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg: "#07090F",
  surface: "#0E1117",
  surfaceHigh: "#151B27",
  border: "#1E2A3D",
  borderLight: "#243347",
  accent: "#2563EB",
  accentBright: "#3B82F6",
  accentGlow: "rgba(37,99,235,0.12)",
  accentGlow2: "rgba(59,130,246,0.06)",
  emerald: "#10B981",
  emeraldGlow: "rgba(16,185,129,0.12)",
  amber: "#F59E0B",
  amberGlow: "rgba(245,158,11,0.1)",
  rose: "#F43F5E",
  roseGlow: "rgba(244,63,94,0.1)",
  violet: "#8B5CF6",
  violetGlow: "rgba(139,92,246,0.1)",
  text: "#F0F4FF",
  textSub: "#8B9BB4",
  textDim: "#4A5568",
  font: "'DM Mono', 'Courier New', monospace",
  fontSans: "'DM Sans', 'Helvetica Neue', sans-serif",
};

// ─── SCORING ENGINE ───────────────────────────────────────────────────────────

const DOMAIN_WEIGHTS = {
  // [tier1_1-25, tier2_25-100, tier3_100-500]
  compliance:    [0.35, 0.25, 0.15],
  payroll:       [0.20, 0.15, 0.10],
  hiring:        [0.15, 0.15, 0.15],
  policies:      [0.10, 0.15, 0.10],
  performance:   [0.05, 0.10, 0.15],
  compensation:  [0.05, 0.10, 0.15],
  culture:       [0.05, 0.05, 0.10],
  analytics:     [0.05, 0.05, 0.10],
};

const INDUSTRY_MODIFIERS = {
  "Healthcare / Medical":        { compliance: 1.3, payroll: 1.1, hiring: 1.2 },
  "Construction / Trades":       { compliance: 1.35, payroll: 1.15, culture: 0.8 },
  "Restaurant / Hospitality":    { hiring: 1.25, payroll: 1.2, culture: 1.15 },
  "Professional Services":       { performance: 1.2, compensation: 1.15, policies: 1.1 },
  "Technology / Software":       { compensation: 1.2, hiring: 1.15, analytics: 1.25 },
  "Manufacturing":               { compliance: 1.3, payroll: 1.1, policies: 1.1 },
  "Retail / E-commerce":         { hiring: 1.2, payroll: 1.15, compliance: 1.1 },
  "Financial Services":          { compliance: 1.2, policies: 1.2, performance: 1.1 },
  "Education / Nonprofit":       { compliance: 1.1, culture: 1.2, compensation: 0.9 },
  "Other":                       {},
};

const STAGE_MODIFIERS = {
  "Just started (under 2 years)":    { compliance: 1.2, policies: 0.9, analytics: 0.7 },
  "Growing fast (2–5 years)":        { hiring: 1.2, performance: 1.1, compliance: 1.1 },
  "Stable & established (5+ years)": { performance: 1.15, analytics: 1.2, culture: 1.1 },
  "Restructuring or pivoting":       { compliance: 1.25, payroll: 1.1, culture: 1.15 },
};

const PEER_BENCHMARKS = {
  "1–10":   { "Restaurant / Hospitality": 42, "Construction / Trades": 38, "Technology / Software": 51, default: 44 },
  "11–25":  { "Restaurant / Hospitality": 48, "Construction / Trades": 45, "Technology / Software": 58, default: 52 },
  "26–50":  { "Restaurant / Hospitality": 54, "Construction / Trades": 52, "Technology / Software": 65, default: 59 },
  "51–100": { "Restaurant / Hospitality": 60, "Construction / Trades": 58, "Technology / Software": 70, default: 64 },
  "100+":   { "Restaurant / Hospitality": 65, "Construction / Trades": 62, "Technology / Software": 75, default: 69 },
};

function getSizeTier(size) {
  if (size === "1–10" || size === "11–25") return 0;
  if (size === "26–50" || size === "51–100") return 1;
  return 2;
}

function getPeerBenchmark(size, industry) {
  const sizeGroup = PEER_BENCHMARKS[size] || PEER_BENCHMARKS["11–25"];
  return sizeGroup[industry] || sizeGroup.default;
}

function computeScore(answers) {
  const tier = getSizeTier(answers.size || "11–25");
  const industry = answers.industry || "Other";
  const stage = answers.stage || "Stable & established (5+ years)";
  const indMod = INDUSTRY_MODIFIERS[industry] || {};
  const stageMod = STAGE_MODIFIERS[stage] || {};

  // Domain scores from answers (0–1 scale)
  const domainRaw = {
    compliance:   computeComplianceDomain(answers),
    payroll:      computePayrollDomain(answers),
    hiring:       computeHiringDomain(answers),
    policies:     computePoliciesDomain(answers),
    performance:  computePerformanceDomain(answers),
    compensation: computeCompensationDomain(answers),
    culture:      computeCultureDomain(answers),
    analytics:    computeAnalyticsDomain(answers),
  };

  let totalWeighted = 0;
  let totalWeight = 0;
  const domainScores = {};

  for (const domain of Object.keys(DOMAIN_WEIGHTS)) {
    const baseWeight = DOMAIN_WEIGHTS[domain][tier];
    const iMod = Math.min(indMod[domain] || 1, 1.35);
    const sMod = Math.min(stageMod[domain] || 1, 1.25);
    const effectiveWeight = Math.min(baseWeight * iMod * sMod, 0.40);
    const raw = domainRaw[domain];
    totalWeighted += raw * effectiveWeight;
    totalWeight += effectiveWeight;
    domainScores[domain] = Math.round(raw * 100);
  }

  const normalised = totalWeight > 0 ? totalWeighted / totalWeight : 0;
  let score = Math.round(30 + normalised * 65);

  // Critical gap ceiling
  const hasCriticalGap = checkCriticalGaps(answers);
  if (hasCriticalGap) score = Math.min(score, 70);

  score = Math.max(18, Math.min(score, 98));
  return { score, domainScores, hasCriticalGap };
}

function checkCriticalGaps(a) {
  return (
    a.i9 === "No" ||
    a.workersComp === "No" ||
    a.payrollSystem === "Spreadsheets / manual" ||
    (a.handbook === "No handbook" && parseInt((a.size||"11").split("–")[0]) >= 20) ||
    a.wageHour === "No — not sure if we comply" ||
    a.harassmentPolicy === "No"
  );
}

function computeComplianceDomain(a) {
  let s = 0, n = 0;
  if (a.i9) { s += a.i9 === "Yes" ? 1 : a.i9 === "Mostly" ? 0.5 : 0; n++; }
  if (a.workersComp) { s += a.workersComp === "Yes" ? 1 : 0; n++; }
  if (a.wageHour) { s += a.wageHour === "Yes — we're compliant" ? 1 : a.wageHour === "Mostly" ? 0.6 : 0.1; n++; }
  if (a.harassmentPolicy) { s += a.harassmentPolicy === "Yes, updated in past year" ? 1 : a.harassmentPolicy === "Yes, but outdated" ? 0.5 : 0; n++; }
  if (a.multiState) { s += a.multiState === "No — one state" ? 0.9 : a.multiState === "Yes, and we manage it well" ? 1 : 0.4; n++; }
  return n > 0 ? s / n : 0.5;
}

function computePayrollDomain(a) {
  let s = 0, n = 0;
  if (a.payrollSystem) {
    const scores = { "Gusto": 0.9, "ADP": 0.95, "Paychex": 0.9, "Rippling": 0.95, "QuickBooks Payroll": 0.8, "Spreadsheets / manual": 0.2, "Other": 0.7 };
    s += scores[a.payrollSystem] || 0.7; n++;
  }
  if (a.workerClass) { s += a.workerClass === "Yes — all reviewed recently" ? 1 : a.workerClass === "We use both, not sure" ? 0.3 : 0.7; n++; }
  if (a.payTransparency) { s += a.payTransparency === "Yes" ? 1 : a.payTransparency === "Working on it" ? 0.6 : 0.2; n++; }
  return n > 0 ? s / n : 0.5;
}

function computeHiringDomain(a) {
  let s = 0, n = 0;
  if (a.offerLetters) { s += a.offerLetters === "Yes — standard template" ? 1 : a.offerLetters === "Sometimes" ? 0.5 : 0.1; n++; }
  if (a.onboarding) { s += a.onboarding === "Structured 30/60/90 plan" ? 1 : a.onboarding === "Basic first-day process" ? 0.5 : a.onboarding === "Minimal / informal" ? 0.2 : 0; n++; }
  if (a.backgroundChecks) { s += a.backgroundChecks === "Yes — for all roles" ? 1 : a.backgroundChecks === "For some roles" ? 0.6 : 0.1; n++; }
  return n > 0 ? s / n : 0.5;
}

function computePoliciesDomain(a) {
  let s = 0, n = 0;
  const hbScores = { "Yes — updated in past year": 1, "Yes — 1–3 years old": 0.6, "Yes — over 3 years old": 0.3, "No handbook": 0 };
  if (a.handbook) { s += hbScores[a.handbook] ?? 0.5; n++; }
  if (a.harassmentTraining) { s += a.harassmentTraining === "Yes — all employees" ? 1 : a.harassmentTraining === "Some employees" ? 0.5 : 0.1; n++; }
  if (a.discipline) { s += a.discipline === "Always documented" ? 1 : a.discipline === "Usually" ? 0.65 : a.discipline === "Rarely" ? 0.2 : 0; n++; }
  return n > 0 ? s / n : 0.5;
}

function computePerformanceDomain(a) {
  let s = 0, n = 0;
  const pmScores = { "Formal reviews twice/year": 1, "Formal annual reviews": 0.8, "Regular informal check-ins": 0.5, "Manager decides": 0.3, "No formal process": 0.1 };
  if (a.perfReviews) { s += pmScores[a.perfReviews] ?? 0.4; n++; }
  if (a.goalSetting) { s += a.goalSetting === "Yes — OKRs or clear goals" ? 1 : a.goalSetting === "Informally" ? 0.5 : 0.1; n++; }
  if (a.managerTraining) { s += a.managerTraining === "Yes" ? 1 : a.managerTraining === "Some managers" ? 0.5 : 0.1; n++; }
  return n > 0 ? s / n : 0.4;
}

function computeCompensationDomain(a) {
  let s = 0, n = 0;
  if (a.compStructure) { s += a.compStructure === "Formal pay bands/grades" ? 1 : a.compStructure === "Market data informed" ? 0.7 : a.compStructure === "Mostly gut feel" ? 0.2 : 0; n++; }
  if (a.benefits) { s += a.benefits === "Strong benefits package" ? 1 : a.benefits === "Basic benefits" ? 0.6 : a.benefits === "Minimal benefits" ? 0.2 : 0; n++; }
  if (a.payEquity) { s += a.payEquity === "Yes — audited recently" ? 1 : a.payEquity === "We think so" ? 0.4 : 0.1; n++; }
  return n > 0 ? s / n : 0.4;
}

function computeCultureDomain(a) {
  let s = 0, n = 0;
  if (a.engagement) { s += a.engagement === "Yes — formal surveys with action plans" ? 1 : a.engagement === "Informal check-ins" ? 0.5 : a.engagement === "We don't measure it" ? 0.1 : 0; n++; }
  if (a.turnover) { s += a.turnover === "Below industry average" ? 1 : a.turnover === "About average" ? 0.6 : a.turnover === "Above average" ? 0.2 : 0.3; n++; }
  if (a.epli) { s += a.epli === "Yes" ? 0.8 : a.epli === "No" ? 0.1 : 0.3; n++; }
  return n > 0 ? s / n : 0.4;
}

function computeAnalyticsDomain(a) {
  let s = 0, n = 0;
  if (a.hrisSystem) { s += a.hrisSystem === "Yes — full HRIS" ? 1 : a.hrisSystem === "Basic payroll only" ? 0.4 : 0.1; n++; }
  if (a.hrMetrics) { s += a.hrMetrics === "Yes — tracked regularly" ? 1 : a.hrMetrics === "Sometimes" ? 0.5 : 0.1; n++; }
  return n > 0 ? s / n : 0.3;
}

function getScoreBand(score) {
  if (score <= 40) return { label: "Reactive", color: T.rose, desc: "Significant compliance and people risk. Immediate action required." };
  if (score <= 65) return { label: "Developing", color: T.amber, desc: "Foundation in place, but important gaps remain." };
  if (score <= 85) return { label: "Strategic", color: T.emerald, desc: "Strong HR operations with room to reach best-in-class." };
  return { label: "Systemic", color: T.violet, desc: "Top-decile HR. Fewer than 10% of companies reach this level." };
}

function getDomainLabel(key) {
  return { compliance: "Compliance & Risk", payroll: "Payroll & Wage/Hour", hiring: "Hiring & Onboarding", policies: "Policies & Handbook", performance: "Performance Mgmt", compensation: "Compensation & Benefits", culture: "Culture & Retention", analytics: "HR Data & Analytics" }[key] || key;
}

// ─── QUESTIONS ─────────────────────────────────────────────────────────────────

const QUESTIONS = [
  // ── CONTEXT (always shown) ─────────────────────────────────────────────
  {
    id: "intro",
    type: "intro",
    section: "Welcome",
  },
  {
    id: "industry",
    key: "industry",
    type: "choice",
    section: "About Your Business",
    q: "What industry are you in?",
    sub: "We use this to weight your score the way your industry demands — not with a generic formula.",
    choices: ["Healthcare / Medical","Construction / Trades","Restaurant / Hospitality","Professional Services","Technology / Software","Manufacturing","Retail / E-commerce","Financial Services","Education / Nonprofit","Other"],
    domain: null,
    tier: null,
  },
  {
    id: "size",
    key: "size",
    type: "choice",
    section: "About Your Business",
    q: "How many W-2 employees do you have?",
    sub: "Count everyone on your regular payroll — full-time and part-time. Don't include contractors yet.",
    choices: ["1–10","11–25","26–50","51–100","100+"],
    domain: null,
  },
  {
    id: "stage",
    key: "stage",
    type: "choice",
    section: "About Your Business",
    q: "Where are you in your business journey?",
    sub: "Your stage determines what 'great HR' looks like for your company right now.",
    choices: ["Just started (under 2 years)","Growing fast (2–5 years)","Stable & established (5+ years)","Restructuring or pivoting"],
    domain: null,
  },

  // ── COMPLIANCE ──────────────────────────────────────────────────────────
  {
    id: "i9",
    key: "i9",
    type: "choice",
    section: "Compliance & Risk",
    q: "Do you complete I-9 forms for every new hire within 3 days of their start date?",
    sub: "The I-9 verifies every employee's right to work in the US. ICE fines run $281–$2,789 per form error.",
    choices: ["Yes","Mostly — some may slip","No","Not sure what an I-9 is"],
    domain: "compliance",
    tier: "critical",
  },
  {
    id: "workersComp",
    key: "workersComp",
    type: "choice",
    section: "Compliance & Risk",
    q: "Do you have active workers' compensation insurance?",
    sub: "Required in every state except Texas. Operating without it risks fines, lawsuits, and criminal liability.",
    choices: ["Yes","No","Not sure — we use a PEO or contractor"],
    domain: "compliance",
    tier: "critical",
  },
  {
    id: "wageHour",
    key: "wageHour",
    type: "choice",
    section: "Compliance & Risk",
    q: "Are you confident your employees are paid correctly — minimum wage, overtime, and exempt vs. non-exempt status?",
    sub: "Wage-and-hour violations are the #1 source of employment lawsuits. Misclassifying a single role can cost six figures.",
    choices: ["Yes — we're compliant","Mostly — but I have some doubts","No — not sure if we comply","We're under active review or investigation"],
    domain: "compliance",
    tier: "critical",
  },
  {
    id: "multiState",
    key: "multiState",
    type: "choice",
    section: "Compliance & Risk",
    q: "Do you have employees working in multiple states?",
    sub: "One remote worker in California, New York, or Illinois can trigger significantly different legal obligations.",
    choices: ["No — one state only","Yes, and we manage it well","Yes, but we're not sure what each state requires","Not sure"],
    domain: "compliance",
    tier: "important",
    showIf: null,
  },
  {
    id: "harassmentPolicy",
    key: "harassmentPolicy",
    type: "choice",
    section: "Compliance & Risk",
    q: "Do you have a written anti-harassment and anti-discrimination policy?",
    sub: "Without a written policy, you lose your primary legal defense if an employee files a harassment claim.",
    choices: ["Yes, updated in past year","Yes, but outdated","No","Not sure"],
    domain: "compliance",
    tier: "critical",
  },

  // ── PAYROLL ─────────────────────────────────────────────────────────────
  {
    id: "payrollSystem",
    key: "payrollSystem",
    type: "choice",
    section: "Payroll & Classification",
    q: "What do you use to run payroll?",
    sub: "Your payroll system is the backbone of compliance. Manual payroll is one of the highest-risk setups.",
    choices: ["Gusto","ADP","Paychex","Rippling","QuickBooks Payroll","Spreadsheets / manual","A PEO handles it","Other"],
    domain: "payroll",
    tier: "critical",
  },
  {
    id: "workerClass",
    key: "workerClass",
    type: "choice",
    section: "Payroll & Classification",
    q: "If you use independent contractors (1099s), has someone reviewed whether they're correctly classified?",
    sub: "Misclassifying employees as contractors is the IRS and DOL's top enforcement target — back taxes, penalties, and benefits claims follow.",
    choices: ["Yes — all reviewed recently","We don't use contractors","We use both, not sure if it's right","We use contractors but never reviewed it"],
    domain: "payroll",
    tier: "critical",
    showIf: null,
  },
  {
    id: "payTransparency",
    key: "payTransparency",
    type: "choice",
    section: "Payroll & Classification",
    q: "If you post job listings, do you include salary ranges as required by law?",
    sub: "17+ states and cities (including CA, NY, CO, IL, WA) now require salary ranges in job postings. Violations carry fines and attract litigation.",
    choices: ["Yes","No — we don't include ranges","Working on it","We don't post job listings","Not sure if it applies to us"],
    domain: "payroll",
    tier: "important",
  },

  // ── HIRING ──────────────────────────────────────────────────────────────
  {
    id: "offerLetters",
    key: "offerLetters",
    type: "choice",
    section: "Hiring & Onboarding",
    q: "When you hire someone, do you give them a written offer letter before their first day?",
    sub: "Verbal offers create disputes. A written offer letter protects both sides and sets expectations.",
    choices: ["Yes — standard template","Yes — custom each time","Sometimes","No — verbal only"],
    domain: "hiring",
    tier: "important",
  },
  {
    id: "onboarding",
    key: "onboarding",
    type: "choice",
    section: "Hiring & Onboarding",
    q: "What does your onboarding process look like for new hires?",
    sub: "Companies with structured onboarding see 82% better retention in the first year — and avoid early-stage compliance gaps.",
    choices: ["Structured 30/60/90 plan","Basic first-day process","Minimal / informal","No real onboarding process"],
    domain: "hiring",
    tier: "important",
  },
  {
    id: "backgroundChecks",
    key: "backgroundChecks",
    type: "choice",
    section: "Hiring & Onboarding",
    q: "Do you run background checks on new hires?",
    sub: "Background checks must follow FCRA requirements — including a specific standalone disclosure and pre-adverse/adverse action notices.",
    choices: ["Yes — for all roles","For some roles","No","Not required in our industry"],
    domain: "hiring",
    tier: "important",
  },

  // ── POLICIES ─────────────────────────────────────────────────────────────
  {
    id: "handbook",
    key: "handbook",
    type: "choice",
    section: "Policies & Documentation",
    q: "Do you have an employee handbook, and how current is it?",
    sub: "An outdated handbook is almost as risky as no handbook — state laws change frequently, and your handbook must keep up.",
    choices: ["Yes — updated in past year","Yes — 1–3 years old","Yes — over 3 years old","No handbook"],
    domain: "policies",
    tier: "important",
  },
  {
    id: "harassmentTraining",
    key: "harassmentTraining",
    type: "choice",
    section: "Policies & Documentation",
    q: "Have employees completed anti-harassment training in the past two years?",
    sub: "California, New York, Illinois, Connecticut, and others mandate this training. Without it, you lose the Faragher/Ellerth defense in harassment cases.",
    choices: ["Yes — all employees","Some employees","No","Not sure"],
    domain: "policies",
    tier: "important",
  },
  {
    id: "discipline",
    key: "discipline",
    type: "choice",
    section: "Policies & Documentation",
    q: "When you discipline or let someone go, do you document it in writing?",
    sub: "Verbal-only terminations are the #1 thing that turns a straightforward separation into an expensive wrongful termination claim.",
    choices: ["Always documented","Usually","Rarely","Never — all verbal"],
    domain: "policies",
    tier: "important",
  },

  // ── PERFORMANCE ──────────────────────────────────────────────────────────
  {
    id: "perfReviews",
    key: "perfReviews",
    type: "choice",
    section: "Performance Management",
    q: "How do you handle employee performance reviews?",
    sub: "Without formal reviews, terminations look arbitrary and promotions look like favoritism — both create legal risk.",
    choices: ["Formal reviews twice/year","Formal annual reviews","Regular informal check-ins","Manager decides","No formal process"],
    domain: "performance",
    tier: "important",
    showIf: (a) => !["1–10"].includes(a.size),
  },
  {
    id: "goalSetting",
    key: "goalSetting",
    type: "choice",
    section: "Performance Management",
    q: "Do employees have clear, written goals or objectives for their role?",
    sub: "Goal clarity is the #1 driver of employee engagement according to Gallup's State of the American Workplace.",
    choices: ["Yes — OKRs or clear goals","Informally — they know what's expected","No — it's vague","Not consistently"],
    domain: "performance",
    tier: "important",
    showIf: (a) => !["1–10"].includes(a.size),
  },
  {
    id: "managerTraining",
    key: "managerTraining",
    type: "choice",
    section: "Performance Management",
    q: "Have your managers received training on how to manage people — including how to handle FMLA requests, accommodations, and performance issues?",
    sub: "Manager missteps are behind the majority of EEOC charges, FMLA violations, and employee lawsuits.",
    choices: ["Yes","Some managers","No","We don't have formal managers yet"],
    domain: "performance",
    tier: "important",
    showIf: (a) => parseInt((a.size||"11").split("–")[0]) >= 11,
  },

  // ── COMPENSATION ─────────────────────────────────────────────────────────
  {
    id: "compStructure",
    key: "compStructure",
    type: "choice",
    section: "Compensation & Benefits",
    q: "How do you set employee pay?",
    sub: "Ad hoc pay decisions are the fastest path to pay discrimination claims and retention problems.",
    choices: ["Formal pay bands/grades","Market data informed","Mostly gut feel / negotiation","We copy competitors"],
    domain: "compensation",
    tier: "important",
  },
  {
    id: "benefits",
    key: "benefits",
    type: "choice",
    section: "Compensation & Benefits",
    q: "How would you describe your benefits package?",
    sub: "Benefits are often the deciding factor in whether top candidates join — and whether they stay.",
    choices: ["Strong benefits package (health, 401k, PTO, more)","Basic benefits (health + PTO)","Minimal benefits","No benefits currently"],
    domain: "compensation",
    tier: "important",
  },
  {
    id: "payEquity",
    key: "payEquity",
    type: "choice",
    section: "Compensation & Benefits",
    q: "Have you reviewed whether men and women — and people of different backgrounds — are paid equitably for similar work?",
    sub: "Pay equity lawsuits are rising sharply. California and Illinois require formal pay data reporting at 100+ employees.",
    choices: ["Yes — audited recently","We think so — but never formally checked","No","Not relevant at our size"],
    domain: "compensation",
    tier: "important",
    showIf: (a) => parseInt((a.size||"11").split("–")[0]) >= 26,
  },

  // ── CULTURE ──────────────────────────────────────────────────────────────
  {
    id: "engagement",
    key: "engagement",
    type: "choice",
    section: "Culture & Retention",
    q: "Do you measure employee engagement or satisfaction?",
    sub: "Gallup reports that highly engaged teams show 23% greater profitability. But you can't manage what you don't measure.",
    choices: ["Yes — formal surveys with action plans","Informal check-ins only","We don't measure it","We're too small to worry about this yet"],
    domain: "culture",
    tier: "important",
    showIf: (a) => parseInt((a.size||"11").split("–")[0]) >= 11,
  },
  {
    id: "turnover",
    key: "turnover",
    type: "choice",
    section: "Culture & Retention",
    q: "How is your employee turnover compared to your industry?",
    sub: "SHRM estimates replacing one employee costs 50–200% of their annual salary. High turnover is one of the most expensive hidden costs in business.",
    choices: ["Below industry average","About average","Above average","We don't track turnover","Not sure what our industry average is"],
    domain: "culture",
    tier: "important",
  },
  {
    id: "epli",
    key: "epli",
    type: "choice",
    section: "Culture & Retention",
    q: "Do you have Employment Practices Liability Insurance (EPLI)?",
    sub: "EPLI covers you if an employee sues for discrimination, harassment, or wrongful termination. Without it, legal defense alone can cost $50K–$500K.",
    choices: ["Yes","No","Not sure"],
    domain: "culture",
    tier: "important",
  },

  // ── ANALYTICS ────────────────────────────────────────────────────────────
  {
    id: "hrisSystem",
    key: "hrisSystem",
    type: "choice",
    section: "HR Data & Analytics",
    q: "Do you have an HRIS — a central system that tracks employee data, time off, and job history?",
    sub: "An HRIS is your single source of truth for people data. Without one, decisions happen on gut feel and spreadsheets.",
    choices: ["Yes — full HRIS (Workday, BambooHR, Rippling, etc.)","Basic payroll only","No — spreadsheets or email","Not sure"],
    domain: "analytics",
    tier: "important",
    showIf: (a) => parseInt((a.size||"11").split("–")[0]) >= 11,
  },
  {
    id: "hrMetrics",
    key: "hrMetrics",
    type: "choice",
    section: "HR Data & Analytics",
    q: "Do you track key HR metrics like turnover rate, time-to-hire, or cost-per-hire?",
    sub: "What gets measured gets managed. Companies that track HR metrics make 2× better talent decisions per McKinsey.",
    choices: ["Yes — tracked regularly","Sometimes","No","Not sure what to track"],
    domain: "analytics",
    tier: "optional",
    showIf: (a) => parseInt((a.size||"11").split("–")[0]) >= 26,
  },

  // ── RESULTS ────────────────────────────────────────────────────────────────
  {
    id: "results",
    type: "results",
    section: "Your PeopleScore",
  },
];

// ─── ANIMATED SCORE ───────────────────────────────────────────────────────────
function AnimatedScore({ target, size = 96, color = T.accentBright }) {
  const [displayed, setDisplayed] = useState(30);
  useEffect(() => {
    let start = null;
    const from = displayed;
    const duration = 800;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(from + (target - from) * ease));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return (
    <span style={{ fontSize: size, fontWeight: 800, color, fontFamily: T.font, lineHeight: 1 }}>
      {displayed}
    </span>
  );
}

// ─── LIVE SCORE WIDGET ────────────────────────────────────────────────────────
function LiveScore({ score, band, confidence, compact }) {
  if (compact) return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: band.color, fontFamily: T.font, lineHeight: 1 }}>
        {score}
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: band.color, textTransform: "uppercase", letterSpacing: "1.5px" }}>{band.label}</div>
        <div style={{ fontSize: 10, color: T.textDim }}>±{confidence} pts</div>
      </div>
    </div>
  );
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: T.textDim, textTransform: "uppercase", marginBottom: 8 }}>Live PeopleScore™</div>
      <AnimatedScore target={score} size={72} color={band.color} />
      <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>±{confidence} confidence</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: band.color, marginTop: 6, textTransform: "uppercase", letterSpacing: "1px" }}>{band.label}</div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function PeopleScoreAI() {
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);
  const containerRef = useRef(null);

  // Filter questions based on branching
  const visibleQuestions = QUESTIONS.filter(q => {
    if (!q.showIf) return true;
    return q.showIf(answers);
  });

  const currentQ = visibleQuestions[qIndex];
  const isLast = qIndex === visibleQuestions.length - 1;
  const progress = Math.round(((qIndex) / (visibleQuestions.length - 1)) * 100);

  // Scoring
  const answeredCount = Object.keys(answers).length;
  const { score, domainScores, hasCriticalGap } = computeScore(answers);
  const confidence = Math.max(3, Math.round(20 - answeredCount * 0.7));
  const scoreToShow = answeredCount < 2 ? 30 : score;
  const band = getScoreBand(scoreToShow);
  const peerBenchmark = getPeerBenchmark(answers.size || "11–25", answers.industry || "Other");

  const advance = (choice) => {
    if (animating) return;
    const newAnswers = currentQ.key ? { ...answers, [currentQ.key]: choice } : answers;
    setAnswers(newAnswers);
    setAnimating(true);
    setTimeout(() => {
      setQIndex(i => Math.min(i + 1, visibleQuestions.length - 1));
      setSelected(null);
      setAnimating(false);
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 280);
  };

  const goBack = () => {
    if (qIndex > 0) { setQIndex(i => i - 1); setSelected(null); }
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.fontSans, display: "flex", flexDirection: "column", overflowX: "hidden" }}>

      {/* TOP BAR */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(7,9,15,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.accentBright, letterSpacing: "-0.5px" }}>
          PeopleScore<span style={{ color: T.textDim }}>.ai</span>
        </div>

        {currentQ?.type !== "intro" && currentQ?.type !== "results" && (
          <LiveScore score={scoreToShow} band={band} confidence={confidence} compact />
        )}

        {currentQ?.type !== "intro" && currentQ?.type !== "results" && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.textDim }}>{qIndex} of {visibleQuestions.length - 2} questions</div>
            <div style={{ width: 80, height: 3, background: T.border, borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${T.accent}, ${T.violet})`, borderRadius: 2, transition: "width 0.4s ease" }} />
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", alignItems: currentQ?.type === "results" ? "flex-start" : "center", justifyContent: "center", padding: "40px 20px 80px" }}>
        <div style={{ width: "100%", maxWidth: currentQ?.type === "results" ? 900 : 640, opacity: animating ? 0 : 1, transform: animating ? "translateY(10px)" : "translateY(0)", transition: "opacity 0.28s ease, transform 0.28s ease" }}>

          {/* ── INTRO ── */}
          {currentQ?.type === "intro" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "inline-block", background: T.accentGlow, border: `1px solid ${T.accent}`, borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, color: T.accentBright, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 24, fontFamily: T.font }}>
                PeopleScore™ · HR Diagnostic
              </div>
              <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: 20, background: `linear-gradient(135deg, ${T.text} 0%, ${T.accentBright} 60%, ${T.violet} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Know exactly where your HR stands.
              </h1>
              <p style={{ fontSize: 18, color: T.textSub, lineHeight: 1.7, marginBottom: 12, maxWidth: 480, margin: "0 auto 12px" }}>
                Answer ~15 questions. Get an enterprise-grade HR audit score — personalized to your industry, size, and stage.
              </p>
              <p style={{ fontSize: 14, color: T.textDim, marginBottom: 40 }}>Takes about 8–12 minutes · No signup required</p>

              {/* Score preview */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 24, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 32px", marginBottom: 40 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: T.accentBright, fontFamily: T.font, lineHeight: 1 }}>—</div>
                  <div style={{ fontSize: 11, color: T.textDim, marginTop: 4, fontFamily: T.font }}>YOUR SCORE</div>
                </div>
                <div style={{ width: 1, height: 48, background: T.border }} />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>What you'll get:</div>
                  {["Personalized HR score (0–100)", "Industry & size-adjusted weighting", "Domain breakdown with gaps", "Peer benchmark comparison", "Prioritized action steps"].map(item => (
                    <div key={item} style={{ fontSize: 13, color: T.textSub, display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ color: T.emerald }}>✓</span> {item}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button onClick={() => advance(null)} style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, border: "none", borderRadius: 12, padding: "16px 40px", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: "-0.2px", boxShadow: `0 0 32px ${T.accentGlow}` }}>
                  Start My HR Audit →
                </button>
                <div style={{ fontSize: 12, color: T.textDim, marginTop: 12 }}>Your score starts the moment you answer the first question</div>
              </div>
            </div>
          )}

          {/* ── QUESTION ── */}
          {currentQ?.type === "choice" && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: T.accentBright, textTransform: "uppercase", marginBottom: 8, fontFamily: T.font }}>
                {currentQ.section}
              </div>

              {currentQ.tier === "critical" && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.roseGlow, border: `1px solid ${T.rose}40`, borderRadius: 6, padding: "4px 10px", marginBottom: 12, fontSize: 11, color: T.rose, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                  <span>⚠</span> Critical — weighted 3× in your score
                </div>
              )}

              <h2 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.5px", marginBottom: 10, color: T.text }}>
                {currentQ.q}
              </h2>
              <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.65, marginBottom: 32 }}>
                {currentQ.sub}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentQ.choices.map((choice) => {
                  const isSelected = selected === choice;
                  const prev = currentQ.key ? answers[currentQ.key] : null;
                  const isPrev = prev === choice;
                  return (
                    <button
                      key={choice}
                      onClick={() => { setSelected(choice); setTimeout(() => advance(choice), 180); }}
                      style={{
                        background: isSelected ? `linear-gradient(135deg, ${T.accent}22, ${T.violet}11)` : isPrev ? T.surfaceHigh : T.surface,
                        border: `1.5px solid ${isSelected ? T.accentBright : isPrev ? T.borderLight : T.border}`,
                        borderRadius: 12,
                        padding: "14px 20px",
                        color: isSelected ? T.text : T.textSub,
                        fontSize: 15,
                        fontWeight: isSelected || isPrev ? 600 : 400,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${isSelected ? T.accentBright : T.border}`, background: isSelected ? T.accentBright : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, color: "#fff", transition: "all 0.15s" }}>
                        {(isSelected || isPrev) && "✓"}
                      </span>
                      {choice}
                    </button>
                  );
                })}
              </div>

              {/* Nav */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32 }}>
                {qIndex > 1 ? (
                  <button onClick={goBack} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: T.textDim, fontSize: 13, cursor: "pointer" }}>
                    ← Back
                  </button>
                ) : <div />}
                <div style={{ fontSize: 12, color: T.textDim }}>
                  Your score updates as you answer
                </div>
              </div>
            </div>
          )}

          {/* ── RESULTS ── */}
          {currentQ?.type === "results" && <Results score={scoreToShow} band={band} domainScores={domainScores} answers={answers} hasCriticalGap={hasCriticalGap} peerBenchmark={peerBenchmark} confidence={confidence} onRestart={() => { setQIndex(0); setAnswers({}); setSelected(null); }} />}

        </div>
      </div>
    </div>
  );
}

// ─── RESULTS SCREEN ────────────────────────────────────────────────────────────
function Results({ score, band, domainScores, answers, hasCriticalGap, peerBenchmark, confidence, onRestart }) {
  const vs = score - peerBenchmark;
  const vsLabel = vs > 0 ? `+${vs} above` : vs < 0 ? `${Math.abs(vs)} below` : "at";

  const domainList = Object.entries(domainScores).sort((a, b) => a[1] - b[1]);
  const criticalDomains = domainList.filter(([,v]) => v < 50);
  const strongDomains = domainList.filter(([,v]) => v >= 75);

  const priorityActions = getPriorityActions(answers, domainScores);

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: T.textDim, textTransform: "uppercase", marginBottom: 16, fontFamily: T.font }}>Your PeopleScore™ Report</div>

        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", background: `linear-gradient(135deg, ${T.surface}, ${T.surfaceHigh})`, border: `1px solid ${band.color}30`, borderRadius: 24, padding: "32px 48px", marginBottom: 24, boxShadow: `0 0 60px ${band.color}18` }}>
          <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8, fontFamily: T.font, letterSpacing: "1px" }}>PEOPLESCORE™</div>
          <AnimatedScore target={score} size={88} color={band.color} />
          <div style={{ fontSize: 14, fontWeight: 700, color: band.color, textTransform: "uppercase", letterSpacing: "1.5px", marginTop: 8 }}>{band.label}</div>
          <div style={{ fontSize: 13, color: T.textSub, marginTop: 6, maxWidth: 280, textAlign: "center", lineHeight: 1.5 }}>{band.desc}</div>
        </div>

        {/* Benchmarks */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: vs >= 0 ? T.emerald : T.rose, fontFamily: T.font }}>{vsLabel}</div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 3 }}>peer median ({peerBenchmark})</div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.textSub, fontFamily: T.font }}>±{confidence}</div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 3 }}>confidence range</div>
          </div>
          {hasCriticalGap && (
            <div style={{ background: T.roseGlow, border: `1px solid ${T.rose}40`, borderRadius: 12, padding: "14px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.rose }}>Score Capped</div>
              <div style={{ fontSize: 11, color: T.rose, marginTop: 3, opacity: 0.8 }}>critical gap limits score to 70</div>
            </div>
          )}
        </div>
      </div>

      {/* Domain Scores */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.textSub, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 20, fontFamily: T.font }}>Domain Breakdown</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {Object.entries(domainScores).map(([key, val]) => {
            const color = val < 50 ? T.rose : val < 70 ? T.amber : val < 85 ? T.emerald : T.violet;
            return (
              <div key={key} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{getDomainLabel(key)}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: T.font }}>{val}</div>
                </div>
                <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${val}%`, background: color, borderRadius: 2, transition: "width 1s ease" }} />
                </div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>
                  {val < 50 ? "Needs immediate attention" : val < 70 ? "Gaps present — action needed" : val < 85 ? "Solid — room to improve" : "Strong performance"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority Actions */}
      {priorityActions.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.textSub, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 20, fontFamily: T.font }}>
            Your Top Priority Actions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {priorityActions.map((action, i) => (
              <div key={i} style={{ background: action.urgent ? T.roseGlow : T.amberGlow, border: `1px solid ${action.urgent ? T.rose : T.amber}30`, borderRadius: 12, padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>{action.urgent ? "🚨" : "⚠️"}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{action.title}</div>
                  <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5 }}>{action.desc}</div>
                </div>
                <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: action.urgent ? T.rose : T.amber, textTransform: "uppercase", letterSpacing: "1px", paddingTop: 2 }}>
                  {action.urgent ? "Critical" : "Important"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {strongDomains.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.textSub, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 16, fontFamily: T.font }}>Where You're Strong</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {strongDomains.map(([key, val]) => (
              <div key={key} style={{ background: T.emeraldGlow, border: `1px solid ${T.emerald}30`, borderRadius: 8, padding: "8px 14px", fontSize: 13, color: T.emerald, fontWeight: 600 }}>
                ✓ {getDomainLabel(key)} · {val}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Context */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px 28px", marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.textSub, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 16, fontFamily: T.font }}>How Your Score Is Calculated</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>
          <div>📊 <strong style={{ color: T.text }}>Context-weighted</strong> — Your score weighs domains differently based on your size ({answers.size}), industry ({answers.industry}), and stage.</div>
          <div>🏆 <strong style={{ color: T.text }}>Peer benchmarked</strong> — Compared to the median score for similar companies in your industry and size band.</div>
          <div>⚠️ <strong style={{ color: T.text }}>Critical gap rule</strong> — Unresolved compliance basics cap your score at 70, following how real HR auditors assess material risk.</div>
          <div>📐 <strong style={{ color: T.text }}>Bersin-aligned bands</strong> — Score bands map to Josh Bersin's 4-level HR maturity model used by leading HR organizations globally.</div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>Ready to improve your PeopleScore?</div>
        <div style={{ fontSize: 14, color: T.textSub, marginBottom: 24 }}>PeopleScoreAI turns this report into an action plan — with AI-powered HR support at your fingertips.</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, border: "none", borderRadius: 12, padding: "14px 32px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Get My Full HR Report →
          </button>
          <button onClick={onRestart} style={{ background: "transparent", border: `1.5px solid ${T.border}`, borderRadius: 12, padding: "14px 24px", color: T.textSub, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Retake Audit
          </button>
        </div>
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 12 }}>peoplescoreai.com · Enterprise-grade HR insight for every business</div>
      </div>
    </div>
  );
}

function getPriorityActions(answers, domainScores) {
  const actions = [];
  if (answers.i9 === "No" || answers.i9 === "Not sure what an I-9 is")
    actions.push({ title: "Set up I-9 verification immediately", desc: "Every US employee must complete Form I-9 within 3 days of hire. ICE fines are $281–$2,789 per error and can reach millions in audits.", urgent: true });
  if (answers.workersComp === "No")
    actions.push({ title: "Get workers' compensation insurance today", desc: "Operating without workers' comp is illegal in most states and exposes you personally to unlimited liability for workplace injuries.", urgent: true });
  if (answers.handbook === "No handbook" || answers.handbook === "Yes — over 3 years old")
    actions.push({ title: "Create or update your employee handbook", desc: "An outdated or missing handbook costs you key legal protections and may violate state requirements in CA, NY, IL, and others.", urgent: false });
  if (answers.harassmentPolicy === "No")
    actions.push({ title: "Implement a written anti-harassment policy", desc: "Without a written policy, you cannot use the primary legal defense (Faragher/Ellerth) in harassment cases. This is your most basic shield.", urgent: true });
  if (answers.payrollSystem === "Spreadsheets / manual")
    actions.push({ title: "Move to a payroll platform", desc: "Manual payroll is the highest-risk payroll setup. One calculation error can trigger FLSA audits with three-year look-back liability.", urgent: true });
  if (answers.discipline === "Never — all verbal" || answers.discipline === "Rarely")
    actions.push({ title: "Start documenting discipline and terminations in writing", desc: "Verbal-only separations turn routine terminations into 'wrongful termination' claims. Written documentation is your primary defense.", urgent: false });
  if (answers.epli === "No")
    actions.push({ title: "Get Employment Practices Liability Insurance (EPLI)", desc: "A single employment lawsuit costs $50K–$500K in legal fees alone, regardless of outcome. EPLI typically costs $1,000–$5,000/year.", urgent: false });
  if (answers.workerClass === "We use contractors but never reviewed it")
    actions.push({ title: "Review your independent contractor classifications", desc: "The IRS and DOL actively audit contractor arrangements. Misclassification triggers years of back taxes, penalties, and benefits liability.", urgent: false });
  if (answers.multiState?.includes("not sure"))
    actions.push({ title: "Audit your multi-state compliance obligations", desc: "Each state where an employee works creates new obligations — payroll tax, paid leave, workers' comp, and more. One remote hire can multiply your compliance footprint.", urgent: false });
  return actions.slice(0, 5);
}

function getDomainLabel(key) {
  return { compliance: "Compliance & Risk", payroll: "Payroll & Classification", hiring: "Hiring & Onboarding", policies: "Policies & Handbook", performance: "Performance Management", compensation: "Compensation & Benefits", culture: "Culture & Retention", analytics: "HR Data & Analytics" }[key] || key;
}
