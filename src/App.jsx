import { useState, useEffect, useRef, useCallback } from "react";

// ─── DESIGN SYSTEM ────────────────────────────────────────────────────────────
const C = {
  // Backgrounds
  bg: "#FFFFFF",
  bgSub: "#F8F9FB",
  bgCard: "#FFFFFF",
  bgDark: "#0A0E1A",
  bgDarkSub: "#111827",

  // Brand
  navy: "#0A0E1A",
  navyMid: "#1E2D4A",
  blue: "#1A56DB",
  blueBright: "#2563EB",
  blueLight: "#EEF4FF",

  // Semantic
  emerald: "#059669",
  emeraldLight: "#ECFDF5",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  rose: "#DC2626",
  roseLight: "#FEF2F2",
  violet: "#7C3AED",
  violetLight: "#F5F3FF",

  // Text
  text: "#0A0E1A",
  textSub: "#4B5563",
  textDim: "#9CA3AF",
  textInverse: "#FFFFFF",

  // Borders
  border: "#E5E7EB",
  borderMid: "#D1D5DB",
  borderStrong: "#9CA3AF",

  // Font
  mono: "'DM Mono', 'Courier New', monospace",
  sans: "'DM Sans', 'Inter', 'Helvetica Neue', sans-serif",
};

// ─── SCORING ENGINE ───────────────────────────────────────────────────────────
const DOMAIN_WEIGHTS = {
  compliance:   [0.35,0.25,0.15],
  payroll:      [0.20,0.15,0.10],
  hiring:       [0.15,0.15,0.15],
  policies:     [0.10,0.15,0.10],
  performance:  [0.05,0.10,0.15],
  compensation: [0.05,0.10,0.15],
  culture:      [0.05,0.05,0.10],
  analytics:    [0.05,0.05,0.10],
};

const INDUSTRY_MODIFIERS = {
  "Healthcare / Medical":      {compliance:1.3,payroll:1.1,hiring:1.2},
  "Construction / Trades":     {compliance:1.35,payroll:1.15,culture:0.8},
  "Restaurant / Hospitality":  {hiring:1.25,payroll:1.2,culture:1.15},
  "Professional Services":     {performance:1.2,compensation:1.15,policies:1.1},
  "Technology / Software":     {compensation:1.2,hiring:1.15,analytics:1.25},
  "Manufacturing":             {compliance:1.3,payroll:1.1,policies:1.1},
  "Retail / E-commerce":       {hiring:1.2,payroll:1.15,compliance:1.1},
  "Financial Services":        {compliance:1.2,policies:1.2,performance:1.1},
  "Education / Nonprofit":     {compliance:1.1,culture:1.2,compensation:0.9},
  "Other":                     {},
};

const STAGE_MODIFIERS = {
  "Just started (under 2 years)":    {compliance:1.2,policies:0.9,analytics:0.7},
  "Growing fast (2–5 years)":        {hiring:1.2,performance:1.1,compliance:1.1},
  "Stable & established (5+ years)": {performance:1.15,analytics:1.2,culture:1.1},
  "Restructuring or pivoting":       {compliance:1.25,payroll:1.1,culture:1.15},
};

const PEER_BENCHMARKS = {
  "1–10":   {default:44,"Restaurant / Hospitality":42,"Construction / Trades":38,"Technology / Software":51},
  "11–25":  {default:52,"Restaurant / Hospitality":48,"Construction / Trades":45,"Technology / Software":58},
  "26–50":  {default:59,"Restaurant / Hospitality":54,"Construction / Trades":52,"Technology / Software":65},
  "51–100": {default:64,"Restaurant / Hospitality":60,"Construction / Trades":58,"Technology / Software":70},
  "100+":   {default:69,"Restaurant / Hospitality":65,"Construction / Trades":62,"Technology / Software":75},
};

function getSizeTier(s) {
  if (!s) return 0;
  if (s === "1–10" || s === "11–25") return 0;
  if (s === "26–50" || s === "51–100") return 1;
  return 2;
}

function getPeerBenchmark(size, industry) {
  const g = PEER_BENCHMARKS[size] || PEER_BENCHMARKS["11–25"];
  return g[industry] || g.default;
}

function computeScore(answers) {
  const tier = getSizeTier(answers.size);
  const indMod = INDUSTRY_MODIFIERS[answers.industry] || {};
  const stageMod = STAGE_MODIFIERS[answers.stage] || {};

  const domainRaw = {
    compliance:   scoreCompliance(answers),
    payroll:      scorePayroll(answers),
    hiring:       scoreHiring(answers),
    policies:     scorePolicies(answers),
    performance:  scorePerformance(answers),
    compensation: scoreCompensation(answers),
    culture:      scoreCulture(answers),
    analytics:    scoreAnalytics(answers),
  };

  let totalW = 0, totalS = 0;
  const domainScores = {};

  for (const [domain, weights] of Object.entries(DOMAIN_WEIGHTS)) {
    const base = weights[tier];
    const eff = Math.min(base * (indMod[domain]||1) * (stageMod[domain]||1), 0.40);
    totalS += domainRaw[domain] * eff;
    totalW += eff;
    domainScores[domain] = Math.round(domainRaw[domain] * 100);
  }

  let score = Math.round(30 + (totalW > 0 ? totalS/totalW : 0) * 65);
  const hasCriticalGap = checkCriticalGaps(answers);
  if (hasCriticalGap) score = Math.min(score, 70);
  score = Math.max(18, Math.min(score, 98));
  return { score, domainScores, hasCriticalGap };
}

function checkCriticalGaps(a) {
  return a.i9==="No" || a.workersComp==="No" ||
    a.payrollSystem==="Spreadsheets / manual" ||
    a.harassmentPolicy==="No";
}

