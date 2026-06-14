-- Natively users table. Apply via Supabase SQL editor or `supabase db push`.
-- Phone is the natural login key; user_id is the surrogate referenced by JWTs.

create table if not exists public.users (
    id           uuid primary key default gen_random_uuid(),
    phone        text not null unique,
    created_at   timestamptz not null default now(),
    last_login_at timestamptz not null default now()
);

create index if not exists users_phone_idx on public.users (phone);

-- RLS: lock the table down — only the service role (backend) should read/write.
alter table public.users enable row level security;
-- (No public policies. Backend uses service_role key which bypasses RLS.)
