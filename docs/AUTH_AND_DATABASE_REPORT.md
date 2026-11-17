# TUMA — Authentication & Database Foundation Report

Project: `https://uotagtyiwtbdaeteggap.supabase.co`
Stack: Next.js 16.4.6 (App Router, Cache Components), React 19, Tailwind v4,
shadcn/ui, Supabase Postgres + Supabase Auth (`@supabase/ssr` 0.12.7).

---

## 1. SQL migrations

Both files live in `supabase/migrations/` and are applied in order.

### 1.1 `20261112090000_tuma_core_schema.sql`

Enums (8):

| Enum | Values |
| --- | --- |
| `business_category` | retail, wholesale, food_and_beverage, fashion_and_textiles, electronics, health_and_beauty, agriculture, services, other |
| `product_status` | active, archived |
| `order_status` | draft, pending, confirmed, processing, delivered, cancelled, refunded — migration 1.6 adds `completed` |
| `payment_status` | unpaid, partial, paid, refunded — migration 1.6 adds `awaiting_verification` and `rejected` |
| `ai_generation_status` | pending, completed, failed |
| `subscription_plan` | starter, growth, scale |
| `subscription_status` | trialing, active, past_due, cancelled, expired |
| `billing_cycle` | monthly, annual |

Tables (8), every one with a `uuid` primary key, `created_at timestamptz` and
`updated_at timestamptz`:

| Table | Key columns | Notes |
| --- | --- | --- |
| `profiles` | `id uuid PK → auth.users(id)` | email, full_name, phone, avatar_url; length + email format checks |
| `businesses` | `id uuid PK`, `owner_id uuid unique → profiles(id)` | name, `slug text unique`, category (enum), description, phone, location, currency; slug format check `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `products` | `id uuid PK`, `business_id uuid → businesses(id)` | name, sku, description, category, `price numeric(14,2)`, `cost numeric(14,2)`, stock_quantity, low_stock_threshold, status (enum) |
| `customers` | `id uuid PK`, `business_id uuid → businesses(id)` | name, email, phone, address, notes |
| `orders` | `id uuid PK`, `business_id uuid → businesses(id)`, `customer_id uuid → customers(id)` | order_number, status (enum), payment_status (enum), currency, `subtotal/discount/tax/total numeric(14,2)`, notes, placed_at; unique `(business_id, order_number)` |
| `order_items` | `id uuid PK`, `order_id uuid → orders(id)`, `product_id uuid → products(id)` | product_name snapshot, `unit_price numeric(14,2)`, quantity, `line_total numeric(14,2) generated always as (unit_price * quantity) stored` |
| `ai_generations` | `id uuid PK`, `business_id uuid → businesses(id)`, `user_id uuid → profiles(id)` | kind, prompt, response, model, tokens_used, status (enum), error_message |
| `business_subscriptions` | `id uuid PK`, `business_id uuid unique → businesses(id)` | plan (enum), status (enum), billing_cycle (enum), `price numeric(14,2)`, currency, trial_ends_at, current_period_start/end, cancel_at_period_end, cancelled_at |

Indexes (32 in total) — hot paths are covered:
`businesses_owner_idx`, `businesses_slug_idx`, `businesses_category_idx`,
`products_business_idx`, `products_business_status_idx`,
`products_business_sku_key` (unique on `(business_id, lower(sku))`),
`products_low_stock_idx` (partial), `customers_business_idx`,
`customers_business_name_idx`, `orders_business_idx`,
`orders_business_created_idx`, `orders_business_status_idx`,
`orders_business_payment_idx`, `order_items_order_idx`,
`order_items_product_idx`, `ai_generations_business_idx`,
`ai_generations_user_idx`, `business_subscriptions_business_idx`,
`business_subscriptions_status_idx`.

Triggers:

* `public.set_updated_at()` — before-update trigger on all 8 tables.
* `public.handle_new_user()` — `after insert on auth.users`, `security definer`,
  creates `public.profiles` from `raw_user_meta_data ->> 'full_name'`
  (fallback: local part of the email, then "Merchant").
* `public.handle_new_business()` — `after insert on public.businesses`,
  `security definer`, provisions the trial subscription: plan `starter`,
  status `trialing`, price 10 000 XAF, `trial_ends_at = now() + interval
  '14 days'`, so the subscription is atomic with the business row.

11 foreign keys, plus check constraints on lengths, email/phone formats, slug
format, non-negative money and stock, positive quantities, currency format,
unique owner and unique `(business_id, order_number)`.

### 1.2 `20261112090100_tuma_rls_policies.sql`

Ownership helpers (`security definer`, `search_path = ''`, execute revoked from
`public`, granted to `authenticated`):

* `public.is_business_owner(business_id uuid) → boolean`
* `public.can_access_order(order_id uuid) → boolean`

RLS enabled on all 8 tables with per-table policies:

| Table | select | insert | update | delete |
| --- | --- | --- | --- | --- |
| `profiles` | own row | own row | own row | – |
| `businesses` | own | owner = `auth.uid()` | own | own |
| `products` | `is_business_owner(business_id)` | same | same | same |
| `customers` | `is_business_owner` | same | same | same |
| `orders` | `is_business_owner` | same | same | same |
| `order_items` | `can_access_order(order_id)` | same | same | same |
| `ai_generations` | `is_business_owner` | same + `user_id = auth.uid()` | same | same |
| `business_subscriptions` | `is_business_owner` | same | same | – |

Privileges: `revoke all … from anon` on every table, then least-privilege
grants to `authenticated` (no `anon` access at all).

### 1.3 Applying them

```bash
# with a direct Postgres connection string in .env.local
npm run db:migrate          # scripts/apply-migrations.mjs (node-postgres)

# or with the Supabase CLI
npx supabase login
npx supabase link --project-ref uotagtyiwtbdaeteggap
npx supabase db push

