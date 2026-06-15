"""RAG embeddings endpoints. Vectors are computed locally in the Electron app and shipped
here for storage + brute-force cosine similarity search (pgvector). Replaces local sqlite-vec.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..deps import get_current_user, get_data_repo
from ..services.data_repo import DataRepo
from ..services.user_repo import User

router = APIRouter(prefix="/embeddings", tags=["embeddings"])


class ChunkRow(BaseModel):
    chunk_index: int
    speaker: str | None = None
    start_timestamp_ms: int | None = None
    end_timestamp_ms: int | None = None
    cleaned_text: str
    token_count: int
    dim: int | None = None
    embedding: list[float] | None = None


class UpsertChunksRequest(BaseModel):
    meeting_id: str
    chunks: list[ChunkRow]


class UpsertSummaryRequest(BaseModel):
    meeting_id: str
    summary_text: str
    dim: int | None = None
    embedding: list[float] | None = None


class SearchRequest(BaseModel):
    embedding: list[float]
    dim: int | None = None
    meeting_id: str | None = None
    limit: int = 10
    min_similarity: float = 0.0


class SearchSummariesRequest(BaseModel):
    embedding: list[float]
    dim: int | None = None
    limit: int = 10
    min_similarity: float = 0.0


@router.post("/chunks")
async def upsert_chunks(
    body: UpsertChunksRequest,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.upsert_chunks(user.id, body.meeting_id, [c.model_dump() for c in body.chunks])
    return {"stored": len(body.chunks)}


@router.post("/summary")
async def upsert_summary(
    body: UpsertSummaryRequest,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.upsert_summary(user.id, body.meeting_id, body.summary_text, body.dim, body.embedding)
    return {"stored": True}


@router.post("/search")
async def search_chunks(
    body: SearchRequest,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> list[dict]:
    return await repo.search_chunks(
        user.id, body.embedding, body.dim, body.meeting_id, body.limit, body.min_similarity
    )


@router.post("/search-summaries")
async def search_summaries(
    body: SearchSummariesRequest,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> list[dict]:
    return await repo.search_summaries(user.id, body.embedding, body.dim, body.limit, body.min_similarity)


@router.get("/meeting/{meeting_id}/exists")
async def meeting_has_embeddings(
    meeting_id: str,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    return {"has_chunks": await repo.chunks_exist(user.id, meeting_id)}


@router.delete("/meeting/{meeting_id}")
async def delete_meeting_embeddings(
    meeting_id: str,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.delete_embeddings(user.id, meeting_id)
    return {"deleted": True}
