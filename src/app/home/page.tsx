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
}

export default function HomePage() {
  const router = useRouter()
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [cargando, setCargando] = useState(true)
  const [totales, setTotales] = useState({ viajesActivos: 0, pasajerosTotales: 0, pendientesRevision: 0 })
  const [conteoPorViaje, setConteoPorViaje] = useState<Record<string, { total: number; pendientes: number }>>({})

  useEffect(() => {
    const cargarDatos = async () => {
      const supabase = createClient()
      const { data: viajesData } = await supabase.from('viajes').select('*').order('fecha_inicio', { ascending: true })
      const { data: pasajerosData } = await supabase.from('pasajeros').select('id, viaje_id, estado_revision')

      if (viajesData && pasajerosData) {
        setViajes(viajesData)
        setTotales({
          viajesActivos: viajesData.length,
          pasajerosTotales: pasajerosData.length,
          pendientesRevision: pasajerosData.filter(p => p.estado_revision === 'pendiente').length,
        })
        const conteo: Record<string, { total: number; pendientes: number }> = {}
        viajesData.forEach((v) => {
          const del = pasajerosData.filter(p => p.viaje_id === v.id)
          conteo[v.id] = { total: del.length, pendientes: del.filter(p => p.estado_revision === 'pendiente').length }
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

  return (
    <main className="min-h-screen" style={{ background: BG_PAGINA }}>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between" style={{ background: SN_AZUL, boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-3">
          <Image src="/logo-sn.png" alt="SN Viajes" width={40} height={40} className="object-contain rounded" />
          <div>
            <p className="text-white font-semibold text-sm leading-none">SN Viajes <span style={{ color: SN_AMARILLO }}>&</span> Turismo</p>
            <p className="text-xs mt-0.5" style={{ color: '#7AAEC4' }}>Panel de administración</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/viaje/nuevo"
            className="rounded-lg px-4 py-1.5 text-sm font-semibold border-none transition-opacity hover:opacity-85"
            style={{ background: SN_AMARILLO, color: SN_AZUL }}
          >
            + Nuevo viaje
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

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Viajes activos', valor: totales.viajesActivos, acento: SN_CELESTE, icono: '✈️' },
            { label: 'Pasajeros totales', valor: totales.pasajerosTotales, acento: SN_CELESTE, icono: '👥' },
            { label: 'Pendientes de revisión', valor: totales.pendientesRevision, acento: SN_AMARILLO, icono: '🕐' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-5 flex items-center gap-4"
              style={{ background: BG_CARD, borderTop: `3px solid ${stat.acento}` }}
            >
              <span className="text-2xl">{stat.icono}</span>
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: TEXTO_MUTED }}>{stat.label}</p>
                <p className="text-3xl font-bold" style={{ color: 'white' }}>{stat.valor}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ENCABEZADO VIAJES */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: 'white' }}>Próximos viajes</h2>
          <p className="text-sm" style={{ color: TEXTO_MUTED }}>{viajes.length} viaje{viajes.length !== 1 ? 's' : ''} cargado{viajes.length !== 1 ? 's' : ''}</p>
        </div>

        {/* CARDS DE VIAJES */}
        {viajes.length === 0 ? (
          <div className="text-center py-20 rounded-xl" style={{ background: BG_CARD, border: `1px dashed ${BORDE}` }}>
            <p className="text-4xl mb-4">🗺️</p>
            <p className="font-medium text-white mb-1">No hay viajes cargados todavía</p>
            <p className="text-sm mb-6" style={{ color: TEXTO_MUTED }}>Creá el primero para empezar a gestionar pasajeros</p>
            <Link
              href="/viaje/nuevo"
              className="inline-block rounded-lg px-5 py-2 text-sm font-semibold border-none"
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
              const fechaInicio = new Date(viaje.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
              const fechaFin = new Date(viaje.fecha_fin).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
              const diasRestantes = Math.ceil((new Date(viaje.fecha_inicio).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

              return (
                <Link
                  key={viaje.id}
                  href={`/viaje/${viaje.id}`}
                  className="rounded-xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.01] hover:shadow-lg"
                  style={{ background: BG_CARD, border: `1px solid ${BORDE}`, borderLeft: `4px solid ${SN_CELESTE}` }}
                >
                  {/* Cabecera de la card */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base leading-tight" style={{ color: 'white' }}>{viaje.destino}</h3>
                    {diasRestantes > 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0" style={{ background: 'rgba(45,156,184,0.15)', color: SN_CELESTE }}>
                        en {diasRestantes}d
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0" style={{ background: 'rgba(242,182,50,0.15)', color: SN_AMARILLO }}>
                        En curso
                      </span>
                    )}
                  </div>

                  {/* Fechas */}
                  <p className="text-xs" style={{ color: TEXTO_MUTED }}>
                    📅 {fechaInicio} → {fechaFin}
                  </p>

                  {/* Barra de progreso */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs" style={{ color: TEXTO_MUTED }}>Ocupación</span>
                      <span className="text-xs font-medium" style={{ color: SN_CELESTE }}>{conteo.total}/{viaje.cupo_total}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#0B1620' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${porcentaje}%`,
                          background: porcentaje >= 90 ? SN_AMARILLO : SN_CELESTE
                        }}
                      />
                    </div>
                  </div>

                  {/* Badge de pendientes */}
                  <div className="flex items-center justify-between pt-1" style={{ borderTop: `1px solid ${BORDE}` }}>
                    <span className="text-xs" style={{ color: TEXTO_MUTED }}>
                      {porcentaje}% completo
                    </span>
                    {conteo.pendientes > 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#FAEEDA', color: '#854F0B' }}>
                        {conteo.pendientes} pendiente{conteo.pendientes > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(59,109,17,0.2)', color: '#7EC55A' }}>
                        Al día
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