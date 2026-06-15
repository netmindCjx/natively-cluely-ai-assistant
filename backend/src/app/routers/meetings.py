"""Per-account meeting storage endpoints. Backend-mediated replacement for the Electron
app's local SQLite meeting tables. Rows are stored close to the original shape; the Electron
DatabaseManager facade keeps its row→Meeting reshaping logic.
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..deps import get_current_user, get_data_repo
from ..services.data_repo import DataRepo
from ..services.user_repo import User

router = APIRouter(prefix="/meetings", tags=["meetings"])


class MeetingRow(BaseModel):
    id: str
    title: str | None = None
    start_time: int | None = None
    duration_ms: int | None = None
    summary_json: dict | None = None
    token_usage_json: dict | None = None
    calendar_event_id: str | None = None
    source: str | None = "manual"
    is_processed: bool = True
    embedding_provider: str | None = None
    embedding_dimensions: int | None = None


class TranscriptRow(BaseModel):
    speaker: str | None = None
    content: str | None = None
    timestamp_ms: int | None = None


class InteractionRow(BaseModel):
    type: str | None = None
    timestamp: int | None = None
    user_query: str | None = None
    ai_response: str | None = None
    metadata_json: Any = None


class SaveMeetingRequest(BaseModel):
    meeting: MeetingRow
    transcripts: list[TranscriptRow] = []
    ai_interactions: list[InteractionRow] = []


class SummaryUpdate(BaseModel):
    overview: str | None = None
    actionItems: list[str] | None = None
    keyPoints: list[str] | None = None
    actionItemsTitle: str | None = None
    keyPointsTitle: str | None = None


class TitleUpdate(BaseModel):
    title: str


@router.get("")
async def list_meetings(
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
    limit: int = 50,
) -> list[dict]:
    return await repo.list_meetings(user.id, limit)


@router.get("/unprocessed")
async def list_unprocessed(
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> list[dict]:
    return await repo.list_unprocessed(user.id)


@router.get("/{meeting_id}")
async def get_meeting(
    meeting_id: str,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict | None:
    meeting = await repo.get_meeting(user.id, meeting_id)
    if not meeting:
        return None
    transcripts = await repo.get_transcripts(user.id, meeting_id)
    ai_interactions = await repo.get_ai_interactions(user.id, meeting_id)
    return {"meeting": meeting, "transcripts": transcripts, "ai_interactions": ai_interactions}


@router.post("")
async def save_meeting(
    body: SaveMeetingRequest,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.save_meeting(
        user.id,
        body.meeting.model_dump(),
        [t.model_dump() for t in body.transcripts],
        [a.model_dump() for a in body.ai_interactions],
    )
    return {"id": body.meeting.id}


@router.patch("/{meeting_id}/title")
async def update_title(
    meeting_id: str,
    body: TitleUpdate,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    ok = await repo.update_meeting_title(user.id, meeting_id, body.title)
    return {"updated": ok}


@router.patch("/{meeting_id}/summary")
async def update_summary(
    meeting_id: str,
    body: SummaryUpdate,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    updates = body.model_dump(exclude_none=True)
    ok = await repo.update_meeting_summary(user.id, meeting_id, updates)
    return {"updated": ok}


@router.delete("/{meeting_id}")
async def delete_meeting(
    meeting_id: str,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    ok = await repo.delete_meeting(user.id, meeting_id)
    return {"deleted": ok}
