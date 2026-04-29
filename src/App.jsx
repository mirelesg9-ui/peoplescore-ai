import { useState, useRef } from "react";

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

// ─── SCORING ───────────────────────────────────────────────────────────────────
const PEER_BENCHMARKS = {
  "1–10":    { default:44, "Restaurant / Hospitality":42, "Construction / Trades":38, "Technology / Software":51, "Healthcare / Medical":47 },
  "11–25":   { default:52, "Restaurant / Hospitality":48, "Construction / Trades":45, "Technology / Software":58, "Healthcare / Medical":54 },
  "26–50":   { default:59, "Restaurant / Hospitality":54, "Construction / Trades":52, "Technology / Software":65, "Healthcare / Medical":61 },
  "51–200":  { default:64, "Restaurant / Hospitality":60, "Construction / Trades":58, "Technology / Software":70, "Healthcare / Medical":66 },
  "201–500": { default:68, "Restaurant / Hospitality":63, "Construction / Trades":62, "Technology / Software":74, "Healthcare / Medical":70 },
  "500+":    { default:72, "Restaurant / Hospitality":67, "Construction / Trades":66, "Technology / Software":78, "Healthcare / Medical":74 },
};
function getPeer(size, ind) { const g = PEER_BENCHMARKS[size]||PEER_BENCHMARKS["11–25"]; return g[ind]||g.default; }
function getBand(score) {
  if (score<=40) return { label:"Reactive",   color:C.rose,    bg:C.roseLight,    desc:"Significant HR risk. Immediate action required." };
  if (score<=65) return { label:"Developing", color:C.amber,   bg:C.amberLight,   desc:"Foundation exists, but critical gaps remain." };
  if (score<=82) return { label:"Strategic",  color:C.emerald, bg:C.emeraldLight, desc:"Strong HR operations with room to reach best-in-class." };
  return              { label:"Systemic",   color:C.violet,  bg:C.violetLight,  desc:"Top-decile HR. Fewer than 10% of organizations reach this level." };
}

// ─── MASTER SYSTEM PROMPT ──────────────────────────────────────────────────────
function buildMasterPrompt(ctx) {
  const sizeLabel = ctx.auditMode==="organization" ? ctx.size :
                    ctx.auditMode==="population"   ? ctx.populationSize :
                    ctx.size;
  return `You are PeopleScoreAI an AI-powered HR diagnostic specialist. You conduct structured discovery interviews grounded in enterprise HR methodology. You adapt your questions based on what you learn, ask follow-ups when answers reveal risk, and never go off-framework.

## ABOUT THE PERSON & COMPANY
- Name: ${ctx.name}
- Company: ${ctx.companyName}
- Industry: ${ctx.industry}
- Company size: ${sizeLabel} employees
- Stage: ${ctx.stage || "not specified"}
${ctx.auditMode==="organization" ? `- Audit type: Full organization assessment
- Workforce populations: ${ctx.populations || "single population"}` :
  ctx.auditMode==="population" ? `- Audit type: Specific population assessment
- Population: ${ctx.populationName} (${ctx.populationSize} people)` :
  `- Audit type: HR Function self-assessment
- Function: ${ctx.functionName}
- Their title: ${ctx.hrTitle}`}

## CRITICAL RULE NEVER ASK FOR INFORMATION ALREADY PROVIDED
You already know their name (${ctx.name}), company (${ctx.companyName}), industry (${ctx.industry}), and size (${sizeLabel}). Never ask for any of these again. Reference them naturally in your questions to show you're listening.

## YOUR METHODOLOGY
**Bersin 4-Level Maturity:** Reactive (0-40) → Developing (41-65) → Strategic (66-82) → Systemic (83-100)
- Level 4 orgs: 38% higher retention, 3x revenue per employee vs Level 1
- Only ~10% of organizations reach Level 4

**Domain weights for ${sizeLabel} employees:**
${sizeLabel==="1–10"||sizeLabel==="11–25"||sizeLabel==="Under 50" ? 
"Compliance 35%, Payroll/Classification 20%, Hiring/Onboarding 15%, Policies 10%, Performance 5%, Compensation 5%, Culture 5%, Analytics 5%" :
sizeLabel==="26–50"||sizeLabel==="51–200"||sizeLabel==="50–200" ?
"Compliance 25%, Payroll 15%, Hiring 15%, Policies 15%, Performance 10%, Compensation 10%, Culture 5%, Analytics 5%" :
"Compliance 15%, Payroll 10%, Hiring 15%, Policies 8%, Performance 18%, Compensation 15%, Culture 10%, Analytics 9%"}

**Critical gap ceiling:** Score caps at 70 if: no I-9 process, no workers' comp, manual payroll, no anti-harassment policy.

**Federal law thresholds:** 1+ (FLSA, I-9), 15+ (Title VII, ADA), 20+ (ADEA, COBRA), 50+ (FMLA, ACA), 100+ (EEO-1, WARN)

## THE 12 HR FUNCTIONS YOU ASSESS

**1. Administrative Responsibilities** HRIS, recordkeeping, I-9s, data security, compliance documentation. Red flags: paper files, no HRIS, I-9 errors. Enterprise: multi-state data privacy (CPRA, CO, VA), biometric compliance.

**2. Human Resource Planning** Headcount planning, skills gap analysis, succession pipeline, workforce forecasting. Only 11% of orgs have strategic maturity here (Deloitte). Red flags: purely reactive hiring, no succession plan.

**3. Recruitment & Selection** Sourcing, employer brand, structured interviews, ATS, FCRA compliance. Benchmarks: SHRM median time-to-fill 41 days; referrals convert 11x better than job boards; sourced candidates 5-8x more likely to be hired. Red flags: verbal-only offers, no background check process.

**4. Performance Management** Goal-setting, review cadence, manager coaching, documentation, PIPs. 70% of engagement variance comes from direct manager (Gallup). 93% of orgs say PM drives performance but only 44% say their PM achieves it (SHRM). Red flags: verbal-only feedback, no documentation before termination.

**5. Learning & Development** Onboarding, compliance training, skills gaps, LMS, manager training, leadership development. 53% of employees would consider leaving due to lack of L&D (Lorman). Bersin: companies that invest in L&D have 24% higher profit margins. Red flags: no formal onboarding, no L&D budget.

**6. Career Planning** Career pathing, internal mobility, succession planning, IDPs, promotion transparency. Red flags: no defined career paths, promotions appear arbitrary, no succession plan for key roles.

**7. Function Evaluation (Job Architecture)** Job analysis, FLSA classification, pay grades, job leveling. Misclassification is DOL's #1 enforcement target. Red flags: outdated job descriptions, no pay structure, exempt roles that should be non-exempt.

**8. Rewards (Total Rewards)** Compensation philosophy, pay bands, market benchmarking, benefits admin, pay equity, pay transparency compliance. 17+ states require salary ranges in job postings. ACA affordability threshold 9.96% (2026). Red flags: gut-feel pay, no market data, pay equity never reviewed.

**9. Industrial Relations (Employee & Labor Relations)** ER case management, investigation process, termination procedures, WARN Act, NLRA rights, employment agreements. Red flags: verbal-only terminations, no investigation process, managers handling ER without HR support.

**10. Employee Participation & Communication** Engagement measurement, internal comms, manager enablement, change management. Gallup: 23% higher profitability for highly engaged teams; only 32% of US employees currently engaged. Red flags: no engagement surveys, employees learn about changes through rumor.

**11. Health & Safety** OSHA compliance, incident reporting (OSHA 300 logs), safety training, EAP, return-to-work. OSHA penalties 2024: $16,131 per serious violation, $161,323 per willful/repeated. Red flags: no safety training, missing OSHA 300 logs, no written safety program.

**12. Well-being** Mental health support (EAP), financial wellness, burnout management, psychological safety, FMLA/ADA accommodation. 83% of employees would consider leaving if company ignores wellbeing. WHO: $1T annually lost to depression/anxiety. Red flags: no EAP, no accommodation process, no wellbeing measurement.

## CONVERSATION RULES

1. **One question per turn. Always.**
2. **Ask follow-up questions when answers reveal risk.** If they mention EEOC complaints, lawsuits, high turnover, manual processes probe deeper before moving on.
3. **Reference what you know.** Use their name, company name, and industry naturally.
4. **Format EVERY response as JSON:**
\`\`\`json
{
  "question": "The question text",
  "context": "Why this matters 1-2 sentences in plain business language",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "allowFreeText": true,
  "domain": "compliance",
  "tier": "critical",
  "estimatedScore": 52,
  "questionsRemaining": 8
}
\`\`\`
5. **estimatedScore** = your running estimate of their overall PeopleScore (0-100). Update every turn.
6. **questionsRemaining** = your honest estimate of how many more questions you need before you have enough for a full report. Start at ~12, count down as you learn more.
7. **Conduct 10-16 questions total.** Weight toward what matters most for their industry/size/mode.
8. **${ctx.auditMode==="function" ? `For function assessments: focus 70% of questions on the ${ctx.functionName} function specifically. Ask about strategic maturity, team capabilities, data/analytics usage, stakeholder relationships, and outcomes not just basic compliance.` : "Cover compliance-critical areas first, then strategic HR domains."}**
9. **When you have enough information, output:**
\`\`\`json
{ "auditComplete": true, "finalScore": 67 }
\`\`\`

## SCORING CALIBRATION
- Most SMBs (1-50 employees) first audit: 35-58
- Companies with dedicated HR staff: 50-68  
- Enterprise with inconsistent HR: 55-70
- True best-in-class (Bersin Level 4): 83-98
- Be honest. Do not inflate scores.`;
}

