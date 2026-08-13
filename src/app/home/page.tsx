'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Bricolage_Grotesque, IBM_Plex_Mono } from 'next/font/google'

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' })

// ---- Tokens ------------------------------------------------------------
const INK = '#12131C'          // fondo principal (reemplaza BG_PAGINA)
const PANEL = '#1B1D2B'        // tarjetas (reemplaza BG_CARD)
const LINE = '#2C2E42'         // bordes / perforado (reemplaza BORDE)
const CHALK = '#F5F1E8'        // texto principal sobre fondo oscuro
const CHALK_DIM = '#9CA0B8'    // texto secundario (reemplaza TEXTO_MUTED)
const CORAL = '#E8734A'        // acento urgencia / CTA (reemplaza SN_AMARILLO en CTAs)
const GOLD = '#D9A441'         // acento secundario / pendientes
const ROUTE = '#5FB8AD'        // acento de ruta / completado
const SN_AZUL = '#1B3A5C'      // se mantiene para la marca en la nav

type Viaje = {
  id: string
  destino: string
  fecha_inicio: string
  fecha_fin: string
  cupo_total: number
  created_at: string
  precio?: number | null
}

const formatearFecha = (fecha: string) => {
  if (!fecha) return '--/--/----'
  const partes = fecha.split('T')[0].split('-')
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

const calcularDiasRestantes = (fechaInicio: string) => {
  const hoy = new Date()
  const inicioStr = fechaInicio.split('T')[0]
  const inicio = new Date(inicioStr + 'T00:00:00')
  const diff = inicio.getTime() - hoy.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function HomePage() {
  const router = useRouter()
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [cargando, setCargando] = useState(true)
  const [totales, setTotales] = useState({ viajesActivos: 0, pasajerosTotales: 0, pendientesRevision: 0 })
  const [conteoPorViaje, setConteoPorViaje] = useState<Record<string, { total: number; pendientes: number }>>({})
  const [nombreUsuario, setNombreUsuario] = useState('Usuario')
  const [filtro, setFiltro] = useState<'todos' | 'atencion' | 'proximos' | 'finalizados'>('todos')

  useEffect(() => {
    const cargarDatos = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const nombre = user.email.split('@')[0]
        setNombreUsuario(nombre.charAt(0).toUpperCase() + nombre.slice(1))
      }

      const { data: viajesData } = await supabase
        .from('viajes')
        .select('*')
        .order('fecha_inicio', { ascending: true })

      const { data: pasajerosData } = await supabase
        .from('pasajeros')
        .select('id, viaje_id, estado_revision')

      if (viajesData) {
        setViajes(viajesData)

        const totalPasajeros = pasajerosData?.length || 0
        const pendientes = pasajerosData?.filter(p => p.estado_revision === 'pendiente').length || 0

        setTotales({
          viajesActivos: viajesData.length,
          pasajerosTotales: totalPasajeros,
          pendientesRevision: pendientes
        })

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
      <main className="min-h-screen flex items-center justify-center" style={{ background: INK }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-current animate-spin mx-auto" style={{ borderTopColor: ROUTE }} />
          <p className="mt-4 text-sm" style={{ color: CHALK_DIM }}>Cargando panel...</p>
        </div>
      </main>
    )
  }

  const viajesProximos = viajes.filter(v => new Date(v.fecha_inicio) >= new Date())

  // Un viaje "necesita atención" si sale pronto y todavía tiene poca ocupación
  const esUrgente = (viaje: Viaje) => {
    const conteo = conteoPorViaje[viaje.id] || { total: 0, pendientes: 0 }
    const dias = calcularDiasRestantes(viaje.fecha_inicio)
    const porcentaje = viaje.cupo_total > 0 ? conteo.total / viaje.cupo_total : 0
    return dias >= 0 && dias <= 15 && porcentaje < 0.5
  }

  const viajesUrgentes = viajes.filter(esUrgente)

  const viajesFiltrados = viajes.filter((v) => {
    const esProximo = new Date(v.fecha_inicio) > new Date()
    const esFinalizado = new Date(v.fecha_fin) < new Date()
    if (filtro === 'atencion') return esUrgente(v)
    if (filtro === 'proximos') return esProximo
    if (filtro === 'finalizados') return esFinalizado
    return true
  })

  return (
    <main className={`${display.variable} ${mono.variable} min-h-screen`} style={{ background: INK, color: CHALK }}>
      <style jsx global>{`
        .font-display { font-family: var(--font-display), sans-serif; }
        .font-mono-t { font-family: var(--font-mono), monospace; }

        .ticket {
          display: flex;
          border-radius: 14px;
          border: 1px solid ${LINE};
          background: ${PANEL};
          overflow: hidden;
          transition: transform .18s ease, border-color .18s ease;
        }
        .ticket:hover { transform: translateY(-3px); border-color: #444765; }
        .ticket.urgente { border-color: ${CORAL}55; }

        .route-line { display: flex; align-items: center; gap: 6px; margin: 12px 0 14px; }
        .route-dot { width: 6px; height: 6px; border-radius: 50%; background: ${ROUTE}; flex-shrink: 0; }
        .route-dash {
          flex: 1; height: 1px; position: relative;
          background-image: linear-gradient(to right, ${LINE} 50%, transparent 0%);
          background-size: 6px 1px; background-repeat: repeat-x;
        }
        .route-dash::after {
          content: '✈'; position: absolute; top: -8px; left: 50%;
          transform: translateX(-50%); font-size: 11px; color: ${ROUTE};
        }

        .stub-side {
          width: 72px; flex-shrink: 0;
          border-left: 1.5px dashed ${LINE};
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px; padding: 10px 4px; position: relative;
        }
        .stub-side::before, .stub-side::after {
          content: ''; position: absolute; left: -6px; width: 11px; height: 11px;
          background: ${INK}; border-radius: 50%;
        }
        .stub-side::before { top: -5px; }
        .stub-side::after { bottom: -5px; }
      `}</style>

      <nav className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between" style={{ background: SN_AZUL, boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2" style={{ borderColor: ROUTE }}>
            <Image src="/logo-sn.png" alt="SN Viajes" fill className="object-cover" sizes="40px" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm leading-none text-white">
              SN Viajes <span style={{ color: GOLD }}>&</span> Turismo
            </p>
            <p className="font-mono-t text-[11px] mt-1 tracking-wide" style={{ color: '#7AAEC4' }}>Panel de administración</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/viaje/nuevo"
            className="rounded-lg px-4 py-1.5 text-sm font-semibold border-none transition-opacity hover:opacity-85 flex items-center gap-1.5"
            style={{ background: CORAL, color: INK }}
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

        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">
            ¡Bienvenido, {nombreUsuario}!
          </h1>
          <p className="text-sm mt-1" style={{ color: CHALK_DIM }}>
            Gestiona tus viajes de forma inteligente y lleva todo bajo control.
          </p>
        </div>

        {/* Franja de métricas estilo "tablero de salidas" */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 mb-10 rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${LINE}`, background: PANEL }}
        >
          {[
            { label: 'Viajes totales', valor: totales.viajesActivos, color: CHALK },
            { label: 'Próximos viajes', valor: viajesProximos.length, color: CHALK },
            { label: 'Necesitan atención', valor: viajesUrgentes.length, color: viajesUrgentes.length > 0 ? CORAL : CHALK, sub: 'baja ocupación' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="p-5"
              style={{ borderRight: i < 2 ? `1px solid ${LINE}` : 'none' }}
            >
              <p className="font-mono-t text-[11px] uppercase tracking-widest mb-2" style={{ color: CHALK_DIM }}>
                {stat.label}
              </p>
              <p className="font-display text-4xl font-extrabold flex items-baseline gap-2" style={{ color: stat.color }}>
                {stat.valor}
                {stat.sub && <span className="font-mono-t text-xs font-medium" style={{ color: GOLD }}>{stat.sub}</span>}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-3">
          <h2 className="font-display text-lg font-semibold text-white">Mis viajes</h2>
          <span className="font-mono-t text-xs" style={{ color: CHALK_DIM }}>{viajes.length} totales</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-7">
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'atencion', label: 'Necesitan atención' },
            { key: 'proximos', label: 'Próximos' },
            { key: 'finalizados', label: 'Finalizados' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key as typeof filtro)}
              className="font-mono-t text-[11px] tracking-wide px-3 py-1.5 rounded-full border transition-colors"
              style={{
                borderColor: filtro === f.key ? CORAL : LINE,
                color: filtro === f.key ? CORAL : CHALK_DIM,
                background: filtro === f.key ? `${CORAL}14` : 'transparent',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {viajes.length === 0 ? (
          <div className="text-center py-20 rounded-xl" style={{ background: PANEL, border: `1px dashed ${LINE}` }}>
            <p className="text-5xl mb-4">🗺️</p>
            <p className="font-display font-medium text-white text-lg mb-1">No hay viajes cargados todavía</p>
            <p className="text-sm mb-6" style={{ color: CHALK_DIM }}>Creá el primero para empezar a gestionar pasajeros</p>
            <Link
              href="/viaje/nuevo"
              className="inline-block rounded-lg px-6 py-2.5 text-sm font-semibold border-none transition-all hover:scale-[1.02]"
              style={{ background: CORAL, color: INK }}
            >
              Crear viaje
            </Link>
          </div>
        ) : viajesFiltrados.length === 0 ? (
          <div className="text-center py-16 rounded-xl" style={{ background: PANEL, border: `1px dashed ${LINE}` }}>
            <p className="text-sm" style={{ color: CHALK_DIM }}>Ningún viaje coincide con este filtro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {viajesFiltrados.map((viaje) => {
              const conteo = conteoPorViaje[viaje.id] || { total: 0, pendientes: 0 }
              const porcentaje = viaje.cupo_total > 0 ? Math.min(100, Math.round((conteo.total / viaje.cupo_total) * 100)) : 0

              const fechaInicio = formatearFecha(viaje.fecha_inicio)
              const fechaFin = formatearFecha(viaje.fecha_fin)
              const diasRestantes = calcularDiasRestantes(viaje.fecha_inicio)

              const esProximo = new Date(viaje.fecha_inicio) > new Date()
              const esActivo = new Date(viaje.fecha_inicio) <= new Date() && new Date(viaje.fecha_fin) >= new Date()
              const urgente = esUrgente(viaje)

              const badgeColor = esActivo ? GOLD : urgente ? CORAL : esProximo ? ROUTE : CHALK_DIM
              const badgeBg = esActivo ? `${GOLD}22` : urgente ? `${CORAL}22` : esProximo ? `${ROUTE}22` : `${CHALK_DIM}18`
              const badgeTexto = esActivo ? 'En curso' : esProximo ? `sale en ${diasRestantes}d` : 'Finalizado'

              return (
                <Link key={viaje.id} href={`/viaje/${viaje.id}`} className={`ticket ${urgente ? 'urgente' : ''}`}>
                  <div className="flex-1 p-5 relative">
                    <span
                      className="absolute top-5 right-5 font-mono-t text-[11px] font-semibold px-2.5 py-1 rounded-md"
                      style={{ background: badgeBg, color: badgeColor }}
                    >
                      {badgeTexto}
                    </span>

                    <h3 className="font-display font-bold text-base leading-tight text-white pr-20">
                      {viaje.destino}
                    </h3>
                    <p className="font-mono-t text-xs mt-2" style={{ color: CHALK_DIM }}>
                      {fechaInicio} — {fechaFin}
                    </p>

                    <div className="route-line">
                      <div className="route-dot" />
                      <div className="route-dash" />
                      <div className="route-dot" />
                    </div>

                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-[11px] uppercase tracking-wide" style={{ color: CHALK_DIM }}>Ocupación</span>
                      <span className="font-mono-t text-xs font-semibold" style={{ color: porcentaje >= 90 ? GOLD : ROUTE }}>
                        {conteo.total}/{viaje.cupo_total}
                      </span>
                    </div>
                    <div className="h-[5px] rounded-full overflow-hidden" style={{ background: '#0B1620' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${porcentaje}%`, background: porcentaje >= 90 ? GOLD : ROUTE }}
                      />
                    </div>
                  </div>

                  <div className="stub-side">
                    <span className="font-display font-extrabold text-xl text-white">{conteo.total}</span>
                    <span className="text-[9px] uppercase tracking-wide text-center" style={{ color: CHALK_DIM }}>Pasajeros</span>
                    {conteo.pendientes > 0 ? (
                      <span className="font-mono-t text-[9px] font-semibold px-1.5 py-0.5 rounded text-center" style={{ background: `${CORAL}26`, color: CORAL }}>
                        {conteo.pendientes} pend.
                      </span>
                    ) : (
                      <span className="font-mono-t text-[9px] font-semibold px-1.5 py-0.5 rounded text-center" style={{ background: `${ROUTE}22`, color: ROUTE }}>
                        Completo
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