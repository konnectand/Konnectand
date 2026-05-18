'use client'

import { useState } from 'react'
import { actionInsertPortalLog, actionUpdatePortalMode } from '@/lib/actions'
import { Power, RotateCcw, Settings, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface Props {
  portalId: string
  portalName: string
  currentMode: string
}

type CommandType = 'restart_app' | 'restart_pc' | 'change_mode'
type FeedbackState = { type: 'success' | 'error'; message: string } | null

const MODES = ['default', 'kiosk', 'conference', 'demo', 'maintenance']

export function CommandPanel({ portalId, portalName, currentMode }: Props) {
  const [loading, setLoading] = useState<CommandType | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [newMode, setNewMode] = useState(currentMode || 'default')
  const [showModeSelector, setShowModeSelector] = useState(false)

  async function sendCommand(type: CommandType, payload?: Record<string, string>) {
    setLoading(type)
    setFeedback(null)

    const { error } = await actionInsertPortalLog({
      portal_id: portalId,
      level:     'command',
      message:   JSON.stringify({ type, ...(payload ?? {}) }),
      data:      { command: type, payload, source: 'dashboard' },
    })

    if (type === 'change_mode' && payload?.mode) {
      await actionUpdatePortalMode(portalId, payload.mode)
    }

    setLoading(null)

    if (error) {
      setFeedback({ type: 'error', message: 'Error al enviar el comando: ' + error.message })
    } else {
      const labels: Record<CommandType, string> = {
        restart_app: 'Reiniciar app enviado',
        restart_pc:  'Reiniciar PC enviado',
        change_mode: `Modo cambiado a "${payload?.mode}"`,
      }
      setFeedback({ type: 'success', message: labels[type] })
      setTimeout(() => setFeedback(null), 4000)
    }
  }

  return (
    <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white mb-4">Comandos remotos</h2>

      {feedback && (
        <div
          className={`mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs ${
            feedback.type === 'success'
              ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {feedback.type === 'success'
            ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            : <XCircle    className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
          {feedback.message}
        </div>
      )}

      <div className="space-y-2.5">
        <button
          onClick={() => sendCommand('restart_app')}
          disabled={loading !== null}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[#8B7FF5]/25 bg-[#8B7FF5]/8 text-[#8B7FF5] hover:bg-[#8B7FF5]/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
        >
          {loading === 'restart_app' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Reiniciar App
        </button>

        <button
          onClick={() => sendCommand('restart_pc')}
          disabled={loading !== null}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-red-500/25 bg-red-500/8 text-red-400 hover:bg-red-500/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
        >
          {loading === 'restart_pc' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
          Reiniciar PC
        </button>

        <div>
          <button
            onClick={() => setShowModeSelector(!showModeSelector)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[#F0B429]/25 bg-[#F0B429]/8 text-[#F0B429] hover:bg-[#F0B429]/15 transition-all text-sm"
          >
            <Settings className="w-4 h-4" />
            Cambiar modo
            <span className="ml-auto font-mono text-xs opacity-70">{currentMode || '—'}</span>
          </button>

          {showModeSelector && (
            <div className="mt-2 p-3 bg-[#09090F] border border-[#1A1A2E] rounded-lg space-y-2">
              <p className="text-xs text-gray-500 mb-2">Selecciona el nuevo modo:</p>
              <div className="grid grid-cols-2 gap-1.5">
                {MODES.map(mode => (
                  <button
                    key={mode}
                    onClick={() => setNewMode(mode)}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                      newMode === mode
                        ? 'bg-[#F0B429]/20 text-[#F0B429] border border-[#F0B429]/30'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/4'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { sendCommand('change_mode', { mode: newMode }); setShowModeSelector(false) }}
                disabled={loading !== null || newMode === currentMode}
                className="w-full mt-2 px-3 py-2 rounded-lg bg-[#F0B429] text-[#09090F] text-xs font-semibold hover:bg-[#E0A419] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading === 'change_mode' && <Loader2 className="w-3 h-3 animate-spin" />}
                Aplicar modo: {newMode}
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-gray-600 mt-4">
        Los comandos se registran en los logs del portal.
      </p>
    </div>
  )
}
