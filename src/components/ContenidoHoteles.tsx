'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const SN_CELESTE = '#2D9CB8'
const SN_AMARILLO = '#F2B632'
const BG_CARD = '#15212C'
const BG_PAGINA = '#0B1620'
const BORDE = '#1E2D3D'
const TEXTO_MUTED = '#9FB3C2'

type Habitacion = {
  id: string
  numero: string
  tipo: string
  pasajeros: string[]
  capacidad: number
}

type Pasajero = {
  id: string
  nombre: string | null
  apellido: string | null
  nombre_pasajero: string | null
}

type Props = {
  hotel: { nombre: string; fechaInicio: string; fechaFin: string; noches: number }
  habitaciones: Habitacion[]
  pasajeros: Pasajero[]
  viajeId?: string
  onAgregarHabitacion: (habitacion: Habitacion) => void
  onAsignarPasajero: (habitacionId: string, pasajeroId: string) => void
  onQuitarPasajero: (habitacionId: string, pasajeroId: string) => void
  onEliminarHabitacion: (habitacionId: string) => void
  onRefresh?: () => void
}

type SupabaseError = {
  message: string
}

// Tipo de habitación -> capacidad fija
const TIPOS_HABITACION: Record<string, number> = {
  Individual: 1,
  Doble: 2,
  Triple: 3,
  Cuádruple: 4,
}

const estiloInput: React.CSSProperties = {
  width: '100%',
  background: BG_PAGINA,
  border: `1px solid ${BORDE}`,
  borderRadius: 8,
  padding: '7px 10px',
  fontSize: 13,
  color: 'white',
  outline: 'none',
}

