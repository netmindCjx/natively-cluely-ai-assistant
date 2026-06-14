import logging
from dataclasses import dataclass
from typing import Protocol

logger = logging.getLogger(__name__)


@dataclass
class CaptchaVerifyResult:
    passed: bool
    code: str
    message: str


class CaptchaVerifier(Protocol):
    async def verify(self, captcha_verify_param: str) -> CaptchaVerifyResult: ...


class NoopCaptchaVerifier:
    """Used when Captcha is not configured. Always passes — DEV ONLY."""

    async def verify(self, captcha_verify_param: str) -> CaptchaVerifyResult:
        logger.warning(
            "Captcha verification SKIPPED (CAPTCHA_SCENE_ID not configured) — DO NOT use in prod"
        )
        return CaptchaVerifyResult(passed=True, code="NOOP", message="captcha not configured")


class AliyunCaptchaVerifier:
    """Verifies a Captcha 2.0 token (CaptchaVerifyParam) via VerifyIntelligentCaptcha API.

    The client-side Captcha SDK (web/H5/Electron) produces a single opaque string that the
    business client passes through to this backend. We forward it verbatim — modifying it
    causes a verification error.
    """

    def __init__(self, access_key_id: str, access_key_secret: str, scene_id: str, endpoint: str):
        from alibabacloud_captcha20230305.client import Client as CaptchaClient
        from alibabacloud_tea_openapi.models import Config

        cfg = Config(
            access_key_id=access_key_id,
            access_key_secret=access_key_secret,
            endpoint=endpoint,
        )
        self._client = CaptchaClient(cfg)
        self._scene_id = scene_id

    async def verify(self, captcha_verify_param: str) -> CaptchaVerifyResult:
        import asyncio

        from alibabacloud_captcha20230305 import models as captcha_models

        req = captcha_models.VerifyIntelligentCaptchaRequest(
            captcha_verify_param=captcha_verify_param, scene_id=self._scene_id
        )
        try:
            resp = await asyncio.get_running_loop().run_in_executor(
                None, self._client.verify_intelligent_captcha, req
            )
        except Exception as exc:
            code = getattr(exc, "code", None) or type(exc).__name__
            message = getattr(exc, "message", None) or str(exc)
            logger.error("Aliyun Captcha SDK error: code=%s message=%s", code, message)
            return CaptchaVerifyResult(passed=False, code=str(code), message=str(message))
        body = resp.body
        result = body.result
        verify_code = getattr(result, "verify_code", None) or ""
        passed = bool(getattr(result, "verify_result", False))
        return CaptchaVerifyResult(passed=passed, code=verify_code, message=body.message or "")
