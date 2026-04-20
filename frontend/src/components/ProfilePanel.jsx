import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, BookOpen, Star, Bookmark } from "lucide-react";
import { booksApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import StarRating from "./StarRating";

const AVATAR_COLORS = [
  "#8B0000","#2C4A6E","#1B4332","#4A2C6B",
  "#7A3B00","#3D2B1F","#1C3A4A","#4A1A2C",
];

export default function ProfilePanel({ onViewBook, onEditBook }) {
  const { user, updateUser, isAuthor, isAdmin } = useAuth();

  const [myBooks,  setMyBooks]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({
    bio:          user?.bio          || "",
    avatar_color: user?.avatar_color || "#8B0000",
  });

  useEffect(() => {
    if (!isAuthor && !isAdmin) { setLoading(false); return; }
    booksApi.list({ author_id: user.id })
      .then(({ data }) => setMyBooks(data))
      .finally(() => setLoading(false));
  }, [user?.id, isAuthor, isAdmin]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateUser(form);
      setEditing(false);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h2 className="font-display text-2xl gold-text font-bold mb-7">My Study</h2>

      <div className="grid md:grid-cols-[260px_1fr] gap-7">
        {/* ── Profile card ── */}
        <div className="archive-card p-6 h-fit">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center
                       justify-center font-display text-3xl font-bold text-white shadow-wax"
            style={{ background: editing ? form.avatar_color : user.avatar_color }}
          >
            {user.username[0].toUpperCase()}
          </div>

          <h3 className="font-display text-xl text-center gold-text font-bold">{user.username}</h3>
          <p className="font-body text-xs text-center uppercase tracking-widest mt-1 capitalize"
             style={{ color: "var(--text-lo)" }}>{user.role}</p>

          {!editing ? (
            <>
              {user.bio && (
                <p className="font-body text-sm text-center mt-3 leading-relaxed"
                   style={{ color: "var(--text-lo)" }}>{user.bio}</p>
              )}
              <button onClick={() => setEditing(true)}
                className="w-full mt-5 py-2 rounded-lg font-display text-sm gold-border
                           hover:bg-yellow-900/20 transition-colors"
                style={{ color: "var(--gold)" }}>
                Edit Profile
              </button>
            </>
          ) : (
            <div className="mt-4 space-y-3">
              <div>
                <label className="font-body text-xs tracking-widest uppercase mb-1 block"
                       style={{ color: "var(--text-lo)" }}>Bio</label>
                <textarea rows={3} value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell the Archive about yourself…"
                  className="brass-input w-full px-3 py-2 rounded text-sm resize-none" />
              </div>
              <div>
                <label className="font-body text-xs tracking-widest uppercase mb-2 block"
                       style={{ color: "var(--text-lo)" }}>Avatar Colour</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVATAR_COLORS.map((c) => (
                    <button key={c} onClick={() => setForm((f) => ({ ...f, avatar_color: c }))}
                      className="w-7 h-7 rounded-full hover:scale-110 transition-transform"
                      style={{
                        background: c,
                        outline: form.avatar_color === c ? "2px solid var(--gold)" : "none",
                        outlineOffset: 2,
                      }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)}
                  className="flex-1 py-2 rounded font-display text-xs gold-border
                             hover:bg-yellow-900/20 transition-colors"
                  style={{ color: "var(--gold)" }}>Cancel</button>
                <button onClick={saveProfile} disabled={saving}
                  className="flex-1 py-2 rounded font-display text-xs font-semibold
                             hover:brightness-110 transition-all disabled:opacity-60"
                  style={{ background: "var(--gold)", color: "#1a0a02" }}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="mt-5 pt-5 border-t space-y-2" style={{ borderColor: "var(--border-col)" }}>
            <ProfileStat icon={<BookOpen size={13}/>} label="Volumes Written" value={myBooks.length} />
            <ProfileStat icon={<Star size={13}/>}     label="Member Since"    value={new Date(user.created_at).getFullYear()} />
          </div>
        </div>

        {/* ── My books ── */}
        <div>
          {(isAuthor || isAdmin) && (
            <>
              <h3 className="font-display text-lg gold-text font-bold mb-4">My Volumes</h3>
              {loading ? (
                <div className="flex justify-center py-12"><span className="text-4xl candle-flame">🕯️</span></div>
              ) : myBooks.length === 0 ? (
                <div className="archive-card p-8 text-center">
                  <p className="font-body text-base" style={{ color: "var(--text-lo)" }}>
                    You haven't written any volumes yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myBooks.map((b, i) => (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="archive-card p-4 flex gap-4 items-start"
                    >
                      {/* Spine swatch */}
                      <div
                        className="w-3 self-stretch rounded-sm shrink-0"
                        style={{ background: b.cover_color, minHeight: 48 }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-display text-base font-bold gold-text leading-snug">
                              {b.title}
                            </h4>
                            <p className="font-body text-xs mt-0.5" style={{ color: "var(--text-lo)" }}>
                              {b.genre || "No genre"} · {b.pages?.length || 0} pages ·{" "}
                              <span className="capitalize">{b.visibility}</span>
                            </p>
                          </div>
                          {b.avg_rating && (
                            <StarRating value={Math.round(b.avg_rating)} readonly size={13} />
                          )}
                        </div>
                        {b.tags?.length > 0 && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {b.tags.slice(0, 4).map((t) => (
                              <span key={t} className="tag-pill">{t}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-3 mt-3">
                          <button onClick={() => onViewBook(b)}
                            className="font-body text-xs flex items-center gap-1 hover:underline"
                            style={{ color: "var(--gold)" }}>
                            <BookOpen size={11} /> Read
                          </button>
                          <button onClick={() => onEditBook(b)}
                            className="font-body text-xs flex items-center gap-1 hover:underline"
                            style={{ color: "var(--text-lo)" }}>
                            Edit
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {!isAuthor && !isAdmin && (
            <div className="archive-card p-8 text-center">
              <p className="font-body text-base" style={{ color: "var(--text-lo)" }}>
                You are a Reader. Browse the shelves and leave reviews on volumes you enjoy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileStat({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 font-body text-xs" style={{ color: "var(--text-lo)" }}>
        <span style={{ color: "var(--gold-dim)" }}>{icon}</span> {label}
      </span>
      <span className="font-display text-sm gold-text">{value}</span>
    </div>
  );
}
