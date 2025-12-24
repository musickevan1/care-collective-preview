'use client'

export default function AnimatedGradientText() {
  return (
    <h1
      className="text-[clamp(56px,15vw,180px)] font-black uppercase tracking-tighter leading-[0.85] bg-gradient-to-r from-sage-dark via-sage to-sage-dark bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer drop-shadow-[0_8px_16px_rgba(90,126,121,0.25)]"
      aria-label="CARE Collective"
    >
      CARE Collective
    </h1>
  )
}
