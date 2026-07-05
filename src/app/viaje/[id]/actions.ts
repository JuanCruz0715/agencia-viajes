'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================
// TIPOS
// ============================================

type PasajeroResumen = {
  id: string
  nombre: string | null
  apellido: string | null
  nombre_pasajero: string | null
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

type UpdatePasajero = {
  estado_revision: string
  iniciales_vendedor?: string
  vendedor?: string
}

// ============================================
// FUNCIÓN PARA OBTENER PRÓXIMO NÚMERO DE RECIBO
// ============================================

async function obtenerProximoNumeroRecibo() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .rpc('obtener_proximo_numero_recibo')
    .single()

  if (error) {
    console.error('Error al obtener número de recibo:', error)
    const { data: config, error: configError } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'ultimo_numero_recibo')
      .single()
    
    if (configError) {
      return Math.floor(Date.now() / 1000)
    }
    
    const nuevoNumero = (config?.valor || 0) + 1
    
    await supabase
      .from('configuracion')
      .update({ valor: nuevoNumero, updated_at: new Date().toISOString() })
      .eq('clave', 'ultimo_numero_recibo')
    
    return nuevoNumero
  }

  return data
}

// ============================================
// APROBAR PASAJERO - CON INICIALES
// ============================================

export async function aprobarPasajero(
  pasajeroId: string, 
  viajeId: string,
  iniciales?: string
) {
  const supabase = await createClient()

  const updateData: UpdatePasajero = { estado_revision: 'aprobado' }
  if (iniciales) {
    updateData.iniciales_vendedor = iniciales.toUpperCase()
    updateData.vendedor = iniciales.toUpperCase()
  }

  const { error } = await supabase
    .from('pasajeros')
    .update(updateData)
    .eq('id', pasajeroId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/viaje/${viajeId}`)
  return { error: null }
}

// ============================================
// APROBAR GRUPO - CON INICIALES (TODOS LOS MIEMBROS)
// ============================================

export async function aprobarGrupo(
  grupoId: string, 
  viajeId: string,
  iniciales?: string
) {
  const supabase = await createClient()

  const updateData: UpdatePasajero = { estado_revision: 'aprobado' }
  if (iniciales) {
    updateData.iniciales_vendedor = iniciales.toUpperCase()
    updateData.vendedor = iniciales.toUpperCase()
  }

  const { error } = await supabase
    .from('pasajeros')
    .update(updateData)
    .eq('grupo_id', grupoId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/viaje/${viajeId}`)
  return { error: null }
}

// ============================================
// REGISTRAR PAGO - CON NÚMERO DE RECIBO SECUENCIAL
// ============================================

