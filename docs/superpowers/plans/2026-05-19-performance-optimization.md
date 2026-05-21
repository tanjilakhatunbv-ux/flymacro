# FlyMacro Performance Optimization Implementation Plan

**Goal:** Significantly improve FlyMacro frontend performance by optimizing image delivery, database queries, caching strategies, rendering modes, and client-side network overhead.

**Architecture:** Four phased rollout: quick wins, data fetching, rendering strategy, client-side overhead. Each phase independently deployable.

**Tech Stack:** Next.js 15.4.11, React 19, Payload CMS 3.x, PostgreSQL, next-intl 3.26, Upstash Redis 1.38, TypeScript.

---

## File Map

| File | Responsibility |
|------|---------------|
| next.config.mjs | Next.js config - images.remotePatterns |
| src/payload.config.ts | Payload config - postgresAdapter pool |
| src/components/MacroCard.tsx | Macro cards - unoptimized images |
| src/components/RichText.tsx | Lexical renderer - unoptimized uploads |
| src/app/(frontend)/[locale]/page.tsx | Home page - limit:1000 query |
| src/app/(frontend)/[locale]/macros/page.tsx | Macros list - depth:2 |
| src/app/(frontend)/[locale]/macros/[slug]/page.tsx | Macro detail - depth:2 |
| src/lib/auth.ts | JWT auth - DB fetch every request |
| src/app/(frontend)/[locale]/account/layout.tsx | Account layout - force-dynamic |
| src/components/HeaderAuth.tsx | Header - unconditional session fetch |
| src/components/VerificationBanner.tsx | Banner - unconditional me fetch |
| src/components/MacroGridClient.tsx | Grid - client exchange fetch |
| src/app/(frontend)/[locale]/layout.tsx | Root layout - VerificationBanner |
| src/middleware.ts | next-intl middleware matcher |

---

## Phase 1: Quick Wins (Image Optimization, DB Pooling, Cache Tags)

**Theme:** Low-risk, high-impact changes. Deployable in a single PR.

### Task 1.1: Tighten images.remotePatterns in next.config.mjs

**Files:**
- Modify: next.config.mjs:10-17

**What to change:** Replace overly permissive hostname: "**" with explicit domains.

**Expected impact:** Enables Next.js Image Optimization for known sources.

**Risks:** None - only restricts what was already open.

- [ ] **Step 1: Update remotePatterns**



- [ ] **Step 2: Verify build** Run: npm run build

- [ ] **Step 3: Commit**

### Task 1.2: Remove unoptimized from MacroCard images

**Files:**
- Modify: src/components/MacroCard.tsx:30
- Modify: src/components/MacroCard.tsx:43

**What to change:** Delete the unoptimized prop from both Image components.

**Expected impact:** Macro cards get WebP/AVIF conversion, responsive sizing.

**Risks:** Very low. Fallback to unoptimized if domain not in remotePatterns.

- [ ] **Step 1:** Delete unoptimized on lines 30 and 43

- [ ] **Step 2:** Run npm run build, check for warnings

- [ ] **Step 3:** Commit

### Task 1.3: Remove unoptimized from RichText upload images

**Files:**
- Modify: src/components/RichText.tsx:125

**What to change:** Delete unoptimized prop from the upload Image in Lexical renderer.

**Expected impact:** Body content images get optimized.

- [ ] **Step 1:** Delete unoptimized on line 125

- [ ] **Step 2:** Commit

### Task 1.4: Add PostgreSQL connection pooling

**Files:**
- Modify: src/payload.config.ts:103-108

**What to change:** Add pool settings to postgresAdapter.

**Expected impact:** 20-40% faster DB under concurrent load.

**Risks:** Low. Conservative defaults.

- [ ] **Step 1: Add pool config**



- [ ] **Step 2:** Run npm run dev, verify no DB errors

- [ ] **Step 3:** Commit

### Task 1.5: Verify all unstable_cache calls have tags

**Files:** Audit all unstable_cache usages

**What to change:** Verification pass. All existing caches already have tags.

- [ ] **Step 1:** Run: grep -rn unstable_cache src/

- [ ] **Step 2:** Confirm every call has a tags array

---

## Phase 2: Data Fetching Optimization

**Theme:** Fix the most expensive database queries.

### Task 2.1: Cache home page class-count query

**Files:**
- Create: src/lib/class-counts.ts
- Modify: src/app/(frontend)/[locale]/page.tsx:13-66

**What to change:** Wrap the allMacros fetch in unstable_cache.

**Expected impact:** Eliminates 1000-row fetch from home page render path.

**Risks:** Low. 5min TTL.

- [ ] **Step 1:** Create src/lib/class-counts.ts with getCachedClassMacroCounts

- [ ] **Step 2:** Update page.tsx to use the helper

- [ ] **Step 3:** Verify home page class counts render

- [ ] **Step 4:** Commit

### Task 2.2: Reduce depth:2 to depth:1 on macros list query

**Files:**
- Modify: src/app/(frontend)/[locale]/macros/page.tsx:74

