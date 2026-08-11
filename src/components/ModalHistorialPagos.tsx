'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
// ✅ IMPORTAMOS EL NUEVO BOTÓN
import BotonDeshacerPago from '@/components/BotonDeshacerPago'

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

  // ✅ Cargar pagos
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

  // ✅ Función para recargar pagos después de eliminar
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

                    {/* ✅ NUEVO COMPONENTE: Botón Deshacer Pago */}
                    <BotonDeshacerPago
                      pagoId={pago.id}
                      monto={pago.monto || 0}
                      metodoPago={pago.metodo_pago || 'No especificado'}
                      numeroRecibo={pago.numero_recibo || 0}
                      pasajeroNombre={nombrePasajero}
                      onDeshacer={() => {
                        // Recargar los pagos y notificar al padre
                        recargarPagos()
                        if (onPagoEliminado) onPagoEliminado()
                      }}
                    />
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