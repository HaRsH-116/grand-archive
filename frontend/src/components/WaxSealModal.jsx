import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function WaxSealModal({
  isOpen, title = "Burn this Volume?",
  bookTitle, onConfirm, onCancel, loading = false,
  confirmLabel = "Burn It", cancelLabel = "Spare It",
  confirmColor = "#8B0000",
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.82, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.82, opacity: 0, y: 24 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="relative rounded-2xl p-8 max-w-sm w-full text-center"
            style={{ background: "var(--modal-bg)", border: "1.5px solid var(--gold-dim)" }}
          >
            {/* Wax seal */}
            <motion.div
              initial={{ scale: 0, rotate: -200 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.12, type: "spring", damping: 14, stiffness: 200 }}
              className="wax-seal w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            >
              <AlertTriangle size={30} className="text-red-200" />
            </motion.div>

            <h2 className="font-display text-2xl font-bold gold-text mb-1">{title}</h2>
            {bookTitle && (
              <p className="font-body italic mb-4 text-base"
                 style={{ color: "var(--text-lo)" }}>"{bookTitle}"</p>
            )}
            <p className="font-body text-sm mb-7" style={{ color: "var(--text-lo)" }}>
              This action is permanent. The volume and all its pages will be lost forever.
            </p>

            <div className="flex gap-3">
              <button
                onClick={onCancel} disabled={loading}
                className="flex-1 py-2.5 rounded-lg font-display text-sm gold-border
                           hover:bg-yellow-900/20 transition-colors disabled:opacity-50"
                style={{ color: "var(--gold)" }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm} disabled={loading}
                className="flex-1 py-2.5 rounded-lg font-display text-sm font-semibold
                           text-red-100 hover:brightness-110 transition-all disabled:opacity-50"
                style={{ background: confirmColor }}
              >
                {loading ? "Working…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
