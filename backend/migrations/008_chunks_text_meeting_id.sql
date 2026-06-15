-- RAG cloud migration: chunks/chunk_summaries.meeting_id becomes TEXT with no FK to meetings.
-- Rationale: live JIT indexing writes chunks under the sentinel id 'live-meeting-current'
-- before the real (uuid) meeting exists, so the column can't be uuid or FK-constrained.
-- Cleanup is explicit (delete_embeddings / deleteMeetingData), not via cascade.
-- These tables are empty in the cloud, so drop + recreate is safe.

drop table if exists public.chunks cascade;
drop table if exists public.chunk_summaries cascade;

create table public.chunks (
    id                 bigserial primary key,
    user_id            uuid not null references public.users(id) on delete cascade,
    meeting_id         text not null,
    chunk_index        int not null,
    speaker            text,
    start_timestamp_ms bigint,
    end_timestamp_ms   bigint,
    cleaned_text       text not null,
    token_count        int not null,
    dim                int,
    embedding          vector,
    created_at         timestamptz not null default now()
);
create index chunks_user_meeting_idx on public.chunks (user_id, meeting_id);

create table public.chunk_summaries (
    id           bigserial primary key,
    user_id      uuid not null references public.users(id) on delete cascade,
    meeting_id   text not null,
    summary_text text not null,
    dim          int,
    embedding    vector,
    created_at   timestamptz not null default now(),
    unique (user_id, meeting_id)
);
create index chunk_summaries_user_idx on public.chunk_summaries (user_id);

alter table public.chunks enable row level security;
alter table public.chunk_summaries enable row level security;

-- Recreate the search RPCs with TEXT meeting filter.
drop function if exists public.match_chunks(uuid, text, int, uuid, int, float);
create or replace function public.match_chunks(
    p_user_id uuid,
    p_query_embedding text,
    p_dim int default null,
    p_meeting_id text default null,
    p_limit int default 10,
    p_min_similarity float default 0
)
returns table (
    id bigint, meeting_id text, chunk_index int, speaker text,
    start_timestamp_ms bigint, end_timestamp_ms bigint,
    cleaned_text text, token_count int, similarity float
)
language sql stable as $$
    select c.id, c.meeting_id, c.chunk_index, c.speaker,
           c.start_timestamp_ms, c.end_timestamp_ms, c.cleaned_text, c.token_count,
           1 - (c.embedding <=> p_query_embedding::vector) as similarity
    from public.chunks c
    where c.user_id = p_user_id
      and c.embedding is not null
      and (p_dim is null or c.dim = p_dim)
      and (p_meeting_id is null or c.meeting_id = p_meeting_id)
      and (1 - (c.embedding <=> p_query_embedding::vector)) >= p_min_similarity
    order by c.embedding <=> p_query_embedding::vector
    limit p_limit;
$$;
