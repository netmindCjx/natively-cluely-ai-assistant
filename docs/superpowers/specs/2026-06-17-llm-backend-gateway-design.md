# LLM 调用经后端网关转发(付费控制) — 设计文档

- 日期:2026-06-17
- 状态:已评审,待落实现计划
- 作者:netmindCjx（与 Claude 协作）

## 1. 背景与目标

当前 Electron 客户端在 `electron/LLMHelper.ts`（3536 行）及 STT、RAG 模块中**本地直连各家 LLM API**：用用户自带的 key 在主进程实例化 `GoogleGenAI` / `OpenAI`（路由到 Netmind）/ `Anthropic` / `Groq` / Ollama，直接打到 `api.openai.com`、`generativelanguage`、`api.deepgram.com` 等。没有任何环节可以拦截、计量或限额。

**目标**：把**所有 LLM 类调用**改为经自有 FastAPI 后端转发，实现**付费控制**——后端持平台密钥、按 token/credits 计量、按套餐配额放行或拒绝。

这延续了已落地的上云路径（`/embeddings`、`/meetings`、`/profile`、settings/keybinds 已经过 `CloudClient` 走后端）。

### 已确认的关键决策

| 决策项 | 结论 |
|---|---|
| 转发范围 | **全部** LLM 调用（聊天/文本、STT、意图分类/辅助小调用）走后端 |
| 密钥与计费 | **后端持平台密钥 + 配额**；用户不再填 provider key |
| 架构 | **后端网关 + 客户端拼 prompt**：客户端保留 `prompts.ts`/各模式逻辑与流式接口，只把叶子「调 SDK」换成调后端 `/llm/chat`(SSE)、`/llm/json` |
| 计量模型 | 按 **token/credits** 计量，超额返回 402 |
| Embeddings | 后端新增 `/llm/embeddings` 计算；存储仍走现有 `/embeddings` |
| STT | 砍到**只剩 Deepgram 云端 WebSocket**，走**后端 WS 反代**（精确计量、配额硬切） |
| Ollama | **一并下线**（不保留本地直连） |
| 登录 | **AI 功能强制登录**，后端靠 JWT 识别用户与配额 |

## 2. 总体架构

后端新增一个 `/llm/*` 计费网关，成为所有 LLM 类调用的唯一出口。客户端保留 prompt 拼装与流式渲染，只把「真正发 HTTP/WS 给各家 API」的叶子换成「调后端网关」。

```
客户端 LLMHelper / STT / RAG              后端 /llm/* 网关
  拼 prompt / 选 model·tier ──HTTP(JWT)──▶  鉴权 → 配额检查 → 平台密钥
                                            → provider 回退 → 调真实 API
       SSE 流式 token       ◀────────────  流式回传 + 记录 token 用量 → 扣 credits

  音频帧(WS) ───────────────────────────▶  鉴权 → 配额 → 反代 Deepgram WS
       转写结果(WS) ◀────────────────────  回传转写 + 数音频秒 → 扣 credits，耗尽硬切
```

## 3. 后端改动

### 3.1 新 router `backend/src/app/routers/llm.py`

| 端点 | 用途 | 流式 | 鉴权 |
|---|---|---|---|
| `POST /llm/chat` | 聊天/答题/各模式文本生成（含多模态图片） | SSE | JWT |
| `POST /llm/json` | 结构化 JSON 生成（意图分类等辅助调用） | 否 | JWT |
| `POST /llm/embeddings` | 文本→向量（替代本地算） | 否 | JWT |
| `GET /llm/models` | 返回当前套餐可用的逻辑模型目录 | 否 | JWT |
| `GET /llm/quota` | 返回剩余配额/用量，供 UI 展示 | 否 | JWT |
| `WS /llm/stt` | Deepgram 实时 STT 反代 | WS | JWT（连接时校验） |

请求/响应（草案）：

- `POST /llm/chat` 请求体：`{ model: string, messages: [{role, content}], images?: [base64...], max_tokens?, temperature?, top_p? }`；响应：`text/event-stream`，每个事件 `data: {"delta": "..."}`，结束 `data: [DONE]`，异常事件 `data: {"error": {...}}`。
- `POST /llm/json` 请求体同上（无流），响应：`{ text: string }`。
- `POST /llm/embeddings` 请求体：`{ texts: string[], model?: string }`；响应：`{ embeddings: number[][], dim: number, model: string }`。
- `GET /llm/models` 响应：`[{ id, label, tier, capabilities: ["text"|"vision"|"json"], available: boolean }]`（`available` 反映用户套餐是否解锁）。
- `GET /llm/quota` 响应：`{ plan: string, period_start, period_end, credits_total, credits_used, credits_remaining }`。