function scoreCompliance(a) {
  let s=0,n=0;
  if(a.i9){s+=a.i9==="Yes"?1:a.i9==="Mostly"?0.5:0;n++;}
  if(a.workersComp){s+=a.workersComp==="Yes"?1:0;n++;}
  if(a.wageHour){s+=a.wageHour==="Yes — we're compliant"?1:a.wageHour==="Mostly"?0.6:0.1;n++;}
  if(a.harassmentPolicy){s+=a.harassmentPolicy==="Yes, updated in past year"?1:a.harassmentPolicy==="Yes, but outdated"?0.5:0;n++;}
  if(a.multiState){s+=a.multiState==="No — one state only"?0.9:a.multiState==="Yes, and we manage it well"?1:0.4;n++;}
  return n>0?s/n:0.5;
}
function scorePayroll(a) {
  let s=0,n=0;
  const ps={Gusto:0.9,ADP:0.95,Paychex:0.9,Rippling:0.95,"QuickBooks Payroll":0.8,"Spreadsheets / manual":0.2,"A PEO handles it":0.85,Other:0.7};
  if(a.payrollSystem){s+=ps[a.payrollSystem]||0.7;n++;}
  if(a.workerClass){s+=a.workerClass==="Yes — all reviewed recently"?1:a.workerClass==="We use both, not sure"?0.3:0.7;n++;}
  if(a.payTransparency){s+=a.payTransparency==="Yes"?1:a.payTransparency==="Working on it"?0.6:0.2;n++;}
  return n>0?s/n:0.5;
}
function scoreHiring(a) {
  let s=0,n=0;
  if(a.offerLetters){s+=a.offerLetters==="Yes — standard template"?1:a.offerLetters==="Sometimes"?0.5:0.1;n++;}
  if(a.onboarding){s+=a.onboarding==="Structured 30/60/90 plan"?1:a.onboarding==="Basic first-day process"?0.5:a.onboarding==="Minimal / informal"?0.2:0;n++;}
  if(a.backgroundChecks){s+=a.backgroundChecks==="Yes — for all roles"?1:a.backgroundChecks==="For some roles"?0.6:0.1;n++;}
  return n>0?s/n:0.5;
}
function scorePolicies(a) {
  let s=0,n=0;
  const hb={"Yes — updated in past year":1,"Yes — 1–3 years old":0.6,"Yes — over 3 years old":0.3,"No handbook":0};
  if(a.handbook){s+=hb[a.handbook]??0.5;n++;}
  if(a.harassmentTraining){s+=a.harassmentTraining==="Yes — all employees"?1:a.harassmentTraining==="Some employees"?0.5:0.1;n++;}
  if(a.discipline){s+=a.discipline==="Always documented"?1:a.discipline==="Usually"?0.65:a.discipline==="Rarely"?0.2:0;n++;}
  return n>0?s/n:0.5;
}
function scorePerformance(a) {
  let s=0,n=0;
  const pm={"Formal reviews twice/year":1,"Formal annual reviews":0.8,"Regular informal check-ins":0.5,"Manager decides":0.3,"No formal process":0.1};
  if(a.perfReviews){s+=pm[a.perfReviews]??0.4;n++;}
  if(a.goalSetting){s+=a.goalSetting==="Yes — OKRs or clear goals"?1:a.goalSetting==="Informally"?0.5:0.1;n++;}
  if(a.managerTraining){s+=a.managerTraining==="Yes"?1:a.managerTraining==="Some managers"?0.5:0.1;n++;}
  return n>0?s/n:0.4;
}
function scoreCompensation(a) {
  let s=0,n=0;
  if(a.compStructure){s+=a.compStructure==="Formal pay bands/grades"?1:a.compStructure==="Market data informed"?0.7:a.compStructure==="Mostly gut feel"?0.2:0;n++;}
  if(a.benefits){s+=a.benefits==="Strong benefits package"?1:a.benefits==="Basic benefits"?0.6:a.benefits==="Minimal benefits"?0.2:0;n++;}
  if(a.payEquity){s+=a.payEquity==="Yes — audited recently"?1:a.payEquity==="We think so"?0.4:0.1;n++;}
  return n>0?s/n:0.4;
}
function scoreCulture(a) {
  let s=0,n=0;
  if(a.engagement){s+=a.engagement==="Yes — formal surveys with action plans"?1:a.engagement==="Informal check-ins only"?0.5:0.1;n++;}
  if(a.turnover){s+=a.turnover==="Below industry average"?1:a.turnover==="About average"?0.6:a.turnover==="Above average"?0.2:0.3;n++;}
  if(a.epli){s+=a.epli==="Yes"?0.8:a.epli==="No"?0.1:0.3;n++;}
  return n>0?s/n:0.4;
}
function scoreAnalytics(a) {
  let s=0,n=0;
  if(a.hrisSystem){s+=a.hrisSystem==="Yes — full HRIS"?1:a.hrisSystem==="Basic payroll only"?0.4:0.1;n++;}
  if(a.hrMetrics){s+=a.hrMetrics==="Yes — tracked regularly"?1:a.hrMetrics==="Sometimes"?0.5:0.1;n++;}
  return n>0?s/n:0.3;
}

function getScoreBand(score) {
  if(score<=40) return {label:"Reactive",color:C.rose,bg:C.roseLight,desc:"Significant compliance and people risk. Immediate action required."};
  if(score<=65) return {label:"Developing",color:C.amber,bg:C.amberLight,desc:"Foundation in place, but important gaps remain."};
  if(score<=85) return {label:"Strategic",color:C.emerald,bg:C.emeraldLight,desc:"Strong HR operations with room to reach best-in-class."};
  return {label:"Systemic",color:C.violet,bg:C.violetLight,desc:"Top-decile HR. Fewer than 10% of companies reach this level."};
}

