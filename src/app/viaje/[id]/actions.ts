'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================
// TIPOS
// ============================================

type PasajeroResumen = {
  id: string
  nombre_pasajero: string
  monto_pagado: number | null
  monto_total: number | null
  estado_pago: string
  grupo_id: string | null
  es_titular: boolean
}

type GrupoResumen = {
  grupo_id: string
  miembros: PasajeroResumen[]
  total_pagado: number
  total_deuda: number
}

type ResumenPagos = {
  grupos: GrupoResumen[]
  individuales: PasajeroResumen[]
}

// ============================================
// FUNCIONES
// ============================================

export async function aprobarPasajero(pasajeroId: string, viajeId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('pasajeros')
    .update({ estado_revision: 'aprobado' })
    .eq('id', pasajeroId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/viaje/${viajeId}`)
  return { error: null }
}

export async function aprobarGrupo(grupoId: string, viajeId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('pasajeros')
    .update({ estado_revision: 'aprobado' })
    .eq('grupo_id', grupoId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/viaje/${viajeId}`)
  return { error: null }
}

export async function registrarPago(
  pasajeroId: string, 
  monto: number, 
  metodoPago: string, 
  viajeId: string,
  esPagoGrupal: boolean = false,
  grupoId?: string
) {
  const supabase = await createClient()

  // Si es pago grupal y tenemos grupoId
  if (esPagoGrupal && grupoId) {
    // Obtener todos los miembros del grupo
    const { data: miembros, error: errorMiembros } = await supabase
      .from('pasajeros')
      .select('id, monto_pagado, monto_total, nombre_pasajero')
      .eq('grupo_id', grupoId)

    if (errorMiembros || !miembros || miembros.length === 0) {
      return { error: 'No se encontraron miembros del grupo', pagoId: null, pagoIds: [] }
    }

    const pagoIds: string[] = []
    let errorGeneral = null

    // Procesar cada miembro del grupo
    for (const miembro of miembros) {
      const nuevoMonto = (miembro.monto_pagado ?? 0) + monto
      const totalDeuda = miembro.monto_total ?? 0
      const nuevoEstado = nuevoMonto >= totalDeuda ? 'pagado' : 'pendiente'

      // Actualizar el monto pagado del miembro
      const { error: errorUpdate } = await supabase
        .from('pasajeros')
        .update({ 
          monto_pagado: nuevoMonto, 
          estado_pago: nuevoEstado 
        })
        .eq('id', miembro.id)

      if (errorUpdate) {
        errorGeneral = errorUpdate.message
        continue
      }

      // Registrar el pago individual (sin las columnas que no existen)
      const { data: pago, error: errorPago } = await supabase
        .from('pagos')
        .insert({ 
          pasajero_id: miembro.id, 
          viaje_id: viajeId, 
          monto, 
          metodo_pago: metodoPago
          // NOTA: No incluyo es_pago_grupal ni grupo_id porque no existen en tu tabla
        })
        .select('id')
        .single()

      if (errorPago) {
        errorGeneral = errorPago.message
        continue
      }
      
      pagoIds.push(pago.id)
    }

    if (errorGeneral && pagoIds.length === 0) {
      return { error: errorGeneral, pagoId: null, pagoIds: [] }
    }

    revalidatePath(`/viaje/${viajeId}`)
    return { error: null, pagoId: pagoIds[0], pagoIds: pagoIds }
  }

  // Pago individual
  const { data: pasajero } = await supabase
    .from('pasajeros')
    .select('monto_pagado, monto_total')
    .eq('id', pasajeroId)
    .single()

  if (!pasajero) {
    return { error: 'No se encontró el pasajero', pagoId: null, pagoIds: [] }
  }

  const nuevoMonto = (pasajero.monto_pagado ?? 0) + monto
  const totalDeuda = pasajero.monto_total ?? 0
  const nuevoEstado = nuevoMonto >= totalDeuda ? 'pagado' : 'pendiente'

  const { error: errorUpdate } = await supabase
    .from('pasajeros')
    .update({ monto_pagado: nuevoMonto, estado_pago: nuevoEstado })
    .eq('id', pasajeroId)

  if (errorUpdate) {
    return { error: errorUpdate.message, pagoId: null, pagoIds: [] }
  }

  const { data: pago, error: errorPago } = await supabase
    .from('pagos')
    .insert({ 
      pasajero_id: pasajeroId, 
      viaje_id: viajeId, 
      monto, 
      metodo_pago: metodoPago
    })
    .select('id')
    .single()

  if (errorPago) {
    return { error: errorPago.message, pagoId: null, pagoIds: [] }
  }

  revalidatePath(`/viaje/${viajeId}`)
  return { error: null, pagoId: pago.id, pagoIds: [pago.id] }
}

// Función auxiliar para obtener los miembros de un grupo
export async function obtenerMiembrosGrupo(grupoId: string) {
  const supabase = await createClient()
  
  const { data: miembros, error } = await supabase
    .from('pasajeros')
    .select('id, nombre_pasajero, monto_pagado, monto_total, estado_pago')
    .eq('grupo_id', grupoId)

  if (error) {
    return { error: error.message, miembros: null }
  }

  return { error: null, miembros }
}

// Función para obtener el resumen de pagos de un viaje
export async function obtenerResumenPagos(viajeId: string) {
  const supabase = await createClient()

  const { data: pasajeros, error } = await supabase
    .from('pasajeros')
    .select('id, nombre_pasajero, monto_pagado, monto_total, estado_pago, grupo_id, es_titular')
    .eq('viaje_id', viajeId)

  if (error) {
    return { error: error.message, resumen: null }
  }

  if (!pasajeros || pasajeros.length === 0) {
    return { error: null, resumen: { grupos: [], individuales: [] } }
  }

  // Agrupar por grupo familiar
  const gruposMap = new Map<string, GrupoResumen>()
  const individuales: PasajeroResumen[] = []

  pasajeros.forEach((p) => {
    if (p.grupo_id) {
      if (!gruposMap.has(p.grupo_id)) {
        gruposMap.set(p.grupo_id, {
          grupo_id: p.grupo_id,
          miembros: [],
          total_pagado: 0,
          total_deuda: 0
        })
      }
      const grupo = gruposMap.get(p.grupo_id)!
      grupo.miembros.push(p)
      grupo.total_pagado += (p.monto_pagado || 0)
      grupo.total_deuda += (p.monto_total || 0)
    } else {
      individuales.push(p)
    }
  })

  const grupos = Array.from(gruposMap.values())

  const resumen: ResumenPagos = {
    grupos,
    individuales
  }

  return {
    error: null,
    resumen
  }
}

// Función para obtener los pagos de un grupo (para recibo grupal)
export async function obtenerPagosGrupo(grupoId: string, viajeId: string) {
  const supabase = await createClient()
  
  const { data: pagos, error } = await supabase
    .from('pagos')
    .select('*, pasajeros(nombre_pasajero, monto_total)')
    .eq('grupo_id', grupoId)
    .eq('viaje_id', viajeId)

  if (error) {
    return { error: error.message, pagos: null }
  }

  return { error: null, pagos }
}