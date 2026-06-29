# FATCO CRM

Customer & operations management for **FATCO — Ahmad Fawzi Fathalla EST.** (oil, tyres & car services, Tripoli). Serves both **B2B** and **B2C** customers.

## Stack

- **Next.js 16** (App Router, TypeScript, Server Actions)
- **Prisma 7** ORM with the `@prisma/adapter-pg` driver adapter
- **Postgres** (Neon / Supabase / Vercel Postgres) in every environment
- **Tailwind CSS v4** · **three.js** (3D landing hero)
- Deploy target: **Vercel** — see [DEPLOY.md](DEPLOY.md)

## Getting started

You need a Postgres connection string (a free [Neon](https://neon.tech) branch works
great for local dev). Copy `.env.example` to `.env` and set `DATABASE_URL`, then:

```bash
npm install
npm run db:deploy      # apply migrations to your database
npm run db:seed        # load realistic demo data
npm run dev            # http://localhost:3000
```

Demo login: `admin@fatco.com` / `fatco123`.

Useful scripts:

| Script | Purpose |
| --- | --- |
| `npm run db:seed` | Reset + load demo data |
| `npm run db:reset` | Drop, re-migrate and re-seed |
| `npm run db:migrate` | Create/apply a migration |
| `npm run build` | Production build |

## Auth

Credential login (bcrypt) with a signed JWT session cookie (`jose`) and route-protecting middleware — unauthenticated users are bounced to `/login`. The signing key is `AUTH_SECRET` in `.env` (a dev key is generated automatically; set your own in production). Sign in with the seeded `admin@fatco.com` / `fatco123`. The current user + **Sign out** show at the bottom of the sidebar.

### Roles & access

Three roles, enforced centrally in `lib/permissions.ts` (middleware + sidebar + server actions all share it):

| Section | OWNER | MANAGER | STAFF |
| --- | :-: | :-: | :-: |
| Dashboard, Customers, Items, Sales/POS | ✅ | ✅ | ✅ |
| Loyalty, Offers, Expenses, Reports | ✅ | ✅ | — |
| Staff management | ✅ | — | — |

Disallowed sections are hidden from the sidebar and blocked by middleware (redirect to dashboard). **Staff** (`/staff`, owners only) is a full user-management screen: add users, change roles, enable/disable, reset passwords, delete — with guards so you can't lock out the last owner or yourself.

## Public landing page

`/` is a public marketing landing (no login needed) with a **3D car hero** built in `react-three-fiber` + `drei` — a stylized brand-red car that auto-rotates, tilts toward the cursor (parallax), spins its wheels, and drifts on scroll. It's lazy-loaded client-side (`ssr: false`) and respects `prefers-reduced-motion`. CTAs route to **Staff sign in** (`/login`) and **Customer portal** (`/portal/login`); for a logged-in staff member the CTA becomes **Open dashboard**. The back-office dashboard now lives at **`/dashboard`**.

## What's built (Phase 1 — back-office core)

- **Dashboard** — revenue / gross profit / expenses / net (30d), 6-month revenue trend, top customers, recent sales, low-stock alerts.
- **Customers** — B2C/B2B list with search & filter, create form, detail page with vehicles, full service/purchase history, loyalty activity. Add vehicles inline.
- **Items & Inventory** — catalog with cost/sale/margin, stock levels, low-stock badges, inline stock adjustments (writes inventory movements), create/edit.
- **Sales & Services** — transaction ledger with cost/total/profit per sale, plus a **point-of-sale screen** (`/sales/new`) to record a sale: add items/services, set customer/vehicle/payment, live totals. On submit it persists the transaction, **decrements inventory** (with movement records), updates vehicle mileage, and **applies loyalty** (points-per-spend + punch-card reward detection).
- **Expenses** — direct/indirect tracking with quick-entry form and totals.
- **Loyalty** — full rule **editor** (create / enable / disable / delete punch-card and points-per-spend rules from the UI), points-per-spend earning, and **automatic reward issuing**: when a customer hits a punch-card threshold (e.g. 5 oil changes) the system auto-issues a redeemable reward. Available rewards show on the loyalty page and customer profile, and can be **redeemed at the POS** as a discount.
- **Offers** — time-bound promotions.
- **Reports** — all-time P&L (revenue → COGS → gross → expenses → net) and revenue by category.

## Data model highlights

Single relational schema (`prisma/schema.prisma`) covering: `Customer`, `Vehicle`, `Item`, `InventoryMovement`, `ServiceType`, `Transaction` + `TransactionLine`, `LoyaltyRule`, `LoyaltyLedger`, `Offer`, `Expense`, `User`, and a Phase-2 `ServiceReminder`.

Profit is real: every transaction line stores `unitCost`, so margin = sale − cost everywhere.

> Portability: we use string-typed status/category fields (not native enums) and no arrays, so the same schema runs on SQLite locally and Postgres in production. Allowed values live in `lib/constants.ts`.

## Client portal (Phase 2 — part 1)

A customer-facing portal at **`/portal`**, separate from the staff app:

- Customers sign in with their **phone number + a PIN**. Staff generate/share the PIN from the customer's detail page (no SMS/WhatsApp provider needed yet).
- Portal dashboard shows the customer's **loyalty points, available rewards, vehicles, and full service history** — and nothing else (queried strictly by the logged-in customer).
- Uses a **separate session cookie** (`fatco_portal`, scoped) from staff auth, with its own middleware branch and chrome. Staff and customer sessions cannot cross over.

Demo: on any seeded customer's page, click **Generate portal PIN**, then sign in at `/portal` with that phone + PIN.

## Roadmap

**Phase 1 (done):** back-office core above.
**Phase 2 part 1 (done):** client portal above.

## Service reminders (Phase 2 — part 2)

A back-office **Reminders** screen (`/reminders`) that computes which vehicles are due for service:

- For each reminder-enabled service type (`ServiceType.reminderIntervalDays` / `reminderIntervalKm`), it finds each vehicle's last service of that type and flags anything **overdue** or **due within 14 days** — by date or by mileage.
- Each row has a **Send reminder** button; sending records a `ServiceReminder` (status `SENT`) and dispatches via the active messaging provider.
- Performing the service again **auto-closes** the reminder (`recordSale` marks open reminders `DONE`), starting a fresh cycle.

### Messaging providers (WhatsApp-ready)

`lib/messaging.ts` defines a `MessagingProvider` interface. Two implementations:

- **Console** (default) — logs the message; works today for testing.
- **Meta WhatsApp Cloud API** — a real implementation that activates automatically once `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_ID` are set in `.env`. No code changes needed to go live; the Reminders page shows which channel is active.

The seed includes two deliberately-overdue customers (Georges Aoun, Maya Fares) so the screen has content.

**Next increments (back office):**
- Auth (NextAuth/credentials) + role-based access (OWNER / MANAGER / STAFF).
- Editable/voidable transactions and printable receipts.

**Phase 2 remaining:**
- **WhatsApp reminders go-live** — the reminders engine + Meta provider are built; just add `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` (verified Meta Business + approved template) to send for real. Optionally a scheduled job to auto-send daily.
- **WhatsApp chatbot** — inbound webhook so customers can ask about services / loyalty points (reuses the same messaging provider + portal data queries).

## Deployment

See **[DEPLOY.md](DEPLOY.md)** for the full Vercel + Neon runbook. In short: the build
runs `prisma migrate deploy` then `next build`; set `DATABASE_URL`, `AUTH_SECRET`, and
`NEXT_PUBLIC_APP_URL` as environment variables. `postinstall` runs `prisma generate` so
the client builds automatically.
