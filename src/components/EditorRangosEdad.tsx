// src/components/EditorRangosEdad.tsx
'use client'

import { useState } from 'react'

type RangoEdad = {
  id: string
  edad_min: number
  edad_max: number
  precio: number
  descripcion: string
}

type Props = {
  rangos: RangoEdad[]
  onChange: (rangos: RangoEdad[]) => void
  error?: string
}

const RANGOS_POR_DEFECTO: RangoEdad[] = [
  { id: '1', edad_min: 0, edad_max: 2, precio: 0, descripcion: 'Bebé (sin butaca)' },
  { id: '2', edad_min: 3, edad_max: 10, precio: 15000, descripcion: 'Niño' },
  { id: '3', edad_min: 11, edad_max: 17, precio: 25000, descripcion: 'Adolescente' },
  { id: '4', edad_min: 18, edad_max: 60, precio: 35000, descripcion: 'Adulto' },
  { id: '5', edad_min: 61, edad_max: 99, precio: 30000, descripcion: 'Jubilado' },
]

export default function EditorRangosEdad({ rangos, onChange, error }: Props) {
  const [editandoRangos, setEditandoRangos] = useState<RangoEdad[]>(() => {
    if (rangos && rangos.length > 0) {
      return rangos
    }
    return RANGOS_POR_DEFECTO
  })

  const agregarRango = () => {
    const ultimoRango = editandoRangos[editandoRangos.length - 1]
    const nuevoRango: RangoEdad = {
      id: crypto.randomUUID(),
      edad_min: ultimoRango ? ultimoRango.edad_max + 1 : 0,
      edad_max: ultimoRango ? ultimoRango.edad_max + 10 : 10,
      precio: 0,
      descripcion: 'Nuevo rango'
    }
    const nuevosRangos = [...editandoRangos, nuevoRango]
    setEditandoRangos(nuevosRangos)
    onChange(nuevosRangos)
  }

  const eliminarRango = (id: string) => {
    if (editandoRangos.length <= 1) {
      alert('Debe haber al menos un rango de edad')
      return
    }
    const nuevosRangos = editandoRangos.filter(r => r.id !== id)
    setEditandoRangos(nuevosRangos)
    onChange(nuevosRangos)
  }

  // ✅ CORREGIDO: Tipos específicos en lugar de any
  const actualizarRango = (
    id: string, 
    campo: keyof RangoEdad, 
    valor: string | number
  ) => {
    const nuevosRangos = editandoRangos.map(r => {
      if (r.id === id) {
        let nuevoValor: string | number = valor
        
        // Si es un campo numérico, convertir a número
        if (campo === 'precio' || campo === 'edad_min' || campo === 'edad_max') {
          nuevoValor = typeof valor === 'string' ? parseInt(valor) || 0 : valor
        }
        
        return { ...r, [campo]: nuevoValor }
      }
      return r
    })
    setEditandoRangos(nuevosRangos)
    onChange(nuevosRangos)
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <label className="text-sm font-medium text-gray-300">
            🧒 Precios por edades
          </label>
          <p className="text-xs text-gray-500">Define rangos de edad y el precio para cada uno</p>
          <p className="text-xs text-blue-400 mt-0.5">💡 El sistema calculará automáticamente el precio según la edad del pasajero</p>
        </div>
        <button
          onClick={agregarRango}
          className="text-xs bg-blue-600 px-3 py-1.5 rounded text-white hover:bg-blue-700 transition-colors"
          type="button"
        >
          + Agregar rango
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {editandoRangos.map((rango) => (
          <div key={rango.id} className="flex gap-2 items-center bg-gray-800/50 p-2 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="w-16">
              <label className="text-[10px] text-gray-500 block">Edad min</label>
              <input
                type="number"
                value={rango.edad_min}
                onChange={(e) => actualizarRango(rango.id, 'edad_min', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-white text-xs text-center"
                min="0"
              />
            </div>
            
            <span className="text-gray-400 text-xs mt-4">-</span>
            
            <div className="w-16">
              <label className="text-[10px] text-gray-500 block">Edad max</label>
              <input
                type="number"
                value={rango.edad_max}
                onChange={(e) => actualizarRango(rango.id, 'edad_max', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-white text-xs text-center"
                min="0"
              />
            </div>
            
            <div className="flex-1 min-w-20">
              <label className="text-[10px] text-gray-500 block">Descripción</label>
              <input
                type="text"
                value={rango.descripcion}
                onChange={(e) => actualizarRango(rango.id, 'descripcion', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                placeholder="Ej: Adulto"
              />
            </div>
            
            <div className="w-24">
              <label className="text-[10px] text-gray-500 block">Precio</label>
              <input
                type="number"
                value={rango.precio}
                onChange={(e) => actualizarRango(rango.id, 'precio', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs text-right"
                placeholder="$0"
                min="0"
                step="100"
              />
            </div>
            
            <button
              onClick={() => eliminarRango(rango.id)}
              className="text-red-400 hover:text-red-300 px-1.5 py-1 rounded hover:bg-red-500/10 transition-colors mt-4"
              type="button"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gray-800/30 rounded-lg p-2 border border-gray-700 flex justify-between items-center">
        <p className="text-xs text-gray-400">
          Total: <span className="text-white font-medium">{editandoRangos.length}</span> rangos configurados
        </p>
        <p className="text-xs text-green-400">
          ✅ Precios calculados automáticamente
        </p>
      </div>
    </div>
  )
}