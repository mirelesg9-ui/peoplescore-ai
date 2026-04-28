import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#FFFFFF", bgSub: "#F8F9FB", bgDark: "#0A0E1A",
  navy: "#0A0E1A", blue: "#1A56DB", blueLight: "#EEF4FF",
  emerald: "#059669", emeraldLight: "#ECFDF5",
  amber: "#D97706", amberLight: "#FFFBEB",
  rose: "#DC2626", roseLight: "#FEF2F2",
  violet: "#7C3AED", violetLight: "#F5F3FF",
  text: "#0A0E1A", textSub: "#4B5563", textDim: "#9CA3AF",
  textInverse: "#FFFFFF", border: "#E5E7EB", borderMid: "#D1D5DB",
  mono: "'Courier New', monospace",
  sans: "'DM Sans', 'Helvetica Neue', sans-serif",
};

// ─── SCORING ──────────────────────────────────────────────────────────────────
const DW = {
  compliance:[.35,.25,.15], payroll:[.20,.15,.10], hiring:[.15,.15,.15],
  policies:[.10,.15,.10], performance:[.05,.10,.15], compensation:[.05,.10,.15],
  culture:[.05,.05,.10], analytics:[.05,.05,.10],
};
const IM = {
  "Healthcare / Medical":{compliance:1.3,payroll:1.1,hiring:1.2},
  "Construction / Trades":{compliance:1.35,payroll:1.15},
  "Restaurant / Hospitality":{hiring:1.25,payroll:1.2,culture:1.15},
  "Professional Services":{performance:1.2,compensation:1.15},
  "Technology / Software":{compensation:1.2,hiring:1.15,analytics:1.25},
  "Manufacturing":{compliance:1.3,payroll:1.1},
  "Retail / E-commerce":{hiring:1.2,payroll:1.15},
  "Financial Services":{compliance:1.2,policies:1.2},
  "Education / Nonprofit":{compliance:1.1,culture:1.2},
  "Other":{},
};
const SM = {
  "Just started (under 2 years)":{compliance:1.2,analytics:0.7},
  "Growing fast (2–5 years)":{hiring:1.2,performance:1.1},
  "Stable & established (5+ years)":{performance:1.15,analytics:1.2},
  "Restructuring or pivoting":{compliance:1.25,payroll:1.1},
};
const PB = {
  "1–10":{default:44,"Restaurant / Hospitality":42,"Construction / Trades":38,"Technology / Software":51},
  "11–25":{default:52,"Restaurant / Hospitality":48,"Construction / Trades":45,"Technology / Software":58},
  "26–50":{default:59,"Restaurant / Hospitality":54,"Construction / Trades":52,"Technology / Software":65},
  "51–100":{default:64,"Restaurant / Hospitality":60,"Construction / Trades":58,"Technology / Software":70},
  "100+":{default:69,"Restaurant / Hospitality":65,"Construction / Trades":62,"Technology / Software":75},
};

function tier(s){return(s==="1–10"||s==="11–25")?0:(s==="26–50"||s==="51–100")?1:2;}
function peer(size,ind){const g=PB[size]||PB["11–25"];return g[ind]||g.default;}

