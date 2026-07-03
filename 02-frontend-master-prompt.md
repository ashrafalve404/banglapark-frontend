# MASTER PROMPT — Bangla Park Limited Frontend (Next.js)

Use this entire document as your system/project brief. This frontend consumes the Bangla Park Limited backend API (NestJS, described separately). Read fully before writing code.

---

## 1. Project Identity

**Project Name:** Bangla Park Limited
**Repository location:** `banglaparkweb/frontend`
**Product Vision:** A membership-driven MLM e-commerce platform — users shop, get activated by purchase, build referral teams, and earn commissions/daily benefits tracked through personal dashboards. Admins manage the entire platform from a dedicated dashboard.

---

## 2. Tech Stack (mandatory)

- **Framework:** Next.js 14+ (App Router, TypeScript strict)
- **Styling:** Tailwind CSS + shadcn/ui components (accessible, consistent, themeable)
- **State/Data:** TanStack Query (React Query) for server state, Zustand for lightweight client state (cart, UI toggles)
- **Forms:** React Hook Form + Zod validation
- **Auth:** JWT stored in httpOnly cookies (via Next.js route handlers proxying to backend), refresh-token flow
- **Icons:** lucide-react
- **Charts (admin/user reports):** Recharts
- **Tables:** TanStack Table for admin data grids (sortable, filterable, paginated)
- **i18n-ready:** Bangla-first UI copy, but structure text so English can be added later (don't hardcode Bangla only inside JSX — use a simple copy/constants file per section)

---

## 3. Design Direction

**Reference:** https://www.banglagarden.com/ — take its general e-commerce layout logic (categories, product grid, clean checkout) as inspiration.

**But go more premium, minimal, and professional than the reference:**
- Generous white space, no visual clutter, no busy banners.
- A restrained color palette: one primary brand color (deep green or maroon — pick one that feels "trustworthy Bangladeshi retail," avoid neon/loud colors), neutral grays, one accent color max for CTAs.
- Clean sans-serif typography (e.g. Hind Siliguri or Noto Sans Bengali for Bangla text, paired with Inter for numbers/Latin text) — never default browser fonts.
- Card-based product grid with consistent aspect ratios, subtle hover elevation, no gimmicky animations.
- Dashboard UI (user + admin) should feel like a clean fintech app, not a cluttered admin theme — think Stripe Dashboard or Vercel Dashboard level of polish, not old-school PHP admin panels.
- Fully responsive, mobile-first — most Bangladeshi users will be on mobile, so cart/checkout/dashboard flows must be thumb-friendly.
- Use skeleton loaders (not spinners) for data-fetching states.
- Read `/mnt/skills/public/frontend-design/SKILL.md`-equivalent principles: intentional design tokens, no default/templated look.

---

## 4. Folder Structure (inside `frontend/`)

```
src/
  app/
    (public)/
      page.tsx                → Home
      shop/
      product/[slug]/
      cart/
      checkout/
      login/
      register/
    (user)/
      dashboard/
        page.tsx               → Overview
        profile/
        wallet/
        orders/
        referrals/
        daily-benefit/
        generation-income/
        withdraw/
        notifications/
    (admin)/
      admin/
        page.tsx               → Overview
        users/
        products/
        categories/
        orders/
        wallet/
        withdrawals/
        commission-rules/
        reports/
        cms/
  components/
    ui/            (shadcn generated)
    layout/        (Header, Footer, Sidebar, DashboardShell, AdminShell)
    shop/
    dashboard/
    admin/
    shared/
  lib/
    api/           (typed fetch wrappers per backend module)
    auth/
    utils/
    validators/    (zod schemas)
  hooks/
  store/           (zustand slices)
  types/
```

---

## 5. Site Map & Pages

### 5.1 Public Storefront
- **Home:** hero, featured categories, best-selling products, membership/activation explainer banner ("প্রোডাক্ট কিনে আপনার একাউন্ট একটিভ করুন এবং আয় শুরু করুন")
- **Shop:** category filter, price filter, search, pagination/infinite scroll
- **Product Details:** gallery, price, variant selection, add to cart, related products, note if this purchase qualifies for activation (badge: "এই প্রোডাক্ট একাউন্ট একটিভ করার জন্য যোগ্য" if price contributes toward ≥ BDT 2,000)
- **Cart:** quantity edit, subtotal, "activation progress" indicator (e.g. "আরও ৳500 কিনলে আপনার একাউন্ট একটিভ হবে")
- **Checkout:** address form, payment method selection, order summary
- **Login / Register:** register accepts optional `?ref=CODE` from a referral link and shows "You were referred by [Name]" confirmation before submit

### 5.2 User Dashboard (auth-gated)
- **Overview:** activation status card (Active/Inactive + days remaining), wallet balance, today's earnings summary, quick links
- **Profile:** edit info, change password
- **Wallet:** balance, full transaction history table (filter by type/date), export
- **Orders:** order history with status tracker, reorder button
- **Referrals:** referral link/code with copy + share buttons, stats cards (total / active / inactive team members) — **no tree visualization**, just clean stat cards and a searchable list of direct referrals with their status
- **Daily Benefit:** current active team count, current tier reached, daily log history (date, team count that day, amount earned) shown as a table + simple line chart
- **Generation Income:** table of commissions received (from which new member, level, amount, date)
- **Withdraw:** request form (amount, method — bKash/Nagad/Rocket/Bank with conditional fields), minimum ৳1,000 validation, request history with status badges
- **Notifications:** list of system notifications (activation expiring soon, commission received, withdrawal approved/rejected)

### 5.3 Admin Dashboard (role-gated)
- **Overview:** platform KPIs (total users, active users, today's sales, today's commission payout, pending withdrawals) with charts
- **Users:** searchable/filterable table, view profile, manually activate/deactivate/ban, view a user's referral network summary
- **Products / Categories:** full CRUD with image upload
- **Orders:** manage status transitions (with guardrails — cannot skip to Delivered without passing through prior states), view which orders are "qualifying"
- **Wallet Management:** view all wallets, manual adjustment tool (with mandatory reason field, fully logged)
- **Withdrawals:** pending queue, approve/reject with reason, history
- **Commission Rules:** editable config for the daily-benefit tier table and the qualifying-order/commission amounts (so admin can adjust ৳2,000 threshold or ৳200 commission without a code deploy)
- **Reports:** sales report, commission payout report, active-user growth report, CSV export
- **CMS:** manage homepage banners/promotional content

---

## 6. Key UX Rules Reflecting Business Logic

- Never show a referral tree diagram anywhere — only aggregate counts and flat lists, per the finalized business rule.
- Always show the user their `active_until` countdown prominently; when under 5 days, show a persistent "activate now" reminder banner with a CTA to shop.
- If a user is `INACTIVE`, wallet/earnings pages should visibly indicate "কমিশন বন্ধ আছে — একাউন্ট একটিভ করুন" instead of silently showing zero.
- Withdraw form must disable submission below ৳1,000 and show real-time available balance (balance minus already-pending withdrawal requests).
- Order status stepper on the user side should visually reflect: Pending → Confirmed → Processing → Shipped → Delivered (Cancelled shown as a distinct red state, not part of the stepper).

---

## 7. API Integration Notes

- Centralize all API calls in `lib/api/*.ts`, one file per backend module (`auth.ts`, `wallet.ts`, `orders.ts`, etc.), fully typed against backend DTOs.
- Use Next.js Route Handlers as a thin proxy layer for setting/reading httpOnly auth cookies; don't expose raw JWTs to client JS.
- Use React Query for all GET requests with sensible `staleTime` per data type (e.g. wallet balance refetch more frequently than product catalog).
- Handle 401 globally (refresh token attempt → redirect to login on failure).

---

## 8. Non-Functional Requirements

- Lighthouse performance target 90+; optimize images via `next/image`.
- SEO metadata on all public pages (product, category, home).
- Full mobile responsiveness tested at 375px width minimum.
- Accessible components (shadcn/ui defaults are a good baseline — don't strip aria attributes).
- Environment-based API base URL config (`.env.local`).

---

## 9. Build Order (do it in this sequence)

**Phase 1:** Project scaffold, design tokens/theme, layout shells (Header/Footer, DashboardShell, AdminShell), auth pages
**Phase 2:** Public storefront (Home, Shop, Product Details, Cart, Checkout)
**Phase 3:** User Dashboard (Overview, Profile, Wallet, Orders, Referrals)
**Phase 4:** User Dashboard (Daily Benefit, Generation Income, Withdraw, Notifications)
**Phase 5:** Admin Dashboard (all modules), Reports, CMS, polish pass matching the minimal/premium design direction

Confirm each phase renders correctly and connects to real backend endpoints (not mock data) before moving to the next.
