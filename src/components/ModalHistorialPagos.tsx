'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Pago = {
  id: string
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

type Props = {
  pasajeroId: string
  nombrePasajero: string
  onClose: () => void
  onEditarPago?: (pago: Pago) => void
  onPagoEliminado?: () => void
}

export default function ModalHistorialPagos({
  pasajeroId,
  nombrePasajero,
  onClose,
  onEditarPago,
  onPagoEliminado,
}: Props) {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [cargando, setCargando] = useState(true)
  const [eliminando, setEliminando] = useState<string | null>(null)

  // ✅ Cargar pagos - con IIFE (función auto-ejecutable)
  useEffect(() => {
    let isMounted = true

    const cargarPagos = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('pagos')
          .select('*')
          .eq('pasajero_id', pasajeroId)
          .eq('eliminado', false)
          .order('created_at', { ascending: false })

        if (!error && data && isMounted) {
          setPagos(data)
        }
      } catch (error) {
        console.error('Error al cargar pagos:', error)
      } finally {
        if (isMounted) {
          setCargando(false)
        }
      }
    }

    cargarPagos()

    return () => {
      isMounted = false
    }
  }, [pasajeroId])

  // ✅ Función para recargar pagos (se usa después de eliminar)
  const recargarPagos = async () => {
    setCargando(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .eq('pasajero_id', pasajeroId)
        .eq('eliminado', false)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setPagos(data)
      }
    } catch (error) {
      console.error('Error al recargar pagos:', error)
    } finally {
      setCargando(false)
    }
  }

  const totalPagado = pagos.reduce((sum, p) => sum + (p.monto || 0), 0)

  // ✅ Función para abrir el recibo
  const abrirRecibo = (pagoId: string) => {
    if (pagoId) {
      window.open(`/recibo/${pagoId}`, '_blank')
    } else {
      alert('Este pago no tiene un recibo asociado')
    }
  }

  // ✅ Función para ELIMINAR el pago
  const eliminarPago = async (pago: Pago) => {
    if (!confirm(`¿Eliminar este pago de $${pago.monto.toLocaleString()}?\n\nEl pasajero quedará con el monto actualizado.`)) {
      return
    }

    setEliminando(pago.id)
    const supabase = createClient()

    try {
      // 1. Eliminar el pago (soft delete)
      const { error: errorPago } = await supabase
        .from('pagos')
        .update({
          eliminado: true,
          fecha_eliminacion: new Date().toISOString(),
          motivo_eliminacion: 'Eliminado por usuario'
        })
        .eq('id', pago.id)

      if (errorPago) throw errorPago

      // 2. Recalcular monto_pagado del pasajero
      const { data: pagosRestantes } = await supabase
        .from('pagos')
        .select('monto')
        .eq('pasajero_id', pasajeroId)
        .eq('eliminado', false)

      const nuevoMontoPagado = pagosRestantes?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0

      const { data: pasajero } = await supabase
        .from('pasajeros')
        .select('monto_total')
        .eq('id', pasajeroId)
        .single()

      const estaPagado = nuevoMontoPagado >= (pasajero?.monto_total || 0)

      await supabase
        .from('pasajeros')
        .update({
          monto_pagado: nuevoMontoPagado,
          estado_pago: estaPagado ? 'pagado' : 'pendiente'
        })
        .eq('id', pasajeroId)

      // 3. Recargar la lista de pagos
      await recargarPagos()
      
      // 4. Notificar al padre
      if (onPagoEliminado) onPagoEliminado()

      alert('✅ Pago eliminado correctamente')

    } catch (error) {
      console.error('Error al eliminar pago:', error)
      alert('❌ Error al eliminar el pago')
    } finally {
      setEliminando(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-700">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">📋 Historial de pagos</h3>
            <p className="text-sm text-gray-400">{nombrePasajero}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Resumen */}
        <div className="bg-gray-800/50 rounded-lg p-3 mb-4 border border-gray-700">
          <p className="text-sm text-gray-400">Total pagado</p>
          <p className="text-2xl font-bold text-green-400">${totalPagado.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{pagos.length} {pagos.length === 1 ? 'pago registrado' : 'pagos registrados'}</p>
        </div>

        {/* Lista de pagos */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {cargando ? (
            <div className="text-center py-8 text-gray-400">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent" />
              <p className="mt-2">Cargando pagos...</p>
            </div>
          ) : pagos.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">💰</p>
              <p>No hay pagos registrados</p>
            </div>
          ) : (
            pagos.map((pago) => (
              <div
                key={pago.id}
                className="bg-gray-800/30 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">
                        ${pago.monto.toLocaleString()}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                        {pago.metodo_pago || 'No especificado'}
                      </span>
                      {pago.tipo_tarjeta && (
                        <span className="text-xs text-gray-400">
                          {pago.tipo_tarjeta} {pago.cantidad_cuotas ? `· ${pago.cantidad_cuotas} cuotas` : ''}
                        </span>
                      )}
                      {pago.recargo_aplicado && pago.recargo_aplicado > 0 && (
                        <span className="text-xs text-yellow-400">
                          +${pago.recargo_aplicado} recargo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>📅 {new Date(pago.created_at).toLocaleDateString('es-AR')}</span>
                      <span>🎫 Nº {pago.numero_recibo || '---'}</span>
                      {pago.notas && (
                        <span className="text-yellow-400">📝 {pago.notas}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* ✅ Botones de acción */}
                  <div className="flex gap-1 flex-shrink-0">
                    {/* Botón Ver Recibo */}
                    {pago.numero_recibo && (
                      <button
                        onClick={() => abrirRecibo(pago.id)}
                        className="text-green-400 hover:text-green-300 text-xs px-2 py-1 rounded hover:bg-green-500/10 transition-colors"
                        title="Ver recibo"
                      >
                        📄 Recibo
                      </button>
                    )}
                    
                    {/* Botón Editar Pago */}
                    {onEditarPago && (
                      <button
                        onClick={() => onEditarPago(pago)}
                        className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded hover:bg-blue-500/10 transition-colors"
                        title="Editar pago"
                      >
                        ✏️ Editar
                      </button>
                    )}

                    {/* ✅ Botón Eliminar Pago */}
                    <button
                      onClick={() => eliminarPago(pago)}
                      disabled={eliminando === pago.id}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Eliminar pago"
                    >
                      {eliminando === pago.id ? (
                        <span className="inline-block animate-spin h-3 w-3 border-2 border-red-400 border-t-transparent rounded-full" />
                      ) : (
                        '🗑️'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}