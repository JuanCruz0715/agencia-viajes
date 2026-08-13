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

    // 1. Agrupar pagos por GRUPOS (grupo_id)
    const gruposMap = new Map<string, { 
      nombre: string, 
      integrantes: string[], 
      pagos: Pago[] 
    }>()

    pagos.forEach(pago => {
      const pasajero = pasajerosMap.get(pago.pasajero_id)
      if (!pasajero) return

      // Si es pago grupal, usamos el grupo_id. Si no, usamos el ID del pasajero como "grupo" individual
      const key = pago.es_pago_grupal && pago.grupo_id ? pago.grupo_id : pago.pasajero_id
      
      // Crear el grupo si no existe
      if (!gruposMap.has(key)) {
        const nombreGrupo = pago.es_pago_grupal 
          ? `${pasajero.nombre || 'Sin nombre'} y grupo`
          : `${pasajero.nombre || 'Sin nombre'} ${pasajero.apellido || ''}`
        
        gruposMap.set(key, {
          nombre: nombreGrupo,
          integrantes: [],
          pagos: []
        })
      }
      
      // Agregar el pago al grupo
      const grupo = gruposMap.get(key)!
      grupo.pagos.push(pago)
      
      // Agregar el pasajero a la lista de integrantes (sin duplicar)
      if (!grupo.integrantes.includes(pasajero.nombre || '')) {
        grupo.integrantes.push(`${pasajero.nombre || ''} ${pasajero.apellido || ''}`.trim() || 'Sin nombre')
      }
    })

    // 2. Construir las filas del Excel
    const datosExcel: any[] = []

    // Encabezados
    datosExcel.push([
      'Grupo / Pasajero',
      'Integrantes',
      'Historial de Pagos (Montos, fechas, tarjeta y cuotas)',
      'Total Pagado'
    ])

    // Procesar cada grupo/pasajero
    gruposMap.forEach((grupo, key) => {
      // Calcular el total pagado por este grupo
      const totalGrupo = grupo.pagos.reduce((sum, p) => sum + p.monto, 0)

      // Crear el string con el detalle de cada pago (¡Aquí está el cambio!)
      const detallePagos = grupo.pagos.map(p => {
        const fecha = new Date(p.created_at).toLocaleDateString('es-AR')
        const recibo = p.numero_recibo ? `#${p.numero_recibo}` : ''
        
        // ✅ Agregamos la info de tarjeta y cuotas
        let infoTarjeta = ''
        if (p.metodo_pago === 'Tarjeta' && p.tipo_tarjeta) {
          const tipoCapitalizado = p.tipo_tarjeta.charAt(0).toUpperCase() + p.tipo_tarjeta.slice(1)
          const cuotasTexto = p.cantidad_cuotas && p.cantidad_cuotas > 1 ? ` - ${p.cantidad_cuotas} cuotas` : ''
          const recargoTexto = p.recargo_aplicado && p.recargo_aplicado > 0 ? ` (Recargo: ${p.recargo_aplicado}%)` : ''
          infoTarjeta = ` [${tipoCapitalizado}${cuotasTexto}${recargoTexto}]`
        }

        return `$${p.monto.toLocaleString()} (${fecha} - ${p.metodo_pago || 'Efectivo'} ${recibo}${infoTarjeta})`
      }).join('; ')

      // Armar la fila
      datosExcel.push([
        grupo.nombre,
        grupo.integrantes.join(', '),
        detallePagos,
        `$${totalGrupo.toLocaleString()}`
      ])
    })

    // Fila final de total general
    const totalGeneral = pagos.reduce((sum, p) => sum + p.monto, 0)
    datosExcel.push([])
    datosExcel.push([
      'TOTAL GENERAL',
      '',
      '',
      `$${totalGeneral.toLocaleString()}`
    ])

    // 3. Crear libro de Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(datosExcel)

    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 30 }, // Grupo / Pasajero
      { wch: 40 }, // Integrantes
      { wch: 100 }, // Historial de Pagos (Ancho mayor para que quepa la info de tarjetas)
      { wch: 18 }, // Total Pagado
    ]

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