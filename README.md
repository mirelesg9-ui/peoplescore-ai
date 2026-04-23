# PeopleScoreAI

**Enterprise-grade HR insight for every business.**

A personalized HR audit tool that gives any business — from a 10-person plumbing company to a $30M healthcare group — an enterprise-quality HR diagnostic score in under 15 minutes.

## What It Does

- Asks ~15-25 adaptive questions (based on your industry, size, and stage)
- Scores your HR across 8 domains using context-aware weighting
- Shows a live score that updates as you answer
- Delivers a full report with domain breakdown, peer benchmarks, and prioritized action steps

## Tech Stack

- React 18
- No backend required — fully client-side
- Deployable to Vercel in under 5 minutes

## Local Development

```bash
npm install
npm start
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to vercel.com → New Project → Import your GitHub repo
3. Vercel auto-detects Create React App — just click Deploy
4. Connect your custom domain in Vercel settings

## Scoring Methodology

Scores are weighted by:
- **Company size** (3 tiers: 1-25, 25-100, 100-500 employees)
- **Industry** (modifiers for Healthcare, Construction, Restaurant, Tech, etc.)
- **Business stage** (startup, growth, stable, restructuring)
- **Critical gap ceiling** — unresolved compliance basics cap score at 70

Score bands align with Josh Bersin's 4-level HR Maturity Model:
- 0-40: Reactive
- 41-65: Developing  
- 66-85: Strategic
- 86-100: Systemic

---

peoplescoreai.com
