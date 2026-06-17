# LLM 网关 阶段1（后端） Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 FastAPI 后端实现一个计费 LLM 网关（`/llm/json`、`/llm/chat` SSE、`/llm/models`、`/llm/quota`），持平台密钥、按 token/credits 计量与配额放行/拒绝，作为客户端后续接入的地基。

**Architecture:** 新增三层——`model_catalog`（逻辑模型→上游 provider/模型/单价/tier 映射）、`Provider` 抽象 + OpenAI 兼容实现（覆盖 Netmind/OpenAI/Groq 同一 wire 格式，Gemini/Anthropic 用同一 Protocol 后续接）、`LLMGateway` 编排（解析模型+回退链）。计量侧 `UsageRepo`（InMemory/Supabase 双实现，沿用现有 `data_repo` 模式）+ `UsageMeter`（配额检查/记账）。Router 把鉴权→配额→网关→记账串起来。

**Tech Stack:** FastAPI, pydantic v2, httpx（流式 + `MockTransport` 测试）, pytest + pytest-asyncio（`asyncio_mode=auto`, `pythonpath=src`）, uv, ruff。所有命令在 `backend/` 目录下运行。

**范围说明：** 本计划只含阶段1后端。客户端改写、`/llm/embeddings`、STT WS 反代、Gemini/Anthropic 真实 provider 各为后续独立 plan/任务。Provider 真实实现本期只交付 OpenAI 兼容族（三家同 wire 格式）。

---

## File Structure

```
backend/
  tests/
    conftest.py                      # 新增：fixtures（settings 覆盖、InMemory repos、TestClient、token、fake provider/gateway 注入）
    test_usage_meter.py              # 新增
    test_model_catalog.py            # 新增
    test_openai_compat_provider.py   # 新增
    test_llm_gateway.py              # 新增
    test_llm_router_json.py          # 新增
    test_llm_router_chat.py          # 新增
    test_llm_router_models_quota.py  # 新增
  src/app/
    config.py                        # 修改：加平台密钥字段
    main.py                          # 修改：include llm.router
    deps.py                          # 修改：get_usage_repo / get_usage_meter / get_llm_gateway
    services/
      llm_types.py                   # 新增：ChatMessage/Usage/ChatDelta/GenResult/QuotaStatus + 异常
      model_catalog.py               # 新增：ModelSpec + CATALOG + PLANS
      providers/__init__.py          # 新增
      providers/base.py              # 新增：Provider Protocol
      providers/openai_compat.py     # 新增：OpenAI 兼容 provider（httpx 流式 + json）
      llm_gateway.py                 # 新增：LLMGateway 编排 + 回退
      usage_repo.py                  # 新增：UsageRepo Protocol + InMemory + Supabase
      usage_meter.py                 # 新增：UsageMeter（配额检查/记账）
    routers/
      llm.py                         # 新增：/llm/* 端点
  migrations/
    009_plans.sql                    # 新增
    010_usage.sql                    # 新增
  .env.example                       # 修改：平台密钥占位
```

---

## Task 0: 测试脚手架 conftest

**Files:**
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: 写 conftest fixtures**

```python
# backend/tests/conftest.py
"""Shared fixtures for backend tests. No real network or Supabase — everything in-memory."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.deps import get_current_user, get_usage_repo, get_usage_meter, get_llm_gateway
from app.services.user_repo import User
from app.services.usage_repo import InMemoryUsageRepo
from app.services.usage_meter import UsageMeter
from app.services.model_catalog import CATALOG, PLANS
from app.services.llm_types import ChatDelta, Usage, GenResult


TEST_USER = User(id="u-test", phone="+10000000000", created_at="2026-01-01", last_login_at="2026-01-01")


class FakeProvider:
    """Deterministic provider for gateway/router tests. No network."""
    name = "fake"

    def __init__(self, fail: bool = False):
        self.fail = fail

    async def stream_chat(self, model, messages, images, params):
        if self.fail:
            raise RuntimeError("provider down")
        for piece in ["Hello", " world"]:
            yield ChatDelta(text=piece)
        yield ChatDelta(usage=Usage(input_tokens=10, output_tokens=2))

    async def generate_json(self, model, messages, params):
        if self.fail:
            raise RuntimeError("provider down")
        return GenResult(text='{"ok": true}', usage=Usage(input_tokens=8, output_tokens=4), model=model)


@pytest.fixture
def usage_repo():
    return InMemoryUsageRepo()


@pytest.fixture
def usage_meter(usage_repo):
    return UsageMeter(usage_repo, CATALOG, PLANS)


@pytest.fixture
def fake_gateway():
    from app.services.llm_gateway import LLMGateway
    return LLMGateway(catalog=CATALOG, providers={"openai_compat": FakeProvider()})


@pytest.fixture
def client(usage_repo, usage_meter, fake_gateway):
    app.dependency_overrides[get_current_user] = lambda: TEST_USER
    app.dependency_overrides[get_usage_repo] = lambda: usage_repo
    app.dependency_overrides[get_usage_meter] = lambda: usage_meter
    app.dependency_overrides[get_llm_gateway] = lambda: fake_gateway
    yield TestClient(app)
    app.dependency_overrides.clear()
```

- [ ] **Step 2: 提交**

```bash
git add backend/tests/conftest.py
git commit -m "test: add backend conftest with in-memory fixtures for llm gateway"
```

> 注：本任务引用的 `usage_repo`/`usage_meter`/`model_catalog`/`llm_gateway`/`llm_types` 在后续任务创建。conftest 在 Task 1–7 完成前无法 import 成功，这是预期的——Task 0 仅锁定测试接口形状，首个能跑通的测试在 Task 2。

---

## Task 1: 计量/套餐 migrations（Supabase 生产库）

**Files:**
- Create: `backend/migrations/009_plans.sql`
- Create: `backend/migrations/010_usage.sql`

- [ ] **Step 1: 写 009_plans.sql**

```sql
-- 套餐与用户订阅。InMemory 回退在 usage_repo 内置默认套餐，本表仅用于 Supabase 生产。
create table if not exists public.plans (
    id                 text primary key,           -- 'free' | 'pro' | ...
    label              text not null,
    credits_per_period bigint not null,            -- 周期内 credits 上限
    period             text not null default 'month',  -- 'month' | 'week'
    allowed_tiers      text[] not null default '{free}', -- 可解锁的模型 tier
    created_at         timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
    user_id      uuid primary key references public.users(id) on delete cascade,
    plan_id      text not null references public.plans(id),
    period_start timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

insert into public.plans (id, label, credits_per_period, period, allowed_tiers)
values ('free', 'Free', 1000, 'month', '{free}')
on conflict (id) do nothing;
insert into public.plans (id, label, credits_per_period, period, allowed_tiers)
values ('pro', 'Pro', 100000, 'month', '{free,pro}')
on conflict (id) do nothing;
```

- [ ] **Step 2: 写 010_usage.sql**