function domainRaw(key,a){
  const s=(v)=>v?1:0;
  if(key==="compliance"){
    let t=0,n=0;
    if(a.i9){t+=a.i9==="Yes"?1:a.i9==="Mostly"?.5:0;n++;}
    if(a.workersComp){t+=a.workersComp==="Yes"?1:0;n++;}
    if(a.wageHour){t+=a.wageHour==="Yes — we're compliant"?1:a.wageHour==="Mostly"?.6:.1;n++;}
    if(a.harassmentPolicy){t+=a.harassmentPolicy==="Yes, updated in past year"?1:a.harassmentPolicy==="Yes, but outdated"?.5:0;n++;}
    if(a.multiState){t+=a.multiState==="No — one state only"?.9:a.multiState==="Yes, and we manage it well"?1:.4;n++;}
    return n>0?t/n:.5;
  }
  if(key==="payroll"){
    let t=0,n=0;
    const ps={Gusto:.9,ADP:.95,Paychex:.9,Rippling:.95,"QuickBooks Payroll":.8,"Spreadsheets / manual":.2,"A PEO handles it":.85,Other:.7};
    if(a.payrollSystem){t+=ps[a.payrollSystem]||.7;n++;}
    if(a.workerClass){t+=a.workerClass==="Yes — all reviewed recently"?1:a.workerClass==="We use both, not sure"?.3:.7;n++;}
    if(a.payTransparency){t+=a.payTransparency==="Yes"?1:a.payTransparency==="Working on it"?.6:.2;n++;}
    return n>0?t/n:.5;
  }
  if(key==="hiring"){
    let t=0,n=0;
    if(a.offerLetters){t+=a.offerLetters==="Yes — standard template"?1:a.offerLetters==="Sometimes"?.5:.1;n++;}
    if(a.onboarding){t+=a.onboarding==="Structured 30/60/90 plan"?1:a.onboarding==="Basic first-day process"?.5:a.onboarding==="Minimal / informal"?.2:0;n++;}
    if(a.backgroundChecks){t+=a.backgroundChecks==="Yes — for all roles"?1:a.backgroundChecks==="For some roles"?.6:.1;n++;}
    return n>0?t/n:.5;
  }
  if(key==="policies"){
    let t=0,n=0;
    const hb={"Yes — updated in past year":1,"Yes — 1–3 years old":.6,"Yes — over 3 years old":.3,"No handbook":0};
    if(a.handbook){t+=hb[a.handbook]??0.5;n++;}
    if(a.harassmentTraining){t+=a.harassmentTraining==="Yes — all employees"?1:a.harassmentTraining==="Some employees"?.5:.1;n++;}
    if(a.discipline){t+=a.discipline==="Always documented"?1:a.discipline==="Usually"?.65:a.discipline==="Rarely"?.2:0;n++;}
    return n>0?t/n:.5;
  }
  if(key==="performance"){
    let t=0,n=0;
    const pm={"Formal reviews twice/year":1,"Formal annual reviews":.8,"Regular informal check-ins":.5,"Manager decides":.3,"No formal process":.1};
    if(a.perfReviews){t+=pm[a.perfReviews]||.4;n++;}
    if(a.goalSetting){t+=a.goalSetting==="Yes — OKRs or clear goals"?1:a.goalSetting==="Informally"?.5:.1;n++;}
    if(a.managerTraining){t+=a.managerTraining==="Yes"?1:a.managerTraining==="Some managers"?.5:.1;n++;}
    return n>0?t/n:.4;
  }
  if(key==="compensation"){
    let t=0,n=0;
    if(a.compStructure){t+=a.compStructure==="Formal pay bands/grades"?1:a.compStructure==="Market data informed"?.7:a.compStructure==="Mostly gut feel"?.2:0;n++;}
    if(a.benefits){t+=a.benefits==="Strong benefits package"?1:a.benefits==="Basic benefits"?.6:a.benefits==="Minimal benefits"?.2:0;n++;}
    if(a.payEquity){t+=a.payEquity==="Yes — audited recently"?1:a.payEquity==="We think so"?.4:.1;n++;}
    return n>0?t/n:.4;
  }
  if(key==="culture"){
    let t=0,n=0;
    if(a.engagement){t+=a.engagement==="Yes — formal surveys with action plans"?1:a.engagement==="Informal check-ins only"?.5:.1;n++;}
    if(a.turnover){t+=a.turnover==="Below industry average"?1:a.turnover==="About average"?.6:a.turnover==="Above average"?.2:.3;n++;}
    if(a.epli){t+=a.epli==="Yes"?.8:a.epli==="No"?.1:.3;n++;}
    return n>0?t/n:.4;
  }
  if(key==="analytics"){
    let t=0,n=0;
    if(a.hrisSystem){t+=a.hrisSystem==="Yes — full HRIS"?1:a.hrisSystem==="Basic payroll only"?.4:.1;n++;}
    if(a.hrMetrics){t+=a.hrMetrics==="Yes — tracked regularly"?1:a.hrMetrics==="Sometimes"?.5:.1;n++;}
    return n>0?t/n:.3;
  }
  return .5;
}

function computeScore(a){
  const t=tier(a.size||"11–25");
  const im=IM[a.industry]||{};
  const sm=SM[a.stage]||{};
  let tw=0,ts=0;
  const ds={};
  for(const [k,w] of Object.entries(DW)){
    const eff=Math.min(w[t]*(im[k]||1)*(sm[k]||1),.40);
    const raw=domainRaw(k,a);
    ts+=raw*eff; tw+=eff;
    ds[k]=Math.round(raw*100);
  }
  const critical=a.i9==="No"||a.workersComp==="No"||a.payrollSystem==="Spreadsheets / manual"||a.harassmentPolicy==="No";
  let score=Math.round(30+(tw>0?ts/tw:0)*65);
  if(critical)score=Math.min(score,70);
  return {score:Math.max(18,Math.min(score,98)),ds,critical};
}

function band(score){
  if(score<=40)return{label:"Reactive",color:C.rose,bg:C.roseLight,desc:"Significant compliance and people risk. Immediate action required."};
  if(score<=65)return{label:"Developing",color:C.amber,bg:C.amberLight,desc:"Foundation in place, but important gaps remain."};
  if(score<=85)return{label:"Strategic",color:C.emerald,bg:C.emeraldLight,desc:"Strong HR operations with room to reach best-in-class."};
  return{label:"Systemic",color:C.violet,bg:C.violetLight,desc:"Top-decile HR. Fewer than 10% of companies reach this level."};
}

