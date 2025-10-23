# ACME I‑9 — AI Form I‑9 Auditing Website

This repo hosts a promotional website for ACME I‑9, an AI‑powered service that audits historical Form I‑9 records from PDFs and images, extracts field‑level data, validates against 300+ rules, and produces fix‑ready reports with an executive summary estimating mitigable fines in USD.

## Tech stack
- Node.js with Express serving a static site
- Vanilla HTML/CSS/JS located under `public/`

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the site:
   ```bash
   npm run start
   ```
3. Open `http://localhost:3000` in your browser.

## Project structure
- `server.js` — Express static server
- `public/index.html` — main landing page
- `public/assets/styles.css` — styles with ACME I‑9 brand (fonts/colors)
- `public/assets/script.js` — small interactions (nav toggle, demo form)

## Customization
- Update copy and sections in `public/index.html`
- Adjust colors/typography in `public/assets/styles.css`

## Notes
This is a marketing site and does not upload or process any files. For demo purposes, the “Schedule a Demo” form simply shows a confirmation alert.
