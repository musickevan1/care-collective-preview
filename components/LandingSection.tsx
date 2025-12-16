import { ReactElement, ReactNode } from 'react'

interface LandingSectionProps {
    id: string
    title?: string
    subtitle?: string
    children: ReactNode
    className?: string
    variant?: 'default' | 'alternate' | 'sage'
    centeredHeader?: boolean
}

export default function LandingSection({
    id,
    title,
    subtitle,
    children,
    className = '',
    variant = 'default',
    centeredHeader = true,
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

    return (
        <section
            id={id}
            className={`py-16 md:py-20 border-b border-sage/20 ${getBgColor()} ${className}`}
        >
            <div className="container mx-auto px-4 max-w-7xl">
                {(title || subtitle) && (
                    <div className={`mb-12 ${centeredHeader ? 'text-center' : ''}`}>
                        {title && (
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-xl font-medium text-muted-foreground max-w-3xl mx-auto">
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
