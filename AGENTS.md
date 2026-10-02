# AGENTS.md

This repository is the Ma7fath AI Quran memorization platform. It is a bilingual (Arabic/English) React app with a Node/Express backend and Firebase/Gemini integrations.

## Project overview

- Frontend: Vite + React in `src/` with routes managed by `src/App.jsx`.
- Backend: Express server in `server/index.js`, with database logic in `server/database.js` and recitation logic in `server/recitationEngine.js`.
- Data services: Firebase Auth/Firestore/Storage via `src/lib/firebase.js`.
- AI: Gemini API usage is handled through the client-side engine in `src/utils/quranAiEngine.js` and server-side access in `server/index.js`.
- Mobile packaging: Capacitor config in `capacitor.config.ts` with Android/iOS projects under `android/` and `ios/`.

## Core commands

- Install dependencies: `npm install`
- Run app locally: `npm run dev` or `npm start`
- Build frontend: `npm run build`
- Preview production build: `npm run preview`
- Sync Capacitor native projects: `npm run cap:sync`
- Open Android project: `npm run cap:android`
- Open iOS project: `npm run cap:ios`

## Architecture and conventions

- Prefer existing patterns over introducing new frameworks or state libraries.
- Keep React components in `src/components/` and app screens in `src/pages/`.
- Data access should stay in `src/lib/` or the server-side modules under `server/` instead of ad hoc logic inside UI components.
- The app is bilingual and UI text is frequently Arabic-first; preserve locale/RTL considerations when editing UI.
- Authentication and user state rely on Firebase; do not bypass the existing `AuthContext`/`firebase` abstraction unless the task truly requires it.
- The server exposes REST endpoints under `/api`; keep new backend endpoints consistent with the Express pattern used in `server/index.js`.
- For AI features, prefer reusing the existing internal Quran engine and API key storage flow instead of creating a parallel integration path.

## Practical guidance for agents

- Before making a change, identify whether the work belongs in the frontend (`src/`), backend (`server/`), or Firebase integration (`src/lib/firebase.js`).
- Try to match the project’s current style and naming rather than rewriting modules.
- Keep changes focused and minimal; this repo already contains many feature-specific components and utilities.
- When editing or adding features, preserve the existing bilingual user experience and app-level flows.
- Prefer small, testable edits that fit the current architecture instead of large refactors.

## Special considerations

- This project includes PWA assets and service worker files under `public/` and `src/`; avoid breaking mobile/web install behavior when changing app shell logic.
- Some AI features depend on the browser storing a Gemini API key in localStorage (`ma7fath_gemini_api_key`); do not remove that flow without checking UI behavior and compatibility.
- Native mobile builds require Capacitor sync steps after frontend changes; keep that in mind for build-related edits.

## Helpful references

- Root project README: `README.md`
- Frontend app entry: `src/App.jsx`
- Server entry: `server/index.js`
- Firebase setup: `src/lib/firebase.js`
- AI engine: `src/utils/quranAiEngine.js`
