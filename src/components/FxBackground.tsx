export default function FxBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* grid fades toward the top */}
      <div className="bg-grid absolute inset-x-0 top-0 h-[720px]" />
      {/* blurred orbs */}
      <div
        className="orb orb-anim"
        style={{
          width: 480,
          height: 480,
          top: -140,
          left: -120,
          background: "radial-gradient(circle, #4f46e5, transparent 65%)",
        }}
      />
      <div
        className="orb orb-anim-2"
        style={{
          width: 420,
          height: 420,
          top: 80,
          right: -140,
          background: "radial-gradient(circle, #14b8a6, transparent 65%)",
        }}
      />
      <div
        className="orb orb-anim"
        style={{
          width: 360,
          height: 360,
          bottom: -140,
          left: "32%",
          background: "radial-gradient(circle, #d97706, transparent 62%)",
          opacity: 0.32,
        }}
      />
      {/* base gradient tint */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 55%, var(--bg) 100%)",
          opacity: 0.6,
        }}
      />
    </div>
  );
}
