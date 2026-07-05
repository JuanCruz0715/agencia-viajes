'use client'

import { useState } from 'react'
import { deshacerPago } from '@/app/viaje/[id]/actions'

type Props = {
  pagoId: string
  monto: number
  metodoPago: string
  numeroRecibo: number
  pasajeroNombre: string
  onDeshacer?: () => void
}

export default function BotonDeshacerPago({
  pagoId,
  monto,
  metodoPago,
  numeroRecibo,
  pasajeroNombre,
  onDeshacer,
}: Props) {
  const [mostrarModal, setMostrarModal] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [otroMotivo, setOtroMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)

  const opcionesMotivo = [
    'Pago registrado por error',
    'Monto incorrecto',
    'Pasajero canceló el viaje',
    'Se realizó un reembolso',
    'Otro'
  ]

  const handleConfirmar = async (e: React.FormEvent) => {
    e.preventDefault()
    const motivoFinal = motivo === 'Otro' ? otroMotivo : motivo
    if (!motivoFinal) return

    setGuardando(true)
    const resultado = await deshacerPago(pagoId, motivoFinal)
    setGuardando(false)

    if (resultado.error) {
      alert('Error al deshacer el pago: ' + resultado.error)
    } else {
      setMostrarModal(false)
      if (onDeshacer) onDeshacer()
    }
  }

  return (
    <>
      <button
        onClick={() => setMostrarModal(true)}
        className="text-xs px-2 py-0.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
      >
        Deshacer
      </button>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2 text-red-600">⚠️ Deshacer pago</h3>
            <p className="text-sm text-gray-600 mb-4">
              Estás por deshacer el pago de <strong>{pasajeroNombre}</strong>
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-500">Recibo Nº:</span>
                <span className="font-medium">{numeroRecibo}</span>
                <span className="text-gray-500">Monto:</span>
                <span className="font-medium">${monto.toLocaleString()}</span>
                <span className="text-gray-500">Método:</span>
                <span className="font-medium">{metodoPago}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmar} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Motivo del deshacer *
                </label>
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
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Especificá el motivo
                  </label>
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

              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <p className="text-xs text-yellow-800">⚠️ Esta acción no se puede deshacer</p>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
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
                  {guardando ? 'Procesando...' : 'Confirmar deshacer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}