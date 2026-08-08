/**
 * Animated curtain-style gradient backdrop.
 * Vertical light curtains that wave and shift colour, like an aurora drape.
 * Purely decorative: fixed, pointer-events-none, sits behind all app content.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden className="aurora-bg">
      <div className="aurora-curtain aurora-curtain-1" />
      <div className="aurora-curtain aurora-curtain-2" />
      <div className="aurora-curtain aurora-curtain-3" />
      <div className="aurora-curtain aurora-curtain-4" />
      <div className="aurora-shimmer" />
      <div className="aurora-vignette" />
    </div>
  );
}
