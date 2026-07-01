'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const SN_AZUL = '#1B3A5C'
const SN_CELESTE = '#2D9CB8'
const SN_AMARILLO = '#F2B632'

type Viaje = {
  id: string
  destino: string
  fecha_inicio: string
  fecha_fin: string
  cupo_total: number
  created_at: string
}

type Pasajero = {
  id: string
  viaje_id: string
  estado_revision: string
}

export default function HomePage() {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [cargando, setCargando] = useState(true)
  const [totales, setTotales] = useState({
    viajesActivos: 0,
    pasajerosTotales: 0,
    pendientesRevision: 0,
  })
  const [conteoPorViaje, setConteoPorViaje] = useState<Record<string, { total: number; pendientes: number }>>({})

  useEffect(() => {
    const cargarDatos = async () => {
      const supabase = createClient()

      const { data: viajesData } = await supabase
        .from('viajes')
        .select('*')
        .order('fecha_inicio', { ascending: true })

      const { data: pasajerosData } = await supabase
        .from('pasajeros')
        .select('id, viaje_id, estado_revision')

      if (viajesData && pasajerosData) {
        setViajes(viajesData)

        const viajesActivos = viajesData.length
        const pasajerosTotales = pasajerosData.length
        const pendientesRevision = pasajerosData.filter(p => p.estado_revision === 'pendiente').length

        setTotales({ viajesActivos, pasajerosTotales, pendientesRevision })

        const conteo: Record<string, { total: number; pendientes: number }> = {}
        viajesData.forEach((v) => {
          const pasajerosDelViaje = pasajerosData.filter(p => p.viaje_id === v.id)
          conteo[v.id] = {
            total: pasajerosDelViaje.length,
            pendientes: pasajerosDelViaje.filter(p => p.estado_revision === 'pendiente').length,
          }
        })
        setConteoPorViaje(conteo)
      }

      setCargando(false)
    }

    cargarDatos()
  }, [])

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8" style={{ background: '#0B1620' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: SN_CELESTE }}></div>
          <p className="mt-4" style={{ color: '#9FB3C2' }}>Cargando...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: '#0B1620' }}>
      <div className="max-w-6xl mx-auto">
        {/* HEADER CON LOGO */}
        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 rounded-xl p-5"
          style={{ background: SN_AZUL }}
        >
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="relative w-14 h-14 flex-shrink-0">
              <Image
                src="/logo-sn.png"
                alt="SN Viajes y Turismo"
                fill
                className="object-contain"
                sizes="56px"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">SN Viajes <span style={{ color: SN_AMARILLO }}>&amp;</span> Turismo</h1>
              <p className="text-sm" style={{ color: '#9FC8DC' }}>Panel de administración</p>
            </div>
          </div>
          <Link
            href="/viaje/nuevo"
            className="mt-3 md:mt-0 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:opacity-90 border-none"
            style={{ background: SN_AMARILLO, color: SN_AZUL }}
          >
            + Nuevo viaje
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-lg p-4" style={{ background: '#15212C', borderTop: `3px solid ${SN_CELESTE}` }}>
            <p className="text-sm" style={{ color: '#9FB3C2' }}>Viajes activos</p>
            <p className="text-2xl font-semibold" style={{ color: 'white' }}>{totales.viajesActivos}</p>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#15212C', borderTop: `3px solid ${SN_CELESTE}` }}>
            <p className="text-sm" style={{ color: '#9FB3C2' }}>Pasajeros totales</p>
            <p className="text-2xl font-semibold" style={{ color: 'white' }}>{totales.pasajerosTotales}</p>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#15212C', borderTop: `3px solid ${SN_AMARILLO}` }}>
            <p className="text-sm" style={{ color: '#9FB3C2' }}>Pendientes de revisión</p>
            <p className="text-2xl font-semibold" style={{ color: 'white' }}>{totales.pendientesRevision}</p>
          </div>
        </div>

        {/* Lista de viajes */}
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'white' }}>Viajes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {viajes.map((viaje) => {
            const fechaInicio = new Date(viaje.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            const fechaFin = new Date(viaje.fecha_fin).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            const conteo = conteoPorViaje[viaje.id] || { total: 0, pendientes: 0 }
            const porcentaje = viaje.cupo_total > 0 ? Math.min(100, Math.round((conteo.total / viaje.cupo_total) * 100)) : 0

            return (
              <Link
                key={viaje.id}
                href={`/viaje/${viaje.id}`}
                className="rounded-lg p-4 transition-all hover:opacity-90"
                style={{ background: '#15212C', borderLeft: `3px solid ${SN_CELESTE}` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium" style={{ color: 'white' }}>{viaje.destino}</h3>
                  <span style={{ color: SN_CELESTE }}>📍</span>
                </div>
                <p className="text-sm mb-3" style={{ color: '#9FB3C2' }}>{fechaInicio} - {fechaFin}</p>

                <div className="h-1.5 rounded-full mb-2" style={{ background: '#0B1620' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${porcentaje}%`, background: SN_CELESTE }}
                  ></div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm font-medium" style={{ color: '#9FB3C2' }}>
                    {conteo.total}/{viaje.cupo_total} pasajeros
                  </span>
                  {conteo.pendientes > 0 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FAEEDA', color: '#854F0B' }}>
                      {conteo.pendientes} pendiente{conteo.pendientes > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#EAF3DE', color: '#3B6D11' }}>
                      Sin pendientes
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {viajes.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: '#9FB3C2' }}>No hay viajes creados todavía.</p>
            <Link
              href="/viaje/nuevo"
              className="inline-block mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:opacity-90 border-none"
              style={{ background: SN_AMARILLO, color: SN_AZUL }}
            >
              Crear viaje
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}