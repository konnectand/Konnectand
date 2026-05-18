'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Terminal, ChevronDown, Filter } from 'lucide-react'
import { format } from 'date-fns'
import type { PortalLog } from '@/lib/types'

const LEVEL_COLORS: Record<string, string> = {
  info:     'text-gray-400',
  warning:  'text-yellow-400',
  error:    'text-red-400',
  critical: 'text-red-400 font-bold',
}

const LEVEL_BG: Record<string, string> = {
  info:     '',
  warning:  'bg-yellow-500/5',
  error:    'bg-red-500/5',
  critical: 'bg-red-500/10 border-l-2 border-red-500',
}

interface Props {
  portalId: string
  initialLogs: PortalLog[]
}

type LevelFilter = 'all' | 'info' | 'warning' | 'error' | 'critical'

export function LogsStream({ portalId, initialLogs }: Props) {
  const [logs, setLogs] = useState<PortalLog[]>(initialLogs)
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`logs_${portalId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'portal_logs', filter: `portal_id=eq.${portalId}` },
        payload => { setLogs(prev => [payload.new as PortalLog, ...prev].slice(0, 200)) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [portalId])

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const filtered = levelFilter === 'all' ? logs : logs.filter(l => l.level === levelFilter)

  const levelBtns: { key: LevelFilter; label: string }[] = [
    { key: 'all',      label: 'Todos'   },
    { key: 'info',     label: 'Info'    },
    { key: 'warning',  label: 'Warning' },
    { key: 'error',    label: 'Error'   },
    { key: 'critical', label: 'Critico' },
  ]

  return (
    <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-xl flex flex-col h-[600px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A2E] shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#8B7FF5]" />
          <h2 className="text-sm font-semibold text-white">Logs en tiempo real</h2>
          <span className="text-xs text-gray-600">({filtered.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          <div className="flex gap-1">
            {levelBtns.map(btn => (
              <button
                key={btn.key}
                onClick={() => setLevelFilter(btn.key)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  levelFilter === btn.key
                    ? 'bg-[#8B7FF5]/20 text-[#8B7FF5]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded transition-colors ${autoScroll ? 'text-[#2DD4A8]' : 'text-gray-600'}`}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600">
            Sin logs disponibles
          </div>
        ) : (
          <div className="py-2">
            {[...filtered].reverse().map(log => (
              <div
                key={log.id}
                className={`flex gap-3 px-4 py-1.5 hover:bg-white/2 ${LEVEL_BG[log.level] ?? ''}`}
              >
                <span className="text-gray-600 shrink-0 w-[140px]">
                  {format(new Date(log.created_at), 'HH:mm:ss dd/MM')}
                </span>
                <span className={`uppercase shrink-0 w-14 ${LEVEL_COLORS[log.level] ?? 'text-gray-400'}`}>
                  [{log.level}]
                </span>
                <span className="text-gray-300 break-all">{log.message}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  )
}
