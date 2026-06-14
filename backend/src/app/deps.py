from functools import lru_cache
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
import jwt

from .config import Settings, get_settings
from .services.aliyun_captcha import AliyunCaptchaVerifier, CaptchaVerifier, NoopCaptchaVerifier
from .services.aliyun_pnvs import AliyunPnvsSmsSender, MockSmsSender, SmsSender
from .services.jwt_service import JwtService
from .services.rate_limiter import InMemoryRateLimiter, RateLimiter
from .services.user_repo import InMemoryUserRepo, SupabaseUserRepo, User, UserRepo


@lru_cache
def get_sms_sender() -> SmsSender:
    settings: Settings = get_settings()
    if not settings.aliyun_enabled:
        return MockSmsSender()
    return AliyunPnvsSmsSender(
        access_key_id=settings.aliyun_access_key_id,
        access_key_secret=settings.aliyun_access_key_secret,
        sign_name=settings.aliyun_pnvs_sign_name,
        template_code=settings.aliyun_pnvs_template_code,
        valid_seconds=settings.aliyun_pnvs_code_valid_seconds,
        endpoint=settings.aliyun_pnvs_endpoint,
    )


@lru_cache
def get_user_repo() -> UserRepo:
    settings = get_settings()
    if not settings.supabase_enabled:
        return InMemoryUserRepo()
    return SupabaseUserRepo(
        url=settings.supabase_url, service_role_key=settings.supabase_service_role_key
    )


@lru_cache
def get_rate_limiter() -> RateLimiter:
    # Single-process in-memory limiter. Swap for a Redis impl when running > 1 instance.
    return InMemoryRateLimiter()


@lru_cache
def get_captcha_verifier() -> CaptchaVerifier:
    settings = get_settings()
    if not settings.captcha_enabled:
        return NoopCaptchaVerifier()
    return AliyunCaptchaVerifier(
        access_key_id=settings.aliyun_access_key_id,
        access_key_secret=settings.aliyun_access_key_secret,
        scene_id=settings.aliyun_captcha_scene_id,
        endpoint=settings.aliyun_captcha_endpoint,
    )


@lru_cache
def get_jwt_service() -> JwtService:
    settings = get_settings()
    return JwtService(
        secret=settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
        access_ttl=settings.jwt_access_ttl_seconds,
        refresh_ttl=settings.jwt_refresh_ttl_seconds,
    )


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    repo: UserRepo = Depends(get_user_repo),
    jwt_svc: JwtService = Depends(get_jwt_service),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt_svc.verify(token, expected_type="access")
    except jwt.PyJWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"invalid token: {exc}") from exc
    user = await repo.get_by_id(payload["sub"])
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "user not found")
    return user
