import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, readonly = false, size = 18 }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => onChange && onChange(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`star-btn ${readonly ? "cursor-default" : "cursor-pointer"}`}
          style={{
            color: s <= display ? "#d4af37" : "rgba(212,175,55,0.25)",
            background: "none", border: "none", padding: 0,
          }}
        >
          <Star
            size={size}
            fill={s <= display ? "#d4af37" : "none"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