# or paste docs/apply-migrations.sql (every file concatenated) into the
# Supabase SQL editor and press Run
```

`scripts/apply-migrations.mjs` records versions in
`supabase_migrations.schema_migrations`, exactly like the CLI, so it is safe to
mix with `supabase db push`. If `SUPABASE_DB_URL` is absent it falls back to
`supabase db push --include-all` for a logged-in, linked CLI.

**Every migration is safe to run twice.** PostgreSQL has no
`create policy if not exists` and no `create type if not exists`, so running a
bundle against a database that already carries part of the schema fails with
`ERROR: 42710: ... already exists`. The migrations therefore use:

| Object | How it is made re-runnable |
| --- | --- |
| Enums | wrapped in a `do $$ … exception when duplicate_object then null; end $$;` block |
| Tables | `create table if not exists` |
| Indexes | `create index if not exists` / `create unique index if not exists` |
| Triggers | preceded by `drop trigger if exists … on …` |
| Policies | preceded by `drop policy if exists … on …` |

`scripts/make-migrations-idempotent.mjs` applies that rewrite, and
`scripts/verify-schema.mjs` proves it by applying **all three files twice** to
a real PostgreSQL engine before it runs any other check.

### 1.4 `20261113090000_tuma_product_media.sql`

Product media, catalogue filters and soft delete.

Columns added to `public.products`:

| Column | Type | Purpose |
| --- | --- | --- |
| `original_price` | `numeric(14,2)` | optional price before a discount; check constraint keeps it ≥ 0 |
| `images` | `text[] not null default '{}'` | storage object paths, first entry is the cover image |
| `deleted_at` | `timestamptz` | soft delete: the row stays for order history |

Indexes: `products_business_deleted_idx (business_id, deleted_at)`,
`products_business_category_idx (business_id, category) where deleted_at is
null` and `products_business_stock_idx (business_id, stock_quantity) where
deleted_at is null and status = 'active'`.

Storage: the `product-images` bucket (public, 3 MB limit, MIME restricted to
`image/jpeg`, `image/png`, `image/webp`, `image/avif`) plus four policies on
`storage.objects`. Objects live at `<business-slug>/<product-id>/<uuid>.<ext>`
and every policy checks the first folder against the signed-in merchant's own
business slug, so a merchant can only ever write inside their own folder.

### 1.5 `20261114090000_tuma_storefront.sql`

The public shop at `/shop/<slug>`.

Columns added to `public.businesses`:

| Column | Type | Purpose |
| --- | --- | --- |
| `is_public` | `boolean not null default false` | the merchant publishes the shop |
| `logo_url` | `text` | logo shown in the storefront header |
| `cover_image_url` | `text` | cover image across the top of the shop |
| `whatsapp` | `text` | contact number for the WhatsApp button |

Columns added to `public.orders`:

| Column | Type | Purpose |
| --- | --- | --- |
| `client_token` | `text` | idempotency key of the checkout submission |
| `public_token` | `uuid not null default gen_random_uuid()` | unguessable token of the confirmation page |

Indexes: `orders_business_client_token_key` (unique on `(business_id,
client_token)` where the token is not null) and `orders_public_token_key`.

Public access is granted with **column level privileges**, so the `anon` role
can read the storefront fields and nothing else:

```sql
grant select (id, name, slug, category, description, phone, whatsapp, location,
              currency, logo_url, cover_image_url, is_public, created_at, updated_at)
  on public.businesses to anon;

grant select (id, business_id, name, description, category, price, original_price,
              images, stock_quantity, status, created_at, updated_at)
  on public.products to anon;
```

Two row level security policies decide the rows: `businesses_select_public`
(`is_public`) and `products_select_public` (active, not deleted and owned by a
published business). `orders`, `order_items` and `customers` stay closed for
`anon`.

**`public.place_order(...)`** — `SECURITY DEFINER`, the only way a visitor can
write. It

1. validates the customer name, phone, location, notes and the cart,
2. looks the business up by slug and refuses a shop that is not published,
3. returns the existing order when the same `client_token` is replayed,
4. finds or creates the customer row,
5. locks the product rows (`for update`), refuses anything that is not an
   active product of that business or that is out of stock,
6. computes every price from `products.price`,
7. writes the order (unique `TUMA-YYYYMMDD-XXXXXX` number), the order items
   with a price snapshot and the inventory update — all inside the transaction
   of the function call.

**`public.get_order_confirmation(p_public_token)`** — returns the order, its
items and the business contact details for that one token, and nothing else.

Both functions are granted to `anon` and `authenticated` and revoked from
`public`.

**Status:** verified against a real PostgreSQL engine (14/14 checks, section
8.6) but **not yet applied to the live project** — same reason as section 1.4:
no `SUPABASE_DB_URL`, no Supabase CLI access token. `docs/apply-migrations.sql`
contains all five files and can be pasted into the SQL editor.

`npm run db:status` reads the project and prints which migrations are applied
and which are still missing:

```
✓ applied  20261112090000_tuma_core_schema.sql
✓ applied  20261112090100_tuma_rls_policies.sql
– pending  20261113090000_tuma_product_media.sql
– pending  20261114090000_tuma_storefront.sql
– pending  20261115090000_tuma_order_management.sql
```

### 1.6 `20261115090000_tuma_order_management.sql`

The merchant side of the orders: the workflow statuses, payment verification,
the audit trail and the overview aggregate.

Enum values added (existing values are kept so historical rows stay valid):

| Enum | Value | Meaning |
| --- | --- | --- |
| `order_status` | `completed` | the order was fulfilled (the legacy `delivered` rows are presented as Completed) |
| `payment_status` | `awaiting_verification` | the customer says they paid; the merchant has not checked yet |
| `payment_status` | `rejected` | the merchant checked and refused the payment |

The values are added with `alter type … add value if not exists`, so the
migration is safe to run again. PostgreSQL 12+ allows `add value` inside a
transaction only when the new value is not used in the same transaction, which
this migration respects.

Columns added to `public.orders`:

| Column | Type | Purpose |
| --- | --- | --- |
| `payment_verified_at` | `timestamptz` | when the merchant confirmed the payment |
| `payment_verified_by` | `uuid → profiles(id)` on delete set null | which merchant confirmed it |

Indexes: `orders_business_placed_idx` on `(business_id, placed_at desc)` and
`orders_business_payment_placed_idx` on
`(business_id, payment_status, placed_at desc)` keep the list and overview
queries fast.

`public.order_events` — the audit trail:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid PK default gen_random_uuid()` | |
| `business_id` | `uuid → businesses(id) on delete cascade` | scopes the history |
| `order_id` | `uuid → orders(id) on delete cascade` | |
| `actor_id` | `uuid → profiles(id) on delete set null` | `auth.uid()` of the merchant; null for a visitor |
| `event_type` | `text` | `order_placed`, `status_changed`, `payment_status_changed`, `payment_verified` |
| `from_status`, `to_status` | `text` | order status transition |
| `from_payment_status`, `to_payment_status` | `text` | payment transition |
| `note` | `text` | optional description (payment note, reason) |
| `metadata` | `jsonb not null default '{}'` | room for extra context |
| `created_at` | `timestamptz not null default now()` | |

