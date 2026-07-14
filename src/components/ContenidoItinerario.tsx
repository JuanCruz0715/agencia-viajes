'use client'

import { useState } from 'react'

const SN_CELESTE = '#2D9CB8'
const SN_AMARILLO = '#F2B632'
const BG_CARD = '#15212C'
const BG_PAGINA = '#0B1620'
const BORDE = '#1E2D3D'
const TEXTO_MUTED = '#9FB3C2'

type Evento = {
  id: string
  dia: number
  fecha: string
  hora: string
  titulo: string
  descripcion: string
  ubicacion?: string
}

type Props = {
  eventos: Evento[]
  onAgregarEvento: (evento: Omit<Evento, 'id'>) => void
  onEliminarEvento: (id: string) => void
}

const estiloInput: React.CSSProperties = {
  width: '100%', background: BG_PAGINA, border: `1px solid ${BORDE}`,
  borderRadius: 8, padding: '7px 10px', fontSize: 13, color: 'white', outline: 'none'
}

export default function ContenidoItinerario({ eventos, onAgregarEvento, onEliminarEvento }: Props) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevo, setNuevo] = useState({ dia: 1, fecha: '', hora: '', titulo: '', descripcion: '', ubicacion: '' })

  const handleAgregar = () => {
    if (nuevo.titulo.trim()) {
      onAgregarEvento(nuevo)
      setNuevo({ dia: 1, fecha: '', hora: '', titulo: '', descripcion: '', ubicacion: '' })
      setMostrarForm(false)
    }
  }

  const ordenados = [...eventos].sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora))

  const colorPunto = (i: number, total: number) => {
    if (i === 0) return SN_CELESTE
    if (i === total - 1) return TEXTO_MUTED
    return SN_AMARILLO
  }

  return (
    <div style={{ background: BG_CARD, border: `0.5px solid ${BORDE}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: 'white' }}>Cronología del viaje</p>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          style={{ background: SN_CELESTE, color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
        >
          + Agregar evento
        </button>
      </div>

      {mostrarForm && (
        <div style={{ background: BG_PAGINA, border: `1px solid ${BORDE}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: TEXTO_MUTED }}>Día</p>
              <input style={estiloInput} type="number" min="1" value={nuevo.dia} onChange={e => setNuevo({ ...nuevo, dia: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: TEXTO_MUTED }}>Fecha</p>
              <input style={estiloInput} type="date" value={nuevo.fecha} onChange={e => setNuevo({ ...nuevo, fecha: e.target.value })} />
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: TEXTO_MUTED }}>Hora</p>
              <input style={estiloInput} type="time" value={nuevo.hora} onChange={e => setNuevo({ ...nuevo, hora: e.target.value })} />
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: TEXTO_MUTED }}>Ubicación</p>
              <input style={estiloInput} placeholder="Ej: Terminal de ómnibus" value={nuevo.ubicacion} onChange={e => setNuevo({ ...nuevo, ubicacion: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: TEXTO_MUTED }}>Título *</p>
              <input style={estiloInput} placeholder="Ej: Salida desde San Juan" value={nuevo.titulo} onChange={e => setNuevo({ ...nuevo, titulo: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: TEXTO_MUTED }}>Descripción</p>
              <textarea
                style={{ ...estiloInput, height: 64, resize: 'none' }}
                placeholder="Detalles del evento..."
                value={nuevo.descripcion}
                onChange={e => setNuevo({ ...nuevo, descripcion: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAgregar}
              style={{ background: SN_CELESTE, color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              Guardar evento
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

      {ordenados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: 28, margin: '0 0 8px' }}>📅</p>
          <p style={{ fontSize: 13, color: TEXTO_MUTED, margin: 0 }}>No hay eventos cargados</p>
          <p style={{ fontSize: 11, color: TEXTO_MUTED, margin: '4px 0 0' }}>Clickeá "+ Agregar evento" para empezar</p>
        </div>
      ) : (
        <div style={{ paddingLeft: 20, position: 'relative' }}>
          {ordenados.map((ev, i) => (
            <div key={ev.id} style={{ position: 'relative', paddingBottom: 16, paddingLeft: 20 }}>
              {/* Línea vertical */}
              {i < ordenados.length - 1 && (
                <div style={{ position: 'absolute', left: -1, top: 10, bottom: 0, width: 2, background: BORDE }} />
              )}
              {/* Punto */}
              <div style={{
                position: 'absolute', left: -6, top: 4, width: 12, height: 12,
                borderRadius: '50%', background: colorPunto(i, ordenados.length),
                border: `2px solid #0B1620`
              }} />

              <div style={{ background: BG_PAGINA, border: `1px solid ${BORDE}`, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: SN_CELESTE }}>Día {ev.dia}</span>
                      {ev.fecha && <span style={{ fontSize: 11, color: TEXTO_MUTED }}>{ev.fecha}</span>}
                      {ev.hora && <span style={{ fontSize: 11, color: TEXTO_MUTED }}>· {ev.hora}</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'white' }}>{ev.titulo}</p>
                    {ev.descripcion && <p style={{ margin: '3px 0 0', fontSize: 12, color: TEXTO_MUTED }}>{ev.descripcion}</p>}
                    {ev.ubicacion && (
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: TEXTO_MUTED }}>📍 {ev.ubicacion}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onEliminarEvento(ev.id)}
                    style={{ fontSize: 11, color: '#F87171', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}