function getDomainLabel(k) {
  return {compliance:"Compliance & Risk",payroll:"Payroll & Classification",hiring:"Hiring & Onboarding",policies:"Policies & Handbook",performance:"Performance Management",compensation:"Compensation & Benefits",culture:"Culture & Retention",analytics:"HR Data & Analytics"}[k]||k;
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
function buildSystemPrompt(answers) {
  const tier = getSizeTier(answers.size);
  const tierName = tier===0?"small (1–25 employees)":tier===1?"mid-size (26–100 employees)":"larger (100–500 employees)";
  const {score,domainScores,hasCriticalGap} = computeScore(answers);
  const band = getScoreBand(score);
  const peer = getPeerBenchmark(answers.size||"11–25", answers.industry||"Other");

  return `You are PeopleScoreAI — an AI-powered HR intelligence system built on enterprise-grade HR methodology. You operate strictly within the PeopleScoreAI framework. You never go off-script, never invent frameworks not in your training, and always ground your analysis in the specific business context provided.

## YOUR IDENTITY
You are the HR intelligence layer — equivalent to having a Fortune 500 Chief People Officer available on demand. You speak in business language, not HR jargon. You translate every HR finding into financial and operational impact. You are direct, specific, and actionable. You never give generic advice.

## THE BUSINESS CONTEXT
- Company: ${answers.companyName||"this business"}
- Industry: ${answers.industry||"not specified"}
- Size: ${answers.size||"not specified"} employees (${tierName})
- Stage: ${answers.stage||"not specified"}
- States of operation: ${answers.states||"not specified"}
- Current HR owner: ${answers.hrOwner||"not specified"}
- Payroll system: ${answers.payrollSystem||"not specified"}
- Worker classification reviewed: ${answers.workerClass||"not specified"}
- I-9 compliance: ${answers.i9||"not specified"}
- Workers compensation: ${answers.workersComp||"not specified"}
- Wage & hour compliance: ${answers.wageHour||"not specified"}
- Employee handbook: ${answers.handbook||"not specified"}
- Anti-harassment policy: ${answers.harassmentPolicy||"not specified"}
- Harassment training: ${answers.harassmentTraining||"not specified"}
- Offer letters: ${answers.offerLetters||"not specified"}
- Onboarding process: ${answers.onboarding||"not specified"}
- Performance reviews: ${answers.perfReviews||"not specified"}
- Goal setting: ${answers.goalSetting||"not specified"}
- Manager training: ${answers.managerTraining||"not specified"}
- Compensation structure: ${answers.compStructure||"not specified"}
- Benefits: ${answers.benefits||"not specified"}
- Pay equity: ${answers.payEquity||"not specified"}
- Employee engagement: ${answers.engagement||"not specified"}
- Turnover: ${answers.turnover||"not specified"}
- EPLI insurance: ${answers.epli||"not specified"}
- HRIS system: ${answers.hrisSystem||"not specified"}
- HR metrics tracking: ${answers.hrMetrics||"not specified"}
- Background checks: ${answers.backgroundChecks||"not specified"}
- Multi-state operation: ${answers.multiState||"not specified"}
- Pay transparency: ${answers.payTransparency||"not specified"}

## PEOPLESCORE RESULTS
- Overall PeopleScore: ${score}/100
- Score band: ${band.label} — ${band.desc}
- Peer median (${answers.industry||"industry"}, ${answers.size||"similar size"}): ${peer}/100
- Critical gap present: ${hasCriticalGap?"YES — score capped at 70":"No"}
- Domain scores: ${Object.entries(domainScores).map(([k,v])=>getDomainLabel(k)+": "+v).join(" | ")}

## SCORING FRAMEWORK (NON-NEGOTIABLE — NEVER DEVIATE)
Your analysis is grounded in these frameworks:
1. Josh Bersin's 4-Level HR Maturity Model: Reactive (0-40) / Developing (41-65) / Strategic (66-85) / Systemic (86-100)
2. Gartner HR Score methodology: importance × maturity gap drives priority
3. SHRM BASK competency framework for HR function assessment
4. Federal employment law thresholds: 1+ (FLSA, I-9), 15+ (Title VII, ADA), 20+ (ADEA, COBRA), 50+ (FMLA, ACA), 100+ (EEO-1, WARN)
5. State-specific compliance based on states of operation
6. Industry-specific risk modifiers based on actual regulatory exposure

## SIZE-BASED WEIGHTING (THIS COMPANY'S WEIGHTS)
${tier===0?"This is a small business (1-25 employees). Compliance & Risk (35%) and Payroll (20%) dominate the score. Performance management, analytics, and advanced people strategy are nice-to-have — not weighted heavily yet.":tier===1?"This is a mid-size business (26-100 employees). Compliance (25%) remains critical. Policies (15%), Hiring (15%), and Performance (10%) are gaining weight. Strategic HR is becoming essential.":"This is a larger SMB (100-500 employees). Strategic domains now dominate — Performance (15%), Compensation (15%), Culture (10%), Analytics (10%). Compliance is table stakes. People strategy is the differentiator."}

## LANGUAGE RULES (MANDATORY)
- NEVER use HR jargon without immediate plain-language translation
- ALWAYS connect findings to dollars, risk, or business outcomes
- NEVER say "it is recommended that" — say "you need to" or "fix this"
- ALWAYS be specific to this company's industry and size
- NEVER give generic advice that applies to any company
- Write at the level of a smart business owner who knows their business but not HR
- Be direct. Be specific. Be actionable.
- Tone: trusted advisor who found something important and is telling you straight

## CRITICAL GAP RULE
${hasCriticalGap?"CRITICAL GAPS DETECTED. This company has unresolved compliance basics that cap their score at 70. These must be addressed before anything else. No amount of culture programs or performance management can offset active legal exposure.":"No critical gaps detected in the core compliance basics."}

## OUTPUT STRUCTURE FOR FULL REPORT
When generating the full Phase 2 report, follow this EXACT structure:
1. Executive Summary (2-3 sentences, business impact focused)
2. Your Score in Context (score vs peers, what it means for this specific business)
3. Critical Findings (only if critical gaps exist — urgent, specific, with cost implications)
4. Domain Analysis (each domain: score, what it means, specific finding, specific action)
5. Your 30-Day Action Plan (3-5 specific, sequenced actions)
6. Your 90-Day Roadmap (what comes after the immediate fixes)
7. What This Could Cost You (financial impact of current gaps)
8. How PeopleScoreAI Can Help (specific to their situation)

Never include sections that don't apply. Never pad with generic content. Every sentence must be specific to this company.`;
}

// ─── CLAUDE API ───────────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userMessage, onChunk) {
  const apiKey = process.env.REACT_APP_ANTHROPIC_KEY;
  if (!apiKey) throw new Error("API key not configured");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      stream: true,
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            onChunk(parsed.delta.text);
          }
        } catch {}
      }
    }
  }
}

