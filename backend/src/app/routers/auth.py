import re
from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from ..config import get_settings
from ..deps import (
    get_captcha_verifier,
    get_current_user,
    get_jwt_service,
    get_rate_limiter,
    get_sms_sender,
    get_user_repo,
)
from ..services.aliyun_captcha import CaptchaVerifier
from ..services.aliyun_pnvs import SmsSender
from ..services.jwt_service import JwtService
from ..services.rate_limiter import IP_RULES, PHONE_RULES, RateLimiter
from ..services.user_repo import User, UserRepo

router = APIRouter(prefix="/auth", tags=["auth"])

CN_PHONE_RE = re.compile(r"^(?:\+?86)?1[3-9]\d{9}$")


def _normalize_phone(raw: str) -> str:
    digits = raw.strip().replace(" ", "").replace("-", "")
    if not CN_PHONE_RE.match(digits):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="invalid Chinese mainland phone number",
        )
    return digits[-11:]


class SmsSendRequest(BaseModel):
    phone: Annotated[str, Field(min_length=11, max_length=14)]
    captcha_token: str | None = None  # placeholder for Aliyun Captcha 2.0 ticket


class SmsSendResponse(BaseModel):
    sent: bool
    request_id: str


class SmsVerifyRequest(BaseModel):
    phone: Annotated[str, Field(min_length=11, max_length=14)]
    code: Annotated[str, Field(min_length=4, max_length=8, pattern=r"^\d+$")]


class TokenResponse(BaseModel):
    user_id: str
    phone: str
    access_token: str
    refresh_token: str
    access_expires_in: int
    refresh_expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class MeResponse(BaseModel):
    id: str
    phone: str
    created_at: str
    last_login_at: str


@router.post("/sms/send", response_model=SmsSendResponse)
async def send_sms_code(
    body: SmsSendRequest,
    request: Request,
    sms: Annotated[SmsSender, Depends(get_sms_sender)],
    captcha: Annotated[CaptchaVerifier, Depends(get_captcha_verifier)],
    limiter: Annotated[RateLimiter, Depends(get_rate_limiter)],
) -> SmsSendResponse:
    phone = _normalize_phone(body.phone)
    client_ip = request.client.host if request.client else "unknown"
    settings = get_settings()
    if settings.captcha_enabled:
        if not body.captcha_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="captcha_token required"
            )
        captcha_result = await captcha.verify(body.captcha_token)
        if not captcha_result.passed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"captcha failed: {captcha_result.code}",
            )
    phone_block = await limiter.check_and_consume(f"sms:phone:{phone}", PHONE_RULES)
    if phone_block:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=phone_block.label)
    ip_block = await limiter.check_and_consume(f"sms:ip:{client_ip}", IP_RULES)
    if ip_block:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=ip_block.label)
    result = await sms.send_verify_code(phone)
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"sms provider error: {result.code} {result.message}",
        )
    return SmsSendResponse(sent=True, request_id=result.request_id)


@router.post("/sms/verify", response_model=TokenResponse)
async def verify_sms_code(
    body: SmsVerifyRequest,
    sms: Annotated[SmsSender, Depends(get_sms_sender)],
    repo: Annotated[UserRepo, Depends(get_user_repo)],
    jwt_svc: Annotated[JwtService, Depends(get_jwt_service)],
) -> TokenResponse:
    phone = _normalize_phone(body.phone)
    result = await sms.check_verify_code(phone, body.code)
    if not result.matched:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"verification failed: {result.code}",
        )
    user = await repo.upsert_by_phone(phone)
    tokens = jwt_svc.issue(user.id, user.phone)
    return TokenResponse(
        user_id=user.id,
        phone=user.phone,
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        access_expires_in=tokens.access_expires_in,
        refresh_expires_in=tokens.refresh_expires_in,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshRequest,
    repo: Annotated[UserRepo, Depends(get_user_repo)],
    jwt_svc: Annotated[JwtService, Depends(get_jwt_service)],
) -> TokenResponse:
    try:
        payload = jwt_svc.verify(body.refresh_token, expected_type="refresh")
    except jwt.PyJWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"invalid refresh token: {exc}") from exc
    user = await repo.get_by_id(payload["sub"])
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "user not found")
    tokens = jwt_svc.issue(user.id, user.phone)
    return TokenResponse(
        user_id=user.id,
        phone=user.phone,
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        access_expires_in=tokens.access_expires_in,
        refresh_expires_in=tokens.refresh_expires_in,
    )


@router.get("/me", response_model=MeResponse)
async def me(user: Annotated[User, Depends(get_current_user)]) -> MeResponse:
    return MeResponse(
        id=user.id,
        phone=user.phone,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )
