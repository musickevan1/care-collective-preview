import { ReactElement, ReactNode } from 'react'

interface LandingSectionProps {
    id: string
    title?: string
    subtitle?: string
    children: ReactNode
    className?: string
    variant?: 'default' | 'alternate' | 'sage'
    centeredHeader?: boolean
    withPattern?: boolean
    animation?: 'fade-in' | 'slide-up' | 'none'
}

export default function LandingSection({
    id,
    title,
    subtitle,
    children,
    className = '',
    variant = 'default',
    centeredHeader = true,
    withPattern = false,
    animation = 'none',
}: LandingSectionProps): ReactElement {

    const getBgColor = () => {
        switch (variant) {
            case 'alternate':
                return 'bg-secondary/5' // Using a subtle version of the secondary color
            case 'sage':
                return 'bg-sage/10'
            case 'default':
            default:
                return 'bg-background'
        }
    }

    const getPattern = () => {
        if (!withPattern) return null

        // Choose pattern based on variant for variety
        if (variant === 'sage' || variant === 'alternate') {
            return (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <pattern id={`pattern-${id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <circle cx="10" cy="10" r="1" fill="currentColor" className="text-foreground" />
                        </pattern>
                        <rect width="100%" height="100%" fill={`url(#pattern-${id})`} />
                    </svg>
                </div>
            )
        }

        return null
    }

    const getAnimationClass = () => {
        switch (animation) {
            case 'fade-in':
                return 'animate-fade-in'
            case 'slide-up':
                return 'animate-slide-up'
            case 'none':
            default:
                return ''
        }
    }

    return (
        <section
            id={id}
            className={`relative py-16 md:py-24 border-b border-sage/20 ${getBgColor()} ${className} overflow-hidden`}
        >
            {getPattern()}

            <div className={`container mx-auto px-4 max-w-7xl relative z-10 ${getAnimationClass()}`}>
                {(title || subtitle) && (
                    <div className={`mb-12 md:mb-16 ${centeredHeader ? 'text-center' : ''}`}>
                        {title && (
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-xl font-medium text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                    </div>
                )}

                {children}
            </div>
        </section>
    )
}
