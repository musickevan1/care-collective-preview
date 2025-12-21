import { ReactElement, ReactNode } from 'react'

interface LandingSectionProps {
    id: string
    title?: string
    subtitle?: string
    children: ReactNode
    className?: string
    variant?: 'default' | 'alternate' | 'sage'
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
            case 'default':
            default:
                return 'bg-background'
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
            className={`relative py-16 md:py-24 border-b border-sage/20 ${getBgColor()} ${className} overflow-hidden`}
        >
            <div className={`container mx-auto px-4 max-w-7xl relative z-10 ${getAnimationClass()}`}>
                {(title || subtitle) && (
                    <div className={`mb-12 md:mb-16 ${centeredHeader ? 'text-center' : ''}`}>
                        {title && (
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
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
