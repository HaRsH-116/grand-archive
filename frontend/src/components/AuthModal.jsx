import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Feather } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth();
  const [mode,    setMode]   = useState("login");
  const [error,   setError]  = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "reader" });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        await login(form.username, form.password);
      } else {
        await register(form.username, form.email, form.password, form.role);
        await login(form.username, form.password);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = "brass-input w-full px-4 py-2.5 rounded-lg text-base";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl overflow-hidden shadow-modal"
          style={{ background: "var(--modal-bg)", border: "1.5px solid var(--gold-dim)" }}
        >
          {/* Header */}
          <div className="px-7 pt-6 pb-4 border-b flex items-center justify-between"
               style={{ borderColor: "var(--border-col)" }}>
            <div className="flex items-center gap-3">
              <BookOpen size={20} style={{ color: "var(--gold)" }} />
              <h2 className="font-display text-xl font-bold gold-text">
                {mode === "login" ? "Open the Archive" : "Join the Archive"}
              </h2>
            </div>
            <button onClick={onClose} className="hover:text-red-400 transition-colors"
                    style={{ color: "var(--text-lo)" }}>
              <X size={17} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: "var(--border-col)" }}>
            {["login", "register"].map((m) => (
              <button key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-3 font-display text-sm tracking-wider capitalize
                            transition-colors border-b-2`}
                style={{
                  color: mode === m ? "var(--gold)" : "var(--text-lo)",
                  borderColor: mode === m ? "var(--gold)" : "transparent",
                }}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={submit} className="px-7 py-6 space-y-4">
            <Field label="Username">
              <input value={form.username} onChange={set("username")} required
                     placeholder="your_handle" className={fieldStyle} />
            </Field>

            {mode === "register" && (
              <Field label="Email">
                <input type="email" value={form.email} onChange={set("email")} required
                       placeholder="you@archive.local" className={fieldStyle} />
              </Field>
            )}

            <Field label="Password">
              <input type="password" value={form.password} onChange={set("password")} required
                     placeholder="Min 6 characters" className={fieldStyle} />
            </Field>

            {mode === "register" && (
              <Field label="Role">
                <select value={form.role} onChange={set("role")} className={fieldStyle}>
                  <option value="reader">Reader — Browse &amp; View</option>
                  <option value="author">Author — Create &amp; Edit</option>
                </select>
              </Field>
            )}

            {error && (
              <div className="text-red-400 font-body text-sm text-center
                              bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-lg font-display text-sm tracking-wider
                         font-semibold hover:shadow-gold-glow transition-all disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg,var(--gold-dim),var(--gold),var(--gold-dim))",
                backgroundSize: "200%", color: "#1a0a02",
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Feather size={14} />
                {loading ? "A moment…" : mode === "login" ? "Enter the Study" : "Claim Your Seat"}
              </span>
            </button>

            {mode === "login" && (
              <p className="text-center font-body text-xs" style={{ color: "var(--text-lo)" }}>
                Demo: <span className="gold-text">admin</span> / password &nbsp;·&nbsp;
                <span className="gold-text">tolkien_j</span> / password
              </p>
            )}
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
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
