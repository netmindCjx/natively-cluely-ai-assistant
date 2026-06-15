-- Brute-force cosine similarity search RPCs for the MVP (no ANN index).
-- The query embedding is passed as a JSON-array text (e.g. '[0.1,0.2,...]') and cast to
-- vector inside the function, which avoids PostgREST vector-serialization quirks.
-- Similarity = 1 - cosine_distance. Called by the backend with the service role.
--
-- Future ANN upgrade: pin a dimension on the `embedding` column, add an hnsw index, and the
-- `order by ... <=> ...` here will use it automatically — no signature change.

create or replace function public.match_chunks(
    p_user_id uuid,
    p_query_embedding text,
    p_dim int default null,
    p_meeting_id uuid default null,
    p_limit int default 10,
    p_min_similarity float default 0
)
returns table (
    id bigint,
    meeting_id uuid,
    chunk_index int,
    speaker text,
    start_timestamp_ms bigint,
    end_timestamp_ms bigint,
    cleaned_text text,
    token_count int,
    similarity float
)
language sql
stable
as $$
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

create or replace function public.match_chunk_summaries(
    p_user_id uuid,
    p_query_embedding text,
    p_dim int default null,
    p_limit int default 10,
    p_min_similarity float default 0
)
returns table (
    id bigint,
    meeting_id uuid,
    summary_text text,
    similarity float
)
language sql
stable
as $$
    select s.id, s.meeting_id, s.summary_text,
           1 - (s.embedding <=> p_query_embedding::vector) as similarity
    from public.chunk_summaries s
    where s.user_id = p_user_id
      and s.embedding is not null
      and (p_dim is null or s.dim = p_dim)
      and (1 - (s.embedding <=> p_query_embedding::vector)) >= p_min_similarity
    order by s.embedding <=> p_query_embedding::vector
    limit p_limit;
$$;
