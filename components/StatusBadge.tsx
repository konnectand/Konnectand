import { clsx } from 'clsx'

type Status = 'online' | 'offline' | 'alert' | 'unknown'

const LABELS: Record<Status, string> = {
  online:  'En linea',
  offline: 'Fuera de linea',
  alert:   'Alerta',
  unknown: 'Desconocido',
}

const STYLES: Record<Status, string> = {
  online:  'bg-teal-500/15 text-teal-400 border-teal-500/25',
  offline: 'bg-red-500/15 text-red-400 border-red-500/25',
  alert:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  unknown: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
}

const DOT_STYLES: Record<Status, string> = {
  online:  'bg-teal-400',
  offline: 'bg-red-400',
  alert:   'bg-yellow-400',
  unknown: 'bg-gray-400',
}

interface StatusBadgeProps {
  status: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, showLabel = true, size = 'md' }: StatusBadgeProps) {
  const s = (status as Status) in LABELS ? (status as Status) : 'unknown'
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        STYLES[s],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span
        className={clsx(
          'rounded-full shrink-0',
          DOT_STYLES[s],
          s === 'online' ? 'status-pulse' : '',
          size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
        )}
      />
      {showLabel && LABELS[s]}
    </span>
  )
}
