/**
 * Animated 3D-feel gradient backdrop.
 * Purely decorative: fixed, pointer-events-none, sits behind all app content.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden className="aurora-bg">
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
      <div className="aurora-blob aurora-blob-4" />
      <div className="aurora-grid" />
      <div className="aurora-vignette" />
    </div>
  );
}
