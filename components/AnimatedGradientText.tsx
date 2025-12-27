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
        className="font-black bg-gradient-to-r from-sage via-sage-light via-dusty-rose via-tan via-primary to-sage bg-clip-text text-transparent bg-[length:400%_auto] animate-gradient-x"
        style={{
          fontFamily: 'var(--font-overlock)',
          filter: 'drop-shadow(0 4px 8px rgba(122, 158, 153, 0.2))'
        }}
      >
        CARE
      </span>
      {' '}
      <span
        className="text-sage font-light"
        style={{ fontFamily: 'var(--font-overlock)' }}
      >
        COLLECTIVE
      </span>
    </h1>
  )
}
