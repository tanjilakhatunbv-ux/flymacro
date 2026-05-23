# Unified Auth Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace separate login/register user journeys with one `/auth` page that supports login and signup modes.

**Architecture:** Keep the existing API and `AuthForm` submission logic. Add a shared server page for `/[locale]/auth`, redirect legacy `/login` and `/register` routes to mode-specific auth URLs, and update links to preserve intent through `mode` query params.

**Tech Stack:** Next.js App Router, next-intl routing, React client components, existing script-based regression tests.

---

### Task 1: Regression Test

**Files:**
- Create: `scripts/test-unified-auth-flow.ts`
- Modify: `package.json`

- [ ] Add a script that asserts:
  - `HeaderAuth` links to `/auth?mode=login` and `/auth?mode=register`.
  - `/login/page.tsx` and `/register/page.tsx` redirect to `/auth?...`.
  - `/auth/page.tsx` renders the auth shell and accepts `mode`.
  - `AuthForm` mode-switching links target `/auth?...`.

- [ ] Run `pnpm exec tsx scripts/test-unified-auth-flow.ts`.
  Expected before implementation: fails because `/auth/page.tsx` does not exist and links still point to `/login` and `/register`.

### Task 2: Unified Auth Route

**Files:**
- Create: `src/app/(frontend)/[locale]/auth/page.tsx`
- Modify: `src/app/(frontend)/[locale]/login/page.tsx`
- Modify: `src/app/(frontend)/[locale]/register/page.tsx`

- [ ] Create `/auth` as the canonical server page.
- [ ] Parse `mode`, `return`, `error`, and `message` search params.
- [ ] Sanitize `return` with the same local-path rule as login.
- [ ] Redirect authenticated users to the sanitized return URL.
- [ ] Render one `auth-card` with login/register segmented controls.
- [ ] Render login-only admin help and register-only terms copy.
- [ ] Redirect `/login` to `/auth?mode=login` and `/register` to `/auth?mode=register`, preserving `return` where present.

### Task 3: Link Updates

**Files:**
- Modify: `src/components/HeaderAuth.tsx`
- Modify: `src/components/AuthForm.tsx`
- Modify: `src/components/VerifyEmailRunner.tsx`

- [ ] Change public header auth links to `/auth?mode=login` and `/auth?mode=register`.
- [ ] Change AuthForm footer links between login and register to same-page mode links.
- [ ] Keep forgot/reset flows pointing to dedicated pages.
- [ ] Point verification fallback links at the canonical auth modes.

### Task 4: Copy And Styling

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/zh.json`
- Modify: `src/styles/globals.css`

- [ ] Add auth copy keys for unified page title/subtitle and segmented navigation labels.
- [ ] Add compact segmented control styles under the existing auth CSS block.
- [ ] Avoid broad visual redesign.

### Task 5: Verification

**Files:**
- Existing regression scripts.

- [ ] Run `pnpm exec tsx scripts/test-unified-auth-flow.ts`.
- [ ] Run `pnpm exec tsx scripts/test-auth-form-security.ts`.
- [ ] Run `pnpm exec tsx scripts/test-auth-form-error-codes.ts`.
- [ ] Run `pnpm exec tsx scripts/test-auth-form-client-submit.ts`.
- [ ] Run `pnpm exec tsc --noEmit`.

