'use client'

import { useState } from 'react'

type Props = {
  pasajero: {
    id: string
    nombre: string | null
    apellido: string | null
    monto_pagado: number | null
    monto_total: number | null
  }
  onConfirm: (data: { motivo: string; tipoReembolso: string; montoReembolsado: number }) => void
  onCancel: () => void
  guardando: boolean
}

export default function ModalCancelarPasajero({
  pasajero,
  onConfirm,
  onCancel,
  guardando,
}: Props) {
  const [motivo, setMotivo] = useState('')
  const [tipoReembolso, setTipoReembolso] = useState('voucher')
  const [montoReembolsado, setMontoReembolsado] = useState(pasajero.monto_pagado || 0)
  const [otroMotivo, setOtroMotivo] = useState('')

  const nombreCompleto = `${pasajero.nombre || ''} ${pasajero.apellido || ''}`.trim() || 'Pasajero'
  const montoPagado = pasajero.monto_pagado || 0
  const montoTotal = pasajero.monto_total || 0

  const opcionesMotivo = [
    'Cancelación por parte del pasajero',
    'Cancelación por parte de la agencia',
    'Viaje cancelado',
    'Falta de pago',
    'Otro'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const motivoFinal = motivo === 'Otro' ? otroMotivo : motivo
    onConfirm({
      motivo: motivoFinal,
      tipoReembolso,
      montoReembolsado: tipoReembolso === 'sin_reembolso' ? 0 : montoReembolsado
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-2 text-red-600">⚠️ Cancelar pasajero</h3>
        <p className="text-sm text-gray-600 mb-4">
          Estás por cancelar a <strong>{nombreCompleto}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Motivo */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Motivo de cancelación *</label>
            <select
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full border rounded-lg p-2 text-black bg-white"
            >
              <option value="">Seleccioná un motivo</option>
              {opcionesMotivo.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          {motivo === 'Otro' && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Especificá el motivo</label>
              <input
                type="text"
                value={otroMotivo}
                onChange={(e) => setOtroMotivo(e.target.value)}
                placeholder="Detallá el motivo..."
                className="w-full border rounded-lg p-2 text-black bg-white"
                required
              />
            </div>
          )}

          {/* Tipo de reembolso */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Tipo de reembolso</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="tipoReembolso"
                  value="voucher"
                  checked={tipoReembolso === 'voucher'}
                  onChange={(e) => setTipoReembolso(e.target.value)}
                />
                <div>
                  <span className="font-medium">🎫 Voucher</span>
                  <p className="text-xs text-gray-500">El pasajero recibe un voucher por el monto pagado</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="tipoReembolso"
                  value="devolucion"
                  checked={tipoReembolso === 'devolucion'}
                  onChange={(e) => setTipoReembolso(e.target.value)}
                />
                <div>
                  <span className="font-medium">💰 Devolución de dinero</span>
                  <p className="text-xs text-gray-500">Se devuelve el dinero al pasajero</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="tipoReembolso"
                  value="sin_reembolso"
                  checked={tipoReembolso === 'sin_reembolso'}
                  onChange={(e) => setTipoReembolso(e.target.value)}
                />
                <div>
                  <span className="font-medium">❌ Sin reembolso</span>
                  <p className="text-xs text-gray-500">No se devuelve nada (cancelación sin derecho)</p>
                </div>
              </label>
            </div>
          </div>

          {/* Monto a reembolsar */}
          {tipoReembolso !== 'sin_reembolso' && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Monto a reembolsar
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  max={montoPagado}
                  value={montoReembolsado}
                  onChange={(e) => setMontoReembolsado(Number(e.target.value) || 0)}
                  className="flex-1 border rounded-lg p-2 text-black bg-white"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Monto máximo: ${montoPagado.toLocaleString()} (pagado a la fecha)
              </p>
            </div>
          )}

          {/* Resumen */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-gray-700">Resumen</p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <span className="text-gray-500">Total pagado:</span>
              <span className="font-medium">${montoPagado.toLocaleString()}</span>
              <span className="text-gray-500">Total viaje:</span>
              <span className="font-medium">${montoTotal.toLocaleString()}</span>
              {tipoReembolso !== 'sin_reembolso' && (
                <>
                  <span className="text-gray-500">Reembolso:</span>
                  <span className="font-medium text-red-600">${montoReembolsado.toLocaleString()}</span>
                </>
              )}
              {tipoReembolso === 'voucher' && (
                <span className="col-span-2 text-xs text-blue-600">🎫 Se generará un voucher por el monto reembolsado</span>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border rounded-lg p-2 hover:bg-gray-50 text-black"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-600 text-white rounded-lg p-2 hover:bg-red-700 disabled:opacity-50"
              disabled={guardando || !motivo}
            >
              {guardando ? 'Procesando...' : 'Confirmar cancelación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}