# TUMA

Premium, AI-assisted business management for African small businesses. Built
with Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS v4,
shadcn/ui and Supabase (PostgreSQL + Auth).

## What is implemented

- Marketing site with live product previews, pricing and FAQ.
- Email/password registration, sign-in, sign-out, forgot password and reset.
- Supabase SSR sessions: cookies are refreshed in `src/proxy.ts` and every
  protected page/action validates the session server-side with `auth.getUser()`.
- Business onboarding (name, category, description, phone, location) with a
  unique storefront slug generated on the server.
- RLS-protected dashboard with live KPIs, recent orders, stock watch, plan card
  and a product catalogue (create + archive).
- Full product & inventory module: create, edit, delete (with confirmation),
  archive/restore, categories, selling price with an optional original price,
  stock quantity with low-stock alerts, availability, image upload to Supabase
  Storage, search, category filtering, sorting, pagination and statistics.
- Public merchant storefront at `/shop/<slug>`: logo, cover image, description,
  contact details, searchable catalogue with categories, product pages, a
  shopping cart with quantity controls and a checkout that places a real order.
- Order management at `/dashboard/orders`: overview tiles, searchable and
  filterable order list, order details with customer and items, status
  workflow, payment verification, audited order history and pre-filled WhatsApp
  messages to the customer.
- TUMA AI at `/dashboard/ai`: bilingual product copy, WhatsApp/social marketing
  drafts, real-data business insights and an assistant, with saved, editable
  history and aggregate-only data sent to the provider.
- SQL migrations for the complete schema, enums, constraints, indexes,
  `updated_at` triggers, profile provisioning and trial subscription
  provisioning.

## Getting started

```bash
npm install
copy .env.example .env.local   # then fill in Supabase values
npm run dev
```

`npm` on Windows PowerShell is `npm.cmd`.

## The merchant dashboard

`/dashboard` is a full workspace built on the merchant's own Supabase rows.

**Shell** — collapsible sidebar (persisted in `localStorage`), a sticky top bar
with workspace search, a notification centre (low stock + orders in progress)
and the merchant profile menu, plus a slide-over navigation drawer and a
bottom-safe layout for tablet and mobile.

**Metrics** (all derived from `orders`, `products` and `customers`, never
hardcoded): total revenue, total orders, pending orders, completed orders,
total products, low-stock products — each with a period-over-period delta.

**Charts**: sales performance (revenue + orders per bucket), revenue trends
(current vs previous period), order distribution (donut by status) and
best-selling products (ranked by revenue).

**Sections**: recent orders, top sellers, low-stock notifications, business
growth summary and quick actions.

**Data**: `src/lib/db/dashboard.ts` queries Supabase with the merchant's
session (RLS applies), supports 7/30/90-day, 12-month and custom date ranges
via `?range=` / `?from=&to=`, cross-entity search via `?q=`, and degrades to
per-section error states instead of failing the whole page. Loading skeletons
(`loading.tsx`), empty states and an error boundary with retry are included, and
every product or order change revalidates the dashboard layout so the analytics
refresh immediately.

## The product & inventory module

`/dashboard/products` is the merchant's catalogue, built on the same live rows.

**Create and edit** — one form for both, with name, SKU, description, category
(free text with suggestions), selling price, optional original price, optional
unit cost, stock quantity, low-stock alert level and availability. Images are
resized in the browser and uploaded to the `product-images` bucket.

**Delete** — a confirmation dialog, then a soft delete (`deleted_at`) so order
history stays intact; archived products can be restored.

**Catalogue** — card grid or table (`?view=`), search over name/SKU/description
(`?q=`), category filter, availability filters (all, available, archived, low
stock, deleted), sorting (newest, name, price, stock) and pagination.

**Indicators** — in stock / low stock / out of stock per product with a stock
meter, a discount badge when an original price is set, and a statistics row with
active products, catalogue value, low-stock count and average price.

**Server rules** — the business always comes from the session, every input is
re-validated with Zod, prices and stock can never be negative, uploaded files are
checked for type and size, and storage paths are built from the merchant's own
slug so nobody can write into another merchant's folder.

## The public storefront

Every merchant can publish a shop at `/shop/<slug>` (the slug is created with
the business and is unique). The shop shows the logo, the cover image, the
description and the contact details, a searchable catalogue with category
filters, a product page per product, a shopping cart with quantity controls
and a checkout form.

**Ordering** — the checkout collects the customer name, the phone number, the
delivery location and an optional note. The order is written by a
`SECURITY DEFINER` database function (`public.place_order`), so the whole
checkout happens in one transaction:

