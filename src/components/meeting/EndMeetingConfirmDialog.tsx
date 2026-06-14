import React from "react"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "framer-motion"
import { Save, Trash2, X } from "lucide-react"

import { useResolvedTheme } from "@hooks/useResolvedTheme"

interface EndMeetingConfirmDialogProps {
  isOpen: boolean
  onCancel: () => void
  onSave: () => void
  onDiscard: () => void
  busy?: boolean
}

const EndMeetingConfirmDialog: React.FC<EndMeetingConfirmDialogProps> = ({
  isOpen,
  onCancel,
  onSave,
  onDiscard,
  busy = false,
}) => {
  const { t } = useTranslation()
  const isLight = useResolvedTheme() === "light"

  const card = isLight
    ? "bg-white border-black/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]"
    : "bg-[#141414] border-white/10 shadow-2xl"
  const title = isLight ? "text-neutral-900" : "text-white"
  const body = isLight ? "text-neutral-600" : "text-white/70"
  const closeBtn = isLight
    ? "text-neutral-400 hover:text-neutral-700 hover:bg-black/[0.05]"
    : "text-white/40 hover:text-white hover:bg-white/[0.05]"
  const discardBtn = isLight
    ? "text-red-600 hover:bg-red-50 border-red-200"
    : "text-red-300 hover:bg-red-500/10 border-red-500/20"
  const saveBtn = isLight
    ? "text-white bg-neutral-900 hover:bg-neutral-800"
    : "text-black bg-white hover:bg-white/90"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="end-meeting-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) onCancel()
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
            className={`w-[420px] max-w-[92vw] rounded-2xl border p-6 ${card}`}
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className={`text-base font-semibold leading-tight ${title}`}>
                {t("meetingEnd.title")}
              </h2>
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                aria-label={t("common.cancel")}
                className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${closeBtn}`}
              >
                <X size={16} />
              </button>
            </div>

            <p className={`text-sm mb-6 ${body}`}>{t("meetingEnd.body")}</p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onDiscard}
                disabled={busy}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${discardBtn}`}
              >
                <Trash2 size={14} />
                {t("meetingEnd.discard")}
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={busy}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${saveBtn}`}
              >
                <Save size={14} />
                {busy ? t("meetingEnd.saving") : t("meetingEnd.save")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default EndMeetingConfirmDialog
