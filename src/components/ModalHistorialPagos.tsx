'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Pago = {
  id: string
  monto: number
  metodo_pago: string
  tipo_tarjeta?: string
  cantidad_cuotas?: number
  recargo_aplicado?: number
  monto_original?: number
  monto_final?: number
  numero_recibo: number
  created_at: string
  es_pago_grupal: boolean
  grupo_id: string | null
  eliminado: boolean
}

type Props = {
  pasajeroId: string
  nombrePasajero: string
  onClose: () => void
}

export default function ModalHistorialPagos({ pasajeroId, nombrePasajero, onClose }: Props) {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarPagos = async () => {
      setCargando(true)
      const supabase = createClient()

      // Obtener todos los pagos del pasajero (no eliminados)
      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .eq('pasajero_id', pasajeroId)
        .eq('eliminado', false)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
        setCargando(false)
        return
      }

      setPagos(data || [])
      setCargando(false)
    }

    cargarPagos()
  }, [pasajeroId])

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Obtener método de pago con detalles
  const getMetodoPagoTexto = (pago: Pago) => {
    let texto = pago.metodo_pago

    if (pago.metodo_pago === 'Tarjeta') {
      const tipo = pago.tipo_tarjeta === 'debito' ? 'Débito' : 'Crédito'
      texto = `${tipo}`
      if (pago.cantidad_cuotas && pago.cantidad_cuotas > 1) {
        texto += ` - ${pago.cantidad_cuotas} cuotas`
        if (pago.recargo_aplicado && pago.recargo_aplicado > 0) {
          texto += ` (${Math.round(pago.recargo_aplicado * 100)}% recargo)`
        }
      } else if (pago.tipo_tarjeta === 'debito') {
        texto += ' - Pago único'
      }
    }

    return texto
  }

  // Calcular totales
  const totalPagado = pagos.reduce((sum, p) => sum + (p.monto_final || p.monto || 0), 0)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b pb-4 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900">📋 Historial de pagos</h3>
            <p className="text-sm text-gray-500">{nombrePasajero}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* RESUMEN */}
        <div className="grid grid-cols-3 gap-3 py-3 border-b flex-shrink-0">
          <div className="text-center">
            <p className="text-xs text-gray-500">Total pagos</p>
            <p className="text-lg font-bold text-gray-900">{pagos.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Total abonado</p>
            <p className="text-lg font-bold text-blue-600">${totalPagado.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Último pago</p>
            <p className="text-lg font-bold text-gray-900">
              {pagos.length > 0 ? formatearFecha(pagos[0].created_at) : '—'}
            </p>
          </div>
        </div>

        {/* LISTA DE PAGOS */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {cargando ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error al cargar los pagos</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : pagos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">💳</p>
              <p>No hay pagos registrados</p>
            </div>
          ) : (
            pagos.map((pago) => (
              <div
                key={pago.id}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-sm font-bold">$</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        ${(pago.monto_final || pago.monto || 0).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{getMetodoPagoTexto(pago)}</span>
                        {pago.es_pago_grupal && (
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                            Grupal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{formatearFecha(pago.created_at)}</p>
                    <a
                      href={`/recibo/${pago.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Recibo N°{pago.numero_recibo}
                    </a>
                  </div>
                </div>
                {pago.tipo_tarjeta === 'credito' && pago.cantidad_cuotas && pago.cantidad_cuotas > 1 && (
                  <div className="mt-1 text-xs text-gray-400">
                    {pago.cantidad_cuotas} cuotas de ${((pago.monto_final || pago.monto || 0) / pago.cantidad_cuotas).toFixed(2)}
                    {pago.recargo_aplicado && pago.recargo_aplicado > 0 && (
                      <span className="ml-1 text-amber-600">
                        ({Math.round(pago.recargo_aplicado * 100)}% recargo)
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* BOTON CERRAR */}
        <div className="border-t pt-4 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}