### 3.2 新 service `backend/src/app/services/llm_gateway.py`

封装平台各 provider 客户端（用平台密钥），职责：

- **逻辑模型映射**：把客户端传的逻辑 `model`/`tier`（如 `answer-pro`、`assist-fast`）映射到实际 `provider + 模型名`。客户端不再知道也不传具体 provider。
- **provider 回退链**：把目前散落在 `LLMHelper` 的「死磕重试」跨 provider 回退收敛到这里——只有后端知道哪个平台 key 健康、用户套餐允许哪些模型。
- **统一接口**：`stream_chat()`、`generate_json()`、`embed()`，对上层（router）屏蔽 provider 差异。

`backend/src/app/config.py` 增加平台密钥字段：`openai_api_key`、`gemini_api_key`、`anthropic_api_key`、`groq_api_key`、`netmind_api_key`、`deepgram_api_key`（均 `Field(default="")`，从 `.env` 读）。

### 3.3 计量与配额

新 service `backend/src/app/services/usage_meter.py` + migrations：

- `009_plans.sql`：`plans`（套餐：`credits_per_period`、`period`(month/week)、`allowed_models`）、`user_subscriptions`（user → plan + 周期起止）。
- `010_usage.sql`：`usage_events`（`user_id`、`kind`(chat/json/embeddings/stt)、`model`、`input_tokens`、`output_tokens`、`audio_seconds`、`credits`、`created_at`）。
- 计量逻辑：
  - chat/json/embeddings：按模型单价把 in/out token 换算为 credits。
  - STT：按音频秒换算 credits（后端反代时由网关精确计数）。
  - 调用前查当前周期 `credits_used`，不足 → **402** + 剩余额度；调用后写 `usage_events` 并累加。
  - 复用现有 `services/rate_limiter.py` 做粗粒度防滥用（并发/突发上限），与 credits 配额正交。
- 数据层沿用 `data_repo` 的 `InMemory` / `Supabase` 双实现模式，新增 plans/usage 的 repo 方法。

### 3.4 注册

`backend/src/app/main.py` 的 `include_router` 增加 `llm.router`。

## 4. 客户端改动

### 4.1 `electron/services/CloudClient.ts`（现唯一后端网关）

新增方法，复用现有 JWT 注入 / 自动刷新 / 401 重试：

- `streamLLM(body): AsyncGenerator<string>`：`fetch` 到 `/llm/chat`，用 `ReadableStream` reader 逐块解析 SSE，yield delta。（现有 `request()` 只处理 `json()`/text，需新增流式分支。）
- `llmJson(body): Promise<{text}>` → `/llm/json`。
- `llmEmbeddings(texts, model?): Promise<{embeddings, dim, model}>` → `/llm/embeddings`。
- `getLLMModels()` → `/llm/models`；`getQuota()` → `/llm/quota`。
- STT 反代用独立的 WS 连接（见 §4.4），不走 `request()`。

### 4.2 `electron/LLMHelper.ts`

- **叶子方法改写**：`generateWithOpenai/Claude/Groq`、`streamWith*`、`generateContentStructured`、`generateContent` 等内部实现，从「调各家 SDK」改为「调 `CloudClient.streamLLM/llmJson`」。
- **保持不动**：上层各模式模块（`AnswerLLM`/`AssistLLM`/`FollowUpLLM`/`RecapLLM`/...）、`prompts.ts`（2220 行）、流式 generator 对外接口、`MODE_CONFIGS` token 配置。
- **移除**：本地 provider SDK 实例化（`GoogleGenAI`/`OpenAI`/`Anthropic`/`Groq`/Ollama）、客户端跨 provider 回退链（移交后端）、Ollama 相关路径。
- 客户端只向后端传逻辑 `model`/`tier`（由现有模型选择映射而来）。

### 4.3 RAG / Embeddings

