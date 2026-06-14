import React, { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { motion } from "framer-motion"

import { AuthError } from "@/lib/auth/authClient"
import { bindCaptcha, CAPTCHA_BUTTON_ID, isCaptchaConfigured } from "@/lib/auth/captcha"
import appIcon from "@/components/icon.png"
import { useResolvedTheme } from "@hooks/useResolvedTheme"

type Step = "phone" | "code"

interface LoginPanelProps {
  onLogin: (phone: string, code: string) => Promise<void>
}

const PHONE_RE = /^1[3-9]\d{9}$/
const CODE_RE = /^\d{6}$/

const LoginPanel: React.FC<LoginPanelProps> = ({ onLogin }) => {
  const { t } = useTranslation()
  const isLight = useResolvedTheme() === "light"
  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const [captchaReady, setCaptchaReady] = useState(false)
  const codeInputRef = useRef<HTMLInputElement | null>(null)
  // Always-fresh refs read inside captcha SDK callback (which is captured at bind time).
  const phoneRef = useRef(phone)
  const settersRef = useRef({ setStep, setSending, setResendIn, setError })
  phoneRef.current = phone
  settersRef.current = { setStep, setSending, setResendIn, setError }

  useEffect(() => {
    if (!isCaptchaConfigured()) {
      setError(t("auth.errors.captchaNotConfigured"))
      return
    }
    let disposed = false
    const bindingPromise = bindCaptcha({
      getPhone: () => phoneRef.current,
      onSent: () => {
        if (disposed) return
        const s = settersRef.current
        s.setSending(false)
        s.setError(null)
        s.setStep("code")
        s.setResendIn(60)
      },
      onError: (err) => {
        if (disposed) return
        const s = settersRef.current
        s.setSending(false)
        s.setError(toMessage(err, t))
      },
    })
      .then((b) => {
        if (!disposed) setCaptchaReady(true)
        return b
      })
      .catch((err) => {
        console.error("[LoginPanel] captcha bind failed:", err)
        if (!disposed) setError(toMessage(err, t))
        return { dispose: () => undefined }
      })
    return () => {
      disposed = true
      bindingPromise.then((b) => b.dispose()).catch(() => undefined)
    }
  }, [t])

  useEffect(() => {
    if (step === "code") codeInputRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (resendIn <= 0) return
    const id = window.setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [resendIn])

  // Validate phone before allowing the captcha to fire. Returning false here would also
  // be caught by the button's disabled attribute, but we re-check so the error message is
  // surfaced consistently if a programmatic click happens (e.g. "Resend code").
  const handlePreCaptchaClick = (): boolean => {
    setError(null)
    if (!PHONE_RE.test(phone)) {
      setError(t("auth.errors.invalidPhone"))
      return false
    }
    if (!isCaptchaConfigured()) {
      setError(t("auth.errors.captchaNotConfigured"))
      return false
    }
    setSending(true)
    return true
  }

  const handleResend = () => {
    if (!handlePreCaptchaClick()) return
    const btn = document.getElementById(CAPTCHA_BUTTON_ID) as HTMLButtonElement | null
    if (!btn) {
      setSending(false)
      setError(t("auth.errors.unknown"))
      return
    }
    btn.click()
  }

  const handleVerify = async () => {
    setError(null)
    if (!CODE_RE.test(code)) {
      setError(t("auth.errors.invalidCode"))
      return
    }
    setVerifying(true)
    try {
      await onLogin(phone, code)
      // On success the parent unmounts this panel — no further state updates needed.
    } catch (err) {
      setError(toMessage(err, t))
      setVerifying(false)
    }
  }

  const handleBack = () => {
    setStep("phone")
    setCode("")
    setError(null)
  }

  const surface = isLight
    ? "bg-white border-black/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
    : "bg-white/[0.02] border-white/10 shadow-2xl"
  const titleColor = isLight ? "text-neutral-900" : "text-white"
  const subtitleColor = isLight ? "text-neutral-500" : "text-white/50"
  const labelColor = isLight ? "text-neutral-600" : "text-white/60"
  const captionColor = isLight ? "text-neutral-500" : "text-white/60"
  const noticeColor = isLight ? "text-neutral-400" : "text-white/30"
  const prefixChip = isLight
    ? "text-neutral-700 bg-neutral-100 border-neutral-200"
    : "text-white/70 bg-white/5 border-white/10"
  const inputCls = isLight
    ? "text-neutral-900 placeholder-neutral-400 bg-neutral-50 border-neutral-200 focus:border-neutral-400"
    : "text-white placeholder-white/30 bg-white/5 border-white/10 focus:border-white/30"
  const primaryBtn = isLight
    ? "text-white bg-neutral-900 hover:bg-neutral-800"
    : "text-black bg-white hover:bg-white/90"
  const subLinkColor = isLight
    ? "text-neutral-500 hover:text-neutral-800"
    : "text-white/50 hover:text-white/80"
  const errorBox = isLight
    ? "text-red-600 bg-red-50 border-red-200"
    : "text-red-300 bg-red-500/10 border-red-500/20"

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center px-6 ${
        isLight ? "bg-white" : "bg-black"
      }`}
    >
      <motion.div
        className={`absolute w-96 h-96 rounded-full blur-[120px] pointer-events-none ${
          isLight ? "bg-neutral-300/40" : "bg-white/10"
        }`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.2 }}
        transition={{ duration: 3, ease: "easeOut" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative w-full max-w-sm rounded-2xl border backdrop-blur-xl p-7 ${surface}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <img src={appIcon} alt="" className="w-10 h-10 rounded-lg" />
          <div>
            <h1 className={`text-lg font-semibold leading-tight ${titleColor}`}>
              {t("auth.title")}
            </h1>
            <p className={`text-xs mt-0.5 ${subtitleColor}`}>{t("auth.subtitle")}</p>
          </div>
        </div>

        {/* Phone-entry form — only the captcha-bound Send button stays in DOM on the code
            step (hidden) so "Resend" can programmatically .click() it. */}
        <div className={step === "phone" ? "" : "hidden"}>
          <label className={`block text-xs mb-2 ${labelColor}`}>{t("auth.phoneLabel")}</label>
          <div className="flex items-stretch gap-2 mb-4">
            <span
              className={`px-3 inline-flex items-center text-sm border rounded-lg ${prefixChip}`}
            >
              +86
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoFocus={step === "phone"}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder={t("auth.phonePlaceholder")}
              className={`flex-1 px-3 py-2 text-sm border rounded-lg outline-none transition ${inputCls}`}
            />
          </div>
        </div>

        {/*
          IMPORTANT: This button is auto-bound by the Aliyun Captcha SDK to trigger the
          captcha popup. We MUST keep it in the DOM (just hide it on the code step) and
          MUST NOT attach an onClick handler that competes with the SDK — handlePreCaptchaClick
          only sets sending state; the actual /sms/send call happens inside captcha.ts's
          captchaVerifyCallback after the user solves the challenge.
        */}
        <button
          id={CAPTCHA_BUTTON_ID}
          type="button"
          onClick={handlePreCaptchaClick}
          disabled={sending || !PHONE_RE.test(phone) || !captchaReady}
          className={
            step === "phone"
              ? `w-full py-2.5 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition ${primaryBtn}`
              : "hidden"
          }
        >
          {sending ? t("auth.sending") : t("auth.sendCode")}
        </button>

        {step === "code" && (
          <>
            <div className={`text-xs mb-2 ${captionColor}`}>
              {t("auth.codeSentTo", { phone: `+86 ${phone}` })}
            </div>
            <input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="······"
              className={`w-full px-3 py-3 mb-4 text-center text-lg tracking-[0.5em] border rounded-lg outline-none transition ${inputCls}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !verifying) void handleVerify()
              }}
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying || !CODE_RE.test(code)}
              className={`w-full py-2.5 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition mb-3 ${primaryBtn}`}
            >
              {verifying ? t("auth.verifying") : t("auth.verifyAndSignIn")}
            </button>
            <div className={`flex justify-between text-xs ${subLinkColor}`}>
              <button type="button" onClick={handleBack} className="transition">
                {t("auth.changePhone")}
              </button>
              <button
                type="button"
                disabled={resendIn > 0 || sending}
                onClick={handleResend}
                className="disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {resendIn > 0
                  ? t("auth.resendIn", { seconds: resendIn })
                  : t("auth.resendCode")}
              </button>
            </div>
          </>
        )}

        {error && (
          <div className={`mt-4 px-3 py-2 text-xs border rounded-lg ${errorBox}`}>
            {error}
          </div>
        )}

        <p className={`mt-6 text-[10px] leading-relaxed text-center ${noticeColor}`}>
          {t("auth.smsSenderNotice")}
        </p>
      </motion.div>
    </div>
  )
}

function toMessage(err: unknown, t: TFunction): string {
  if (err instanceof AuthError) {
    if (err.status === 429) return t("auth.errors.rateLimited")
    if (err.status === 401) return t("auth.errors.codeMismatch")
    if (err.status === 403) return t("auth.errors.captchaFailed")
    return err.message || t("auth.errors.unknown")
  }
  return err instanceof Error ? err.message : t("auth.errors.unknown")
}

export default LoginPanel