// ─── QUESTIONS ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  { id:"intro", type:"intro" },
  { id:"industry", key:"industry", section:"About Your Business", q:"What industry are you in?",
    sub:"We weight your score based on your industry's specific risks — not a generic formula.",
    choices:["Healthcare / Medical","Construction / Trades","Restaurant / Hospitality","Professional Services","Technology / Software","Manufacturing","Retail / E-commerce","Financial Services","Education / Nonprofit","Other"] },
  { id:"size", key:"size", section:"About Your Business", q:"How many W-2 employees do you have?",
    sub:"Count everyone on your regular payroll — full-time and part-time. Not contractors.",
    choices:["1–10","11–25","26–50","51–100","100+"] },
  { id:"stage", key:"stage", section:"About Your Business", q:"Where are you in your business journey?",
    sub:"Your stage determines what great HR looks like for your company right now.",
    choices:["Just started (under 2 years)","Growing fast (2–5 years)","Stable & established (5+ years)","Restructuring or pivoting"] },
  { id:"i9", key:"i9", section:"Compliance", tier:"critical",
    q:"Do you complete I-9 forms for every new hire within 3 days of their start date?",
    sub:"The I-9 verifies work authorization. ICE fines run $281–$2,789 per error.",
    choices:["Yes","Mostly — some may slip","No","Not sure what an I-9 is"] },
  { id:"workersComp", key:"workersComp", section:"Compliance", tier:"critical",
    q:"Do you have active workers' compensation insurance?",
    sub:"Required in every state except Texas. Operating without it is criminal liability.",
    choices:["Yes","No","Not sure — we use a PEO"] },
  { id:"wageHour", key:"wageHour", section:"Compliance", tier:"critical",
    q:"Are your employees paid correctly — minimum wage, overtime, and proper classification?",
    sub:"Wage-and-hour violations are the #1 source of employment lawsuits. One misclassified role can cost six figures.",
    choices:["Yes — we're compliant","Mostly — but I have some doubts","No — not sure if we comply","We're under active review"] },
  { id:"harassmentPolicy", key:"harassmentPolicy", section:"Compliance", tier:"critical",
    q:"Do you have a written anti-harassment and anti-discrimination policy?",
    sub:"Without a written policy, you lose your primary legal defense in harassment cases.",
    choices:["Yes, updated in past year","Yes, but outdated","No","Not sure"] },
  { id:"multiState", key:"multiState", section:"Compliance",
    q:"Do you have employees working in multiple states?",
    sub:"One remote worker in California, New York, or Illinois triggers significantly different legal obligations.",
    choices:["No — one state only","Yes, and we manage it well","Yes, but we're not sure what each state requires","Not sure"] },
  { id:"payrollSystem", key:"payrollSystem", section:"Payroll", tier:"critical",
    q:"What do you use to run payroll?",
    sub:"Your payroll system is the backbone of compliance. Manual payroll is the highest-risk setup.",
    choices:["Gusto","ADP","Paychex","Rippling","QuickBooks Payroll","Spreadsheets / manual","A PEO handles it","Other"] },
  { id:"workerClass", key:"workerClass", section:"Payroll",
    q:"If you use independent contractors, has someone reviewed whether they're correctly classified?",
    sub:"Misclassifying employees as contractors is the IRS and DOL's top enforcement target.",
    choices:["Yes — all reviewed recently","We don't use contractors","We use both, not sure if it's right","We use contractors but never reviewed it"] },
  { id:"payTransparency", key:"payTransparency", section:"Payroll",
    q:"If you post job listings, do you include salary ranges?",
    sub:"17+ states now require salary ranges in job postings. Violations carry fines and attract litigation.",
    choices:["Yes","No — we don't include ranges","Working on it","We don't post job listings"] },
  { id:"offerLetters", key:"offerLetters", section:"Hiring",
    q:"When you hire someone, do you give them a written offer letter?",
    sub:"Verbal offers create disputes. A written offer letter protects both sides.",
    choices:["Yes — standard template","Yes — custom each time","Sometimes","No — verbal only"] },
  { id:"onboarding", key:"onboarding", section:"Hiring",
    q:"What does your onboarding process look like?",
    sub:"Companies with structured onboarding see 82% better first-year retention.",
    choices:["Structured 30/60/90 plan","Basic first-day process","Minimal / informal","No real onboarding process"] },
  { id:"backgroundChecks", key:"backgroundChecks", section:"Hiring",
    q:"Do you run background checks on new hires?",
    sub:"Background checks must follow FCRA requirements — specific notices are required.",
    choices:["Yes — for all roles","For some roles","No","Not required in our industry"] },
  { id:"handbook", key:"handbook", section:"Policies", tier:"important",
    q:"Do you have an employee handbook, and how current is it?",
    sub:"An outdated handbook is almost as risky as no handbook — state laws change constantly.",
    choices:["Yes — updated in past year","Yes — 1–3 years old","Yes — over 3 years old","No handbook"] },
  { id:"harassmentTraining", key:"harassmentTraining", section:"Policies",
    q:"Have employees completed anti-harassment training in the past two years?",
    sub:"California, New York, Illinois, and others mandate this. Without it, you lose key legal defenses.",
    choices:["Yes — all employees","Some employees","No","Not sure"] },
  { id:"discipline", key:"discipline", section:"Policies",
    q:"When you discipline or let someone go, do you document it in writing?",
    sub:"Verbal-only terminations turn routine separations into wrongful termination claims.",
    choices:["Always documented","Usually","Rarely","Never — all verbal"] },
  { id:"perfReviews", key:"perfReviews", section:"Performance",
    q:"How do you handle employee performance reviews?",
    sub:"Without formal reviews, terminations look arbitrary and promotions look like favoritism.",
    choices:["Formal reviews twice/year","Formal annual reviews","Regular informal check-ins","Manager decides","No formal process"],
    showIf: (a) => a.size !== "1–10" },
  { id:"goalSetting", key:"goalSetting", section:"Performance",
    q:"Do employees have clear, written goals for their role?",
    sub:"Goal clarity is the #1 driver of employee engagement according to Gallup.",
    choices:["Yes — OKRs or clear goals","Informally","No","Not consistently"],
    showIf: (a) => a.size !== "1–10" },
  { id:"managerTraining", key:"managerTraining", section:"Performance",
    q:"Have your managers been trained on how to manage people?",
    sub:"Manager missteps cause the majority of EEOC charges, FMLA violations, and lawsuits.",
    choices:["Yes","Some managers","No","We don't have formal managers yet"],
    showIf: (a) => ["11–25","26–50","51–100","100+"].includes(a.size) },
  { id:"compStructure", key:"compStructure", section:"Compensation",
    q:"How do you set employee pay?",
    sub:"Ad hoc pay decisions are the fastest path to discrimination claims and retention problems.",
    choices:["Formal pay bands/grades","Market data informed","Mostly gut feel / negotiation","We copy competitors"] },
  { id:"benefits", key:"benefits", section:"Compensation",
    q:"How would you describe your benefits package?",
    sub:"Benefits are often the deciding factor in whether top candidates join — and stay.",
    choices:["Strong benefits package","Basic benefits","Minimal benefits","No benefits currently"] },
  { id:"payEquity", key:"payEquity", section:"Compensation",
    q:"Have you reviewed whether employees are paid equitably for similar work?",
    sub:"Pay equity lawsuits are rising sharply. Several states require formal audits at 100+ employees.",
    choices:["Yes — audited recently","We think so","No","Not relevant at our size"],
    showIf: (a) => ["26–50","51–100","100+"].includes(a.size) },
  { id:"engagement", key:"engagement", section:"Culture",
    q:"Do you measure employee engagement or satisfaction?",
    sub:"Gallup reports highly engaged teams show 23% greater profitability.",
    choices:["Yes — formal surveys with action plans","Informal check-ins only","We don't measure it","We're too small for this"],
    showIf: (a) => ["11–25","26–50","51–100","100+"].includes(a.size) },
  { id:"turnover", key:"turnover", section:"Culture",
    q:"How is your employee turnover compared to your industry?",
    sub:"SHRM estimates replacing one employee costs 50–200% of their annual salary.",
    choices:["Below industry average","About average","Above average","We don't track it"] },
  { id:"epli", key:"epli", section:"Culture",
    q:"Do you have Employment Practices Liability Insurance (EPLI)?",
    sub:"A single employment lawsuit costs $50K–$500K in legal fees alone, regardless of outcome.",
    choices:["Yes","No","Not sure"] },
  { id:"hrisSystem", key:"hrisSystem", section:"Analytics",
    q:"Do you have a central system that tracks employee data, time off, and job history?",
    sub:"An HRIS is your single source of truth. Without one, decisions happen on gut feel.",
    choices:["Yes — full HRIS","Basic payroll only","No — spreadsheets or email","Not sure"],
    showIf: (a) => ["11–25","26–50","51–100","100+"].includes(a.size) },
  { id:"hrMetrics", key:"hrMetrics", section:"Analytics",
    q:"Do you track key HR metrics like turnover rate, time-to-hire, or cost-per-hire?",
    sub:"Companies that track HR metrics make 2x better talent decisions per McKinsey.",
    choices:["Yes — tracked regularly","Sometimes","No","Not sure what to track"],
    showIf: (a) => ["26–50","51–100","100+"].includes(a.size) },
  { id:"capture", type:"capture" },
  { id:"results", type:"results" },
];