// ─── REPORT PROMPTS ────────────────────────────────────────────────────────────
function buildWebReportPrompt(ctx, conv, score) {
  const band = getBand(score);
  const pb = getPeer(ctx.size||"11–25", ctx.industry||"Other");
  const answers = conv.filter(m=>m.role==="user").map(m=>m.content).join("\n");
  return `You are PeopleScoreAI. Generate a SHORT, punchy web summary report. This is NOT the full report the full detailed version goes in their email. This is the quick-action dashboard view.

CONTEXT: ${ctx.name} at ${ctx.companyName} | ${ctx.industry} | ${ctx.size||ctx.populationSize} employees
${ctx.auditMode==="function" ? `Function assessed: ${ctx.functionName}` : ""}
PeopleScore: ${score}/100 (${band.label}) | Peer median: ${pb}/100

ANSWERS GIVEN:
${answers}

FORMAT (use ## for headers, keep each section SHORT):

## Your Score: ${score}/100 ${band.label}
1-2 sentences only. What this score means for ${ctx.companyName} specifically.

## Why You Scored Here
3-4 bullet points max. The most important factors positive and negative. Be specific to what they said.

## Your Top 3 Priorities
Numbered list. Each priority = one specific action. No more than 2 sentences each. Most urgent first.

## One Thing to Do This Week
Single most impactful action they can take in the next 7 days. Make it specific and executable.

RULES:
- Maximum 300 words total
- Every sentence must reference something they actually said
- Business language only no HR jargon
- Direct: "you need to" not "it is recommended"
- Do NOT summarize the audit back to them they lived it`;
}

