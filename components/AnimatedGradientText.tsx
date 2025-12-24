'use client'

export default function AnimatedGradientText() {
  return (
    <h1
      className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[160px] 2xl:text-[200px] font-black uppercase tracking-tighter leading-[0.85] bg-gradient-to-r from-sage-dark via-sage to-sage-dark bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer drop-shadow-[0_8px_16px_rgba(90,126,121,0.25)]"
      aria-label="CARE Collective"
    >
      CARE Collective
    </h1>
  )
}
