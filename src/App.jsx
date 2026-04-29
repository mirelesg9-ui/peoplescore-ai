import { useState, useRef, useEffect } from "react";

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const C = {
  bg: "#FFFFFF", bgSub: "#F8F9FB", bgDark: "#0A0E1A",
  navy: "#0A0E1A", blue: "#1A56DB", blueLight: "#EEF4FF",
  emerald: "#059669", emeraldLight: "#ECFDF5",
  amber: "#D97706", amberLight: "#FFFBEB",
  rose: "#DC2626", roseLight: "#FEF2F2",
  violet: "#7C3AED", violetLight: "#F5F3FF",
  text: "#0A0E1A", textSub: "#4B5563", textDim: "#9CA3AF",
  textInverse: "#FFFFFF", border: "#E5E7EB",
  mono: "'Courier New', monospace",
  sans: "'DM Sans', 'Helvetica Neue', sans-serif",
};

// ─── SCORING ENGINE ─────────────────────────────────────────────────────────────
const PEER_BENCHMARKS = {
  "1–10":   { default: 44, "Restaurant / Hospitality": 42, "Construction / Trades": 38, "Technology / Software": 51, "Healthcare / Medical": 47 },
  "11–25":  { default: 52, "Restaurant / Hospitality": 48, "Construction / Trades": 45, "Technology / Software": 58, "Healthcare / Medical": 54 },
  "26–50":  { default: 59, "Restaurant / Hospitality": 54, "Construction / Trades": 52, "Technology / Software": 65, "Healthcare / Medical": 61 },
  "51–200": { default: 64, "Restaurant / Hospitality": 60, "Construction / Trades": 58, "Technology / Software": 70, "Healthcare / Medical": 66 },
  "201–500":{ default: 68, "Restaurant / Hospitality": 63, "Construction / Trades": 62, "Technology / Software": 74, "Healthcare / Medical": 70 },
  "500+":   { default: 72, "Restaurant / Hospitality": 67, "Construction / Trades": 66, "Technology / Software": 78, "Healthcare / Medical": 74 },
};

function getPeerBenchmark(size, industry) {
  const g = PEER_BENCHMARKS[size] || PEER_BENCHMARKS["11–25"];
  return g[industry] || g.default;
}

function getScoreBand(score) {
  if (score <= 40) return { label: "Reactive", color: C.rose, bg: C.roseLight, desc: "Significant HR risk exposure. Immediate action required." };
  if (score <= 65) return { label: "Developing", color: C.amber, bg: C.amberLight, desc: "Foundation exists, but critical gaps remain." };
  if (score <= 82) return { label: "Strategic", color: C.emerald, bg: C.emeraldLight, desc: "Strong HR operations with room to reach best-in-class." };
  return { label: "Systemic", color: C.violet, bg: C.violetLight, desc: "Top-decile HR. Fewer than 10% of organizations reach this level." };
}