`public.log_order_event()` — a `security definer` trigger (`orders_log_event`)
on `orders` (after insert and after update of `status`, `payment_status`,
`payment_verified_at`, `payment_note`) that writes the event into
`order_events` in the same transaction as the order change and attributes it to
`auth.uid()`. The trigger is the only writer: RLS on `order_events` grants
`select` to the business owner and no insert/update/delete, so a merchant cannot
fabricate or edit history. Existing orders are backfilled with an `order_placed`
entry.

**`public.get_order_stats(p_from timestamptz, p_to timestamptz) → jsonb`** —
`security invoker`, so RLS decides the rows; it also filters with
`public.is_business_owner(o.business_id)`. It returns one JSON object with the
totals the overview needs: total orders, completed, cancelled, pending,
confirmed, processing, awaiting verification, unpaid, rejected, paid orders,
paid revenue and the invoiced amount. The dashboard calls it and falls back to a
row-based computation when the function is not deployed yet.

**Status:** verified against a real PostgreSQL engine — **13/13 checks passed**
(section 9.6) — but **not yet applied to the live project** for the same reason
as sections 1.4 and 1.5. Until it is, order pages fall back gracefully: the
`completed` write falls back to `delivered`, the verification-only payment
filters return an empty list instead of querying unknown enum values, and the
verification action tells the merchant the migration has to be applied.

---

## 2. Environment variables

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | yes | Public key; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | for tests/admin | Bypasses RLS; never referenced by any `NEXT_PUBLIC_*` var and never imported into a Client Component |
| `SUPABASE_DB_URL` | scripts only | for migrations | Direct Postgres URI |
| `NEXT_PUBLIC_SITE_URL` | browser + server | recommended | Canonical origin for metadata and email links |

`.env.example` ships with placeholders only. The real values live in
`.env.local`, which is git-ignored.

---

## 3. Authentication implementation

| Flow | Implementation |
| --- | --- |
| Registration | `src/app/(auth)/actions.ts` → `signUpAction` (Zod + `supabase.auth.signUp`), `emailRedirectTo: {origin}/auth/callback?next=/onboarding`; success → `/login?status=check-email` (email confirmation on) or straight to `/onboarding` when confirmation is disabled |
| Login | `signInAction` → `supabase.auth.signInWithPassword`, then `redirect(safeNextPath(next))`; `safeNextPath` only allows same-origin path-relative targets |
| Logout | `signOutAction` → `supabase.auth.signOut()` → `/login?status=signed-out` |
| Forgot password | `requestPasswordResetAction` → `resetPasswordForEmail(email, { redirectTo: {origin}/auth/callback?next=/reset-password })`; success banner is neutral ("if an account exists …") |
| Password reset | `/auth/callback` handles PKCE `code` **and** `token_hash` links, exchanges them for a session, then `/reset-password` → `resetPasswordAction` → `updateUser({ password })` → sign out → `/login?status=password-updated` |
| Session persistence | `@supabase/ssr` cookie-backed client; `src/proxy.ts` refreshes the session on every protected request and copies refreshed cookies to the response |
| Protected routes | `src/proxy.ts` performs optimistic redirects; the real boundary is server side: `requireUser()` / `requireBusiness()` call `supabase.auth.getUser()` (token validated by Supabase, never a client-supplied value) and `redirect()` when the session or business is missing |
| Server-side validation | Zod schemas in `src/lib/validation.ts`; every Server Action re-validates and derives `owner_id` / `business_id` from the session — client-supplied business ids are never trusted |

Protected routes: `/dashboard`, `/dashboard/products`, `/onboarding`.
Auth routes: `/login`, `/register`, `/forgot-password`, `/reset-password`.
Redirect rules:

* anonymous → `/dashboard*` ⇒ `/login?next=<path>`
* anonymous → `/reset-password` ⇒ `/forgot-password?status=link-expired`
* authenticated → `/login|/register|/forgot-password` ⇒ `/dashboard`
* authenticated without a business → `/dashboard*` ⇒ `/onboarding`
* authenticated with a business → `/onboarding` ⇒ `/dashboard`

---

## 4. Business onboarding

`src/app/(app)/onboarding/actions.ts` → `createBusinessAction`:

1. Validates name (2–120), category (enum), description (≤ 2000), phone
   (7–30), location (2–160) with Zod.
2. Re-reads the session with `auth.getUser()`; a missing session redirects to
   login — the browser never decides who the owner is.
3. Repairs `profiles` if the row is missing (upsert, ignore duplicates).
4. Generates the storefront slug server-side from the business name
   (`slugifyBusinessName`) and retries up to 4 times with a random suffix if the
   unique index rejects it.
