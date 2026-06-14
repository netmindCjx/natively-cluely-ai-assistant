import asyncio
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class LimitRule:
    """Allow at most `max_count` events from one key within `window_seconds`."""

    window_seconds: int
    max_count: int
    label: str  # human-readable, used in error messages


class RateLimiter(Protocol):
    async def check_and_consume(self, key: str, rules: list[LimitRule]) -> LimitRule | None:
        """Return the first failing rule, or None if all rules pass (event recorded)."""
        ...


class InMemoryRateLimiter:
    """Sliding-window rate limiter. Single-process only — replace with Redis for multi-instance."""

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def check_and_consume(self, key: str, rules: list[LimitRule]) -> LimitRule | None:
        if not rules:
            return None
        max_window = max(r.window_seconds for r in rules)
        async with self._lock:
            now = time.monotonic()
            history = self._hits[key]
            # Prune events older than the widest window we care about.
            cutoff = now - max_window
            while history and history[0] < cutoff:
                history.popleft()
            # Check each rule against the existing history.
            for rule in rules:
                window_start = now - rule.window_seconds
                count = sum(1 for ts in history if ts >= window_start)
                if count >= rule.max_count:
                    return rule
            history.append(now)
        return None


PHONE_RULES = [
    LimitRule(window_seconds=60, max_count=1, label="同一手机号 60 秒只能发 1 次"),
    LimitRule(window_seconds=3600, max_count=5, label="同一手机号 1 小时内最多 5 次"),
    LimitRule(window_seconds=86400, max_count=10, label="同一手机号 24 小时内最多 10 次"),
]

IP_RULES = [
    LimitRule(window_seconds=86400, max_count=20, label="同一 IP 24 小时内最多 20 次"),
]
