'use client'

import { useState } from 'react'
import Link from 'next/link'
import { crearViaje, actualizarViaje } from '@/app/viaje/actions'

const SN_AZUL = '#1B3A5C'
const SN_CELESTE = '#2D9CB8'
const SN_AMARILLO = '#F2B632'
const BG_PAGINA = '#0B1620'
const BG_CARD = '#15212C'
const BORDE_CARD = '#22303C'
const TEXTO_MUTED = '#9FB3C2'

const estiloInput: React.CSSProperties = {
  width: '100%',
  background: BG_PAGINA,
  border: `1px solid ${BORDE_CARD}`,
  borderRadius: '8px',
  padding: '8px 12px',
  marginBottom: '14px',
  color: 'white',
}

type ViajeData = {
  id?: string
  destino: string
  fecha_inicio: string
  fecha_fin: string
  cupo_total: number
  descripcion: string | null
  precio: number | null
}

export default function FormularioViaje({ viaje }: { viaje?: ViajeData }) {
  const [destino, setDestino] = useState(viaje?.destino ?? '')
  const [fechaInicio, setFechaInicio] = useState(viaje?.fecha_inicio ?? '')
  const [fechaFin, setFechaFin] = useState(viaje?.fecha_fin ?? '')
  const [cupoTotal, setCupoTotal] = useState(viaje?.cupo_total?.toString() ?? '')
  const [descripcion, setDescripcion] = useState(viaje?.descripcion ?? '')
  const [precio, setPrecio] = useState(viaje?.precio?.toString() ?? '')
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    setGuardando(true)

    const datos = {
      destino,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      cupo_total: parseInt(cupoTotal),
      descripcion: descripcion || null,
      precio: precio ? parseFloat(precio) : null,
    }

    const resultado = viaje?.id
      ? await actualizarViaje(viaje.id, datos)
      : await crearViaje(datos)

    setGuardando(false)
    if (resultado?.error) {
      setErrorMsg(resultado.error)
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: BG_PAGINA }}>
      <div className="max-w-md mx-auto">
        <Link href={viaje?.id ? `/viaje/${viaje.id}` : '/home'} className="text-sm font-medium" style={{ color: SN_CELESTE }}>
          &larr; Volver
        </Link>

        <div className="rounded-lg p-5 mt-4" style={{ background: BG_CARD, border: `1px solid ${BORDE_CARD}` }}>
          <h1 className="text-xl font-semibold mb-6" style={{ color: 'white' }}>
            {viaje?.id ? 'Editar viaje' : 'Nuevo viaje'}
          </h1>

          <form onSubmit={handleSubmit}>
            <label className="text-sm block mb-1" style={{ color: TEXTO_MUTED }}>Destino</label>
            <input required value={destino} onChange={(e) => setDestino(e.target.value)} style={estiloInput} />

            <label className="text-sm block mb-1" style={{ color: TEXTO_MUTED }}>Fecha de inicio</label>
            <input required type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={estiloInput} />

            <label className="text-sm block mb-1" style={{ color: TEXTO_MUTED }}>Fecha de fin</label>
            <input required type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} style={estiloInput} />

            <label className="text-sm block mb-1" style={{ color: TEXTO_MUTED }}>Cupo total</label>
            <input required type="number" value={cupoTotal} onChange={(e) => setCupoTotal(e.target.value)} style={estiloInput} />

            <label className="text-sm block mb-1" style={{ color: TEXTO_MUTED }}>Precio por persona</label>
            <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} style={estiloInput} />

            <label className="text-sm block mb-1" style={{ color: TEXTO_MUTED }}>Descripción / pack</label>
            <textarea
              value={descripcion ?? ''}
              onChange={(e) => setDescripcion(e.target.value)}
              style={{ ...estiloInput, minHeight: '90px', resize: 'vertical' }}
            />

            {errorMsg && <p className="text-sm mb-3" style={{ color: '#F09595' }}>{errorMsg}</p>}

            <button
              type="submit"
              disabled={guardando}
              className="w-full rounded-lg p-2 font-medium border-none disabled:opacity-50"
              style={{ background: SN_AMARILLO, color: SN_AZUL }}
            >
              {guardando ? 'Guardando...' : viaje?.id ? 'Guardar cambios' : 'Crear viaje'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}