// ─── ANIMATED NUMBER ──────────────────────────────────────────────────────────
function AnimNum({ target, size=64, color=C.blue }) {
  const [n, setN] = useState(30);
  useEffect(() => {
    let start = null;
    const from = n;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts-start)/900, 1);
      const ease = 1 - Math.pow(1-p, 3);
      setN(Math.round(from + (target-from)*ease));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <span style={{fontSize:size,fontWeight:700,color,fontFamily:C.mono,lineHeight:1,letterSpacing:"-2px"}}>{n}</span>;
}

// ─── SCORE RING ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size=120, band }) {
  const r = (size-12)/2;
  const circ = 2*Math.PI*r;
  const offset = circ - (score/100)*circ;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={8}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={band.color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 1s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <AnimNum target={score} size={size*0.3} color={band.color}/>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function PeopleScoreAI() {
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [report, setReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [captureData, setCaptureData] = useState({name:"",email:"",company:""});
  const topRef = useRef(null);

  const visible = QUESTIONS.filter(q => !q.showIf || q.showIf(answers));
  const current = visible[Math.min(qIndex, visible.length-1)];
  const progress = Math.round((qIndex / Math.max(visible.length-3, 1)) * 100);

  const answeredCount = Object.keys(answers).length;
  const { score, domainScores, hasCriticalGap } = computeScore(answers);
  const scoreToShow = answeredCount < 2 ? 30 : score;
  const band = getScoreBand(scoreToShow);
  const confidence = Math.max(3, Math.round(20 - answeredCount*0.7));
  const peerBenchmark = getPeerBenchmark(answers.size||"11–25", answers.industry||"Other");

  const advance = (choice) => {
    if (animating) return;
    const newAnswers = (current.key && choice !== null) ? { ...answers, [current.key]: choice } : { ...answers };
    setAnswers(newAnswers);
    setAnimating(true);
    setTimeout(() => {
      setQIndex(i => Math.min(i+1, visible.length-1));
      setSelected(null);
      setAnimating(false);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 250);
  };

  const goBack = () => { if(qIndex>0){setQIndex(i=>i-1);setSelected(null);} };

  const generateReport = async () => {
    if (!captureData.email) return;
    setReportLoading(true);
    setReportError(null);
    setReport("");

    // Advance to results
    setQIndex(visible.length - 1);

    const fullAnswers = { ...answers, ...captureData };
    const sysPrompt = buildSystemPrompt(fullAnswers);
    const userMsg = `Generate a complete PeopleScoreAI HR audit report for ${captureData.company||"this business"}. 

The business owner's name is ${captureData.name||"the owner"}. Write directly to them.

Follow the exact output structure from your instructions. Be specific to their ${answers.industry||"industry"} industry and ${answers.size||"size"} employee count. 

Ground every finding in their actual answers. Connect every gap to real dollar figures or specific legal exposure. Make every action step specific and sequenced.

Start immediately with the Executive Summary — no preamble or "Here is your report" introduction.`;

    try {
      let full = "";
      await callClaude(sysPrompt, userMsg, (chunk) => {
        full += chunk;
        setReport(full);
      });
      
      // Log lead to console (Google Sheet integration would go here)
      console.log("Lead captured:", {
        name: captureData.name,
        email: captureData.email,
        company: captureData.company,
        score: scoreToShow,
        band: band.label,
        industry: answers.industry,
        size: answers.size,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      setReportError("Unable to generate report right now. Please try again.");
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div ref={topRef} style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:C.sans}}>

      {/* NAV */}
      <nav style={{borderBottom:`1px solid ${C.border}`,background:C.bg,position:"sticky",top:0,zIndex:100,padding:"0 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:C.navy,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:16,height:16,borderRadius:3,border:`2px solid ${C.blue}`,borderTop:"2px solid transparent",transform:"rotate(45deg)"}}/>
            </div>
            <span style={{fontWeight:700,fontSize:16,letterSpacing:"-0.3px",color:C.navy}}>PeopleScore<span style={{color:C.blue}}>.ai</span></span>
          </div>

          {current?.type !== "intro" && current?.type !== "results" && (
            <div style={{display:"flex",alignItems:"center",gap:20}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:120,height:4,background:C.border,borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${progress}%`,background:C.blue,borderRadius:2,transition:"width 0.4s ease"}}/>
                </div>
                <span style={{fontSize:12,color:C.textDim,fontFamily:C.mono}}>{Math.min(progress,100)}%</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px",borderRadius:8,border:`1px solid ${band.color}30`,background:band.bg}}>
                <AnimNum target={scoreToShow} size={20} color={band.color}/>
                <span style={{fontSize:11,fontWeight:600,color:band.color,textTransform:"uppercase",letterSpacing:"1px"}}>{band.label}</span>
              </div>
            </div>
          )}

          <div style={{display:"flex",gap:8}}>
            <a href="mailto:hello@peoplescoreai.com" style={{fontSize:13,color:C.textSub,textDecoration:"none"}}>Contact</a>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{maxWidth:680,margin:"0 auto",padding:"48px 24px 80px"}}>
        <div style={{opacity:animating?0:1,transform:animating?"translateY(8px)":"translateY(0)",transition:"opacity 0.25s ease, transform 0.25s ease"}}>

          {/* INTRO */}
          {current?.type === "intro" && (
            <div>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,border:`1px solid ${C.blue}30`,background:C.blueLight,marginBottom:24}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:C.blue}}/>
                <span style={{fontSize:11,fontWeight:600,color:C.blue,letterSpacing:"1.5px",textTransform:"uppercase"}}>PeopleScore™ · HR Diagnostic</span>
              </div>

              <h1 style={{fontSize:48,fontWeight:800,letterSpacing:"-1.5px",lineHeight:1.1,marginBottom:16,color:C.navy}}>
                Know exactly where<br/>
                <span style={{color:C.blue}}>your HR stands.</span>
              </h1>
              <p style={{fontSize:18,color:C.textSub,lineHeight:1.7,marginBottom:8,maxWidth:520}}>
                Answer ~15 questions. Get an enterprise-grade HR audit score — personalized to your industry, size, and stage.
              </p>
              <p style={{fontSize:13,color:C.textDim,marginBottom:40}}>Takes 8–12 minutes · No signup required · Free</p>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:40}}>
                {[
                  ["Personalized score (0–100)","Calibrated to your industry & size"],
                  ["Domain breakdown","8 HR areas assessed in depth"],
                  ["Peer benchmarking","vs. companies like yours"],
                  ["Prioritized action plan","What to fix first and why"],
                ].map(([title,sub])=>(
                  <div key={title} style={{padding:"16px 18px",border:`1px solid ${C.border}`,borderRadius:12,background:C.bgSub}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.navy,marginBottom:3}}>✓ {title}</div>
                    <div style={{fontSize:12,color:C.textDim}}>{sub}</div>
                  </div>
                ))}
              </div>

              <div style={{display:"flex",alignItems:"center",gap:16,padding:"20px 24px",border:`1px solid ${C.border}`,borderRadius:12,background:C.bgSub,marginBottom:40}}>
                <ScoreRing score={30} size={80} band={{color:C.textDim}}/>
                <div>
                  <div style={{fontSize:13,color:C.textDim,marginBottom:4}}>Your score starts at 30 and updates live as you answer</div>
                  <div style={{fontSize:12,color:C.textDim}}>Industry and size weighting applied automatically</div>
                </div>
              </div>

              <button onClick={()=>advance(null)} style={{display:"block",width:"100%",padding:"18px",background:C.navy,border:"none",borderRadius:12,color:C.textInverse,fontSize:16,fontWeight:700,cursor:"pointer",letterSpacing:"-0.2px"}}>
                Start My HR Audit →
              </button>
              <div style={{fontSize:12,color:C.textDim,textAlign:"center",marginTop:12}}>Your score updates the moment you answer the first question</div>
            </div>
          )}

          {/* QUESTION */}
          {current?.type === "choice" && (
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span style={{fontSize:11,fontWeight:600,color:C.blue,textTransform:"uppercase",letterSpacing:"1.5px"}}>{current.section}</span>
                {current.tier === "critical" && (
                  <span style={{fontSize:10,fontWeight:700,color:C.rose,textTransform:"uppercase",letterSpacing:"1px",padding:"2px 8px",border:`1px solid ${C.rose}30`,borderRadius:4,background:C.roseLight}}>
                    Critical — weighted 3×
                  </span>
                )}
              </div>

              <h2 style={{fontSize:26,fontWeight:700,letterSpacing:"-0.5px",lineHeight:1.3,marginBottom:10,color:C.navy}}>{current.q}</h2>
              <p style={{fontSize:14,color:C.textSub,lineHeight:1.7,marginBottom:28}}>{current.sub}</p>

              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {current.choices.map(choice => {
                  const isSel = selected===choice;
                  const isPrev = answers[current.key]===choice;
                  return (
                    <button key={choice} onClick={()=>{setSelected(choice);setTimeout(()=>advance(choice),160);}}
                      style={{padding:"14px 18px",background:isSel?C.blueLight:isPrev?C.bgSub:C.bg,
                        border:`1.5px solid ${isSel?C.blue:isPrev?C.borderMid:C.border}`,
                        borderRadius:10,color:isSel?C.blue:C.text,fontSize:15,fontWeight:isSel||isPrev?600:400,
                        cursor:"pointer",textAlign:"left",transition:"all 0.12s ease",display:"flex",alignItems:"center",gap:12}}>
                      <span style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${isSel?C.blue:C.borderMid}`,
                        background:isSel?C.blue:"transparent",display:"flex",alignItems:"center",justifyContent:"center",
                        flexShrink:0,fontSize:10,color:C.textInverse,transition:"all 0.12s"}}>
                        {(isSel||isPrev)&&"✓"}
                      </span>
                      {choice}
                    </button>
                  );
                })}
              </div>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:32,paddingTop:24,borderTop:`1px solid ${C.border}`}}>
                {qIndex>1?<button onClick={goBack} style={{padding:"8px 16px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,fontSize:13,cursor:"pointer"}}>← Back</button>:<div/>}
                <span style={{fontSize:12,color:C.textDim}}>Score updates automatically</span>
              </div>
            </div>
          )}

          {/* CAPTURE */}
          {current?.type === "capture" && (
            <div>
              <div style={{textAlign:"center",marginBottom:40}}>
                <ScoreRing score={scoreToShow} size={120} band={band}/>
                <div style={{marginTop:16}}>
                  <div style={{fontSize:24,fontWeight:700,color:band.color,letterSpacing:"-0.5px"}}>{band.label}</div>
                  <div style={{fontSize:14,color:C.textSub,marginTop:4}}>{band.desc}</div>
                </div>
              </div>

              <div style={{padding:"24px",border:`1px solid ${C.border}`,borderRadius:16,background:C.bgSub,marginBottom:24}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:22,fontWeight:700,color:scoreToShow>peerBenchmark?C.emerald:C.rose,fontFamily:C.mono}}>{scoreToShow>peerBenchmark?"+":""}{scoreToShow-peerBenchmark}</div>
                    <div style={{fontSize:11,color:C.textDim}}>vs. peer median ({peerBenchmark})</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:22,fontWeight:700,color:C.textSub,fontFamily:C.mono}}>±{confidence}</div>
                    <div style={{fontSize:11,color:C.textDim}}>confidence range</div>
                  </div>
                  {hasCriticalGap&&<div style={{textAlign:"center"}}>
                    <div style={{fontSize:14,fontWeight:700,color:C.rose}}>Score Capped</div>
                    <div style={{fontSize:11,color:C.rose,opacity:0.8}}>critical gap at 70</div>
                  </div>}
                </div>
              </div>

              <div style={{marginBottom:32}}>
                <h2 style={{fontSize:22,fontWeight:700,letterSpacing:"-0.5px",marginBottom:8,color:C.navy}}>Get your full AI-generated HR report</h2>
                <p style={{fontSize:14,color:C.textSub,lineHeight:1.6,marginBottom:24}}>Claude will generate a completely personalized HR audit report — specific to your {answers.industry||"industry"} business with {answers.size||"your"} employees. Takes about 30 seconds.</p>

                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {[{label:"Your name",key:"name",placeholder:"Jane Smith",type:"text"},
                    {label:"Work email",key:"email",placeholder:"jane@company.com",type:"email"},
                    {label:"Company name",key:"company",placeholder:"Acme Corp",type:"text"}
                  ].map(({label,key,placeholder,type})=>(
                    <div key={key}>
                      <label style={{fontSize:13,fontWeight:600,color:C.navy,display:"block",marginBottom:6}}>{label}</label>
                      <input type={type} placeholder={placeholder} value={captureData[key]}
                        onChange={e=>setCaptureData(d=>({...d,[key]:e.target.value}))}
                        style={{width:"100%",padding:"12px 14px",border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:15,color:C.text,background:C.bg,outline:"none",boxSizing:"border-box",fontFamily:C.sans}}/>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={generateReport} disabled={!captureData.email}
                style={{display:"block",width:"100%",padding:"18px",background:captureData.email?C.navy:C.border,border:"none",borderRadius:12,color:C.textInverse,fontSize:16,fontWeight:700,cursor:captureData.email?"pointer":"not-allowed",letterSpacing:"-0.2px",transition:"background 0.2s"}}>
                Generate My HR Report →
              </button>
              <div style={{fontSize:12,color:C.textDim,textAlign:"center",marginTop:8}}>Your report is generated by Claude in real time · No spam ever</div>
            </div>
          )}

          {/* RESULTS */}
          {current?.type === "results" && (
            <Results score={scoreToShow} band={band} domainScores={domainScores}
              answers={answers} hasCriticalGap={hasCriticalGap} peerBenchmark={peerBenchmark}
              confidence={confidence} report={report} reportLoading={reportLoading}
              reportError={reportError} captureData={captureData}
              onRestart={()=>{setQIndex(0);setAnswers({});setSelected(null);setReport("");setCaptureData({name:"",email:"",company:""});}}/>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── RESULTS SCREEN ────────────────────────────────────────────────────────────
function Results({ score, band, domainScores, answers, hasCriticalGap, peerBenchmark, confidence, report, reportLoading, reportError, captureData, onRestart }) {
  const vs = score - peerBenchmark;
  const domainList = Object.entries(domainScores).sort((a,b)=>a[1]-b[1]);

  return (
    <div>
      {/* Score header */}
      <div style={{display:"flex",alignItems:"center",gap:24,padding:"24px",border:`1px solid ${C.border}`,borderRadius:16,background:C.bgSub,marginBottom:24}}>
        <ScoreRing score={score} size={100} band={band}/>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:C.textDim,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:4,fontFamily:C.mono}}>PeopleScore™</div>
          <div style={{fontSize:24,fontWeight:700,color:band.color,marginBottom:4}}>{band.label}</div>
          <div style={{fontSize:13,color:C.textSub,lineHeight:1.5}}>{band.desc}</div>
          <div style={{display:"flex",gap:16,marginTop:12}}>
            <div>
              <span style={{fontSize:16,fontWeight:700,color:vs>=0?C.emerald:C.rose,fontFamily:C.mono}}>{vs>=0?"+":""}{vs}</span>
              <span style={{fontSize:11,color:C.textDim,marginLeft:4}}>vs peer median</span>
            </div>
            <div>
              <span style={{fontSize:16,fontWeight:700,color:C.textSub,fontFamily:C.mono}}>±{confidence}</span>
              <span style={{fontSize:11,color:C.textDim,marginLeft:4}}>confidence</span>
            </div>
          </div>
        </div>
      </div>

      {/* Domain scores */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:14,fontFamily:C.mono}}>Domain Breakdown</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {domainList.map(([key,val])=>{
            const col = val<50?C.rose:val<70?C.amber:val<85?C.emerald:C.violet;
            return (
              <div key={key} style={{padding:"12px 16px",border:`1px solid ${C.border}`,borderRadius:10,background:C.bg}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:13,fontWeight:600,color:C.navy}}>{getDomainLabel(key)}</span>
                  <span style={{fontSize:16,fontWeight:700,color:col,fontFamily:C.mono}}>{val}</span>
                </div>
                <div style={{height:3,background:C.border,borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${val}%`,background:col,borderRadius:2,transition:"width 1s ease"}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Report */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:14,fontFamily:C.mono}}>
          AI-Generated HR Report {captureData.name&&`· ${captureData.name}`}
        </div>

        {reportLoading && !report && (
          <div style={{padding:"40px",border:`1px solid ${C.border}`,borderRadius:12,textAlign:"center"}}>
            <div style={{width:32,height:32,border:`3px solid ${C.blue}`,borderTop:"3px solid transparent",borderRadius:"50%",margin:"0 auto 16px",animation:"spin 1s linear infinite"}}/>
            <div style={{fontSize:14,color:C.textSub}}>Claude is analyzing your HR profile...</div>
            <div style={{fontSize:12,color:C.textDim,marginTop:4}}>Generating your personalized report</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {reportError && (
          <div style={{padding:"20px",border:`1px solid ${C.rose}`,borderRadius:12,background:C.roseLight,color:C.rose,fontSize:14}}>{reportError}</div>
        )}

        {report && (
          <div style={{padding:"24px",border:`1px solid ${C.border}`,borderRadius:12,background:C.bg}}>
            <div style={{fontSize:14,lineHeight:1.8,color:C.text,whiteSpace:"pre-wrap",fontFamily:C.sans}}>
              {report}
              {reportLoading && <span style={{display:"inline-block",width:2,height:16,background:C.blue,marginLeft:2,animation:"blink 1s infinite"}}/>}
            </div>
            <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{padding:"24px",border:`2px solid ${C.navy}`,borderRadius:16,background:C.bgDark,textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:20,fontWeight:700,color:C.textInverse,letterSpacing:"-0.5px",marginBottom:8}}>Ready to fix what we found?</div>
        <div style={{fontSize:14,color:"rgba(255,255,255,0.6)",marginBottom:20,lineHeight:1.6}}>
          PeopleScoreAI turns this report into an ongoing HR action plan — with AI-powered support at every step.
        </div>
        <a href="mailto:hello@peoplescoreai.com?subject=PeopleScoreAI — I want to improve my score"
          style={{display:"inline-block",padding:"14px 32px",background:C.blue,borderRadius:10,color:C.textInverse,fontSize:15,fontWeight:700,textDecoration:"none",marginBottom:8}}>
          Talk to PeopleScoreAI →
        </a>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:8}}>hello@peoplescoreai.com · peoplescoreai.com</div>
      </div>

      <div style={{textAlign:"center"}}>
        <button onClick={onRestart} style={{padding:"10px 20px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,fontSize:13,cursor:"pointer"}}>
          Retake Audit
        </button>
      </div>
    </div>
  );
}