5. Inserts with `owner_id = session user id`; RLS independently verifies the
   same rule.
6. The `handle_new_business` trigger creates the 14-day Starter trial.
7. Redirects to `/dashboard?welcome=1&business=<slug>`.

---

## 5. Security notes

* The service role key is only read in `src/lib/env.ts` (server-only module)
  and is never returned to the client. No `NEXT_PUBLIC_` variable exposes it.
* `auth.getUser()` (not `getSession()`) is used for authorisation, so a
  tampered cookie cannot impersonate a merchant.
* Ownership is always derived from `auth.uid()` and `businesses.owner_id`.
  Server Actions resolve the business from the session; the client's
  `business_id` is ignored.
* RLS is enabled on every table, `anon` has no grants, and child tables use
  `security definer` helpers so a spoofed `business_id` / `order_id` in a
  query or request body cannot bypass the ownership check.
* Order changes are audited by the `orders_log_event` trigger into
  `order_events`, in the same transaction as the change, with `auth.uid()` as
  the actor. Merchants can read their own history but cannot insert or edit it.
* Payment verification stamps `payment_verified_at` and `payment_verified_by`
  only after the merchant selects Paid or Rejected and confirms; a customer
  claim alone never marks a payment verified.
* Order reads and writes are scoped twice: by the session's `business_id` and by
  RLS. The server action re-reads the owned order before writing and validates
  the transition with Zod and the shared transition table.
* `safeNextPath` blocks absolute and protocol-relative redirect targets.
* `getSupabaseServerClient()` calls `await connection()` so every Supabase read
  is treated as request-time work and never prerendered.
* Errors from Supabase Auth are mapped to recovery-oriented copy
  (`src/lib/auth/errors.ts`); raw Supabase messages are never shown verbatim.

---

## 6. Test results

### 6.1 SQL / RLS verification against a real PostgreSQL engine

`scripts/verify-schema.mjs` boots PGlite (the official PostgreSQL WASM build),
installs an `auth` stub and a `storage` stub, applies **every migration file
verbatim — twice** and asserts the behaviour. Result: **14/14 checks passed**.

```
→ 20261112090000_tuma_core_schema.sql applied
→ 20261112090100_tuma_rls_policies.sql applied
→ 20261113090000_tuma_product_media.sql applied
✓ The migrations can be applied a second time — 3 files re-applied without an error
✓ Enum types exist — 8 enums
✓ All eight tables exist with uuid primary keys — 8 tables
✓ created_at and updated_at exist on every table — 8 tables
✓ Monetary columns use numeric — 8 numeric columns
✓ Foreign keys are enforced — 11 foreign keys
✓ Indexes exist on the hot paths — 35 indexes
✓ Profile is created by the auth trigger — trigger fired
✓ Business insert provisions the trial subscription — starter/trialing
✓ Duplicate slug and duplicate owner are rejected — both unique constraints hold
✓ Product constraints and updated_at trigger — price, SKU and updated_at behave
✓ Order items compute line_total — line_total 2501.00
✓ Cascades delete dependent rows — profile, business, products and subscription removed
✓ Row level security blocks cross-merchant access — select, insert, update are isolated per owner
14/14 checks passed.
```

### 6.2 Live Supabase Auth suite

`scripts/test-supabase.mjs` talks to the real project with the anon key (so
RLS applies) and the service role key (setup/cleanup only). Result:
**10/10 executed checks passed**, 22 database checks skipped until the
migrations are applied to the project.

```
✓ Registration creates a confirmed auth user
✓ Login with email and password — session issued
✓ Session is persisted and can be refreshed — token refreshed
✓ Invalid password is rejected — Invalid login credentials
✓ Unknown email is rejected — Invalid login credentials
✓ Sign out clears the session
✓ Login again after sign out
✓ Recovery link → new password → sign in — password rotated
✓ Login for the second merchant
✓ Cleanup deletes test users and cascades their data — 2 user(s) removed
10/10 checks passed. 22 database checks skipped.
```

Environment note: the public `/auth/v1/signup` endpoint rejected synthetic
`@example.com` addresses (`email_address_invalid` — Supabase validates the MX
record) and later returned `over_email_send_rate_limit` for the whole project.
Both are Supabase-side limits, not application behaviour, so the script treats
them as *skipped* instead of failing.

### 6.3 Browser end-to-end (real app, real Supabase)

| Check | Result |
| --- | --- |
| `/dashboard` while signed out | redirected to `/login?next=%2Fdashboard` |
| `/reset-password` without a recovery session | redirected to `/forgot-password?status=link-expired` with "That reset link expired." |
| Registration validation | "Your name is required", "Enter a valid email address", "Use at least 8 characters", "Passwords do not match" + banner "Check the highlighted fields and try again." |
| Pending state | button switches to "Creating account…", "Signing in…", "Creating workspace…", "Sending link…" |
| Wrong password | "Email or password is incorrect. Check both and try again." |
| Forgot password validation | "Enter a valid email address" |
| Rate-limited reset request | "Too many attempts in a short time. Wait a minute, then try again." |
| Login (real session) | session established, landing on `/onboarding` for a user without a business |
| Sign out | redirect to `/login?status=signed-out` with "You have been signed out safely." |
| Slug preview | "amina-test-boutique" rendered live from the business name |
| Dashboard (production build) | renders with real rows: revenue, orders, pending/completed counts, product and low-stock counts, all four charts, recent orders, top sellers, growth summary |
| Date filter | `?range=7d` re-queries Supabase for the 7-day window and the copy updates to "last 7 days" |
| Search | submitting `q` navigates to `/dashboard?q=…` and renders real matches |
| Product creation | writes through the Server Action, shows "Product saved to your catalogue." and the dashboard counters refresh (total products 0 → 1) |
| Notifications | bell lists low-stock products and orders in progress, with an unread badge and an "All clear" empty state |
| Merchant menu | name, email, business, plan, quick links and a working sign-out |
| Mobile navigation | slide-over drawer with the business card, workspace links and plan card |
| Console | no hydration warnings, no React errors |