**What to change:** Change depth from 2 to 1 in findMacros.

**Expected impact:** Reduces query complexity and payload size ~3x.

**Risks:** Low. MacroCard only needs depth-1 fields.

- [ ] **Step 1:** Change depth: 2 to depth: 1 on line 74

- [ ] **Step 2:** Verify /macros filters and cards work

- [ ] **Step 3:** Commit

### Task 2.3: Reduce depth:2 to depth:1 on macro detail query

**Files:**
- Modify: src/app/(frontend)/[locale]/macros/[slug]/page.tsx:49

**What to change:** Change depth from 2 to 1 in findMacroBySlugCached.

**Expected impact:** Faster detail page loads.

**Risks:** Low. Verify tags, images, SEO still work.

- [ ] **Step 1:** Change depth: 2 to depth: 1 on line 49

- [ ] **Step 2:** Verify detail page renders fully

- [ ] **Step 3:** Commit

### Task 2.4: Cache authenticated user lookups in Redis

**Files:**
- Create: src/lib/user-cache.ts
- Modify: src/lib/auth.ts:30-70
- Modify: src/lib/user-actions.ts
- Modify: src/app/api/auth/claim-bonus/route.ts
- Modify: src/app/api/payment/webhook/route.ts
- Modify: src/app/api/macro/exchange/route.ts
- Modify: src/app/api/macro/renew/route.ts
- Modify: src/app/api/admin/adjust-credits/route.ts

**What to change:** Add Redis cache around getCurrentUser DB lookup.

**Expected impact:** Eliminates ~90% of user DB queries.

**Risks:** Medium. Must invalidate on user mutations.

- [ ] **Step 1:** Create src/lib/user-cache.ts with getCachedUser/setCachedUser/invalidateUserCache

- [ ] **Step 2:** Integrate into getCurrentUser in src/lib/auth.ts

- [ ] **Step 3:** Add invalidateUserCache to all user mutation points

- [ ] **Step 4:** Verify login/logout/account pages work

- [ ] **Step 5:** Commit

---

## Phase 3: Rendering Strategy

**Theme:** Fix force-dynamic overuse, add static generation, reduce layout fetching.

### Task 3.1: Remove dynamic=force-dynamic from account pages

**Files:**
- Modify: src/app/(frontend)/[locale]/account/page.tsx:7
- Modify: src/app/(frontend)/[locale]/account/exchanges/page.tsx:9
- Modify: src/app/(frontend)/[locale]/account/orders/page.tsx:8
- Modify: src/app/(frontend)/[locale]/account/transactions/page.tsx:7
- Modify: src/app/(frontend)/[locale]/account/notifications/page.tsx:10
- Modify: src/app/(frontend)/[locale]/account/tickets/page.tsx:8
- Modify: src/app/(frontend)/[locale]/account/tickets/new/page.tsx:5
- Modify: src/app/(frontend)/[locale]/account/tickets/[id]/page.tsx:11
- Modify: src/app/(frontend)/[locale]/account/settings/page.tsx:8

**What to change:** Delete export const dynamic = force-dynamic from each page.

**Expected impact:** Removes foot-gun. Pages are already dynamic via getCurrentUser.

**Risks:** Very low.

- [ ] **Step 1:** Delete force-dynamic from all 9 account page files

- [ ] **Step 2:** Verify account pages load

- [ ] **Step 3:** Commit

### Task 3.2: Optimize account layout notification count query

**Files:**
- Create: src/lib/notification-cache.ts
- Modify: src/app/(frontend)/[locale]/account/layout.tsx:6-31

**What to change:** Cache unread count with unstable_cache (30s TTL).

**Expected impact:** Eliminates one payload.count per account page nav.

**Risks:** Low. Badge may be stale up to 30s.

- [ ] **Step 1:** Create src/lib/notification-cache.ts with getCachedUnreadCount

- [ ] **Step 2:** Update account/layout.tsx to use cached count

- [ ] **Step 3:** Verify badge updates correctly

- [ ] **Step 4:** Commit

### Task 3.3: Add generateStaticParams to home page

**Files:**
- Modify: src/app/(frontend)/[locale]/page.tsx

**What to change:** Add generateStaticParams returning zh and en.

**Expected impact:** Pre-renders home page at build time.

**Risks:** None.

- [ ] **Step 1:** Add export function generateStaticParams() { return [{locale:"zh"},{locale:"en"}] }

- [ ] **Step 2:** Run npm run build, confirm static output

- [ ] **Step 3:** Commit

### Task 3.4: Convert settings page from use client to Server Component

**Files:**
- Create: src/components/SettingsForms.tsx
- Modify: src/app/(frontend)/[locale]/account/settings/page.tsx

**What to change:** Extract useActionState forms into a client component. Page becomes Server Component.

**Expected impact:** Smaller client JS bundle.

**Risks:** Low. Must preserve form behavior.

- [ ] **Step 1:** Create SettingsForms.tsx with the two forms

