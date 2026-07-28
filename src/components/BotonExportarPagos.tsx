// src/components/BotonExportarPagos.tsx
'use client'

import * as XLSX from 'xlsx'

type Pago = {
  id: string
  pasajero_id: string
  viaje_id: string
  monto: number
  metodo_pago: string
  numero_recibo: number
  created_at: string
  tipo_tarjeta?: string
  cantidad_cuotas?: number
  recargo_aplicado?: number
  monto_original?: number
  monto_final?: number
  es_pago_grupal?: boolean
  grupo_id?: string
  notas?: string
}

type Pasajero = {
  id: string
  nombre: string | null
  apellido: string | null
  grupo_id: string | null
  es_titular: boolean
}

type Props = {
  pagos: Pago[]
  pasajeros: Pasajero[]
  viajeNombre: string
}

// ✅ Definir el tipo para las filas del Excel
type FilaExcel = {
  'Grupo/Pasajero': string | number
  'Integrantes': string | number
  'Monto': string | number
  'Método de pago': string
  'Recibo N°': string
  'Fecha': string
  'Tipo de tarjeta': string
  'Cuotas': string | number
  'Recargo': string
  'Notas': string
  'Tipo de pago': string
}

export default function BotonExportarPagos({ pagos, pasajeros, viajeNombre }: Props) {
  
  const exportarExcel = () => {
    if (!pagos || pagos.length === 0) {
      alert('No hay pagos para exportar')
      return
    }

    // Crear un mapa de pasajeros para buscar rápido
    const pasajerosMap = new Map<string, Pasajero>()
    pasajeros.forEach(p => {
      pasajerosMap.set(p.id, p)
    })

    // Agrupar pagos por grupo
    const grupos: Record<string, { 
      nombre: string, 
      integrantes: string[], 
      pagos: Pago[] 
    }> = {}

    pagos.forEach(pago => {
      const pasajero = pasajerosMap.get(pago.pasajero_id)
      if (!pasajero) return

      const grupoId = pago.grupo_id || pago.pasajero_id
      
      if (!grupos[grupoId]) {
        const nombreGrupo = pago.es_pago_grupal 
          ? `${pasajero.nombre || 'Sin nombre'} y grupo`
          : `${pasajero.nombre || 'Sin nombre'} ${pasajero.apellido || ''}`
        
        grupos[grupoId] = {
          nombre: nombreGrupo,
          integrantes: [],
          pagos: []
        }
      }
      
      grupos[grupoId].pagos.push(pago)
      
      if (pasajero && !grupos[grupoId].integrantes.includes(pasajero.id)) {
        grupos[grupoId].integrantes.push(pasajero.id)
      }
    })

    // ✅ Usar el tipo definido
    const datosExcel: FilaExcel[] = []

    // Agregar header con información del viaje
    datosExcel.push({
      'Grupo/Pasajero': 'Viaje',
      'Integrantes': viajeNombre,
      'Monto': '',
      'Método de pago': '',
      'Recibo N°': '',
      'Fecha': new Date().toLocaleDateString('es-AR'),
      'Tipo de tarjeta': '',
      'Cuotas': '',
      'Recargo': '',
      'Notas': `Total pagos: ${pagos.length}`,
      'Tipo de pago': `Total: $${pagos.reduce((sum, p) => sum + p.monto, 0).toLocaleString()}`
    })
    datosExcel.push({
      'Grupo/Pasajero': '',
      'Integrantes': '',
      'Monto': '',
      'Método de pago': '',
      'Recibo N°': '',
      'Fecha': '',
      'Tipo de tarjeta': '',
      'Cuotas': '',
      'Recargo': '',
      'Notas': '',
      'Tipo de pago': ''
    })

    // Headers de la tabla
    datosExcel.push({
      'Grupo/Pasajero': 'Grupo/Pasajero',
      'Integrantes': 'Integrantes',
      'Monto': 'Monto',
      'Método de pago': 'Método de pago',
      'Recibo N°': 'Recibo N°',
      'Fecha': 'Fecha',
      'Tipo de tarjeta': 'Tipo de tarjeta',
      'Cuotas': 'Cuotas',
      'Recargo': 'Recargo',
      'Notas': 'Notas',
      'Tipo de pago': 'Tipo de pago'
    })

    // Datos de cada grupo
    Object.values(grupos).forEach(grupo => {
      grupo.pagos.forEach((pago, index) => {
        datosExcel.push({
          'Grupo/Pasajero': index === 0 ? grupo.nombre : '',
          'Integrantes': index === 0 ? grupo.integrantes.length : '',
          'Monto': pago.monto,
          'Método de pago': pago.metodo_pago || 'No especificado',
          'Recibo N°': pago.numero_recibo?.toString() || '---',
          'Fecha': new Date(pago.created_at).toLocaleDateString('es-AR'),
          'Tipo de tarjeta': pago.tipo_tarjeta || '-',
          'Cuotas': pago.cantidad_cuotas || '-',
          'Recargo': pago.recargo_aplicado ? `$${pago.recargo_aplicado}` : '-',
          'Notas': pago.notas || '-',
          'Tipo de pago': pago.es_pago_grupal ? 'Grupal' : 'Individual'
        })
      })

      // Fila con total del grupo
      datosExcel.push({
        'Grupo/Pasajero': '',
        'Integrantes': '',
        'Monto': '',
        'Método de pago': '',
        'Recibo N°': '',
        'Fecha': '',
        'Tipo de tarjeta': '',
        'Cuotas': '',
        'Recargo': '',
        'Notas': '',
        'Tipo de pago': ''
      })
    })

    // Agregar fila de total general
    datosExcel.push({
      'Grupo/Pasajero': '',
      'Integrantes': '',
      'Monto': '',
      'Método de pago': '',
      'Recibo N°': '',
      'Fecha': '',
      'Tipo de tarjeta': '',
      'Cuotas': '',
      'Recargo': '',
      'Notas': '',
      'Tipo de pago': ''
    })
    datosExcel.push({
      'Grupo/Pasajero': 'TOTAL GENERAL',
      'Integrantes': '',
      'Monto': `$${pagos.reduce((sum, p) => sum + p.monto, 0).toLocaleString()}`,
      'Método de pago': '',
      'Recibo N°': '',
      'Fecha': '',
      'Tipo de tarjeta': '',
      'Cuotas': '',
      'Recargo': '',
      'Notas': '',
      'Tipo de pago': ''
    })

    // Crear libro de Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(datosExcel)

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 30 }, // Grupo/Pasajero
      { wch: 12 }, // Integrantes
      { wch: 15 }, // Monto
      { wch: 18 }, // Método de pago
      { wch: 12 }, // Recibo N°
      { wch: 15 }, // Fecha
      { wch: 15 }, // Tipo de tarjeta
      { wch: 10 }, // Cuotas
      { wch: 12 }, // Recargo
      { wch: 25 }, // Notas
      { wch: 15 }, // Tipo de pago
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Pagos')
    
    // Generar archivo
    const fileName = `Pagos_${viajeNombre}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  return (
    <button
      onClick={exportarExcel}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg"
      style={{ 
        background: '#10B981', 
        color: 'white',
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' 
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Exportar pagos
    </button>
  )
}