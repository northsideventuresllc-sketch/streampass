export function AmbientBg() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden motion-reduce:opacity-50"
      aria-hidden
    >
      <div className="ambient-orb ambient-orb-magenta" />
      <div className="ambient-orb ambient-orb-cyan" />
      <div className="ambient-grid" />
    </div>
  );
}
