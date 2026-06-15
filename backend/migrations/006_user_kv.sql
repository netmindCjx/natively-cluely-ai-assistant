-- Per-account key/value settings. Replaces local settings.json, keybinds.json, and the
-- SQLite app_state table. Each blob is stored whole (load → mutate → save) so the Electron
-- managers keep their existing shape.
--
-- NOTE: LLM/STT API keys are intentionally NOT stored here — they stay local in the OS
-- keychain (safeStorage), pending the move to a backend-managed LLM/STT gateway.

create table if not exists public.user_settings (
    user_id    uuid primary key references public.users(id) on delete cascade,
    data       jsonb not null default '{}',     -- AppSettings
    updated_at timestamptz not null default now()
);

create table if not exists public.user_keybinds (
    user_id    uuid primary key references public.users(id) on delete cascade,
    data       jsonb not null default '[]',     -- KeybindConfig[]
    updated_at timestamptz not null default now()
);

create table if not exists public.user_app_state (
    user_id uuid not null references public.users(id) on delete cascade,
    key     text not null,
    value   text,
    primary key (user_id, key)
);

alter table public.user_settings enable row level security;
alter table public.user_keybinds enable row level security;
alter table public.user_app_state enable row level security;
