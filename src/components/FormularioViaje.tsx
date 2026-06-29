'use client'

import { useState } from 'react'
import { crearViaje, actualizarViaje } from '@/app/viaje/actions'

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
    <main className="p-4 sm:p-8 max-w-md mx-auto">
      <a href={viaje?.id ? `/viaje/${viaje.id}` : '/home'} className="text-sm text-gray-500">&larr; Volver</a>
      <h1 className="text-xl font-semibold mt-2 mb-6">{viaje?.id ? 'Editar viaje' : 'Nuevo viaje'}</h1>

      <form onSubmit={handleSubmit}>
        <label className="text-sm text-gray-500 block mb-1">Destino</label>
        <input required value={destino} onChange={(e) => setDestino(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />

        <label className="text-sm text-gray-500 block mb-1">Fecha de inicio</label>
        <input required type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />

        <label className="text-sm text-gray-500 block mb-1">Fecha de fin</label>
        <input required type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />

        <label className="text-sm text-gray-500 block mb-1">Cupo total</label>
        <input required type="number" value={cupoTotal} onChange={(e) => setCupoTotal(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />

        <label className="text-sm text-gray-500 block mb-1">Precio por persona</label>
        <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />

        <label className="text-sm text-gray-500 block mb-1">Descripción / pack</label>
        <textarea value={descripcion ?? ''} onChange={(e) => setDescripcion(e.target.value)} className="w-full border rounded-lg p-2 mb-4" />

        {errorMsg && <p className="text-sm text-red-600 mb-3">{errorMsg}</p>}

        <button type="submit" disabled={guardando} className="w-full border rounded-lg p-2 bg-gray-900 text-white disabled:opacity-50">
          {guardando ? 'Guardando...' : viaje?.id ? 'Guardar cambios' : 'Crear viaje'}
        </button>
      </form>
    </main>
  )
}