- `electron/rag/EmbeddingProviderResolver.ts`、`providers/OpenAIEmbeddingProvider.ts`、`GeminiEmbeddingProvider.ts`、`OllamaEmbeddingProvider.ts` 收敛为调 `CloudClient.llmEmbeddings()`。
- 向量**存储与检索仍走现有** `/embeddings/chunks|summary|search|...`，本路改动不触碰存储侧。

### 4.4 STT（Deepgram-only + 后端 WS 反代）

- **保留** `electron/audio/DeepgramStreamingSTT.ts`，改为连接后端 `WS /llm/stt` 而非 `wss://api.deepgram.com`（去掉客户端 Deepgram key）。
- **删除** `OpenAIStreamingSTT.ts`、`RestSTT.ts`、`GoogleSTT.ts`、`SonioxStreamingSTT.ts`、`ElevenLabsStreamingSTT.ts` 及其在 STT 选择/配置处的引用。
- 后端 `WS /llm/stt`：连接时校验 JWT 与配额 → 用平台 Deepgram key 连上游 → 双向转发音频/转写 → 累计音频秒、配额耗尽即关闭连接。

### 4.5 凭据与设置 UI

- `electron/services/CredentialsManager.ts`：下线各 provider API key 的存取（保留与计费/订阅无关的项，如有）。
- `src/components/settings/AIProvidersSettings.tsx`：移除各家 key 录入；改为展示套餐、配额用量（`/llm/quota`）、可用模型（`/llm/models`）。
- 模型选择 UI 从「本地填 key + 选模型」改为「从 `/llm/models` 拉取可用目录，未解锁置灰」。

## 5. 鉴权与错误处理

- **强制登录**：未登录无法使用任何 AI 功能（不再支持自带 key 离线用）。
- 错误语义（客户端需对应 UI 提示）：
  - `401` 未登录/会话过期 → 跳登录（沿用现有 `auth-session-expired` 广播）。
  - `402` 配额耗尽 → 提示升级/充值，附剩余额度。
  - `429` 触发频率限制 → 退避重试。
  - `503` 全部 provider 不可用 → 友好报错。
- STT WS 关闭码区分「配额耗尽」与「上游故障」。

## 6. 数据流示例（流式答题）

1. 客户端拼好 messages（system + context + question + images），调 `CloudClient.streamLLM({ model: 'answer-pro', messages, images })`。
2. 后端 `get_current_user` 校验 JWT → `usage_meter` 查配额（不足 → 402）。
3. `llm_gateway` 把 `answer-pro` 映射到实际模型，用平台密钥调 provider；失败按回退链换下一个。
4. SSE 把 token 流式回传，客户端原样喂给现有渲染管线。
5. 流结束，后端写 `usage_events`、扣 credits。

## 7. 分阶段交付

- **阶段 1（核心付费面）**：`/llm/chat` + `/llm/json` + `usage_meter`/配额 + `llm_gateway` + 客户端叶子改写 + provider key 下线 + 强制登录。这是付费控制主体。
- **阶段 2**：`/llm/embeddings` + RAG 切换。
- **阶段 3**：STT —— Deepgram-only + 后端 WS 反代；删除其余 STT provider。
- **阶段 4**：设置 UI（配额/模型目录展示）打磨、Ollama 残留清理。

各阶段可独立交付、独立验证。

## 8. 影响与风险

- **延迟**：聊天经后端多一跳；STT 反代中转音频。需后端部署位置贴近用户、连接复用。
- **定位改变**：README「your keys, your models, your machine」与「强制登录 + 平台密钥」相悖，需同步对外口径（属产品决策，已确认）。
- **后端成为单点**：所有 AI 经后端，需关注可用性、限流、平台密钥成本控制。
- **计量准确性**：token 计量依赖 provider 返回的 usage；STT 依赖反代侧音频秒计数。
- **回退链迁移**：客户端「死磕重试」语义迁到后端，需保证等价的健壮性。

## 9. 非目标（本设计不含）

- 具体套餐定价、credits 单价、支付/订阅购买流程（另议；本设计只提供计量与配额执行的基础设施）。
- 客户端直连 + 临时 key 的 STT 方案（已否决，采用后端反代）。
- 重写 `prompts.ts` 或把 prompt 逻辑搬到后端（已否决，保留客户端拼 prompt）。