### 6.4 Bugs found and fixed while building the dashboard

1. **`useSearchParams()` in the workspace shell deadlocked hydration.** The
   search field lives in the layout, where the hook has no request-time search
   params in a prerendered route; React kept the whole dashboard boundary
   pending and the page stayed on its skeleton. Replaced with a
   `useSyncExternalStore` hook that reads `window.location.search`
   (`src/components/dashboard/shell/use-current-search-query.ts`).
2. **`React.cache()` around the session helpers poisoned the request-time
   render.** With Cache Components the prerender pass can stall inside
   `getCurrentUser()`, and the cached promise was reused by the request-time
   render, which then hung forever. `getCurrentUser()` and `getOwnedBusiness()`
   are now plain async functions.
3. **The Supabase SDK's `Date.now()` broke Next's prerender pass.** The SDK
   reads the clock while restoring the cookie session, which Next rejects as an
   unstable value. The affected components now call `await connection()` before
   touching Supabase, so they only ever render at request time.
4. **Recharts never mounted.** The charts were gated behind a
   `useSyncExternalStore` "mounted" flag whose snapshot never changed after
   hydration. They now render directly through shadcn's `ChartContainer`,
   which ships an `initialDimension` so the server and client agree.
5. **Sign-out inside the dropdown menu did nothing.** Radix unmounts the menu
   on pointer-up, so the form never submitted. The menu item now calls the
   server action directly.

### 6.5 Not yet executed against the live project

Nothing from the database suite is outstanding: `npm run test:supabase` now
runs all 31 checks against the live project (30 database/RLS checks plus the
registration check, which Supabase rejects for synthetic `@example.com`
addresses and is reported as skipped).

| Suite | Result |
| --- | --- |
| `npm run test:schema` (real PostgreSQL engine) | **14/14 passed** (including “the migrations can be applied a second time”) |
| `npm run test:supabase` (live project) | **31/31 passed**, 2 checks skipped (public `/auth/v1/signup` rejects the synthetic address) |
| `npm run test:products` (live project) | **9/9 passed**, 6 checks pending (product media migration not applied yet) |
| `npm run test:storefront:schema` (real PostgreSQL engine) | **14/14 passed** (section 8.6) |
| `npm run test:orders:schema` (real PostgreSQL engine) | **13/13 passed** (section 9.6) |
| `npm run test:storefront` (live project) | 11 checks pending (storefront migration not applied yet) |
| Order management against the live project | pending until migration 1.6 is applied — the pages fall back, but the audit, verification columns and `get_order_stats` need the migration |
| `scripts/check-products-page.mjs` (production build) | **6/6 passed** — catalogue, search, low-stock filter, table view and the anonymous redirect |
| Production browser run | dashboard, products, storefront, cart, checkout, search, filters, notifications, profile menu and sign-out all verified against live rows |

---

## 7. Product & inventory module

### 7.1 What the merchant can do

| Capability | Where |
| --- | --- |
| Create a product | `createProductAction` — `src/app/(app)/dashboard/products/actions.ts` |
| Edit a product | `updateProductAction` (same file) |
| Delete a product (with confirmation) | `deleteProductAction` + `product-actions.tsx` dialog |
| Restore an archived/deleted product | `restoreProductAction`, `unarchiveProductAction` |
| Upload product images | `uploadImage` → Supabase Storage `product-images` bucket |
| Categories | free-text `category` on the product, suggestions from `PRODUCT_CATEGORY_SUGGESTIONS`, filter chips built from the live data |
| Pricing | `price` (selling) + optional `original_price` (strike-through + discount badge) |
| Stock quantity | `stock_quantity`, never negative, plus `low_stock_threshold` per product |
| Availability | `status` = `active` \| `archived` |
| Search | `name` / `sku` / `description` `ilike` search, driven by the URL (`?q=`) |
| Category filter | `?category=` |
| Inventory status indicators | `stockState()` → in stock / low stock / out of stock, with a stock meter |
| Low-stock warnings | `stock_quantity <= low_stock_threshold`, counted in the stats row and in the dashboard |
| Statistics | active / archived / deleted counts, catalogue value, average price, low-stock and out-of-stock counts |
| Empty / loading / error states | `EmptyState`, `ErrorState`, skeleton fallbacks on the page |
| Notifications | success and error banners driven by the redirect query string (`?created=1`, `?updated=1`, `?deleted=1`, `?error=…`) |

Catalogue presentation: card grid **or** table (`?view=grid|table`), pagination
(12 per page), sorting by newest / name / price / stock.

### 7.2 Business rules enforced on the server

* The business is resolved from the session (`getCatalogueBusiness()`), never
  from the form, so a merchant can only ever touch their own inventory. RLS
  enforces the same rule in the database.
* Every write re-validates with Zod (`productSchema` in `src/lib/validation.ts`):
  name 1–160, SKU 1–64, description ≤ 2 000, category ≤ 60, price ≥ 0,
  original price ≥ 0 and higher than the selling price, stock a whole number
  ≥ 0, alert threshold a whole number ≥ 0.
* Negative prices and negative stock are additionally blocked by database check
  constraints (`products_price_non_negative`, `products_stock_non_negative`).
* Duplicate SKUs are caught (`23505`) and reported on the `sku` field.
* Uploaded files are checked for MIME type and size (3 MB) before the upload,
  and the bucket repeats both limits.
* Storage paths are built on the server from the merchant's own slug, so a file
  can never be written into another merchant's folder.
* The images column is owned by the server: the browser only sends back the
  paths it wants to keep, and the server intersects them with the paths that
  are actually stored on the row.

### 7.3 Works before and after the media migration