- [ ] **Step 2:** Update settings/page.tsx to async Server Component rendering SettingsForms

- [ ] **Step 3:** Verify nickname and password forms work

- [ ] **Step 4:** Commit

### Task 3.5: Lazy-load VerificationBanner

**Files:**
- Modify: src/app/(frontend)/[locale]/layout.tsx

**What to change:** Use next/dynamic with ssr:false for VerificationBanner.

**Expected impact:** Reduces initial hydration work.

**Risks:** Low. Not critical for initial paint.

- [ ] **Step 1:** Replace static import with dynamic import

- [ ] **Step 2:** Verify banner still shows for unverified users

- [ ] **Step 3:** Commit

---

## Phase 4: Client-Side Overhead Reduction

**Theme:** Reduce unnecessary network requests from client components.

### Task 4.1: Make HeaderAuth respect session cache before fetching

**Files:**
- Modify: src/components/HeaderAuth.tsx:24-56

**What to change:** If sessionStorage cache is valid, skip the /api/auth/session fetch entirely.

**Expected impact:** Eliminates session fetch on every page load for active users. Biggest client-side win.

**Risks:** Low. Cache TTL is 5 minutes. clearSessionCache called on login/logout.

- [ ] **Step 1:** In useEffect, after reading cache, add: if (cacheValid) { setUser(cached.user); setUnread(cached.unread); return; }

- [ ] **Step 2:** Verify header shows user immediately from cache

- [ ] **Step 3:** Commit

### Task 4.2: Make VerificationBanner respect session cache

**Files:**
- Modify: src/components/VerificationBanner.tsx:21-33
- Modify: src/lib/session-cache.ts
- Modify: src/components/HeaderAuth.tsx

**What to change:** Add _verified to session cache. Skip /api/auth/me fetch for guests and verified users.

**Expected impact:** Eliminates auth/me fetch on every page load for most users.

**Risks:** Low.

- [ ] **Step 1:** Add _verified?: boolean to CachedUser in session-cache.ts

- [ ] **Step 2:** Update HeaderAuth writeSessionCache to include _verified

- [ ] **Step 3:** Update VerificationBanner useEffect to check cache first

- [ ] **Step 4:** Verify: guest=no banner, verified=no banner, unverified=banner shows

- [ ] **Step 5:** Commit

### Task 4.3: Inline exchanged IDs into macro list server response

**Files:**
- Modify: src/app/(frontend)/[locale]/macros/page.tsx
- Create: src/components/MacroGrid.tsx
- Delete: src/components/MacroGridClient.tsx (if unused elsewhere)

**What to change:** Fetch exchanged IDs server-side in macros page. Replace MacroGridClient with server MacroGrid.

**Expected impact:** Eliminates client /api/macro/my-exchanges fetch. Reduces JS bundle.

**Risks:** Medium. Restructures component boundary.

- [ ] **Step 1:** Create MacroGrid.tsx (server component) accepting macros + exchangedIds

- [ ] **Step 2:** Update macros/page.tsx to fetch exchanged IDs via getCurrentUser + payload.find on macro-exchanges

- [ ] **Step 3:** Check if MacroGridClient is used elsewhere; delete if not

- [ ] **Step 4:** Verify exchanged badges show on /macros

- [ ] **Step 5:** Commit

### Task 4.4: Optimize next-intl middleware matcher

**Files:**
- Modify: src/middleware.ts:6-8

**What to change:** Simplify matcher to single pattern.

**Expected impact:** Small. Reduces middleware overhead on static assets and API routes.

**Risks:** Very low.

- [ ] **Step 1:** Replace matcher with: matcher: ['/((?!api|admin|_next|_vercel|.*..*).*)']

- [ ] **Step 2:** Verify /, /macros, /zh/macros, /en/macros routing works

- [ ] **Step 3:** Commit

---

## Verification Summary

After each phase, run:

1. **Build check:** npm run build - must complete without errors.
2. **Type check:** npx tsc --noEmit - must pass.
3. **Smoke tests:**
   - Home page loads with class counts
   - Macros list filters work, images load
   - Macro detail shows all data
   - Login/logout works
   - Account pages load, badge correct
   - Settings forms work
   - Unverified user sees banner; verified/guest do not
   - Exchanged macros show badge

4. **Performance spot-checks:**
   - DevTools Network: no /api/auth/session or /api/auth/me when cache fresh
   - /macros as logged-in: no /api/macro/my-exchanges request
   - Macro card images use /_next/image URLs

---

## Critical Files for Implementation

- d:/Hwork2026/20260501FlyMacro/flymacro-next/next.config.mjs
- d:/Hwork2026/20260501FlyMacro/flymacro-next/src/payload.config.ts
- d:/Hwork2026/20260501FlyMacro/flymacro-next/src/components/MacroCard.tsx
- d:/Hwork2026/20260501FlyMacro/flymacro-next/src/lib/auth.ts
- d:/Hwork2026/20260501FlyMacro/flymacro-next/src/app/(frontend)/[locale]/macros/page.tsx
