'use client'

import { useState } from 'react'

type Props = {
  pago: {
    id: string
    monto: number
    metodo_pago: string
    numero_recibo: number
    pasajeros?: {
      nombre: string
      apellido: string
      nombre_pasajero: string
    }
  }
  onConfirm: (motivo: string) => void
  onCancel: () => void
  guardando: boolean
}

export default function ModalDeshacerPago({
  pago,
  onConfirm,
  onCancel,
  guardando,
}: Props) {
  const [motivo, setMotivo] = useState('')
  const [otroMotivo, setOtroMotivo] = useState('')

  const nombreCompleto = pago.pasajeros?.nombre_pasajero || 
    `${pago.pasajeros?.nombre || ''} ${pago.pasajeros?.apellido || ''}`.trim() || 
    'Pasajero'

  const opcionesMotivo = [
    'Pago registrado por error',
    'Monto incorrecto',
    'Pasajero canceló el viaje',
    'Se realizó un reembolso',
    'Otro'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const motivoFinal = motivo === 'Otro' ? otroMotivo : motivo
    onConfirm(motivoFinal || 'Sin motivo especificado')
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* HEADER con ícono */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="text-red-600 text-xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Deshacer pago</h3>
        </div>

        <p className="text-sm text-gray-700 mb-4">
          Estás por deshacer el pago de <strong className="text-gray-900">{nombreCompleto}</strong>
        </p>

        {/* Detalle del pago - CON FONDO Y TEXTO NEGRO */}
        <div className="bg-gray-100 rounded-lg p-4 mb-4 border border-gray-300">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Detalle del pago</p>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-gray-600 font-medium">Recibo Nº:</span>
            <span className="text-gray-900 font-bold">{pago.numero_recibo || '---'}</span>
            <span className="text-gray-600 font-medium">Monto:</span>
            <span className="text-gray-900 font-bold">${pago.monto?.toLocaleString() || 0}</span>
            <span className="text-gray-600 font-medium">Método:</span>
            <span className="text-gray-900 font-medium">{pago.metodo_pago || 'No especificado'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              Motivo del deshacer <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-2.5 text-gray-900 bg-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all"
            >
              <option value="" className="text-gray-400">Seleccioná un motivo</option>
              {opcionesMotivo.map((op) => (
                <option key={op} value={op} className="text-gray-900">{op}</option>
              ))}
            </select>
          </div>

          {motivo === 'Otro' && (
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Especificá el motivo
              </label>
              <input
                type="text"
                value={otroMotivo}
                onChange={(e) => setOtroMotivo(e.target.value)}
                placeholder="Detallá el motivo..."
                className="w-full border-2 border-gray-300 rounded-lg p-2.5 text-gray-900 bg-white placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all"
                required
              />
            </div>
          )}

          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-300">
            <p className="text-xs font-semibold text-yellow-800">
              ⚠️ Al deshacer este pago:
            </p>
            <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside space-y-0.5">
              <li>Se restará el monto del pasajero</li>
              <li>El estado de pago del pasajero se actualizará</li>
              <li>Esta acción quedará registrada en el historial</li>
            </ul>
          </div>

          <div className="flex gap-2 mt-4 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border-2 border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={guardando || !motivo}
            >
              {guardando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                'Confirmar deshacer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}