function dlabel(k){
  return{compliance:"Compliance & Risk",payroll:"Payroll & Classification",hiring:"Hiring & Onboarding",policies:"Policies & Handbook",performance:"Performance Management",compensation:"Compensation & Benefits",culture:"Culture & Retention",analytics:"HR Data & Analytics"}[k]||k;
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
function buildPrompt(a,score,bd,ds,critical,pb){
  return `You are PeopleScoreAI — an AI-powered HR intelligence system. You operate strictly within the PeopleScoreAI framework based on Josh Bersin's 4-Level HR Maturity Model, Gartner HR Score methodology, and SHRM frameworks.

BUSINESS CONTEXT:
- Company: ${a.company||"this business"}
- Industry: ${a.industry||"not specified"} 
- Size: ${a.size||"not specified"} employees
- Stage: ${a.stage||"not specified"}
- PeopleScore: ${score}/100 (${bd.label})
- Peer median: ${pb}/100
- Critical gap: ${critical?"YES — score capped at 70":"No"}
- Domain scores: ${Object.entries(ds).map(([k,v])=>dlabel(k)+": "+v).join(" | ")}

ANSWERS:
${Object.entries(a).filter(([k])=>!['name','email','company'].includes(k)).map(([k,v])=>`${k}: ${v}`).join("\n")}

RULES — NEVER BREAK THESE:
1. Every finding must be specific to this company's industry, size, and actual answers
2. Never give generic advice — every sentence must apply specifically to them
3. Translate every HR finding into business impact: dollars, legal risk, or operational consequence
4. Use business language, not HR jargon
5. Be direct and specific — "you need to fix X" not "it is recommended"
6. Follow the exact output structure below — no additions, no omissions

OUTPUT STRUCTURE (follow exactly):
## Executive Summary
2-3 sentences. What is their overall HR situation and what does it mean for their business?

## Your Score in Context
Their score vs peers. What does being ${bd.label} mean for a ${a.industry||"business"} with ${a.size||"their"} employees?

${critical?"## ⚠️ Critical Findings\nThese gaps create immediate legal exposure. Address these before anything else.\n":""}
## Domain Analysis
For each domain with a score below 70, write: domain name, score, what the gap means in plain language, and one specific action.

## Your 30-Day Action Plan
3-5 specific, sequenced actions. Start with the most urgent.

## Financial Impact
What are the current gaps costing them or could cost them? Use specific dollar ranges from real employment law data.

## How PeopleScoreAI Can Help
2-3 sentences specific to their situation. What would ongoing support look like for a ${a.industry||"business"} their size?`;
}

// ─── CLAUDE API ───────────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userMsg, onChunk) {
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
      messages: [{ role: "user", content: userMsg }],
      stream: true,
    }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") continue;
      try {
        const p = JSON.parse(data);
        if (p.type === "content_block_delta" && p.delta?.text) onChunk(p.delta.text);
      } catch {}
    }
  }
}

