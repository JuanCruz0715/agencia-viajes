'use client'

import { useState } from 'react'

const SN_CELESTE = '#2D9CB8'
const SN_AMARILLO = '#F2B632'
const SN_AZUL = '#1B3A5C'
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
  onAgregarHabitacion: (numero: string, tipo: string, capacidad: number) => void
  onAsignarPasajero: (habitacionId: string, pasajeroId: string) => void
  onQuitarPasajero: (habitacionId: string, pasajeroId: string) => void
  onEliminarHabitacion: (habitacionId: string) => void
}

const estiloInput: React.CSSProperties = {
  width: '100%', background: BG_PAGINA, border: `1px solid ${BORDE}`,
  borderRadius: 8, padding: '7px 10px', fontSize: 13, color: 'white', outline: 'none'
}

export default function ContenidoHoteles({ hotel, habitaciones, pasajeros, onAgregarHabitacion, onAsignarPasajero, onQuitarPasajero, onEliminarHabitacion }: Props) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nueva, setNueva] = useState({ numero: '', tipo: 'Doble', capacidad: 2 })
  const [habSeleccionada, setHabSeleccionada] = useState<string | null>(null)

  const getNombre = (id: string) => {
    const p = pasajeros.find(p => p.id === id)
    return p ? `${p.nombre} ${p.apellido}` : 'Desconocido'
  }

  const porcentaje = (hab: Habitacion) => Math.round((hab.pasajeros.length / hab.capacidad) * 100)

  return (
    <div style={{ background: BG_CARD, border: `0.5px solid ${BORDE}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 500, fontSize: 15, color: 'white' }}>{hotel.nombre || 'Hotel'}</p>
          {hotel.fechaInicio && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: TEXTO_MUTED }}>
              {hotel.fechaInicio} → {hotel.fechaFin} · {hotel.noches} noches
            </p>
          )}
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          style={{ background: SN_CELESTE, color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
        >
          + Habitación
        </button>
      </div>

      {mostrarForm && (
        <div style={{ background: BG_PAGINA, border: `1px solid ${BORDE}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 10, marginBottom: 10 }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: TEXTO_MUTED }}>N° Habitación</p>
              <input style={estiloInput} placeholder="Ej: 101" value={nueva.numero} onChange={e => setNueva({ ...nueva, numero: e.target.value })} />
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: TEXTO_MUTED }}>Tipo</p>
              <select style={estiloInput} value={nueva.tipo} onChange={e => setNueva({ ...nueva, tipo: e.target.value })}>
                <option>Individual</option><option>Doble</option><option>Triple</option><option>Cuádruple</option>
              </select>
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: TEXTO_MUTED }}>Capacidad</p>
              <input style={estiloInput} type="number" min="1" max="6" value={nueva.capacidad} onChange={e => setNueva({ ...nueva, capacidad: parseInt(e.target.value) || 2 })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                if (nueva.numero.trim()) {
                  onAgregarHabitacion(nueva.numero, nueva.tipo, nueva.capacidad)
                  setNueva({ numero: '', tipo: 'Doble', capacidad: 2 })
                  setMostrarForm(false)
                }
              }}
              style={{ background: SN_CELESTE, color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              Guardar
            </button>
            <button
              onClick={() => setMostrarForm(false)}
              style={{ background: 'transparent', color: TEXTO_MUTED, border: `1px solid ${BORDE}`, borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {habitaciones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: 28, margin: '0 0 8px' }}>🏠</p>
          <p style={{ fontSize: 13, color: TEXTO_MUTED, margin: 0 }}>No hay habitaciones cargadas</p>
          <p style={{ fontSize: 11, color: TEXTO_MUTED, margin: '4px 0 0' }}>Clickeá "+ Habitación" para empezar</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {habitaciones.map(hab => (
            <div key={hab.id} style={{ background: BG_PAGINA, border: `1px solid ${BORDE}`, borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'white' }}>Hab. {hab.numero} — {hab.tipo}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: TEXTO_MUTED }}>{hab.pasajeros.length}/{hab.capacidad} pax</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => setHabSeleccionada(hab.id)}
                    style={{ fontSize: 11, color: SN_CELESTE, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    + Asignar
                  </button>
                  <button
                    onClick={() => onEliminarHabitacion(hab.id)}
                    style={{ fontSize: 11, color: '#F87171', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 24, marginBottom: 8 }}>
                {hab.pasajeros.length === 0 ? (
                  <span style={{ fontSize: 11, color: TEXTO_MUTED, fontStyle: 'italic' }}>Sin asignar</span>
                ) : hab.pasajeros.map(id => (
                  <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(45,156,184,0.15)', color: SN_CELESTE, fontSize: 11, padding: '2px 8px', borderRadius: 12 }}>
                    {getNombre(id)}
                    <button onClick={() => onQuitarPasajero(hab.id, id)} style={{ color: SN_CELESTE, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}>✕</button>
                  </span>
                ))}
              </div>

              <div style={{ height: 4, background: BORDE, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, transition: 'width .3s', width: `${porcentaje(hab)}%`, background: porcentaje(hab) >= 100 ? SN_AMARILLO : SN_CELESTE }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal asignar pasajero */}
      {habSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: '#15212C', borderRadius: 14, padding: 20, maxWidth: 380, width: '100%', border: `1px solid ${BORDE}` }}>
            <p style={{ margin: '0 0 4px', fontWeight: 500, fontSize: 15, color: 'white' }}>Asignar pasajero</p>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: TEXTO_MUTED }}>
              Habitación {habitaciones.find(h => h.id === habSeleccionada)?.numero}
            </p>
            <div style={{ maxHeight: 240, overflowY: 'auto', border: `1px solid ${BORDE}`, borderRadius: 8 }}>
              {pasajeros.length === 0 ? (
                <p style={{ fontSize: 13, color: TEXTO_MUTED, textAlign: 'center', padding: 16, margin: 0 }}>No hay pasajeros</p>
              ) : pasajeros.map(p => (
                <button
                  key={p.id}
                  onClick={() => { onAsignarPasajero(habSeleccionada, p.id); setHabSeleccionada(null) }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: `1px solid ${BORDE}`, color: 'white', fontSize: 13, cursor: 'pointer' }}
                >
                  {p.nombre} {p.apellido}
                </button>
              ))}
            </div>
            <button
              onClick={() => setHabSeleccionada(null)}
              style={{ marginTop: 12, width: '100%', padding: '8px 0', borderRadius: 8, background: 'transparent', border: `1px solid ${BORDE}`, color: TEXTO_MUTED, fontSize: 13, cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}