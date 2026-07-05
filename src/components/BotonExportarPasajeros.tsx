'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'

const SN_AZUL = '#1B3A5C'
const SN_CELESTE = '#2D9CB8'
const SN_AMARILLO = '#F2B632'

type Pasajero = {
  id: string
  nombre: string | null
  apellido: string | null
  nombre_pasajero: string | null
  numero_documento: string | null
  tipo_documento?: string | null
  estado_revision: string
  estado_pago: string
  monto_pagado: number | null
  monto_total: number | null
  grupo_id: string | null
  es_titular: boolean
  parentesco_con_titular?: string | null
  email_pasajero?: string | null
  telefono_pasajero?: string | null
  fecha_nacimiento?: string | null
  genero_pasajero?: string | null
  nacionalidad?: string | null
  contacto_emergencia_nombre?: string | null
  contacto_emergencia_telefono?: string | null
  contacto_emergencia_parentesco?: string | null
  enfermedad?: string | null
  alergia?: string | null
  dieta_especial?: string | null
  sugerencias?: string | null
  edad?: number | null
  es_menor_3?: boolean | null
  es_menor_18?: boolean | null
  vendedor?: string | null
  iniciales_vendedor?: string | null
}

type Props = {
  pasajeros: Pasajero[]
  viajeNombre: string
}

export default function BotonExportarPasajeros({ pasajeros, viajeNombre }: Props) {
  const [exportando, setExportando] = useState(false)

  const agruparYNumerarFamilias = (lista: Pasajero[]) => {
    const grupos: Record<string, Pasajero[]> = {}
    const individuales: Pasajero[] = []
    
    lista.forEach((p) => {
      if (p.grupo_id) {
        if (!grupos[p.grupo_id]) grupos[p.grupo_id] = []
        grupos[p.grupo_id].push(p)
      } else {
        individuales.push(p)
      }
    })
    
    const resultado: (Pasajero & { numeroFamilia: string })[] = []
    let contador = 1
    
    Object.values(grupos).forEach((miembros) => {
      const titular = miembros.find((m) => m.es_titular)
      const resto = miembros.filter((m) => !m.es_titular)
      const ordenados = titular ? [titular, ...resto] : miembros
      
      ordenados.forEach((p) => {
        resultado.push({
          ...p,
          numeroFamilia: `F${contador}`
        })
      })
      contador++
    })
    
    individuales.forEach((p) => {
      resultado.push({
        ...p,
        numeroFamilia: 'Individual'
      })
    })
    
    return resultado
  }

  const exportarExcel = () => {
    setExportando(true)
    try {
      const pasajerosConFamilia = agruparYNumerarFamilias(pasajeros)
      
      const datos = pasajerosConFamilia.map((p) => ({
        'N° Familia': p.numeroFamilia,
        'Nombre': p.nombre || '',
        'Apellido': p.apellido || '',
        'Nombre Completo': p.nombre_pasajero || `${p.nombre || ''} ${p.apellido || ''}`.trim(),
        'Documento': p.numero_documento || '',
        'Tipo Doc': p.tipo_documento || 'DNI',
        'Email': p.email_pasajero || '',
        'Teléfono': p.telefono_pasajero || '',
        'Fecha Nac.': p.fecha_nacimiento || '',
        'Edad': p.edad !== null && p.edad !== undefined ? p.edad : '',
        'Menor 3 años': p.es_menor_3 ? '✅ Sí (sin butaca)' : 'No',
        'Menor 18 años': p.es_menor_18 ? '✅ Sí' : 'No',
        'Género': p.genero_pasajero || '',
        'Nacionalidad': p.nacionalidad || '',
        'Parentesco': p.es_titular ? 'TITULAR' : (p.parentesco_con_titular || 'Acompañante'),
        'Vendedor': p.vendedor || '',
        'Iniciales': p.iniciales_vendedor || '',
        'Contacto Emergencia': p.contacto_emergencia_nombre || '',
        'Tel. Emergencia': p.contacto_emergencia_telefono || '',
        'Parentesco Emergencia': p.contacto_emergencia_parentesco || '',
        'Enfermedad': p.enfermedad || '',
        'Alergia': p.alergia || '',
        'Dieta Especial': p.dieta_especial || '',
        'Sugerencias': p.sugerencias || '',
        'Estado': p.estado_revision === 'aprobado' ? 'Confirmado' : 'Pendiente',
        'Pago': p.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente',
        'Monto Pagado': p.monto_pagado || 0,
        'Monto Total': p.monto_total || 0,
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(datos)

      ws['!cols'] = [
        { wch: 12 }, // N° Familia
        { wch: 20 }, // Nombre
        { wch: 20 }, // Apellido
        { wch: 25 }, // Nombre Completo
        { wch: 15 }, // Documento
        { wch: 10 }, // Tipo Doc
        { wch: 30 }, // Email
        { wch: 15 }, // Teléfono
        { wch: 15 }, // Fecha Nac.
        { wch: 8 },  // Edad
        { wch: 18 }, // Menor 3 años
        { wch: 15 }, // Menor 18 años
        { wch: 12 }, // Género
        { wch: 15 }, // Nacionalidad
        { wch: 15 }, // Parentesco
        { wch: 20 }, // Vendedor
        { wch: 12 }, // Iniciales
        { wch: 25 }, // Contacto Emergencia
        { wch: 15 }, // Tel. Emergencia
        { wch: 15 }, // Parentesco Emergencia
        { wch: 20 }, // Enfermedad
        { wch: 20 }, // Alergia
        { wch: 20 }, // Dieta Especial
        { wch: 30 }, // Sugerencias
        { wch: 12 }, // Estado
        { wch: 12 }, // Pago
        { wch: 14 }, // Monto Pagado
        { wch: 14 }, // Monto Total
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Pasajeros')
      XLSX.writeFile(wb, `Pasajeros_${viajeNombre}_${new Date().toLocaleDateString()}.xlsx`)
    } catch (error) {
      console.error('Error al exportar:', error)
      alert('Error al exportar el archivo')
    }
    setExportando(false)
  }

  if (pasajeros.length === 0) return null

  return (
    <button
      onClick={exportarExcel}
      disabled={exportando}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg"
      style={{ 
        background: '#0F7B3A', 
        color: 'white',
        boxShadow: '0 2px 8px rgba(15, 123, 58, 0.3)'
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
      {exportando ? 'Exportando...' : 'Excel'}
    </button>
  )
}