interface HirojiLogoProps {
  height?: number;
  showText?: boolean;
  className?: string;
}

const HirojiLogo = ({
  height = 40,
  showText = true,
  className = "",
}: HirojiLogoProps) => {
  // Original viewBox is 900x250, scale proportionally
  const aspectRatio = showText ? 900 / 250 : 440 / 250;
  const width = height * aspectRatio;
  const viewBox = showText ? "0 0 900 250" : "0 0 440 250";

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Hiroji Constructions"
    >
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="50%" stopColor="#f6e27a" />
          <stop offset="100%" stopColor="#c5a028" />
        </linearGradient>
      </defs>

      {/* Roof Logo */}
      <path
        d="M80 160 L180 70 L260 110 L340 70 L420 110 L420 120 L340 90 L260 130 L180 90 L80 180 Z"
        fill="url(#goldGradient)"
        shapeRendering="crispEdges"
      />

      {/* Left pillar */}
      <rect
        x="80"
        y="160"
        width="28"
        height="40"
        fill="url(#goldGradient)"
        shapeRendering="crispEdges"
      />

      {/* Right pillar */}
      <rect
        x="260"
        y="130"
        width="28"
        height="70"
        fill="url(#goldGradient)"
        shapeRendering="crispEdges"
      />

      {/* Text */}
      {showText && (
        <text
          x="460"
          y="145"
          fontFamily="'Times New Roman', 'Georgia', serif"
          fontSize="36"
          fill="url(#goldGradient)"
          letterSpacing="2"
          textRendering="geometricPrecision"
        >
          HIROJI CONSTRUCTIONS
        </text>
      )}
    </svg>
  );
};

export default HirojiLogo;