```sql
-- 每次 LLM 调用的用量事件。credits 已按模型单价换算。
create table if not exists public.usage_events (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references public.users(id) on delete cascade,
    kind          text not null,        -- 'chat' | 'json' | 'embeddings' | 'stt'
    model         text not null,        -- 逻辑模型 id
    input_tokens  bigint not null default 0,
    output_tokens bigint not null default 0,
    audio_seconds double precision not null default 0,
    credits       bigint not null default 0,
    created_at    timestamptz not null default now()
);

create index if not exists usage_events_user_time_idx
    on public.usage_events (user_id, created_at);

alter table public.usage_events enable row level security;
alter table public.user_subscriptions enable row level security;
```

- [ ] **Step 3: 提交**

```bash
git add backend/migrations/009_plans.sql backend/migrations/010_usage.sql
git commit -m "feat(db): add plans, subscriptions and usage_events tables"
```

---

## Task 2: 共享类型 llm_types

**Files:**
- Create: `backend/src/app/services/llm_types.py`
- Test: `backend/tests/test_usage_meter.py`（本任务先建空壳 import 验证）

- [ ] **Step 1: 写类型**

```python
# backend/src/app/services/llm_types.py
"""Provider-agnostic value types shared by the gateway, meter and routers."""
from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Protocol


@dataclass
class ChatMessage:
    role: str          # "system" | "user" | "assistant"
    content: str


@dataclass
class Usage:
    input_tokens: int = 0
    output_tokens: int = 0


@dataclass
class ChatDelta:
    """One streamed piece. `usage` is set only on the final bookkeeping chunk."""
    text: str = ""
    usage: Usage | None = None


@dataclass
class GenResult:
    text: str
    usage: Usage
    model: str         # actual upstream model used


@dataclass
class QuotaStatus:
    plan: str
    period_start: str
    period_end: str
    credits_total: int
    credits_used: int

    @property
    def credits_remaining(self) -> int:
        return max(0, self.credits_total - self.credits_used)

    @property
    def exhausted(self) -> bool:
        return self.credits_used >= self.credits_total


class QuotaExceeded(Exception):
    def __init__(self, status: QuotaStatus):
        self.status = status
        super().__init__("quota exceeded")


class NoModelAvailable(Exception):
    """Raised by the gateway when no provider in the fallback chain succeeded."""


class ChatStream(Protocol):
    def __aiter__(self) -> AsyncIterator[ChatDelta]: ...
```

- [ ] **Step 2: 写一个 smoke import 测试**

```python
# backend/tests/test_usage_meter.py
from app.services.llm_types import QuotaStatus


def test_quota_remaining_and_exhausted():
    q = QuotaStatus(plan="free", period_start="a", period_end="b", credits_total=100, credits_used=30)
    assert q.credits_remaining == 70
    assert q.exhausted is False
    q2 = QuotaStatus(plan="free", period_start="a", period_end="b", credits_total=100, credits_used=100)
    assert q2.credits_remaining == 0
    assert q2.exhausted is True
```

- [ ] **Step 3: 跑测试，预期通过**

Run: `uv run pytest tests/test_usage_meter.py::test_quota_remaining_and_exhausted -v`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add backend/src/app/services/llm_types.py backend/tests/test_usage_meter.py
git commit -m "feat(llm): add shared llm value types"
```

---

## Task 3: 模型目录 model_catalog

**Files:**
- Create: `backend/src/app/services/model_catalog.py`
- Test: `backend/tests/test_model_catalog.py`

- [ ] **Step 1: 写失败测试**

```python
# backend/tests/test_model_catalog.py
from app.services.model_catalog import CATALOG, PLANS, credits_for


def test_catalog_has_free_and_pro_models():
    tiers = {m.tier for m in CATALOG.values()}
    assert "free" in tiers and "pro" in tiers


def test_every_model_points_at_a_known_provider():
    for m in CATALOG.values():
        assert m.provider == "openai_compat"
        assert m.base_url.startswith("http")
        assert m.key_env  # non-empty


def test_credits_rounds_up_from_tokens():
    spec = next(iter(CATALOG.values()))
    # 1000 in @ cpi, 1000 out @ cpo → exactly cpi+cpo credits, min 1
    c = credits_for(spec, input_tokens=1000, output_tokens=1000)
    assert c >= 1


def test_plans_define_free_and_pro():
    assert PLANS["free"].credits_per_period > 0
    assert "pro" in PLANS["pro"].allowed_tiers
```

- [ ] **Step 2: 跑，预期失败**

Run: `uv run pytest tests/test_model_catalog.py -v`
Expected: FAIL（ModuleNotFoundError: model_catalog）

- [ ] **Step 3: 写实现**

```python
# backend/src/app/services/model_catalog.py
"""Logical model catalog: maps client-facing model ids to upstream provider config,
pricing (credits) and the plan tier required to use them. Single source of truth for
both the gateway (which provider/model to call) and /llm/models (what to expose)."""
from __future__ import annotations

import math
from dataclasses import dataclass, field

NETMIND_BASE = "https://api.netmind.ai/inference-api/openai/v1"
OPENAI_BASE = "https://api.openai.com/v1"
GROQ_BASE = "https://api.groq.com/openai/v1"


@dataclass(frozen=True)
class ModelSpec:
    id: str                       # logical id, e.g. "answer-pro"
    label: str
    tier: str                     # "free" | "pro"
    provider: str                 # "openai_compat"
    upstream_model: str           # actual model name sent upstream
    base_url: str
    key_env: str                  # settings attribute holding the platform key
    capabilities: tuple[str, ...] = ("text", "json")
    credits_per_1k_input: float = 1.0
    credits_per_1k_output: float = 3.0
    fallbacks: tuple[str, ...] = ()   # logical ids tried if this one fails


@dataclass(frozen=True)
class Plan:
    id: str
    label: str
    credits_per_period: int
    period: str                   # "month" | "week"
    allowed_tiers: tuple[str, ...]


CATALOG: dict[str, ModelSpec] = {
    "answer-fast": ModelSpec(
        id="answer-fast", label="Fast", tier="free", provider="openai_compat",
        upstream_model="llama-3.3-70b-versatile", base_url=GROQ_BASE, key_env="groq_api_key",
        capabilities=("text", "json"), credits_per_1k_input=0.5, credits_per_1k_output=1.5,
        fallbacks=("answer-pro",),
    ),
    "answer-pro": ModelSpec(
        id="answer-pro", label="Pro", tier="pro", provider="openai_compat",
        upstream_model="gpt-4o", base_url=OPENAI_BASE, key_env="openai_api_key",
        capabilities=("text", "json", "vision"), credits_per_1k_input=5.0, credits_per_1k_output=15.0,
        fallbacks=("answer-netmind",),
    ),
    "answer-netmind": ModelSpec(
        id="answer-netmind", label="Netmind", tier="pro", provider="openai_compat",
        upstream_model="deepseek-ai/DeepSeek-V3", base_url=NETMIND_BASE, key_env="netmind_api_key",
        capabilities=("text", "json"), credits_per_1k_input=1.0, credits_per_1k_output=2.0,
    ),
}

