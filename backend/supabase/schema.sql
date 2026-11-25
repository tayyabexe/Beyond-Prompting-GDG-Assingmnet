-- NEXUS-COMMERCE database schema
-- Run in Supabase → SQL Editor. Safe to re-run: it drops and recreates everything
-- (this deletes existing NEXUS-COMMERCE data — run seed.sql afterwards).

create extension if not exists pgcrypto;

drop function if exists place_order(jsonb, jsonb, text);
drop function if exists update_order_status(text, text);
drop table if exists inquiry_notes, inquiries, order_status_history, order_items, orders, customers, products cascade;
drop sequence if exists order_seq, inquiry_seq;

create sequence order_seq start 1001;
create sequence inquiry_seq start 1001;

-- ---------- Tables ----------

create table products (
  id           text primary key,                       -- slug, e.g. 'aura-wireless-headphones'
  name         text not null check (char_length(name) between 2 and 120),
  category     text not null check (category in ('Audio', 'Wearables', 'Home Office', 'Accessories')),
  description  text not null default '',
  price        integer not null check (price > 0),     -- whole PKR
  stock        integer not null check (stock >= 0),    -- can never go negative
  image_url    text,
  image_credit text,
  featured     boolean not null default false,
  created_at   timestamptz not null default now()
);

create table customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null unique check (email = lower(email)),
  phone      text not null,
  city       text not null,
  created_at timestamptz not null default now()
);

