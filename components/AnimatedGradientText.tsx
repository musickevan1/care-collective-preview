'use client'

export default function AnimatedGradientText() {
  return (
    <h1
      className="uppercase tracking-tighter leading-[0.85]"
      style={{
        fontSize: 'clamp(2.5rem, 8vw, 6rem)',
      }}
      aria-label="CARE Collective"
    >
      <span
        className="text-primary font-black drop-shadow-[0_8px_16px_rgba(188,101,71,0.25)]"
        style={{ fontFamily: 'var(--font-overlock)' }}
      >
        CARE
      </span>
      {' '}
      <span
        className="text-sage font-medium"
        style={{ fontFamily: 'var(--font-overlock)' }}
      >
        COLLECTIVE
      </span>
    </h1>
  )
}
