-- TUMA full schema: paste into the Supabase SQL editor and run once.
-- Generated from supabase/migrations/*.sql - those files stay the source of truth.
-- Safe to run more than once: objects are dropped before they are recreated.

-- 20261112090000_tuma_core_schema.sql
-- ---------------------------------------------------------------------------
-- TUMA core schema
-- Enums, tables, constraints, indexes and updated_at triggers.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto" with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$
begin
  create type public.business_category as enum (
  'retail',
  'wholesale',
  'food_and_beverage',
  'fashion_and_textiles',
  'electronics',
  'health_and_beauty',
  'agriculture',
  'services',
  'other'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.product_status as enum ('active', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.order_status as enum (
  'draft',
  'pending',
  'confirmed',
  'processing',
  'delivered',
  'cancelled',
  'refunded'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payment_status as enum ('unpaid', 'partial', 'paid', 'refunded');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.ai_generation_status as enum ('pending', 'completed', 'failed');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.subscription_plan as enum ('starter', 'growth', 'scale');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.billing_cycle as enum ('monthly', 'annual');
exception
  when duplicate_object then null;
end
$$;

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at accurate on every write
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (
    char_length(btrim(full_name)) between 2 and 120
  ),
  constraint profiles_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint profiles_phone_length check (
    phone is null or char_length(btrim(phone)) between 7 and 30
  )
);

comment on table public.profiles is
  'Merchant profile created automatically for every auth.users row.';

-- ---------------------------------------------------------------------------
-- businesses (one owner = one business for the current milestone)
-- ---------------------------------------------------------------------------

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  category public.business_category not null,
  description text,
  phone text not null,
  location text not null,
  currency char(3) not null default 'XAF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_name_length check (
    char_length(btrim(name)) between 2 and 120
  ),
  constraint businesses_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 80
  ),
  constraint businesses_description_length check (
    description is null or char_length(description) <= 2000
  ),
  constraint businesses_phone_length check (
    char_length(btrim(phone)) between 7 and 30
  ),
  constraint businesses_location_length check (
    char_length(btrim(location)) between 2 and 160
  ),
  constraint businesses_currency_format check (currency ~ '^[A-Z]{3}$')
);

comment on table public.businesses is
  'Merchant-owned business. owner_id is the single source of ownership.';

create index if not exists businesses_owner_idx on public.businesses (owner_id);
create index if not exists businesses_slug_idx on public.businesses (slug);
create index if not exists businesses_category_idx on public.businesses (category);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  sku text not null,
  description text,
  category text,
  price numeric(14, 2) not null default 0,
  cost numeric(14, 2),
  original_price numeric(14, 2),
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 5,
  status public.product_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_length check (
    char_length(btrim(name)) between 1 and 160
  ),
  constraint products_sku_length check (
    char_length(btrim(sku)) between 1 and 64
  ),
  constraint products_price_non_negative check (price >= 0),
  constraint products_cost_non_negative check (cost is null or cost >= 0),
  constraint products_original_price_non_negative check (
    original_price is null or original_price >= 0
  ),
  constraint products_stock_non_negative check (stock_quantity >= 0),
  constraint products_threshold_non_negative check (low_stock_threshold >= 0)
);

create unique index if not exists products_business_sku_key
  on public.products (business_id, lower(sku));
create index if not exists products_business_idx on public.products (business_id);
create index if not exists products_business_status_idx on public.products (business_id, status);
create index if not exists products_low_stock_idx
  on public.products (business_id, stock_quantity)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_name_length check (
    char_length(btrim(name)) between 1 and 160
  ),
  constraint customers_email_format check (
    email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  constraint customers_phone_length check (
    phone is null or char_length(btrim(phone)) between 7 and 30
  )
);

create index if not exists customers_business_idx on public.customers (business_id);
create index if not exists customers_business_name_idx on public.customers (business_id, name);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  order_number text not null,
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  currency char(3) not null default 'XAF',
  subtotal numeric(14, 2) not null default 0,
  discount numeric(14, 2) not null default 0,
  tax numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  notes text,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_number_length check (
    char_length(btrim(order_number)) between 1 and 40
  ),
  constraint orders_subtotal_non_negative check (subtotal >= 0),
  constraint orders_discount_non_negative check (discount >= 0),
  constraint orders_tax_non_negative check (tax >= 0),
  constraint orders_total_non_negative check (total >= 0),
  constraint orders_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint orders_business_number_key unique (business_id, order_number)
);

create index if not exists orders_business_idx on public.orders (business_id);
create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_business_created_idx
  on public.orders (business_id, created_at desc);
create index if not exists orders_business_status_idx on public.orders (business_id, status);
create index if not exists orders_business_payment_idx
  on public.orders (business_id, payment_status);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price numeric(14, 2) not null,
  quantity integer not null,
  line_total numeric(14, 2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_items_name_length check (
    char_length(btrim(product_name)) between 1 and 160
  ),
  constraint order_items_unit_price_non_negative check (unit_price >= 0),
  constraint order_items_quantity_positive check (quantity > 0)
);

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- ai_generations
-- ---------------------------------------------------------------------------

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'insight',
  prompt text not null,
  response text,
  model text,
  tokens_used integer not null default 0,
  status public.ai_generation_status not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_generations_prompt_length check (
    char_length(btrim(prompt)) between 1 and 8000
  ),
  constraint ai_generations_tokens_non_negative check (tokens_used >= 0),
  constraint ai_generations_kind_length check (char_length(btrim(kind)) between 1 and 40)
);

create index if not exists ai_generations_business_idx
  on public.ai_generations (business_id, created_at desc);
create index if not exists ai_generations_user_idx on public.ai_generations (user_id);

-- ---------------------------------------------------------------------------
-- business_subscriptions
-- ---------------------------------------------------------------------------

create table if not exists public.business_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  plan public.subscription_plan not null default 'starter',
  status public.subscription_status not null default 'trialing',
  billing_cycle public.billing_cycle not null default 'monthly',
  price numeric(14, 2) not null default 0,
  currency char(3) not null default 'XAF',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_subscriptions_price_non_negative check (price >= 0),
  constraint business_subscriptions_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint business_subscriptions_period_order check (
    current_period_start is null
    or current_period_end is null
    or current_period_end > current_period_start
  )
);

create index if not exists business_subscriptions_business_idx
  on public.business_subscriptions (business_id);
create index if not exists business_subscriptions_status_idx
  on public.business_subscriptions (status);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists businesses_set_updated_at on public.businesses;

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists customers_set_updated_at on public.customers;

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists order_items_set_updated_at on public.order_items;

create trigger order_items_set_updated_at
  before update on public.order_items
  for each row execute function public.set_updated_at();

drop trigger if exists ai_generations_set_updated_at on public.ai_generations;

create trigger ai_generations_set_updated_at
  before update on public.ai_generations
  for each row execute function public.set_updated_at();

drop trigger if exists business_subscriptions_set_updated_at on public.business_subscriptions;

create trigger business_subscriptions_set_updated_at
  before update on public.business_subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Provisioning triggers
-- ---------------------------------------------------------------------------

-- Create a profile for every new auth user. Runs as the function owner so the
-- insert succeeds before the user has a session.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Merchant'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Every business starts on a 14-day Starter trial. Keeping this in the
-- database makes the subscription atomic with business creation.
create or replace function public.handle_new_business()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.business_subscriptions (
    business_id,
    plan,
    status,
    billing_cycle,
    price,
    currency,
    trial_ends_at,
    current_period_start,
    current_period_end
  )
  values (
    new.id,
    'starter',
    'trialing',
    'monthly',
    10000,
    new.currency,
    now() + interval '14 days',
    now(),
    now() + interval '14 days'
  );

  return new;
end;
$$;

drop trigger if exists on_business_created on public.businesses;

create trigger on_business_created
  after insert on public.businesses
  for each row execute function public.handle_new_business();


-- 20261112090100_tuma_rls_policies.sql
-- ---------------------------------------------------------------------------
-- TUMA row level security
--
-- Ownership is always derived from auth.uid() and businesses.owner_id. The
-- client never provides an owner id that is trusted. Child tables are gated by
-- a SECURITY DEFINER helper so checks cannot be bypassed by spoofing business
-- ids in a query or request body.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Ownership helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_business_owner(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = target_business_id
      and b.owner_id = auth.uid()
  );
$$;

create or replace function public.can_access_order(target_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.orders o
    join public.businesses b on b.id = o.business_id
    where o.id = target_order_id
      and b.owner_id = auth.uid()
  );
$$;

revoke all on function public.is_business_owner(uuid) from public;
revoke all on function public.can_access_order(uuid) from public;
grant execute on function public.is_business_owner(uuid) to authenticated;
grant execute on function public.can_access_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.ai_generations enable row level security;
alter table public.business_subscriptions enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_select_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------

drop policy if exists "businesses_select_own" on public.businesses;

create policy "businesses_select_own"
  on public.businesses for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "businesses_insert_own" on public.businesses;

create policy "businesses_insert_own"
  on public.businesses for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "businesses_update_own" on public.businesses;

create policy "businesses_update_own"
  on public.businesses for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "businesses_delete_own" on public.businesses;

create policy "businesses_delete_own"
  on public.businesses for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

drop policy if exists "products_select_own" on public.products;

create policy "products_select_own"
  on public.products for select
  to authenticated
  using (public.is_business_owner(business_id));

drop policy if exists "products_insert_own" on public.products;

create policy "products_insert_own"
  on public.products for insert
  to authenticated
  with check (public.is_business_owner(business_id));

drop policy if exists "products_update_own" on public.products;

create policy "products_update_own"
  on public.products for update
  to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

drop policy if exists "products_delete_own" on public.products;

create policy "products_delete_own"
  on public.products for delete
  to authenticated
  using (public.is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------

drop policy if exists "customers_select_own" on public.customers;

create policy "customers_select_own"
  on public.customers for select
  to authenticated
  using (public.is_business_owner(business_id));

drop policy if exists "customers_insert_own" on public.customers;

create policy "customers_insert_own"
  on public.customers for insert
  to authenticated
  with check (public.is_business_owner(business_id));

drop policy if exists "customers_update_own" on public.customers;

create policy "customers_update_own"
  on public.customers for update
  to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

drop policy if exists "customers_delete_own" on public.customers;

create policy "customers_delete_own"
  on public.customers for delete
  to authenticated
  using (public.is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------

drop policy if exists "orders_select_own" on public.orders;

create policy "orders_select_own"
  on public.orders for select
  to authenticated
  using (public.is_business_owner(business_id));

drop policy if exists "orders_insert_own" on public.orders;

create policy "orders_insert_own"
  on public.orders for insert
  to authenticated
  with check (public.is_business_owner(business_id));

drop policy if exists "orders_update_own" on public.orders;

create policy "orders_update_own"
  on public.orders for update
  to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

drop policy if exists "orders_delete_own" on public.orders;

create policy "orders_delete_own"
  on public.orders for delete
  to authenticated
  using (public.is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------

drop policy if exists "order_items_select_own" on public.order_items;

create policy "order_items_select_own"
  on public.order_items for select
  to authenticated
  using (public.can_access_order(order_id));

drop policy if exists "order_items_insert_own" on public.order_items;

create policy "order_items_insert_own"
  on public.order_items for insert
  to authenticated
  with check (public.can_access_order(order_id));

drop policy if exists "order_items_update_own" on public.order_items;

create policy "order_items_update_own"
  on public.order_items for update
  to authenticated
  using (public.can_access_order(order_id))
  with check (public.can_access_order(order_id));

drop policy if exists "order_items_delete_own" on public.order_items;

create policy "order_items_delete_own"
  on public.order_items for delete
  to authenticated
  using (public.can_access_order(order_id));

-- ---------------------------------------------------------------------------
-- ai_generations
-- ---------------------------------------------------------------------------

drop policy if exists "ai_generations_select_own" on public.ai_generations;

create policy "ai_generations_select_own"
  on public.ai_generations for select
  to authenticated
  using (public.is_business_owner(business_id));

drop policy if exists "ai_generations_insert_own" on public.ai_generations;

create policy "ai_generations_insert_own"
  on public.ai_generations for insert
  to authenticated
  with check (
    public.is_business_owner(business_id)
    and user_id = (select auth.uid())
  );

drop policy if exists "ai_generations_update_own" on public.ai_generations;

create policy "ai_generations_update_own"
  on public.ai_generations for update
  to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

drop policy if exists "ai_generations_delete_own" on public.ai_generations;

create policy "ai_generations_delete_own"
  on public.ai_generations for delete
  to authenticated
  using (public.is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- business_subscriptions
-- ---------------------------------------------------------------------------

drop policy if exists "business_subscriptions_select_own" on public.business_subscriptions;

create policy "business_subscriptions_select_own"
  on public.business_subscriptions for select
  to authenticated
  using (public.is_business_owner(business_id));

drop policy if exists "business_subscriptions_insert_own" on public.business_subscriptions;

create policy "business_subscriptions_insert_own"
  on public.business_subscriptions for insert
  to authenticated
  with check (public.is_business_owner(business_id));

drop policy if exists "business_subscriptions_update_own" on public.business_subscriptions;

create policy "business_subscriptions_update_own"
  on public.business_subscriptions for update
  to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Privileges
--
-- RLS only matters for roles that can reach the table. Grant the minimum to
-- authenticated merchants and keep the anon role out entirely.
-- ---------------------------------------------------------------------------

revoke all on public.profiles from anon;
revoke all on public.businesses from anon;
revoke all on public.products from anon;
revoke all on public.customers from anon;
revoke all on public.orders from anon;
revoke all on public.order_items from anon;
revoke all on public.ai_generations from anon;
revoke all on public.business_subscriptions from anon;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.businesses to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, insert, update, delete on public.ai_generations to authenticated;
grant select, insert, update on public.business_subscriptions to authenticated;


-- 20261113090000_tuma_product_media.sql
-- ---------------------------------------------------------------------------
-- TUMA product media, catalogue filters and soft delete
--
-- Adds the columns the catalogue needs (image gallery, soft delete) plus the
-- indexes that keep the list queries fast, and provisions the Supabase Storage
-- bucket used for product images with per-merchant policies.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists original_price numeric(14, 2),
  add column if not exists images text[] not null default '{}',
  add column if not exists deleted_at timestamptz;

comment on column public.products.original_price is
  'Optional price before a discount, shown as a strike-through price.';
comment on column public.products.images is
  'Storage object paths for the product images, relative to the product-images bucket. The first entry is the cover image.';
comment on column public.products.deleted_at is
  'Set when a merchant deletes a product. The row is kept so order history stays intact.';

-- Catalogue listing filters.
create index if not exists products_business_deleted_idx
  on public.products (business_id, deleted_at);
create index if not exists products_business_category_idx
  on public.products (business_id, category)
  where deleted_at is null;
create index if not exists products_business_stock_idx
  on public.products (business_id, stock_quantity)
  where deleted_at is null and status = 'active';

-- ---------------------------------------------------------------------------
-- Storage: product images
--
-- Objects are stored under "<business-slug>/<product-id>/<file>". The path
-- starts with the merchant's own slug, so the storage policies can check
-- ownership without trusting anything the browser sends.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_insert_own" on storage.objects;

create policy "product_images_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (
      select b.slug from public.businesses b where b.owner_id = auth.uid()
    )
  );

drop policy if exists "product_images_select_own" on storage.objects;

create policy "product_images_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'product-images'
    and (
      owner_id::text = auth.uid()::text
      or (storage.foldername(name))[1] = (
        select b.slug from public.businesses b where b.owner_id = auth.uid()
      )
    )
  );

drop policy if exists "product_images_update_own" on storage.objects;

create policy "product_images_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and owner_id::text = auth.uid()::text
  )
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (
      select b.slug from public.businesses b where b.owner_id = auth.uid()
    )
  );

drop policy if exists "product_images_delete_own" on storage.objects;

create policy "product_images_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and owner_id::text = auth.uid()::text
  );


-- 20261114090000_tuma_storefront.sql
-- ---------------------------------------------------------------------------
-- TUMA public storefront
--
-- Gives every merchant a public shop at /shop/<slug> and lets a visitor
-- place an order. Public visitors only ever see the business header and the
-- active products of a business that published its storefront.
--
-- The order is written by a SECURITY DEFINER function so the whole checkout
-- (price calculation, availability check, order row, order items and the
-- inventory update) happens inside one transaction with the product rows
-- locked. The browser never sends a price.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Merchant storefront details
-- ---------------------------------------------------------------------------

alter table public.businesses
  add column if not exists logo_url text,
  add column if not exists cover_image_url text,
  add column if not exists whatsapp text,
  add column if not exists is_public boolean not null default false;

comment on column public.businesses.is_public is
  'When true the business has a public storefront at /shop/<slug>.';
comment on column public.businesses.logo_url is
  'Public URL of the business logo shown in the storefront header.';
comment on column public.businesses.cover_image_url is
  'Public URL of the storefront cover image.';
comment on column public.businesses.whatsapp is
  'Contact number used by the WhatsApp button on the storefront.';

-- ---------------------------------------------------------------------------
-- Product columns the storefront renders
--
-- The product media migration adds the same columns; `if not exists` keeps
-- this migration safe to run on its own.
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists original_price numeric(14, 2),
  add column if not exists images text[] not null default '{}',
  add column if not exists deleted_at timestamptz;

-- ---------------------------------------------------------------------------
-- Orders: idempotency and a public confirmation token
-- ---------------------------------------------------------------------------

alter table public.orders
  add column if not exists client_token text,
  add column if not exists public_token uuid not null default gen_random_uuid();

comment on column public.orders.client_token is
  'Idempotency key sent by the checkout form. A repeated submission returns the order that was already created.';
comment on column public.orders.public_token is
  'Unguessable token used for the public order confirmation page.';

create unique index if not exists orders_business_client_token_key
  on public.orders (business_id, client_token)
  where client_token is not null;

create unique index if not exists orders_public_token_key
  on public.orders (public_token);

-- ---------------------------------------------------------------------------
-- Public read access
--
-- `anon` receives column level grants, so it can read the storefront fields
-- and nothing else: no owner id, no cost, no orders, no customers.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon;

grant select (
  id,
  name,
  slug,
  category,
  description,
  phone,
  whatsapp,
  location,
  currency,
  logo_url,
  cover_image_url,
  is_public,
  created_at,
  updated_at
) on public.businesses to anon;

grant select (
  id,
  business_id,
  name,
  description,
  category,
  price,
  original_price,
  images,
  stock_quantity,
  status,
  created_at,
  updated_at
) on public.products to anon;

drop policy if exists "businesses_select_public" on public.businesses;

create policy "businesses_select_public"
  on public.businesses for select
  to anon
  using (is_public);

drop policy if exists "products_select_public" on public.products;

create policy "products_select_public"
  on public.products for select
  to anon
  using (
    status = 'active'
    and deleted_at is null
    and exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.is_public
    )
  );

-- ---------------------------------------------------------------------------
-- Placing an order
--
-- place_order() is the only way a visitor can write to the database. It:
--   • looks the business up by slug and refuses a storefront that is not
--     published,
--   • returns the existing order when the same client token is replayed,
--   • locks the product rows and refuses anything that is not an active
--     product of that business or that is out of stock,
--   • computes every price from products.price,
--   • creates the order, the order items (with a price snapshot) and updates
--     the inventory,
--   • all inside the single transaction of the function call.
-- ---------------------------------------------------------------------------

create or replace function public.get_order_confirmation(p_public_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_business public.businesses%rowtype;
  v_items jsonb;
begin
  select o.* into v_order
  from public.orders o
  where o.public_token = p_public_token;

  if not found then
    return null;
  end if;

  select b.* into v_business
  from public.businesses b
  where b.id = v_order.business_id;

  select coalesce(
           jsonb_agg(
             jsonb_build_object(
               'product_name', i.product_name,
               'quantity', i.quantity,
               'unit_price', i.unit_price,
               'line_total', i.line_total
             )
             order by i.created_at, i.id
           ),
           '[]'::jsonb
         )
    into v_items
  from public.order_items i
  where i.order_id = v_order.id;

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'public_token', v_order.public_token,
    'status', v_order.status,
    'payment_status', v_order.payment_status,
    'currency', v_order.currency,
    'subtotal', v_order.subtotal,
    'discount', v_order.discount,
    'tax', v_order.tax,
    'total', v_order.total,
    'notes', v_order.notes,
    'customer_name', case
      when v_order.customer_id is null then null
      else (select c.name from public.customers c where c.id = v_order.customer_id)
    end,
    'customer_phone', (select c.phone from public.customers c where c.id = v_order.customer_id),
    'delivery_location', (select c.address from public.customers c where c.id = v_order.customer_id),
    'created_at', v_order.created_at,
    'business', jsonb_build_object(
      'name', v_business.name,
      'slug', v_business.slug,
      'phone', v_business.phone,
      'whatsapp', v_business.whatsapp,
      'location', v_business.location
    ),
    'items', v_items
  );
end;
$$;

create or replace function public.place_order(
  p_business_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_delivery_location text,
  p_items jsonb,
  p_notes text default null,
  p_client_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business public.businesses%rowtype;
  v_order public.orders%rowtype;
  v_customer_id uuid;
  v_product public.products%rowtype;
  v_item jsonb;
  v_line jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_subtotal numeric(14, 2) := 0;
  v_total numeric(14, 2) := 0;
  v_order_number text;
  v_token uuid;
  v_attempt integer;
  v_lines jsonb := '[]'::jsonb;
begin
  -- ---------------------------------------------------------------------
  -- Input
  -- ---------------------------------------------------------------------
  if p_business_slug is null or btrim(p_business_slug) = '' then
    raise exception 'storefront_not_found' using errcode = '22023';
  end if;

  if p_customer_name is null or char_length(btrim(p_customer_name)) < 2
     or char_length(btrim(p_customer_name)) > 160 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;

  if p_customer_phone is null or char_length(btrim(p_customer_phone)) < 7
     or char_length(btrim(p_customer_phone)) > 30 then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  if p_delivery_location is null or char_length(btrim(p_delivery_location)) < 2
     or char_length(btrim(p_delivery_location)) > 160 then
    raise exception 'invalid_location' using errcode = '22023';
  end if;

  if p_notes is not null and char_length(p_notes) > 1000 then
    raise exception 'invalid_notes' using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart' using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) > 50 then
    raise exception 'cart_too_large' using errcode = '22023';
  end if;

  -- ---------------------------------------------------------------------
  -- The storefront has to be published
  -- ---------------------------------------------------------------------
  select b.* into v_business
  from public.businesses b
  where b.slug = p_business_slug
    and b.is_public;

  if not found then
    raise exception 'storefront_not_found' using errcode = '22023';
  end if;

  -- ---------------------------------------------------------------------
  -- The same submission never creates a second order
  -- ---------------------------------------------------------------------
  if p_client_token is not null and btrim(p_client_token) <> '' then
    select o.* into v_order
    from public.orders o
    where o.business_id = v_business.id
      and o.client_token = btrim(p_client_token);

    if found then
      return public.get_order_confirmation(v_order.public_token);
    end if;
  end if;

  -- ---------------------------------------------------------------------
  -- The customer (reused when the phone number is already known)
  -- ---------------------------------------------------------------------
  select c.id into v_customer_id
  from public.customers c
  where c.business_id = v_business.id
    and c.phone = p_customer_phone
  order by c.created_at desc
  limit 1;

  if v_customer_id is null then
    insert into public.customers (business_id, name, phone, address)
    values (
      v_business.id,
      btrim(p_customer_name),
      btrim(p_customer_phone),
      btrim(p_delivery_location)
    )
    returning id into v_customer_id;
  else
    update public.customers
    set name = btrim(p_customer_name),
        address = btrim(p_delivery_location),
        updated_at = now()
    where id = v_customer_id;
  end if;

  -- ---------------------------------------------------------------------
  -- Availability and price calculation
  --
  -- The product rows are locked for the rest of the transaction, so two
  -- visitors cannot buy the same units at the same time.
  -- ---------------------------------------------------------------------
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_product_id := nullif(v_item ->> 'product_id', '')::uuid;
    v_quantity := coalesce(nullif(v_item ->> 'quantity', '')::integer, 0);

    if v_product_id is null or v_quantity <= 0 or v_quantity > 1000 then
      raise exception 'invalid_line' using errcode = '22023';
    end if;

    select p.* into v_product
    from public.products p
    where p.id = v_product_id
      and p.business_id = v_business.id
      and p.status = 'active'
      and p.deleted_at is null
    for update;

    if not found then
      raise exception 'product_unavailable' using errcode = '22023';
    end if;

    if v_product.stock_quantity < v_quantity then
      raise exception 'insufficient_stock' using errcode = '22023';
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
    v_total := v_total + (v_product.price * v_quantity);

    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'quantity', v_quantity,
      'unit_price', v_product.price,
      'line_total', v_product.price * v_quantity
    );
  end loop;

  -- ---------------------------------------------------------------------
  -- Order number
  -- ---------------------------------------------------------------------
  v_attempt := 0;

  loop
    v_attempt := v_attempt + 1;

    v_order_number :=
      'TUMA-' || to_char(now() at time zone 'utc', 'YYYYMMDD') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

    exit when not exists (
      select 1
      from public.orders o
      where o.business_id = v_business.id
        and o.order_number = v_order_number
    );

    exit when v_attempt >= 5;
  end loop;

  -- ---------------------------------------------------------------------
  -- The order, its items and the inventory
  -- ---------------------------------------------------------------------
  v_token := gen_random_uuid();

  insert into public.orders (
    business_id,
    customer_id,
    order_number,
    status,
    payment_status,
    currency,
    subtotal,
    discount,
    tax,
    total,
    notes,
    client_token,
    public_token
  )
  values (
    v_business.id,
    v_customer_id,
    v_order_number,
    'pending',
    'unpaid',
    v_business.currency,
    v_subtotal,
    0,
    0,
    v_total,
    nullif(btrim(coalesce(p_notes, '')), ''),
    nullif(btrim(coalesce(p_client_token, '')), ''),
    v_token
  )
  returning * into v_order;

  for v_line in select value from jsonb_array_elements(v_lines) loop
    v_product_id := (v_line ->> 'product_id')::uuid;
    v_quantity := (v_line ->> 'quantity')::integer;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      unit_price,
      quantity
    )
    values (
      v_order.id,
      v_product_id,
      v_line ->> 'product_name',
      (v_line ->> 'unit_price')::numeric,
      v_quantity
    );

    update public.products
    set stock_quantity = stock_quantity - v_quantity,
        updated_at = now()
    where id = v_product_id;
  end loop;

  return public.get_order_confirmation(v_token);
end;
$$;

revoke all on function public.place_order(text, text, text, text, jsonb, text, text) from public;
revoke all on function public.get_order_confirmation(uuid) from public;

grant execute on function public.place_order(text, text, text, text, jsonb, text, text)
  to anon, authenticated;
grant execute on function public.get_order_confirmation(uuid)
  to anon, authenticated;

-- The visitor may not read the order tables directly.
revoke all on public.orders from anon;
revoke all on public.order_items from anon;
revoke all on public.customers from anon;


-- 20261115090000_tuma_order_management.sql
-- ---------------------------------------------------------------------------
-- TUMA order management
--
-- Adds the statuses the merchant workspace uses, the payment verification
-- fields, the audit trail of every order change and the aggregate query behind
-- the order overview.
--
-- Everything is idempotent: re-running the migration is safe.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Statuses
--
-- The original schema shipped with `delivered`; the workspace speaks of
-- `completed`. Both are kept so historical rows stay readable, and the UI
-- presents them as one status.
-- ---------------------------------------------------------------------------

alter type public.order_status add value if not exists 'completed';

alter type public.payment_status add value if not exists 'awaiting_verification';
alter type public.payment_status add value if not exists 'rejected';

-- ---------------------------------------------------------------------------
-- Payment verification
--
-- `payment_verified_at` is only ever written when the merchant explicitly
-- verifies the payment. A payment is never presented as verified without it.
-- ---------------------------------------------------------------------------

alter table public.orders
  add column if not exists payment_verified_at timestamptz,
  add column if not exists payment_verified_by uuid
    references public.profiles (id) on delete set null,
  add column if not exists payment_note text;

comment on column public.orders.payment_verified_at is
  'When the merchant verified the payment. NULL means the payment is not verified, whatever the payment status says.';
comment on column public.orders.payment_verified_by is
  'The merchant who verified the payment.';
comment on column public.orders.payment_note is
  'Reference or note the merchant keeps about the payment (mobile money id, cash receipt, rejection reason).';

create index if not exists orders_business_placed_idx
  on public.orders (business_id, placed_at desc);

create index if not exists orders_business_payment_placed_idx
  on public.orders (business_id, payment_status, placed_at desc);

-- ---------------------------------------------------------------------------
-- Order history
--
-- One row per change. The trigger writes it in the same transaction as the
-- order update, so an order can never change without an audit entry.
-- ---------------------------------------------------------------------------

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  from_payment_status text,
  to_payment_status text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint order_events_type_length check (
    char_length(btrim(event_type)) between 1 and 60
  ),
  constraint order_events_note_length check (
    note is null or char_length(note) <= 1000
  )
);

create index if not exists order_events_order_idx
  on public.order_events (order_id, created_at);
create index if not exists order_events_business_idx
  on public.order_events (business_id, created_at desc);

alter table public.order_events enable row level security;

drop policy if exists "order_events_select_own" on public.order_events;

create policy "order_events_select_own"
  on public.order_events for select
  to authenticated
  using (public.is_business_owner(business_id));

revoke all on public.order_events from anon;
revoke all on public.order_events from public;
grant select on public.order_events to authenticated;

-- ---------------------------------------------------------------------------
-- Audit trigger
--
-- SECURITY DEFINER so the trigger can always write the audit row, whatever the
-- policy on `order_events` says. The actor is the session user, so the entry
-- records who made the change. Visitors placing a storefront order have no
-- session and therefore no actor.
-- ---------------------------------------------------------------------------

create or replace function public.log_order_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (
      business_id,
      order_id,
      actor_id,
      event_type,
      to_status,
      to_payment_status,
      note
    )
    values (
      new.business_id,
      new.id,
      v_actor,
      'order_placed',
      new.status::text,
      new.payment_status::text,
      null
    );

    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.order_events (
      business_id,
      order_id,
      actor_id,
      event_type,
      from_status,
      to_status,
      note
    )
    values (
      new.business_id,
      new.id,
      v_actor,
      'status_changed',
      old.status::text,
      new.status::text,
      null
    );
  end if;

  if new.payment_verified_at is distinct from old.payment_verified_at
     and new.payment_verified_at is not null then
    insert into public.order_events (
      business_id,
      order_id,
      actor_id,
      event_type,
      from_payment_status,
      to_payment_status,
      note
    )
    values (
      new.business_id,
      new.id,
      v_actor,
      'payment_verified',
      old.payment_status::text,
      new.payment_status::text,
      new.payment_note
    );
  elsif new.payment_status is distinct from old.payment_status then
    insert into public.order_events (
      business_id,
      order_id,
      actor_id,
      event_type,
      from_payment_status,
      to_payment_status,
      note
    )
    values (
      new.business_id,
      new.id,
      v_actor,
      'payment_status_changed',
      old.payment_status::text,
      new.payment_status::text,
      new.payment_note
    );
  end if;

  return new;
end;
$$;

drop trigger if exists orders_log_event on public.orders;

create trigger orders_log_event
  after insert or update of status, payment_status, payment_verified_at, payment_note
  on public.orders
  for each row
  execute function public.log_order_event();

-- Give the orders that already exist an opening entry.
insert into public.order_events (
  business_id,
  order_id,
  actor_id,
  event_type,
  to_status,
  to_payment_status,
  created_at
)
select
  o.business_id,
  o.id,
  null,
  'order_placed',
  o.status::text,
  o.payment_status::text,
  o.placed_at
from public.orders o
where not exists (
  select 1 from public.order_events e where e.order_id = o.id
);

-- ---------------------------------------------------------------------------
-- Order overview aggregate
--
-- One query for the tiles above the order list. Security invoker + the
-- ownership helper means a merchant only ever aggregates their own orders.
-- ---------------------------------------------------------------------------

create or replace function public.get_order_stats(
  p_from timestamptz,
  p_to timestamptz
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with scoped as (
    select o.status::text as status,
           o.payment_status::text as payment_status,
           o.total
    from public.orders o
    where public.is_business_owner(o.business_id)
      and o.placed_at >= p_from
      and o.placed_at <= p_to
  )
  select jsonb_build_object(
    'total', (select count(*) from scoped),
    'pending', (select count(*) from scoped where status = 'pending'),
    'confirmed', (select count(*) from scoped where status = 'confirmed'),
    'processing', (select count(*) from scoped where status = 'processing'),
    'completed',
      (select count(*) from scoped where status in ('completed', 'delivered')),
    'cancelled', (select count(*) from scoped where status = 'cancelled'),
    'unpaid', (select count(*) from scoped where payment_status = 'unpaid'),
    'awaitingVerification',
      (select count(*) from scoped where payment_status = 'awaiting_verification'),
    'paid', (select count(*) from scoped where payment_status = 'paid'),
    'rejected', (select count(*) from scoped where payment_status = 'rejected'),
    'paidRevenue',
      (select coalesce(sum(total), 0) from scoped where payment_status = 'paid'),
    'invoiced',
      (select coalesce(sum(total), 0) from scoped where status <> 'cancelled')
  );
$$;

revoke all on function public.get_order_stats(timestamptz, timestamptz) from public;
grant execute on function public.get_order_stats(timestamptz, timestamptz)
  to authenticated;


-- 20261116090000_tuma_platform_admin.sql
-- ---------------------------------------------------------------------------
-- TUMA platform administration
--
-- The Super Admin console is a separate surface from the merchant workspace.
-- Authorization is derived from `platform_admins`, which is keyed to
-- `profiles.id` and can only be written through the SECURITY DEFINER functions
-- in this file. Public registration never creates an admin row.
--
-- Roles:
--   super_admin  every capability, including admin role management and audit
--   support     support tickets, announcements, and read access to the platform
--   analyst     read-only platform monitoring and exports
--
-- Every sensitive mutation is recorded in `platform_audit_logs`.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Admin role enum and the admin directory
-- ---------------------------------------------------------------------------

do $$
begin
  create type public.platform_admin_role as enum (
    'super_admin',
    'support',
    'analyst'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  role public.platform_admin_role not null default 'analyst',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_admins_role check (
    role in ('super_admin', 'support', 'analyst')
  )
);

comment on table public.platform_admins is
  'Platform staff. Provisioned only by a super admin or the service-role bootstrap script.';

create index if not exists platform_admins_profile_idx
  on public.platform_admins (profile_id);
create index if not exists platform_admins_role_idx
  on public.platform_admins (role);

-- ---------------------------------------------------------------------------
-- Role helpers
--
-- SECURITY DEFINER so a policy can ask "is this user an admin?" without
-- exposing the whole directory. The function owner bypasses RLS on
-- platform_admins, which is exactly what an authorization check needs.
-- ---------------------------------------------------------------------------

create or replace function public.current_platform_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select a.role::text
  from public.platform_admins a
  where a.profile_id = auth.uid()
  limit 1
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins a where a.profile_id = auth.uid()
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins a
    where a.profile_id = auth.uid()
      and a.role = 'super_admin'
  );
$$;

revoke all on function public.current_platform_role() from public;
revoke all on function public.is_platform_admin() from public;
revoke all on function public.is_super_admin() from public;

grant execute on function public.current_platform_role() to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Platform audit log
--
-- Append-only. Authenticated roles can execute the logging function, but only
-- a super admin can read the table.
-- ---------------------------------------------------------------------------

create table if not exists public.platform_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text,
  entity_id text,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now(),
  constraint platform_audit_logs_action_length check (
    char_length(btrim(action)) between 1 and 120
  ),
  constraint platform_audit_logs_entity_type_length check (
    entity_type is null or char_length(btrim(entity_type)) between 1 and 80
  ),
  constraint platform_audit_logs_entity_id_length check (
    entity_id is null or char_length(btrim(entity_id)) between 1 and 200
  ),
  constraint platform_audit_logs_target_type_length check (
    target_type is null or char_length(btrim(target_type)) between 1 and 80
  ),
  constraint platform_audit_logs_target_id_length check (
    target_id is null or char_length(btrim(target_id)) between 1 and 200
  ),
  constraint platform_audit_logs_metadata_object check (
    jsonb_typeof(metadata) = 'object'
  )
);

comment on table public.platform_audit_logs is
  'Who did what, when. Written by SECURITY DEFINER functions inside the same transaction as the change.';

create index if not exists platform_audit_logs_created_idx
  on public.platform_audit_logs (created_at desc);
create index if not exists platform_audit_logs_actor_idx
  on public.platform_audit_logs (actor_id);
create index if not exists platform_audit_logs_entity_idx
  on public.platform_audit_logs (entity_type, entity_id);

alter table public.platform_audit_logs enable row level security;

drop policy if exists "platform_audit_logs_select_super_admin"
  on public.platform_audit_logs;

create policy "platform_audit_logs_select_super_admin"
  on public.platform_audit_logs for select
  to authenticated
  using (public.is_super_admin());

revoke all on public.platform_audit_logs from anon;
revoke all on public.platform_audit_logs from public;
grant select on public.platform_audit_logs to authenticated;

create or replace function public.log_platform_audit(
  p_action text,
  p_entity_type text default null,
  p_entity_id text default null,
  p_target_type text default null,
  p_target_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_ip_address text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin public.platform_admins%rowtype;
  v_actor_email text;
  v_id uuid;
begin
  select * into v_admin
  from public.platform_admins
  where profile_id = auth.uid();

  if not found then
    raise exception 'not_platform_admin' using errcode = '42501';
  end if;

  select email into v_actor_email
  from public.profiles
  where id = auth.uid();

  insert into public.platform_audit_logs (
    actor_id,
    actor_email,
    action,
    entity_type,
    entity_id,
    target_type,
    target_id,
    metadata,
    ip_address
  )
  values (
    auth.uid(),
    v_actor_email,
    btrim(p_action),
    nullif(btrim(coalesce(p_entity_type, '')), ''),
    nullif(btrim(coalesce(p_entity_id, '')), ''),
    nullif(btrim(coalesce(p_target_type, '')), ''),
    nullif(btrim(coalesce(p_target_id, '')), ''),
    coalesce(p_metadata, '{}'::jsonb),
    nullif(btrim(coalesce(p_ip_address, '')), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.log_platform_audit(
  text, text, text, text, text, jsonb, text
) from public;

grant execute on function public.log_platform_audit(
  text, text, text, text, text, jsonb, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Platform announcements
-- ---------------------------------------------------------------------------

create table if not exists public.platform_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  tone text not null default 'info',
  audience text not null default 'merchants',
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_announcements_title_length check (
    char_length(btrim(title)) between 2 and 160
  ),
  constraint platform_announcements_body_length check (
    char_length(btrim(body)) between 1 and 4000
  ),
  constraint platform_announcements_tone check (
    tone in ('info', 'success', 'warning', 'danger')
  ),
  constraint platform_announcements_audience check (
    audience in ('all', 'merchants')
  )
);

comment on table public.platform_announcements is
  'Platform-wide messages. Only published rows are visible to merchant sessions.';

create index if not exists platform_announcements_published_idx
  on public.platform_announcements (published, published_at desc);

alter table public.platform_announcements enable row level security;

drop policy if exists "platform_announcements_select_published"
  on public.platform_announcements;

create policy "platform_announcements_select_published"
  on public.platform_announcements for select
  to authenticated
  using (published);

drop policy if exists "platform_announcements_select_admin"
  on public.platform_announcements;

create policy "platform_announcements_select_admin"
  on public.platform_announcements for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists "platform_announcements_insert_admin"
  on public.platform_announcements;

create policy "platform_announcements_insert_admin"
  on public.platform_announcements for insert
  to authenticated
  with check (public.is_platform_admin());

drop policy if exists "platform_announcements_update_admin"
  on public.platform_announcements;

create policy "platform_announcements_update_admin"
  on public.platform_announcements for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "platform_announcements_delete_super_admin"
  on public.platform_announcements;

create policy "platform_announcements_delete_super_admin"
  on public.platform_announcements for delete
  to authenticated
  using (public.is_super_admin());

revoke all on public.platform_announcements from anon;
revoke all on public.platform_announcements from public;
grant select, insert, update, delete on public.platform_announcements
  to authenticated;

create or replace function public.create_platform_announcement(
  p_title text,
  p_body text,
  p_tone text default 'info',
  p_audience text default 'merchants',
  p_publish boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_role := public.current_platform_role();

  if v_role = 'analyst' then
    raise exception 'analysts_are_read_only' using errcode = '42501';
  end if;

  if p_title is null or char_length(btrim(p_title)) not between 2 and 160 then
    raise exception 'invalid_title' using errcode = '22023';
  end if;

  if p_body is null or char_length(btrim(p_body)) < 1
     or char_length(p_body) > 4000 then
    raise exception 'invalid_body' using errcode = '22023';
  end if;

  if p_tone not in ('info', 'success', 'warning', 'danger') then
    raise exception 'invalid_tone' using errcode = '22023';
  end if;

  if p_audience not in ('all', 'merchants') then
    raise exception 'invalid_audience' using errcode = '22023';
  end if;

  insert into public.platform_announcements (
    title,
    body,
    tone,
    audience,
    published,
    published_at,
    created_by
  )
  values (
    btrim(p_title),
    btrim(p_body),
    p_tone,
    p_audience,
    coalesce(p_publish, false),
    case when coalesce(p_publish, false) then now() else null end,
    auth.uid()
  )
  returning id into v_id;

  perform public.log_platform_audit(
    'announcement_created',
    'announcement',
    v_id::text,
    null,
    null,
    jsonb_build_object(
      'title', btrim(p_title),
      'tone', p_tone,
      'audience', p_audience,
      'published', coalesce(p_publish, false)
    )
  );

  return v_id;
end;
$$;

create or replace function public.update_platform_announcement(
  p_id uuid,
  p_title text,
  p_body text,
  p_tone text,
  p_audience text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_role := public.current_platform_role();

  if v_role = 'analyst' then
    raise exception 'analysts_are_read_only' using errcode = '42501';
  end if;

  if p_title is null or char_length(btrim(p_title)) not between 2 and 160 then
    raise exception 'invalid_title' using errcode = '22023';
  end if;

  if p_body is null or char_length(btrim(p_body)) < 1
     or char_length(p_body) > 4000 then
    raise exception 'invalid_body' using errcode = '22023';
  end if;

  if p_tone not in ('info', 'success', 'warning', 'danger') then
    raise exception 'invalid_tone' using errcode = '22023';
  end if;

  if p_audience not in ('all', 'merchants') then
    raise exception 'invalid_audience' using errcode = '22023';
  end if;

  update public.platform_announcements
  set title = btrim(p_title),
      body = btrim(p_body),
      tone = p_tone,
      audience = p_audience,
      updated_at = now()
  where id = p_id;

  if not found then
    raise exception 'announcement_not_found' using errcode = 'P0002';
  end if;

  perform public.log_platform_audit(
    'announcement_updated',
    'announcement',
    p_id::text,
    null,
    null,
    jsonb_build_object('title', btrim(p_title), 'tone', p_tone)
  );
end;
$$;

create or replace function public.set_platform_announcement_published(
  p_id uuid,
  p_published boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_role := public.current_platform_role();

  if v_role = 'analyst' then
    raise exception 'analysts_are_read_only' using errcode = '42501';
  end if;

  update public.platform_announcements
  set published = coalesce(p_published, false),
      published_at = case
        when coalesce(p_published, false) then
          coalesce(published_at, now())
        else null
      end,
      updated_at = now()
  where id = p_id;

  if not found then
    raise exception 'announcement_not_found' using errcode = 'P0002';
  end if;

  perform public.log_platform_audit(
    case when coalesce(p_published, false)
      then 'announcement_published'
      else 'announcement_unpublished'
    end,
    'announcement',
    p_id::text
  );
end;
$$;

create or replace function public.delete_platform_announcement(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  delete from public.platform_announcements where id = p_id;

  if not found then
    raise exception 'announcement_not_found' using errcode = 'P0002';
  end if;

  perform public.log_platform_audit(
    'announcement_deleted',
    'announcement',
    p_id::text
  );
end;
$$;

revoke all on function public.create_platform_announcement(
  text, text, text, text, boolean
) from public;
revoke all on function public.update_platform_announcement(
  uuid, text, text, text, text
) from public;
revoke all on function public.set_platform_announcement_published(uuid, boolean)
  from public;
revoke all on function public.delete_platform_announcement(uuid) from public;

grant execute on function public.create_platform_announcement(
  text, text, text, text, boolean
) to authenticated;
grant execute on function public.update_platform_announcement(
  uuid, text, text, text, text
) to authenticated;
grant execute on function public.set_platform_announcement_published(uuid, boolean)
  to authenticated;
grant execute on function public.delete_platform_announcement(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Platform settings
--
-- Only the keys in `platform_settings_public_keys()` are visible to ordinary
-- merchant sessions. Everything else is super-admin territory.
-- ---------------------------------------------------------------------------

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_settings_key_length check (
    char_length(btrim(key)) between 2 and 80
  ),
  constraint platform_settings_value_object check (
    jsonb_typeof(value) in ('object', 'array', 'string', 'number', 'boolean')
  )
);

comment on table public.platform_settings is
  'Platform configuration consumed by the application (registration, support contact, AI limits).';

alter table public.platform_settings enable row level security;

drop policy if exists "platform_settings_select_public"
  on public.platform_settings;

create policy "platform_settings_select_public"
  on public.platform_settings for select
  to authenticated
  using (
    key in (
      'platform_name',
      'support_email',
      'registration_open',
      'ai_hourly_limit',
      'default_currency',
      'maintenance_message'
    )
  );

drop policy if exists "platform_settings_select_admin"
  on public.platform_settings;

create policy "platform_settings_select_admin"
  on public.platform_settings for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists "platform_settings_insert_super_admin"
  on public.platform_settings;

create policy "platform_settings_insert_super_admin"
  on public.platform_settings for insert
  to authenticated
  with check (public.is_super_admin());

drop policy if exists "platform_settings_update_super_admin"
  on public.platform_settings;

create policy "platform_settings_update_super_admin"
  on public.platform_settings for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

revoke all on public.platform_settings from anon;
revoke all on public.platform_settings from public;
grant select, insert, update on public.platform_settings to authenticated;

insert into public.platform_settings (key, value, description)
values
  ('platform_name', '"TUMA"'::jsonb, 'Name shown across the platform.'),
  ('support_email', '""'::jsonb, 'Public support address. Empty means the platform team is reachable in the app.'),
  ('registration_open', 'true'::jsonb, 'When false, public registration is closed.'),
  ('ai_hourly_limit', '20'::jsonb, 'Default AI generations per business per hour.'),
  ('default_currency', '"XAF"'::jsonb, 'Default currency for new businesses.'),
  ('maintenance_message', '""'::jsonb, 'Optional banner shown to merchants during maintenance.')
on conflict (key) do nothing;

create or replace function public.get_public_platform_settings()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_object_agg(key, value),
    '{}'::jsonb
  )
  from public.platform_settings
  where key in (
    'platform_name',
    'support_email',
    'registration_open',
    'ai_hourly_limit',
    'default_currency',
    'maintenance_message'
  );
$$;

create or replace function public.get_platform_settings()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
  from public.platform_settings
  where public.is_platform_admin();
$$;

create or replace function public.set_platform_setting(
  p_key text,
  p_value jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_key is null
     or btrim(p_key) not in (
       'platform_name',
       'support_email',
       'registration_open',
       'ai_hourly_limit',
       'default_currency',
       'maintenance_message'
     ) then
    raise exception 'unknown_setting' using errcode = '22023';
  end if;

  if p_value is null then
    raise exception 'invalid_value' using errcode = '22023';
  end if;

  insert into public.platform_settings (key, value, updated_by)
  values (btrim(p_key), p_value, auth.uid())
  on conflict (key) do update
  set value = excluded.value,
      updated_by = excluded.updated_by,
      updated_at = now();

  perform public.log_platform_audit(
    'setting_updated',
    'setting',
    btrim(p_key),
    null,
    null,
    jsonb_build_object('value', p_value)
  );
end;
$$;

revoke all on function public.get_public_platform_settings() from public;
revoke all on function public.get_platform_settings() from public;
revoke all on function public.set_platform_setting(text, jsonb) from public;

grant execute on function public.get_public_platform_settings()
  to anon, authenticated;
grant execute on function public.get_platform_settings() to authenticated;
grant execute on function public.set_platform_setting(text, jsonb)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Plan prices
-- ---------------------------------------------------------------------------

create table if not exists public.platform_plan_prices (
  plan public.subscription_plan primary key,
  monthly_price numeric(14, 2) not null default 0,
  annual_price numeric(14, 2) not null default 0,
  currency char(3) not null default 'XAF',
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_plan_prices_monthly_non_negative check (monthly_price >= 0),
  constraint platform_plan_prices_annual_non_negative check (annual_price >= 0),
  constraint platform_plan_prices_currency_format check (currency ~ '^[A-Z]{3}$')
);

comment on table public.platform_plan_prices is
  'Catalogue prices per plan. annual_price is the monthly equivalent billed annually.';

alter table public.platform_plan_prices enable row level security;

drop policy if exists "platform_plan_prices_select_authenticated"
  on public.platform_plan_prices;

create policy "platform_plan_prices_select_authenticated"
  on public.platform_plan_prices for select
  to authenticated
  using (true);

drop policy if exists "platform_plan_prices_insert_super_admin"
  on public.platform_plan_prices;

create policy "platform_plan_prices_insert_super_admin"
  on public.platform_plan_prices for insert
  to authenticated
  with check (public.is_super_admin());

drop policy if exists "platform_plan_prices_update_super_admin"
  on public.platform_plan_prices;

create policy "platform_plan_prices_update_super_admin"
  on public.platform_plan_prices for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

revoke all on public.platform_plan_prices from anon;
revoke all on public.platform_plan_prices from public;
grant select, insert, update on public.platform_plan_prices to authenticated;

insert into public.platform_plan_prices (
  plan, monthly_price, annual_price, currency
)
values
  ('starter', 10000, 8000, 'XAF'),
  ('growth', 25000, 20000, 'XAF'),
  ('scale', 60000, 48000, 'XAF')
on conflict (plan) do nothing;

create or replace function public.get_platform_plan_prices()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'plan', p.plan::text,
        'monthlyPrice', p.monthly_price,
        'annualPrice', p.annual_price,
        'currency', p.currency
      )
      order by p.monthly_price
    ),
    '[]'::jsonb
  )
  from public.platform_plan_prices p;
$$;

create or replace function public.set_platform_plan_price(
  p_plan text,
  p_monthly_price numeric,
  p_annual_price numeric,
  p_currency text default 'XAF'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.subscription_plan;
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  begin
    v_plan := p_plan::public.subscription_plan;
  exception when invalid_text_representation then
    raise exception 'unknown_plan' using errcode = '22023';
  end;

  if p_monthly_price is null or p_monthly_price < 0
     or p_annual_price is null or p_annual_price < 0 then
    raise exception 'invalid_price' using errcode = '22023';
  end if;

  if p_currency is null or btrim(p_currency) !~ '^[A-Z]{3}$' then
    raise exception 'invalid_currency' using errcode = '22023';
  end if;

  insert into public.platform_plan_prices (
    plan, monthly_price, annual_price, currency, updated_by
  )
  values (v_plan, p_monthly_price, p_annual_price, btrim(p_currency), auth.uid())
  on conflict (plan) do update
  set monthly_price = excluded.monthly_price,
      annual_price = excluded.annual_price,
      currency = excluded.currency,
      updated_by = excluded.updated_by,
      updated_at = now();

  perform public.log_platform_audit(
    'plan_price_updated',
    'plan_price',
    v_plan::text,
    null,
    null,
    jsonb_build_object(
      'monthlyPrice', p_monthly_price,
      'annualPrice', p_annual_price,
      'currency', btrim(p_currency)
    )
  );
end;
$$;

revoke all on function public.get_platform_plan_prices() from public;
revoke all on function public.set_platform_plan_price(
  text, numeric, numeric, text
) from public;

grant execute on function public.get_platform_plan_prices() to authenticated;
grant execute on function public.set_platform_plan_price(
  text, numeric, numeric, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Support tickets
-- ---------------------------------------------------------------------------

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  category text not null default 'general',
  priority text not null default 'normal',
  status text not null default 'open',
  last_message_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_subject_length check (
    char_length(btrim(subject)) between 3 and 200
  ),
  constraint support_tickets_category check (
    category in (
      'general', 'orders', 'payments', 'storefront',
      'billing', 'technical', 'other'
    )
  ),
  constraint support_tickets_priority check (
    priority in ('low', 'normal', 'high', 'urgent')
  ),
  constraint support_tickets_status check (
    status in ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')
  )
);

comment on table public.support_tickets is
  'A merchant conversation with platform support. Ownership is enforced by businesses.owner_id.';

create index if not exists support_tickets_business_idx
  on public.support_tickets (business_id);
create index if not exists support_tickets_status_idx
  on public.support_tickets (status);
create index if not exists support_tickets_created_idx
  on public.support_tickets (created_at desc);
create index if not exists support_tickets_last_message_idx
  on public.support_tickets (last_message_at desc);

alter table public.support_tickets enable row level security;

drop policy if exists "support_tickets_select_owner" on public.support_tickets;

create policy "support_tickets_select_owner"
  on public.support_tickets for select
  to authenticated
  using (public.is_business_owner(business_id));

drop policy if exists "support_tickets_select_admin" on public.support_tickets;

create policy "support_tickets_select_admin"
  on public.support_tickets for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists "support_tickets_insert_owner" on public.support_tickets;

create policy "support_tickets_insert_owner"
  on public.support_tickets for insert
  to authenticated
  with check (
    public.is_business_owner(business_id)
    and profile_id = (select auth.uid())
  );

drop policy if exists "support_tickets_update_owner" on public.support_tickets;

create policy "support_tickets_update_owner"
  on public.support_tickets for update
  to authenticated
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

drop policy if exists "support_tickets_update_admin" on public.support_tickets;

create policy "support_tickets_update_admin"
  on public.support_tickets for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "support_tickets_delete_super_admin"
  on public.support_tickets;

create policy "support_tickets_delete_super_admin"
  on public.support_tickets for delete
  to authenticated
  using (public.is_super_admin());

revoke all on public.support_tickets from anon;
revoke all on public.support_tickets from public;
grant select, insert, update, delete on public.support_tickets
  to authenticated;

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_type text not null default 'merchant',
  body text not null,
  created_at timestamptz not null default now(),
  constraint support_ticket_messages_author_type check (
    author_type in ('merchant', 'admin', 'system')
  ),
  constraint support_ticket_messages_body_length check (
    char_length(btrim(body)) between 1 and 4000
  )
);

create index if not exists support_ticket_messages_ticket_idx
  on public.support_ticket_messages (ticket_id, created_at);

alter table public.support_ticket_messages enable row level security;

drop policy if exists "support_ticket_messages_select_reader"
  on public.support_ticket_messages;

create policy "support_ticket_messages_select_reader"
  on public.support_ticket_messages for select
  to authenticated
  using (
    exists (
      select 1
      from public.support_tickets t
      where t.id = ticket_id
        and (
          public.is_business_owner(t.business_id)
          or public.is_platform_admin()
        )
    )
  );

drop policy if exists "support_ticket_messages_insert_participant"
  on public.support_ticket_messages;

create policy "support_ticket_messages_insert_participant"
  on public.support_ticket_messages for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.support_tickets t
      where t.id = ticket_id
        and (
          public.is_business_owner(t.business_id)
          or public.is_platform_admin()
        )
    )
  );

revoke all on public.support_ticket_messages from anon;
revoke all on public.support_ticket_messages from public;
grant select, insert on public.support_ticket_messages to authenticated;

create or replace function public.create_support_ticket(
  p_business_id uuid,
  p_subject text,
  p_message text,
  p_category text default 'general',
  p_priority text default 'normal'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_owner boolean := public.is_business_owner(p_business_id);
  v_is_admin boolean := public.is_platform_admin();
  v_ticket_id uuid;
begin
  if not (v_is_owner or v_is_admin) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_subject is null or char_length(btrim(p_subject)) not between 3 and 200 then
    raise exception 'invalid_subject' using errcode = '22023';
  end if;

  if p_category not in (
    'general', 'orders', 'payments', 'storefront',
    'billing', 'technical', 'other'
  ) then
    raise exception 'invalid_category' using errcode = '22023';
  end if;

  if p_priority not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'invalid_priority' using errcode = '22023';
  end if;

  if p_message is null or char_length(btrim(p_message)) < 1
     or char_length(p_message) > 4000 then
    raise exception 'invalid_message' using errcode = '22023';
  end if;

  insert into public.support_tickets (
    business_id,
    profile_id,
    subject,
    category,
    priority,
    status,
    last_message_at
  )
  values (
    p_business_id,
    auth.uid(),
    btrim(p_subject),
    p_category,
    p_priority,
    'open',
    now()
  )
  returning id into v_ticket_id;

  insert into public.support_ticket_messages (
    ticket_id,
    author_id,
    author_type,
    body
  )
  values (
    v_ticket_id,
    auth.uid(),
    case when v_is_admin then 'admin' else 'merchant' end,
    btrim(p_message)
  );

  if public.is_platform_admin() then
    perform public.log_platform_audit(
      'support_ticket_created',
      'support_ticket',
      v_ticket_id::text,
      'business',
      p_business_id::text,
      jsonb_build_object('subject', btrim(p_subject), 'category', p_category)
    );
  end if;

  return v_ticket_id;
end;
$$;

create or replace function public.reply_support_ticket(
  p_ticket_id uuid,
  p_message text,
  p_status text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.support_tickets%rowtype;
  v_message_id uuid;
begin
  select * into v_ticket
  from public.support_tickets
  where id = p_ticket_id;

  if not found then
    raise exception 'ticket_not_found' using errcode = 'P0002';
  end if;

  if not (
    public.is_business_owner(v_ticket.business_id)
    or public.is_platform_admin()
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_message is null or char_length(btrim(p_message)) < 1
     or char_length(p_message) > 4000 then
    raise exception 'invalid_message' using errcode = '22023';
  end if;

  if p_status is not null
     and p_status not in (
       'open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'
     ) then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  insert into public.support_ticket_messages (
    ticket_id,
    author_id,
    author_type,
    body
  )
  values (
    p_ticket_id,
    auth.uid(),
    case when public.is_platform_admin() then 'admin' else 'merchant' end,
    btrim(p_message)
  )
  returning id into v_message_id;

  update public.support_tickets
  set last_message_at = now(),
      status = coalesce(p_status, status),
      resolved_at = case
        when coalesce(p_status, status) in ('resolved', 'closed')
          then coalesce(resolved_at, now())
        else resolved_at
      end,
      updated_at = now()
  where id = p_ticket_id;

  if public.is_platform_admin() then
    perform public.log_platform_audit(
      'support_ticket_replied',
      'support_ticket',
      p_ticket_id::text,
      null,
      null,
      jsonb_build_object(
        'messageId', v_message_id::text,
        'status', coalesce(p_status, v_ticket.status)
      )
    );
  end if;

  return v_message_id;
end;
$$;

create or replace function public.set_support_ticket_status(
  p_ticket_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.support_tickets%rowtype;
begin
  select * into v_ticket
  from public.support_tickets
  where id = p_ticket_id;

  if not found then
    raise exception 'ticket_not_found' using errcode = 'P0002';
  end if;

  if not (
    public.is_business_owner(v_ticket.business_id)
    or public.is_platform_admin()
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_status not in (
    'open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'
  ) then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  update public.support_tickets
  set status = p_status,
      resolved_at = case
        when p_status in ('resolved', 'closed')
          then coalesce(resolved_at, now())
        else resolved_at
      end,
      updated_at = now()
  where id = p_ticket_id;

  if public.is_platform_admin() then
    perform public.log_platform_audit(
      'support_ticket_status_changed',
      'support_ticket',
      p_ticket_id::text,
      null,
      null,
      jsonb_build_object('from', v_ticket.status, 'to', p_status)
    );
  end if;
end;
$$;

create or replace function public.delete_support_ticket(p_ticket_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.support_tickets%rowtype;
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_ticket
  from public.support_tickets
  where id = p_ticket_id;

  if not found then
    raise exception 'ticket_not_found' using errcode = 'P0002';
  end if;

  delete from public.support_tickets where id = p_ticket_id;

  perform public.log_platform_audit(
    'support_ticket_deleted',
    'support_ticket',
    p_ticket_id::text,
    'business',
    v_ticket.business_id::text
  );
end;
$$;

revoke all on function public.create_support_ticket(
  uuid, text, text, text, text
) from public;
revoke all on function public.reply_support_ticket(uuid, text, text) from public;
revoke all on function public.set_support_ticket_status(uuid, text) from public;
revoke all on function public.delete_support_ticket(uuid) from public;

grant execute on function public.create_support_ticket(
  uuid, text, text, text, text
) to authenticated;
grant execute on function public.reply_support_ticket(uuid, text, text)
  to authenticated;
grant execute on function public.set_support_ticket_status(uuid, text)
  to authenticated;
grant execute on function public.delete_support_ticket(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Admin role management
--
-- Only a super admin can grant, change or revoke platform staff. The last
-- super admin can never be demoted or removed.
-- ---------------------------------------------------------------------------

create or replace function public.grant_platform_admin(
  p_profile_id uuid,
  p_role text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_profile_id is null then
    raise exception 'invalid_profile' using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_profile_id) then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  if p_role not in ('super_admin', 'support', 'analyst') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;

  if auth.uid() = p_profile_id
     and p_role <> 'super_admin'
     and (select count(*) from public.platform_admins a
          where a.role = 'super_admin') <= 1 then
    raise exception 'last_super_admin' using errcode = '22023';
  end if;

  insert into public.platform_admins (profile_id, role, created_by)
  values (p_profile_id, p_role::public.platform_admin_role, auth.uid())
  on conflict (profile_id) do update
  set role = excluded.role,
      created_by = excluded.created_by,
      updated_at = now()
  returning id into v_id;

  perform public.log_platform_audit(
    'admin_granted',
    'platform_admin',
    v_id::text,
    'profile',
    p_profile_id::text,
    jsonb_build_object('role', p_role)
  );

  return v_id;
end;
$$;

create or replace function public.revoke_platform_admin(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select role::text into v_role
  from public.platform_admins
  where profile_id = p_profile_id;

  if not found then
    raise exception 'admin_not_found' using errcode = 'P0002';
  end if;

  if v_role = 'super_admin'
     and (select count(*) from public.platform_admins a
          where a.role = 'super_admin') <= 1 then
    raise exception 'last_super_admin' using errcode = '22023';
  end if;

  delete from public.platform_admins where profile_id = p_profile_id;

  perform public.log_platform_audit(
    'admin_revoked',
    'platform_admin',
    null,
    'profile',
    p_profile_id::text,
    jsonb_build_object('role', v_role)
  );
end;
$$;

revoke all on function public.grant_platform_admin(uuid, text) from public;
revoke all on function public.revoke_platform_admin(uuid) from public;

grant execute on function public.grant_platform_admin(uuid, text)
  to authenticated;
grant execute on function public.revoke_platform_admin(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Business suspension
--
-- A suspended business keeps its dashboard access but loses the public
-- storefront and the ability to receive new orders.
-- ---------------------------------------------------------------------------

alter table public.businesses
  add column if not exists admin_status text not null default 'active',
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists suspended_by uuid
    references public.profiles (id) on delete set null;

do $$
begin
  alter table public.businesses
    add constraint businesses_admin_status_check
    check (admin_status in ('active', 'suspended', 'pending_review'));
exception
  when duplicate_object then null;
end
$$;

comment on column public.businesses.admin_status is
  'Platform moderation state. active businesses keep the public storefront and can receive orders.';

create index if not exists businesses_admin_status_idx
  on public.businesses (admin_status);

create or replace function public.set_business_admin_status(
  p_business_id uuid,
  p_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_status not in ('active', 'suspended', 'pending_review') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  update public.businesses
  set admin_status = p_status,
      suspended_at = case when p_status = 'suspended' then now() else null end,
      suspended_reason = case
        when p_status = 'suspended'
          then nullif(btrim(coalesce(p_reason, '')), '')
        else null
      end,
      suspended_by = case
        when p_status = 'suspended' then auth.uid() else null
      end,
      updated_at = now()
  where id = p_business_id;

  if not found then
    raise exception 'business_not_found' using errcode = 'P0002';
  end if;

  perform public.log_platform_audit(
    'business_status_changed',
    'business',
    p_business_id::text,
    null,
    null,
    jsonb_build_object(
      'status', p_status,
      'reason', nullif(btrim(coalesce(p_reason, '')), '')
    )
  );
end;
$$;

revoke all on function public.set_business_admin_status(uuid, text, text)
  from public;
grant execute on function public.set_business_admin_status(uuid, text, text)
  to authenticated;

-- The public storefront disappears the moment a business is suspended.
drop policy if exists "businesses_select_public" on public.businesses;

create policy "businesses_select_public"
  on public.businesses for select
  to anon
  using (is_public and admin_status = 'active');

drop policy if exists "products_select_public" on public.products;

create policy "products_select_public"
  on public.products for select
  to anon
  using (
    status = 'active'
    and deleted_at is null
    and exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.is_public
        and b.admin_status = 'active'
    )
  );

-- New orders are refused for a suspended business, whatever the write path.
create or replace function public.block_suspended_business_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  select b.admin_status into v_status
  from public.businesses b
  where b.id = new.business_id;

  if v_status is distinct from 'active' then
    raise exception 'business_suspended' using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_block_suspended_business on public.orders;

create trigger orders_block_suspended_business
  before insert on public.orders
  for each row execute function public.block_suspended_business_order();

-- The storefront order function must agree with the public policy.
create or replace function public.place_order(
  p_business_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_delivery_location text,
  p_items jsonb,
  p_notes text default null,
  p_client_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business public.businesses%rowtype;
  v_order public.orders%rowtype;
  v_customer_id uuid;
  v_product public.products%rowtype;
  v_item jsonb;
  v_line jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_subtotal numeric(14, 2) := 0;
  v_total numeric(14, 2) := 0;
  v_order_number text;
  v_token uuid;
  v_attempt integer;
  v_lines jsonb := '[]'::jsonb;
begin
  if p_business_slug is null or btrim(p_business_slug) = '' then
    raise exception 'storefront_not_found' using errcode = '22023';
  end if;

  if p_customer_name is null or char_length(btrim(p_customer_name)) < 2
     or char_length(btrim(p_customer_name)) > 160 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;

  if p_customer_phone is null or char_length(btrim(p_customer_phone)) < 7
     or char_length(btrim(p_customer_phone)) > 30 then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  if p_delivery_location is null or char_length(btrim(p_delivery_location)) < 2
     or char_length(btrim(p_delivery_location)) > 160 then
    raise exception 'invalid_location' using errcode = '22023';
  end if;

  if p_notes is not null and char_length(p_notes) > 1000 then
    raise exception 'invalid_notes' using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart' using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) > 50 then
    raise exception 'cart_too_large' using errcode = '22023';
  end if;

  select b.* into v_business
  from public.businesses b
  where b.slug = p_business_slug
    and b.is_public
    and b.admin_status = 'active';

  if not found then
    raise exception 'storefront_not_found' using errcode = '22023';
  end if;

  if p_client_token is not null and btrim(p_client_token) <> '' then
    select o.* into v_order
    from public.orders o
    where o.business_id = v_business.id
      and o.client_token = btrim(p_client_token);

    if found then
      return public.get_order_confirmation(v_order.public_token);
    end if;
  end if;

  select c.id into v_customer_id
  from public.customers c
  where c.business_id = v_business.id
    and c.phone = p_customer_phone
  order by c.created_at desc
  limit 1;

  if v_customer_id is null then
    insert into public.customers (business_id, name, phone, address)
    values (
      v_business.id,
      btrim(p_customer_name),
      btrim(p_customer_phone),
      btrim(p_delivery_location)
    )
    returning id into v_customer_id;
  else
    update public.customers
    set name = btrim(p_customer_name),
        address = btrim(p_delivery_location),
        updated_at = now()
    where id = v_customer_id;
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_product_id := nullif(v_item ->> 'product_id', '')::uuid;
    v_quantity := coalesce(nullif(v_item ->> 'quantity', '')::integer, 0);

    if v_product_id is null or v_quantity <= 0 or v_quantity > 1000 then
      raise exception 'invalid_line' using errcode = '22023';
    end if;

    select p.* into v_product
    from public.products p
    where p.id = v_product_id
      and p.business_id = v_business.id
      and p.status = 'active'
      and p.deleted_at is null
    for update;

    if not found then
      raise exception 'product_unavailable' using errcode = '22023';
    end if;

    if v_product.stock_quantity < v_quantity then
      raise exception 'insufficient_stock' using errcode = '22023';
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
    v_total := v_total + (v_product.price * v_quantity);

    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'quantity', v_quantity,
      'unit_price', v_product.price,
      'line_total', v_product.price * v_quantity
    );
  end loop;

  v_attempt := 0;

  loop
    v_attempt := v_attempt + 1;

    v_order_number :=
      'TUMA-' || to_char(now() at time zone 'utc', 'YYYYMMDD') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

    exit when not exists (
      select 1
      from public.orders o
      where o.business_id = v_business.id
        and o.order_number = v_order_number
    );

    exit when v_attempt >= 5;
  end loop;

  v_token := gen_random_uuid();

  insert into public.orders (
    business_id,
    customer_id,
    order_number,
    status,
    payment_status,
    currency,
    subtotal,
    discount,
    tax,
    total,
    notes,
    client_token,
    public_token
  )
  values (
    v_business.id,
    v_customer_id,
    v_order_number,
    'pending',
    'unpaid',
    v_business.currency,
    v_subtotal,
    0,
    0,
    v_total,
    nullif(btrim(coalesce(p_notes, '')), ''),
    nullif(btrim(coalesce(p_client_token, '')), ''),
    v_token
  )
  returning * into v_order;

  for v_line in select value from jsonb_array_elements(v_lines) loop
    v_product_id := (v_line ->> 'product_id')::uuid;
    v_quantity := (v_line ->> 'quantity')::integer;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      unit_price,
      quantity
    )
    values (
      v_order.id,
      v_product_id,
      v_line ->> 'product_name',
      (v_line ->> 'unit_price')::numeric,
      v_quantity
    );

    update public.products
    set stock_quantity = stock_quantity - v_quantity,
        updated_at = now()
    where id = v_product_id;
  end loop;

  return public.get_order_confirmation(v_token);
end;
$$;

revoke all on function public.place_order(text, text, text, text, jsonb, text, text)
  from public;
grant execute on function public.place_order(text, text, text, text, jsonb, text, text)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin read policies on the merchant tables
--
-- These are additive: a merchant still only sees their own rows, while a
-- platform admin sees the platform. Super-admin-only tables (profiles,
-- settings, audit) stay locked to the directory.
-- ---------------------------------------------------------------------------

drop policy if exists "businesses_select_admin" on public.businesses;

create policy "businesses_select_admin"
  on public.businesses for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists "businesses_update_super_admin" on public.businesses;

create policy "businesses_update_super_admin"
  on public.businesses for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "products_select_admin" on public.products;

create policy "products_select_admin"
  on public.products for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists "customers_select_admin" on public.customers;

create policy "customers_select_admin"
  on public.customers for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists "orders_select_admin" on public.orders;

create policy "orders_select_admin"
  on public.orders for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists "order_items_select_admin" on public.order_items;

create policy "order_items_select_admin"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_id
        and public.is_platform_admin()
    )
  );

drop policy if exists "ai_generations_select_admin" on public.ai_generations;

create policy "ai_generations_select_admin"
  on public.ai_generations for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists "business_subscriptions_select_admin"
  on public.business_subscriptions;

create policy "business_subscriptions_select_admin"
  on public.business_subscriptions for select
  to authenticated
  using (public.is_platform_admin());

drop policy if exists "business_subscriptions_update_super_admin"
  on public.business_subscriptions;

create policy "business_subscriptions_update_super_admin"
  on public.business_subscriptions for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "order_events_select_admin" on public.order_events;

create policy "order_events_select_admin"
  on public.order_events for select
  to authenticated
  using (public.is_platform_admin());

-- The user directory is super-admin only.
drop policy if exists "profiles_select_admin" on public.profiles;

create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.is_super_admin());

drop policy if exists "platform_admins_select_own" on public.platform_admins;

create policy "platform_admins_select_own"
  on public.platform_admins for select
  to authenticated
  using ((select auth.uid()) = profile_id);

drop policy if exists "platform_admins_select_super_admin"
  on public.platform_admins;

create policy "platform_admins_select_super_admin"
  on public.platform_admins for select
  to authenticated
  using (public.is_super_admin());

revoke all on public.platform_admins from anon;
revoke all on public.platform_admins from public;
grant select on public.platform_admins to authenticated;

-- ---------------------------------------------------------------------------
-- Platform aggregates
-- ---------------------------------------------------------------------------

create or replace function public.get_platform_overview(
  p_from timestamptz,
  p_to timestamptz
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_previous_from timestamptz;
  v_previous_to timestamptz;
  v_result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_previous_to := p_from - interval '1 microsecond';
  v_previous_from := p_from - (p_to - p_from);

  select jsonb_build_object(
    'merchants', (select count(*) from public.businesses),
    'activeMerchants',
      (select count(*) from public.businesses where admin_status = 'active'),
    'suspendedMerchants',
      (select count(*) from public.businesses where admin_status = 'suspended'),
    'users', (select count(*) from public.profiles),
    'products',
      (select count(*) from public.products where deleted_at is null),
    'activeProducts',
      (select count(*) from public.products
       where deleted_at is null and status = 'active'),
    'orders', (
      select count(*) from public.orders
      where placed_at >= p_from and placed_at <= p_to
    ),
    'previousOrders', (
      select count(*) from public.orders
      where placed_at >= v_previous_from and placed_at < p_from
    ),
    'revenue', (
      select coalesce(sum(total), 0) from public.orders
      where placed_at >= p_from and placed_at <= p_to
        and payment_status = 'paid'
    ),
    'previousRevenue', (
      select coalesce(sum(total), 0) from public.orders
      where placed_at >= v_previous_from and placed_at < p_from
        and payment_status = 'paid'
    ),
    'invoiced', (
      select coalesce(sum(total), 0) from public.orders
      where placed_at >= p_from and placed_at <= p_to
        and status <> 'cancelled'
    ),
    'averageOrderValue', (
      select case
        when count(*) = 0 then 0
        else coalesce(sum(total), 0) / count(*)
      end
      from public.orders
      where placed_at >= p_from and placed_at <= p_to
        and status <> 'cancelled'
    ),
    'pendingOrders', (
      select count(*) from public.orders
      where placed_at >= p_from and placed_at <= p_to
        and status in ('pending', 'confirmed', 'processing')
    ),
    'completedOrders', (
      select count(*) from public.orders
      where placed_at >= p_from and placed_at <= p_to
        and status in ('completed', 'delivered')
    ),
    'cancelledOrders', (
      select count(*) from public.orders
      where placed_at >= p_from and placed_at <= p_to
        and status = 'cancelled'
    ),
    'paidOrders', (
      select count(*) from public.orders
      where placed_at >= p_from and placed_at <= p_to
        and payment_status = 'paid'
    ),
    'unpaidOrders', (
      select count(*) from public.orders
      where placed_at >= p_from and placed_at <= p_to
        and payment_status = 'unpaid'
    ),
    'awaitingVerification', (
      select count(*) from public.orders
      where placed_at >= p_from and placed_at <= p_to
        and payment_status = 'awaiting_verification'
    ),
    'subscriptions', (select count(*) from public.business_subscriptions),
    'activeSubscriptions', (
      select count(*) from public.business_subscriptions where status = 'active'
    ),
    'trialingSubscriptions', (
      select count(*) from public.business_subscriptions where status = 'trialing'
    ),
    'pastDueSubscriptions', (
      select count(*) from public.business_subscriptions where status = 'past_due'
    ),
    'cancelledSubscriptions', (
      select count(*) from public.business_subscriptions where status = 'cancelled'
    ),
    'aiGenerations', (
      select count(*) from public.ai_generations
      where created_at >= p_from and created_at <= p_to
    ),
    'aiTokens', (
      select coalesce(sum(tokens_used), 0) from public.ai_generations
      where created_at >= p_from and created_at <= p_to
    ),
    'aiFailed', (
      select count(*) from public.ai_generations
      where created_at >= p_from and created_at <= p_to
        and status = 'failed'
    ),
    'newMerchants', (
      select count(*) from public.businesses
      where created_at >= p_from and created_at <= p_to
    ),
    'newUsers', (
      select count(*) from public.profiles
      where created_at >= p_from and created_at <= p_to
    ),
    'openTickets', (
      select count(*) from public.support_tickets
      where status in ('open', 'in_progress', 'waiting_on_customer')
    ),
    'totalTickets', (select count(*) from public.support_tickets)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.get_platform_series(
  p_from timestamptz,
  p_to timestamptz,
  p_bucket text default 'day'
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with bucketed as (
    select generate_series(
      date_trunc(
        case when p_bucket in ('week', 'month') then p_bucket else 'day' end,
        p_from
      ),
      date_trunc(
        case when p_bucket in ('week', 'month') then p_bucket else 'day' end,
        p_to
      ),
      case
        when p_bucket = 'week' then interval '7 days'
        when p_bucket = 'month' then interval '1 month'
        else interval '1 day'
      end
    ) as bucket
  ),
  orders as (
    select date_trunc(
             case when p_bucket in ('week', 'month') then p_bucket else 'day' end,
             placed_at
           ) as bucket,
           count(*)::int as orders,
           coalesce(sum(total) filter (where payment_status = 'paid'), 0)::numeric
             as revenue
    from public.orders
    where placed_at >= p_from and placed_at <= p_to
    group by 1
  ),
  merchants as (
    select date_trunc(
             case when p_bucket in ('week', 'month') then p_bucket else 'day' end,
             created_at
           ) as bucket,
           count(*)::int as merchants
    from public.businesses
    where created_at >= p_from and created_at <= p_to
    group by 1
  ),
  users as (
    select date_trunc(
             case when p_bucket in ('week', 'month') then p_bucket else 'day' end,
             created_at
           ) as bucket,
           count(*)::int as users
    from public.profiles
    where created_at >= p_from and created_at <= p_to
    group by 1
  ),
  ai as (
    select date_trunc(
             case when p_bucket in ('week', 'month') then p_bucket else 'day' end,
             created_at
           ) as bucket,
           count(*)::int as generations,
           coalesce(sum(tokens_used), 0)::numeric as tokens
    from public.ai_generations
    where created_at >= p_from and created_at <= p_to
    group by 1
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'bucket', to_char(
          d.bucket,
          case when p_bucket = 'month' then 'Mon YYYY' else 'DD Mon' end
        ),
        'bucketStart', d.bucket,
        'orders', coalesce(o.orders, 0),
        'revenue', coalesce(o.revenue, 0),
        'merchants', coalesce(m.merchants, 0),
        'users', coalesce(u.users, 0),
        'generations', coalesce(a.generations, 0),
        'tokens', coalesce(a.tokens, 0)
      )
      order by d.bucket
    ),
    '[]'::jsonb
  )
  from bucketed d
  left join orders o on o.bucket = d.bucket
  left join merchants m on m.bucket = d.bucket
  left join users u on u.bucket = d.bucket
  left join ai a on a.bucket = d.bucket;
$$;

create or replace function public.get_platform_distribution()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'orderStatuses', (
      select coalesce(jsonb_agg(
        jsonb_build_object('status', s.status, 'count', s.count)
      ), '[]'::jsonb)
      from (
        select status::text as status, count(*) as count
        from public.orders
        group by 1
      ) s
    ),
    'paymentStatuses', (
      select coalesce(jsonb_agg(
        jsonb_build_object('status', s.status, 'count', s.count)
      ), '[]'::jsonb)
      from (
        select payment_status::text as status, count(*) as count
        from public.orders
        group by 1
      ) s
    ),
    'plans', (
      select coalesce(jsonb_agg(
        jsonb_build_object('plan', s.plan, 'count', s.count)
      ), '[]'::jsonb)
      from (
        select plan::text as plan, count(*) as count
        from public.business_subscriptions
        group by 1
      ) s
    ),
    'businessStatuses', (
      select coalesce(jsonb_agg(
        jsonb_build_object('status', s.status, 'count', s.count)
      ), '[]'::jsonb)
      from (
        select admin_status as status, count(*) as count
        from public.businesses
        group by 1
      ) s
    ),
    'ticketStatuses', (
      select coalesce(jsonb_agg(
        jsonb_build_object('status', s.status, 'count', s.count)
      ), '[]'::jsonb)
      from (
        select status, count(*) as count
        from public.support_tickets
        group by 1
      ) s
    ),
    'ticketPriorities', (
      select coalesce(jsonb_agg(
        jsonb_build_object('priority', s.priority, 'count', s.count)
      ), '[]'::jsonb)
      from (
        select priority, count(*) as count
        from public.support_tickets
        group by 1
      ) s
    )
  );
$$;

create or replace function public.get_platform_ai_usage(
  p_from timestamptz,
  p_to timestamptz
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'total', (
      select count(*) from public.ai_generations
      where created_at >= p_from and created_at <= p_to
    ),
    'tokens', (
      select coalesce(sum(tokens_used), 0) from public.ai_generations
      where created_at >= p_from and created_at <= p_to
    ),
    'completed', (
      select count(*) from public.ai_generations
      where created_at >= p_from and created_at <= p_to
        and status = 'completed'
    ),
    'failed', (
      select count(*) from public.ai_generations
      where created_at >= p_from and created_at <= p_to
        and status = 'failed'
    ),
    'byKind', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'kind', k.kind,
        'count', k.count,
        'tokens', k.tokens
      ) order by k.count desc), '[]'::jsonb)
      from (
        select kind, count(*) as count, coalesce(sum(tokens_used), 0) as tokens
        from public.ai_generations
        where created_at >= p_from and created_at <= p_to
        group by 1
      ) k
    ),
    'byStatus', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'status', s.status,
        'count', s.count
      )), '[]'::jsonb)
      from (
        select status::text as status, count(*) as count
        from public.ai_generations
        where created_at >= p_from and created_at <= p_to
        group by 1
      ) s
    ),
    'topBusinesses', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', b.id::text,
        'name', b.name,
        'slug', b.slug,
        'generations', t.count,
        'tokens', t.tokens
      ) order by t.count desc), '[]'::jsonb)
      from (
        select business_id, count(*) as count,
               coalesce(sum(tokens_used), 0) as tokens
        from public.ai_generations
        where created_at >= p_from and created_at <= p_to
        group by 1
        order by count(*) desc
        limit 5
      ) t
      join public.businesses b on b.id = t.business_id
    )
  );
$$;

revoke all on function public.get_platform_overview(timestamptz, timestamptz)
  from public;
revoke all on function public.get_platform_series(timestamptz, timestamptz, text)
  from public;
revoke all on function public.get_platform_distribution() from public;
revoke all on function public.get_platform_ai_usage(timestamptz, timestamptz)
  from public;

grant execute on function public.get_platform_overview(timestamptz, timestamptz)
  to authenticated;
grant execute on function public.get_platform_series(timestamptz, timestamptz, text)
  to authenticated;
grant execute on function public.get_platform_distribution() to authenticated;
grant execute on function public.get_platform_ai_usage(timestamptz, timestamptz)
  to authenticated;

-- ---------------------------------------------------------------------------
-- updated_at trigger for the new tables
-- ---------------------------------------------------------------------------

drop trigger if exists platform_admins_set_updated_at on public.platform_admins;

create trigger platform_admins_set_updated_at
  before update on public.platform_admins
  for each row execute function public.set_updated_at();

drop trigger if exists platform_announcements_set_updated_at
  on public.platform_announcements;

create trigger platform_announcements_set_updated_at
  before update on public.platform_announcements
  for each row execute function public.set_updated_at();

drop trigger if exists platform_settings_set_updated_at on public.platform_settings;

create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

drop trigger if exists platform_plan_prices_set_updated_at
  on public.platform_plan_prices;

create trigger platform_plan_prices_set_updated_at
  before update on public.platform_plan_prices
  for each row execute function public.set_updated_at();

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;

create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();
