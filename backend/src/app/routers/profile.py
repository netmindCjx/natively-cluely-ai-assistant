"""Per-account profile + resume + custom notes. Replaces local user_profile / resume_nodes /
profile_custom_notes and the ProfileManager profile.json blob.
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..deps import get_current_user, get_data_repo
from ..services.data_repo import DataRepo
from ..services.user_repo import User

router = APIRouter(prefix="/profile", tags=["profile"])


class ProfileUpdate(BaseModel):
    structured_json: dict | None = None
    compact_persona: str | None = None
    intro_short: str | None = None
    intro_interview: str | None = None
    profile_state_json: dict | None = None


class NotesUpdate(BaseModel):
    content: str


class ResumeNode(BaseModel):
    category: str | None = None
    title: str | None = None
    organization: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    duration_months: int | None = None
    text_content: str | None = None
    tags: str | None = None
    dim: int | None = None
    embedding: list[float] | None = None


class ResumeNodesReplace(BaseModel):
    nodes: list[ResumeNode]


@router.get("")
async def get_profile(
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict | None:
    return await repo.get_profile(user.id)


@router.put("")
async def put_profile(
    body: ProfileUpdate,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    return await repo.put_profile(user.id, body.model_dump(exclude_none=True))


@router.get("/notes")
async def get_notes(
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    profile = await repo.get_profile(user.id)
    return {"content": (profile or {}).get("custom_notes", "")}


@router.put("/notes")
async def put_notes(
    body: NotesUpdate,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.put_profile(user.id, {"custom_notes": body.content})
    return {"saved": True}


@router.get("/resume-nodes")
async def get_resume_nodes(
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> list[dict]:
    return await repo.get_resume_nodes(user.id)


@router.put("/resume-nodes")
async def replace_resume_nodes(
    body: ResumeNodesReplace,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.replace_resume_nodes(user.id, [n.model_dump() for n in body.nodes])
    return {"count": len(body.nodes)}