function buildEmailReportPrompt(ctx, conv, score) {
  const band = getBand(score);
  const pb = getPeer(ctx.size||"11–25", ctx.industry||"Other");
  const answers = conv.filter(m=>m.role==="user").map(m=>m.content).join("\n");
  return `You are PeopleScoreAI. Generate a comprehensive, detailed HR audit report. This is the full version sent via email.

CONTEXT: ${ctx.name} at ${ctx.companyName} | ${ctx.industry} | ${ctx.size||ctx.populationSize} employees
${ctx.auditMode==="function" ? `Function assessed: ${ctx.functionName} | Their title: ${ctx.hrTitle}` : `Audit mode: ${ctx.auditMode}`}
PeopleScore: ${score}/100 (${band.label}) | Peer median: ${pb}/100
Stage: ${ctx.stage||"not specified"}

ALL ANSWERS GIVEN:
${answers}

FORMAT (use ## for section headers):

## Executive Summary
3-4 sentences. Overall HR situation, what the score means for ${ctx.companyName} specifically, and the single most important finding. Name ${ctx.name} directly.

## Your PeopleScore: ${score}/100 ${band.label}
Score in context. Compare to peer median of ${pb}. What does being ${band.label} mean for a ${ctx.industry} ${ctx.auditMode==="function"?`${ctx.functionName} function`:"organization"} their size? What does reaching the next level look like?

${score<=70 ? `## ⚠️ Critical Gaps Address Immediately\nThese issues create active legal or financial exposure and cap your score. No other HR improvement matters until these are resolved.` : ""}

## Domain Analysis
For each relevant area where you have information:
**[Area Name] [Score]/100**
What the gap or strength means in plain language. What it could cost them or what it's worth to them. One specific action.

## Your 30-Day Action Plan
5-7 specific, sequenced, executable steps. Most urgent first. Specific enough that someone could act on them tomorrow.

## Your 90-Day Roadmap
What comes after the immediate fixes. Strategic initiatives to move from ${band.label} toward the next level.

## Financial Impact
Conservative estimate of what current gaps could cost use real data: EEOC settlements, OSHA fines, turnover cost formulas, wrongful termination defense costs. And the upside: what better HR could save or generate.

## How PeopleScoreAI Can Help
3-4 sentences. Specific to their situation, industry, and the gaps found. What would ongoing support look like for ${ctx.companyName}?

RULES:
- Every finding must cite something they actually said
- Every gap must have a dollar figure or specific legal exposure
- Write directly to ${ctx.name} use "you" throughout
- Business language only
- Be direct and specific`;
}

// ─── CLAUDE API ────────────────────────────────────────────────────────────────
async function callClaude(systemPrompt, messages, onChunk, onDone) {
  const key = process.env.REACT_APP_ANTHROPIC_KEY;
  if (!key) throw new Error("API key not configured. Please add REACT_APP_ANTHROPIC_KEY in Vercel environment variables.");
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
  if (!res.ok) throw new Error(`API error ${res.status}. Please try again.`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n"); buf = lines.pop();
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

function parseQ(text) {
  try {
    const m = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (m) { const p = JSON.parse(m[1]); if (p.question||p.auditComplete) return p; }
    const t = text.trim();
    if (t.startsWith("{")) { const p = JSON.parse(t); if (p.question||p.auditComplete) return p; }
  } catch {}
  return null;
}

// ─── UI COMPONENTS ─────────────────────────────────────────────────────────────
function Ring({ score, sz=100, color=C.blue }) {
  const r=(sz-10)/2, circ=2*Math.PI*r;
  return (
    <div style={{position:"relative",width:sz,height:sz,flexShrink:0}}>
      <svg width={sz} height={sz} style={{transform:"rotate(-90deg)"}}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={C.border} strokeWidth={7}/>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={circ-(score/100)*circ}
          strokeLinecap="round" style={{transition:"stroke-dashoffset 0.8s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:sz*.28,fontWeight:700,color,fontFamily:C.mono,lineHeight:1}}>{score}</span>
      </div>
    </div>
  );
}

function Nav({ onHome, onAbout, onContact, activePage, score, band }) {
  return (
    <nav style={{borderBottom:`1px solid ${C.border}`,background:C.bg,position:"sticky",top:0,zIndex:100,padding:"0 24px"}}>
      <div style={{maxWidth:1100,margin:"0 auto",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={onHome}>
          <div style={{width:32,height:32,borderRadius:8,background:C.navy,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:14,height:14,border:`2px solid ${C.blue}`,borderTop:"2px solid transparent",borderRadius:2,transform:"rotate(45deg)"}}/>
          </div>
          <span style={{fontWeight:700,fontSize:16,color:C.navy,letterSpacing:"-0.3px"}}>PeopleScore<span style={{color:C.blue}}>.ai</span></span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          {score > 0 && (
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 12px",borderRadius:8,border:`1px solid ${band?.color}40`,background:band?.bg}}>
              <span style={{fontSize:16,fontWeight:700,color:band?.color,fontFamily:C.mono}}>{score}</span>
              <span style={{fontSize:11,fontWeight:600,color:band?.color,textTransform:"uppercase",letterSpacing:"1px"}}>{band?.label}</span>
            </div>
          )}
          <button onClick={onAbout} style={{fontSize:13,color:activePage==="about"?C.blue:C.textSub,background:"none",border:"none",cursor:"pointer",fontFamily:C.sans,fontWeight:activePage==="about"?600:400}}>About</button>
          <button onClick={onContact} style={{fontSize:13,color:activePage==="contact"?C.blue:C.textSub,background:"none",border:"none",cursor:"pointer",fontFamily:C.sans,fontWeight:activePage==="contact"?600:400}}>Contact</button>
        </div>
      </div>
    </nav>
  );
}

function ReportText({ text }) {
  return (
    <div style={{fontSize:14,lineHeight:1.85,color:C.text,fontFamily:C.sans}}>
      {text.split("\n").map((line,i) => {
        if (line.startsWith("## ")) return <div key={i} style={{fontWeight:700,fontSize:17,color:C.navy,marginTop:24,marginBottom:8,paddingBottom:8,borderBottom:`2px solid ${C.border}`}}>{line.replace("## ","")}</div>;
        if (line.startsWith("**")&&line.endsWith("**")) return <div key={i} style={{fontWeight:700,fontSize:14,color:C.navy,marginTop:14,marginBottom:4}}>{line.replace(/\*\*/g,"")}</div>;
        if (line.match(/^\d+\./)) return <div key={i} style={{paddingLeft:20,marginBottom:6,color:C.textSub,display:"flex",gap:8}}><span style={{color:C.blue,flexShrink:0,fontWeight:600}}>{line.match(/^\d+/)[0]}.</span><span>{line.replace(/^\d+\.\s*/,"")}</span></div>;
        if (line.startsWith("- ")) return <div key={i} style={{paddingLeft:20,marginBottom:5,color:C.textSub,display:"flex",gap:8}}><span style={{color:C.blue,flexShrink:0}}>•</span><span>{line.slice(2)}</span></div>;
        if (line.trim()==="") return <div key={i} style={{height:10}}/>;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return <div key={i} style={{marginBottom:5,color:C.textSub}}>{parts.map((p,j)=>p.startsWith("**")?<strong key={j} style={{color:C.text}}>{p.replace(/\*\*/g,"")}</strong>:p)}</div>;
      })}
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [ctx, setCtx] = useState({
    auditMode:null, companyName:"", industry:"", size:"", stage:"",
    populations:"", populationName:"", populationSize:"",
    functionName:"", hrTitle:"",
    name:"", email:"", company:""
  });
  const [conv, setConv] = useState([]);
  const [curQ, setCurQ] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [qCount, setQCount] = useState(0);
  const [qRemaining, setQRemaining] = useState(12);
  const [webReport, setWebReport] = useState("");
  const [emailReport, setEmailReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [err, setErr] = useState(null);
  const topRef = useRef(null);
  const bottomRef = useRef(null);

  const liveScore = conv.filter(m=>m.scoreEstimate).slice(-1)[0]?.scoreEstimate || 30;
  const band = getBand(liveScore);
  const pb = getPeer(ctx.size||ctx.populationSize||"11–25", ctx.industry||"Other");

  function scroll() { setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100); }

  async function startAudit() {
    setPage("audit");
    setLoading(true);
    setErr(null);
    topRef.current?.scrollIntoView({behavior:"smooth"});
    const sys = buildMasterPrompt(ctx);
    const firstMsg = `Begin the PeopleScoreAI HR audit for ${ctx.name} at ${ctx.companyName}.
${ctx.auditMode==="organization" ? `This is a full organization assessment for a ${ctx.industry} company with ${ctx.size} employees in the ${ctx.stage} stage.${ctx.populations?` They have multiple workforce populations: ${ctx.populations}.`:""}` :
  ctx.auditMode==="population" ? `This is a specific population assessment for the ${ctx.populationName} workforce (${ctx.populationSize} people) in the ${ctx.industry} industry.` :
  `This is an HR function self-assessment. ${ctx.name} is the ${ctx.hrTitle} and wants to assess the maturity of their ${ctx.functionName} function at ${ctx.companyName} (${ctx.size} employees, ${ctx.industry}).`}
Start with your first diagnostic question. Remember: do NOT ask for their name, company, industry, or company size you already have that information.`;
    try {
      let full="";
      await callClaude(sys, [{role:"user",content:firstMsg}],
        (_,f)=>{full=f;},
        (f)=>{
          const p=parseQ(f);
          if(p&&!p.auditComplete){
            setConv([{role:"assistant",content:f,scoreEstimate:p.estimatedScore||30,parsed:p}]);
            setCurQ(p); setQCount(1); setQRemaining(p.questionsRemaining||12);
          }
          setLoading(false); scroll();
        }
      );
    } catch(e){ setErr(e.message); setLoading(false); }
  }

  async function submitAnswer(answer) {
    if(!answer.trim()||loading) return;
    const newConv=[...conv,{role:"user",content:answer}];
    setConv(newConv); setInput(""); setLoading(true); setCurQ(null); scroll();
    const sys=buildMasterPrompt(ctx);
    const msgs=newConv.map(m=>({role:m.role,content:m.content}));
    try {
      let full="";
      await callClaude(sys, msgs,
        (_,f)=>{full=f;},
        (f)=>{
          const p=parseQ(f);
          if(p?.auditComplete){
            const finalScore=p.finalScore||liveScore;
            setConv([...newConv,{role:"assistant",content:f,scoreEstimate:finalScore,auditComplete:true}]);
            setPage("capture");
          } else if(p){
            const updConv=[...newConv,{role:"assistant",content:f,scoreEstimate:p.estimatedScore||liveScore,parsed:p}];
            setConv(updConv); setCurQ(p);
            setQCount(q=>q+1); setQRemaining(p.questionsRemaining||Math.max(0,qRemaining-1));
          }
          setLoading(false); scroll();
        }
      );
    } catch(e){ setErr(e.message); setLoading(false); }
  }

  async function generateReports() {
    if(!ctx.email) return;
    setPage("results"); setReportLoading(true);
    setWebReport(""); setEmailReport("");
    const finalScore=liveScore;
    // Generate web report first (shorter)
    const webSys=buildWebReportPrompt(ctx,conv,finalScore);
    try {
      let wr="";
      await callClaude(webSys,[{role:"user",content:`Generate the quick-action web summary for ${ctx.name} at ${ctx.companyName}. Start immediately with the score section.`}],
        (_,f)=>{setWebReport(f);},
        (f)=>{setWebReport(f);}
      );
      // Then generate full email report
      const emailSys=buildEmailReportPrompt(ctx,conv,finalScore);
      await callClaude(emailSys,[{role:"user",content:`Generate the full detailed email report for ${ctx.name} at ${ctx.companyName}. Be comprehensive. Start immediately with the Executive Summary.`}],
        (_,f)=>{setEmailReport(f);},
        (f)=>{setEmailReport(f);}
      );
    } catch(e){ setErr(e.message); }
    setReportLoading(false);
  }

  function reset() {
    setPage("landing"); setCtx({auditMode:null,companyName:"",industry:"",size:"",stage:"",populations:"",populationName:"",populationSize:"",functionName:"",hrTitle:"",name:"",email:"",company:""});
    setConv([]); setCurQ(null); setWebReport(""); setEmailReport(""); setQCount(0); setQRemaining(12); setErr(null);
  }

  const navProps = {
    onHome: reset,
    onAbout: ()=>setPage("about"),
    onContact: ()=>setPage("contact"),
    activePage: page,
    score: page==="audit"||page==="capture"||page==="results" ? liveScore : 0,
    band
  };

  // ── ABOUT ──────────────────────────────────────────────────────────────────
  if(page==="about") return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:C.sans}} ref={topRef}>
      <Nav {...navProps}/>
      <div style={{maxWidth:720,margin:"0 auto",padding:"64px 24px 80px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,border:`1px solid ${C.blue}30`,background:C.blueLight,marginBottom:28}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:C.blue}}/>
          <span style={{fontSize:11,fontWeight:600,color:C.blue,letterSpacing:"1.5px",textTransform:"uppercase"}}>Our Mission</span>
        </div>
        <h1 style={{fontSize:44,fontWeight:800,letterSpacing:"-1.5px",lineHeight:1.1,marginBottom:24,color:C.navy}}>
          Work takes up a third of our lives.<br/><span style={{color:C.blue}}>It should be worth it.</span>
        </h1>
        <div style={{fontSize:17,color:C.textSub,lineHeight:1.8,marginBottom:32}}>
          <p style={{marginBottom:16}}>We spend roughly a third of our lives at work. For most people, that time is not good. Work is stressful, unfulfilling, and mismanaged. It does not have to be that way.</p>
          <p style={{marginBottom:16}}>HR done well is the function that changes that. It's what makes work meaningful, fair, and worth showing up for. Great HR attracts the right people, develops them, pays them equitably, protects them legally, and builds the kind of workplace where people actually want to be.</p>
          <p style={{marginBottom:16}}>The problem is that great HR has always been a privilege. Fortune 500 companies spend millions on dedicated HR teams, enterprise software, and specialist consultants. A 20-person restaurant, a 50-person healthcare clinic, or a 100-person construction company has the same employees, the same legal obligations, and the same human need for good people management but none of the infrastructure to deliver it.</p>
          <p style={{marginBottom:0}}>PeopleScoreAI exists to close that gap. We're building the HR operating system that gives every business regardless of size, industry, or budget access to the quality of HR insight and support previously reserved for organizations that could afford it.</p>
        </div>
        <div style={{padding:"28px 32px",background:C.bgSub,border:`1px solid ${C.border}`,borderRadius:16,marginBottom:40}}>
          <div style={{fontSize:15,fontWeight:700,color:C.navy,marginBottom:8}}>The belief that drives everything we build:</div>
          <div style={{fontSize:18,color:C.textSub,lineHeight:1.7,fontStyle:"italic"}}>"A 10-person plumbing company and a $500M healthcare system should both have access to the same quality of HR guidance that Google's People Operations team provides. The only difference should be price."</div>
        </div>
        <h2 style={{fontSize:26,fontWeight:700,color:C.navy,letterSpacing:"-0.5px",marginBottom:20}}>What We're Building</h2>
        {[
          ["The Diagnostic", "A free, AI-powered HR audit that gives any business a personalized score calibrated to their industry, size, and stage. Not a generic checklist. A real diagnostic.", "✓ Live today at peoplescoreai.com"],
          ["The Roadmap", "After the audit, an AI-generated action plan: what to fix, in what order, and why. Specific to your actual situation.", "→ Coming next"],
          ["The Partner", "An always-on HR advisor for employees, managers, and executives. Ask questions, get documents drafted, handle compliance in real time.", "→ Phase 3"],
          ["The Intelligence Layer", "Connect your existing HRIS Workday, BambooHR, Rippling, ADP and let PeopleScoreAI read your actual people data and tell you what it means.", "→ Phase 4"],
        ].map(([title,desc,status])=>(
          <div key={title} style={{display:"flex",gap:20,marginBottom:20,padding:"20px",border:`1px solid ${C.border}`,borderRadius:12,background:C.bg}}>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:C.navy,marginBottom:6}}>{title}</div>
              <div style={{fontSize:14,color:C.textSub,lineHeight:1.6,marginBottom:8}}>{desc}</div>
              <div style={{fontSize:12,fontWeight:600,color:status.startsWith("✓")?C.emerald:C.blue}}>{status}</div>
            </div>
          </div>
        ))}
        <div style={{marginTop:40,textAlign:"center"}}>
          <button onClick={()=>setPage("landing")} style={{padding:"14px 32px",background:C.navy,border:"none",borderRadius:12,color:C.textInverse,fontSize:15,fontWeight:700,cursor:"pointer"}}>
            Take the Free HR Audit →
          </button>
        </div>
      </div>
    </div>
  );

  // ── CONTACT ────────────────────────────────────────────────────────────────
  if(page==="contact") return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:C.sans}} ref={topRef}>
      <Nav {...navProps}/>
      <div style={{maxWidth:560,margin:"0 auto",padding:"80px 24px",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:20}}>👋</div>
        <h1 style={{fontSize:36,fontWeight:800,letterSpacing:"-1px",color:C.navy,marginBottom:16}}>Get in Touch</h1>
        <p style={{fontSize:16,color:C.textSub,lineHeight:1.7,marginBottom:40,maxWidth:400,margin:"0 auto 40px"}}>Whether you have questions about your PeopleScore, want to explore a partnership, or just want to talk HR we'd love to hear from you.</p>
        <a href="mailto:hello@peoplescoreai.com"
          style={{display:"inline-flex",alignItems:"center",gap:10,padding:"16px 32px",background:C.navy,borderRadius:12,color:C.textInverse,fontSize:16,fontWeight:700,textDecoration:"none",marginBottom:16}}>
          ✉ hello@peoplescoreai.com
        </a>
        <div style={{fontSize:13,color:C.textDim,marginBottom:48}}>We typically respond within one business day.</div>
        <div style={{padding:"24px",background:C.bgSub,border:`1px solid ${C.border}`,borderRadius:14}}>
          <div style={{fontSize:14,fontWeight:600,color:C.navy,marginBottom:8}}>Want to improve your PeopleScore?</div>
          <div style={{fontSize:13,color:C.textSub,marginBottom:16}}>Take the free 10-minute HR audit and get your personalized score today.</div>
          <button onClick={()=>setPage("landing")} style={{padding:"11px 24px",background:C.blue,border:"none",borderRadius:10,color:C.textInverse,fontSize:14,fontWeight:600,cursor:"pointer"}}>
            Start Free Audit →
          </button>
        </div>
      </div>
    </div>
  );

  // ── LANDING ────────────────────────────────────────────────────────────────
  if(page==="landing") return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:C.sans}} ref={topRef}>
      <Nav {...navProps}/>
      <div style={{maxWidth:680,margin:"0 auto",padding:"72px 24px 80px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,border:`1px solid ${C.blue}30`,background:C.blueLight,marginBottom:28}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:C.blue}}/>
          <span style={{fontSize:11,fontWeight:600,color:C.blue,letterSpacing:"1.5px",textTransform:"uppercase"}}>PeopleScore™ · HR Diagnostic</span>
        </div>
        <h1 style={{fontSize:52,fontWeight:800,letterSpacing:"-2px",lineHeight:1.08,marginBottom:20,color:C.navy}}>
          Know exactly where<br/><span style={{color:C.blue}}>your HR stands.</span>
        </h1>
        <p style={{fontSize:18,color:C.textSub,lineHeight:1.7,marginBottom:8,maxWidth:500}}>
          A dynamic, AI-led HR audit that adapts to your specific business industry, size, workforce structure, and stage.
        </p>
        <p style={{fontSize:13,color:C.textDim,marginBottom:44}}>Takes 10–15 minutes · No signup required · Free</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:40}}>
          {[["Personalized score (0–100)","Calibrated to your industry, size & stage"],
            ["Dynamic questioning","Adapts based on what you share"],
            ["Peer benchmarking","vs. companies like yours"],
            ["Prioritized action plan","What to fix first and why"],
          ].map(([t,s])=>(
            <div key={t} style={{padding:"16px 18px",border:`1px solid ${C.border}`,borderRadius:12,background:C.bgSub}}>
              <div style={{fontSize:13,fontWeight:600,color:C.navy,marginBottom:3}}>✓ {t}</div>
              <div style={{fontSize:12,color:C.textDim}}>{s}</div>
            </div>
          ))}
        </div>
        <button onClick={()=>setPage("setup")}
          style={{display:"block",width:"100%",padding:"18px",background:C.navy,border:"none",borderRadius:12,color:C.textInverse,fontSize:16,fontWeight:700,cursor:"pointer",letterSpacing:"-0.2px"}}>
          Start My HR Audit →
        </button>
        <div style={{fontSize:12,color:C.textDim,textAlign:"center",marginTop:12}}>Covers all 12 HR functions · Designed for every company size</div>
      </div>
    </div>
  );

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if(page==="setup") return (
    <SetupFlow ctx={ctx} setCtx={setCtx} onStart={startAudit} onBack={()=>setPage("landing")}/>
  );

  // ── AUDIT ──────────────────────────────────────────────────────────────────
  if(page==="audit") return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:C.sans}} ref={topRef}>
      <Nav {...navProps}/>
      <div style={{maxWidth:680,margin:"0 auto",padding:"32px 24px 140px"}}>
        {/* Progress header */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:32,padding:"16px 20px",background:C.bgSub,border:`1px solid ${C.border}`,borderRadius:14}}>
          <Ring score={liveScore} sz={56} color={band.color}/>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:13,fontWeight:600,color:C.navy}}>Question {qCount}</span>
              <span style={{fontSize:12,color:C.textDim,fontFamily:C.mono}}>
                {qRemaining > 0 ? `~${qRemaining} questions remaining · ~${qRemaining*2} min` : "Almost done"}
              </span>
            </div>
            <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.min((qCount/(qCount+qRemaining))*100,95)}%`,background:`linear-gradient(90deg, ${C.blue}, ${C.violet})`,borderRadius:3,transition:"width 0.5s ease"}}/>
            </div>
          </div>
        </div>

        {/* Chat messages */}
        <div style={{display:"flex",flexDirection:"column",gap:20,marginBottom:20}}>
          {conv.map((msg,i)=>{
            if(msg.role==="assistant"&&msg.parsed&&!msg.auditComplete) return (
              <div key={i} style={{padding:"20px 22px",background:C.bgSub,border:`1px solid ${C.border}`,borderRadius:14,borderTopLeftRadius:4}}>
                {msg.parsed.tier==="critical"&&<div style={{fontSize:10,fontWeight:700,color:C.rose,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8,padding:"2px 8px",background:C.roseLight,border:`1px solid ${C.rose}30`,borderRadius:4,display:"inline-block"}}>⚠ Critical</div>}
                <div style={{fontSize:11,fontWeight:600,color:C.blue,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>{msg.parsed.domain}</div>
                <div style={{fontSize:16,fontWeight:600,color:C.navy,lineHeight:1.4,marginBottom:6}}>{msg.parsed.question}</div>
                {msg.parsed.context&&<div style={{fontSize:13,color:C.textSub,lineHeight:1.6}}>{msg.parsed.context}</div>}
              </div>
            );
            if(msg.role==="user") return (
              <div key={i} style={{display:"flex",justifyContent:"flex-end"}}>
                <div style={{padding:"11px 16px",background:C.navy,borderRadius:12,borderBottomRightRadius:4,color:C.textInverse,fontSize:14,maxWidth:"72%"}}>{msg.content}</div>
              </div>
            );
            return null;
          })}
        </div>

        {/* Current question */}
        {curQ&&!loading&&(
          <div style={{padding:"20px 22px",background:C.bgSub,border:`1px solid ${C.border}`,borderRadius:14,borderTopLeftRadius:4,marginBottom:16}}>
            {curQ.tier==="critical"&&<div style={{fontSize:10,fontWeight:700,color:C.rose,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8,padding:"2px 8px",background:C.roseLight,border:`1px solid ${C.rose}30`,borderRadius:4,display:"inline-block"}}>⚠ Critical weighted heavily in your score</div>}
            <div style={{fontSize:11,fontWeight:600,color:C.blue,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>{curQ.domain}</div>
            <div style={{fontSize:16,fontWeight:600,color:C.navy,lineHeight:1.4,marginBottom:curQ.context?8:16}}>{curQ.question}</div>
            {curQ.context&&<div style={{fontSize:13,color:C.textSub,lineHeight:1.6,marginBottom:16}}>{curQ.context}</div>}
            {curQ.options?.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                {curQ.options.map(opt=>(
                  <button key={opt} onClick={()=>submitAnswer(opt)}
                    style={{padding:"11px 16px",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,cursor:"pointer",textAlign:"left",transition:"all 0.1s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.blue;e.currentTarget.style.background=C.blueLight;e.currentTarget.style.color=C.blue;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.bg;e.currentTarget.style.color=C.text;}}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {/* Free text callout */}
            <div style={{padding:"10px 14px",background:"#FFF9E6",border:`1px solid ${C.amber}40`,borderRadius:8,marginBottom:10}}>
              <span style={{fontSize:12,color:C.amber,fontWeight:700}}>💬 You can type anything</span>
              <span style={{fontSize:12,color:C.textSub}}> select an option above or type your own answer below. This is a real conversation.</span>
            </div>
          </div>
        )}

        {/* Text input */}
        {curQ&&!loading&&(
          <div style={{display:"flex",gap:10}}>
            <input type="text" placeholder="Type your own answer here..." value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&input.trim()&&submitAnswer(input)}
              style={{flex:1,padding:"12px 16px",border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:14,color:C.text,background:C.bg,outline:"none",fontFamily:C.sans}}/>
            {input.trim()&&(
              <button onClick={()=>submitAnswer(input)}
                style={{padding:"12px 20px",background:C.navy,border:"none",borderRadius:10,color:C.textInverse,fontSize:14,fontWeight:600,cursor:"pointer"}}>→</button>
            )}
          </div>
        )}

        {loading&&(
          <div style={{textAlign:"center",padding:"20px",color:C.textDim,fontSize:14}}>
            <div style={{display:"inline-block",width:18,height:18,border:`2px solid ${C.blue}`,borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",marginRight:8,verticalAlign:"middle"}}/>
            Analyzing your answer...
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
        {err&&<div style={{padding:"14px",background:C.roseLight,border:`1px solid ${C.rose}`,borderRadius:10,color:C.rose,fontSize:13,marginTop:12}}>{err}</div>}
        <div ref={bottomRef}/>
      </div>
    </div>
  );

  // ── CAPTURE ────────────────────────────────────────────────────────────────
  if(page==="capture") return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:C.sans}} ref={topRef}>
      <Nav {...navProps}/>
      <div style={{maxWidth:520,margin:"0 auto",padding:"56px 24px 80px"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <Ring score={liveScore} sz={110} color={band.color}/>
          <div style={{marginTop:12}}>
            <div style={{fontSize:22,fontWeight:700,color:band.color}}>{band.label}</div>
            <div style={{fontSize:14,color:C.textSub,marginTop:4}}>{band.desc}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:28}}>
          <div style={{textAlign:"center",padding:"12px 18px",border:`1px solid ${C.border}`,borderRadius:10,background:C.bgSub}}>
            <div style={{fontSize:20,fontWeight:700,color:liveScore>pb?C.emerald:C.rose,fontFamily:C.mono}}>{liveScore>pb?"+":""}{liveScore-pb}</div>
            <div style={{fontSize:11,color:C.textDim}}>vs peer median ({pb})</div>
          </div>
          <div style={{textAlign:"center",padding:"12px 18px",border:`1px solid ${C.border}`,borderRadius:10,background:C.bgSub}}>
            <div style={{fontSize:20,fontWeight:700,color:C.navy,fontFamily:C.mono}}>{qCount}</div>
            <div style={{fontSize:11,color:C.textDim}}>questions answered</div>
          </div>
        </div>
        <h2 style={{fontSize:22,fontWeight:700,color:C.navy,letterSpacing:"-0.5px",marginBottom:6}}>Your full report is ready</h2>
        <p style={{fontSize:14,color:C.textSub,lineHeight:1.6,marginBottom:20}}>
          Enter your email to receive your <strong>full detailed HR report</strong> including your 30-day action plan, 90-day roadmap, and financial impact analysis. A quick-action summary will also appear on screen.
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          <div>
            <label style={{fontSize:13,fontWeight:600,color:C.navy,display:"block",marginBottom:5}}>Email address <span style={{color:C.rose}}>*</span></label>
            <input type="email" placeholder="you@company.com" value={ctx.email}
              onChange={e=>setCtx(c=>({...c,email:e.target.value}))}
              onKeyDown={e=>e.key==="Enter"&&ctx.email&&generateReports()}
              style={{width:"100%",padding:"12px 14px",border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:15,color:C.text,background:C.bg,outline:"none",boxSizing:"border-box",fontFamily:C.sans}}/>
          </div>
        </div>
        <button onClick={generateReports} disabled={!ctx.email}
          style={{display:"block",width:"100%",padding:"16px",background:ctx.email?C.navy:C.border,border:"none",borderRadius:12,color:C.textInverse,fontSize:15,fontWeight:700,cursor:ctx.email?"pointer":"not-allowed"}}>
          Get My HR Report →
        </button>
        <div style={{fontSize:12,color:C.textDim,textAlign:"center",marginTop:8}}>Full report sent to your email · Quick summary on screen · No spam ever</div>
      </div>
    </div>
  );

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if(page==="results") return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:C.sans}} ref={topRef}>
      <Nav {...navProps}/>
      <div style={{maxWidth:680,margin:"0 auto",padding:"48px 24px 80px"}}>
        {/* Score card */}
        <div style={{display:"flex",alignItems:"center",gap:20,padding:"20px 24px",border:`1px solid ${C.border}`,borderRadius:16,background:C.bgSub,marginBottom:20}}>
          <Ring score={liveScore} sz={90} color={band.color}/>
          <div>
            <div style={{fontSize:11,color:C.textDim,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:3,fontFamily:C.mono}}>PeopleScore™</div>
            <div style={{fontSize:20,fontWeight:700,color:band.color,marginBottom:3}}>{band.label}</div>
            <div style={{fontSize:13,color:C.textSub,lineHeight:1.5}}>{band.desc}</div>
            <div style={{marginTop:8}}>
              <span style={{fontSize:14,fontWeight:700,color:liveScore>pb?C.emerald:C.rose,fontFamily:C.mono}}>{liveScore>pb?"+":""}{liveScore-pb}</span>
              <span style={{fontSize:11,color:C.textDim,marginLeft:4}}>vs peer median of {pb}</span>
            </div>
          </div>
        </div>

        {/* Email callout */}
        <div style={{padding:"14px 18px",background:"#F0FDF4",border:`1px solid ${C.emerald}40`,borderRadius:12,marginBottom:24,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20}}>📧</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.emerald,marginBottom:2}}>Full detailed report sent to {ctx.email}</div>
            <div style={{fontSize:12,color:C.textSub}}>Your complete 30-day action plan, 90-day roadmap, and financial impact analysis are in your inbox.</div>
          </div>
        </div>

        {/* Web summary */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:12,fontFamily:C.mono}}>
            Quick-Action Summary {ctx.name&&`· ${ctx.name}`}
          </div>
          {reportLoading&&!webReport&&(
            <div style={{padding:"32px",border:`1px solid ${C.border}`,borderRadius:12,textAlign:"center"}}>
              <div style={{display:"inline-block",width:22,height:22,border:`3px solid ${C.blue}`,borderTop:"3px solid transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",marginBottom:10}}/>
              <div style={{fontSize:14,color:C.textSub}}>Generating your report...</div>
            </div>
          )}
          {webReport&&(
            <div style={{padding:"24px",border:`1px solid ${C.border}`,borderRadius:12,background:C.bg}}>
              <ReportText text={webReport}/>
              {reportLoading&&<span style={{display:"inline-block",width:2,height:14,background:C.blue,marginLeft:2,verticalAlign:"middle",animation:"blink 1s infinite"}}/>}
            </div>
          )}
          {err&&<div style={{padding:"14px",background:C.roseLight,border:`1px solid ${C.rose}`,borderRadius:10,color:C.rose,fontSize:13}}>{err}</div>}
          <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
        </div>

        {/* CTA */}
        <div style={{padding:"24px 28px",background:C.bgDark,borderRadius:16,textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:18,fontWeight:700,color:C.textInverse,letterSpacing:"-0.3px",marginBottom:6}}>Ready to fix what we found?</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:16,lineHeight:1.6}}>PeopleScoreAI turns this report into an ongoing HR action plan with expert support at every step.</div>
          <a href={`mailto:hello@peoplescoreai.com?subject=PeopleScoreAI I scored ${liveScore} and want to improve`}
            style={{display:"inline-block",padding:"12px 24px",background:C.blue,borderRadius:10,color:C.textInverse,fontSize:14,fontWeight:700,textDecoration:"none"}}>
            Talk to PeopleScoreAI →
          </a>
        </div>
        <div style={{textAlign:"center"}}>
          <button onClick={reset} style={{padding:"9px 18px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,fontSize:13,cursor:"pointer"}}>Retake Audit</button>
        </div>
      </div>
    </div>
  );

  return null;
}

// ─── SETUP FLOW ────────────────────────────────────────────────────────────────
function SetupFlow({ ctx, setCtx, onStart, onBack }) {
  const [step, setStep] = useState(0);
  const [local, setLocal] = useState({...ctx});
  const update = (k,v) => setLocal(c=>({...c,[k]:v}));

  const canNext = () => {
    if(step===0) return local.name.trim()&&local.companyName.trim()&&local.industry&&(local.size||local.populationSize);
    if(step===1) return !!local.auditMode;
    if(step===2) {
      if(local.auditMode==="organization") return true;
      if(local.auditMode==="population") return local.populationName.trim();
      if(local.auditMode==="function") return local.functionName&&local.hrTitle.trim();
    }
    return true;
  };

  function finish() { setCtx(local); onStart(); }
  function next() { if(step<2) setStep(s=>s+1); else finish(); }
  function back() { if(step===0) onBack(); else setStep(s=>s-1); }

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:C.sans}}>
      <nav style={{borderBottom:`1px solid ${C.border}`,background:C.bg,position:"sticky",top:0,zIndex:100,padding:"0 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={onBack}>
            <div style={{width:32,height:32,borderRadius:8,background:C.navy,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:14,height:14,border:`2px solid ${C.blue}`,borderTop:"2px solid transparent",borderRadius:2,transform:"rotate(45deg)"}}/>
            </div>
            <span style={{fontWeight:700,fontSize:16,color:C.navy}}>PeopleScore<span style={{color:C.blue}}>.ai</span></span>
          </div>
          <div style={{display:"flex",gap:8}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{width:i<=step?28:8,height:8,borderRadius:4,background:i<=step?C.blue:C.border,transition:"all 0.3s ease"}}/>
            ))}
          </div>
          <div style={{fontSize:13,color:C.textDim}}>Step {step+1} of 3</div>
        </div>
      </nav>

      <div style={{maxWidth:580,margin:"0 auto",padding:"48px 24px 80px"}}>

        {/* Step 0: Basic context */}
        {step===0&&(
          <div>
            <div style={{fontSize:11,fontWeight:600,color:C.blue,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:16}}>Step 1 of 3 · About You</div>
            <h2 style={{fontSize:28,fontWeight:700,color:C.navy,letterSpacing:"-0.5px",marginBottom:6}}>Let's get started</h2>
            <p style={{fontSize:14,color:C.textSub,marginBottom:28,lineHeight:1.6}}>We'll use this to personalize your audit. You won't be asked for this information again.</p>
            <Lbl>Your name</Lbl>
            <input type="text" placeholder="Jane Smith" value={local.name} onChange={e=>update("name",e.target.value)}
              style={inputStyle}/>
            <Lbl>Company name</Lbl>
            <input type="text" placeholder="Acme Corp" value={local.companyName} onChange={e=>update("companyName",e.target.value)}
              style={inputStyle}/>
            <Lbl>Industry</Lbl>
            <Sel value={local.industry} onChange={v=>update("industry",v)}
              opts={["Healthcare / Medical","Construction / Trades","Restaurant / Hospitality","Professional Services","Technology / Software","Manufacturing","Retail / E-commerce","Financial Services","Education / Nonprofit","Other"]}/>
            <Lbl>Total employees</Lbl>
            <Sel value={local.size} onChange={v=>update("size",v)}
              opts={["1–10","11–25","26–50","51–200","201–500","500+"]}/>
          </div>
        )}

        {/* Step 1: Audit mode */}
        {step===1&&(
          <div>
            <div style={{fontSize:11,fontWeight:600,color:C.blue,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:16}}>Step 2 of 3 · Audit Focus</div>
            <h2 style={{fontSize:26,fontWeight:700,color:C.navy,letterSpacing:"-0.5px",marginBottom:6}}>What would you like to assess?</h2>
            <p style={{fontSize:14,color:C.textSub,marginBottom:24,lineHeight:1.6}}>Your audit adapts based on what you're evaluating.</p>
            {[
              {k:"organization",icon:"🏢",t:"Full Organization",d:`Assess ${local.companyName}'s overall HR health across all functions`},
              {k:"population",icon:"👥",t:"Specific Workforce Population",d:`Assess a specific group within ${local.companyName} e.g., corporate employees, field/hourly workers, a business unit`},
              {k:"function",icon:"🎯",t:"HR Function Assessment",d:"For HR leaders: assess the maturity of a specific HR function (Talent Acquisition, Total Rewards, L&D, etc.)"},
            ].map(({k,icon,t,d})=>(
              <button key={k} onClick={()=>update("auditMode",k)}
                style={{display:"flex",alignItems:"flex-start",gap:14,padding:"16px 18px",marginBottom:10,background:local.auditMode===k?C.blueLight:C.bgSub,border:`2px solid ${local.auditMode===k?C.blue:C.border}`,borderRadius:12,width:"100%",cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:22,flexShrink:0}}>{icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:local.auditMode===k?C.blue:C.navy,marginBottom:3}}>{t}</div>
                  <div style={{fontSize:13,color:C.textSub,lineHeight:1.5}}>{d}</div>
                </div>
                {local.auditMode===k&&<span style={{color:C.blue,flexShrink:0,fontSize:16}}>✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Mode-specific details */}
        {step===2&&(
          <div>
            <div style={{fontSize:11,fontWeight:600,color:C.blue,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:16}}>Step 3 of 3 · Final Details</div>
            {local.auditMode==="organization"&&(
              <>
                <h2 style={{fontSize:24,fontWeight:700,color:C.navy,letterSpacing:"-0.5px",marginBottom:6}}>A few more details</h2>
                <p style={{fontSize:14,color:C.textSub,marginBottom:20,lineHeight:1.6}}>Optional helps Claude ask more relevant questions.</p>
                <Lbl>Business stage</Lbl>
                <Sel value={local.stage} onChange={v=>update("stage",v)}
                  opts={["Just started (under 2 years)","Growing fast (2–5 years)","Stable & established (5+ years)","Restructuring or pivoting"]}/>
                <Lbl>Multiple workforce populations? (optional)</Lbl>
                <input type="text" placeholder="e.g., 1,100 restaurant / 400 corporate" value={local.populations}
                  onChange={e=>update("populations",e.target.value)} style={inputStyle}/>
              </>
            )}
            {local.auditMode==="population"&&(
              <>
                <h2 style={{fontSize:24,fontWeight:700,color:C.navy,letterSpacing:"-0.5px",marginBottom:6}}>About this population</h2>
                <Lbl>Population name</Lbl>
                <input type="text" placeholder="e.g., Corporate employees, Restaurant team members" value={local.populationName}
                  onChange={e=>update("populationName",e.target.value)} style={inputStyle}/>
                <Lbl>Approximate population size</Lbl>
                <Sel value={local.populationSize} onChange={v=>update("populationSize",v)}
                  opts={["Under 50","50–200","200–500","500–1,000","1,000+"]}/>
              </>
            )}
            {local.auditMode==="function"&&(
              <>
                <h2 style={{fontSize:24,fontWeight:700,color:C.navy,letterSpacing:"-0.5px",marginBottom:6}}>About your HR function</h2>
                <Lbl>Which function are you assessing?</Lbl>
                <Sel value={local.functionName} onChange={v=>update("functionName",v)}
                  opts={["Talent Acquisition / Recruiting","Total Rewards / Compensation & Benefits","Learning & Development","Performance Management","HR Operations / Administration","Employee Relations","Health, Safety & Wellbeing","Workforce Planning / HR Strategy","HR Business Partnering","People Analytics","Career Development & Succession","Diversity, Equity & Inclusion"]}/>
                <Lbl>Your title</Lbl>
                <input type="text" placeholder="e.g., VP of Talent, Director of Total Rewards" value={local.hrTitle}
                  onChange={e=>update("hrTitle",e.target.value)} style={inputStyle}/>
              </>
            )}
            <div style={{padding:"14px 16px",background:"#FFF9E6",border:`1px solid ${C.amber}40`,borderRadius:10,marginTop:8}}>
              <div style={{fontSize:13,fontWeight:700,color:C.amber,marginBottom:3}}>💬 How this works</div>
              <div style={{fontSize:12,color:C.textSub,lineHeight:1.6}}>Your audit is a real conversation. You'll see multiple choice options but you can also <strong>type anything in your own words</strong>. The more detail you share, the more accurate your report will be.</div>
            </div>
          </div>
        )}

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:32,paddingTop:24,borderTop:`1px solid ${C.border}`}}>
          <button onClick={back} style={{padding:"10px 20px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,fontSize:14,cursor:"pointer"}}>← Back</button>
          <button onClick={next} disabled={!canNext()}
            style={{padding:"13px 28px",background:canNext()?C.navy:C.border,border:"none",borderRadius:10,color:C.textInverse,fontSize:15,fontWeight:600,cursor:canNext()?"pointer":"not-allowed"}}>
            {step===2?"Start My Audit →":"Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {width:"100%",padding:"11px 14px",border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:14,color:C.text,background:C.bg,outline:"none",boxSizing:"border-box",fontFamily:C.sans,marginBottom:14};
function Lbl({children}){ return <label style={{fontSize:13,fontWeight:600,color:C.navy,display:"block",marginBottom:6}}>{children}</label>; }
function Sel({value,onChange,opts}){
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{...inputStyle,color:value?C.text:C.textDim,cursor:"pointer"}}>
      <option value="">Select...</option>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}