// ─── MASTER SYSTEM PROMPT ───────────────────────────────────────────────────────
function buildMasterPrompt(context) {
  return `You are PeopleScoreAI — the world's most sophisticated AI-powered HR diagnostic tool. You operate as a trained HR specialist conducting a structured discovery interview. You have deep expertise across all 12 AIHR HR functions and are grounded in the following authoritative frameworks:

## YOUR METHODOLOGY (NEVER DEVIATE FROM THIS)

**Maturity Framework:** Josh Bersin's 4-Level High-Impact HR Maturity Model
- Level 1 / Reactive (0-40): Ad hoc, compliance-reactive, high risk, no HR strategy
- Level 2 / Developing (41-65): Standardized service delivery, transactional HR, basic compliance
- Level 3 / Strategic (66-82): Integrated talent management, HR as business partner
- Level 4 / Systemic (83-100): Consultative, predictive, <10% of organizations reach here

**Research Backing:**
- Bersin Level 4 organizations: 38% higher retention, 3x revenue per employee vs Level 1
- Gartner HR Score: importance × maturity gap drives priority — not raw score alone
- SHRM BASK: compliance thresholds, HR-to-employee ratios, benchmark data
- Federal law thresholds: 1+ (FLSA, I-9), 15+ (Title VII, ADA, PDA), 20+ (ADEA, COBRA), 50+ (FMLA, ACA), 100+ (EEO-1, WARN Act)
- Industry-specific risk modifiers from OSHA, EEOC, DOL enforcement data

**Domain Weights by Company Size:**
- 1-25 employees: Compliance 35%, Payroll/Classification 20%, Hiring/Onboarding 15%, Policies 10%, Performance 5%, Compensation 5%, Culture 5%, Analytics 5%
- 26-100 employees: Compliance 25%, Payroll 15%, Hiring 15%, Policies 15%, Performance 10%, Compensation 10%, Culture 5%, Analytics 5%
- 101-500 employees: Compliance 15%, Payroll 10%, Hiring 15%, Policies 10%, Performance 15%, Compensation 15%, Culture 10%, Analytics 10%
- 500+ employees: Compliance 12%, Payroll 8%, Hiring 15%, Policies 8%, Performance 18%, Compensation 15%, Culture 12%, Analytics 12%

**Critical Gap Ceiling Rule:** If ANY of these are unresolved, overall score caps at 70:
- No I-9 process
- No workers' compensation insurance
- Manual/spreadsheet payroll
- No written anti-harassment policy
- No EPLI insurance (for companies 50+)

## THE 12 HR FUNCTIONS YOU ASSESS

**1. Administrative Responsibilities**
Core: Employee recordkeeping, HRIS/payroll infrastructure, compliance documentation, I-9s, new hire reporting, poster compliance, data security. Red flags: paper files, no HRIS, no document retention policy, I-9 errors. Enterprise complexity: multi-state data privacy (CPRA, Colorado, Virginia), biometric data compliance, multi-entity record management.

**2. Human Resource Planning (Workforce Planning)**
Core: Headcount planning, skills gap analysis, succession pipeline, workforce forecasting, build/buy/borrow decisions. Bersin: only 11% of organizations demonstrate strategic maturity. Red flags: purely reactive headcount, no succession plan, no skills inventory. Enterprise: segment-specific planning (corporate vs. field), scenario modeling, integration with finance.

**3. Recruitment & Selection**
Core: Sourcing strategy, employer brand, structured interviews, offer process, background checks, FCRA compliance, ATS infrastructure. Benchmarks: SHRM median time-to-fill 44 days; referred candidates 11x more likely to be hired than job board; sourced candidates 5-8x more likely to be hired. Red flags: no structured interview, no ATS, verbal-only offers, no background check process. Enterprise: multi-population hiring (corporate vs. hourly), volume hiring infrastructure, campus/pipeline programs.

**4. Performance Management**
Core: Goal-setting (OKRs/KPIs), review cadence, manager coaching, documentation, calibration, PIP process, HRIS integration. Benchmarks: 70% of engagement variance comes from direct manager (Gallup); 93% of organizations say performance drives organizational performance but only 44% say PM achieves it (SHRM). Red flags: verbal-only feedback, no documentation before termination, no goal-setting process. Enterprise: calibration across populations, rating distribution analysis, DEI lens on performance outcomes.

**5. Learning & Development**
Core: Onboarding effectiveness, compliance training, skills gap identification, L&D budget, LMS, manager training, leadership development. Bersin maturity: Static Training → Scaled Learning → Integrated Development → Dynamic Enablement. Benchmarks: 53% of employees would consider leaving due to lack of L&D (Lorman); companies that invest in L&D have 24% higher profit margins. Red flags: no formal onboarding, compliance training only, no L&D budget. Enterprise: segment-specific curricula (corporate vs. frontline), learning management across populations.

**6. Career Planning**
Core: Career pathing, internal mobility infrastructure, succession planning, individual development plans (IDPs), mentorship programs, promotion process transparency. Red flags: no defined career paths, promotions appear arbitrary, no succession plan for key roles, no IDP process. Enterprise: dual career tracks (technical/management), cross-population mobility, leadership pipeline programs.

**7. Function Evaluation (Job Architecture)**
Core: Job analysis, job descriptions, job classification (exempt/non-exempt), pay grades/bands, job leveling, FLSA classification accuracy. This is a CRITICAL compliance area — misclassification is DOL's #1 enforcement target. Red flags: outdated or missing job descriptions, exempt roles that should be non-exempt, no pay structure, gut-feel-based job levels. Enterprise: multi-population job architecture (corporate grades vs. frontline hourly classifications), global job families.

**8. Rewards (Total Rewards)**
Core: Compensation philosophy, pay bands/ranges, market data benchmarking, benefits administration, pay equity, bonus/incentive design, pay transparency compliance. Benchmarks: 17+ states require salary ranges in job postings; ACA affordability threshold 9.96% in 2026; SECURE 2.0 auto-enrollment for new 401k plans. Red flags: no comp philosophy, gut-feel pay, no market benchmarking, pay equity never reviewed, ACA non-compliance. Enterprise: multiple compensation structures across populations (executive, professional, hourly), equity/options programs.

**9. Industrial Relations (Employee & Labor Relations)**
Core: Employee relations case management, investigation process, documentation, union awareness (NLRA rights), grievance handling, termination procedures, WARN Act compliance, employment agreements. Red flags: verbal-only terminations, no investigation process, managers handling ER cases without HR support, NLRA policy violations. Enterprise: formal ER case management system, union/CBA management where applicable, complex termination protocols.

**10. Employee Participation & Communication**
Core: Employee voice mechanisms (surveys, town halls, suggestion programs), internal communication infrastructure, manager communication enablement, change management communication. Benchmarks: Gallup engagement: 23% higher profitability for highly engaged teams; only 32% of US employees engaged (2024). Red flags: no engagement measurement, no regular all-hands or communication cadence, employees learn about changes through rumor. Enterprise: segment-specific communication strategies (app-based for frontline, intranet for corporate), multi-language capability.

**11. Health & Safety**
Core: OSHA compliance (industry-specific standards), incident reporting (OSHA 300 logs), safety training, workers' comp management, return-to-work programs, mental health/EAP. OSHA penalties 2024: $16,131 per serious violation, $161,323 per willful/repeated. Red flags: no safety training, no incident reporting process, no written safety program (required for most industries), missing OSHA 300 logs. Enterprise: multi-site safety management, industry-specific standards (construction: fall protection, silica; healthcare: bloodborne pathogens; restaurant: ServSafe).

**12. Well-being**
Core: Physical wellness programs, mental health support (EAP), financial wellness, stress/burnout management, psychological safety, work-life balance policies, FMLA/disability accommodation process. Benchmarks: 83% of employees would consider leaving if company doesn't focus on wellbeing; WHO estimates $1T annually in lost productivity from depression/anxiety; 88% of HR leaders say wellbeing program is extremely/very important. Red flags: no EAP, no mental health resources, accommodation process absent or informal, no wellbeing data/measurement. Enterprise: wellbeing across diverse workforce populations (desk workers vs. frontline hourly workers have very different needs).

## CONTEXT FOR THIS SESSION
${context.auditMode === "organization" ? `
**Audit Mode:** Full Organization Assessment
**Company:** ${context.companyName || "not specified"}
**Industry:** ${context.industry || "not specified"}
**Size:** ${context.size || "not specified"} employees
**Stage:** ${context.stage || "not specified"}
**Workforce populations:** ${context.populations || "single population"}
` : context.auditMode === "population" ? `
**Audit Mode:** Specific Workforce Population Assessment
**Company:** ${context.companyName || "not specified"}
**Population being assessed:** ${context.populationName || "not specified"}
**Industry:** ${context.industry || "not specified"}
**Population size:** ${context.populationSize || "not specified"}
` : `
**Audit Mode:** HR Function Assessment (Functional Leader Self-Assessment)
**Company:** ${context.companyName || "not specified"}
**Function being assessed:** ${context.functionName || "not specified"}
**HR professional's title:** ${context.hrTitle || "not specified"}
**Company size:** ${context.size || "not specified"}
`}

## CONVERSATION RULES (MANDATORY — NEVER BREAK)

1. **Ask ONE question at a time.** Never ask multiple questions in a single turn.
2. **Ask follow-up questions when answers reveal risk.** If someone says "we've had some EEOC complaints," ask about resolution. If someone says "not sure," probe deeper before moving on.
3. **Format EVERY question as JSON** in this exact structure:
   \`\`\`json
   {
     "question": "The question text here",
     "context": "Why this matters (1-2 sentences max, business language not HR jargon)",
     "options": ["Option A", "Option B", "Option C", "Option D"],
     "allowFreeText": true,
     "domain": "compliance|payroll|hiring|policies|performance|compensation|culture|analytics",
     "tier": "critical|important|standard",
     "estimatedScore": 45
   }
   \`\`\`
4. **estimatedScore** = your current estimate of their overall PeopleScore (0-100) based on everything answered so far. Update this every turn.
5. **Conduct 12-18 exchanges** total before generating the final report. Adapt depth based on what you learn.
6. **Cover all 12 HR functions** but weight your questions based on their industry/size/mode. For a 10-person restaurant, lead with compliance and payroll. For a 300-person tech company, dig deeper into performance, compensation, and analytics.
7. **Never give advice during the audit.** Just gather information. Save all recommendations for the final report.
8. **When done, output a special JSON object:**
   \`\`\`json
   { "auditComplete": true, "finalScore": 67 }
   \`\`\`

## SCORING CALIBRATION NOTES
- Most SMBs (1-50 employees) score between 35-62 on first audit
- Companies with active HR professionals typically score 50-70
- Enterprise companies with basic but inconsistent HR score 55-70
- True best-in-class organizations (Bersin Level 4) score 83-98
- Be honest. Do not inflate scores to make people feel good.
- The peer benchmarks above are grounded in Bersin/SHRM research data`;
}