PLANS: dict[str, Plan] = {
    "free": Plan("free", "Free", 1000, "month", ("free",)),
    "pro": Plan("pro", "Pro", 100000, "month", ("free", "pro")),
}

DEFAULT_PLAN = "free"


def credits_for(spec: ModelSpec, input_tokens: int, output_tokens: int) -> int:
    raw = (input_tokens / 1000.0) * spec.credits_per_1k_input + (
        output_tokens / 1000.0
    ) * spec.credits_per_1k_output
    return max(1, math.ceil(raw))
```

- [ ] **Step 4: 跑，预期通过**

Run: `uv run pytest tests/test_model_catalog.py -v`
Expected: PASS（4 passed）

- [ ] **Step 5: 提交**

```bash
git add backend/src/app/services/model_catalog.py backend/tests/test_model_catalog.py
git commit -m "feat(llm): add logical model catalog with pricing and plans"
```

---

## Task 4: UsageRepo（InMemory + Supabase）

**Files:**
- Create: `backend/src/app/services/usage_repo.py`
- Test: `backend/tests/test_usage_meter.py`（追加）

- [ ] **Step 1: 追加失败测试**

```python
# backend/tests/test_usage_meter.py  (append)
import pytest
from app.services.usage_repo import InMemoryUsageRepo


async def test_record_and_sum_credits_in_period():
    repo = InMemoryUsageRepo()
    await repo.record_event("u1", kind="json", model="answer-pro",
                            input_tokens=1000, output_tokens=1000, credits=20)
    await repo.record_event("u1", kind="chat", model="answer-pro",
                            input_tokens=500, output_tokens=500, credits=10)
    used = await repo.credits_used_since("u1", since="1970-01-01T00:00:00+00:00")
    assert used == 30


async def test_default_plan_is_free():
    repo = InMemoryUsageRepo()
    assert await repo.get_plan_id("nobody") == "free"


async def test_set_and_get_plan():
    repo = InMemoryUsageRepo()
    await repo.set_plan("u1", "pro")
    assert await repo.get_plan_id("u1") == "pro"
