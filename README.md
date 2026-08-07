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
  - `shared.js` — localStorage helpers and the `{{token}}` template-filling logic

## How progress works

Everything is stored in the browser's `localStorage` — there's no backend database or accounts in this MVP (by design, for a single pilot team). Each module tracks:

- the learner's answers to that week's exercise fields
- whether the module has been explicitly marked complete

Every module can export its exercise as a filled-in Markdown template (a real reusable artifact: a scorecard, a prompt template, a guardrail file, a prototype brief, a review rubric). The capstone stitches all five into one shareable document.

## Running locally

```bash
npm start
# or: node index.js
```

Then open http://localhost:3000. Optionally set `PORT` (see `.env.example`).

## Extending the curriculum

To add or edit a module: edit or add a JSON file in `content/weeks/` following the existing schema (`concept`, `scenario`, `exercise.prompts`, `artifactTemplate`), and add/update its entry in `content/weeks.json`. The frontend renders modules generically from this data — no page-specific code needed for content changes.
