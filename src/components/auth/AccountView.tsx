import React from "react"
import { useTranslation } from "react-i18next"
import { LogOut, User } from "lucide-react"

import { useResolvedTheme } from "@hooks/useResolvedTheme"

interface AccountViewProps {
  phone: string
  onSignOut: () => void
}

/** Mask a CN mainland phone into "138 **** 8000". */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-11)
  if (digits.length !== 11) return phone
  return `${digits.slice(0, 3)} **** ${digits.slice(7)}`
}

const AccountView: React.FC<AccountViewProps> = ({ phone, onSignOut }) => {
  const { t } = useTranslation()
  const isLight = useResolvedTheme() === "light"

  const valueBg = isLight
    ? "bg-white border-neutral-200"
    : "bg-white/[0.03] border-white/10"
  const signOutBtn = isLight
    ? "text-red-600 hover:bg-red-50 border-red-200"
    : "text-red-300 hover:bg-red-500/10 border-red-500/20"

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-md mx-auto px-8 pt-12 pb-8">
        <div className="flex items-center gap-4 mb-8">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isLight ? "bg-black/5" : "bg-white/10"
            }`}
          >
            <User size={22} className="text-text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">
              {t("account.title")}
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">{t("account.subtitle")}</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">
            {t("account.usernameLabel")}
          </div>
          <div
            className={`px-4 py-3 rounded-lg border text-sm font-medium tracking-wider text-text-primary ${valueBg}`}
          >
            {maskPhone(phone)}
          </div>
          <p className="mt-2 text-[11px] text-text-tertiary">{t("account.smsOnlyNotice")}</p>
        </div>

        <button
          type="button"
          onClick={() => void onSignOut()}
          className={`w-full py-2.5 text-sm font-medium rounded-lg border transition-colors flex items-center justify-center gap-2 ${signOutBtn}`}
        >
          <LogOut size={14} />
          {t("account.signOut")}
        </button>
      </div>
    </div>
  )
}

export default AccountView