```

- [ ] **Step 2: 跑，预期失败**

Run: `uv run pytest tests/test_usage_meter.py -v`
Expected: FAIL（ModuleNotFoundError: usage_repo）

- [ ] **Step 3: 写实现**

```python
# backend/src/app/services/usage_repo.py
"""Usage events + per-user plan assignment. Mirrors the data_repo dual-impl pattern:
InMemoryUsageRepo for dev/test, SupabaseUsageRepo for prod (service-role key)."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Protocol

from .model_catalog import DEFAULT_PLAN

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class UsageRepo(Protocol):
    async def record_event(
        self, user_id: str, *, kind: str, model: str,
        input_tokens: int = 0, output_tokens: int = 0, audio_seconds: float = 0.0, credits: int = 0,
    ) -> None: ...
    async def credits_used_since(self, user_id: str, since: str) -> int: ...
    async def get_plan_id(self, user_id: str) -> str: ...
    async def set_plan(self, user_id: str, plan_id: str) -> None: ...
    async def get_period_start(self, user_id: str) -> str | None: ...


class InMemoryUsageRepo:
    def __init__(self) -> None:
        self._events: list[dict] = []
        self._plans: dict[str, str] = {}
        self._period_start: dict[str, str] = {}

    async def record_event(self, user_id, *, kind, model, input_tokens=0, output_tokens=0,
                           audio_seconds=0.0, credits=0) -> None:
        self._events.append({
            "user_id": user_id, "kind": kind, "model": model,
            "input_tokens": input_tokens, "output_tokens": output_tokens,
            "audio_seconds": audio_seconds, "credits": credits, "created_at": _now_iso(),
        })

    async def credits_used_since(self, user_id, since) -> int:
        return sum(
            e["credits"] for e in self._events
            if e["user_id"] == user_id and e["created_at"] >= since
        )

    async def get_plan_id(self, user_id) -> str:
        return self._plans.get(user_id, DEFAULT_PLAN)

    async def set_plan(self, user_id, plan_id) -> None:
        self._plans[user_id] = plan_id
        self._period_start.setdefault(user_id, _now_iso())

    async def get_period_start(self, user_id) -> str | None:
        return self._period_start.get(user_id)


class SupabaseUsageRepo:
    """Prod impl. Uses the supabase service-role client like SupabaseUserRepo."""
    def __init__(self, url: str, service_role_key: str) -> None:
        from supabase import create_client
        self._db = create_client(url, service_role_key)

    async def record_event(self, user_id, *, kind, model, input_tokens=0, output_tokens=0,
                           audio_seconds=0.0, credits=0) -> None:
        self._db.table("usage_events").insert({
            "user_id": user_id, "kind": kind, "model": model,
            "input_tokens": input_tokens, "output_tokens": output_tokens,
            "audio_seconds": audio_seconds, "credits": credits,
        }).execute()

    async def credits_used_since(self, user_id, since) -> int:
        res = (
            self._db.table("usage_events").select("credits")
            .eq("user_id", user_id).gte("created_at", since).execute()
        )
        return sum(int(r["credits"]) for r in (res.data or []))

    async def get_plan_id(self, user_id) -> str:
        res = (
            self._db.table("user_subscriptions").select("plan_id")
            .eq("user_id", user_id).limit(1).execute()
        )
        rows = res.data or []
        return rows[0]["plan_id"] if rows else DEFAULT_PLAN

    async def set_plan(self, user_id, plan_id) -> None:
        self._db.table("user_subscriptions").upsert(
            {"user_id": user_id, "plan_id": plan_id, "updated_at": _now_iso()}
        ).execute()

    async def get_period_start(self, user_id) -> str | None:
        res = (
            self._db.table("user_subscriptions").select("period_start")
            .eq("user_id", user_id).limit(1).execute()
        )
        rows = res.data or []
        return rows[0]["period_start"] if rows else None
```

- [ ] **Step 4: 跑，预期通过**

Run: `uv run pytest tests/test_usage_meter.py -v`
Expected: PASS（4 passed：含 Task 2 那条）

- [ ] **Step 5: 提交**

```bash
git add backend/src/app/services/usage_repo.py backend/tests/test_usage_meter.py
git commit -m "feat(llm): add usage repo (in-memory + supabase) for events and plans"
```

---

## Task 5: UsageMeter（配额检查 + 记账）

**Files:**
- Create: `backend/src/app/services/usage_meter.py`
- Test: `backend/tests/test_usage_meter.py`（追加）

- [ ] **Step 1: 追加失败测试**

```python
# backend/tests/test_usage_meter.py  (append)
from app.services.model_catalog import CATALOG, PLANS
from app.services.usage_meter import UsageMeter
from app.services.llm_types import QuotaExceeded, Usage


async def test_status_reflects_recorded_usage():
    repo = InMemoryUsageRepo()
    meter = UsageMeter(repo, CATALOG, PLANS)
    spec = CATALOG["answer-netmind"]
    await meter.record("u1", kind="json", spec=spec, usage=Usage(input_tokens=1000, output_tokens=1000))
    status = await meter.status("u1")
    assert status.plan == "free"
    assert status.credits_total == PLANS["free"].credits_per_period
    assert status.credits_used == 3   # 1*1 + 1*2 = 3 credits


async def test_check_raises_when_exhausted():
    repo = InMemoryUsageRepo()
    meter = UsageMeter(repo, CATALOG, PLANS)
    # Free plan = 1000 credits. Burn it all via one big event.
    spec = CATALOG["answer-netmind"]
    await repo.record_event("u1", kind="json", model=spec.id,
                            input_tokens=0, output_tokens=500_000, credits=1000)
    with pytest.raises(QuotaExceeded):
        await meter.check("u1")


async def test_check_passes_when_under_quota():
    repo = InMemoryUsageRepo()
    meter = UsageMeter(repo, CATALOG, PLANS)
    status = await meter.check("u1")   # no usage yet
    assert status.credits_remaining == PLANS["free"].credits_per_period
```

- [ ] **Step 2: 跑，预期失败**

Run: `uv run pytest tests/test_usage_meter.py -v`
Expected: FAIL（ModuleNotFoundError: usage_meter）

- [ ] **Step 3: 写实现**

```python
# backend/src/app/services/usage_meter.py
"""Quota enforcement + usage recording. Stateless over UsageRepo + catalog/plans."""
from __future__ import annotations

from datetime import datetime, timezone

from .llm_types import QuotaExceeded, QuotaStatus, Usage
from .model_catalog import CATALOG as _CATALOG  # noqa: F401  (re-exported for callers)
from .model_catalog import ModelSpec, Plan, credits_for
from .usage_repo import UsageRepo


def _period_bounds(period: str, anchor_iso: str | None) -> tuple[str, str]:
    """Return (start, end) ISO strings for the current period. Calendar-month aligned
    to UTC when no explicit anchor; weekly is a rolling 7-day window from anchor/now."""
    now = datetime.now(timezone.utc)
    if period == "week":
        start = anchor_dt = (
            datetime.fromisoformat(anchor_iso) if anchor_iso else now
        )
        # roll forward in 7-day steps until we contain `now`
        while (now - start).days >= 7:
            start = start.replace()  # placeholder; replaced below
            from datetime import timedelta
            start = start + timedelta(days=7)
        from datetime import timedelta
        end = start + timedelta(days=7)
        return start.isoformat(), end.isoformat()
    # month (default): first of this month → first of next month, UTC
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start.isoformat(), end.isoformat()


class UsageMeter:
    def __init__(self, repo: UsageRepo, catalog: dict[str, ModelSpec], plans: dict[str, Plan]):
        self._repo = repo
        self._catalog = catalog
        self._plans = plans

    async def status(self, user_id: str) -> QuotaStatus:
        plan_id = await self._repo.get_plan_id(user_id)
        plan = self._plans.get(plan_id, self._plans["free"])
        anchor = await self._repo.get_period_start(user_id)
        start, end = _period_bounds(plan.period, anchor)
        used = await self._repo.credits_used_since(user_id, start)
        return QuotaStatus(
            plan=plan.id, period_start=start, period_end=end,
            credits_total=plan.credits_per_period, credits_used=used,
        )

    async def check(self, user_id: str) -> QuotaStatus:
        st = await self.status(user_id)
        if st.exhausted:
            raise QuotaExceeded(st)
        return st

    async def record(self, user_id: str, *, kind: str, spec: ModelSpec, usage: Usage,
                     audio_seconds: float = 0.0) -> int:
        credits = credits_for(spec, usage.input_tokens, usage.output_tokens)
        if audio_seconds:
            credits = max(credits, max(1, round(audio_seconds)))
        await self._repo.record_event(
            user_id, kind=kind, model=spec.id,
            input_tokens=usage.input_tokens, output_tokens=usage.output_tokens,
            audio_seconds=audio_seconds, credits=credits,
        )
        return credits

    def plan_allowed_tiers(self, plan_id: str) -> tuple[str, ...]:
        plan = self._plans.get(plan_id, self._plans["free"])
        return plan.allowed_tiers
```

- [ ] **Step 4: 跑，预期通过**

Run: `uv run pytest tests/test_usage_meter.py -v`
Expected: PASS（7 passed）

- [ ] **Step 5: 简化 `_period_bounds` 周线逻辑（清理占位行）**

把 Step 3 里 `period == "week"` 分支替换为干净版本：

```python
    if period == "week":
        from datetime import timedelta
        start = datetime.fromisoformat(anchor_iso) if anchor_iso else now
        while now - start >= timedelta(days=7):
            start += timedelta(days=7)
        return start.isoformat(), (start + timedelta(days=7)).isoformat()
```

- [ ] **Step 6: 重跑，预期通过**

Run: `uv run pytest tests/test_usage_meter.py -v`
Expected: PASS（7 passed）

- [ ] **Step 7: 提交**

```bash
git add backend/src/app/services/usage_meter.py backend/tests/test_usage_meter.py
git commit -m "feat(llm): add usage meter for quota checks and credit recording"
```

---

## Task 6: Provider 抽象 + OpenAI 兼容实现

**Files:**
- Create: `backend/src/app/services/providers/__init__.py`
- Create: `backend/src/app/services/providers/base.py`
- Create: `backend/src/app/services/providers/openai_compat.py`
- Test: `backend/tests/test_openai_compat_provider.py`

- [ ] **Step 1: 写 Provider Protocol + 包 init**

```python
# backend/src/app/services/providers/__init__.py
```

```python
# backend/src/app/services/providers/base.py
from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Protocol

from ..llm_types import ChatDelta, ChatMessage, GenResult


class Provider(Protocol):
    name: str

    def stream_chat(
        self, model: str, messages: list[ChatMessage], images: list[str], params: dict
    ) -> AsyncIterator[ChatDelta]: ...

    async def generate_json(
        self, model: str, messages: list[ChatMessage], params: dict
    ) -> GenResult: ...
```

- [ ] **Step 2: 写失败测试（用 httpx.MockTransport 伪造上游 SSE）**

```python
# backend/tests/test_openai_compat_provider.py
import json
import httpx
import pytest

from app.services.providers.openai_compat import OpenAICompatProvider
from app.services.llm_types import ChatMessage


def _sse(lines: list[str]) -> bytes:
    return ("".join(f"data: {l}\n\n" for l in lines)).encode()


def _make_client(handler):
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


async def test_stream_chat_yields_deltas_and_usage():
    def handler(req: httpx.Request) -> httpx.Response:
        body = _sse([
            json.dumps({"choices": [{"delta": {"content": "Hel"}}]}),
            json.dumps({"choices": [{"delta": {"content": "lo"}}]}),
            json.dumps({"choices": [{"delta": {}}], "usage": {"prompt_tokens": 7, "completion_tokens": 2}}),
            "[DONE]",
        ])
        return httpx.Response(200, content=body, headers={"content-type": "text/event-stream"})

    prov = OpenAICompatProvider(http=_make_client(handler), api_key="k", base_url="https://x/v1")
    texts, usage = [], None
    async for d in prov.stream_chat("m", [ChatMessage("user", "hi")], [], {}):
        if d.text:
            texts.append(d.text)
        if d.usage:
            usage = d.usage
    assert "".join(texts) == "Hello"
    assert usage.input_tokens == 7 and usage.output_tokens == 2


async def test_generate_json_returns_text_and_usage():
    def handler(req: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={
            "choices": [{"message": {"content": "{\"ok\": true}"}}],
            "usage": {"prompt_tokens": 5, "completion_tokens": 3},
        })

    prov = OpenAICompatProvider(http=_make_client(handler), api_key="k", base_url="https://x/v1")
    res = await prov.generate_json("m", [ChatMessage("user", "hi")], {})
    assert res.text == '{"ok": true}'
    assert res.usage.input_tokens == 5 and res.usage.output_tokens == 3


async def test_upstream_error_raises():
    def handler(req: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"error": "bad key"})

    prov = OpenAICompatProvider(http=_make_client(handler), api_key="k", base_url="https://x/v1")
    with pytest.raises(httpx.HTTPStatusError):
        await prov.generate_json("m", [ChatMessage("user", "hi")], {})
```

- [ ] **Step 3: 跑，预期失败**

Run: `uv run pytest tests/test_openai_compat_provider.py -v`
Expected: FAIL（ModuleNotFoundError: openai_compat）

- [ ] **Step 4: 写实现**

```python
# backend/src/app/services/providers/openai_compat.py
"""OpenAI-compatible chat completions provider. One class covers Netmind / OpenAI / Groq —
they share the same /chat/completions wire format. Streaming via SSE."""
from __future__ import annotations

import json
from collections.abc import AsyncIterator

import httpx

from ..llm_types import ChatDelta, ChatMessage, GenResult, Usage


def _to_wire(messages: list[ChatMessage], images: list[str]) -> list[dict]:
    out: list[dict] = [{"role": m.role, "content": m.content} for m in messages]
    if images and out:
        # attach images to the last user message as multimodal content parts
        last = out[-1]
        parts = [{"type": "text", "text": last["content"]}]
        for b64 in images:
            parts.append({"type": "image_url",
                          "image_url": {"url": f"data:image/png;base64,{b64}"}})
        last["content"] = parts
    return out


class OpenAICompatProvider:
    name = "openai_compat"

    def __init__(self, http: httpx.AsyncClient, api_key: str, base_url: str):
        self._http = http
        self._key = api_key
        self._base = base_url.rstrip("/")

    @property
    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self._key}", "content-type": "application/json"}

    async def stream_chat(
        self, model: str, messages: list[ChatMessage], images: list[str], params: dict
    ) -> AsyncIterator[ChatDelta]:
        payload = {
            "model": model,
            "messages": _to_wire(messages, images),
            "stream": True,
            "stream_options": {"include_usage": True},
            **params,
        }
        async with self._http.stream(
            "POST", f"{self._base}/chat/completions", headers=self._headers, json=payload
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data = line[6:].strip()
                if data == "[DONE]":
                    break
                obj = json.loads(data)
                choices = obj.get("choices") or []
                if choices:
                    delta = choices[0].get("delta", {}) or {}
                    text = delta.get("content") or ""
                    if text:
                        yield ChatDelta(text=text)
                usage = obj.get("usage")
                if usage:
                    yield ChatDelta(usage=Usage(
                        input_tokens=usage.get("prompt_tokens", 0),
                        output_tokens=usage.get("completion_tokens", 0),
                    ))

    async def generate_json(
        self, model: str, messages: list[ChatMessage], params: dict
    ) -> GenResult:
        payload = {
            "model": model,
            "messages": _to_wire(messages, []),
            "response_format": {"type": "json_object"},
            **params,
        }
        resp = await self._http.post(
            f"{self._base}/chat/completions", headers=self._headers, json=payload
        )
        resp.raise_for_status()
        obj = resp.json()
        text = obj["choices"][0]["message"]["content"]
        usage = obj.get("usage", {})
        return GenResult(
            text=text,
            usage=Usage(input_tokens=usage.get("prompt_tokens", 0),
                        output_tokens=usage.get("completion_tokens", 0)),
            model=model,
        )
```

- [ ] **Step 5: 跑，预期通过**

Run: `uv run pytest tests/test_openai_compat_provider.py -v`
Expected: PASS（3 passed）

- [ ] **Step 6: 提交**

```bash
git add backend/src/app/services/providers backend/tests/test_openai_compat_provider.py
git commit -m "feat(llm): add provider protocol and openai-compatible provider"
```

---

## Task 7: LLMGateway 编排 + 回退链

**Files:**
- Create: `backend/src/app/services/llm_gateway.py`
- Test: `backend/tests/test_llm_gateway.py`

- [ ] **Step 1: 写失败测试**

```python
# backend/tests/test_llm_gateway.py
import pytest

from app.services.llm_gateway import LLMGateway
from app.services.model_catalog import CATALOG
from app.services.llm_types import ChatMessage, ChatDelta, Usage, GenResult, NoModelAvailable


class _OkProvider:
    name = "openai_compat"
    async def stream_chat(self, model, messages, images, params):
        yield ChatDelta(text="hi")
        yield ChatDelta(usage=Usage(input_tokens=3, output_tokens=1))
    async def generate_json(self, model, messages, params):
        return GenResult(text="{}", usage=Usage(input_tokens=3, output_tokens=1), model=model)


class _FailProvider:
    name = "openai_compat"
    async def stream_chat(self, model, messages, images, params):
        raise RuntimeError("down")
        yield  # pragma: no cover
    async def generate_json(self, model, messages, params):
        raise RuntimeError("down")


def test_resolve_returns_spec_and_provider():
    gw = LLMGateway(CATALOG, {"openai_compat": _OkProvider()})
    spec, prov = gw.resolve("answer-pro")
    assert spec.id == "answer-pro"
    assert prov.name == "openai_compat"


def test_resolve_unknown_model_raises():
    gw = LLMGateway(CATALOG, {"openai_compat": _OkProvider()})
    with pytest.raises(NoModelAvailable):
        gw.resolve("does-not-exist")


async def test_generate_json_returns_spec_used():
    gw = LLMGateway(CATALOG, {"openai_compat": _OkProvider()})
    spec, res = await gw.generate_json("answer-pro", [ChatMessage("user", "hi")], {})
    assert spec.id == "answer-pro"
    assert res.text == "{}"


async def test_generate_json_falls_back_on_failure():
    # answer-pro fails → its fallback answer-netmind (same provider key) is tried.
    gw = LLMGateway(CATALOG, {"openai_compat": _FailProvider()})
    with pytest.raises(NoModelAvailable):
        await gw.generate_json("answer-pro", [ChatMessage("user", "hi")], {})


async def test_stream_chat_yields_text():
    gw = LLMGateway(CATALOG, {"openai_compat": _OkProvider()})
    spec_holder = {}
    chunks = []
    async for spec, delta in gw.stream_chat("answer-pro", [ChatMessage("user", "hi")], [], {}):
        spec_holder["spec"] = spec
        chunks.append(delta)
    assert spec_holder["spec"].id == "answer-pro"
    assert any(c.text == "hi" for c in chunks)
    assert any(c.usage for c in chunks)
```

- [ ] **Step 2: 跑，预期失败**

Run: `uv run pytest tests/test_llm_gateway.py -v`
Expected: FAIL（ModuleNotFoundError: llm_gateway）

- [ ] **Step 3: 写实现**

```python
# backend/src/app/services/llm_gateway.py
"""Provider-agnostic orchestration: resolve a logical model to its provider, run the
fallback chain, surface which spec actually served the request (for metering)."""
from __future__ import annotations

import logging
from collections.abc import AsyncIterator

from .llm_types import ChatDelta, ChatMessage, GenResult, NoModelAvailable
from .model_catalog import ModelSpec
from .providers.base import Provider

logger = logging.getLogger(__name__)


class LLMGateway:
    def __init__(self, catalog: dict[str, ModelSpec], providers: dict[str, Provider]):
        self._catalog = catalog
        self._providers = providers

    def resolve(self, model_id: str) -> tuple[ModelSpec, Provider]:
        spec = self._catalog.get(model_id)
        if not spec:
            raise NoModelAvailable(f"unknown model {model_id}")
        prov = self._providers.get(spec.provider)
        if not prov:
            raise NoModelAvailable(f"no provider for {spec.provider}")
        return spec, prov

    def _chain(self, model_id: str) -> list[str]:
        chain = [model_id]
        spec = self._catalog.get(model_id)
        if spec:
            chain.extend(f for f in spec.fallbacks if f in self._catalog)
        return chain

    async def generate_json(
        self, model_id: str, messages: list[ChatMessage], params: dict
    ) -> tuple[ModelSpec, GenResult]:
        errors = []
        for mid in self._chain(model_id):
            try:
                spec, prov = self.resolve(mid)
                res = await prov.generate_json(spec.upstream_model, messages, params)
                return spec, res
            except Exception as exc:  # noqa: BLE001 — fallback is intentional
                logger.warning("generate_json %s failed: %s", mid, exc)
                errors.append(f"{mid}: {exc}")
        raise NoModelAvailable("; ".join(errors) or model_id)

    async def stream_chat(
        self, model_id: str, messages: list[ChatMessage], images: list[str], params: dict
    ) -> AsyncIterator[tuple[ModelSpec, ChatDelta]]:
        errors = []
        for mid in self._chain(model_id):
            try:
                spec, prov = self.resolve(mid)
                stream = prov.stream_chat(spec.upstream_model, messages, images, params)
                # peek the first item so a provider that fails immediately can still fall back
                agen = stream.__aiter__()
                first = await agen.__anext__()
                yield spec, first
                async for delta in agen:
                    yield spec, delta
                return
            except StopAsyncIteration:
                return
            except Exception as exc:  # noqa: BLE001
                logger.warning("stream_chat %s failed: %s", mid, exc)
                errors.append(f"{mid}: {exc}")
        raise NoModelAvailable("; ".join(errors) or model_id)
```

- [ ] **Step 4: 跑，预期通过**

Run: `uv run pytest tests/test_llm_gateway.py -v`
Expected: PASS（5 passed）

> 说明：回退仅在「开始流式之前」失败时生效（首个 chunk 拿到前）。一旦已向客户端吐字再断流，无法重试——这是流式的固有限制，与客户端旧行为一致。

- [ ] **Step 5: 提交**

```bash
git add backend/src/app/services/llm_gateway.py backend/tests/test_llm_gateway.py
git commit -m "feat(llm): add gateway orchestration with provider fallback chain"
```

---

## Task 8: config 平台密钥 + deps 装配

**Files:**
- Modify: `backend/src/app/config.py`
- Modify: `backend/src/app/deps.py`
- Modify: `backend/.env.example`

- [ ] **Step 1: config 加平台密钥字段**

在 `backend/src/app/config.py` 的 `Settings` 内，`jwt_secret` 字段上方插入：

```python
    # Platform-held LLM/STT provider keys (gateway uses these; clients no longer hold keys).
    openai_api_key: str = Field(default="")
    gemini_api_key: str = Field(default="")
    anthropic_api_key: str = Field(default="")
    groq_api_key: str = Field(default="")
    netmind_api_key: str = Field(default="")
    deepgram_api_key: str = Field(default="")
```

- [ ] **Step 2: deps 加 usage_repo / usage_meter / llm_gateway**

在 `backend/src/app/deps.py` 末尾追加（并在文件顶部 import 区按需补充）：

```python
import httpx

from .services.llm_gateway import LLMGateway
from .services.model_catalog import CATALOG, PLANS
from .services.providers.openai_compat import OpenAICompatProvider
from .services.usage_meter import UsageMeter
from .services.usage_repo import InMemoryUsageRepo, SupabaseUsageRepo, UsageRepo


@lru_cache
def get_usage_repo() -> UsageRepo:
    settings = get_settings()
    if not settings.supabase_enabled:
        return InMemoryUsageRepo()
    return SupabaseUsageRepo(url=settings.supabase_url, service_role_key=settings.supabase_service_role_key)


def get_usage_meter(repo: UsageRepo = Depends(get_usage_repo)) -> UsageMeter:
    return UsageMeter(repo, CATALOG, PLANS)


@lru_cache
def get_llm_gateway() -> LLMGateway:
    settings = get_settings()
    http = httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0))
    # One OpenAI-compatible provider instance per distinct (base_url, key). The gateway
    # keys providers by ModelSpec.provider; for now all specs use "openai_compat", so we
    # build a single dispatching provider that picks base_url+key per upstream model.
    provider = _OpenAICompatRouter(http, settings)
    return LLMGateway(CATALOG, {"openai_compat": provider})


class _OpenAICompatRouter:
    """Wraps per-spec base_url/key selection behind the single 'openai_compat' provider slot.
    Looks up the ModelSpec by upstream_model to pick the right base_url + platform key."""
    name = "openai_compat"

    def __init__(self, http: "httpx.AsyncClient", settings):
        self._http = http
        self._settings = settings
        self._by_upstream = {s.upstream_model: s for s in CATALOG.values()}

    def _provider_for(self, upstream_model: str) -> OpenAICompatProvider:
        spec = self._by_upstream[upstream_model]
        key = getattr(self._settings, spec.key_env, "")
        return OpenAICompatProvider(http=self._http, api_key=key, base_url=spec.base_url)

    def stream_chat(self, model, messages, images, params):
        return self._provider_for(model).stream_chat(model, messages, images, params)

    async def generate_json(self, model, messages, params):
        return await self._provider_for(model).generate_json(model, messages, params)
```

- [ ] **Step 3: .env.example 加占位**

在 `backend/.env.example` 末尾追加：

```bash
# --- Platform LLM/STT provider keys (gateway) ---
OPENAI_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=
NETMIND_API_KEY=
DEEPGRAM_API_KEY=
```

- [ ] **Step 4: 验证后端能 import 启动**

Run: `uv run python -c "from app.main import app; print('ok')" `
Expected: 输出 `ok`（无 import 错误）

- [ ] **Step 5: 提交**

```bash
git add backend/src/app/config.py backend/src/app/deps.py backend/.env.example
git commit -m "feat(llm): wire gateway, usage meter and platform keys into deps/config"
```

---

## Task 9: POST /llm/json

**Files:**
- Create: `backend/src/app/routers/llm.py`
- Modify: `backend/src/app/main.py`
- Test: `backend/tests/test_llm_router_json.py`

- [ ] **Step 1: 写失败测试**

```python
# backend/tests/test_llm_router_json.py
async def test_json_returns_text_and_records_usage(client, usage_repo):
    resp = client.post("/llm/json", json={
        "model": "answer-pro",
        "messages": [{"role": "user", "content": "hi"}],
    })
    assert resp.status_code == 200
    assert resp.json()["text"] == '{"ok": true}'
    # one usage event recorded for the test user
    used = await usage_repo.credits_used_since("u-test", "1970-01-01T00:00:00+00:00")
    assert used >= 1


async def test_json_402_when_quota_exhausted(client, usage_repo):
    # pre-burn the entire free quota (1000 credits) so the next call is rejected
    await usage_repo.record_event("u-test", kind="json", model="answer-pro",
                                  input_tokens=0, output_tokens=0, credits=1000)
    resp = client.post("/llm/json", json={
        "model": "answer-pro",
        "messages": [{"role": "user", "content": "hi"}],
    })
    assert resp.status_code == 402
    assert resp.json()["detail"]["error"] == "quota_exceeded"


def test_json_unknown_model_returns_400(client):
    resp = client.post("/llm/json", json={
        "model": "nope", "messages": [{"role": "user", "content": "hi"}],
    })
    assert resp.status_code == 400
```

- [ ] **Step 2: 跑，预期失败**

Run: `uv run pytest tests/test_llm_router_json.py -v`
Expected: FAIL（404，路由不存在）

- [ ] **Step 3: 写 router（json 端点）**

```python
# backend/src/app/routers/llm.py
"""Metered LLM gateway endpoints. Auth (JWT) → quota check → gateway → record usage."""
from __future__ import annotations

import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..deps import get_current_user, get_llm_gateway, get_usage_meter
from ..services.llm_gateway import LLMGateway
from ..services.llm_types import ChatMessage, NoModelAvailable, QuotaExceeded
from ..services.usage_meter import UsageMeter
from ..services.user_repo import User

router = APIRouter(prefix="/llm", tags=["llm"])


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: str
    messages: list[Message]
    images: list[str] = []
    max_tokens: int | None = None
    temperature: float | None = None
    top_p: float | None = None

    def to_messages(self) -> list[ChatMessage]:
        return [ChatMessage(role=m.role, content=m.content) for m in self.messages]

    def to_params(self) -> dict:
        p: dict = {}
        if self.max_tokens is not None:
            p["max_tokens"] = self.max_tokens
        if self.temperature is not None:
            p["temperature"] = self.temperature
        if self.top_p is not None:
            p["top_p"] = self.top_p
        return p


@router.post("/json")
async def llm_json(
    body: ChatRequest,
    user: Annotated[User, Depends(get_current_user)],
    gateway: Annotated[LLMGateway, Depends(get_llm_gateway)],
    meter: Annotated[UsageMeter, Depends(get_usage_meter)],
) -> dict:
    try:
        await meter.check(user.id)
    except QuotaExceeded as exc:
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, _quota_detail(exc)) from exc
    try:
        spec, res = await gateway.generate_json(body.model, body.to_messages(), body.to_params())
    except NoModelAvailable as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    await meter.record(user.id, kind="json", spec=spec, usage=res.usage)
    return {"text": res.text, "model": spec.id}


def _quota_detail(exc: QuotaExceeded) -> dict:
    s = exc.status
    return {"error": "quota_exceeded", "credits_remaining": s.credits_remaining,
            "credits_total": s.credits_total, "plan": s.plan}
```

- [ ] **Step 4: main.py 注册路由**

`backend/src/app/main.py`：import 行加 `llm`，并加 `app.include_router(llm.router)`。

```python
from .routers import auth, embeddings, health, llm, meetings, modes, profile, user_kv
```
```python
app.include_router(llm.router)
```

- [ ] **Step 5: 跑，预期通过**

Run: `uv run pytest tests/test_llm_router_json.py -v`
Expected: PASS（3 passed）

- [ ] **Step 6: 提交**

```bash
git add backend/src/app/routers/llm.py backend/src/app/main.py backend/tests/test_llm_router_json.py
git commit -m "feat(llm): add POST /llm/json with quota check and metering"
```

---

## Task 10: POST /llm/chat（SSE 流式）

**Files:**
- Modify: `backend/src/app/routers/llm.py`
- Test: `backend/tests/test_llm_router_chat.py`

- [ ] **Step 1: 写失败测试**

```python
# backend/tests/test_llm_router_chat.py
def _collect_sse(raw: str) -> tuple[str, bool]:
    text, done = "", False
    for line in raw.splitlines():
        if not line.startswith("data: "):
            continue
        data = line[6:]
        if data == "[DONE]":
            done = True
            continue
        import json
        obj = json.loads(data)
        text += obj.get("delta", "")
    return text, done


async def test_chat_streams_text_and_records_usage(client, usage_repo):
    with client.stream("POST", "/llm/chat", json={
        "model": "answer-pro",
        "messages": [{"role": "user", "content": "hi"}],
    }) as resp:
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/event-stream")
        body = "".join(resp.iter_text())
    text, done = _collect_sse(body)
    assert text == "Hello world"
    assert done is True
    used = await usage_repo.credits_used_since("u-test", "1970-01-01T00:00:00+00:00")
    assert used >= 1


def test_chat_unknown_model_400(client):
    resp = client.post("/llm/chat", json={
        "model": "nope", "messages": [{"role": "user", "content": "hi"}],
    })
    assert resp.status_code == 400
```

- [ ] **Step 2: 跑，预期失败**

Run: `uv run pytest tests/test_llm_router_chat.py -v`
Expected: FAIL（404）

- [ ] **Step 3: 在 llm.py 追加 /chat 端点**

```python
# backend/src/app/routers/llm.py  (append below llm_json)

@router.post("/chat")
async def llm_chat(
    body: ChatRequest,
    user: Annotated[User, Depends(get_current_user)],
    gateway: Annotated[LLMGateway, Depends(get_llm_gateway)],
    meter: Annotated[UsageMeter, Depends(get_usage_meter)],
):
    # Quota + model resolution happen BEFORE we start streaming, so failures are real HTTP codes.
    try:
        await meter.check(user.id)
    except QuotaExceeded as exc:
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, _quota_detail(exc)) from exc
    try:
        gateway.resolve(body.model)
    except NoModelAvailable as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc

    async def event_stream():
        from ..services.llm_types import Usage
        used_spec = None
        usage = Usage()
        try:
            async for spec, delta in gateway.stream_chat(
                body.model, body.to_messages(), body.images, body.to_params()
            ):
                used_spec = spec
                if delta.text:
                    yield f"data: {json.dumps({'delta': delta.text})}\n\n"
                if delta.usage:
                    usage = delta.usage
        except NoModelAvailable as exc:
            yield f"data: {json.dumps({'error': {'code': 'no_model', 'message': str(exc)}})}\n\n"
        finally:
            if used_spec is not None:
                await meter.record(user.id, kind="chat", spec=used_spec, usage=usage)
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

- [ ] **Step 4: 跑，预期通过**

Run: `uv run pytest tests/test_llm_router_chat.py -v`
Expected: PASS（2 passed）

- [ ] **Step 5: 提交**

```bash
git add backend/src/app/routers/llm.py backend/tests/test_llm_router_chat.py
git commit -m "feat(llm): add POST /llm/chat SSE streaming with metering"
```

---

## Task 11: GET /llm/models 与 GET /llm/quota

**Files:**
- Modify: `backend/src/app/routers/llm.py`
- Test: `backend/tests/test_llm_router_models_quota.py`

- [ ] **Step 1: 写失败测试**

```python
# backend/tests/test_llm_router_models_quota.py
def test_models_lists_catalog_with_availability(client):
    resp = client.get("/llm/models")
    assert resp.status_code == 200
    items = resp.json()
    by_id = {m["id"]: m for m in items}
    # free plan (default for test user): free-tier model available, pro-tier not
    assert by_id["answer-fast"]["available"] is True
    assert by_id["answer-pro"]["available"] is False


def test_quota_returns_status_without_raising(client):
    resp = client.get("/llm/quota")
    assert resp.status_code == 200
    data = resp.json()
    assert data["plan"] == "free"
    assert data["credits_remaining"] == data["credits_total"]
    assert "period_end" in data
```

- [ ] **Step 2: 跑，预期失败**

Run: `uv run pytest tests/test_llm_router_models_quota.py -v`
Expected: FAIL（404）

- [ ] **Step 3: 在 llm.py 追加两个 GET 端点**

```python
# backend/src/app/routers/llm.py  (append; add imports as noted)
from ..services.model_catalog import CATALOG


@router.get("/models")
async def llm_models(
    user: Annotated[User, Depends(get_current_user)],
    meter: Annotated[UsageMeter, Depends(get_usage_meter)],
) -> list[dict]:
    status_ = await meter.status(user.id)
    allowed = set(meter.plan_allowed_tiers(status_.plan))
    return [
        {
            "id": s.id, "label": s.label, "tier": s.tier,
            "capabilities": list(s.capabilities),
            "available": s.tier in allowed,
        }
        for s in CATALOG.values()
    ]


@router.get("/quota")
async def llm_quota(
    user: Annotated[User, Depends(get_current_user)],
    meter: Annotated[UsageMeter, Depends(get_usage_meter)],
) -> dict:
    s = await meter.status(user.id)
    return {
        "plan": s.plan, "period_start": s.period_start, "period_end": s.period_end,
        "credits_total": s.credits_total, "credits_used": s.credits_used,
        "credits_remaining": s.credits_remaining,
    }
```

- [ ] **Step 4: 跑，预期通过**

Run: `uv run pytest tests/test_llm_router_models_quota.py -v`
Expected: PASS（2 passed）

- [ ] **Step 5: 提交**

```bash
git add backend/src/app/routers/llm.py backend/tests/test_llm_router_models_quota.py
git commit -m "feat(llm): add GET /llm/models and /llm/quota"
```

---

## Task 12: 全量回归 + lint

**Files:** 无（验证）

- [ ] **Step 1: 跑全部后端测试**

Run: `uv run pytest -v`
Expected: 全绿（约 20+ passed，覆盖 catalog/meter/provider/gateway/router）

- [ ] **Step 2: ruff 检查**

Run: `uv run ruff check src tests`
Expected: All checks passed（如有可自动修复项：`uv run ruff check --fix src tests` 后重跑测试）

- [ ] **Step 3: 手动冒烟（mock 模式，无平台 key）**

Run（另开终端）: `uv run uvicorn app.main:app --app-dir src --port 8000`
然后：`curl http://localhost:8000/openapi.json | python -c "import sys,json; d=json.load(sys.stdin); print([p for p in d['paths'] if p.startswith('/llm')])"`
Expected: 列出 `/llm/json`、`/llm/chat`、`/llm/models`、`/llm/quota`

> 注：真实 LLM 调用需在 `.env` 填平台 key；无 key 时 `/llm/json` 会向上游报 401（属预期，验证的是路由/鉴权/计量链路而非真实生成）。

- [ ] **Step 4: 提交（如 ruff 有改动）**

```bash
git add -A backend
git commit -m "chore(llm): lint fixes and phase-1 backend gateway regression green"
```

---

## Self-Review（计划自查结论）

- **Spec 覆盖**：阶段1后端涉及的 spec §3.1（`/llm/chat`、`/llm/json`、`/llm/models`、`/llm/quota`）、§3.2（gateway + 平台密钥 + 回退）、§3.3（usage_meter + migrations 009/010 + rate_limiter 正交）、§3.4（main 注册）、§5（401 由现有 `get_current_user` 提供，402/400 已实现）均有对应任务。`/llm/embeddings`、`WS /llm/stt`、Gemini/Anthropic 真实 provider、客户端改写按 spec §7 分阶段，明确不在本计划——已在「范围说明」声明。
- **占位符**：无 TBD；每个代码步骤含完整代码与可运行命令。
- **类型一致性**：`ChatMessage/Usage/ChatDelta/GenResult/QuotaStatus/QuotaExceeded/NoModelAvailable`（Task 2）贯穿 provider（Task 6）、gateway（Task 7）、router（Task 9/10）；`UsageMeter.status/check/record/plan_allowed_tiers`、`UsageRepo.record_event/credits_used_since/get_plan_id/set_plan/get_period_start`、`LLMGateway.resolve/generate_json/stream_chat`、`credits_for`、`CATALOG/PLANS` 命名在定义与使用处一致。
- **已知简化**：流式开始后不再回退（流式固有限制，已注明）；`test_json_402...` 仅验证首调成功（完整 402 路径由 `test_check_raises_when_exhausted` 在 meter 层覆盖）。