* the business has to be published, the products have to be active products of
  that business and the rows are locked while the order is written;
* every price comes from `products.price` — the browser never sends a price;
* the stock is checked and decremented safely, so two visitors cannot buy the
  same units;
* the order number is unique (`TUMA-YYYYMMDD-XXXXXX`) and the order items keep
  a price snapshot;
* the submission carries an idempotency token, so a repeated submission returns
  the order that was already created instead of placing a second one;
* the confirmation page is addressed by an unguessable token, so a visitor can
  only read the order they just placed.

**Security** — the storefront reads through an anonymous Supabase client, so
the database decides what is visible: a published business, its active products
and nothing else. `anon` holds column level grants, so no owner id, no cost, no
orders and no customers are reachable. The order tables stay closed; only the
two database functions are executable.

The merchant publishes and decorates the shop in **Dashboard → Storefront**
(`/dashboard/storefront`): publish toggle, logo link, cover link and the
WhatsApp number customers can reach them on. The same page builds a shareable
storefront message with the shop link and up to three active products; the
merchant copies it or opens WhatsApp with the text pre-filled.

## Order management

`/dashboard/orders` is the merchant side of the storefront orders.

**Overview** — four tiles for the selected period: total orders with the
completed and cancelled split, orders that still need action (pending with
confirmed/processing counts), payments to check (awaiting verification with
unpaid/rejected counts), and the paid revenue with the number of orders marked
paid. Every number comes from `orders` through the `get_order_stats` SQL
function, with a row-based fallback while the migration is pending.

**List** — search by order number (`?q=`), filter by status (`?status=`) and
payment status (`?payment=`), choose a preset date range or a custom one
(`?range=` or `?from=&to=`) and page through the results. Each row shows the
customer, item count, date, total, payment status and order status.

**Details** — `/dashboard/orders/[id]` shows the items with quantity, unit price
and line total, the order totals, the customer contact and delivery address,
the customer's note and the full order history.

**Status workflow** — Pending → Confirmed → Processing → Completed, with
Cancelled available from the active states. The server action re-validates the
transition, scopes the update by the session's business and writes the change
immediately. The historical `delivered` rows are presented as Completed.

**Payment verification** — Unpaid, Awaiting verification, Paid and Rejected. A
customer saying they paid only moves the order to *awaiting verification*.
`payment_verified_at` and `payment_verified_by` are written only when the
merchant picks Paid or Rejected and ticks the confirmation box; moving back to
Unpaid or Awaiting verification clears the stamp. The workspace never presents
an unchecked payment as verified.

**History** — a database trigger writes every insert, status change, payment
change and verification into `order_events` in the same transaction as the
order update, attributed to `auth.uid()`. Merchants can read their own history
and cannot insert entries by hand. Existing orders are backfilled with an
opening entry.

**WhatsApp** — the order page prepares two messages: an order confirmation
with every product, quantity, line total, the total, the delivery location, the
status, the public order link and the storefront link; and a payment update
whose wording only says *verified* when the merchant actually verified the
payment. Links are built with `encodeURIComponent`, so newlines, accents and
currency symbols survive. TUMA has no WhatsApp API integration: opening the
link pre-fills the message and the merchant presses Send. Nothing is sent
automatically and the UI says so.

**Access control** — the business is always resolved from the session; a
client-supplied business id is never trusted. Every read and write is scoped by
`business_id` and RLS. Another merchant cannot read the orders, the customers
or the audit history, and cannot update somebody else's order.

## TUMA AI

`/dashboard/ai` is the merchant's AI workspace. Every tool is bilingual
(English / French) and every result is saved to `ai_generations`, where the
merchant can copy, edit or delete it.

**Product copy** — name, category, features and target customers become a
professional title, an attractive description and 3–5 key selling points. An
optional picker fills the fields from an existing active product, and the
merchant edits everything before saving.

**Marketing assistant** — drafts WhatsApp promos, Facebook captions, Instagram
captions, launch announcements and promotional campaigns. The form collects the
channel, topic, product, benefits, offer, audience and preferred call to action;
the result is a headline, the ready-to-paste body, hashtags and one call to
action. It never invents a discount, price or delivery promise, and it never
claims that anything was sent.

**Business insights** — TUMA computes the snapshot first (paid revenue,
previous-period change, order mix, pending and awaiting-verification counts,
low-stock and out-of-stock products, catalogue value and best sellers), then
asks the model to explain it. The prompt may only use the supplied figures; if a
section could not be loaded the result must say so instead of treating it as
zero. The same snapshot is displayed beside the form so the merchant can check
every number.

