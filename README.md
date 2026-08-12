# AI PM Training Program

An in-app, self-paced training program for Equifax Workforce Solutions' Employer Services PMs — new to AI tooling — through five ~25–30 minute weekly modules plus a capstone, building the skills to support an AI software development lifecycle: writing effective AI prompts/specs, authoring guardrail/context files for agentic coding tools, prototyping with AI, and evaluating AI-produced work.

Every exercise runs on a real product category — **Onboarding**, which includes I-9, E-Verify, Onboarding Forms, and WOTC — building specifically within the **I-9** product (an "AI I-9 Completion Assistant") for a fully fictional customer, **Meridian Logistics**, with fictional data throughout. Other Employer Services categories (offboarding, ACA, unemployment cost management, ID Watchdog) show up as secondary examples across the modules. See the data-boundary note on the home page: real work stays in enterprise Gemini; this program is where the habit gets built, safely, on personal AI accounts.

The I-9-specific details in the lessons (the 3-business-day Section 2 deadline, List A vs. List B+C document rules, the 90-day receipt rule, reverification timing, retention duration, document-abuse pitfalls) are grounded in the actual [USCIS Form I-9 instructions](https://www.uscis.gov/i-9-central) and the [M-274 Handbook for Employers](https://www.uscis.gov/i-9-central/form-i-9-resources/handbook-for-employers-m-274) — not invented placeholders.

Styling (color palette, typography, logo) is pulled directly from Equifax's internal template — see [Brand styling](#brand-styling) below.

## What's in this repo

- `index.js` — a zero-dependency Node HTTP server. Serves the frontend from `public/` and content from `content/`.
- `content/weeks.json` — the program manifest (module order, titles, taglines).
- `content/weeks/*.json` — one file per module: intro, scenario, an ordered `sections[]` array, and the downloadable artifact template. Edit these directly to change or extend the curriculum — no code changes needed.
- `public/` — the frontend (plain HTML/CSS/JS, no build step, no framework):
  - `index.html` / `app.js` — home page, progress tracker
  - `week.html` / `week.js` — generic module page, rendering each section as guidance → worked example → the learner's own answer
  - `capstone.html` / `capstone.js` — pulls together all five modules' saved answers into one exportable portfolio doc
  - `team.html` / `team.js` — team-wide progress dashboard
  - `shared.js` — localStorage helpers, the `{{token}}` template-filling logic, and progress reporting
  - `assets/equifax-logo.png` — brand logo used in the header lockup on every page
- `data/progress.json` — created automatically at first run; holds team progress (not committed — see `.gitignore`)

## Content schema

Each module in `content/weeks/*.json` has:

```
{ id, order, title, tagline, timeEstimate,
  intro,                       // short framing paragraph for the whole module
  diagram: { svg, caption },   // optional week-level concept diagram, shown before the scenario
  scenario: { company, context, brief },
  sections: [
    { id,                      // used as the answer/template field key
      heading,
      learning,                // concise guidance — the AI-specific question for this lens
      example: { text, diagramSvg? },  // a fully worked example; diagramSvg is optional inline SVG markup
      pitfall,                 // optional common-mistake callout, shown after the example
      field: { label, help, type, placeholder }  // the learner's own input for this section
    }, ...
  ],
  artifactFilename, artifactTemplate  // {{sectionId}} tokens filled from saved answers
}
```

The frontend renders one card per section, in order: guidance, the worked example (with an optional inline diagram), a common-mistake callout, then the input — so a PM never has to hold five exercise questions in their head while reading a wall of concept text up top, and never has to guess at a pitfall that would only show up once it was too late.

Eight hand-authored inline-SVG diagrams ground the more spatial concepts: the Pragmatic Framework's Strategy-vs-Execution split plus an Urgent/Pervasive/Willing-to-Buy problem-validation model and the Value/Usability/Feasibility solution model within a Viability boundary (Week 1), the anatomy of a structured prompt (Week 2), the L1–L4 autonomy ladder plus an I-9 compliance timeline (Week 3), an HR-admin wireframe (Week 4), the six-stage AI SDLC loop (Week 5), and the orchestrator hub-and-spoke model (Capstone). All of them use CSS custom properties for color, so they redraw correctly in dark mode.

## Product taxonomy

**Onboarding** is the product category, not a product. The specific Equifax Workforce Solutions products inside it are **I-9**, **E-Verify**, **Onboarding Forms**, and **WOTC**. This program's running example — the "AI I-9 Completion Assistant" — is built specifically within the I-9 product; other Onboarding products (and sibling categories like ACA, offboarding, unemployment cost management, and ID Watchdog) show up as secondary examples, correctly scoped as their own products/categories rather than folded into "I-9 & Onboarding" as if it were one thing.

## How progress works

A learner's actual written answers live only in that browser's `localStorage` — they're never sent anywhere. Separately, if a learner enters their name on the home page, their **name and each module's status** (not started / in progress / complete — never the answer text) is reported to the server and stored in `data/progress.json`, keyed by a random per-browser id (no login, no account). Leaving the name field blank keeps everything local to that device.

Every module can export its exercise as a filled-in Markdown template (a real reusable artifact: a scorecard, a prompt template, a guardrail file, a prototype brief, a review rubric). The capstone stitches all five into one shareable document.

## Team progress dashboard

`/team.html` shows, for everyone who's entered a name: a status pill per module and an overall completion count, plus a per-module completion summary across the whole group. It reads straight from `data/progress.json` — there's no separate "team" or "cohort" concept yet (by design, for a single pilot team).

## Brand styling

Colors and typography were extracted directly from Equifax's internal PowerPoint template (theme + logo pixel sample), not eyeballed:

| Token | Hex | Source |
|---|---|---|
| Brand red (`--accent`) | `#9E1B32` | Sampled from the Equifax logo mark; matches the template's theme `accent2` |
| Ink (`--ink`) | `#333E48` | Template's dominant dark neutral |
| Muted (`--muted`) | `#5F6A72` | Template's secondary grey |
| Line (`--line`) | `#E7E7E7` | Template's light grey |
| Good / complete | `#45842A` | Template theme `accent4` |
| Warn / in progress | `#E77204` | Template theme `accent3` |

Typeface is **Arial** throughout (the only face defined in either theme, for both headings and body) — see `public/styles.css` for the full token set, including the dark-mode palette. The logo lockup in the header uses `public/assets/equifax-logo.png`, extracted from the same template.

## Running locally

```bash
npm start
# or: node index.js
```

Then open http://localhost:3000. Optionally set `PORT` (see `.env.example`).

## Extending the curriculum

To add or edit a module: edit or add a JSON file in `content/weeks/` following the schema above, and add/update its entry in `content/weeks.json`. The frontend renders modules generically from this data — no page-specific code needed for content changes.