export default function ContenidoHoteles({
  hotel,
  habitaciones,
  pasajeros,
  viajeId,
  onAgregarHabitacion,
  onAsignarPasajero,
  onQuitarPasajero,
  onEliminarHabitacion,
  onRefresh,
}: Props) {
  // ✅ Respaldo: si la prop viajeId llega vacía, la sacamos de la URL
  const params = useParams()
  const idDesdeUrl = typeof params?.id === 'string' ? params.id : undefined
  const idViaje = viajeId || idDesdeUrl

  const [mostrarForm, setMostrarForm] = useState(false)
  const [tipoNueva, setTipoNueva] = useState('Doble')
  const [habSeleccionada, setHabSeleccionada] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  // ✅ Blindaje: siempre trabajar sobre arrays reales
  const listaHabitaciones = Array.isArray(habitaciones) ? habitaciones : []
  const listaPasajeros = Array.isArray(pasajeros) ? pasajeros : []

  const getNombre = (id: string): string => {
    const p = listaPasajeros.find((p) => p.id === id)
    if (!p) return 'Desconocido'
    return `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim() || 'Sin nombre'
  }

  const getPasajerosDisponibles = () => {
    const asignados = new Set<string>()
    listaHabitaciones.forEach((h) => {
      const ids = Array.isArray(h.pasajeros) ? h.pasajeros : []
      ids.forEach((id) => asignados.add(id))
    })
    return listaPasajeros.filter((p) => !asignados.has(p.id))
  }

  // ✅ Función SEGURA - Se eliminó el parámetro 'contexto' para evitar errores
  const textoSeguro = (valor: unknown): string => {
    if (typeof valor === 'string' || typeof valor === 'number') return String(valor)
    if (valor === null || valor === undefined) return ''
    return '(dato inválido)'
  }

  const porcentaje = (hab: Habitacion) => {
    const cantidad = Array.isArray(hab.pasajeros) ? hab.pasajeros.length : 0
    const cap = hab.capacidad || 1
    return Math.round((cantidad / cap) * 100)
  }

  const handleAgregarHabitacion = async () => {
    if (!idViaje) {
      alert('❌ Error: ID del viaje no disponible. Recargá la página e intentá de nuevo.')
      return
    }

    const capacidad = TIPOS_HABITACION[tipoNueva] ?? 2
    const numeroAuto = String(listaHabitaciones.length + 1)

    setGuardando(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('habitaciones')
        .insert({
          viaje_id: idViaje,
          numero: numeroAuto,
          tipo: tipoNueva,
          capacidad,
        })
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No se recibieron datos de la habitación')

      onAgregarHabitacion({
        id: data.id,
        numero: data.numero,
        tipo: data.tipo,
        capacidad: data.capacidad,
        pasajeros: [],
      })

      setTipoNueva('Doble')
      setMostrarForm(false)
      if (onRefresh) onRefresh()
    } catch (error: unknown) {
      const e = error as SupabaseError
      alert(`❌ Error al guardar la habitación: ${e.message || 'Error desconocido'}`)
    } finally {
      setGuardando(false)
    }
  }

  const handleAsignarPasajero = async (habitacionId: string, pasajeroId: string) => {
    if (!idViaje) {
      alert('❌ Error: ID del viaje no disponible')
      return
    }

    setGuardando(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from('habitaciones_pasajeros').insert({
        habitacion_id: habitacionId,
        pasajero_id: pasajeroId,
        viaje_id: idViaje,
      })

      if (error) throw error

      onAsignarPasajero(habitacionId, pasajeroId)
      setHabSeleccionada(null)
      if (onRefresh) onRefresh()
    } catch (error: unknown) {
      const e = error as SupabaseError
      alert(`❌ Error al asignar pasajero: ${e.message || 'Error desconocido'}`)
    } finally {
      setGuardando(false)
    }
  }

  const handleQuitarPasajero = async (habitacionId: string, pasajeroId: string) => {
    setGuardando(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('habitaciones_pasajeros')
        .delete()
        .eq('habitacion_id', habitacionId)
        .eq('pasajero_id', pasajeroId)

      if (error) throw error

      onQuitarPasajero(habitacionId, pasajeroId)
      if (onRefresh) onRefresh()
    } catch (error: unknown) {
      const e = error as SupabaseError
      alert(`❌ Error al quitar pasajero: ${e.message || 'Error desconocido'}`)
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarHabitacion = async (habitacionId: string) => {
    if (!confirm('¿Eliminar esta habitación?')) return

    setGuardando(true)
    const supabase = createClient()

    try {
      await supabase.from('habitaciones_pasajeros').delete().eq('habitacion_id', habitacionId)

      const { error } = await supabase.from('habitaciones').delete().eq('id', habitacionId)
      if (error) throw error

      onEliminarHabitacion(habitacionId)
      if (onRefresh) onRefresh()
    } catch (error: unknown) {
      const e = error as SupabaseError
      alert(`❌ Error al eliminar habitación: ${e.message || 'Error desconocido'}`)
    } finally {
      setGuardando(false)
    }
  }

  const pasajerosDisponibles = getPasajerosDisponibles()

    // ============================================
  // 📄 FUNCIÓN PARA EXPORTAR PDF (SOLO TABLA + TOTALES)
  // ============================================
  const exportarPDFHotel = () => {
    if (listaHabitaciones.length === 0) {
      alert('No hay habitaciones cargadas para exportar.')
      return
    }

    // 1. Crear instancia del PDF
    const doc = new jsPDF()

    // 2. Preparar los datos para la tabla (tamaño de fuente un poco más grande para mejor lectura)
    const bodyRows = listaHabitaciones.map((hab) => {
      const nombresPasajeros = Array.isArray(hab.pasajeros) 
        ? hab.pasajeros.map(id => getNombre(id)).join(', ') 
        : ''
      
      return [
        hab.numero,
        hab.tipo,
        `${hab.pasajeros.length} / ${hab.capacidad}`,
        nombresPasajeros || '(Vacía)'
      ]
    })

    // 3. Generar la tabla automática (comienza en Y=20 para dejar un pequeño margen arriba)
    autoTable(doc, {
      startY: 20,
      head: [['N° Hab.', 'Tipo', 'Ocupación', 'Pasajeros Asignados']],
      body: bodyRows,
      theme: 'grid',
      headStyles: { fillColor: [27, 58, 92] }, // Color SN_AZUL
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 'auto' }
      }
    })

    // 4. Calcular totales
    const totalHabitaciones = listaHabitaciones.length
    const totalPasajeros = listaHabitaciones.reduce((acc, hab) => acc + hab.pasajeros.length, 0)

    // ✅ Obtener la coordenada Y final de la tabla
    const finalY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 50

    // 5. Escribir el resumen de totales justo debajo de la tabla
    doc.setFontSize(11)
    doc.text(`Total Habitaciones: ${totalHabitaciones}`, 14, finalY + 8)
    doc.text(`Total Pasajeros Alojados: ${totalPasajeros}`, 14, finalY + 16)

    // 6. Descargar el archivo
    const nombreArchivo = `Hotel_Reserva_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(nombreArchivo)
  }

  // ============================================

  return (
    <div style={{ background: BG_CARD, border: `0.5px solid ${BORDE}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 500, fontSize: 15, color: 'white' }}>{hotel?.nombre || 'Hotel'}</p>
          {hotel?.fechaInicio && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: TEXTO_MUTED }}>
              {hotel.fechaInicio} → {hotel.fechaFin} · {hotel.noches} noches
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={exportarPDFHotel}
            disabled={listaHabitaciones.length === 0}
            style={{
              background: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 500,
              cursor: listaHabitaciones.length === 0 ? 'default' : 'pointer',
              opacity: listaHabitaciones.length === 0 ? 0.5 : 1,
            }}
          >
            📄 PDF para Hotel
          </button>

          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            disabled={guardando}
            style={{
              background: SN_CELESTE,
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 500,
              cursor: guardando ? 'default' : 'pointer',
              opacity: guardando ? 0.6 : 1,
            }}
          >
            + Habitación
          </button>
        </div>
      </div>

      {mostrarForm && (
        <div style={{ background: BG_PAGINA, border: `1px solid ${BORDE}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ marginBottom: 10 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: TEXTO_MUTED }}>Tipo de habitación</p>
            <select style={estiloInput} value={tipoNueva} onChange={(e) => setTipoNueva(e.target.value)}>
              {Object.entries(TIPOS_HABITACION).map(([tipo, cap]) => (
                <option key={tipo} value={tipo}>
                  {tipo} — {cap} {cap === 1 ? 'persona' : 'personas'}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAgregarHabitacion}
              disabled={guardando}
              style={{
                background: SN_CELESTE,
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 500,
                cursor: guardando ? 'default' : 'pointer',
                opacity: guardando ? 0.6 : 1,
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={() => setMostrarForm(false)}
              style={{
                background: 'transparent',
                color: TEXTO_MUTED,
                border: `1px solid ${BORDE}`,
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {listaHabitaciones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: 28, margin: '0 0 8px' }}>🏠</p>
          <p style={{ fontSize: 13, color: TEXTO_MUTED, margin: 0 }}>No hay habitaciones cargadas</p>
          <p style={{ fontSize: 11, color: TEXTO_MUTED, margin: '4px 0 0' }}>Clickeá + Habitación para empezar</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {listaHabitaciones.map((hab) => {
            const idsAsignados = Array.isArray(hab.pasajeros) ? hab.pasajeros : []
            return (
              <div key={hab.id} style={{ background: BG_PAGINA, border: `1px solid ${BORDE}`, borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'white' }}>
                      {/* ✅ Eliminado el segundo argumento de textoSeguro */}
                      Habitación {textoSeguro(hab.numero)} — {textoSeguro(hab.tipo)}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: TEXTO_MUTED }}>
                      {idsAsignados.length}/{hab.capacidad} pax
                    </p>
                  </div>
                  <button
                    onClick={() => handleEliminarHabitacion(hab.id)}
                    disabled={guardando}
                    style={{
                      fontSize: 11,
                      color: '#F87171',
                      background: 'none',
                      border: 'none',
                      cursor: guardando ? 'default' : 'pointer',
                      opacity: guardando ? 0.6 : 1,
                      padding: '4px 8px',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 24, marginBottom: 8 }}>
                  {idsAsignados.length === 0 ? (
                    <span style={{ fontSize: 11, color: TEXTO_MUTED, fontStyle: 'italic' }}>Sin asignar</span>
                  ) : (
                    idsAsignados.map((id) => (
                      <span
                        key={id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: 'rgba(45,156,184,0.15)',
                          color: SN_CELESTE,
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 12,
                        }}
                      >
                        {getNombre(id)}
                        <button
                          onClick={() => handleQuitarPasajero(hab.id, id)}
                          disabled={guardando}
                          style={{
                            color: SN_CELESTE,
                            background: 'none',
                            border: 'none',
                            cursor: guardando ? 'default' : 'pointer',
                            lineHeight: 1,
                            padding: '0 0 0 4px',
                            opacity: guardando ? 0.6 : 1,
                          }}
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div style={{ height: 4, background: BORDE, borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 4,
                      transition: 'width .3s',
                      width: `${porcentaje(hab)}%`,
                      background: porcentaje(hab) >= 100 ? SN_AMARILLO : SN_CELESTE,
                    }}
                  />
                </div>

                {idsAsignados.length < hab.capacidad && pasajerosDisponibles.length > 0 && (
                  <button
                    onClick={() => setHabSeleccionada(hab.id)}
                    disabled={guardando}
                    style={{
                      marginTop: 8,
                      width: '100%',
                      padding: '6px 0',
                      borderRadius: 6,
                      border: `1px dashed ${SN_CELESTE}`,
                      background: 'transparent',
                      color: SN_CELESTE,
                      fontSize: 11,
                      cursor: guardando ? 'default' : 'pointer',
                      opacity: guardando ? 0.6 : 1,
                    }}
                  >
                    + Asignar pasajero
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal asignar pasajero */}
      {habSeleccionada && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: BG_CARD,
              borderRadius: 14,
              padding: 20,
              maxWidth: 400,
              width: '100%',
              border: `1px solid ${BORDE}`,
            }}
          >
            <p style={{ margin: '0 0 4px', fontWeight: 500, fontSize: 15, color: 'white' }}>Asignar pasajero</p>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: TEXTO_MUTED }}>
              {/* ✅ Eliminado el segundo argumento de textoSeguro */}
              Habitación {textoSeguro(listaHabitaciones.find((h) => h.id === habSeleccionada)?.numero)}
            </p>

            <div style={{ maxHeight: 240, overflowY: 'auto', border: `1px solid ${BORDE}`, borderRadius: 8 }}>
              {pasajerosDisponibles.length === 0 ? (
                <p style={{ fontSize: 13, color: TEXTO_MUTED, textAlign: 'center', padding: 16, margin: 0 }}>
                  No hay pasajeros disponibles
                </p>
              ) : (
                pasajerosDisponibles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAsignarPasajero(habSeleccionada, p.id)}
                    disabled={guardando}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${BORDE}`,
                      color: 'white',
                      fontSize: 13,
                      cursor: guardando ? 'default' : 'pointer',
                      opacity: guardando ? 0.6 : 1,
                    }}
                  >
                    {p.nombre} {p.apellido}
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setHabSeleccionada(null)}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '8px 0',
                borderRadius: 8,
                background: 'transparent',
                border: `1px solid ${BORDE}`,
                color: TEXTO_MUTED,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}