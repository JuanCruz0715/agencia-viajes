'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const SN_AZUL = '#1B3A5C'
const SN_CELESTE = '#2D9CB8'
const SN_AMARILLO = '#F2B632'
const BG_PAGINA = '#0B1620'
const BG_CARD = '#15212C'
const BORDE = '#1E2D3D'
const TEXTO_MUTED = '#9FB3C2'

type Viaje = {
  id: string
  destino: string
  fecha_inicio: string
  fecha_fin: string
  cupo_total: number
  created_at: string
  precio?: number | null
}

export default function HomePage() {
  const router = useRouter()
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [cargando, setCargando] = useState(true)
  const [totales, setTotales] = useState({ viajesActivos: 0, pasajerosTotales: 0, pendientesRevision: 0 })
  const [conteoPorViaje, setConteoPorViaje] = useState<Record<string, { total: number; pendientes: number }>>({})
  const [nombreUsuario, setNombreUsuario] = useState('Usuario')

  useEffect(() => {
    const cargarDatos = async () => {
      const supabase = createClient()
      
      // Obtener usuario
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const nombre = user.email.split('@')[0]
        setNombreUsuario(nombre.charAt(0).toUpperCase() + nombre.slice(1))
      }

      // Obtener viajes
      const { data: viajesData } = await supabase
        .from('viajes')
        .select('*')
        .order('fecha_inicio', { ascending: true })

      // Obtener pasajeros
      const { data: pasajerosData } = await supabase
        .from('pasajeros')
        .select('id, viaje_id, estado_revision')

      if (viajesData) {
        setViajes(viajesData)
        
        // Calcular totales
        const totalPasajeros = pasajerosData?.length || 0
        const pendientes = pasajerosData?.filter(p => p.estado_revision === 'pendiente').length || 0

        setTotales({
          viajesActivos: viajesData.length,
          pasajerosTotales: totalPasajeros,
          pendientesRevision: pendientes
        })

        // Conteo por viaje
        const conteo: Record<string, { total: number; pendientes: number }> = {}
        viajesData.forEach((v) => {
          const del = pasajerosData?.filter(p => p.viaje_id === v.id) || []
          conteo[v.id] = { 
            total: del.length, 
            pendientes: del.filter(p => p.estado_revision === 'pendiente').length 
          }
        })
        setConteoPorViaje(conteo)
      }
      setCargando(false)
    }
    cargarDatos()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: BG_PAGINA }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-current animate-spin mx-auto" style={{ borderTopColor: SN_CELESTE }} />
          <p className="mt-4 text-sm" style={{ color: TEXTO_MUTED }}>Cargando panel...</p>
        </div>
      </main>
    )
  }

  // Calcular próximos viajes (los que no han pasado)
  const viajesProximos = viajes.filter(v => new Date(v.fecha_inicio) >= new Date())

  return (
    <main className="min-h-screen" style={{ background: BG_PAGINA }}>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between" style={{ background: SN_AZUL, boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2" style={{ borderColor: SN_CELESTE }}>
            <Image
              src="/logo-sn.png"
              alt="SN Viajes"
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">SN Viajes <span style={{ color: SN_AMARILLO }}>&</span> Turismo</p>
            <p className="text-xs mt-0.5" style={{ color: '#7AAEC4' }}>Panel de administración</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/viaje/nuevo"
            className="rounded-lg px-4 py-1.5 text-sm font-semibold border-none transition-opacity hover:opacity-85 flex items-center gap-1.5"
            style={{ background: SN_AMARILLO, color: SN_AZUL }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo viaje
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg border-none transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#9FC8DC' }}
          >
            Salir
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* BIENVENIDA */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            ¡Bienvenido, {nombreUsuario}!
          </h1>
          <p className="text-sm mt-1" style={{ color: TEXTO_MUTED }}>
            Gestiona tus viajes de forma inteligente y lleva todo bajo control.
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Viajes totales', valor: totales.viajesActivos, acento: SN_CELESTE, icono: '✈️' },
            { label: 'Próximos viajes', valor: viajesProximos.length, acento: SN_CELESTE, icono: '📅' },
            { label: 'Pasajeros totales', valor: totales.pasajerosTotales, acento: SN_AMARILLO, icono: '👥' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02]"
              style={{ background: BG_CARD, border: `1px solid ${BORDE}`, borderTop: `3px solid ${stat.acento}` }}
            >
              <span className="text-2xl">{stat.icono}</span>
              <div>
                <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: TEXTO_MUTED }}>{stat.label}</p>
                <p className="text-2xl font-bold" style={{ color: 'white' }}>{stat.valor}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ENCABEZADO VIAJES */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold" style={{ color: 'white' }}>Mis viajes</h2>
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(45,156,184,0.15)', color: SN_CELESTE }}>
              {viajes.length} totales
            </span>
          </div>
        </div>

        {/* CARDS DE VIAJES */}
        {viajes.length === 0 ? (
          <div className="text-center py-20 rounded-xl" style={{ background: BG_CARD, border: `1px dashed ${BORDE}` }}>
            <p className="text-5xl mb-4">🗺️</p>
            <p className="font-medium text-white text-lg mb-1">No hay viajes cargados todavía</p>
            <p className="text-sm mb-6" style={{ color: TEXTO_MUTED }}>Creá el primero para empezar a gestionar pasajeros</p>
            <Link
              href="/viaje/nuevo"
              className="inline-block rounded-lg px-6 py-2.5 text-sm font-semibold border-none transition-all hover:scale-[1.02]"
              style={{ background: SN_AMARILLO, color: SN_AZUL }}
            >
              Crear viaje
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {viajes.map((viaje) => {
              const conteo = conteoPorViaje[viaje.id] || { total: 0, pendientes: 0 }
              const porcentaje = viaje.cupo_total > 0 ? Math.min(100, Math.round((conteo.total / viaje.cupo_total) * 100)) : 0
              
              const fechaInicio = new Date(viaje.fecha_inicio).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
              const fechaFin = new Date(viaje.fecha_fin).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
              const diasRestantes = Math.ceil((new Date(viaje.fecha_inicio).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              
              const esProximo = new Date(viaje.fecha_inicio) > new Date()
              const esActivo = new Date(viaje.fecha_inicio) <= new Date() && new Date(viaje.fecha_fin) >= new Date()
              const esPasado = new Date(viaje.fecha_fin) < new Date()

              return (
                <Link
                  key={viaje.id}
                  href={`/viaje/${viaje.id}`}
                  className="rounded-xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.02] hover:shadow-xl group"
                  style={{ 
                    background: BG_CARD, 
                    border: `1px solid ${BORDE}`,
                    borderLeft: `4px solid ${esActivo ? SN_AMARILLO : esProximo ? SN_CELESTE : '#4a5a6a'}`
                  }}
                >
                  {/* Cabecera */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base leading-tight text-white group-hover:text-blue-300 transition-colors">
                      {viaje.destino}
                    </h3>
                    <span 
                      className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 font-medium ${
                        esActivo ? 'animate-pulse' : ''
                      }`}
                      style={{ 
                        background: esActivo 
                          ? 'rgba(242,182,50,0.15)' 
                          : esProximo 
                          ? 'rgba(45,156,184,0.15)' 
                          : 'rgba(100,100,100,0.15)',
                        color: esActivo ? SN_AMARILLO : esProximo ? SN_CELESTE : '#6a7a8a'
                      }}
                    >
                      {esActivo ? '🟢 En curso' : esProximo ? `en ${diasRestantes}d` : '✅ Finalizado'}
                    </span>
                  </div>

                  {/* Fechas */}
                  <p className="text-xs" style={{ color: TEXTO_MUTED }}>
                    📅 {fechaInicio} — {fechaFin}
                  </p>

                  {/* Barra de ocupación */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs" style={{ color: TEXTO_MUTED }}>Ocupación</span>
                      <span className="text-xs font-medium" style={{ color: SN_CELESTE }}>{conteo.total}/{viaje.cupo_total}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#0B1620' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${porcentaje}%`,
                          background: porcentaje >= 90 ? SN_AMARILLO : SN_CELESTE
                        }}
                      />
                    </div>
                  </div>

                  {/* Badge de pendientes */}
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${BORDE}` }}>
                    <span className="text-xs font-medium" style={{ color: TEXTO_MUTED }}>
                      {conteo.total} pasajero{conteo.total !== 1 ? 's' : ''}
                    </span>
                    {conteo.pendientes > 0 ? (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(242,182,50,0.15)', color: SN_AMARILLO }}>
                        {conteo.pendientes} pendiente{conteo.pendientes > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(59,109,17,0.2)', color: '#7EC55A' }}>
                        ✅ Completado
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}