import { useEffect, useState } from "react";
import { statsApi } from "../api/client";
import { BookOpen, Users, FileText, Star, Award } from "lucide-react";

export default function StatsBar() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    statsApi.get().then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  if (!stats) return null;

  const items = [
    { icon: <BookOpen size={13} />, label: "Volumes",  value: stats.total_books   },
    { icon: <Users    size={13} />, label: "Scholars", value: stats.total_users   },
    { icon: <FileText size={13} />, label: "Pages",    value: stats.total_pages   },
    { icon: <Star     size={13} />, label: "Reviews",  value: stats.total_reviews },
    { icon: <Award    size={13} />, label: "Featured", value: stats.featured_count },
  ];

  return (
    <div
      className="relative z-10 flex items-center justify-center gap-8 py-2 px-6
                 border-b text-center overflow-x-auto"
      style={{ borderColor: "var(--border-col)", background: "rgba(0,0,0,0.18)" }}
    >
      {items.map(({ icon, label, value }) => (
        <div key={label} className="flex items-center gap-1.5 shrink-0">
          <span style={{ color: "var(--gold-dim)" }}>{icon}</span>
          <span className="font-display text-sm font-semibold gold-text">{value}</span>
          <span className="font-body text-xs" style={{ color: "var(--text-lo)" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}
