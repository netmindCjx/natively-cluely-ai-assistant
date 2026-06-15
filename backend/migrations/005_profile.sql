-- Per-account profile + resume. Replaces local SQLite user_profile / resume_nodes /
-- profile_custom_notes and the ProfileManager `profile.json` blob.

create table if not exists public.user_profile (
    user_id            uuid primary key references public.users(id) on delete cascade,
    structured_json    jsonb,
    compact_persona    text,
    intro_short        text,
    intro_interview    text,
    profile_state_json jsonb,             -- old profile.json: resume/jd/profileMode etc.
    custom_notes       text not null default '',
    updated_at         timestamptz not null default now()
);

create table if not exists public.resume_nodes (
    id              bigserial primary key,
    user_id         uuid not null references public.users(id) on delete cascade,
    category        text,
    title           text,
    organization    text,
    start_date      text,
    end_date        text,
    duration_months int,
    text_content    text,
    tags            text,
    dim             int,
    embedding       vector
);

create index if not exists resume_nodes_user_idx on public.resume_nodes (user_id);

alter table public.user_profile enable row level security;
alter table public.resume_nodes enable row level security;