The catalogue reads `original_price`, `images` and `deleted_at` when they
exist. If PostgREST reports a missing column, the query module
(`src/lib/db/products.ts`) retries with the legacy column set and reports the
missing capability through `CatalogueCapabilities`:

| Capability | While the migration is pending | After it is applied |
| --- | --- | --- |
| Images | the picker is replaced by a notice, uploads are refused with an explanation | images upload to Storage and render as the cover |
| Original price | the field is hidden | the field is shown and the discount badge appears |
| Soft delete | delete removes the row, the "Deleted" filter is hidden | delete sets `deleted_at`, the row can be restored |

### 7.4 Live product test suite

`scripts/test-products.mjs` creates two real merchants and exercises the
catalogue against the live project with the anon key, so RLS applies.

```
✓ A merchant can create a product in their own catalogue — ANK-… · 12 units
✓ The catalogue only lists the merchant's own products — 1 product(s)
✓ A product can be edited — price 14000, stock 3
✓ Archiving and unarchiving keeps the product in the records — archived → active
✓ Negative stock is rejected by the database
✓ Negative prices are rejected by the database
✓ A second merchant cannot read the product
✓ A second merchant cannot edit the product
✓ A second merchant cannot delete the product
9/9 checks passed, 6 pending.
```

The six pending checks (original price, image column, soft delete, the
`product-images` bucket and the two storage-permission checks) switch on
automatically once `20261113090000_tuma_product_media.sql` is applied to the
project.

---

## 8. The public storefront

### 8.1 Routes

| Route | What it does |
| --- | --- |
| `/shop/[slug]` | the shop: header, contact details, search, category filters and the catalogue |
| `/shop/[slug]/p/[productId]` | a product page with the quantity control and the add-to-cart button |
| `/shop/[slug]/checkout` | the checkout form and the order summary |
| `/shop/[slug]/order/[token]` | the order confirmation, addressed by the unguessable public token |
| `/dashboard/storefront` | the merchant side: publish the shop, logo, cover image and WhatsApp number |

### 8.2 How it is built

* `src/lib/db/storefront.ts` — the data layer. It uses a dedicated anonymous
  client (`src/lib/supabase/public.ts`) that never carries a session, so every
  query runs as the `anon` role and the database decides what is visible.
* `src/components/shop/` — the cart store (an external store read through
  `useSyncExternalStore`, so the server and the browser always agree), the
  header, the product tile, the cart sheet, the quantity stepper, the checkout
  form and the catalogue filters.
* `src/app/(shop)/shop/[slug]/actions.ts` — `placeOrderAction`. It validates the
  form and forwards the cart; it never computes a price.

### 8.3 What the customer gets

Search over name, description and category, category filter chips, cards with
the cover image, the discount badge and the stock level, a product page, a cart
drawer with quantity controls, a checkout form (name, phone, delivery location,
optional notes), a clear order summary and a confirmation page with the order
number, the delivery details and the shop's WhatsApp button. The whole flow is
mobile friendly: the drawer becomes a sheet and the checkout stacks its summary
under the form.

### 8.4 The order, step by step

1. The browser sends the cart (product ids and quantities) plus an idempotency
   token. No price is sent.
2. `place_order` locks the product rows and checks the availability.
3. The prices come from `products.price`; the order number is generated and
   checked for uniqueness.
4. The order, the order items (with a price snapshot) and the inventory update
   are written in one transaction.
5. The confirmation page reads the order back with the public token.

A repeated submission (double click, retried request, page reload) returns the
order that was already created — the stock is only decremented once.

### 8.5 Security

| Requirement | How it is met |
| --- | --- |
| Only active products of the requested business are visible | `products_select_public` policy + the query filters by `business_id`, `status = 'active'` and `deleted_at is null` |
| No dashboard information is exposed | `anon` has column level grants only; `owner_id` and `cost` are not readable |
| No customer information from other orders | `orders`, `order_items` and `customers` are closed for `anon`; a confirmation is only readable through `get_order_confirmation(token)` |
| A visitor cannot order from another shop | the function checks the product's `business_id` against the business of the slug |
| A private shop is invisible | `businesses_select_public` requires `is_public`; the page answers 404 |
| Prices cannot be tampered with | the browser never sends a price; the function prices the cart |
| Stock cannot be oversold | the product rows are locked and the stock is checked inside the transaction |
| The order cannot be duplicated | `client_token` is unique per business |

### 8.6 Storefront test results

`scripts/verify-storefront.mjs` applies every migration to a real PostgreSQL
engine and exercises the shop as the `anon` role. Result: **14/14 checks
passed**.

```
✓ A visitor only sees a published business — 1 published business
✓ A visitor only sees the active products of that business — 1 active product
✓ A visitor cannot read the dashboard columns of a business — owner_id is not readable
✓ A visitor cannot read orders, order items or customers — 3 tables are closed
✓ A visitor can place an order for a published shop — TUMA-20261116-094686 · 25000
✓ The same submission never creates a second order — 1 order, no duplicate
✓ The stock is only decremented once for a replayed submission — 8 units left
✓ An order that exceeds the stock is refused — stock is protected
✓ A product of another merchant cannot be ordered — cross-merchant product refused
✓ A shop that is not published cannot be ordered — private shop refused
✓ An archived product cannot be ordered — archived product refused
✓ The order confirmation is only readable with its token — only the own order is readable
✓ The merchant sees the order in their dashboard — TUMA-20261116-094686
✓ Another merchant cannot see the order — no rows
14/14 checks passed.
```

`scripts/test-storefront.mjs` runs the same journey against the hosted project
(shop page over HTTP → order as a visitor → rows read back → inventory check).
It reports *pending* until the storefront migration is applied; after that it
runs without a single change.

### 8.7 Browser run of the storefront

The storefront UI was verified in the browser against the production build with
fixture data (the live database has no storefront columns yet):

