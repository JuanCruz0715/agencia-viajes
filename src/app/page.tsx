'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const SN_AZUL = '#1B3A5C'
const SN_CELESTE = '#2D9CB8'
const SN_AMARILLO = '#F2B632'
const BG_PAGINA = '#0B1620'
const BG_CARD = '#15212C'
const BORDE = '#1E2D3D'
const TEXTO_MUTED = '#9FB3C2'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setCargando(false)
      return
    }
    router.push('/home')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: BG_PAGINA }}>
      <div className="w-full max-w-sm rounded-2xl p-8" style={{ background: BG_CARD, border: `1px solid ${BORDE}` }}>
        {/* Logo y título */}
        <div className="flex flex-col items-center mb-6">
          <div 
            className="relative w-24 h-24 mb-3 overflow-hidden"
            style={{ 
              borderRadius: '50%',
              border: `2px solid ${SN_CELESTE}`,
              boxShadow: `0 0 30px rgba(45, 156, 184, 0.15)`
            }}
          >
            <Image
              src="/logo-sn.png"
              alt="SN Viajes y Turismo"
              fill
              className="object-cover"
              sizes="96px"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-center" style={{ color: 'white' }}>
            SN Viajes <span style={{ color: SN_AMARILLO }}>&</span> Turismo
          </h1>
          <p className="text-sm mt-1" style={{ color: TEXTO_MUTED }}>
            Panel de administración
          </p>
          <div className="w-12 h-0.5 rounded-full mt-3" style={{ background: SN_CELESTE }} />
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'white' }}>
              📧 Email
            </label>
            <input
              type="email"
              placeholder="admin@snviajes.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 text-sm transition-all outline-none placeholder-gray-400"
              style={{
                background: BG_PAGINA,
                border: `1px solid ${BORDE}`,
                color: 'white',
              }}
              onFocus={(e) => e.target.style.borderColor = SN_CELESTE}
              onBlur={(e) => e.target.style.borderColor = BORDE}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'white' }}>
              🔒 Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 text-sm transition-all outline-none placeholder-gray-400"
              style={{
                background: BG_PAGINA,
                border: `1px solid ${BORDE}`,
                color: 'white',
              }}
              onFocus={(e) => e.target.style.borderColor = SN_CELESTE}
              onBlur={(e) => e.target.style.borderColor = BORDE}
            />
          </div>

          {error && (
            <div className="rounded-xl p-3 text-sm text-center" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <p style={{ color: '#EF4444' }}>❌ {error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl py-3 font-semibold text-sm transition-all hover:opacity-85 disabled:opacity-50"
            style={{ background: SN_CELESTE, color: 'white' }}
          >
            {cargando ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ingresando...
              </span>
            ) : (
              '🚀 Ingresar'
            )}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs" style={{ color: TEXTO_MUTED }}>
              Acceso exclusivo para administradores
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}