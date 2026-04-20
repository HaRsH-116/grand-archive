import { Search, X } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search the Archive…" }) {
  return (
    <div className="relative group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
           style={{ color: "var(--gold)" }}>
        <Search size={15} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="brass-input w-full pl-9 pr-9 py-2.5 rounded-lg font-body text-base
                   placeholder-yellow-900/40 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
          style={{ color: "var(--gold-dim)" }}
        >
          <X size={13} />
        </button>
      )}
      <div className="absolute bottom-0 left-3 right-3 h-px opacity-25"
           style={{ background: "var(--gold)" }} />
    </div>
  );
}