export async function registrarPago(
  pasajeroId: string, 
  monto: number, 
  metodoPago: string, 
  viajeId: string,
  esPagoGrupal: boolean = false,
  grupoId?: string,
  tipoTarjeta?: string,
  cantidadCuotas?: number,
  recargoAplicado?: number
) {
  const supabase = await createClient()

  const montoOriginal = monto
  const montoConRecargo = recargoAplicado ? monto * (1 + recargoAplicado) : monto
  const montoParaPasajero = monto

  const numeroRecibo = await obtenerProximoNumeroRecibo()

  // ============================================
  // PAGO GRUPAL
  // ============================================
  if (esPagoGrupal && grupoId) {
    const { data: miembros, error: errorMiembros } = await supabase
      .from('pasajeros')
      .select('id, monto_pagado, monto_total, nombre, apellido, nombre_pasajero, es_titular')
      .eq('grupo_id', grupoId)

    if (errorMiembros || !miembros || miembros.length === 0) {
      return { error: 'No se encontraron miembros del grupo', pagoId: null, pagoIds: [] }
    }

    const titular = miembros.find(m => m.es_titular) || miembros[0]
    const pagoIds: string[] = []

    const nuevoMontoTitular = (titular.monto_pagado ?? 0) + montoParaPasajero
    const totalDeudaTitular = titular.monto_total ?? 0
    const estadoTitular = nuevoMontoTitular >= totalDeudaTitular ? 'pagado' : 'pendiente'

    const { error: errorTitular } = await supabase
      .from('pasajeros')
      .update({ 
        monto_pagado: nuevoMontoTitular, 
        estado_pago: estadoTitular 
      })
      .eq('id', titular.id)

    if (errorTitular) {
      return { error: errorTitular.message, pagoId: null, pagoIds: [] }
    }

    const { data: pagoTitular, error: errorPagoTitular } = await supabase
      .from('pagos')
      .insert({ 
        pasajero_id: titular.id, 
        viaje_id: viajeId, 
        monto: montoConRecargo,
        metodo_pago: metodoPago,
        tipo_tarjeta: tipoTarjeta || null,
        cantidad_cuotas: cantidadCuotas || 1,
        recargo_aplicado: recargoAplicado || 0,
        monto_original: montoOriginal,
        monto_final: montoConRecargo,
        es_pago_grupal: true,
        grupo_id: grupoId,
        numero_recibo: numeroRecibo
      })
      .select('id')
      .single()

    if (errorPagoTitular) {
      return { error: errorPagoTitular.message, pagoId: null, pagoIds: [] }
    }
    pagoIds.push(pagoTitular.id)

    for (const acompanante of miembros) {
      if (acompanante.id === titular.id) continue
      
      const totalAcompanante = acompanante.monto_total || 0
      const estadoAcompanante = totalAcompanante > 0 ? 'pagado' : 'pendiente'

      await supabase
        .from('pasajeros')
        .update({ 
          estado_pago: estadoAcompanante
        })
        .eq('id', acompanante.id)
    }

    revalidatePath(`/viaje/${viajeId}`)
    return { error: null, pagoId: pagoTitular.id, pagoIds }
  }

  // ============================================
  // PAGO INDIVIDUAL
  // ============================================
  const { data: pasajero } = await supabase
    .from('pasajeros')
    .select('monto_pagado, monto_total')
    .eq('id', pasajeroId)
    .single()

  if (!pasajero) {
    return { error: 'No se encontró el pasajero', pagoId: null, pagoIds: [] }
  }

  const nuevoMonto = (pasajero.monto_pagado ?? 0) + montoParaPasajero
  const totalDeuda = pasajero.monto_total ?? 0
  const nuevoEstado = nuevoMonto >= totalDeuda ? 'pagado' : 'pendiente'

  const { error: errorUpdate } = await supabase
    .from('pasajeros')
    .update({ 
      monto_pagado: nuevoMonto, 
      estado_pago: nuevoEstado 
    })
    .eq('id', pasajeroId)

  if (errorUpdate) {
    return { error: errorUpdate.message, pagoId: null, pagoIds: [] }
  }

  const { data: pago, error: errorPago } = await supabase
    .from('pagos')
    .insert({ 
      pasajero_id: pasajeroId, 
      viaje_id: viajeId, 
      monto: montoConRecargo,
      metodo_pago: metodoPago,
      tipo_tarjeta: tipoTarjeta || null,
      cantidad_cuotas: cantidadCuotas || 1,
      recargo_aplicado: recargoAplicado || 0,
      monto_original: montoOriginal,
      monto_final: montoConRecargo,
      es_pago_grupal: false,
      grupo_id: null,
      numero_recibo: numeroRecibo
    })
    .select('id')
    .single()

  if (errorPago) {
    return { error: errorPago.message, pagoId: null, pagoIds: [] }
  }

  revalidatePath(`/viaje/${viajeId}`)
  return { error: null, pagoId: pago.id, pagoIds: [pago.id] }
}

// ============================================
// CANCELAR PASAJERO
// ============================================

