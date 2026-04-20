import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Users, BookOpen, Trash2, Edit3, Award, AwardIcon, ToggleLeft, ToggleRight } from "lucide-react";
import { usersApi, booksApi } from "../api/client";
import WaxSealModal from "./WaxSealModal";

function RoleBadge({ role }) {
  const styles = {
    admin:  { bg: "#5c0000", color: "#ffaaaa" },
    author: { bg: "#1a2a4a", color: "#aac4ff" },
    reader: { bg: "#1a3a1a", color: "#aaffaa" },
  };
  const s = styles[role] || styles.reader;
  return (
    <span className="px-2 py-0.5 rounded font-body text-xs font-semibold"
          style={{ background: s.bg, color: s.color }}>
      {role}
    </span>
  );
}

/* ── Users table ───────────────────────────────────────────────────────── */
function UsersTab() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    usersApi.list()
      .then(({ data }) => setUsers(data))
      .finally(() => setLoading(false));
  }, []);

  const toggleRole = async (u) => {
    const next = { admin: "author", author: "reader", reader: "author" }[u.role] || "reader";
    const { data } = await usersApi.update(u.id, { role: next });
    setUsers((us) => us.map((x) => (x.id === u.id ? data : x)));
  };

  const toggleActive = async (u) => {
    const { data } = await usersApi.update(u.id, { is_active: !u.is_active });
    setUsers((us) => us.map((x) => (x.id === u.id ? data : x)));
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    await usersApi.delete(toDelete.id);
    setUsers((us) => us.filter((x) => x.id !== toDelete.id));
    setDeleting(false); setToDelete(null);
  };

  if (loading) return <div className="flex justify-center py-16"><span className="text-4xl candle-flame">🕯️</span></div>;

  return (
    <div>
      <p className="font-body text-sm mb-4" style={{ color: "var(--text-lo)" }}>
        {users.length} scholars registered
      </p>
      <div className="overflow-x-auto">
        <table className="admin-table w-full">
          <thead>
            <tr>
              <th>Scholar</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center
                                    font-display text-xs font-bold text-white shrink-0"
                         style={{ background: u.avatar_color || "#8B0000" }}>
                      {u.username[0].toUpperCase()}
                    </div>
                    <span className="font-display text-sm" style={{ color: "var(--text-hi)" }}>
                      {u.username}
                    </span>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <button onClick={() => toggleRole(u)} title="Click to cycle role">
                    <RoleBadge role={u.role} />
                  </button>
                </td>
                <td>
                  <button onClick={() => toggleActive(u)}
                    style={{ color: u.is_active ? "#4ade80" : "#f87171" }}>
                    {u.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                </td>
                <td className="font-mono text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td>
                  <button onClick={() => setToDelete(u)} title="Delete user"
                    className="hover:text-red-400 transition-colors"
                    style={{ color: "var(--text-lo)" }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <WaxSealModal
        isOpen={!!toDelete}
        title="Remove this Scholar?"
        bookTitle={toDelete?.username}
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
        loading={deleting}
      />
    </div>
  );
}

/* ── Books table ───────────────────────────────────────────────────────── */
function BooksTab() {
  const [books,   setBooks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    booksApi.list({ visibility: "all" })
      .then(({ data }) => setBooks(data))
      .finally(() => setLoading(false));
  }, []);

  const toggleFeature = async (b) => {
    const { data } = await booksApi.toggleFeature(b.id);
    setBooks((bs) => bs.map((x) => (x.id === b.id ? { ...x, is_featured: data.is_featured } : x)));
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    await booksApi.delete(toDelete.id);
    setBooks((bs) => bs.filter((x) => x.id !== toDelete.id));
    setDeleting(false); setToDelete(null);
  };

  if (loading) return <div className="flex justify-center py-16"><span className="text-4xl candle-flame">🕯️</span></div>;

  return (
    <div>
      <p className="font-body text-sm mb-4" style={{ color: "var(--text-lo)" }}>
        {books.length} volumes in the Archive
      </p>
      <div className="overflow-x-auto">
        <table className="admin-table w-full">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Genre</th>
              <th>Pages</th>
              <th>Visibility</th>
              <th>Views</th>
              <th>Rating</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-6 rounded-sm shrink-0" style={{ background: b.cover_color }} />
                    <span className="font-display text-sm" style={{ color: "var(--text-hi)" }}>
                      {b.title}
                    </span>
                  </div>
                </td>
                <td>{b.author?.username}</td>
                <td>{b.genre || "—"}</td>
                <td>{b.pages?.length || 0}</td>
                <td>
                  <span className="font-mono text-xs capitalize" style={{ color: "var(--text-lo)" }}>
                    {b.visibility}
                  </span>
                </td>
                <td>{b.view_count ?? 0}</td>
                <td>
                  {b.avg_rating
                    ? <span style={{ color: "#d4af37" }}>★ {Number(b.avg_rating).toFixed(1)}</span>
                    : "—"}
                </td>
                <td>
                  <button onClick={() => toggleFeature(b)} title="Toggle featured"
                    className="hover:scale-110 transition-transform"
                    style={{ color: b.is_featured ? "#d4af37" : "var(--text-lo)" }}>
                    <Award size={16} />
                  </button>
                </td>
                <td>
                  <button onClick={() => setToDelete(b)} title="Delete book"
                    className="hover:text-red-400 transition-colors"
                    style={{ color: "var(--text-lo)" }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <WaxSealModal
        isOpen={!!toDelete}
        bookTitle={toDelete?.title}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
        loading={deleting}
      />
    </div>
  );
}

/* ── Main Admin Panel ──────────────────────────────────────────────────── */
export default function AdminPanel() {
  const [tab, setTab] = useState("users");

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="wax-seal w-10 h-10 rounded-full flex items-center justify-center">
          <Shield size={18} className="text-red-200" />
        </div>
        <div>
          <h2 className="font-display text-2xl gold-text font-bold">Administrator's Ledger</h2>
          <p className="font-body text-xs" style={{ color: "var(--text-lo)" }}>
            Full oversight of the Archive's scholars and volumes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { val: "users", icon: <Users size={14} />,     label: "Scholars" },
          { val: "books", icon: <BookOpen size={14} />,  label: "Volumes"  },
        ].map((t) => (
          <button key={t.val} onClick={() => setTab(t.val)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-display
                       text-sm transition-all"
            style={{
              background: tab === t.val ? "rgba(212,175,55,.15)" : "transparent",
              border: `1px solid ${tab === t.val ? "var(--gold)" : "var(--border-col)"}`,
              color: tab === t.val ? "var(--gold)" : "var(--text-lo)",
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="archive-card p-6">
        {tab === "users" && <UsersTab />}
        {tab === "books" && <BooksTab />}
      </div>
    </div>
  );
}
