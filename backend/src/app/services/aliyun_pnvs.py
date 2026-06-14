import logging
from dataclasses import dataclass
from typing import Protocol

logger = logging.getLogger(__name__)


@dataclass
class SmsSendResult:
    success: bool
    request_id: str
    code: str
    message: str


@dataclass
class SmsCheckResult:
    matched: bool
    code: str
    message: str


class SmsSender(Protocol):
    async def send_verify_code(self, phone: str) -> SmsSendResult: ...
    async def check_verify_code(self, phone: str, code: str) -> SmsCheckResult: ...


class MockSmsSender:
    """Used when Aliyun creds are not configured. Always accepts "000000" as the code."""

    async def send_verify_code(self, phone: str) -> SmsSendResult:
        logger.warning("MOCK SMS to %s (Aliyun not configured) — use code 000000", phone)
        return SmsSendResult(success=True, request_id="mock-request-id", code="OK", message="mock")

    async def check_verify_code(self, phone: str, code: str) -> SmsCheckResult:
        if code == "000000":
            return SmsCheckResult(matched=True, code="OK", message="mock match")
        return SmsCheckResult(matched=False, code="VERIFY_NO_MATCH", message="mock mismatch")


class AliyunPnvsSmsSender:
    """Sends verification SMS via Aliyun PNVS "短信认证" (new product).

    Uses the official alibabacloud-dypnsapi20170525 SDK with system-provided signature
    and template (no business license, no signature/template review needed — only personal
    real-name auth required).

    The template content is fixed by Aliyun as:
      【速通互联验证码】您的验证码为${code}。尊敬的客户，以上验证码${min}分钟内有效，请注意保密，切勿告知他人。
    Aliyun generates the actual code and substitutes ##code## with it.
    """

    def __init__(
        self,
        access_key_id: str,
        access_key_secret: str,
        sign_name: str,
        template_code: str,
        valid_seconds: int,
        endpoint: str,
    ):
        from alibabacloud_dypnsapi20170525.client import Client as DypnsapiClient
        from alibabacloud_tea_openapi.models import Config

        cfg = Config(
            access_key_id=access_key_id,
            access_key_secret=access_key_secret,
            endpoint=endpoint,
        )
        self._client = DypnsapiClient(cfg)
        self._sign_name = sign_name
        self._template_code = template_code
        self._valid_seconds = valid_seconds

    async def send_verify_code(self, phone: str) -> SmsSendResult:
        import asyncio
        import json

        from alibabacloud_dypnsapi20170525 import models as dypns_models

        template_param = json.dumps(
            {"code": "##code##", "min": str(self._valid_seconds // 60)}, separators=(",", ":")
        )
        req = dypns_models.SendSmsVerifyCodeRequest(
            phone_number=phone,
            sign_name=self._sign_name,
            template_code=self._template_code,
            template_param=template_param,
            code_length=6,
            valid_time=self._valid_seconds,
            duplicate_policy=1,
            interval=60,
        )
        loop = asyncio.get_running_loop()
        try:
            resp = await loop.run_in_executor(None, self._client.send_sms_verify_code, req)
        except Exception as exc:
            return _result_from_sdk_exception(SmsSendResult, exc)
        body = resp.body
        return SmsSendResult(
            success=body.code == "OK",
            request_id=body.request_id or "",
            code=body.code or "",
            message=body.message or "",
        )

    async def check_verify_code(self, phone: str, code: str) -> SmsCheckResult:
        import asyncio

        from alibabacloud_dypnsapi20170525 import models as dypns_models

        req = dypns_models.CheckSmsVerifyCodeRequest(
            phone_number=phone,
            verify_code=code,
        )
        loop = asyncio.get_running_loop()
        try:
            resp = await loop.run_in_executor(None, self._client.check_sms_verify_code, req)
        except Exception as exc:
            return _result_from_sdk_exception(SmsCheckResult, exc)
        body = resp.body
        verify_result = getattr(getattr(body, "model", None), "verify_result", None)
        matched = body.code == "OK" and verify_result == "PASS"
        return SmsCheckResult(matched=matched, code=body.code or "", message=body.message or "")


def _result_from_sdk_exception(result_cls, exc: Exception):
    """Translate Aliyun SDK exception into a structured failure result."""
    code = getattr(exc, "code", None) or type(exc).__name__
    message = getattr(exc, "message", None) or str(exc)
    logger.error("Aliyun PNVS SDK error: code=%s message=%s", code, message)
    if result_cls is SmsSendResult:
        return SmsSendResult(success=False, request_id="", code=str(code), message=str(message))
    return SmsCheckResult(matched=False, code=str(code), message=str(message))
