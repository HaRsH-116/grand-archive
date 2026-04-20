import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Bell, BookOpen, Star, User, Trash2, CheckCheck } from "lucide-react";
import { notifsApi } from "../api/client";

const TYPE_ICON = {
  new_book:   <BookOpen size={14} style={{ color: "#d4af37" }} />,
  new_review: <Star     size={14} style={{ color: "#d4af37" }} />,
  follow:     <User     size={14} style={{ color: "#d4af37" }} />,
  system:     <Bell     size={14} style={{ color: "#d4af37" }} />,
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotifPanel({ onClose }) {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notifsApi.list()
      .then(({ data }) => setNotifs(data))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await notifsApi.readAll();
    setNotifs((n) => n.map((x) => ({ ...x, is_read: true })));
  };

  const remove = async (id) => {
    await notifsApi.delete(id);
    setNotifs((n) => n.filter((x) => x.id !== id));
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-30" onClick={onClose}
      />
      {/* Panel */}
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 z-40 w-80 flex flex-col overflow-hidden"
        style={{ background: "var(--modal-bg)", borderLeft: "1.5px solid var(--border-col)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
             style={{ borderColor: "var(--border-col)" }}>
          <div className="flex items-center gap-2">
            <Bell size={16} style={{ color: "var(--gold)" }} />
            <span className="font-display text-base font-bold gold-text">Dispatches</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markAllRead} title="Mark all read"
                    className="hover:text-green-400 transition-colors"
                    style={{ color: "var(--text-lo)" }}>
              <CheckCheck size={15} />
            </button>
            <button onClick={onClose} style={{ color: "var(--text-lo)" }}
                    className="hover:text-red-400 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-12">
              <span className="text-3xl candle-flame">🕯️</span>
            </div>
          )}
          {!loading && notifs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Bell size={28} style={{ color: "var(--text-lo)", opacity: 0.4 }} />
              <p className="font-body text-sm" style={{ color: "var(--text-lo)" }}>
                No dispatches yet.
              </p>
            </div>
          )}
          {notifs.map((n) => (
            <div
              key={n.id}
              className="flex gap-3 px-5 py-3 border-b group transition-colors hover:bg-yellow-900/10"
              style={{
                borderColor: "var(--border-col)",
                background: n.is_read ? "transparent" : "rgba(212,175,55,0.04)",
              }}
            >
              <div className="mt-0.5 shrink-0">{TYPE_ICON[n.type] || TYPE_ICON.system}</div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm leading-snug"
                   style={{ color: n.is_read ? "var(--text-lo)" : "var(--text-hi)" }}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="font-body text-xs mt-0.5 line-clamp-2"
                     style={{ color: "var(--text-lo)" }}>
                    {n.body}
                  </p>
                )}
                <p className="font-mono text-xs mt-1" style={{ color: "var(--gold-dim)", opacity: 0.7 }}>
                  {timeAgo(n.created_at)}
                </p>
              </div>
              <button
                onClick={() => remove(n.id)}
                className="opacity-0 group-hover:opacity-100 shrink-0 hover:text-red-400
                           transition-all mt-0.5"
                style={{ color: "var(--text-lo)" }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