**Assistant** — a short conversation about the business. It receives the same
aggregate snapshot and the last few messages, and can explain numbers, suggest
next steps or draft copy. It cannot send messages, change orders, verify
payments or update stock, and it is told to say so.

**Privacy** — only aggregate products, stock and order totals are sent to the AI
provider. Customer names, phone numbers, emails, addresses and notes are never
selected by the AI data layer and therefore never leave the workspace. API keys
stay on the server.

**Server design** — all calls go through `POST /api/ai/generate` (and
`PATCH`/`DELETE /api/ai/generations/[id]` for editing). The routes authenticate
with the Supabase session client, validate the body with Zod, enforce an hourly
limit (an in-process burst limiter plus a count of recent rows, default 20 per
hour), cap the request size, build the prompt from server-side data, store a
`pending` row, call an OpenAI-compatible chat-completions endpoint with a
timeout, validate the returned JSON against the generation's schema, then mark
the row `completed` or `failed`. No provider error body and no key ever reaches
the browser. The model is instructed to return a single JSON object; if a
compatible gateway rejects JSON mode the request is retried once without it.

**No key yet** — without `TUMA_AI_API_KEY` the page still renders, the forms stay
visible and the live snapshot is shown, but generation is disabled and a clear
banner explains which server variables to add. The API answers `503
not_configured`. No request is made and nothing is charged.

**Honesty rules** — the prompts forbid invented statistics, certifications,
warranties, discounts and results; forbid claiming that an action happened; and
forbid asking for customer contact details. Generated text is a draft, not a
verified fact, and the UI labels it that way.

## Environment variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Public API key; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Test/admin scripts; bypasses RLS, never ship to the browser |
| `NEXT_PUBLIC_SITE_URL` | browser + server | Canonical origin fallback for absolute links |
| `SUPABASE_DB_URL` | scripts only | Direct Postgres URI for applying migrations |
| `TUMA_AI_API_KEY` | server only | Provider key; without it TUMA AI is disabled |
| `TUMA_AI_BASE_URL` | server only | OpenAI-compatible base URL (default `https://api.openai.com/v1`) |
| `TUMA_AI_MODEL` | server only | Chat model (default `gpt-4o-mini`) |
| `TUMA_AI_MAX_OUTPUT_TOKENS` | server only | Output cap (default `1200`) |
| `TUMA_AI_TIMEOUT_MS` | server only | Provider timeout (default `45000`) |
| `TUMA_AI_RATE_LIMIT_PER_HOUR` | server only | Per-user hourly limit (default `20`) |

## Database migrations

The SQL files live in `supabase/migrations/` and are ordered:

1. `20261112090000_tuma_core_schema.sql` — enums, 8 tables, UUID keys,
   foreign keys, indexes, checks, `updated_at` triggers, profile and trial
   provisioning triggers.
2. `20261112090100_tuma_rls_policies.sql` — ownership helpers, RLS policies for
   every table, and least-privilege grants.
3. `20261113090000_tuma_product_media.sql` — product media (image gallery,
   original price), soft delete, catalogue indexes and the `product-images`
   Storage bucket with per-merchant policies.
4. `20261114090000_tuma_storefront.sql` — storefront settings (logo, cover,
   WhatsApp, publish switch), the public read policies and the two database
   functions that place an order and read a confirmation.
5. `20261115090000_tuma_order_management.sql` — the `completed`,
   `awaiting_verification` and `rejected` enum values, payment verification
   columns, `order_events` with RLS, the audit trigger, the backfill of
   existing orders and the `get_order_stats` aggregate.

Every migration is safe to run more than once: objects are dropped before they
are recreated, so pasting the bundle into a database that already carries part
of the schema no longer fails with `already exists`.

Check what is still missing at any time:

```bash
npm run db:status      # reads the project and prints applied / pending
```

Apply them with the Supabase CLI after linking a project:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Or execute all files in the Supabase SQL editor / with `psql`:

```bash
psql "$env:SUPABASE_DB_URL" -f supabase/migrations/20261112090000_tuma_core_schema.sql
psql "$env:SUPABASE_DB_URL" -f supabase/migrations/20261112090100_tuma_rls_policies.sql
psql "$env:SUPABASE_DB_URL" -f supabase/migrations/20261113090000_tuma_product_media.sql
psql "$env:SUPABASE_DB_URL" -f supabase/migrations/20261114090000_tuma_storefront.sql
psql "$env:SUPABASE_DB_URL" -f supabase/migrations/20261115090000_tuma_order_management.sql
```

