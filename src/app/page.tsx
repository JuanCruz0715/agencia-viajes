'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      return
    }
    router.push('/home')
    router.refresh()
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-8">
      <form onSubmit={handleLogin} className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-center mb-1">SN Viajes y Turismo</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Ingresá con tu cuenta de administrador</p>
        <input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded-lg p-2 mb-3"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border rounded-lg p-2 mb-3"
        />
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button type="submit" className="w-full border rounded-lg p-2 bg-gray-900 text-white">
          Ingresar
        </button>
      </form>
    </main>
  )
}