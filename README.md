# VoxRead

A Speechify-style document reader: upload a document and have it read aloud
in the AI voice you pick.

## Features

- **Read any document aloud** — `.txt`, `.md`, `.pdf`, and `.docx` are parsed
  in the browser and split into sentences that highlight in sync as they're
  spoken.
- **Choose your AI voice** — a curated library of well-known AI narration
  voices (Microsoft Aria/Guy/Jenny, Google US/UK, Apple Samantha/Daniel,
  Amazon Polly, ElevenLabs). Each one links to a YouTube search so you can
  preview it before picking it; picking it maps to a matching voice actually
  installed on your device via the browser's built-in text-to-speech engine
  (the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)).
  You can also pick from the full raw list of every voice installed on your
  OS/browser.
  - Note: this app does not extract or clone audio from YouTube videos —
    that isn't something it does. The library is a name-to-name mapping so
    you can preview a voice's *sound* on YouTube, then use a real installed
    voice of the same name.
- **Import documents from anywhere**:
  - **Local files** — drag-and-drop or the native file picker. On iPhone,
    the picker's "Browse" tab reaches Files, iCloud Drive, and anything
    you've saved or exported from the Notes app (Notes doesn't expose a web
    API, so export/share the note as text or PDF first, then pick it here).
  - **Google Drive** — click "Import from Google Drive" to sign in and pick
    a file (including native Google Docs/Slides, which are auto-converted to
    text). Requires the setup below.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static
production build in `dist/`, which can be deployed to any static host.

## Google Drive setup (optional)

The Google Drive import button is disabled until you configure OAuth
credentials:

1. In the [Google Cloud Console](https://console.cloud.google.com/), create
   (or reuse) a project and enable the **Google Drive API** and
   **Google Picker API**.
2. Create an **API key** (restrict it to the Picker API).
3. Create an **OAuth 2.0 Client ID** of type "Web application", and add the
   URL(s) you'll run this app from (e.g. `http://localhost:5173` for dev)
   to **Authorized JavaScript origins**.
4. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=your-api-key
   ```
5. Restart `npm run dev`.

## Adding higher-quality cloud voices

The AI voices you hear come from your OS/browser's built-in speech engine,
which sounds different across devices. The voice library also lists a few
cloud providers (Amazon Polly, ElevenLabs) as a reference for premium
alternatives — wiring one up as an actual audio backend (call their TTS API,
play back the returned audio) is a natural next step if you want the exact
same voice everywhere regardless of device.

## Tech

Vite + React + TypeScript, `pdfjs-dist` for PDF text extraction, `mammoth`
for `.docx`, and the Web Speech API for narration — no backend server
required.
