import { type LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'purple' | 'teal' | 'gold' | 'danger' | 'gray'
  trend?: { value: number; label: string }
}

const COLOR_MAP = {
  purple: { icon: 'text-[#8B7FF5]', iconBg: 'bg-[#8B7FF5]/15', value: 'text-[#8B7FF5]' },
  teal:   { icon: 'text-[#2DD4A8]', iconBg: 'bg-[#2DD4A8]/15', value: 'text-[#2DD4A8]' },
  gold:   { icon: 'text-[#F0B429]', iconBg: 'bg-[#F0B429]/15', value: 'text-[#F0B429]' },
  danger: { icon: 'text-red-400',   iconBg: 'bg-red-500/15',   value: 'text-red-400'   },
  gray:   { icon: 'text-gray-400',  iconBg: 'bg-gray-500/15',  value: 'text-white'     },
}

export function KPICard({ title, value, subtitle, icon: Icon, color = 'gray', trend }: KPICardProps) {
  const c = COLOR_MAP[color]
  return (
    <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-xl p-5 flex items-start gap-4">
      <div className={clsx('p-2.5 rounded-xl shrink-0', c.iconBg)}>
        <Icon className={clsx('w-5 h-5', c.icon)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 mb-1 truncate">{title}</p>
        <p className={clsx('text-2xl font-bold leading-none', c.value)}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1.5 truncate">{subtitle}</p>}
        {trend && (
          <p className={clsx('text-xs mt-1.5', trend.value >= 0 ? 'text-teal-400' : 'text-red-400')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </p>
        )}
      </div>
    </div>
  )
}
