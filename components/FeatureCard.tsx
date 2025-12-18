import { ReactElement, ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  title: string
  icon: LucideIcon
  iconColor: string
  children: ReactNode
}

export default function FeatureCard({
  title,
  icon: Icon,
  iconColor,
  children
}: FeatureCardProps): ReactElement {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-brown/5 flex flex-col gap-5 h-full hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-2">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
          style={{ backgroundColor: iconColor }}
        >
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <h3 className="text-brown text-2xl font-bold leading-tight">{title}</h3>
      </div>
      <div className="text-brown/80 text-lg leading-relaxed font-medium">
        {children}
      </div>
    </div>
  )
}
