'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'

type Pasajero = {
  id: string
  nombre: string | null
  apellido: string | null
  numero_documento: string | null
  tipo_documento?: string | null
  estado_revision: string
  genero_pasajero?: string | null
  nacionalidad?: string | null
  edad?: number | null
  es_menor_3?: boolean | null
  es_menor_18?: boolean | null
}

type Props = {
  pasajeros: Pasajero[]
  viajeNombre: string
}

export default function BotonExportarCNRT({ pasajeros, viajeNombre }: Props) {
  const [exportando, setExportando] = useState(false)

  const exportarCNRT = () => {
    setExportando(true)
    try {
      const datosCNRT = pasajeros.map((p) => ({
        'Apellido': p.apellido || '',
        'Nombre': p.nombre || '',
        'Tipo Doc': p.tipo_documento || 'DNI',
        'Sexo': p.genero_pasajero || 'No especificado',
        'Menor 18': p.es_menor_18 ? 'Sí' : 'No',
        'Ocupa Butaca': p.es_menor_3 ? 'No' : 'Sí',
        'Nacionalidad': p.nacionalidad || 'Argentina',
        'Tripulante': 'No',
        'Estado': p.estado_revision === 'aprobado' ? 'Confirmado' : 'Pendiente',
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(datosCNRT)

      ws['!cols'] = [
        { wch: 20 }, // Apellido
        { wch: 20 }, // Nombre
        { wch: 12 }, // Tipo Doc
        { wch: 12 }, // Sexo
        { wch: 10 }, // Menor 18
        { wch: 14 }, // Ocupa Butaca
        { wch: 15 }, // Nacionalidad
        { wch: 12 }, // Tripulante
        { wch: 12 }, // Estado
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'CNRT')
      XLSX.writeFile(wb, `CNRT_${viajeNombre}_${new Date().toLocaleDateString()}.xlsx`)
    } catch (error) {
      console.error('Error al exportar CNRT:', error)
      alert('Error al exportar el archivo CNRT')
    }
    setExportando(false)
  }

  if (pasajeros.length === 0) return null

  return (
    <button
      onClick={exportarCNRT}
      disabled={exportando}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {exportando ? 'Exportando...' : '📋 Exportar CNRT'}
    </button>
  )
}