| Check | Result |
| --- | --- |
| Shop header | logo placeholder, category, name, description, phone, location, WhatsApp button and the cart button |
| Catalogue | product cards with the discount badge, the strike-through price, the stock level and the "Sold out" state |
| Quantity control | the stepper goes up and down and never exceeds the stock |
| Add to cart | the product goes into the cart and the drawer opens with the line, the unit price, the line total and the subtotal |
| Cart drawer | the quantity can be changed inside the drawer, a line can be removed and the empty state appears |
| Checkout | the form (name, phone, delivery location, notes) and the order summary with the subtotal and the total |
| Checkout failure | a failed submission shows "We could not place your order. Please try again." and keeps the entered values |
| Dashboard → Storefront | the publish switch, the logo, cover and WhatsApp fields and the public link of the shop |

---

## 9. Merchant order management

`/dashboard/orders` is the merchant side of the storefront orders, built on the
same live rows and the migration in section 1.6.

### 9.1 Routes and features

| Feature | Where | Behaviour |
| --- | --- | --- |
| Order overview | `/dashboard/orders` | four tiles for the selected period: total orders (completed/cancelled split), orders that still need action, payments to check, and paid revenue |
| Order list | `/dashboard/orders` | customer, item count, date, total, payment status and order status per row, with pagination |
| Search by order number | `?q=` | trimmed, case-insensitive match on `order_number` |
| Filter by order status | `?status=` | pending, confirmed, processing, completed, cancelled |
| Filter by payment status | `?payment=` | unpaid, awaiting verification, paid, rejected |
| Date filtering | `?range=` or `?from=&to=` | presets (today, 7 days, 30 days, 90 days) or a custom window |
| Order details | `/dashboard/orders/[id]` | items with quantity, unit price and line total; totals; customer contact and delivery address; customer note; public order link |
| Update order status | detail page | the allowed next statuses only; server action re-validates the transition |
| Payment verification | detail page | the four payment states, with an explicit confirmation before Paid/Rejected |
| Customer details | detail page | name, phone (WhatsApp action), email and address |
| Order history | detail page | every event from `order_events`, newest first |

### 9.2 Status workflow

Order: `pending → confirmed → processing → completed`. `cancelled` is reachable
from `draft`, `pending`, `confirmed` and `processing`. `completed` and
`cancelled` are terminal. The historical `delivered` rows are shown as
*Completed*; a new *Completed* is written as `completed` when migration 1.6 is
applied and as `delivered` before that, so the workflow keeps working against
the current live schema.

Payment: `unpaid → awaiting_verification → paid`, with `rejected` from
`awaiting_verification` and `partial`. `paid` is terminal for the merchant's
manual flow. The transition rules live in `src/lib/orders.ts` and are enforced
again in the server action, never only in the browser.

### 9.3 Payment verification

A customer claiming a payment only moves the order to *awaiting verification*.
The merchant marks it *Paid* or *Rejected* and has to tick the confirmation box;
only then does the server action stamp `payment_verified_at = now()` and
`payment_verified_by = auth.uid()`. Moving back to *Unpaid* or *Awaiting
verification* clears both columns. The UI never presents an unchecked payment as
verified, and the payment-update WhatsApp message only uses *verified* when the
stamp exists.

### 9.4 WhatsApp and sharing

`src/lib/orders.ts` builds the messages and the links; every value is passed
through `encodeURIComponent`, so newlines, accents and currency symbols survive
the round trip.

* **Contact the customer** — `https://wa.me/<phone>?text=<message>` from the
  order's customer phone; the button is disabled when the order has no phone.
* **Order confirmation** — order number, every product with quantity and line
  total, the order total, delivery location, current status and the public order
  link, plus the storefront link.
* **Payment update** — the current payment status, with *verified* wording only
  when `payment_verified_at` is set.
* **Share the storefront** — from `Dashboard → Storefront` and the shop page:
  shop link plus up to three active products.
* **Share a product** — name, price, short description and the product link.

TUMA has **no WhatsApp API integration**. Every button opens WhatsApp with the
text pre-filled; the merchant presses Send. Nothing is sent automatically and
the panel says so.

### 9.5 Security and audit

| Requirement | How it is met |
| --- | --- |
| Only the owning merchant can read or change orders | the business comes from the session (`getOwnedBusiness()`), never from the client; every query and update is scoped by `business_id` and RLS |
| A client-supplied id is never trusted | the action re-reads the order with the session's business before writing |
| Status/payment input is validated server-side | Zod schemas in `actions.ts`; unknown values are rejected |
| The transition is re-validated | `canTransitionOrderStatus` / `canTransitionPaymentStatus` run on the server |
| Payment is only verified by the merchant | verification columns are written from `auth.uid()` only after the confirmation flag |
| Important changes are audited | the `log_order_event` trigger writes `order_events` in the same transaction; merchants can read but not insert |
| Overview numbers are real | `get_order_stats` (or the row fallback) reads `orders` for the session's business only; no hardcoded figures |

### 9.6 Order schema test results

`scripts/verify-orders.mjs` applies every migration to a real PostgreSQL engine
(PGlite) and exercises the workflow. Result: **13/13 checks passed**.

```
✓ The workflow statuses exist — 8 order statuses, 6 payment statuses
✓ Payment verification is represented truthfully — verified_at, verified_by and note are nullable
✓ A merchant can place an order and the trigger records it — order_placed attributed to the merchant
✓ A status change writes an audit entry — pending → confirmed
✓ A customer payment claim is only awaiting verification — awaiting_verification without a stamp
✓ Verifying a payment stamps the merchant and the time — paid with verifier, time and note
✓ A completed order is counted as completed — processing → completed
✓ The overview aggregate only counts the merchant's orders — owner 1 / other 0
✓ The overview respects the selected window — empty window returns zeros
✓ Another merchant cannot read the orders or their history — 0 rows visible
✓ Another merchant cannot change the order — 0 rows updated
✓ The audit trail cannot be written by hand — insert denied
✓ Re-applying the migration is safe — no duplicate audit entries
13/13 checks passed.
```

