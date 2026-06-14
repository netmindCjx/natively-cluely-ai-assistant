# Natively Backend

FastAPI backend for the Natively AI Assistant Electron app — currently handles Chinese mainland phone SMS login via Aliyun PNVS 短信认证.

## Stack

- **FastAPI** + **Uvicorn**, Python 3.11+
- **uv** for package management
- **Aliyun PNVS** (号码认证服务 → 短信认证 新品) — individual developer real-name auth is enough, no business license required
- **Supabase** (planned) — Postgres for user storage, JWT for sessions

## Quick start

```bash
cd backend
uv sync                                  # install deps (creates .venv)
cp .env.example .env                     # leave Aliyun keys empty for mock mode
uv run uvicorn app.main:app --reload --app-dir src --port 8000
```

Health check: `curl http://localhost:8000/health` → `{"status":"ok"}`

OpenAPI docs: <http://localhost:8000/docs>

## Auth endpoints

```text
POST /auth/sms/send    { phone, captcha_token? } → { sent, request_id }
POST /auth/sms/verify  { phone, code }           → { user_id, phone, access_token, refresh_token, ... }
POST /auth/refresh     { refresh_token }         → new token pair
GET  /auth/me          (Authorization: Bearer <access>) → user profile
```

## Dev fallbacks

| Config absent | Fallback | Notes |
|---|---|---|
| `ALIYUN_ACCESS_KEY_ID` | `MockSmsSender` | code `000000` always matches |
| `SUPABASE_URL` | `InMemoryUserRepo` | resets on restart |
| `ALIYUN_CAPTCHA_SCENE_ID` | `NoopCaptchaVerifier` | skips captcha — **dev only** |

Rate limiter is always in-memory (single-instance). Defaults: phone 1/60s, 5/1h, 10/24h; IP 20/24h.

## Supabase setup (when ready)

1. Create a project at https://supabase.com
2. Run `backend/migrations/001_users.sql` in the SQL editor
3. Fill `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
4. Restart backend → `supabase_enabled=True` in startup log

## Next steps

- [ ] Electron client: login UI + IPC
- [ ] Captcha 2.0 client-side widget (web/H5/Electron)
- [ ] Replace in-memory rate limiter with Redis when scaling > 1 instance
