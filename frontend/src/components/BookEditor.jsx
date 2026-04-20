import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Save, ChevronLeft, ChevronRight,
  Image, Video, FileText, Eye, EyeOff, Tag, X
} from "lucide-react";
import { v4 as uuid } from "uuid";
import { booksApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import OrnateFrame from "./OrnateFrame";

const COVER_PRESETS = [
  "#8B0000","#2C4A6E","#1B4332","#4A2C6B",
  "#7A3B00","#1A3A5C","#5C1A1A","#2D4A1E",
  "#3D2B1F","#1C3A4A","#4A1A2C","#2C3D1A",
];

const emptyPage = () => ({ id: uuid(), text: "", media_url: "", media_type: "image" });

/* ── Tag input ───────────────────────────────────────────────────────── */
function TagInput({ tags, onChange }) {
  const [val, setVal] = useState("");
  const add = () => {
    const t = val.trim().toLowerCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setVal("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <span key={t} className="tag-pill flex items-center gap-1">
            {t}
            <button onClick={() => onChange(tags.filter((x) => x !== t))}
                    className="hover:text-red-400 transition-colors ml-0.5">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); }}}
          placeholder="Add tag…"
          className="brass-input flex-1 px-3 py-1.5 rounded text-sm"
        />
        <button onClick={add}
          className="px-3 py-1.5 rounded font-body text-xs gold-border
                     hover:bg-yellow-900/20 transition-colors"
          style={{ color: "var(--gold)" }}>
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────── */
export default function BookEditor({ book, onBack, onSaved }) {
  const { isAdmin } = useAuth();
  const isNew = !book;

  const [meta, setMeta] = useState({
    title:       book?.title       || "",
    description: book?.description || "",
    genre:       book?.genre       || "",
    cover_color: book?.cover_color || "#8B0000",
    cover_image: book?.cover_image || "",
    visibility:  book?.visibility  || "public",
    tags:        book?.tags        || [],
  });

  const [pages,   setPages]   = useState(book?.pages?.length ? book.pages : [emptyPage()]);
  const [pageIdx, setPageIdx] = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  const setM = (k, v) => setMeta((m) => ({ ...m, [k]: v }));

  /* ── Page management ── */
  const updatePage = (k, v) =>
    setPages((ps) => ps.map((p, i) => (i === pageIdx ? { ...p, [k]: v } : p)));

  const addPage = () => {
    const next = [...pages, emptyPage()];
    setPages(next); setPageIdx(next.length - 1);
  };

  const removePage = () => {
    if (pages.length === 1) return;
    setPages((ps) => ps.filter((_, i) => i !== pageIdx));
    setPageIdx((i) => Math.max(0, i - 1));
  };

  const movePage = (dir) => {
    const next = pageIdx + dir;
    if (next < 0 || next >= pages.length) return;
    const ps = [...pages];
    [ps[pageIdx], ps[next]] = [ps[next], ps[pageIdx]];
    setPages(ps); setPageIdx(next);
  };

  /* ── Save ── */
  const save = async () => {
    if (!meta.title.trim()) { setError("A title is required."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        ...meta,
        pages: pages.map((p) => ({
          ...p,
          media_url:  p.media_url  || null,
          media_type: p.media_url  ? p.media_type : null,
        })),
      };
      if (isNew) { await booksApi.create(payload); }
      else       { await booksApi.update(book.id, payload); }
      setSaved(true);
      setTimeout(() => onSaved(), 900);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save.");
    } finally { setSaving(false); }
  };

  const pg = pages[pageIdx];

  return (
    <div className="min-h-screen p-5 md:p-8">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-4 mb-7">
        <button onClick={onBack}
          className="flex items-center gap-1.5 font-body text-sm hover:underline"
          style={{ color: "var(--text-lo)" }}>
          <ChevronLeft size={15} /> Back
        </button>
        <h1 className="flex-1 font-display text-2xl gold-text font-bold truncate">
          {isNew ? "New Volume" : `Editing: ${meta.title}`}
        </h1>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={save} disabled={saving || saved}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                     font-display text-sm font-semibold disabled:opacity-70"
          style={{
            background: saved
              ? "linear-gradient(135deg,#1B4332,#2D6A4F)"
              : "linear-gradient(135deg,var(--gold-dim),var(--gold))",
            color: "#1a0a02",
          }}
        >
          <Save size={14} />
          {saved ? "✦ Saved!" : saving ? "Saving…" : "Save Volume"}
        </motion.button>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-[280px_1fr] gap-7">
        {/* ── Left: Metadata panel ── */}
        <div className="space-y-5 md:sticky md:top-6 md:self-start">
          <div className="archive-card p-5 space-y-4">
            <h3 className="font-display text-sm tracking-widest uppercase gold-text">Volume Details</h3>

            <Field label="Title *">
              <input value={meta.title} onChange={(e) => setM("title", e.target.value)}
                     placeholder="A Tale of…" className="brass-input w-full px-3 py-2.5 rounded-lg text-sm" />
            </Field>

            <Field label="Genre">
              <input value={meta.genre} onChange={(e) => setM("genre", e.target.value)}
                     placeholder="Fantasy, History…" className="brass-input w-full px-3 py-2.5 rounded-lg text-sm" />
            </Field>

            <Field label="Synopsis">
              <textarea rows={3} value={meta.description}
                onChange={(e) => setM("description", e.target.value)}
                placeholder="A brief synopsis of this volume…"
                className="brass-input w-full px-3 py-2.5 rounded-lg text-sm resize-none" />
            </Field>

            <Field label="Cover Image URL (optional)">
              <input value={meta.cover_image} onChange={(e) => setM("cover_image", e.target.value)}
                     placeholder="https://…" className="brass-input w-full px-3 py-2.5 rounded-lg text-sm" />
            </Field>

            <Field label="Tags">
              <TagInput tags={meta.tags} onChange={(t) => setM("tags", t)} />
            </Field>

            {/* Visibility */}
            <Field label="Visibility">
              <div className="flex gap-2">
                {[
                  { val: "public",  icon: <Eye size={12} />,    label: "Public"  },
                  { val: "private", icon: <EyeOff size={12} />, label: "Private" },
                ].map(({ val, icon, label }) => (
                  <button key={val} onClick={() => setM("visibility", val)}
                    className="flex-1 flex items-center justify-center gap-1.5
                               py-2 rounded text-xs font-body transition-all"
                    style={{
                      background: meta.visibility === val ? "rgba(212,175,55,.15)" : "transparent",
                      border: `1px solid ${meta.visibility === val ? "var(--gold)" : "var(--border-col)"}`,
                      color: meta.visibility === val ? "var(--gold)" : "var(--text-lo)",
                    }}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Cover colour */}
            <Field label="Cover Leather">
              <div className="flex flex-wrap gap-2">
                {COVER_PRESETS.map((c) => (
                  <button key={c} onClick={() => setM("cover_color", c)}
                    className="w-8 h-8 rounded-sm transition-all hover:scale-110"
                    style={{
                      background: c,
                      outline: meta.cover_color === c ? "2.5px solid var(--gold)" : "none",
                      outlineOffset: 2,
                    }} />
                ))}
                <input type="color" value={meta.cover_color}
                  onChange={(e) => setM("cover_color", e.target.value)}
                  className="w-8 h-8 rounded-sm cursor-pointer border-0 p-0"
                  title="Custom" />
              </div>
            </Field>
          </div>

          {/* Spine preview */}
          <div className="archive-card p-5">
            <p className="font-body text-xs tracking-widest uppercase mb-3" style={{ color: "var(--gold-dim)" }}>
              Spine Preview
            </p>
            <div className="flex justify-center">
              <div
                className="w-14 h-40 rounded-sm flex items-center justify-center shadow-book"
                style={{
                  background: `linear-gradient(180deg,${meta.cover_color}ee,${meta.cover_color})`,
                  boxShadow: "inset -3px 0 8px rgba(0,0,0,0.45)",
                  position: "relative",
                }}
              >
                <div className="book-spine-edge" />
                <span className="font-display text-xs font-bold"
                  style={{
                    writingMode: "vertical-rl", transform: "rotate(180deg)",
                    color: "#f5e6c8", maxHeight: "130px", overflow: "hidden",
                    textShadow: "0 1px 4px rgba(0,0,0,.8)",
                  }}>
                  {meta.title || "Untitled"}
                </span>
              </div>
            </div>
            <p className="text-center font-body text-xs mt-2" style={{ color: "var(--text-lo)" }}>
              {pages.length} page{pages.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ── Right: Page editor ── */}
        <div>
          {/* Page nav bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => goPage(pageIdx - 1)} disabled={pageIdx === 0}
                className="w-8 h-8 rounded gold-border flex items-center justify-center
                           hover:bg-yellow-900/20 disabled:opacity-25"
                style={{ color: "var(--gold)" }}>
                <ChevronLeft size={13} />
              </button>
              <span className="font-body text-sm min-w-24 text-center" style={{ color: "var(--text-lo)" }}>
                Page {pageIdx + 1} / {pages.length}
              </span>
              <button onClick={() => goPage(pageIdx + 1)} disabled={pageIdx === pages.length - 1}
                className="w-8 h-8 rounded gold-border flex items-center justify-center
                           hover:bg-yellow-900/20 disabled:opacity-25"
                style={{ color: "var(--gold)" }}>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => movePage(-1)} disabled={pageIdx === 0}
                className="font-body text-xs px-2.5 py-1.5 rounded gold-border
                           hover:bg-yellow-900/20 disabled:opacity-25 transition-colors"
                style={{ color: "var(--gold)" }} title="Move page left">
                ← Move
              </button>
              <button onClick={() => movePage(1)} disabled={pageIdx === pages.length - 1}
                className="font-body text-xs px-2.5 py-1.5 rounded gold-border
                           hover:bg-yellow-900/20 disabled:opacity-25 transition-colors"
                style={{ color: "var(--gold)" }} title="Move page right">
                Move →
              </button>
              <button onClick={addPage}
                className="flex items-center gap-1 font-body text-xs px-3 py-1.5 rounded
                           gold-border hover:bg-yellow-900/20 transition-colors"
                style={{ color: "var(--gold)" }}>
                <Plus size={11} /> Add Page
              </button>
              {pages.length > 1 && (
                <button onClick={removePage}
                  className="flex items-center gap-1 font-body text-xs px-3 py-1.5 rounded
                             border border-red-900/50 hover:bg-red-900/15 transition-colors text-red-400">
                  <Trash2 size={11} /> Remove
                </button>
              )}
            </div>
          </div>

          {/* Parchment page editor */}
          <AnimatePresence mode="wait">
            <motion.div
              key={pageIdx}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.2 }}
              className="parchment-page rounded-2xl p-6 md:p-9"
            >
              {/* Text section */}
              <div className="mb-6">
                <label className="flex items-center gap-1.5 font-body text-xs
                                  tracking-widest uppercase mb-3"
                       style={{ color: "#8B6914" }}>
                  <FileText size={12} /> Page Text
                </label>
                <textarea
                  rows={10}
                  value={pg.text}
                  onChange={(e) => updatePage("text", e.target.value)}
                  placeholder="Write your passage here…\n\nThe page accepts multi-paragraph text. Press Enter for new lines."
                  className="w-full bg-transparent border-b font-body leading-loose
                             resize-none focus:outline-none placeholder-yellow-900/35"
                  style={{
                    color: "var(--ink)", borderColor: "rgba(139,105,20,.25)",
                    fontFamily: "'Crimson Text',serif", fontSize: "1.1rem",
                  }}
                />
                <p className="text-right font-mono text-xs mt-1" style={{ color: "rgba(139,105,20,.45)" }}>
                  {pg.text.length} chars
                </p>
              </div>

              {/* Divider */}
              <div className="h-px my-5" style={{ background: "rgba(139,105,20,.2)" }} />

              {/* Media section */}
              <div className="space-y-3">
                <label className="flex items-center gap-1.5 font-body text-xs
                                  tracking-widest uppercase"
                       style={{ color: "#8B6914" }}>
                  <Image size={12} /> Illustration / Artifact (optional)
                </label>

                {/* Type toggle */}
                <div className="flex gap-2">
                  {[
                    { val: "image", icon: <Image size={12}/>, label: "Image" },
                    { val: "video", icon: <Video size={12}/>, label: "Video" },
                  ].map(({ val, icon, label }) => (
                    <button key={val} onClick={() => updatePage("media_type", val)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-body transition-all"
                      style={{
                        background: pg.media_type === val ? "rgba(139,105,20,.2)" : "transparent",
                        border: `1px solid ${pg.media_type === val ? "#8B6914" : "rgba(139,105,20,.25)"}`,
                        color: "#5c3a0a",
                      }}>
                      {icon} {label}
                    </button>
                  ))}
                </div>

                <input
                  value={pg.media_url || ""}
                  onChange={(e) => updatePage("media_url", e.target.value)}
                  placeholder="Paste URL for image or video…"
                  className="w-full bg-transparent border-b px-0 py-2 font-mono text-sm
                             focus:outline-none placeholder-yellow-900/35"
                  style={{ color: "var(--ink)", borderColor: "rgba(139,105,20,.25)", fontFamily: "'Courier Prime',monospace" }}
                />

                {/* Live preview */}
                {pg.media_url && (
                  <div className="flex justify-center pt-2">
                    <OrnateFrame src={pg.media_url} type={pg.media_type || "image"} alt="Preview" />
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {error && (
            <p className="text-red-400 font-body text-sm text-center mt-4
                          bg-red-900/15 border border-red-900/30 rounded-lg py-2">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  function goPage(i) {
    if (i < 0 || i >= pages.length) return;
    setPageIdx(i);
  }
}

function Field({ label, children }) {
  return (
    <div>
      <label className="font-body text-xs tracking-widest uppercase mb-1.5 block"
             style={{ color: "var(--text-lo)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
