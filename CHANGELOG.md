# Changelog

All notable changes to **DroneLappen** are documented here. The format loosely
follows [Keep a Changelog](https://keepachangelog.com/); dates are `YYYY-MM-DD`.

## [1.1.0] — 2026-06-10

### Added
- **Global text-size toggle** (Normal / Stor / Størst) in the footer, available
  on every page. Scales the whole UI via the CSS `zoom` property, remembers the
  choice in `localStorage`, and applies it before first paint (inline bootstrap
  in `index.html`) so there is no flash of the default size on reload.

### Changed
- **Desktop layout no longer stretches edge-to-edge.** Content now sits in a
  centered column (`max-w-xl`, ≈ 576px) while the navy / fade / light color
  bands stay full-width. Hero text aligns with the content column on every
  screen — Home, ExamSelect, Quiz, Rapid, Results, Login, and the legal pages —
  and the footer is centered to match.
- Home footer version label bumped to **v1.1**; `package.json` version set to
  `1.1.0` (was `0.0.0`).

## [1.0.0] — 2026-04 → 2026-05 (beta baseline)

Feature set in place before the first changelog was started. Summarized from
git history.

### Core app
- React + Vite + Tailwind + Supabase scaffold, deployed on Vercel with SPA
  fallback routing.
- Quiz engine with three modes — **Eksamen**, **Læring**, and **Tempo** (Rapid).
  30-question exams, 60-minute wall-clock timer, 75% (23/30) pass threshold.
- JSONB options model (`{id, text}` + `correct_option_id`) with Fisher-Yates
  option shuffling on load.
- Two-step home flow (pick exam → pick mode), smart resume of the last session,
  and live question / category counts from Supabase.
- Results screen with pass/fail verdict, exam-type label, and per-question
  explanations.

### Accounts & content
- Supabase Auth: magic-link login plus password login/signup via a custom form
  (replacing `@supabase/auth-ui-react` for React 19 compatibility).
- Newsletter signup on the home page (MailerLite "Droneavisa subscribers" via an
  Edge Function).
- Legal pages: Vilkår, Personvern, Kontakt.

### Design
- "Round 2/3" visual redesign across Home, ExamSelect, the in-quiz screens, and
  the finish screens — Droneavisa palette (aviation navy `#083554` + gold
  `#E89F1E`), monospace HUD labels, propeller hero, crosshair marks.
- Quadcopter drone logo and "powered by Droneavisa.no" footer branding.

### Security & data
- Direct `questions` table access replaced with an Edge Function; RLS hardening
  and foreign-key / performance migrations.
- Content Security Policy and hardened security headers; `search_path` pinned on
  the `get_question_count` RPC.

[1.1.0]: https://github.com/frodoswai/dronelappen/compare/33ea7fe...main
[1.0.0]: https://github.com/frodoswai/dronelappen/commits/main
