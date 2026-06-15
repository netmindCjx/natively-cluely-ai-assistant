-- Custom intelligence modes, per account. Mirrors the local SQLite v11 schema.
-- The default "General" mode + its note sections are seeded lazily per user by the backend
-- on first read (no longer a global migration, since modes are now account-scoped).

create table if not exists public.modes (
    id             text not null,
    user_id        uuid not null references public.users(id) on delete cascade,
    name           text not null,
    template_type  text not null default 'general',
    custom_context text not null default '',
    is_active      boolean not null default false,
    created_at     timestamptz not null default now(),
    primary key (user_id, id)
);

create index if not exists modes_user_idx on public.modes (user_id);

create table if not exists public.mode_reference_files (
    id         text not null,
    user_id    uuid not null references public.users(id) on delete cascade,
    mode_id    text not null,
    file_name  text not null,
    content    text not null default '',
    created_at timestamptz not null default now(),
    primary key (user_id, id),
    foreign key (user_id, mode_id) references public.modes(user_id, id) on delete cascade
);

create index if not exists mode_reference_files_mode_idx on public.mode_reference_files (user_id, mode_id);

create table if not exists public.mode_note_sections (
    id          text not null,
    user_id     uuid not null references public.users(id) on delete cascade,
    mode_id     text not null,
    title       text not null,
    description text not null default '',
    sort_order  int not null default 0,
    created_at  timestamptz not null default now(),
    primary key (user_id, id),
    foreign key (user_id, mode_id) references public.modes(user_id, id) on delete cascade
);

create index if not exists mode_note_sections_mode_idx on public.mode_note_sections (user_id, mode_id, sort_order);

alter table public.modes enable row level security;
alter table public.mode_reference_files enable row level security;
alter table public.mode_note_sections enable row level security;
