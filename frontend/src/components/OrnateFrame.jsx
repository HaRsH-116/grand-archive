export default function OrnateFrame({ src, type = "image", alt = "", className = "" }) {
  if (!src) return null;
  return (
    <div className={`ornate-frame ${className}`} style={{ maxWidth: "100%" }}>
      <div className="bg-black rounded-sm overflow-hidden">
        {type === "video" ? (
          <video src={src} controls className="w-full max-h-72 object-contain" />
        ) : (
          <img
            src={src} alt={alt}
            className="w-full max-h-72 object-contain block"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
      </div>
    </div>
  );
}
