import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Bookmark, BookmarkCheck,
  Star, MessageSquare, Eye, Award, Lock
} from "lucide-react";
import { bookmarksApi, ratingsApi, progressApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import OrnateFrame from "./OrnateFrame";
import StarRating from "./StarRating";

/* ── Page flip animation variants ─────────────────────────────────────── */
const flipVariants = {
  enter: (dir) => ({ rotateY: dir > 0 ? 85 : -85, opacity: 0, scale: 0.97 }),
  center: {
    rotateY: 0, opacity: 1, scale: 1,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: (dir) => ({
    rotateY: dir < 0 ? 85 : -85, opacity: 0, scale: 0.97,
    transition: { duration: 0.28, ease: "easeIn" },
  }),
};

/* ── Review form ───────────────────────────────────────────────────────── */
function ReviewForm({ bookId, existingRating, onSaved }) {
  const [stars,   setStars]   = useState(existingRating?.stars || 0);
  const [review,  setReview]  = useState(existingRating?.review || "");
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);

  const save = async () => {
    if (!stars) return;
    setSaving(true);
    try {
      if (existingRating) {
        await ratingsApi.update(existingRating.id, { stars, review });
      } else {
        await ratingsApi.create(bookId, { stars, review });
      }
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onSaved?.(); }, 1800);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div className="mt-5 pt-5 border-t" style={{ borderColor: "rgba(139,105,20,.25)" }}>
      <p className="font-display text-sm mb-3" style={{ color: "#8B6914" }}>
        {existingRating ? "Update your review" : "Leave a review"}
      </p>
      <StarRating value={stars} onChange={setStars} size={22} />
      <textarea
        rows={3} value={review} onChange={(e) => setReview(e.target.value)}
        placeholder="Share your thoughts on this volume…"
        className="w-full mt-3 bg-transparent border-b font-body text-sm
                   resize-none focus:outline-none placeholder-yellow-900/35"
        style={{ color: "var(--ink)", borderColor: "rgba(139,105,20,.28)", fontFamily: "'Crimson Text',serif" }}
      />
      <button
        onClick={save} disabled={!stars || saving}
        className="mt-3 font-display text-xs px-5 py-2 rounded-lg
                   hover:brightness-110 transition-all disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,var(--gold-dim),var(--gold))", color: "#1a0a02" }}
      >
        {success ? "✦ Inscribed!" : saving ? "Saving…" : "Submit Review"}
      </button>
    </div>
  );
}

