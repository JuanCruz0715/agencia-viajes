'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const SN_AZUL = '#1B3A5C'
const SN_CELESTE = '#2D9CB8'

const EMPRESA = {
  nombre: 'SN Viajes y Turismo',
  legajo: '17096',
  provincia: 'San Juan',
  pais: 'Argentina',
}

type Pago = {
  id: string
  pasajero_id: string
  viaje_id: string
  monto: number
  metodo_pago: string
  tipo_tarjeta?: string
  cantidad_cuotas?: number
  recargo_aplicado?: number
  monto_original?: number
  monto_final?: number
  created_at: string
  numero_recibo: number
  es_pago_grupal: boolean
  grupo_id: string | null
  pasajeros?: {
    id: string
    nombre: string
    apellido: string
    nombre_pasajero: string
    numero_documento: string
    monto_total: number
    monto_pagado: number
    estado_pago: string
    grupo_id: string | null
    es_titular: boolean
  }
  viajes?: {
    destino: string
    fecha_inicio: string
    fecha_fin: string
  }
}

export default function ReciboPage() {
  const params = useParams()
  const [pago, setPago] = useState<Pago | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saldoPendiente, setSaldoPendiente] = useState(0)
  const [totalPagadoGrupo, setTotalPagadoGrupo] = useState(0)
  const [totalDeudaGrupo, setTotalDeudaGrupo] = useState(0)

  useEffect(() => {
    const cargarPago = async () => {
      const supabase = createClient()
      
      // Obtener el pago
      const { data: pagoData, error: pagoError } = await supabase
        .from('pagos')
        .select('*')
        .eq('id', params.id)
        .single()

      if (pagoError) {
        setError(pagoError.message)
        setCargando(false)
        return
      }

      // Obtener el pasajero
      const { data: pasajeroData, error: pasajeroError } = await supabase
        .from('pasajeros')
        .select('id, nombre, apellido, nombre_pasajero, numero_documento, monto_total, monto_pagado, estado_pago, grupo_id, es_titular')
        .eq('id', pagoData.pasajero_id)
        .single()

      if (pasajeroError) {
        setError(pasajeroError.message)
        setCargando(false)
        return
      }

      // Obtener el viaje
      const { data: viajeData, error: viajeError } = await supabase
        .from('viajes')
        .select('destino, fecha_inicio, fecha_fin')
        .eq('id', pagoData.viaje_id)
        .single()

      // Calcular saldo pendiente
      let saldo = 0
      let totalPagado = 0
      let totalDeuda = 0

      // Si es pago grupal, calcular saldo del grupo completo
      if (pagoData.es_pago_grupal && pagoData.grupo_id) {
        const { data: miembros } = await supabase
          .from('pasajeros')
          .select('monto_pagado, monto_total')
          .eq('grupo_id', pagoData.grupo_id)

        if (miembros && miembros.length > 0) {
          totalDeuda = miembros.reduce((sum, m) => sum + (m.monto_total || 0), 0)
          totalPagado = miembros.reduce((sum, m) => sum + (m.monto_pagado || 0), 0)
          saldo = Math.max(0, totalDeuda - totalPagado)
        }
      } else {
        // Pago individual
        totalDeuda = pasajeroData.monto_total || 0
        totalPagado = pasajeroData.monto_pagado || 0
        saldo = Math.max(0, totalDeuda - totalPagado)
      }

      setSaldoPendiente(saldo)
      setTotalPagadoGrupo(totalPagado)
      setTotalDeudaGrupo(totalDeuda)

      setPago({
        ...pagoData,
        pasajeros: pasajeroData,
        viajes: viajeData || undefined
      })
      
      setCargando(false)
    }

    cargarPago()
  }, [params.id])

  const handleImprimir = () => {
    window.print()
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#F5F8FA' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: SN_CELESTE }}></div>
          <p className="mt-4 text-gray-500">Cargando recibo...</p>
        </div>
      </div>
    )
  }

  if (error || !pago) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#F5F8FA' }}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-xl font-semibold text-gray-800">Recibo no encontrado</h1>
          <p className="text-gray-500 mt-2">El recibo que buscas no existe o fue eliminado.</p>
        </div>
      </div>
    )
  }

  const metodoPago = pago.metodo_pago || 'No especificado'
  const esTarjeta = metodoPago === 'Tarjeta'
  const tipoTarjeta = pago.tipo_tarjeta || ''
  const cantidadCuotas = pago.cantidad_cuotas || 1
  const recargoAplicado = pago.recargo_aplicado || 0
  const recargoPorcentaje = Math.round(recargoAplicado * 100)
  const montoOriginal = pago.monto_original || pago.monto
  const montoFinal = pago.monto_final || pago.monto

  let detallePago = ''
  if (esTarjeta) {
    if (tipoTarjeta === 'debito') {
      detallePago = 'Tarjeta de Débito - Pago único'
    } else if (tipoTarjeta === 'credito') {
      if (cantidadCuotas === 1) {
        detallePago = 'Tarjeta de Crédito - Pago único'
      } else {
        detallePago = `Tarjeta de Crédito - ${cantidadCuotas} cuotas`
        if (recargoAplicado > 0) {
          detallePago += ` (${recargoPorcentaje}% recargo)`
        }
      }
    }
  } else {
    detallePago = metodoPago
  }

  const nombreCompleto = pago.pasajeros?.nombre_pasajero || 
    `${pago.pasajeros?.nombre || ''} ${pago.pasajeros?.apellido || ''}`.trim() || 
    'No disponible'

  const estaPagado = saldoPendiente <= 0

  // Determinar si es grupo
  const esGrupo = pago.es_pago_grupal && pago.grupo_id

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#F5F8FA' }}>
      {/* Botón imprimir */}
      <div className="max-w-2xl mx-auto mb-4 flex justify-end print:hidden">
        <button
          onClick={handleImprimir}
          className="px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2"
          style={{ background: SN_AZUL }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir / Guardar como PDF
        </button>
      </div>

      {/* RECIBO */}
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 print:shadow-none">
        {/* Logo y título */}
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: SN_CELESTE }}>
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16">
              <Image
                src="/logo-sn.png"
                alt="SN Viajes y Turismo"
                fill
                className="object-contain"
                sizes="64px"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: SN_AZUL }}>{EMPRESA.nombre}</h1>
              <p className="text-xs" style={{ color: SN_CELESTE }}>Legajo: {EMPRESA.legajo}</p>
              <p className="text-xs text-gray-500">{EMPRESA.provincia}, {EMPRESA.pais}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Recibo de pago</p>
            <p className="text-sm font-bold" style={{ color: SN_AZUL }}>Nº {pago.numero_recibo || '---'}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(pago.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Datos del pasajero */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Pasajero</p>
            <p className="text-sm font-medium" style={{ color: SN_AZUL }}>{nombreCompleto}</p>
            {esGrupo && (
              <p className="text-xs text-blue-600">👥 Pago grupal</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">Documento</p>
            <p className="text-sm font-medium" style={{ color: SN_AZUL }}>{pago.pasajeros?.numero_documento || 'No disponible'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Viaje</p>
            <p className="text-sm font-medium" style={{ color: SN_AZUL }}>{pago.viajes?.destino || 'No disponible'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Fechas</p>
            <p className="text-sm font-medium" style={{ color: SN_AZUL }}>
              {pago.viajes?.fecha_inicio || ''} a {pago.viajes?.fecha_fin || ''}
            </p>
          </div>
        </div>

        {/* Detalle del pago */}
        <div className="mt-6 border-t pt-4" style={{ borderColor: '#E5E7EB' }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Monto abonado ahora</p>
              <p className="text-lg font-bold" style={{ color: SN_AZUL }}>
                ${montoFinal.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total pagado a la fecha</p>
              <p className="text-lg font-bold" style={{ color: SN_CELESTE }}>
                ${(pago.pasajeros?.monto_pagado || 0).toLocaleString()}
              </p>
              {esGrupo && (
                <p className="text-xs text-gray-400">(Total grupo: ${totalPagadoGrupo.toLocaleString()})</p>
              )}
            </div>
          </div>
        </div>

        {/* Detalle de cuotas y recargo (si aplica) */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Método de pago</p>
            <p className="text-sm font-medium" style={{ color: SN_AZUL }}>{detallePago}</p>
          </div>
          {esTarjeta && tipoTarjeta === 'credito' && cantidadCuotas > 1 && (
            <div>
              <p className="text-xs text-gray-500">Recargo aplicado</p>
              <p className="text-sm font-medium" style={{ color: '#854F0B' }}>
                {recargoPorcentaje}% (${(recargoAplicado * montoOriginal).toFixed(2)})
              </p>
            </div>
          )}
        </div>

        {/* Detalle adicional de cuotas */}
        {esTarjeta && tipoTarjeta === 'credito' && cantidadCuotas > 1 && (
          <div className="mt-2 p-3 rounded-lg" style={{ background: '#F0F8FA' }}>
            <p className="text-xs text-gray-500">Detalle de cuotas</p>
            <p className="text-sm font-medium" style={{ color: SN_AZUL }}>
              {cantidadCuotas} cuota{cantidadCuotas > 1 ? 's' : ''} de ${(montoFinal / cantidadCuotas).toFixed(2)}
              {recargoAplicado > 0 && (
                <span className="text-xs text-gray-500 block">
                  Monto original: ${montoOriginal.toFixed(2)} + recargo {recargoPorcentaje}% = ${montoFinal.toFixed(2)}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Saldo pendiente - CORREGIDO */}
        <div className="mt-4 border-t pt-4" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: SN_AZUL }}>
              {esGrupo ? 'Saldo pendiente del grupo' : 'Saldo pendiente'}
            </span>
            <span 
              className="text-sm font-bold"
              style={{ 
                color: saldoPendiente > 0 ? '#854F0B' : '#3B6D11'
              }}
            >
              {saldoPendiente > 0 ? `$${saldoPendiente.toLocaleString()}` : '$0 - ¡Pagado! ✅'}
            </span>
          </div>
          {saldoPendiente > 0 && (
            <div className="mt-1 text-xs text-amber-600">
              ⚠️ {esGrupo ? 'El grupo aún debe' : 'El pasajero aún debe'} ${saldoPendiente.toLocaleString()}
            </div>
          )}
          {esGrupo && (
            <div className="mt-1 text-xs text-gray-400">
              Deuda total del grupo: ${totalDeudaGrupo.toLocaleString()} · Pagado: ${totalPagadoGrupo.toLocaleString()}
            </div>
          )}
        </div>

        {/* Pie de página */}
        <div className="mt-6 text-center text-xs border-t pt-4" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-gray-500">{EMPRESA.nombre} - Legajo {EMPRESA.legajo}</p>
          <p className="text-gray-500">{EMPRESA.provincia}, {EMPRESA.pais}</p>
          <p className="text-gray-400 mt-1">Este recibo es un comprobante de pago válido.</p>
          <p className="text-gray-400">Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}