create table orders (
  id           text primary key default ('NX-' || nextval('order_seq')),
  customer_id  uuid not null references customers(id),
  ship_name    text not null,
  ship_email   text not null,
  ship_phone   text not null,
  ship_address text not null,
  ship_city    text not null,
  payment      text not null check (payment in ('cod', 'demo')),
  subtotal     integer not null check (subtotal >= 0),
  shipping     integer not null check (shipping >= 0),
  total        integer not null check (total >= 0),
  status       text not null default 'pending'
               check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index orders_customer_idx on orders(customer_id);
create index orders_status_idx on orders(status);

create table order_items (
  id           bigint generated always as identity primary key,
  order_id     text not null references orders(id) on delete cascade,
  product_id   text not null references products(id),
  product_name text not null,                          -- snapshot at purchase time
  unit_price   integer not null check (unit_price > 0),-- snapshot at purchase time
  qty          integer not null check (qty > 0)
);
create index order_items_order_idx on order_items(order_id);

create table order_status_history (
  id         bigint generated always as identity primary key,
  order_id   text not null references orders(id) on delete cascade,
  status     text not null,
  changed_at timestamptz not null default now()
);
create index order_history_order_idx on order_status_history(order_id);

create table inquiries (
  id         text primary key default ('INQ-' || nextval('inquiry_seq')),
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  product_id text references products(id) on delete set null,
  status     text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inquiry_notes (
  id         bigint generated always as identity primary key,
  inquiry_id text not null references inquiries(id) on delete cascade,
  note       text not null check (char_length(note) between 1 and 500),
  created_at timestamptz not null default now()
);
create index inquiry_notes_inquiry_idx on inquiry_notes(inquiry_id);

-- ---------- Row Level Security ----------
-- RLS on, no policies: the public anon key can read/write nothing.
-- Only the backend (service_role key, which bypasses RLS) touches data.
alter table products             enable row level security;
alter table customers            enable row level security;
alter table orders               enable row level security;
alter table order_items          enable row level security;
alter table order_status_history enable row level security;
alter table inquiries            enable row level security;
alter table inquiry_notes        enable row level security;

-- ---------- Functions ----------

-- Checkout in ONE transaction: lock products, check stock, reduce stock,
-- upsert customer, compute totals from DB prices, write order + items + history.
create or replace function place_order(p_customer jsonb, p_items jsonb, p_payment text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  r           record;
  v_subtotal  integer := 0;
  v_shipping  integer;
  v_customer  uuid;
  v_order_id  text;
  v_email     text := lower(trim(p_customer->>'email'));
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  -- Merge duplicate lines, then lock rows in id order (consistent order avoids deadlocks).
  for r in
    select a.product_id, a.qty, p.price, p.stock
    from (
      select e->>'product_id' as product_id, sum((e->>'qty')::int) as qty
      from jsonb_array_elements(p_items) e
      group by e->>'product_id'
    ) a
    left join products p on p.id = a.product_id
    order by a.product_id
  loop
    if r.price is null then
      raise exception 'PRODUCT_NOT_FOUND:%', r.product_id;
    end if;
    if r.qty <= 0 then
      raise exception 'INVALID_QTY:%', r.product_id;
    end if;
    perform 1 from products where id = r.product_id for update;
    -- re-read stock after taking the lock
    if (select stock from products where id = r.product_id) < r.qty then
      raise exception 'INSUFFICIENT_STOCK:%', r.product_id;
    end if;
    v_subtotal := v_subtotal + r.price * r.qty;
  end loop;

  -- Shipping rule (same rule lives in backend/app/pricing.py for cart quotes)
  v_shipping := case when v_subtotal >= 10000 then 0 else 250 end;

  insert into customers (name, email, phone, city)
  values (p_customer->>'name', v_email, p_customer->>'phone', p_customer->>'city')
  on conflict (email) do update
    set name = excluded.name, phone = excluded.phone, city = excluded.city
  returning id into v_customer;

  insert into orders (customer_id, ship_name, ship_email, ship_phone, ship_address, ship_city,
                      payment, subtotal, shipping, total)
  values (v_customer, p_customer->>'name', v_email, p_customer->>'phone',
          p_customer->>'address', p_customer->>'city',
          p_payment, v_subtotal, v_shipping, v_subtotal + v_shipping)
  returning id into v_order_id;

  insert into order_items (order_id, product_id, product_name, unit_price, qty)
  select v_order_id, p.id, p.name, p.price, a.qty
  from (
    select e->>'product_id' as product_id, sum((e->>'qty')::int) as qty
    from jsonb_array_elements(p_items) e
    group by e->>'product_id'
  ) a
  join products p on p.id = a.product_id;

  update products p
  set stock = p.stock - a.qty
  from (
    select e->>'product_id' as product_id, sum((e->>'qty')::int) as qty
    from jsonb_array_elements(p_items) e
    group by e->>'product_id'
  ) a
  where p.id = a.product_id;

  insert into order_status_history (order_id, status) values (v_order_id, 'pending');

  return v_order_id;
end;
$$;

-- Status change with allowed transitions; cancelling restocks the items.
create or replace function update_order_status(p_order_id text, p_new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current text;
  v_allowed text[];
begin
  select status into v_current from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  v_allowed := case v_current
    when 'pending'    then array['processing', 'cancelled']
    when 'processing' then array['shipped', 'cancelled']
    when 'shipped'    then array['delivered']
    else array[]::text[]
  end;

  if not (p_new_status = any(v_allowed)) then
    raise exception 'INVALID_TRANSITION:%->%', v_current, p_new_status;
  end if;

  if p_new_status = 'cancelled' then
    update products p
    set stock = p.stock + oi.qty
    from (select product_id, sum(qty) as qty from order_items
          where order_id = p_order_id group by product_id) oi
    where p.id = oi.product_id;
  end if;

  update orders set status = p_new_status, updated_at = now() where id = p_order_id;
  insert into order_status_history (order_id, status) values (p_order_id, p_new_status);
end;
$$;

-- Only the backend may call these functions.
revoke execute on function place_order(jsonb, jsonb, text) from public, anon, authenticated;
revoke execute on function update_order_status(text, text) from public, anon, authenticated;
grant  execute on function place_order(jsonb, jsonb, text) to service_role;
grant  execute on function update_order_status(text, text) to service_role;

-- ---------- Storage ----------
-- Public bucket: anyone can VIEW images by URL; only the service key can upload.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;
