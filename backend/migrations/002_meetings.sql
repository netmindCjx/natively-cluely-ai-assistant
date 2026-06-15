-- Per-account meeting storage. Replaces the local SQLite `meetings`/`transcripts`/
-- `ai_interactions` tables. Every row is scoped by user_id; the backend (service role)
-- always filters by the user_id extracted from the JWT.

create table if not exists public.meetings (
    id                   uuid primary key,                 -- client-generated (crypto.randomUUID)
    user_id              uuid not null references public.users(id) on delete cascade,
    title                text,
    start_time           bigint,                           -- epoch ms
    duration_ms          bigint,
    summary_json         jsonb,                            -- detailedSummary / legacy summary
    token_usage_json     jsonb,                            -- per-meeting LLM/STT cost breakdown
    calendar_event_id    text,
    source               text default 'manual',            -- 'manual' | 'calendar'
    is_processed         boolean not null default true,
    embedding_provider   text,
    embedding_dimensions int,
    created_at           timestamptz not null default now()
);

create index if not exists meetings_user_created_idx on public.meetings (user_id, created_at desc);
create index if not exists meetings_user_processed_idx on public.meetings (user_id, is_processed);

create table if not exists public.transcripts (
    id           bigserial primary key,
    user_id      uuid not null references public.users(id) on delete cascade,
    meeting_id   uuid not null references public.meetings(id) on delete cascade,
    speaker      text,
    content      text,
    timestamp_ms bigint
);

create index if not exists transcripts_meeting_idx on public.transcripts (meeting_id, timestamp_ms);

create table if not exists public.ai_interactions (
    id            bigserial primary key,
    user_id       uuid not null references public.users(id) on delete cascade,
    meeting_id    uuid not null references public.meetings(id) on delete cascade,
    type          text,
    timestamp     bigint,
    user_query    text,
    ai_response   text,
    metadata_json jsonb
);

create index if not exists ai_interactions_meeting_idx on public.ai_interactions (meeting_id, timestamp);

-- RLS: deny-by-default. Only the service role (backend) touches these tables.
alter table public.meetings enable row level security;
alter table public.transcripts enable row level security;
alter table public.ai_interactions enable row level security;
