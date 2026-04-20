import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Edit3, Trash2, BookOpen, Eye, Star, Lock, Award } from "lucide-react";
import { booksApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import SearchBar from "./SearchBar";
import WaxSealModal from "./WaxSealModal";

const DAYS_AGED = 7;

function isAged(book) {
  if (!book.last_opened) return true;
  return (Date.now() - new Date(book.last_opened)) / 86400000 > DAYS_AGED;
}

function chunk(arr, n) {
  const rows = [];
  for (let i = 0; i < arr.length; i += n) rows.push(arr.slice(i, i + n));
  return rows;
}

function renderStars(avg) {
  if (!avg) return null;
  return (
    <div className="flex gap-0.5 items-center">
      {[1,2,3,4,5].map((s) => (
        <span key={s} style={{ color: s <= Math.round(avg) ? "#d4af37" : "rgba(212,175,55,.2)", fontSize: 9 }}>★</span>
      ))}
    </div>
  );
}

/* ── BookSpine ─────────────────────────────────────────────────────────── */
function BookSpine({ book, onOpen, onEdit, onDelete, canModify }) {
  const [hovered, setHovered] = useState(false);
  const aged = isAged(book);
  const isDark = parseInt(book.cover_color.replace("#",""), 16) < 0x888888;

  return (
    <div
      className={`relative book-spine ${aged ? "book-aged" : ""}`}
      style={{ width: 46, minHeight: 185 + (book.title.length % 4) * 18 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Spine body */}
      <div
        className="w-full h-full rounded-sm flex flex-col items-center
                   justify-between py-3 px-1.5 select-none"
        style={{
          background: `linear-gradient(180deg,${book.cover_color}ee 0%,${book.cover_color} 40%,${book.cover_color}bb 100%)`,
          boxShadow: "inset -3px 0 8px rgba(0,0,0,0.4), inset 2px 0 4px rgba(255,255,255,.06)",
          minHeight: "inherit",
        }}
        onClick={() => onOpen(book)}
      >
        {/* Featured star */}
        {book.is_featured && (
          <span style={{ color: "#d4af37", fontSize: 9 }}>★</span>
        )}

        {/* Title */}
        <span
          className="font-display text-xs font-semibold"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            color: isDark ? "#f5e6c8" : "#1a0a02",
            letterSpacing: ".05em",
            textShadow: isDark ? "0 1px 3px rgba(0,0,0,.7)" : "0 1px 2px rgba(255,255,255,.4)",
            lineHeight: 1.1, maxHeight: "120px", overflow: "hidden",
          }}
        >
          {book.title}
        </span>

        {/* Rating stars */}
        {book.avg_rating && (
          <div style={{ transform: "rotate(-90deg)" }}>
            {renderStars(book.avg_rating)}
          </div>
        )}

        {/* Private lock */}
        {book.visibility === "private" && (
          <span style={{ color: isDark ? "#f5e6c8" : "#1a0a02", fontSize: 9, opacity: 0.7 }}>🔒</span>
        )}

        {/* Bottom ornament */}
        <span style={{ color: isDark ? "#d4af37" : "#8B6914", fontSize: 10 }}>✦</span>
      </div>

      {/* 3D edge */}
      <div className="book-spine-edge" />

      {/* Hover overlay */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5"
          >
            {/* Title card */}
            <div className="tooltip text-center max-w-44 text-wrap leading-snug">
              {book.title}
              {book.genre && <div className="opacity-60 text-xs">{book.genre}</div>}
              {book.avg_rating && (
                <div className="flex justify-center mt-0.5">{renderStars(book.avg_rating)}</div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-1">
              <SpineBtn icon={<BookOpen size={11}/>} onClick={() => onOpen(book)} title="Read" />
              {canModify && <>
                <SpineBtn icon={<Edit3 size={11}/>}  onClick={() => onEdit(book)} title="Edit"  bg="#2C4A6E" />
                <SpineBtn icon={<Trash2 size={11}/>} onClick={() => onDelete(book)} title="Delete" bg="#8B0000" />
              </>}
            </div>

            {/* View count */}
            <div className="flex items-center gap-1" style={{ color: "var(--gold-dim)", fontSize: "0.65rem" }}>
              <Eye size={9} /> {book.view_count ?? 0}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SpineBtn({ icon, onClick, title, bg = "#6B1A1A" }) {
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="w-7 h-7 rounded flex items-center justify-center
                 hover:scale-110 transition-transform text-yellow-100"
      style={{ background: bg, boxShadow: "0 2px 8px rgba(0,0,0,.6)" }}
    >
      {icon}
    </button>
  );
}

/* ── ShelfRow ──────────────────────────────────────────────────────────── */
function ShelfRow({ books, onOpen, onEdit, onDelete, canModify }) {
  return (
    <div className="shelf-row mb-1">
      <div className="shelf-floor relative px-6 py-3 flex items-end gap-2 flex-wrap min-h-52">
        <AnimatePresence>
          {books.map((b, i) => (
            <motion.div
              key={b.id} layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 26, delay: i * 0.03 }}
            >
              <BookSpine
                book={b}
                onOpen={onOpen}
                onEdit={onEdit}
                onDelete={onDelete}
                canModify={canModify(b)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="shelf-lip h-4 rounded-b-sm" />
    </div>
  );
}

/* ── Filter bar ─────────────────────────────────────────────────────────── */
const GENRES = ["All", "Fantasy", "Poetry", "History", "Science", "Fiction", "Linguistics", "Gothic", "Philosophy"];
const SORTS  = [
  { val: "updated", label: "Recently Updated" },
  { val: "created", label: "Newest First"     },
  { val: "title",   label: "Title A–Z"        },
  { val: "views",   label: "Most Viewed"      },
];

/* ── Main ──────────────────────────────────────────────────────────────── */
export default function Bookshelf({ onOpenBook, onEditBook, onNewBook, onAuthRequired }) {
  const { user, isAuthor, isAdmin, isLoggedIn } = useAuth();

  const [books,    setBooks]    = useState([]);
  const [search,   setSearch]   = useState("");
  const [genre,    setGenre]    = useState("All");
  const [sort,     setSort]     = useState("updated");
  const [tab,      setTab]      = useState("all");   // all | featured | mine
  const [loading,  setLoading]  = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    setLoading(true);
    const params = {
      ...(search            ? { search }                   : {}),
      ...(genre !== "All"   ? { genre }                    : {}),
      ...(sort              ? { sort }                     : {}),
      ...(tab === "mine"    ? { author_id: user?.id }      : {}),
    };
    const req = tab === "featured"
      ? booksApi.featured()
      : booksApi.list(params);
    const t = setTimeout(() =>
      req.then(({ data }) => setBooks(data))
         .catch(() => setError("The Archive is unreachable."))
         .finally(() => setLoading(false)),
      search ? 350 : 0
    );
    return () => clearTimeout(t);
  }, [search, genre, sort, tab, isLoggedIn, user?.id]);

  const canModify = (b) => isAdmin || (isAuthor && b.author_id === user?.id);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await booksApi.delete(toDelete.id);
      setBooks((p) => p.filter((b) => b.id !== toDelete.id));
    } catch { setError("Deletion failed."); }
    finally { setDeleting(false); setToDelete(null); }
  };

  /* ── Empty state ── */
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-8">
        <div className="text-7xl candle-flame">📚</div>
        <h2 className="font-display text-4xl gold-text text-center">The Archive Awaits</h2>
        <p className="font-body text-xl text-center max-w-lg" style={{ color: "var(--text-lo)" }}>
          A vast repository of knowledge and stories, curated for the discerning scholar.
          Sign in to browse the shelves.
        </p>
        <button onClick={onAuthRequired}
          className="font-display px-9 py-3 rounded-lg gold-border
                     hover:bg-yellow-900/20 transition-colors text-lg tracking-wider"
          style={{ color: "var(--gold)" }}>
          Enter the Archive
        </button>
      </div>
    );
  }

  const rows = chunk(books, 11);

  return (
    <div className="p-6 md:p-10">
      {/* ── Controls ── */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1 max-w-xl">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          <select
            value={sort} onChange={(e) => setSort(e.target.value)}
            className="brass-input px-3 py-2.5 rounded-lg text-sm cursor-pointer"
          >
            {SORTS.map((s) => (
              <option key={s.val} value={s.val}>{s.label}</option>
            ))}
          </select>

          {(isAuthor || isAdmin) && (
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={onNewBook}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                         font-display text-sm font-semibold shrink-0"
              style={{
                background: "linear-gradient(135deg,var(--gold-dim),var(--gold))",
                color: "#1a0a02",
              }}
            >
              <PlusCircle size={15} /> Add Volume
            </motion.button>
          )}
        </div>

        {/* Tabs + genre filter */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Tabs */}
          {[
            { val: "all",      label: "All Volumes" },
            { val: "featured", label: "✦ Featured"  },
            ...(isAuthor || isAdmin ? [{ val: "mine", label: "My Volumes" }] : []),
          ].map((t) => (
            <button key={t.val} onClick={() => setTab(t.val)}
              className="font-body text-xs px-4 py-1.5 rounded-full transition-all"
              style={{
                background: tab === t.val ? "rgba(212,175,55,.18)" : "transparent",
                border: `1px solid ${tab === t.val ? "var(--gold)" : "var(--border-col)"}`,
                color: tab === t.val ? "var(--gold)" : "var(--text-lo)",
              }}
            >
              {t.label}
            </button>
          ))}

          <div className="h-4 w-px mx-1" style={{ background: "var(--border-col)" }} />

          {/* Genre pills */}
          {GENRES.map((g) => (
            <button key={g} onClick={() => setGenre(g)}
              className="font-body text-xs px-3 py-1 rounded-full transition-all"
              style={{
                background: genre === g ? "rgba(212,175,55,.12)" : "transparent",
                border: `1px solid ${genre === g ? "rgba(212,175,55,.5)" : "var(--border-col)"}`,
                color: genre === g ? "var(--gold)" : "var(--text-lo)",
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-center font-body mb-6">{error}</p>}

      {/* ── Shelves ── */}
      {loading ? (
        <div className="flex justify-center py-40">
          <div className="text-6xl candle-flame">🕯️</div>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-40">
          <div className="text-5xl mb-5 opacity-40">📚</div>
          <p className="font-display text-2xl" style={{ color: "var(--text-lo)" }}>
            {search ? "No volumes match your search." : "These shelves are empty."}
          </p>
          {(isAuthor || isAdmin) && (
            <button onClick={onNewBook}
              className="mt-6 font-display text-base gold-border px-6 py-2.5 rounded
                         hover:bg-yellow-900/20 transition-colors"
              style={{ color: "var(--gold)" }}>
              Add the first volume
            </button>
          )}
        </div>
      ) : (
        <div>
          <p className="font-body text-xs mb-4" style={{ color: "var(--text-lo)" }}>
            {books.length} volume{books.length !== 1 ? "s" : ""} on the shelves
          </p>
          {rows.map((row, i) => (
            <ShelfRow
              key={i} books={row}
              onOpen={onOpenBook} onEdit={onEditBook} onDelete={setToDelete}
              canModify={canModify}
            />
          ))}
        </div>
      )}

      <WaxSealModal
        isOpen={!!toDelete}
        bookTitle={toDelete?.title}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
