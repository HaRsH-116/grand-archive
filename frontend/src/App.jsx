import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AuthProvider, useAuth }   from "./context/AuthContext";
import { useSpotlight }             from "./hooks/useSpotlight";
import { notifsApi }                from "./api/client";

import Bookshelf    from "./components/Bookshelf";
import BookEditor   from "./components/BookEditor";
import BookViewer   from "./components/BookViewer";
import AuthModal    from "./components/AuthModal";
import ThemeToggle  from "./components/ThemeToggle";
import NotifPanel   from "./components/NotifPanel";
import AdminPanel   from "./components/AdminPanel";
import ProfilePanel from "./components/ProfilePanel";
import StatsBar     from "./components/StatsBar";

import {
  Bell, Shield, ChevronLeft, ChevronDown,
  User, LogOut, BookOpen, Settings,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────── */
/* User avatar dropdown                                            */
/* ─────────────────────────────────────────────────────────────── */
function UserMenu({ onProfile, onAdmin, isAdmin }) {
  const { user, logout } = useAuth();
  const [open, setOpen]  = useState(false);
  const ref              = useRef(null);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  const go = (fn) => { setOpen(false); fn(); };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 group"
        title="Account menu"
      >
        {/* Avatar circle */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center
                     font-display text-sm font-bold text-white shrink-0
                     hover:scale-105 transition-transform shadow-wax"
          style={{ background: user.avatar_color || "#8B0000" }}
        >
          {user.username[0].toUpperCase()}
        </div>

        {/* Name + role (hidden on small screens) */}
        <div className="hidden md:block text-left leading-none">
          <p className="font-display text-sm gold-text">{user.username}</p>
          <p className="font-body text-xs capitalize mt-0.5"
             style={{ color: "var(--text-lo)" }}>
            {user.role}
          </p>
        </div>

        <ChevronDown
          size={13}
          className="hidden md:block transition-transform"
          style={{
            color: "var(--gold-dim)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-50 shadow-modal"
            style={{
              background: "var(--modal-bg)",
              border: "1.5px solid var(--border-col)",
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: "var(--border-col)" }}
            >
              <p className="font-display text-sm font-bold gold-text leading-snug">
                {user.username}
              </p>
              <p className="font-body text-xs capitalize mt-0.5"
                 style={{ color: "var(--text-lo)" }}>
                {user.email}
              </p>
              <span
                className="inline-block mt-1.5 px-2 py-0.5 rounded-full
                           font-body text-xs capitalize"
                style={{
                  background: "rgba(212,175,55,0.12)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  color: "var(--gold)",
                }}
              >
                {user.role}
              </span>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <MenuItem
                icon={<User size={14} />}
                label="My Profile"
                onClick={() => go(onProfile)}
              />
              <MenuItem
                icon={<BookOpen size={14} />}
                label="My Volumes"
                onClick={() => go(onProfile)}
              />
              {isAdmin && (
                <MenuItem
                  icon={<Shield size={14} />}
                  label="Admin Ledger"
                  onClick={() => go(onAdmin)}
                />
              )}

              {/* Divider */}
              <div
                className="my-1 mx-3 h-px"
                style={{ background: "var(--border-col)" }}
              />

              {/* Sign Out — highlighted in red */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5
                           font-body text-sm transition-colors
                           hover:bg-red-900/20 text-left group"
                style={{ color: "#f87171" }}
              >
                <LogOut
                  size={14}
                  className="shrink-0 group-hover:-translate-x-0.5 transition-transform"
                />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5
                 font-body text-sm transition-colors hover:bg-yellow-900/10 text-left"
      style={{ color: "var(--text-lo)" }}
    >
      <span style={{ color: "var(--gold-dim)" }} className="shrink-0">
        {icon}
      </span>
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Main shell                                                      */
/* ─────────────────────────────────────────────────────────────── */
function Shell() {
  const { isDark }  = useTheme();
  const { user, loading, isAdmin, isLoggedIn } = useAuth();
  useSpotlight();

  const [view,       setView]       = useState("shelf");
  const [selBook,    setSelBook]    = useState(null);
  const [editBook,   setEditBook]   = useState(null);
  const [showAuth,   setShowAuth]   = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  /* Notification polling */
  useEffect(() => {
    if (!isLoggedIn) return;
    const load = () =>
      notifsApi.list()
        .then(({ data }) => setNotifCount(data.filter((n) => !n.is_read).length))
        .catch(() => {});
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [isLoggedIn]);

  /* When the user logs out reset to shelf */
  useEffect(() => {
    if (!isLoggedIn) {
      setView("shelf");
      setSelBook(null);
      setEditBook(null);
      setShowNotifs(false);
    }
  }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="min-h-screen wood-grain flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl candle-flame mb-6">🕯️</div>
          <p className="font-display text-3xl gold-text tracking-widest animate-pulse-soft">
            Opening the Archive…
          </p>
        </div>
      </div>
    );
  }

  /* Navigation helpers */
  const openBook   = (b) => { setSelBook(b);   setView("viewer"); };
  const editBook_  = (b) => { setEditBook(b);  setView("editor"); };
  const newBook    = ()  => { setEditBook(null); setView("editor"); };
  const back       = ()  => { setView("shelf"); setSelBook(null); setEditBook(null); };
  const goAdmin    = ()  => setView(view === "admin"   ? "shelf" : "admin");
  const goProfile  = ()  => setView(view === "profile" ? "shelf" : "profile");

  const showingBack = view !== "shelf";

  return (
    <div
      className={`min-h-screen wood-grain relative overflow-x-hidden
                  ${isDark ? "" : "theme-light"}`}
    >
      {/* Spotlight overlay */}
      <div className="spotlight-overlay" />
      {!isDark && <div className="window-light fixed inset-0 pointer-events-none z-0" />}

      {/* ── Header ──────────────────────────────────────────────── */}
      <header
        className="relative z-20 flex items-center justify-between px-5 py-3
                   border-b backdrop-blur-sm"
        style={{ borderColor: "var(--border-col)" }}
      >
        {/* Logo / back */}
        <button onClick={back} className="flex items-center gap-3 group">
          {showingBack && (
            <ChevronLeft
              size={16}
              style={{ color: "var(--gold)" }}
              className="group-hover:-translate-x-1 transition-transform"
            />
          )}
          <span className="text-3xl candle-flame select-none">🕯️</span>
          <div className="hidden sm:block text-left">
            <h1 className="font-display text-xl font-bold gold-text tracking-wider leading-tight">
              The Grand Archive
            </h1>
            <p className="text-xs font-body tracking-widest"
               style={{ color: "var(--text-lo)" }}>
              A Luxury Digital Study
            </p>
          </div>
        </button>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isLoggedIn ? (
            <>
              {/* Notifications bell */}
              <button
                onClick={() => setShowNotifs((v) => !v)}
                title="Notifications"
                className="relative w-9 h-9 rounded-full gold-border flex items-center
                           justify-center hover:bg-yellow-900/20 transition-colors"
                style={{ color: "var(--gold)" }}
              >
                <Bell size={15} />
                {notifCount > 0 && (
                  <span className="notif-badge">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </button>

              {/* User avatar dropdown — includes Sign Out */}
              <UserMenu
                onProfile={goProfile}
                onAdmin={goAdmin}
                isAdmin={isAdmin}
              />
            </>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="font-display text-sm px-5 py-2 gold-border rounded
                         hover:bg-yellow-900/20 transition-colors"
              style={{ color: "var(--gold)" }}
            >
              Enter the Archive
            </button>
          )}
        </div>
      </header>

      {/* Stats bar */}
      {isLoggedIn && view === "shelf" && <StatsBar />}

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {view === "shelf" && (
            <motion.div key="shelf"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
            >
              <Bookshelf
                onOpenBook={openBook}
                onEditBook={editBook_}
                onNewBook={newBook}
                onAuthRequired={() => setShowAuth(true)}
              />
            </motion.div>
          )}

          {view === "viewer" && selBook && (
            <motion.div key="viewer"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.28 }}
            >
              <BookViewer book={selBook} onBack={back} />
            </motion.div>
          )}

          {view === "editor" && (
            <motion.div key="editor"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.28 }}
            >
              <BookEditor book={editBook} onBack={back} onSaved={back} />
            </motion.div>
          )}

          {view === "admin" && (
            <motion.div key="admin"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
            >
              <AdminPanel />
            </motion.div>
          )}

          {view === "profile" && (
            <motion.div key="profile"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
            >
              <ProfilePanel onViewBook={openBook} onEditBook={editBook_} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Notification drawer */}
      <AnimatePresence>
        {showNotifs && (
          <NotifPanel onClose={() => { setShowNotifs(false); setNotifCount(0); }} />
        )}
      </AnimatePresence>

      {/* Auth modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </ThemeProvider>
  );
}