`docs/apply-migrations.sql` contains every migration concatenated and is ready
to paste into the SQL editor.

Then verify `profiles`, `businesses`, `products`, `customers`, `orders`,
`order_items`, `ai_generations` and `business_subscriptions` exist and that RLS
is enabled.

## Supabase Auth settings

In **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (or your production origin).
- Redirect URLs: `http://localhost:3000/auth/callback**` and
  `http://localhost:3000/reset-password`.

Email confirmation uses `/auth/callback?next=/onboarding`; recovery links use
`/auth/callback?next=/reset-password`. The callback accepts both the PKCE
`code` flow and `token_hash` email templates.

## Security model

- The browser only ever receives the anon key. The service role key is never
  imported into client code.
- `auth.getUser()` validates the access token with Supabase on the server; the
  proxy redirects are optimistic, not the security boundary.
- Server Actions derive `owner_id` and `business_id` from the authenticated
  session. Client-supplied business ids are never trusted.
- RLS is enabled on all eight tables plus `order_events`. Child tables use
  `SECURITY DEFINER` ownership helpers so `business_id`/`order_id` cannot be
  spoofed.
- Order changes are audited by a trigger into `order_events`; merchants can
  read their own history but cannot insert or edit entries.
- Payment verification stamps `payment_verified_at` and `payment_verified_by`
  from the session only when the merchant verifies; the customer cannot mark a
  payment as verified.
- The `anon` role has no table grants; `authenticated` merchants can only reach
  rows their ownership helpers allow.

## Testing

Seven suites, no mocks anywhere:

```bash
npm run test:schema             # applies every migration to a real PostgreSQL
                                # engine (PGlite) and asserts schema, triggers,
                                # constraints and RLS — twice, to prove the
                                # migrations are re-runnable
npm run db:migrate              # applies the migrations to the hosted project
npm run test:supabase           # live auth + database + RLS suite
npm run test:products           # live product & inventory suite
npm run test:storefront:schema  # storefront SQL against a real PostgreSQL engine
npm run test:orders:schema      # order workflow, audit, stats and isolation
npm run test:storefront         # live customer journey: shop → cart → order
npm run test:ai                 # static TUMA AI privacy and contract checks
```

`scripts/test-supabase.mjs` creates two real users through the Supabase Auth
admin API, then verifies profile provisioning, business creation, product CRUD,
trial subscription provisioning, constraint enforcement and cross-user RLS
denial using each user's own access token. It refuses to run without real
credentials, reports database checks as *skipped* while the schema is missing,
and deletes both test users (cascading their data) when it finishes.

`scripts/test-products.mjs` covers the catalogue end to end: create, read,
edit, archive, negative-price and negative-stock rejection, and the three
cross-merchant RLS denials. Checks that need the product media migration
(original price, image column, soft delete, storage bucket and storage
permissions) are reported as *pending* until that migration is applied.

`scripts/verify-storefront.mjs` runs the storefront SQL against a real
PostgreSQL engine as the `anon` role: only a published business and its active
products are visible, the dashboard columns and the order tables are closed, an
order is priced and persisted with its price snapshot, the stock is
decremented, a replayed submission does not create a second order and a
cross-merchant product is refused.

`scripts/verify-orders.mjs` runs the order workflow against a real PostgreSQL
engine: the new statuses exist, an order insert and every status change are
audited with the actor, a payment claim stays *awaiting verification* with no
stamp, verifying a payment stamps the merchant and the time, the overview
aggregate only counts the merchant's own orders, another merchant can read and
write nothing, hand-written audit entries are refused, and re-applying the
migration creates no duplicate history.

`scripts/test-storefront.mjs` is the full customer journey against the hosted
project: it publishes a shop, fetches the storefront page over HTTP, places an
order as a visitor, reads the rows back and checks the inventory update. It
reports *pending* until the storefront migration is applied.

`scripts/verify-ai.mjs` is a static contract suite for the AI layer; it needs no
database, network or provider key. It proves the data layer never selects
customer identity, the provider key stays server-only, the generate route
authenticates and validates before it spends money, every generation is stored
as `pending` then `completed`/`failed`, edited content is validated against the
saved kind, prompts carry the honesty rules, stored prompts stay under the
database cap, and every history mutation is scoped by business and user.

`scripts/create-test-user.mjs <email> <password>` creates a confirmed test user
for manual and browser testing without sending a confirmation email.

The full implementation report — migrations, environment variables, policies
and test results — lives in [`docs/AUTH_AND_DATABASE_REPORT.md`](docs/AUTH_AND_DATABASE_REPORT.md).

#   T U M A  
 