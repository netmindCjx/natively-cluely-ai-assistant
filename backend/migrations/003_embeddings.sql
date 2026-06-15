-- RAG embeddings storage. Replaces local sqlite-vec (vec_chunks/vec_summaries).
-- Vectors are still computed locally in the Electron app; only storage + similarity
-- search move here.
--
-- MVP: brute-force cosine scan, NO ANN index. Per-user corpora are small, so a sequential
-- scan (`order by embedding <=> $1`) is fast enough and sidesteps pgvector's fixed-dimension
-- requirement for ivfflat/hnsw indexes.
--
-- Extensibility (keep so the later upgrade is non-breaking): the `dim` column records the
-- embedding dimensionality on every row, and all access goes through the backend
-- `/embeddings/*` endpoints. A future ANN upgrade is purely backend-side — pin a dimension
-- (or per-dim partial indexes), add `using hnsw (embedding vector_cosine_ops)`, and swap the
-- query inside the search endpoint. No client or schema-breaking change.

create extension if not exists vector;

create table if not exists public.chunks (
    id                 bigserial primary key,
    user_id            uuid not null references public.users(id) on delete cascade,
    meeting_id         uuid not null references public.meetings(id) on delete cascade,
    chunk_index        int not null,
    speaker            text,
    start_timestamp_ms bigint,
    end_timestamp_ms   bigint,
    cleaned_text       text not null,
    token_count        int not null,
    dim                int,
    embedding          vector,            -- untyped: allows variable dim for MVP
    created_at         timestamptz not null default now()
);

create index if not exists chunks_user_meeting_idx on public.chunks (user_id, meeting_id);

create table if not exists public.chunk_summaries (
    id           bigserial primary key,
    user_id      uuid not null references public.users(id) on delete cascade,
    meeting_id   uuid not null references public.meetings(id) on delete cascade unique,
    summary_text text not null,
    dim          int,
    embedding    vector,
    created_at   timestamptz not null default now()
);

create index if not exists chunk_summaries_user_idx on public.chunk_summaries (user_id);

alter table public.chunks enable row level security;
alter table public.chunk_summaries enable row level security;
