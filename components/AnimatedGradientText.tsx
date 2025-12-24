'use client'

export default function AnimatedGradientText() {
  return (
    <h1
      className="uppercase tracking-tighter leading-[0.85] bg-gradient-to-r from-sage-dark via-sage to-sage-dark bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer"
      style={{
        fontSize: 'clamp(4rem, 12vw, 12rem)',
        fontWeight: 900,
        filter: 'drop-shadow(0 8px 16px rgba(90, 126, 121, 0.25))'
      }}
      aria-label="CARE Collective"
    >
      CARE Collective
    </h1>
  )
}
