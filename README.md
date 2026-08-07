# AI PM Training Program

An in-app, self-paced training program that takes experienced product managers — new to AI tooling — through five ~25–30 minute weekly modules plus a capstone, building the skills to support an AI software development lifecycle: writing effective AI prompts/specs, authoring guardrail/context files for agentic coding tools, prototyping with AI, and evaluating AI-produced work.

Every exercise runs against one fictional company and feature — **Northwind Gear Co.** and its AI Returns Assistant — so no real product, customer, or roadmap data is ever needed. See the data-boundary note on the home page: real work stays in enterprise Gemini; this program is where the habit gets built, safely, on personal AI accounts.

## What's in this repo

- `index.js` — a zero-dependency Node HTTP server. Serves the frontend from `public/` and content from `content/`.
- `content/weeks.json` — the program manifest (module order, titles, taglines).
- `content/weeks/*.json` — one file per module: concept text, the Northwind scenario, exercise fields, and the downloadable artifact template. Edit these directly to change or extend the curriculum — no code changes needed.
- `public/` — the frontend (plain HTML/CSS/JS, no build step, no framework):
  - `index.html` / `app.js` — home page, progress tracker
  - `week.html` / `week.js` — generic module page (concept, scenario, exercise form, save/complete/download)
  - `capstone.html` / `capstone.js` — pulls together all five modules' saved answers into one exportable portfolio doc
  - `team.html` / `team.js` — team-wide progress dashboard
  - `shared.js` — localStorage helpers, the `{{token}}` template-filling logic, and progress reporting
- `data/progress.json` — created automatically at first run; holds team progress (not committed — see `.gitignore`)

## How progress works

A learner's actual written answers live only in that browser's `localStorage` — they're never sent anywhere. Separately, if a learner enters their name on the home page, their **name and each module's status** (not started / in progress / complete — never the answer text) is reported to the server and stored in `data/progress.json`, keyed by a random per-browser id (no login, no account). Leaving the name field blank keeps everything local to that device.

Each module tracks:

- the learner's answers to that week's exercise fields (local only)
- whether the module has been explicitly marked complete (local + reported, if named)

Every module can export its exercise as a filled-in Markdown template (a real reusable artifact: a scorecard, a prompt template, a guardrail file, a prototype brief, a review rubric). The capstone stitches all five into one shareable document.

## Team progress dashboard

`/team.html` shows, for everyone who's entered a name: a status pill per module and an overall completion count, plus a per-module completion summary across the whole group. It reads straight from `data/progress.json` — there's no separate "team" or "cohort" concept yet (by design, for a single pilot team; see the plan for what a multi-team v2 would add).

## Running locally

```bash
npm start
# or: node index.js
```

Then open http://localhost:3000. Optionally set `PORT` (see `.env.example`).

## Extending the curriculum

To add or edit a module: edit or add a JSON file in `content/weeks/` following the existing schema (`concept`, `scenario`, `exercise.prompts`, `artifactTemplate`), and add/update its entry in `content/weeks.json`. The frontend renders modules generically from this data — no page-specific code needed for content changes.