// ─── QUESTIONS ────────────────────────────────────────────────────────────────
const Qs = [
  {id:"industry",key:"industry",section:"About Your Business",
   q:"What industry are you in?",
   sub:"We weight your score based on your industry's specific risks — not a generic formula.",
   choices:["Healthcare / Medical","Construction / Trades","Restaurant / Hospitality","Professional Services","Technology / Software","Manufacturing","Retail / E-commerce","Financial Services","Education / Nonprofit","Other"]},
  {id:"size",key:"size",section:"About Your Business",
   q:"How many W-2 employees do you have?",
   sub:"Count everyone on your payroll — full-time and part-time. Not contractors.",
   choices:["1–10","11–25","26–50","51–100","100+"]},
  {id:"stage",key:"stage",section:"About Your Business",
   q:"Where are you in your business journey?",
   sub:"Your stage determines what great HR looks like right now.",
   choices:["Just started (under 2 years)","Growing fast (2–5 years)","Stable & established (5+ years)","Restructuring or pivoting"]},
  {id:"i9",key:"i9",section:"Compliance",tier:"critical",
   q:"Do you complete I-9 forms for every new hire within 3 days of their start date?",
   sub:"The I-9 verifies work authorization. ICE fines run $281–$2,789 per error.",
   choices:["Yes","Mostly — some may slip","No","Not sure what an I-9 is"]},
  {id:"workersComp",key:"workersComp",section:"Compliance",tier:"critical",
   q:"Do you have active workers' compensation insurance?",
   sub:"Required in every state except Texas. Operating without it is criminal liability.",
   choices:["Yes","No","Not sure — we use a PEO"]},
  {id:"wageHour",key:"wageHour",section:"Compliance",tier:"critical",
   q:"Are your employees paid correctly — minimum wage, overtime, and proper classification?",
   sub:"Wage-and-hour violations are the #1 source of employment lawsuits.",
   choices:["Yes — we're compliant","Mostly — but I have some doubts","No — not sure if we comply","We're under active review"]},
  {id:"harassmentPolicy",key:"harassmentPolicy",section:"Compliance",tier:"critical",
   q:"Do you have a written anti-harassment and anti-discrimination policy?",
   sub:"Without a written policy, you lose your primary legal defense in harassment cases.",
   choices:["Yes, updated in past year","Yes, but outdated","No","Not sure"]},
  {id:"multiState",key:"multiState",section:"Compliance",
   q:"Do you have employees working in multiple states?",
   sub:"One remote worker in CA, NY, or IL triggers significantly different legal obligations.",
   choices:["No — one state only","Yes, and we manage it well","Yes, but we're not sure what each state requires","Not sure"]},
  {id:"payrollSystem",key:"payrollSystem",section:"Payroll",tier:"critical",
   q:"What do you use to run payroll?",
   sub:"Your payroll system is the backbone of compliance. Manual payroll is the highest-risk setup.",
   choices:["Gusto","ADP","Paychex","Rippling","QuickBooks Payroll","Spreadsheets / manual","A PEO handles it","Other"]},
  {id:"workerClass",key:"workerClass",section:"Payroll",
   q:"If you use independent contractors, has someone reviewed whether they're correctly classified?",
   sub:"Misclassifying employees as contractors is the IRS and DOL's top enforcement target.",
   choices:["Yes — all reviewed recently","We don't use contractors","We use both, not sure if it's right","We use contractors but never reviewed it"]},
  {id:"payTransparency",key:"payTransparency",section:"Payroll",
   q:"If you post job listings, do you include salary ranges?",
   sub:"17+ states now require salary ranges in job postings. Violations carry fines.",
   choices:["Yes","No — we don't include ranges","Working on it","We don't post job listings"]},
  {id:"offerLetters",key:"offerLetters",section:"Hiring",
   q:"When you hire someone, do you give them a written offer letter?",
   sub:"Verbal offers create disputes. A written offer letter protects both sides.",
   choices:["Yes — standard template","Yes — custom each time","Sometimes","No — verbal only"]},
  {id:"onboarding",key:"onboarding",section:"Hiring",
   q:"What does your onboarding process look like?",
   sub:"Companies with structured onboarding see 82% better first-year retention.",
   choices:["Structured 30/60/90 plan","Basic first-day process","Minimal / informal","No real onboarding process"]},
  {id:"backgroundChecks",key:"backgroundChecks",section:"Hiring",
   q:"Do you run background checks on new hires?",
   sub:"Background checks must follow FCRA requirements — specific notices are required.",
   choices:["Yes — for all roles","For some roles","No","Not required in our industry"]},
  {id:"handbook",key:"handbook",section:"Policies",
   q:"Do you have an employee handbook, and how current is it?",
   sub:"An outdated handbook is almost as risky as no handbook — state laws change constantly.",
   choices:["Yes — updated in past year","Yes — 1–3 years old","Yes — over 3 years old","No handbook"]},
  {id:"harassmentTraining",key:"harassmentTraining",section:"Policies",
   q:"Have employees completed anti-harassment training in the past two years?",
   sub:"CA, NY, IL and others mandate this. Without it, you lose key legal defenses.",
   choices:["Yes — all employees","Some employees","No","Not sure"]},
  {id:"discipline",key:"discipline",section:"Policies",
   q:"When you discipline or let someone go, do you document it in writing?",
   sub:"Verbal-only terminations turn routine separations into wrongful termination claims.",
   choices:["Always documented","Usually","Rarely","Never — all verbal"]},
  {id:"perfReviews",key:"perfReviews",section:"Performance",
   q:"How do you handle employee performance reviews?",
   sub:"Without formal reviews, terminations look arbitrary and promotions look like favoritism.",
   choices:["Formal reviews twice/year","Formal annual reviews","Regular informal check-ins","Manager decides","No formal process"],
   skip:(a)=>a.size==="1–10"},
  {id:"goalSetting",key:"goalSetting",section:"Performance",
   q:"Do employees have clear, written goals for their role?",
   sub:"Goal clarity is the #1 driver of employee engagement according to Gallup.",
   choices:["Yes — OKRs or clear goals","Informally","No","Not consistently"],
   skip:(a)=>a.size==="1–10"},
  {id:"managerTraining",key:"managerTraining",section:"Performance",
   q:"Have your managers been trained on how to manage people?",
   sub:"Manager missteps cause the majority of EEOC charges, FMLA violations, and lawsuits.",
   choices:["Yes","Some managers","No","We don't have formal managers yet"],
   skip:(a)=>a.size==="1–10"},
  {id:"compStructure",key:"compStructure",section:"Compensation",
   q:"How do you set employee pay?",
   sub:"Ad hoc pay decisions are the fastest path to discrimination claims and retention problems.",
   choices:["Formal pay bands/grades","Market data informed","Mostly gut feel / negotiation","We copy competitors"]},
  {id:"benefits",key:"benefits",section:"Compensation",
   q:"How would you describe your benefits package?",
   sub:"Benefits are often the deciding factor in whether top candidates join — and stay.",
   choices:["Strong benefits package","Basic benefits","Minimal benefits","No benefits currently"]},
  {id:"payEquity",key:"payEquity",section:"Compensation",
   q:"Have you reviewed whether employees are paid equitably for similar work?",
   sub:"Pay equity lawsuits are rising sharply. Several states require formal audits at 100+ employees.",
   choices:["Yes — audited recently","We think so","No","Not relevant at our size"],
   skip:(a)=>a.size==="1–10"||a.size==="11–25"},
  {id:"engagement",key:"engagement",section:"Culture",
   q:"Do you measure employee engagement or satisfaction?",
   sub:"Gallup reports highly engaged teams show 23% greater profitability.",
   choices:["Yes — formal surveys with action plans","Informal check-ins only","We don't measure it","We're too small for this"],
   skip:(a)=>a.size==="1–10"},
  {id:"turnover",key:"turnover",section:"Culture",
   q:"How is your employee turnover compared to your industry?",
   sub:"SHRM estimates replacing one employee costs 50–200% of their annual salary.",
   choices:["Below industry average","About average","Above average","We don't track it"]},
  {id:"epli",key:"epli",section:"Culture",
   q:"Do you have Employment Practices Liability Insurance (EPLI)?",
   sub:"A single employment lawsuit costs $50K–$500K in legal fees alone, regardless of outcome.",
   choices:["Yes","No","Not sure"]},
  {id:"hrisSystem",key:"hrisSystem",section:"Analytics",
   q:"Do you have a central system that tracks employee data, time off, and job history?",
   sub:"An HRIS is your single source of truth. Without one, decisions happen on gut feel.",
   choices:["Yes — full HRIS","Basic payroll only","No — spreadsheets or email","Not sure"],
   skip:(a)=>a.size==="1–10"},
  {id:"hrMetrics",key:"hrMetrics",section:"Analytics",
   q:"Do you track key HR metrics like turnover rate, time-to-hire, or cost-per-hire?",
   sub:"Companies that track HR metrics make 2x better talent decisions per McKinsey.",
   choices:["Yes — tracked regularly","Sometimes","No","Not sure what to track"],
   skip:(a)=>a.size==="1–10"||a.size==="11–25"},
];

