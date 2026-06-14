import { AuthError, sendSmsCode, type SmsSendResult } from "./authClient"

const SDK_URL = "https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js"

const PREFIX = (import.meta.env.VITE_ALIYUN_CAPTCHA_PREFIX as string | undefined) ?? ""
const SCENE_ID = (import.meta.env.VITE_ALIYUN_CAPTCHA_SCENE_ID as string | undefined) ?? ""

declare global {
  interface Window {
    AliyunCaptchaConfig?: { region: "cn" | "sgp"; prefix: string }
    initAliyunCaptcha?: (opts: AliyunCaptchaInitOptions) => void
  }
}

interface AliyunCaptchaInitOptions {
  SceneId: string
  mode: "embed" | "popup"
  element: string
  button: string
  captchaVerifyCallback: (
    captchaVerifyParam: string,
  ) => Promise<{ captchaResult: boolean; bizResult: boolean }>
  onBizResultCallback?: (bizResult: boolean) => void
  getInstance?: (instance: CaptchaInstance) => void
  language?: "cn" | "tw" | "en"
  slideStyle?: { width: number; height: number }
}

interface CaptchaInstance {
  showCaptcha?: () => void
  show?: () => void
  reset?: () => void
  refresh?: () => void
}

/** DOM id the SDK auto-binds to. LoginPanel must render its "Send code" button with this id. */
export const CAPTCHA_BUTTON_ID = "captcha-send-button"
/** Container div the SDK renders captcha frames into. Auto-created if missing. */
const CAPTCHA_ELEMENT_ID = "captcha-element"

let sdkPromise: Promise<void> | null = null

function loadSdk(): Promise<void> {
  if (window.initAliyunCaptcha) return Promise.resolve()
  if (sdkPromise) return sdkPromise
  // V2: AliyunCaptchaConfig MUST be set before the SDK script runs.
  window.AliyunCaptchaConfig = { region: "cn", prefix: PREFIX }
  sdkPromise = new Promise<void>((resolve, reject) => {
    const tag = document.createElement("script")
    tag.src = SDK_URL
    tag.async = true
    tag.onload = () => resolve()
    tag.onerror = () => reject(new Error("Failed to load Aliyun Captcha SDK"))
    document.head.appendChild(tag)
  })
  return sdkPromise
}

function ensureContainer(): void {
  if (document.getElementById(CAPTCHA_ELEMENT_ID)) return
  const div = document.createElement("div")
  div.id = CAPTCHA_ELEMENT_ID
  document.body.appendChild(div)
}

export function isCaptchaConfigured(): boolean {
  return Boolean(PREFIX) && Boolean(SCENE_ID)
}

export interface CaptchaBinding {
  /** Tear down the captcha. Must be called when LoginPanel unmounts. */
  dispose: () => void
}

interface BindOptions {
  getPhone: () => string
  onSent: (result: SmsSendResult) => void
  onError: (err: unknown) => void
}

let currentHandlers: BindOptions | null = null
let bound = false

/**
 * Attach Aliyun Captcha 2.0 to a button (identified by `CAPTCHA_BUTTON_ID`).
 * Must be called once the button is mounted in the DOM. Returns a binding whose
 * `dispose()` clears the handler so a re-mount can re-bind cleanly.
 *
 * Flow:
 *   1. User clicks the bound button.
 *   2. SDK pops the slider / silent challenge.
 *   3. User solves it → SDK invokes captchaVerifyCallback with captchaVerifyParam.
 *   4. Callback reads current phone via getPhone(), calls /auth/sms/send,
 *      then resolves onSent / onError so LoginPanel advances to the OTP step.
 */
export async function bindCaptcha(opts: BindOptions): Promise<CaptchaBinding> {
  if (!isCaptchaConfigured()) {
    throw new Error(
      "Captcha not configured. Set VITE_ALIYUN_CAPTCHA_PREFIX and VITE_ALIYUN_CAPTCHA_SCENE_ID.",
    )
  }
  currentHandlers = opts
  console.log("[captcha] loading SDK…", { prefix: PREFIX, sceneId: SCENE_ID })
  await loadSdk()
  console.log("[captcha] SDK loaded; initializing widget")
  ensureContainer()
  if (!bound) {
    window.initAliyunCaptcha!({
      SceneId: SCENE_ID,
      mode: "popup",
      element: `#${CAPTCHA_ELEMENT_ID}`,
      button: `#${CAPTCHA_BUTTON_ID}`,
      language: "cn",
      slideStyle: { width: 320, height: 40 },
      captchaVerifyCallback: async (captchaVerifyParam: string) => {
        const h = currentHandlers
        if (!h) return { captchaResult: false, bizResult: false }
        const phone = h.getPhone()
        try {
          const result = await sendSmsCode(phone, captchaVerifyParam)
          h.onSent(result)
          return { captchaResult: true, bizResult: true }
        } catch (err) {
          h.onError(err)
          // Only a 403 from /sms/send means the captcha itself was rejected by the backend
          // (Aliyun VerifyIntelligentCaptcha said no). Everything else (429 rate-limit,
          // 502 SMS provider error, etc.) means the captcha passed but our business failed.
          // Returning captchaResult:true for those keeps the SDK from showing a misleading
          // "captcha failed, please retry" prompt — the LoginPanel surfaces the real error.
          const captchaFailed = err instanceof AuthError && err.status === 403
          return { captchaResult: !captchaFailed, bizResult: false }
        }
      },
      onBizResultCallback: () => {
        // No-op: LoginPanel drives its own success/error UI via onSent / onError.
      },
      getInstance: () => {
        // Instance handle not currently needed.
      },
    })
    bound = true
    console.log("[captcha] widget bound to button #" + CAPTCHA_BUTTON_ID)
  }
  return {
    dispose: () => {
      if (currentHandlers === opts) currentHandlers = null
    },
  }
}