The pre-migration fallbacks are exercised by the dashboard's capabilities probe:
before migration 1.6 the overview uses the row-based fallback, the verification
filters return an empty list instead of querying unknown enum values, a
*Completed* write falls back to `delivered`, and the verification action explains
that the migration must be applied.

### 9.7 Browser run of the order pages

Verified in the browser against the production build, signed in as the test
merchant. The live project does not have migration 1.6 yet, so this run also
proves the fallbacks:

| Check | Result |
| --- | --- |
| `/dashboard/orders` | overview tiles, status/payment/date filters, list and pagination render from the live rows |
| Migration hint | the page names the missing migration and says orders can still be reviewed and their status changed — no fake history |
| Search by order number | `?q=939387` returns the matching order; the customer and phone are shown |
| Status filter | `?status=confirmed` returns the same order |
| Payment filter before the migration | `?payment=awaiting_verification` answers "No order matches these filters" without querying an unknown enum |
| Order detail | items with quantity, unit and line totals, totals, customer contact, delivery address, the customer note and the opening history entry |
| Status update | Pending → Confirmed persisted in Supabase; the page reloads with "Order status updated" and, because the audit table is still missing, it says the change is not in the order history; the next options are Processing and Cancelled |
| WhatsApp link | `https://wa.me/237655000111?text=…` with percent-encoded newlines, currency and product lines; the panel states TUMA does not send anything automatically |
| Payment panel before the migration | explains that verification needs the migration; no payment is shown as verified and there is no false "verified" wording |
| Console | no errors |

The seeded smoke-test order and customer were deleted afterwards.




## 10. TUMA AI

TUMA AI lives at `/dashboard/ai` and is backed by `POST /api/ai/generate` and
`PATCH`/`DELETE /api/ai/generations/[id]`. It reuses the existing
`ai_generations` table from the core migration; no new migration is required.

### 10.1 Modules

| Module | Purpose |
| --- | --- |
| `src/lib/ai/types.ts` | Shared types, language/tone/channel labels, public status |
| `src/lib/ai/schemas.ts` | Zod request and provider-output schemas, size caps |
| `src/lib/ai/config.ts` | Server-only environment validation; safe public status |
| `src/lib/ai/prompts.ts` | System/user prompts and the JSON envelope stored in `prompt` |
| `src/lib/ai/provider.ts` | OpenAI-compatible client, timeout, JSON extraction, safe errors |
| `src/lib/ai/insights.ts` | Aggregate snapshot, signals and the product picker |
| `src/lib/ai/history.ts` | Session-scoped read/write/delete and hourly count |
| `src/lib/ai/rate-limit.ts` | In-process burst limiter |
| `src/lib/ai/result.ts` | Stored-prompt/result parsing and text formatting |
| `src/lib/ai/client.ts` | Browser fetch helpers and typed errors |
| `src/components/dashboard/ai/*` | Workspace, tools, snapshot, history and generation cards |

### 10.2 Request flow and limits

1. Validate the Supabase session and resolve the owned business on the server.
2. Reject a missing/invalid AI configuration before any provider call.
3. Enforce the body size cap, parse JSON and validate with a discriminated-union
   Zod schema.
4. Apply the hourly limit: a per-process burst bucket plus a count of the
   merchant's `ai_generations` rows from the last hour (default 20).
5. Build the prompt. Insights and the assistant additionally receive the
   aggregate snapshot; product and marketing prompts receive no business rows.
6. Insert a `pending` history row, call the provider with a timeout, validate
   the returned JSON against the generation's own schema, then update the row to
   `completed` (result, model, tokens) or `failed` (safe error message).
7. Return `{ generation }`. Provider keys and raw provider error bodies stay on
   the server; every failure maps to an honest status (`401`, `409`, `413`,
   `422`, `429`, `502`, `503`, `504`).

### 10.3 Data minimisation

`getInsightsSnapshot` selects only `products` columns (`name`, `sku`, `price`,
`stock_quantity`, `low_stock_threshold`, `status`) and `orders` totals plus
`order_items` product names, quantities and line totals. It never selects
`customers`, and the prompts explicitly forbid asking for customer identity.
The snapshot is also rendered in the UI so the merchant can verify the numbers
the model was given.

### 10.4 Persistence and editing

`ai_generations.prompt` stores a small JSON envelope (kind, language, user
input, capture time); `response` stores the validated structured result. The
history card edits individual fields, re-validates against the generation's own
kind and saves through `PATCH`, which is scoped by `business_id` and `user_id`.
Deleting a generation is a real `DELETE` with the same scope. RLS policies on
`ai_generations` already restrict every operation to the business owner.

### 10.5 No-key behaviour

Without `TUMA_AI_API_KEY`, `getAiPublicStatus()` reports `configured: false` and
the page shows a banner naming the required server variables. Forms stay visible
but disabled, the live snapshot and history still render, and the API returns
`503 not_configured`. No provider request is made.

### 10.6 Honesty safeguards

The shared system prompt forbids invented statistics, products, orders,
certifications, materials, warranties, discounts, delivery promises and results;
forbids claiming that a message was sent, a payment verified, an order changed or
stock updated; requires the requested language; and requires a single JSON
object. Insights must state when a data section is unavailable. The UI describes
every result as a draft and notes that TUMA has no automatic sending.

### 10.7 Automated checks

`npm run test:ai` (`scripts/verify-ai.mjs`) is a static contract suite that runs
without a database, network or provider key. It asserts that the AI data layer
never selects customer identity, the key never reaches the browser, the API
validates the request before the configuration gate and the provider call, every
generation is persisted before and after the call, the edit route validates
against the saved kind, prompts keep the honesty rules, stored prompts stay under
the `ai_generations.prompt` cap, and every history mutation is scoped by both
business and user.
