"""Per-account key/value: settings, keybinds, app_state. Each blob is stored/returned whole
so the Electron managers keep their load → mutate → save pattern.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..deps import get_current_user, get_data_repo
from ..services.data_repo import DataRepo
from ..services.user_repo import User

router = APIRouter(tags=["user_kv"])


class SettingsBody(BaseModel):
    data: dict


class KeybindsBody(BaseModel):
    data: list


class AppStateBody(BaseModel):
    value: str


@router.get("/settings")
async def get_settings(
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    return await repo.get_settings(user.id)


@router.put("/settings")
async def put_settings(
    body: SettingsBody,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    return await repo.put_settings(user.id, body.data)


@router.get("/keybinds")
async def get_keybinds(
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> list:
    return await repo.get_keybinds(user.id)


@router.put("/keybinds")
async def put_keybinds(
    body: KeybindsBody,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> list:
    return await repo.put_keybinds(user.id, body.data)


@router.get("/app-state/{key}")
async def get_app_state(
    key: str,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    return {"value": await repo.get_app_state(user.id, key)}


@router.put("/app-state/{key}")
async def set_app_state(
    key: str,
    body: AppStateBody,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.set_app_state(user.id, key, body.value)
    return {"saved": True}


@router.delete("/app-state/{key}")
async def delete_app_state(
    key: str,
    user: Annotated[User, Depends(get_current_user)],
    repo: Annotated[DataRepo, Depends(get_data_repo)],
) -> dict:
    await repo.delete_app_state(user.id, key)
    return {"deleted": True}