// ─── REPORT SYSTEM PROMPT ───────────────────────────────────────────────────────
function buildReportPrompt(context, conversation) {
  const allAnswers = conversation.filter(m => m.role === "user").map(m => m.content).join("\n");
  const finalScore = conversation.filter(m => m.role === "assistant" && m.scoreEstimate).slice(-1)[0]?.scoreEstimate || 55;
  const band = getScoreBand(finalScore);
  const pb = getPeerBenchmark(context.size || "11–25", context.industry || "Other");

  return `You are PeopleScoreAI. Generate a comprehensive, personalized HR audit report based on the completed discovery conversation.

## AUDIT CONTEXT
${context.auditMode === "organization" ? `Organization: ${context.companyName}, Industry: ${context.industry}, Size: ${context.size}, Stage: ${context.stage}` : context.auditMode === "population" ? `Population: ${context.populationName} at ${context.companyName}` : `Function: ${context.functionName} at ${context.companyName}`}
Final PeopleScore: ${finalScore}/100 (${band.label})
Peer Median: ${pb}/100
Person's name: ${context.name || "the HR leader"}

## FULL CONVERSATION (all answers given):
${allAnswers}

## REPORT RULES
1. Every finding must cite something they actually said in the conversation
2. Every gap must be translated into a dollar figure or specific legal exposure
3. Write to ${context.name || "them"} directly — "you" not "the company"
4. Business language only — no HR jargon without plain-language translation
5. Be direct: "you need to fix X" not "it is recommended"
6. Specific action steps — not "improve onboarding" but "implement a written 30-60-90 day onboarding plan for every new hire"

## OUTPUT FORMAT (follow exactly, use ## for section headers):

## Executive Summary
2-3 sentences. Overall HR situation and what it means for the business. Mention the score, the band, and the single most important finding.

## Your Score: ${finalScore}/100 — ${band.label}
What this score means in context. Compare to peer median of ${pb}. What does being ${band.label} mean specifically for a ${context.industry || "business"} their size?

${finalScore <= 70 ? `## ⚠️ Critical Gaps — Fix These First
These unresolved items create immediate legal exposure and cap your score. No other HR improvement matters until these are addressed.` : ""}

## Domain Analysis
For each relevant domain (only include domains where you have information), write:
**[Domain Name] — Score: XX/100**
What the gap means in plain language. What it could cost them. One specific action.

## Your 30-Day Action Plan
3-5 specific, sequenced, actionable steps. Most urgent first. Specific enough that they could hand this to someone to execute tomorrow.

## Financial Impact Assessment
Conservative estimate of what current gaps could cost them. Use real data: EEOC settlements, OSHA fines, turnover cost calculations, wrongful termination defense costs.

## How PeopleScoreAI Can Help
2-3 sentences. Specific to their situation and industry. What would ongoing support look like for them specifically?`;
}

// ─── CLAUDE API ─────────────────────────────────────────────────────────────────
async function callClaudeStream(systemPrompt, messages, onChunk, onDone) {
  const key = process.env.REACT_APP_ANTHROPIC_KEY;
  if (!key) throw new Error("API key not configured");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      system: systemPrompt,
      messages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const p = JSON.parse(data);
        if (p.type === "content_block_delta" && p.delta?.text) {
          full += p.delta.text;
          onChunk(p.delta.text, full);
        }
      } catch {}
    }
  }
  onDone(full);
}

