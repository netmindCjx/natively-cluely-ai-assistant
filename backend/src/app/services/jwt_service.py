import time
from dataclasses import dataclass
from typing import Literal

import jwt

TokenType = Literal["access", "refresh"]


@dataclass
class TokenPair:
    access_token: str
    refresh_token: str
    access_expires_in: int
    refresh_expires_in: int


class JwtService:
    def __init__(
        self,
        secret: str,
        algorithm: str,
        access_ttl: int,
        refresh_ttl: int,
        issuer: str = "natively-backend",
    ):
        self._secret = secret
        self._alg = algorithm
        self._access_ttl = access_ttl
        self._refresh_ttl = refresh_ttl
        self._issuer = issuer

    def issue(self, user_id: str, phone: str) -> TokenPair:
        now = int(time.time())
        access = self._sign(user_id, phone, "access", now, self._access_ttl)
        refresh = self._sign(user_id, phone, "refresh", now, self._refresh_ttl)
        return TokenPair(
            access_token=access,
            refresh_token=refresh,
            access_expires_in=self._access_ttl,
            refresh_expires_in=self._refresh_ttl,
        )

    def verify(self, token: str, expected_type: TokenType) -> dict:
        payload = jwt.decode(
            token,
            self._secret,
            algorithms=[self._alg],
            issuer=self._issuer,
            options={"require": ["exp", "iat", "sub", "type", "iss"]},
        )
        if payload.get("type") != expected_type:
            raise jwt.InvalidTokenError(
                f"token type mismatch: expected {expected_type}, got {payload.get('type')}"
            )
        return payload

    def _sign(self, user_id: str, phone: str, token_type: TokenType, now: int, ttl: int) -> str:
        payload = {
            "sub": user_id,
            "phone": phone,
            "type": token_type,
            "iat": now,
            "exp": now + ttl,
            "iss": self._issuer,
        }
        return jwt.encode(payload, self._secret, algorithm=self._alg)