// ─── SCORE RING ───────────────────────────────────────────────────────────────
function Ring({score,sz=100,color=C.blue}){
  const r=(sz-10)/2, circ=2*Math.PI*r;
  return(
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

// ─── REPORT RENDERER ──────────────────────────────────────────────────────────
function ReportText({text}){
  const lines = text.split("\n");
  return(
    <div style={{fontSize:14,lineHeight:1.8,color:C.text}}>
      {lines.map((line,i)=>{
        if(line.startsWith("## "))
          return <div key={i} style={{fontWeight:700,fontSize:16,color:C.navy,marginTop:20,marginBottom:6,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>{line.replace("## ","")}</div>;
        if(line.startsWith("- "))
          return <div key={i} style={{paddingLeft:16,marginBottom:4,color:C.textSub}}>• {line.slice(2)}</div>;
        if(line.trim()==="") return <div key={i} style={{height:8}}/>;
        return <div key={i} style={{marginBottom:4}}>{line}</div>;
      })}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App(){
  // page: "landing" | "audit" | "capture" | "results"
  const [page, setPage] = useState("landing");
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState({});
  const [capture, setCapture] = useState({name:"",email:"",company:""});
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const top = useRef(null);

  // Filter questions based on answers
  const visQ = Qs.filter(q=>!q.skip||!q.skip(answers));
  const curQ = visQ[qi];
  const progress = Math.round((qi/visQ.length)*100);

  const {score,ds,critical} = computeScore(answers);
  const ansCount = Object.keys(answers).length;
  const displayScore = ansCount < 2 ? 30 : score;
  const b = band(displayScore);
  const pb = peer(answers.size||"11–25", answers.industry||"Other");

  function pickAnswer(choice){
    const na = {...answers, [curQ.key]: choice};
    setAnswers(na);
    const nv = Qs.filter(q=>!q.skip||!q.skip(na));
    if(qi+1 >= nv.length){
      setPage("capture");
    } else {
      setQi(qi+1);
    }
    top.current?.scrollIntoView({behavior:"smooth"});
  }

  function goBack(){
    if(page==="capture"){setPage("audit");return;}
    if(qi>0){setQi(qi-1);top.current?.scrollIntoView({behavior:"smooth"});}
  }

  async function generate(){
    if(!capture.email)return;
    setLoading(true);
    setErr(null);
    setReport("");
    setPage("results");
    const all={...answers,...capture};
    const sys=buildPrompt(all,score,b,ds,critical,pb);
    const msg=`Generate a complete PeopleScoreAI HR audit report for ${capture.company||"this business"}. Write directly to ${capture.name||"the business owner"}. Start immediately with the Executive Summary — no preamble.`;
    try{
      let full="";
      await callClaude(sys,msg,(chunk)=>{full+=chunk;setReport(full);});
    }catch(e){
      setErr("Could not generate report. Please try again.");
    }finally{
      setLoading(false);
    }
  }

  const nav=(
    <nav style={{borderBottom:`1px solid ${C.border}`,background:C.bg,position:"sticky",top:0,zIndex:100,padding:"0 24px"}}>
      <div style={{maxWidth:1100,margin:"0 auto",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>{setPage("landing");setQi(0);setAnswers({});setReport("");}}>
          <div style={{width:32,height:32,borderRadius:8,background:C.navy,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:14,height:14,border:`2px solid ${C.blue}`,borderTop:"2px solid transparent",borderRadius:2,transform:"rotate(45deg)"}}/>
          </div>
          <span style={{fontWeight:700,fontSize:16,color:C.navy,letterSpacing:"-0.3px"}}>PeopleScore<span style={{color:C.blue}}>.ai</span></span>
        </div>
        {page==="audit"&&(
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:140,height:4,background:C.border,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${progress}%`,background:C.blue,borderRadius:2,transition:"width 0.3s"}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 12px",borderRadius:8,border:`1px solid ${b.color}40`,background:b.bg}}>
              <span style={{fontSize:16,fontWeight:700,color:b.color,fontFamily:C.mono}}>{displayScore}</span>
              <span style={{fontSize:11,fontWeight:600,color:b.color,textTransform:"uppercase",letterSpacing:"1px"}}>{b.label}</span>
            </div>
          </div>
        )}
        <a href="mailto:hello@peoplescoreai.com" style={{fontSize:13,color:C.textSub,textDecoration:"none"}}>Contact</a>
      </div>
    </nav>
  );

  // ── LANDING ────────────────────────────────────────────────────────────────
  if(page==="landing") return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:C.sans}} ref={top}>
      {nav}
      <div style={{maxWidth:680,margin:"0 auto",padding:"72px 24px 80px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,border:`1px solid ${C.blue}30`,background:C.blueLight,marginBottom:28}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:C.blue}}/>
          <span style={{fontSize:11,fontWeight:600,color:C.blue,letterSpacing:"1.5px",textTransform:"uppercase"}}>PeopleScore™ · HR Diagnostic</span>
        </div>
        <h1 style={{fontSize:52,fontWeight:800,letterSpacing:"-2px",lineHeight:1.08,marginBottom:20,color:C.navy}}>
          Know exactly where<br/><span style={{color:C.blue}}>your HR stands.</span>
        </h1>
        <p style={{fontSize:18,color:C.textSub,lineHeight:1.7,marginBottom:8,maxWidth:500}}>
          Answer ~15 questions. Get an enterprise-grade HR audit score personalized to your industry, size, and stage.
        </p>
        <p style={{fontSize:13,color:C.textDim,marginBottom:44}}>Takes 8–12 minutes · No signup required · Free</p>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:40}}>
          {[["Personalized score (0–100)","Calibrated to your industry & size"],
            ["Domain breakdown","8 HR areas assessed in depth"],
            ["Peer benchmarking","vs. companies like yours"],
            ["Prioritized action plan","What to fix first and why"],
          ].map(([t,s])=>(
            <div key={t} style={{padding:"16px 18px",border:`1px solid ${C.border}`,borderRadius:12,background:C.bgSub}}>
              <div style={{fontSize:13,fontWeight:600,color:C.navy,marginBottom:3}}>✓ {t}</div>
              <div style={{fontSize:12,color:C.textDim}}>{s}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:20,padding:"20px 24px",border:`1px solid ${C.border}`,borderRadius:14,background:C.bgSub,marginBottom:40}}>
          <Ring score={30} sz={80} color={C.textDim}/>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:C.navy,marginBottom:4}}>Your score updates live as you answer</div>
            <div style={{fontSize:13,color:C.textDim}}>Industry and size weighting applied automatically</div>
          </div>
        </div>

        <button onClick={()=>setPage("audit")}
          style={{display:"block",width:"100%",padding:"18px",background:C.navy,border:"none",borderRadius:12,color:C.textInverse,fontSize:16,fontWeight:700,cursor:"pointer",letterSpacing:"-0.2px"}}>
          Start My HR Audit →
        </button>
        <div style={{fontSize:12,color:C.textDim,textAlign:"center",marginTop:12}}>Your score starts the moment you answer the first question</div>
      </div>
    </div>
  );

  // ── AUDIT ──────────────────────────────────────────────────────────────────
  if(page==="audit") return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:C.sans}} ref={top}>
      {nav}
      <div style={{maxWidth:640,margin:"0 auto",padding:"56px 24px 80px"}}>
        {curQ ? (
          <>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <span style={{fontSize:11,fontWeight:600,color:C.blue,textTransform:"uppercase",letterSpacing:"1.5px"}}>{curQ.section}</span>
              {curQ.tier==="critical"&&(
                <span style={{fontSize:10,fontWeight:700,color:C.rose,padding:"2px 8px",border:`1px solid ${C.rose}30`,borderRadius:4,background:C.roseLight,textTransform:"uppercase",letterSpacing:"0.5px"}}>
                  Critical · weighted 3×
                </span>
              )}
            </div>
            <h2 style={{fontSize:26,fontWeight:700,letterSpacing:"-0.5px",lineHeight:1.3,marginBottom:10,color:C.navy}}>{curQ.q}</h2>
            <p style={{fontSize:14,color:C.textSub,lineHeight:1.7,marginBottom:32}}>{curQ.sub}</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {curQ.choices.map(ch=>(
                <button key={ch} onClick={()=>pickAnswer(ch)}
                  style={{padding:"14px 18px",background:answers[curQ.key]===ch?C.blueLight:C.bg,
                    border:`1.5px solid ${answers[curQ.key]===ch?C.blue:C.border}`,
                    borderRadius:10,color:answers[curQ.key]===ch?C.blue:C.text,
                    fontSize:15,fontWeight:answers[curQ.key]===ch?600:400,
                    cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
                  <span style={{width:18,height:18,borderRadius:"50%",
                    border:`1.5px solid ${answers[curQ.key]===ch?C.blue:C.borderMid}`,
                    background:answers[curQ.key]===ch?C.blue:"transparent",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    flexShrink:0,fontSize:10,color:C.textInverse}}>
                    {answers[curQ.key]===ch&&"✓"}
                  </span>
                  {ch}
                </button>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:32,paddingTop:24,borderTop:`1px solid ${C.border}`}}>
              {qi>0
                ?<button onClick={goBack} style={{padding:"8px 16px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,fontSize:13,cursor:"pointer"}}>← Back</button>
                :<div/>}
              <span style={{fontSize:12,color:C.textDim}}>Question {qi+1} of {visQ.length}</span>
            </div>
          </>
        ) : (
          <div style={{textAlign:"center",padding:"40px"}}>
            <div style={{fontSize:16,color:C.textSub}}>Loading...</div>
          </div>
        )}
      </div>
    </div>
  );

  // ── CAPTURE ────────────────────────────────────────────────────────────────
  if(page==="capture") return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:C.sans}} ref={top}>
      {nav}
      <div style={{maxWidth:560,margin:"0 auto",padding:"56px 24px 80px"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <Ring score={displayScore} sz={120} color={b.color}/>
          <div style={{marginTop:14}}>
            <div style={{fontSize:22,fontWeight:700,color:b.color}}>{b.label}</div>
            <div style={{fontSize:14,color:C.textSub,marginTop:4,maxWidth:360,margin:"4px auto 0"}}>{b.desc}</div>
          </div>
        </div>

        <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:36}}>
          <div style={{textAlign:"center",padding:"14px 20px",border:`1px solid ${C.border}`,borderRadius:10,background:C.bgSub}}>
            <div style={{fontSize:20,fontWeight:700,color:score>pb?C.emerald:C.rose,fontFamily:C.mono}}>{score>pb?"+":""}{score-pb}</div>
            <div style={{fontSize:11,color:C.textDim}}>vs peer median ({pb})</div>
          </div>
          {critical&&(
            <div style={{textAlign:"center",padding:"14px 20px",border:`1px solid ${C.rose}40`,borderRadius:10,background:C.roseLight}}>
              <div style={{fontSize:14,fontWeight:700,color:C.rose}}>Score Capped</div>
              <div style={{fontSize:11,color:C.rose,opacity:.8}}>critical gap at 70</div>
            </div>
          )}
        </div>

        <h2 style={{fontSize:22,fontWeight:700,color:C.navy,letterSpacing:"-0.5px",marginBottom:8}}>Get your full HR report</h2>
        <p style={{fontSize:14,color:C.textSub,lineHeight:1.6,marginBottom:24}}>
          We'll generate a personalized HR audit report specific to your {answers.industry||"industry"} business with {answers.size||"your"} employees.
        </p>

        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:24}}>
          {[{label:"Your name",k:"name",ph:"Jane Smith",type:"text"},
            {label:"Work email",k:"email",ph:"jane@company.com",type:"email"},
            {label:"Company name",k:"company",ph:"Acme Corp",type:"text"},
          ].map(({label,k,ph,type})=>(
            <div key={k}>
              <label style={{fontSize:13,fontWeight:600,color:C.navy,display:"block",marginBottom:6}}>{label}</label>
              <input type={type} placeholder={ph} value={capture[k]}
                onChange={e=>setCapture(d=>({...d,[k]:e.target.value}))}
                style={{width:"100%",padding:"12px 14px",border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:15,color:C.text,background:C.bg,outline:"none",boxSizing:"border-box",fontFamily:C.sans}}/>
            </div>
          ))}
        </div>

        <button onClick={generate} disabled={!capture.email}
          style={{display:"block",width:"100%",padding:"18px",background:capture.email?C.navy:C.border,border:"none",borderRadius:12,color:C.textInverse,fontSize:16,fontWeight:700,cursor:capture.email?"pointer":"not-allowed"}}>
          Generate My HR Report →
        </button>
        <div style={{textAlign:"center",marginTop:10}}>
          <button onClick={goBack} style={{fontSize:13,color:C.textDim,background:"none",border:"none",cursor:"pointer"}}>← Back to questions</button>
        </div>
        <div style={{fontSize:12,color:C.textDim,textAlign:"center",marginTop:8}}>No spam · Unsubscribe anytime</div>
      </div>
    </div>
  );

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if(page==="results") return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:C.sans}} ref={top}>
      {nav}
      <div style={{maxWidth:720,margin:"0 auto",padding:"48px 24px 80px"}}>

        {/* Score header */}
        <div style={{display:"flex",alignItems:"center",gap:24,padding:"24px",border:`1px solid ${C.border}`,borderRadius:16,background:C.bgSub,marginBottom:24}}>
          <Ring score={score} sz={100} color={b.color}/>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:C.textDim,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:4,fontFamily:C.mono}}>PeopleScore™</div>
            <div style={{fontSize:22,fontWeight:700,color:b.color,marginBottom:4}}>{b.label}</div>
            <div style={{fontSize:13,color:C.textSub,lineHeight:1.5}}>{b.desc}</div>
            <div style={{display:"flex",gap:16,marginTop:10}}>
              <div><span style={{fontSize:15,fontWeight:700,color:score>pb?C.emerald:C.rose,fontFamily:C.mono}}>{score>pb?"+":""}{score-pb}</span><span style={{fontSize:11,color:C.textDim,marginLeft:4}}>vs peer median</span></div>
            </div>
          </div>
        </div>

        {/* Domains */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:14,fontFamily:C.mono}}>Domain Breakdown</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {Object.entries(ds).sort((a,b)=>a[1]-b[1]).map(([k,v])=>{
              const col=v<50?C.rose:v<70?C.amber:v<85?C.emerald:C.violet;
              return(
                <div key={k} style={{padding:"14px 16px",border:`1px solid ${C.border}`,borderRadius:10,background:C.bg}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:12,fontWeight:600,color:C.navy}}>{dlabel(k)}</span>
                    <span style={{fontSize:16,fontWeight:700,color:col,fontFamily:C.mono}}>{v}</span>
                  </div>
                  <div style={{height:3,background:C.border,borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${v}%`,background:col,borderRadius:2}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:14,fontFamily:C.mono}}>
            Your HR Report {capture.name&&`· ${capture.name}`}
          </div>
          {loading&&!report&&(
            <div style={{padding:"40px",border:`1px solid ${C.border}`,borderRadius:12,textAlign:"center"}}>
              <div style={{fontSize:14,color:C.textSub,marginBottom:8}}>Analyzing your HR profile...</div>
              <div style={{fontSize:12,color:C.textDim}}>Generating your personalized report</div>
            </div>
          )}
          {err&&<div style={{padding:"16px",border:`1px solid ${C.rose}`,borderRadius:10,background:C.roseLight,color:C.rose,fontSize:14}}>{err}</div>}
          {report&&(
            <div style={{padding:"24px",border:`1px solid ${C.border}`,borderRadius:12,background:C.bg}}>
              <ReportText text={report}/>
              {loading&&<span style={{display:"inline-block",width:2,height:16,background:C.blue,marginLeft:2,verticalAlign:"middle",animation:"blink 1s infinite"}}/>}
            </div>
          )}
          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
        </div>

        {/* CTA */}
        <div style={{padding:"28px",background:C.bgDark,borderRadius:16,textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:20,fontWeight:700,color:C.textInverse,letterSpacing:"-0.5px",marginBottom:8}}>Ready to fix what we found?</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.55)",marginBottom:20,lineHeight:1.6}}>PeopleScoreAI turns this report into an ongoing action plan with support at every step.</div>
          <a href="mailto:hello@peoplescoreai.com?subject=PeopleScoreAI — I want to improve my score"
            style={{display:"inline-block",padding:"13px 28px",background:C.blue,borderRadius:10,color:C.textInverse,fontSize:15,fontWeight:700,textDecoration:"none"}}>
            Talk to PeopleScoreAI →
          </a>
        </div>

        <div style={{textAlign:"center"}}>
          <button onClick={()=>{setPage("landing");setQi(0);setAnswers({});setCapture({name:"",email:"",company:""});setReport("");}}
            style={{padding:"10px 20px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,fontSize:13,cursor:"pointer"}}>
            Retake Audit
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}