// ─── PARSE CLAUDE QUESTION ───────────────────────────────────────────────────────
function parseQuestion(text) {
  try {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) {
      const parsed = JSON.parse(match[1]);
      if (parsed.auditComplete) return { auditComplete: true, finalScore: parsed.finalScore || 60 };
      if (parsed.question) return { ...parsed, raw: text };
    }
    // Try parsing entire response as JSON
    const trimmed = text.trim();
    if (trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      if (parsed.auditComplete) return { auditComplete: true, finalScore: parsed.finalScore || 60 };
      if (parsed.question) return { ...parsed, raw: text };
    }
  } catch {}
  return null;
}

// ─── SCORE RING ─────────────────────────────────────────────────────────────────
function Ring({ score, sz = 100, color = C.blue }) {
  const r = (sz - 10) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: sz, height: sz, flexShrink: 0 }}>
      <svg width={sz} height={sz} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={C.border} strokeWidth={7} />
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: sz * 0.28, fontWeight: 700, color, fontFamily: C.mono, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

// ─── REPORT RENDERER ────────────────────────────────────────────────────────────
function ReportText({ text }) {
  return (
    <div style={{ fontSize: 14, lineHeight: 1.85, color: C.text, fontFamily: C.sans }}>
      {text.split("\n").map((line, i) => {
        if (line.startsWith("## "))
          return <div key={i} style={{ fontWeight: 700, fontSize: 17, color: C.navy, marginTop: 24, marginBottom: 8, paddingBottom: 8, borderBottom: `2px solid ${C.border}` }}>{line.replace("## ", "")}</div>;
        if (line.startsWith("**") && line.endsWith("**"))
          return <div key={i} style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginTop: 14, marginBottom: 4 }}>{line.replace(/\*\*/g, "")}</div>;
        if (line.startsWith("- "))
          return <div key={i} style={{ paddingLeft: 20, marginBottom: 5, color: C.textSub, display: "flex", gap: 8 }}><span style={{ color: C.blue, flexShrink: 0 }}>•</span><span>{line.slice(2)}</span></div>;
        if (line.trim() === "") return <div key={i} style={{ height: 10 }} />;
        // Handle inline bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return <div key={i} style={{ marginBottom: 5, color: C.textSub }}>
          {parts.map((p, j) => p.startsWith("**") ? <strong key={j} style={{ color: C.text }}>{p.replace(/\*\*/g, "")}</strong> : p)}
        </div>;
      })}
    </div>
  );
}