export async function cancelarPasajero(
  pasajeroId: string,
  viajeId: string,
  data: {
    motivo: string
    tipoReembolso: string
    montoReembolsado: number
  }
) {
  const supabase = await createClient()

  const { data: pasajero, error: errorPasajero } = await supabase
    .from('pasajeros')
    .select('nombre, apellido, nombre_pasajero, monto_pagado, monto_total, grupo_id, es_titular')
    .eq('id', pasajeroId)
    .single()

  if (errorPasajero) {
    return { error: errorPasajero.message, cancelacionId: null }
  }

  if (pasajero.es_titular && pasajero.grupo_id) {
    const { data: miembros, error: errorMiembros } = await supabase
      .from('pasajeros')
      .select('id, nombre, apellido, nombre_pasajero, monto_pagado, monto_total')
      .eq('grupo_id', pasajero.grupo_id)

    if (errorMiembros) {
      return { error: errorMiembros.message, cancelacionId: null }
    }

    let cancelacionId: string | null = null

    for (const miembro of miembros) {
      const { data: cancelacion, error: errorCancelacion } = await supabase
        .from('cancelaciones')
        .insert({
          pasajero_id: miembro.id,
          viaje_id: viajeId,
          nombre_pasajero: miembro.nombre_pasajero || `${miembro.nombre || ''} ${miembro.apellido || ''}`.trim(),
          monto_total: miembro.monto_total || 0,
          monto_pagado: miembro.monto_pagado || 0,
          tipo_reembolso: data.tipoReembolso,
          monto_reembolsado: data.montoReembolsado,
          motivo: data.motivo,
          fecha_cancelacion: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (errorCancelacion) {
        return { error: errorCancelacion.message, cancelacionId: null }
      }

      if (!cancelacionId) cancelacionId = cancelacion.id

      await supabase
        .from('pasajeros')
        .update({
          estado: 'cancelado',
          motivo_cancelacion: data.motivo,
          tipo_reembolso: data.tipoReembolso,
          monto_reembolsado: data.montoReembolsado,
          fecha_cancelacion: new Date().toISOString(),
        })
        .eq('id', miembro.id)
    }

    revalidatePath(`/viaje/${viajeId}`)
    return { error: null, cancelacionId }
  }

  const { data: cancelacion, error: errorCancelacion } = await supabase
    .from('cancelaciones')
    .insert({
      pasajero_id: pasajeroId,
      viaje_id: viajeId,
      nombre_pasajero: pasajero.nombre_pasajero || `${pasajero.nombre || ''} ${pasajero.apellido || ''}`.trim(),
      monto_total: pasajero.monto_total || 0,
      monto_pagado: pasajero.monto_pagado || 0,
      tipo_reembolso: data.tipoReembolso,
      monto_reembolsado: data.montoReembolsado,
      motivo: data.motivo,
      fecha_cancelacion: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (errorCancelacion) {
    return { error: errorCancelacion.message, cancelacionId: null }
  }

  const { error: errorUpdate } = await supabase
    .from('pasajeros')
    .update({
      estado: 'cancelado',
      motivo_cancelacion: data.motivo,
      tipo_reembolso: data.tipoReembolso,
      monto_reembolsado: data.montoReembolsado,
      fecha_cancelacion: new Date().toISOString(),
    })
    .eq('id', pasajeroId)

  if (errorUpdate) {
    return { error: errorUpdate.message, cancelacionId: null }
  }

  revalidatePath(`/viaje/${viajeId}`)
  return { error: null, cancelacionId: cancelacion.id }
}

// ============================================
// DESHACER PAGO
// ============================================

export async function deshacerPago(
  pagoId: string,
  motivo: string
) {
  const supabase = await createClient()

  const { data: pago, error: errorPago } = await supabase
    .from('pagos')
    .select('*, pasajero_id, monto, metodo_pago, numero_recibo, viaje_id, es_pago_grupal, grupo_id')
    .eq('id', pagoId)
    .eq('eliminado', false)
    .single()

  if (errorPago || !pago) {
    return { error: 'No se encontró el pago o ya fue eliminado' }
  }

  const { data: pasajero, error: errorPasajero } = await supabase
    .from('pasajeros')
    .select('monto_pagado, monto_total')
    .eq('id', pago.pasajero_id)
    .single()

  if (errorPasajero || !pasajero) {
    return { error: 'No se encontró el pasajero' }
  }

  const nuevoMonto = Math.max(0, (pasajero.monto_pagado || 0) - pago.monto)
  const totalDeuda = pasajero.monto_total || 0
  const nuevoEstado = nuevoMonto >= totalDeuda ? 'pagado' : 'pendiente'

  const { error: errorUpdate } = await supabase
    .from('pasajeros')
    .update({ 
      monto_pagado: nuevoMonto, 
      estado_pago: nuevoEstado 
    })
    .eq('id', pago.pasajero_id)

  if (errorUpdate) {
    return { error: errorUpdate.message }
  }

  const { error: errorEliminar } = await supabase
    .from('pagos')
    .update({
      eliminado: true,
      fecha_eliminacion: new Date().toISOString(),
      motivo_eliminacion: motivo,
    })
    .eq('id', pagoId)

  if (errorEliminar) {
    return { error: errorEliminar.message }
  }

  if (pago.es_pago_grupal && pago.grupo_id) {
    const { data: titular } = await supabase
      .from('pasajeros')
      .select('monto_pagado, monto_total')
      .eq('grupo_id', pago.grupo_id)
      .eq('es_titular', true)
      .single()

    if (titular) {
      const grupoCompleto = (titular.monto_pagado || 0) >= (titular.monto_total || 0)
      
      await supabase
        .from('pasajeros')
        .update({ estado_pago: grupoCompleto ? 'pagado' : 'pendiente' })
        .eq('grupo_id', pago.grupo_id)
        .neq('es_titular', true)
    }
  }

  revalidatePath(`/viaje/${pago.viaje_id}`)
  return { error: null }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

export async function obtenerMiembrosGrupo(grupoId: string) {
  const supabase = await createClient()
  
  const { data: miembros, error } = await supabase
    .from('pasajeros')
    .select('id, nombre, apellido, nombre_pasajero, monto_pagado, monto_total, estado_pago')
    .eq('grupo_id', grupoId)

  if (error) {
    return { error: error.message, miembros: null }
  }

  return { error: null, miembros }
}

export async function obtenerResumenPagos(viajeId: string) {
  const supabase = await createClient()

  const { data: pasajeros, error } = await supabase
    .from('pasajeros')
    .select('id, nombre, apellido, nombre_pasajero, monto_pagado, monto_total, estado_pago, grupo_id, es_titular')
    .eq('viaje_id', viajeId)

  if (error) {
    return { error: error.message, resumen: null }
  }

  if (!pasajeros || pasajeros.length === 0) {
    return { error: null, resumen: { grupos: [], individuales: [] } }
  }

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

export async function obtenerPagosGrupo(grupoId: string, viajeId: string) {
  const supabase = await createClient()
  
  const { data: pagos, error } = await supabase
    .from('pagos')
    .select('*, pasajeros(nombre, apellido, nombre_pasajero, monto_total)')
    .eq('grupo_id', grupoId)
    .eq('viaje_id', viajeId)

  if (error) {
    return { error: error.message, pagos: null }
  }

  return { error: null, pagos }
}

export async function obtenerDetallePago(pagoId: string) {
  const supabase = await createClient()
  
  const { data: pago, error } = await supabase
    .from('pagos')
    .select('*, pasajeros(nombre, apellido, nombre_pasajero, numero_documento, monto_total, monto_pagado, viaje_id)')
    .eq('id', pagoId)
    .single()

  if (error) {
    return { error: error.message, pago: null }
  }

  return { error: null, pago }
}

export async function obtenerDetalleCancelacion(cancelacionId: string) {
  const supabase = await createClient()
  
  const { data: cancelacion, error } = await supabase
    .from('cancelaciones')
    .select('*, pasajeros(nombre, apellido, nombre_pasajero, numero_documento), viajes(destino, fecha_inicio, fecha_fin)')
    .eq('id', cancelacionId)
    .single()

  if (error) {
    return { error: error.message, cancelacion: null }
  }

  return { error: null, cancelacion }
}