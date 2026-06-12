/**
 * The Clarix mark: a six-spoke spark in a rounded ink square. Echoes the
 * ✺ glyph used as a separator on the landing page. Use `inverted` on
 * dark surfaces.
 */
export function ClarixMark({
  className = "w-8 h-8",
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect
        width="32"
        height="32"
        rx="8.5"
        fill={inverted ? "#FAFAF9" : "#0A0A0B"}
      />
      <g
        stroke={inverted ? "#0A0A0B" : "#FAFAF9"}
        strokeWidth="2.7"
        strokeLinecap="round"
      >
        <line x1="16" y1="8.4" x2="16" y2="23.6" />
        <line x1="9.4" y1="12.2" x2="22.6" y2="19.8" />
        <line x1="9.4" y1="19.8" x2="22.6" y2="12.2" />
      </g>
    </svg>
  );
}