/* ── Main BookViewer ───────────────────────────────────────────────────── */
export default function BookViewer({ book, onBack }) {
  const { user, isLoggedIn } = useAuth();
  const pages = book.pages || [];

  const [[pageIdx, dir], setPage] = useState([0, 0]);
  const [bookmarks,  setBookmarks]  = useState([]);
  const [ratings,    setRatings]    = useState([]);
  const [myRating,   setMyRating]   = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [progress,   setProgress]   = useState(null);
  const [sideTab,    setSideTab]    = useState("info");  // info|reviews|bookmarks

  /* ── Load side data ── */
  useEffect(() => {
    if (!isLoggedIn) return;
    bookmarksApi.list(book.id).then(({ data }) => setBookmarks(data)).catch(() => {});
    ratingsApi.list(book.id).then(({ data }) => {
      setRatings(data);
      setMyRating(data.find((r) => r.user.id === user?.id) || null);
    }).catch(() => {});
    progressApi.get(book.id).then(({ data }) => {
      setProgress(data);
      if (data.current_page < pages.length) setPage([data.current_page, 1]);
    }).catch(() => {});
  }, [book.id, isLoggedIn]);

  /* ── Save progress on page change ── */
  useEffect(() => {
    if (!isLoggedIn || !pages.length) return;
    const t = setTimeout(() =>
      progressApi.update(book.id, {
        current_page: pageIdx,
        completed: pageIdx === pages.length - 1,
      }).catch(() => {}),
    800);
    return () => clearTimeout(t);
  }, [pageIdx, book.id, isLoggedIn, pages.length]);

  const goTo = (next) => {
    if (next < 0 || next >= pages.length) return;
    setPage([next, next > pageIdx ? 1 : -1]);
  };

  /* ── Bookmark current page ── */
  const currentPage = pages[pageIdx];
  const isBookmarked = currentPage
    ? bookmarks.some((b) => b.page_id === currentPage.id)
    : false;

  const toggleBookmark = async () => {
    if (!currentPage || !isLoggedIn) return;
    if (isBookmarked) {
      const bm = bookmarks.find((b) => b.page_id === currentPage.id);
      await bookmarksApi.delete(bm.id);
      setBookmarks((bs) => bs.filter((b) => b.id !== bm.id));
    } else {
      const { data } = await bookmarksApi.create(book.id, {
        page_id: currentPage.id, page_index: pageIdx,
      });
      setBookmarks((bs) => [...bs, data]);
    }
  };

  /* ── Progress bar % ── */
  const progressPct = pages.length > 1
    ? Math.round((pageIdx / (pages.length - 1)) * 100)
    : 100;

  const avgRating = ratings.length
    ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      {/* ── Progress bar ── */}
      <div className="w-full max-w-5xl mb-2">
        <div className="progress-track h-1 w-full">
          <div className="progress-fill h-1" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* ── Header ── */}
      <div className="w-full max-w-5xl flex items-start gap-4 mb-6">
        <button onClick={onBack}
          className="flex items-center gap-1.5 font-body text-sm hover:underline mt-0.5"
          style={{ color: "var(--text-lo)" }}>
          <ChevronLeft size={15} /> Shelf
        </button>
        <div className="flex-1 text-center">
          <h2 className="font-display text-2xl font-bold gold-text">{book.title}</h2>
          <div className="flex items-center justify-center gap-3 mt-1">
            {book.genre && (
              <span className="font-body text-sm italic" style={{ color: "var(--text-lo)" }}>
                {book.genre}
              </span>
            )}
            {avgRating && (
              <span className="font-body text-sm flex items-center gap-1"
                    style={{ color: "var(--gold)" }}>
                ★ {avgRating} <span style={{ color: "var(--text-lo)", fontSize: ".8rem" }}>({ratings.length})</span>
              </span>
            )}
            {book.visibility === "private" && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-lo)" }}>
                <Lock size={11} /> Private
              </span>
            )}
            {book.is_featured && (
              <span className="flex items-center gap-1 text-xs gold-text">
                <Award size={11} /> Featured
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {/* Bookmark toggle */}
          <button onClick={toggleBookmark} title={isBookmarked ? "Remove bookmark" : "Bookmark this page"}
            className="hover:scale-110 transition-transform"
            style={{ color: isBookmarked ? "#d4af37" : "var(--text-lo)" }}>
            {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
          {/* Eye count */}
          <span className="font-body text-xs flex items-center gap-1"
                style={{ color: "var(--text-lo)" }}>
            <Eye size={12} /> {book.view_count ?? 0}
          </span>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="w-full max-w-5xl grid md:grid-cols-[1fr_280px] gap-6">

        {/* ── Left: Parchment Page ── */}
        <div>
          <div className="flip-container">
            <AnimatePresence custom={dir} mode="wait">
              {currentPage ? (
                <motion.div
                  key={pageIdx}
                  custom={dir} variants={flipVariants}
                  initial="enter" animate="center" exit="exit"
                  className="parchment-page rounded-2xl p-7 md:p-10 min-h-80"
                  style={{ transformStyle: "preserve-3d", color: "var(--ink)" }}
                >
                  {/* Page number header */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-xs tracking-widest" style={{ color: "rgba(139,105,20,.55)" }}>
                      — {pageIdx + 1} —
                    </span>
                    <span className="font-body text-xs italic" style={{ color: "rgba(139,105,20,.55)" }}>
                      {book.title}
                    </span>
                    <span className="font-mono text-xs" style={{ color: "rgba(139,105,20,.55)" }}>
                      of {pages.length}
                    </span>
                  </div>
                  <div className="h-px mb-6" style={{ background: "rgba(139,105,20,.2)" }} />

                  {/* Text */}
                  {currentPage.text && (
                    <p className="font-body text-lg md:text-xl leading-loose whitespace-pre-wrap mb-6"
                       style={{ color: "var(--ink)", fontFamily: "'Crimson Text',serif" }}>
                      {currentPage.text}
                    </p>
                  )}

                  {/* Media */}
                  {currentPage.media_url && (
                    <div className="flex justify-center my-4">
                      <OrnateFrame
                        src={currentPage.media_url}
                        type={currentPage.media_type || "image"}
                        alt={`Page ${pageIdx + 1}`}
                      />
                    </div>
                  )}

                  {/* Ornament */}
                  <div className="mt-8 text-center" style={{ color: "rgba(139,105,20,.4)" }}>
                    ✦ &ensp; ✦ &ensp; ✦
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="parchment-page rounded-2xl p-10 min-h-80 flex items-center justify-center">
                  <p className="font-display text-xl italic" style={{ color: "var(--text-lo)" }}>
                    This volume has no pages yet.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Navigation ── */}
          {pages.length > 1 && (
            <div className="flex items-center justify-center gap-5 mt-6">
              <button onClick={() => goTo(pageIdx - 1)} disabled={pageIdx === 0}
                className="w-10 h-10 rounded-full gold-border flex items-center justify-center
                           hover:bg-yellow-900/20 transition-colors disabled:opacity-25"
                style={{ color: "var(--gold)" }}>
                <ChevronLeft size={18} />
              </button>

              {/* Dot nav */}
              <div className="flex gap-1.5 flex-wrap justify-center max-w-sm">
                {pages.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === pageIdx ? 22 : 8, height: 8,
                      background: i === pageIdx ? "var(--gold)" : "var(--gold-dim)",
                      opacity: i === pageIdx ? 1 : 0.45,
                    }}
                  />
                ))}
              </div>

              <button onClick={() => goTo(pageIdx + 1)} disabled={pageIdx === pages.length - 1}
                className="w-10 h-10 rounded-full gold-border flex items-center justify-center
                           hover:bg-yellow-900/20 transition-colors disabled:opacity-25"
                style={{ color: "var(--gold)" }}>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Sidebar ── */}
        <div className="flex flex-col gap-4">
          {/* Sidebar tabs */}
          <div className="archive-card overflow-hidden">
            <div className="flex border-b" style={{ borderColor: "var(--border-col)" }}>
              {[
                { val: "info",      label: "Details"    },
                { val: "reviews",   label: `Reviews${ratings.length ? ` (${ratings.length})` : ""}` },
                { val: "bookmarks", label: "Bookmarks"  },
              ].map((t) => (
                <button key={t.val} onClick={() => setSideTab(t.val)}
                  className="flex-1 py-2.5 font-display text-xs tracking-wider transition-colors"
                  style={{
                    color: sideTab === t.val ? "var(--gold)" : "var(--text-lo)",
                    borderBottom: sideTab === t.val ? `2px solid var(--gold)` : "2px solid transparent",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* Details tab */}
              {sideTab === "info" && (
                <div className="space-y-3">
                  <InfoRow label="Author"  value={book.author?.username} />
                  <InfoRow label="Genre"   value={book.genre || "—"} />
                  {book.description && (
                    <div>
                      <p className="font-body text-xs tracking-widest uppercase mb-1"
                         style={{ color: "var(--gold-dim)" }}>Synopsis</p>
                      <p className="font-body text-sm leading-relaxed"
                         style={{ color: "var(--text-lo)" }}>{book.description}</p>
                    </div>
                  )}
                  {book.tags?.length > 0 && (
                    <div>
                      <p className="font-body text-xs tracking-widest uppercase mb-2"
                         style={{ color: "var(--gold-dim)" }}>Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {book.tags.map((t) => (
                          <span key={t} className="tag-pill">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <InfoRow label="Pages"  value={pages.length} />
                  <InfoRow label="Views"  value={book.view_count ?? 0} />
                  {avgRating && <InfoRow label="Rating" value={`★ ${avgRating}/5`} />}
                  <InfoRow label="Progress" value={`${progressPct}%`} />
                  <div className="progress-track h-1.5 mt-1">
                    <div className="progress-fill h-1.5" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              )}

              {/* Reviews tab */}
              {sideTab === "reviews" && (
                <div>
                  {ratings.length === 0 && (
                    <p className="font-body text-sm text-center py-4" style={{ color: "var(--text-lo)" }}>
                      No reviews yet.
                    </p>
                  )}
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {ratings.map((r) => (
                      <div key={r.id} className="border-b pb-3" style={{ borderColor: "rgba(212,175,55,.1)" }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-display text-xs" style={{ color: "var(--text-hi)" }}>
                            {r.user.username}
                          </span>
                          <span className="font-body text-xs" style={{ color: "var(--gold)" }}>
                            {"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}
                          </span>
                        </div>
                        {r.review && (
                          <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-lo)" }}>
                            {r.review}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {isLoggedIn && (
                    <div className="mt-4">
                      <button onClick={() => setShowReview((v) => !v)}
                        className="font-body text-xs flex items-center gap-1.5"
                        style={{ color: "var(--gold)" }}>
                        <Star size={12} />
                        {myRating ? "Edit your review" : "Write a review"}
                      </button>
                      {showReview && (
                        <ReviewForm
                          bookId={book.id}
                          existingRating={myRating}
                          onSaved={() => {
                            setShowReview(false);
                            ratingsApi.list(book.id).then(({ data }) => {
                              setRatings(data);
                              setMyRating(data.find((r) => r.user.id === user?.id) || null);
                            });
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bookmarks tab */}
              {sideTab === "bookmarks" && (
                <div>
                  {bookmarks.length === 0 && (
                    <p className="font-body text-sm text-center py-4" style={{ color: "var(--text-lo)" }}>
                      No bookmarks yet. Click the ribbon icon to bookmark a page.
                    </p>
                  )}
                  <div className="space-y-2">
                    {bookmarks.map((bm) => (
                      <button key={bm.id}
                        onClick={() => goTo(bm.page_index)}
                        className="w-full flex items-center gap-2 px-2 py-2 rounded
                                   hover:bg-yellow-900/10 transition-colors text-left"
                      >
                        <BookmarkCheck size={13} style={{ color: "var(--gold)" }} />
                        <span className="font-body text-sm" style={{ color: "var(--text-lo)" }}>
                          Page {bm.page_index + 1}
                        </span>
                        {bm.note && (
                          <span className="font-body text-xs italic truncate flex-1"
                                style={{ color: "var(--text-lo)", opacity: 0.7 }}>
                            — {bm.note}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="font-body text-xs tracking-widest uppercase" style={{ color: "var(--gold-dim)" }}>
        {label}
      </span>
      <span className="font-body text-sm" style={{ color: "var(--text-lo)" }}>{value}</span>
    </div>
  );
}
