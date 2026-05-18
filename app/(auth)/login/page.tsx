'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

const URL_MESSAGES: Record<string, string> = {
  no_profile:
    'Tu usuario no tiene acceso configurado. Contacta con el administrador de KonnectAND.',
}

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const msg = searchParams.get('message')
    if (msg && URL_MESSAGES[msg]) setError(URL_MESSAGES[msg])
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        setError(authError.message || 'Error al iniciar sesión. Verifica tus credenciales.')
        return
      }

      if (!data.session) {
        setError('Confirma tu correo electrónico antes de iniciar sesión, o contacta con el administrador.')
        return
      }

      window.location.replace('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado. Inténtalo de nuevo.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090F] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,127,245,0.12) 0%, transparent 60%)' }}
      />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#8B7FF5]/20 border border-[#8B7FF5]/30 mb-4">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="7"  cy="14" r="5" fill="#8B7FF5" />
              <circle cx="21" cy="14" r="5" fill="#2DD4A8" />
              <path d="M12 14 Q14 8 16 14"  stroke="#8B7FF5" strokeWidth="1.5" fill="none" />
              <path d="M12 14 Q14 20 16 14" stroke="#2DD4A8" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">KonnectAND</h1>
          <p className="text-sm text-gray-500 mt-1">Panel de Control</p>
        </div>

        <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-1">Iniciar sesión</h2>
          <p className="text-sm text-gray-500 mb-6">
            Accede con tus credenciales de KonnectAND
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@konnectand.com"
                className="w-full bg-[#09090F] border border-[#1A1A2E] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#8B7FF5] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Contrasena
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-[#09090F] border border-[#1A1A2E] rounded-lg px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#8B7FF5] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-[#8B7FF5] hover:bg-[#7B6FE5] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Accediendo...' : 'Acceder'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          &copy; {new Date().getFullYear()} KonnectAND &mdash; Portales Experienciales
        </p>
      </div>
    </div>
  )
}
