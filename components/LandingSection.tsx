import { ReactElement, ReactNode } from 'react'

interface LandingSectionProps {
    id: string
    title?: string
    subtitle?: string
    children: ReactNode
    className?: string
    variant?: 'default' | 'alternate' | 'sage' | 'tan' | 'brown' | 'terracotta'
    centeredHeader?: boolean
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
    animation = 'none',
}: LandingSectionProps): ReactElement {

    const getBgColor = () => {
        switch (variant) {
            case 'alternate':
                return 'bg-secondary/5' // Using a subtle version of the secondary color
            case 'sage':
                return 'bg-sage/10'
            case 'tan':
                return 'bg-tan' // Color-blocked tan section
            case 'brown':
                return 'bg-brown' // Dark brown section
            case 'terracotta':
                return 'bg-terracotta' // Warm terracotta section
            case 'default':
            default:
                return 'bg-background'
        }
    }

    // Determine text color based on background darkness
    const getTextColor = () => {
        switch (variant) {
            case 'brown':
            case 'terracotta':
                return 'text-white' // White text on dark backgrounds
            default:
                return 'text-foreground' // Dark text on light backgrounds
        }
    }

    const getSubtitleColor = () => {
        switch (variant) {
            case 'brown':
            case 'terracotta':
                return 'text-white/80' // Slightly muted white
            default:
                return 'text-muted-foreground'
        }
    }

    const getBorderColor = () => {
        switch (variant) {
            case 'brown':
            case 'terracotta':
            case 'tan':
                return 'border-transparent' // No visible border on color-blocked sections
            default:
                return 'border-sage/20'
        }
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
            className={`relative py-16 md:py-24 border-b ${getBorderColor()} ${getBgColor()} ${className} overflow-hidden`}
        >
            <div className={`container mx-auto px-4 max-w-7xl relative z-10 ${getAnimationClass()}`}>
                {(title || subtitle) && (
                    <div className={`mb-12 md:mb-16 ${centeredHeader ? 'text-center' : ''}`}>
                        {title && (
                            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${getTextColor()} mb-6`}>
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className={`text-xl font-medium ${getSubtitleColor()} max-w-3xl mx-auto leading-relaxed`}>
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