// ─── NAV ────────────────────────────────────────────────────────────────────────
function Nav({ page, onHome, score, band }) {
  return (
    <nav style={{ borderBottom: `1px solid ${C.border}`, background: C.bg, position: "sticky", top: 0, zIndex: 100, padding: "0 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={onHome}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 14, height: 14, border: `2px solid ${C.blue}`, borderTop: "2px solid transparent", borderRadius: 2, transform: "rotate(45deg)" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: C.navy, letterSpacing: "-0.3px" }}>PeopleScore<span style={{ color: C.blue }}>.ai</span></span>
        </div>
        {(page === "audit" || page === "capture" || page === "results") && score > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 8, border: `1px solid ${band?.color}40`, background: band?.bg }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: band?.color, fontFamily: C.mono }}>{score}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: band?.color, textTransform: "uppercase", letterSpacing: "1px" }}>{band?.label}</span>
          </div>
        )}
        <a href="mailto:hello@peoplescoreai.com" style={{ fontSize: 13, color: C.textSub, textDecoration: "none" }}>Contact</a>
      </div>
    </nav>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [context, setContext] = useState({
    auditMode: null,
    companyName: "", industry: "", size: "", stage: "",
    populations: "", populationName: "", populationSize: "",
    functionName: "", hrTitle: "",
    name: "", email: "", company: ""
  });
  const [conversation, setConversation] = useState([]); // {role, content, scoreEstimate, parsed}
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const topRef = useRef(null);
  const chatBottomRef = useRef(null);

  const liveScore = conversation.filter(m => m.scoreEstimate).slice(-1)[0]?.scoreEstimate || 30;
  const band = getScoreBand(liveScore);

  function scrollToBottom() {
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  // Start the Claude-led audit conversation
  async function startAudit() {
    setPage("audit");
    setLoading(true);
    setError(null);
    topRef.current?.scrollIntoView({ behavior: "smooth" });

    const systemPrompt = buildMasterPrompt(context);
    const firstMsg = `Start the PeopleScoreAI HR audit for ${context.companyName || "this organization"}.

Context: ${context.auditMode === "organization" ? `Full organization assessment for a ${context.industry} company with ${context.size} employees in the ${context.stage} stage.` : context.auditMode === "population" ? `Assessing the ${context.populationName} workforce population.` : `Functional assessment of the ${context.functionName} function, conducted by ${context.hrTitle}.`}

Begin with your first diagnostic question. Follow the JSON format exactly.`;

    try {
      let fullResponse = "";
      await callClaudeStream(
        systemPrompt,
        [{ role: "user", content: firstMsg }],
        (chunk, full) => { fullResponse = full; },
        (full) => {
          const parsed = parseQuestion(full);
          if (parsed && !parsed.auditComplete) {
            const score = parsed.estimatedScore || 30;
            setCurrentQuestion(parsed);
            setConversation([{ role: "assistant", content: full, scoreEstimate: score, parsed }]);
            setQuestionCount(1);
          }
          setLoading(false);
          scrollToBottom();
        }
      );
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  // Submit an answer and get the next question
  async function submitAnswer(answer) {
    if (!answer.trim() || loading) return;

    const newConv = [...conversation, { role: "user", content: answer }];
    setConversation(newConv);
    setUserInput("");
    setLoading(true);
    setCurrentQuestion(null);
    scrollToBottom();

    const systemPrompt = buildMasterPrompt(context);
    const messages = newConv.map(m => ({ role: m.role, content: m.content }));

    try {
      let fullResponse = "";
      await callClaudeStream(
        systemPrompt,
        messages,
        (chunk, full) => { fullResponse = full; },
        (full) => {
          const parsed = parseQuestion(full);
          if (parsed?.auditComplete) {
            const finalScore = parsed.finalScore || liveScore;
            const finalConv = [...newConv, { role: "assistant", content: full, scoreEstimate: finalScore, parsed, auditComplete: true }];
            setConversation(finalConv);
            setPage("capture");
          } else if (parsed) {
            const score = parsed.estimatedScore || liveScore;
            const updatedConv = [...newConv, { role: "assistant", content: full, scoreEstimate: score, parsed }];
            setConversation(updatedConv);
            setCurrentQuestion(parsed);
            setQuestionCount(q => q + 1);
          } else {
            // Claude gave a non-JSON response — treat as follow-up text, ask to continue
            const updatedConv = [...newConv, { role: "assistant", content: full, scoreEstimate: liveScore }];
            setConversation(updatedConv);
            // Ask Claude to give us a structured question
          }
          setLoading(false);
          scrollToBottom();
        }
      );
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  // Generate the final report
  async function generateReport() {
    if (!context.email) return;
    setPage("results");
    setReportLoading(true);
    setReport("");

    const systemPrompt = buildReportPrompt(context, conversation);
    const userMsg = `Generate the complete PeopleScoreAI HR audit report for ${context.name || "this leader"} at ${context.company || context.companyName}. Write directly to them. Be specific to everything they shared in the conversation. Start immediately with the Executive Summary — no preamble or meta-commentary.`;

    try {
      let full = "";
      await callClaudeStream(
        systemPrompt,
        [{ role: "user", content: userMsg }],
        (chunk, fullSoFar) => { setReport(fullSoFar); },
        (finalReport) => { setReport(finalReport); setReportLoading(false); }
      );
    } catch (e) {
      setError(e.message);
      setReportLoading(false);
    }
  }

  function resetAll() {
    setPage("landing");
    setContext({ auditMode: null, companyName: "", industry: "", size: "", stage: "", populations: "", populationName: "", populationSize: "", functionName: "", hrTitle: "", name: "", email: "", company: "" });
    setConversation([]);
    setCurrentQuestion(null);
    setReport("");
    setQuestionCount(0);
    setError(null);
  }

  const pb = getPeerBenchmark(context.size || "11–25", context.industry || "Other");

  // ── RENDER ────────────────────────────────────────────────────────────────────

  // LANDING
  if (page === "landing") return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: C.sans }} ref={topRef}>
      <Nav page="landing" onHome={resetAll} score={0} band={band} />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "72px 24px 80px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, border: `1px solid ${C.blue}30`, background: C.blueLight, marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: C.blue, letterSpacing: "1.5px", textTransform: "uppercase" }}>PeopleScore™ · HR Diagnostic</span>
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.08, marginBottom: 20, color: C.navy }}>
          Know exactly where<br /><span style={{ color: C.blue }}>your HR stands.</span>
        </h1>
        <p style={{ fontSize: 18, color: C.textSub, lineHeight: 1.7, marginBottom: 8, maxWidth: 500 }}>
          A dynamic, AI-led HR diagnostic that adapts to your specific business — industry, size, workforce structure, and stage.
        </p>
        <p style={{ fontSize: 13, color: C.textDim, marginBottom: 44 }}>Takes 10–15 minutes · No signup required · Free</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 40 }}>
          {[
            ["Personalized score (0–100)", "Calibrated to your industry, size & stage"],
            ["Dynamic questioning", "Adapts based on what you share"],
            ["Peer benchmarking", "vs. companies like yours"],
            ["Prioritized action plan", "What to fix first and why"],
          ].map(([t, s]) => (
            <div key={t} style={{ padding: "16px 18px", border: `1px solid ${C.border}`, borderRadius: 12, background: C.bgSub }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 3 }}>✓ {t}</div>
              <div style={{ fontSize: 12, color: C.textDim }}>{s}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setPage("setup")}
          style={{ display: "block", width: "100%", padding: "18px", background: C.navy, border: "none", borderRadius: 12, color: C.textInverse, fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: "-0.2px" }}>
          Start My HR Audit →
        </button>
        <div style={{ fontSize: 12, color: C.textDim, textAlign: "center", marginTop: 12 }}>
          Covers all 12 HR functions · Designed for companies of every size
        </div>
      </div>
    </div>
  );

  // SETUP — context gathering before Claude takes over
  if (page === "setup") return (
    <SetupFlow context={context} setContext={setContext} onStart={startAudit} onBack={() => setPage("landing")} />
  );

  // AUDIT — Claude-led conversation
  if (page === "audit") return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: C.sans }} ref={topRef}>
      <Nav page="audit" onHome={resetAll} score={liveScore} band={band} />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px 120px" }}>

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <Ring score={liveScore} sz={56} color={band.color} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: 4 }}>
              Question {questionCount} · Score updates with each answer
            </div>
            <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min((questionCount / 15) * 100, 100)}%`, background: C.blue, borderRadius: 2, transition: "width 0.5s ease" }} />
            </div>
          </div>
        </div>

        {/* Chat history */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
          {conversation.map((msg, i) => {
            if (msg.role === "assistant" && msg.parsed && !msg.auditComplete) {
              return (
                <div key={i} style={{ padding: "20px 24px", background: C.bgSub, border: `1px solid ${C.border}`, borderRadius: 16, borderTopLeftRadius: 4 }}>
                  {msg.parsed.tier === "critical" && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.rose, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8, padding: "2px 8px", background: C.roseLight, border: `1px solid ${C.rose}30`, borderRadius: 4, display: "inline-block" }}>
                      ⚠ Critical — weighted heavily in your score
                    </div>
                  )}
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.blue, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                    {msg.parsed.domain?.replace(/\|/g, " / ")}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, lineHeight: 1.4, marginBottom: 8 }}>{msg.parsed.question}</div>
                  {msg.parsed.context && (
                    <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6, marginBottom: 0 }}>{msg.parsed.context}</div>
                  )}
                </div>
              );
            }
            if (msg.role === "user") {
              return (
                <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ padding: "12px 16px", background: C.navy, borderRadius: 12, borderBottomRightRadius: 4, color: C.textInverse, fontSize: 14, maxWidth: "70%" }}>
                    {msg.content}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* Current question */}
        {currentQuestion && !loading && (
          <div style={{ padding: "20px 24px", background: C.bgSub, border: `1px solid ${C.border}`, borderRadius: 16, borderTopLeftRadius: 4, marginBottom: 20 }}>
            {currentQuestion.tier === "critical" && (
              <div style={{ fontSize: 10, fontWeight: 700, color: C.rose, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8, padding: "2px 8px", background: C.roseLight, border: `1px solid ${C.rose}30`, borderRadius: 4, display: "inline-block" }}>
                ⚠ Critical — weighted heavily in your score
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 600, color: C.blue, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
              {currentQuestion.domain}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, lineHeight: 1.4, marginBottom: 8 }}>{currentQuestion.question}</div>
            {currentQuestion.context && (
              <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6, marginBottom: 16 }}>{currentQuestion.context}</div>
            )}

            {/* Choice buttons */}
            {currentQuestion.options && currentQuestion.options.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentQuestion.options.map(opt => (
                  <button key={opt} onClick={() => submitAnswer(opt)}
                    style={{ padding: "12px 16px", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, cursor: "pointer", textAlign: "left", transition: "all 0.1s" }}
                    onMouseEnter={e => { e.target.style.borderColor = C.blue; e.target.style.background = C.blueLight; e.target.style.color = C.blue; }}
                    onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.background = C.bg; e.target.style.color = C.text; }}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Free text input */}
        {currentQuestion && !loading && (
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <input
              type="text"
              placeholder={currentQuestion.allowFreeText ? "Or type your own answer..." : "Select an option above..."}
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && userInput.trim() && submitAnswer(userInput)}
              style={{ flex: 1, padding: "12px 16px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, background: C.bg, outline: "none", fontFamily: C.sans }}
            />
            {userInput.trim() && (
              <button onClick={() => submitAnswer(userInput)}
                style={{ padding: "12px 20px", background: C.navy, border: "none", borderRadius: 10, color: C.textInverse, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                →
              </button>
            )}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "24px", color: C.textDim, fontSize: 14 }}>
            <div style={{ display: "inline-block", width: 20, height: 20, border: `2px solid ${C.blue}`, borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: 10, verticalAlign: "middle" }} />
            Analyzing your answer...
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {error && (
          <div style={{ padding: "16px", background: C.roseLight, border: `1px solid ${C.rose}`, borderRadius: 10, color: C.rose, fontSize: 13, marginTop: 16 }}>
            {error} — <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: C.rose, cursor: "pointer", textDecoration: "underline" }}>Try again</button>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>
    </div>
  );

  // CAPTURE
  if (page === "capture") return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: C.sans }} ref={topRef}>
      <Nav page="capture" onHome={resetAll} score={liveScore} band={band} />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Ring score={liveScore} sz={120} color={band.color} />
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: band.color }}>{band.label}</div>
            <div style={{ fontSize: 14, color: C.textSub, marginTop: 4 }}>{band.desc}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 32 }}>
          <div style={{ textAlign: "center", padding: "12px 20px", border: `1px solid ${C.border}`, borderRadius: 10, background: C.bgSub }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: liveScore > pb ? C.emerald : C.rose, fontFamily: C.mono }}>{liveScore > pb ? "+" : ""}{liveScore - pb}</div>
            <div style={{ fontSize: 11, color: C.textDim }}>vs peer median ({pb})</div>
          </div>
          <div style={{ textAlign: "center", padding: "12px 20px", border: `1px solid ${C.border}`, borderRadius: 10, background: C.bgSub }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: C.mono }}>{questionCount}</div>
            <div style={{ fontSize: 11, color: C.textDim }}>questions answered</div>
          </div>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "-0.5px", marginBottom: 8 }}>Get your full HR report</h2>
        <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.6, marginBottom: 24 }}>
          We'll generate a personalized HR audit report based on everything you shared — specific to your {context.industry || "industry"} and your situation.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {[{ label: "Your name", k: "name", ph: "Jane Smith", type: "text" },
          { label: "Work email", k: "email", ph: "jane@company.com", type: "email" },
          { label: "Company name", k: "company", ph: "Acme Corp", type: "text" },
          ].map(({ label, k, ph, type }) => (
            <div key={k}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>{label}</label>
              <input type={type} placeholder={ph} value={context[k]}
                onChange={e => setContext(c => ({ ...c, [k]: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 15, color: C.text, background: C.bg, outline: "none", boxSizing: "border-box", fontFamily: C.sans }} />
            </div>
          ))}
        </div>

        <button onClick={generateReport} disabled={!context.email}
          style={{ display: "block", width: "100%", padding: "18px", background: context.email ? C.navy : C.border, border: "none", borderRadius: 12, color: C.textInverse, fontSize: 16, fontWeight: 700, cursor: context.email ? "pointer" : "not-allowed" }}>
          Generate My HR Report →
        </button>
        <div style={{ fontSize: 12, color: C.textDim, textAlign: "center", marginTop: 10 }}>No spam · Your data is never sold</div>
      </div>
    </div>
  );

  // RESULTS
  if (page === "results") return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: C.sans }} ref={topRef}>
      <Nav page="results" onHome={resetAll} score={liveScore} band={band} />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "24px", border: `1px solid ${C.border}`, borderRadius: 16, background: C.bgSub, marginBottom: 24 }}>
          <Ring score={liveScore} sz={100} color={band.color} />
          <div>
            <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4, fontFamily: C.mono }}>PeopleScore™</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: band.color, marginBottom: 4 }}>{band.label}</div>
            <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.5 }}>{band.desc}</div>
            <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 700, color: liveScore > pb ? C.emerald : C.rose, fontFamily: C.mono }}>{liveScore > pb ? "+" : ""}{liveScore - pb}</span>
                <span style={{ fontSize: 11, color: C.textDim, marginLeft: 4 }}>vs peer median ({pb})</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 14, fontFamily: C.mono }}>
            Your HR Report {context.name && `· ${context.name}`}
          </div>

          {reportLoading && !report && (
            <div style={{ padding: "40px", border: `1px solid ${C.border}`, borderRadius: 12, textAlign: "center" }}>
              <div style={{ display: "inline-block", width: 24, height: 24, border: `3px solid ${C.blue}`, borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 12 }} />
              <div style={{ fontSize: 14, color: C.textSub }}>Analyzing your complete HR picture...</div>
              <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>Generating your personalized report</div>
            </div>
          )}

          {report && (
            <div style={{ padding: "28px", border: `1px solid ${C.border}`, borderRadius: 12, background: C.bg }}>
              <ReportText text={report} />
              {reportLoading && <span style={{ display: "inline-block", width: 2, height: 16, background: C.blue, marginLeft: 2, verticalAlign: "middle", animation: "blink 1s infinite" }} />}
            </div>
          )}

          {error && (
            <div style={{ padding: "16px", background: C.roseLight, border: `1px solid ${C.rose}`, borderRadius: 10, color: C.rose, fontSize: 13 }}>{error}</div>
          )}
          <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
        </div>

        <div style={{ padding: "28px", background: C.bgDark, borderRadius: 16, textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.textInverse, letterSpacing: "-0.5px", marginBottom: 8 }}>Ready to fix what we found?</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 20, lineHeight: 1.6 }}>PeopleScoreAI turns this report into an ongoing HR action plan with support at every step.</div>
          <a href={`mailto:hello@peoplescoreai.com?subject=PeopleScoreAI — I scored ${liveScore} and want to improve`}
            style={{ display: "inline-block", padding: "13px 28px", background: C.blue, borderRadius: 10, color: C.textInverse, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
            Talk to PeopleScoreAI →
          </a>
        </div>

        <div style={{ textAlign: "center" }}>
          <button onClick={resetAll} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textSub, fontSize: 13, cursor: "pointer" }}>
            Retake Audit
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}

// ─── SETUP FLOW ──────────────────────────────────────────────────────────────────
function SetupFlow({ context, setContext, onStart, onBack }) {
  const [step, setStep] = useState(0);
  const [localCtx, setLocalCtx] = useState({ ...context });

  function update(key, val) { setLocalCtx(c => ({ ...c, [key]: val })); }
  function next() { setStep(s => s + 1); }
  function back() { if (step === 0) onBack(); else setStep(s => s - 1); }

  const canProceed = () => {
    if (step === 0) return !!localCtx.auditMode;
    if (step === 1) return localCtx.auditMode === "organization" ? (localCtx.industry && localCtx.size) : localCtx.auditMode === "population" ? (localCtx.populationName && localCtx.industry) : (localCtx.functionName && localCtx.hrTitle);
    if (step === 2) return !!localCtx.companyName;
    return true;
  };

  function startAudit() {
    setContext(localCtx);
    onStart();
  }

  const steps = [
    // Step 0: Audit mode selection
    <div key="mode">
      <div style={{ fontSize: 11, fontWeight: 600, color: C.blue, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 16 }}>Step 1 of 3 · Audit Focus</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: C.navy, letterSpacing: "-0.5px", lineHeight: 1.3, marginBottom: 8 }}>What would you like to assess today?</h2>
      <p style={{ fontSize: 14, color: C.textSub, marginBottom: 28, lineHeight: 1.6 }}>PeopleScoreAI adapts its diagnostic based on what you're evaluating. Different assessment types ask different questions.</p>
      {[
        { key: "organization", title: "Full Organization", desc: "Assess your company's overall HR health across all functions", icon: "🏢" },
        { key: "population", title: "Specific Workforce Population", desc: "Assess a specific group within your organization (e.g., corporate employees, field/hourly workers, a business unit)", icon: "👥" },
        { key: "function", title: "HR Function Assessment", desc: "For HR leaders: assess the maturity of a specific HR function (Talent Acquisition, Total Rewards, L&D, etc.)", icon: "🎯" },
      ].map(({ key, title, desc, icon }) => (
        <button key={key} onClick={() => update("auditMode", key)}
          style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px", marginBottom: 10, background: localCtx.auditMode === key ? C.blueLight : C.bgSub, border: `2px solid ${localCtx.auditMode === key ? C.blue : C.border}`, borderRadius: 12, width: "100%", cursor: "pointer", textAlign: "left" }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: localCtx.auditMode === key ? C.blue : C.navy, marginBottom: 3 }}>{title}</div>
            <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.5 }}>{desc}</div>
          </div>
          {localCtx.auditMode === key && <span style={{ marginLeft: "auto", color: C.blue, flexShrink: 0 }}>✓</span>}
        </button>
      ))}
    </div>,

    // Step 1: Context based on mode
    <div key="context">
      <div style={{ fontSize: 11, fontWeight: 600, color: C.blue, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 16 }}>Step 2 of 3 · Tell Us About {localCtx.auditMode === "function" ? "Your Function" : "Your Organization"}</div>

      {localCtx.auditMode === "organization" && (<>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.navy, letterSpacing: "-0.5px", marginBottom: 20 }}>About your organization</h2>
        <Label>Industry</Label>
        <Select value={localCtx.industry} onChange={v => update("industry", v)}
          options={["Healthcare / Medical", "Construction / Trades", "Restaurant / Hospitality", "Professional Services", "Technology / Software", "Manufacturing", "Retail / E-commerce", "Financial Services", "Education / Nonprofit", "Other"]} />
        <Label>Total employees</Label>
        <Select value={localCtx.size} onChange={v => update("size", v)}
          options={["1–10", "11–25", "26–50", "51–200", "201–500", "500+"]} />
        <Label>Business stage</Label>
        <Select value={localCtx.stage} onChange={v => update("stage", v)}
          options={["Just started (under 2 years)", "Growing fast (2–5 years)", "Stable & established (5+ years)", "Restructuring or pivoting"]} />
        <Label>Multiple workforce populations? (optional)</Label>
        <input type="text" placeholder="e.g., 1,100 restaurant / 400 corporate" value={localCtx.populations}
          onChange={e => update("populations", e.target.value)}
          style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, background: C.bg, outline: "none", boxSizing: "border-box", fontFamily: C.sans, marginBottom: 14 }} />
      </>)}

      {localCtx.auditMode === "population" && (<>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.navy, letterSpacing: "-0.5px", marginBottom: 20 }}>About the population you're assessing</h2>
        <Label>Population name</Label>
        <input type="text" placeholder="e.g., Corporate employees, Restaurant team members, Field operations" value={localCtx.populationName}
          onChange={e => update("populationName", e.target.value)}
          style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, background: C.bg, outline: "none", boxSizing: "border-box", fontFamily: C.sans, marginBottom: 14 }} />
        <Label>Industry</Label>
        <Select value={localCtx.industry} onChange={v => update("industry", v)}
          options={["Healthcare / Medical", "Construction / Trades", "Restaurant / Hospitality", "Professional Services", "Technology / Software", "Manufacturing", "Retail / E-commerce", "Financial Services", "Education / Nonprofit", "Other"]} />
        <Label>Population size (approximate)</Label>
        <Select value={localCtx.populationSize} onChange={v => update("populationSize", v)}
          options={["Under 50", "50–200", "200–500", "500–1,000", "1,000+"]} />
      </>)}

      {localCtx.auditMode === "function" && (<>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.navy, letterSpacing: "-0.5px", marginBottom: 20 }}>About your HR function</h2>
        <Label>Which HR function are you assessing?</Label>
        <Select value={localCtx.functionName} onChange={v => update("functionName", v)}
          options={["Talent Acquisition / Recruiting", "Total Rewards / Compensation & Benefits", "Learning & Development", "Performance Management", "HR Operations / Administration", "Employee Relations", "Health, Safety & Wellbeing", "Workforce Planning / HR Strategy", "HR Business Partnering", "People Analytics", "Career Development & Succession", "Diversity, Equity & Inclusion"]} />
        <Label>Your title</Label>
        <input type="text" placeholder="e.g., VP of Talent, Director of Total Rewards" value={localCtx.hrTitle}
          onChange={e => update("hrTitle", e.target.value)}
          style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, background: C.bg, outline: "none", boxSizing: "border-box", fontFamily: C.sans, marginBottom: 14 }} />
        <Label>Company size</Label>
        <Select value={localCtx.size} onChange={v => update("size", v)}
          options={["1–10", "11–25", "26–50", "51–200", "201–500", "500+"]} />
      </>)}
    </div>,

    // Step 2: Company name
    <div key="name">
      <div style={{ fontSize: 11, fontWeight: 600, color: C.blue, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 16 }}>Step 3 of 3 · Almost Ready</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: C.navy, letterSpacing: "-0.5px", marginBottom: 8 }}>What's your company name?</h2>
      <p style={{ fontSize: 14, color: C.textSub, marginBottom: 24, lineHeight: 1.6 }}>This helps personalize your audit experience. You can use a fictitious name if you prefer.</p>
      <input type="text" placeholder="Company name" value={localCtx.companyName}
        onChange={e => update("companyName", e.target.value)}
        onKeyDown={e => e.key === "Enter" && localCtx.companyName && startAudit()}
        style={{ width: "100%", padding: "14px 16px", border: `2px solid ${C.border}`, borderRadius: 12, fontSize: 16, color: C.text, background: C.bg, outline: "none", boxSizing: "border-box", fontFamily: C.sans, marginBottom: 12 }} />
      <p style={{ fontSize: 13, color: C.textDim, marginBottom: 0 }}>
        Your audit will be conducted by PeopleScoreAI — a trained HR specialist that adapts its questions based on your specific context. Expect 12–18 focused questions.
      </p>
    </div>,
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: C.sans }}>
      <Nav page="setup" onHome={onBack} score={0} band={getScoreBand(30)} />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px 80px" }}>
        {steps[step]}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
          <button onClick={back} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textSub, fontSize: 14, cursor: "pointer" }}>
            ← Back
          </button>
          {step < 2 ? (
            <button onClick={next} disabled={!canProceed()}
              style={{ padding: "12px 28px", background: canProceed() ? C.navy : C.border, border: "none", borderRadius: 10, color: C.textInverse, fontSize: 15, fontWeight: 600, cursor: canProceed() ? "pointer" : "not-allowed" }}>
              Continue →
            </button>
          ) : (
            <button onClick={startAudit} disabled={!canProceed()}
              style={{ padding: "14px 32px", background: canProceed() ? C.navy : C.border, border: "none", borderRadius: 12, color: C.textInverse, fontSize: 15, fontWeight: 700, cursor: canProceed() ? "pointer" : "not-allowed" }}>
              Start My Audit →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── UI HELPERS ──────────────────────────────────────────────────────────────────
function Label({ children }) {
  return <label style={{ fontSize: 13, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6, marginTop: 4 }}>{children}</label>;
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${value ? C.borderMid || C.border : C.border}`, borderRadius: 10, fontSize: 14, color: value ? C.text : C.textDim, background: C.bg, outline: "none", boxSizing: "border-box", fontFamily: C.sans, marginBottom: 14, cursor: "pointer" }}>
      <option value="">Select...</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
