"""Per-account custom intelligence modes + reference files + note sections.
Payloads/rows use snake_case column names, matching what the Electron DatabaseManager facade
sends and reads (its consumers already read snake_case fields).
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..deps import get_current_user, get_data_repo
from ..services.data_repo import DataRepo
from ..services.user_repo import User

router = APIRouter(prefix="/modes", tags=["modes"])


class CreateMode(BaseModel):
    id: str
    name: str
    template_type: str = "general"
    custom_context: str = ""


class UpdateMode(BaseModel):
    name: str | None = None
    template_type: str | None = None
    custom_context: str | None = None


class SetActive(BaseModel):
    mode_id: str | None = None


class CreateReferenceFile(BaseModel):
    id: str
    file_name: str
    content: str = ""


class CreateNoteSection(BaseModel):
    id: str
    title: str
    description: str = ""
    sort_order: int = 0


class UpdateNoteSection(BaseModel):
    title: str | None = None
    description: str | None = None
    sort_order: int | None = None


@router.get("")
async def get_modes(
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> list[dict]:
    return await repo.get_modes(user.id)


@router.get("/active")
async def get_active_mode(
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict | None:
    modes = await repo.get_modes(user.id)
    return next((m for m in modes if m.get("is_active")), None)


@router.post("")
async def create_mode(
    body: CreateMode,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.upsert_mode(user.id, body.model_dump())
    return {"id": body.id}


@router.put("/set-active")
async def set_active(
    body: SetActive,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.set_active_mode(user.id, body.mode_id)
    return {"active": body.mode_id}


@router.patch("/{mode_id}")
async def update_mode(
    mode_id: str,
    body: UpdateMode,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.update_mode(user.id, mode_id, body.model_dump(exclude_none=True))
    return {"updated": True}


@router.delete("/{mode_id}")
async def delete_mode(
    mode_id: str,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.delete_mode(user.id, mode_id)
    return {"deleted": True}


@router.get("/{mode_id}/files")
async def get_reference_files(
    mode_id: str,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> list[dict]:
    return await repo.get_reference_files(user.id, mode_id)


@router.post("/{mode_id}/files")
async def add_reference_file(
    mode_id: str,
    body: CreateReferenceFile,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.add_reference_file(user.id, {**body.model_dump(), "mode_id": mode_id})
    return {"id": body.id}


@router.delete("/files/{file_id}")
async def delete_reference_file(
    file_id: str,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.delete_reference_file(user.id, file_id)
    return {"deleted": True}


@router.get("/{mode_id}/sections")
async def get_note_sections(
    mode_id: str,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> list[dict]:
    return await repo.get_note_sections(user.id, mode_id)


@router.post("/{mode_id}/sections")
async def add_note_section(
    mode_id: str,
    body: CreateNoteSection,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.add_note_section(user.id, {**body.model_dump(), "mode_id": mode_id})
    return {"id": body.id}


@router.delete("/{mode_id}/sections")
async def delete_all_note_sections(
    mode_id: str,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.delete_all_note_sections(user.id, mode_id)
    return {"deleted": True}


@router.patch("/sections/{section_id}")
async def update_note_section(
    section_id: str,
    body: UpdateNoteSection,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.update_note_section(user.id, section_id, body.model_dump(exclude_none=True))
    return {"updated": True}


@router.delete("/sections/{section_id}")
async def delete_note_section(
    section_id: str,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.delete_note_section(user.id, section_id)
    return {"deleted": True}
