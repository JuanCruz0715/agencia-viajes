'use client'

import { useState } from 'react'

type Props = {
  nombrePasajero: string
  esGrupo?: boolean
  miembros?: { id: string; nombre: string; montoTotal?: number; montoPagado?: number }[]
  onConfirm: (monto: number, metodo: string, grupoId?: string) => void
  onCancel: () => void
  guardando: boolean
}

export default function ModalPago({
  nombrePasajero,
  esGrupo = false,
  miembros = [],
  onConfirm,
  onCancel,
  guardando,
}: Props) {
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState('Efectivo')
  const [distribuir, setDistribuir] = useState(true)

  // Calcular cuánto falta pagar por persona
  const calcularDeudaPorPersona = () => {
    if (!esGrupo || miembros.length === 0) return 0
    
    // Calcular el total de deuda del grupo
    const totalDeuda = miembros.reduce((sum, m) => sum + (m.montoTotal || 0), 0)
    const totalPagado = miembros.reduce((sum, m) => sum + (m.montoPagado || 0), 0)
    const deudaRestante = totalDeuda - totalPagado
    
    // Si se distribuye, dividir entre todos
    if (distribuir) {
      return Math.round(deudaRestante / miembros.length)
    }
    
    return deudaRestante
  }

  const deudaPorPersona = calcularDeudaPorPersona()

  const handleConfirm = () => {
    const montoNum = parseFloat(monto)
    if (!montoNum || montoNum <= 0) return
    
    // Si es grupo y se distribuye, el monto es por persona
    // pero el usuario ingresó el monto total que quiere pagar
    // entonces lo dividimos entre los miembros
    const montoFinal = esGrupo && distribuir && miembros.length > 0 
      ? montoNum / miembros.length 
      : montoNum
    
    onConfirm(montoFinal, metodo)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-5 w-full max-w-sm">
        <h2 className="font-medium mb-1">
          {esGrupo ? `Registrar pago grupal (${miembros.length} personas)` : 'Registrar pago'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">{nombrePasajero}</p>

        {esGrupo && miembros.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 mb-3 text-sm">
            <p className="font-medium text-blue-700">👥 Miembros del grupo:</p>
            <ul className="text-gray-600 mt-1">
              {miembros.map((m) => {
                const deuda = (m.montoTotal || 0) - (m.montoPagado || 0)
                return (
                  <li key={m.id} className="flex justify-between">
                    <span>• {m.nombre}</span>
                    <span className={deuda <= 0 ? 'text-green-600' : 'text-amber-600'}>
                      {deuda <= 0 ? '✅ Pagado' : `$${deuda.toLocaleString()} pendiente`}
                    </span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-2 text-xs text-gray-600 border-t pt-2">
              <p>Deuda total del grupo: ${((miembros.reduce((sum, m) => sum + (m.montoTotal || 0), 0) - miembros.reduce((sum, m) => sum + (m.montoPagado || 0), 0))).toLocaleString()}</p>
              {distribuir && (
                <p className="text-blue-600">Cada persona debe pagar: ${deudaPorPersona.toLocaleString()}</p>
              )}
            </div>
            <label className="flex items-center gap-2 mt-2 text-gray-700">
              <input
                type="checkbox"
                checked={distribuir}
                onChange={(e) => setDistribuir(e.target.checked)}
              />
              Distribuir el monto equitativamente entre todos
            </label>
          </div>
        )}

        <label className="text-sm text-gray-500 block mb-1">
          {esGrupo && distribuir ? 'Monto total a pagar (se dividirá)' : 'Monto a pagar'}
        </label>
        <input 
          type="number" 
          value={monto} 
          onChange={(e) => setMonto(e.target.value)} 
          placeholder="0" 
          className="w-full border rounded-lg p-2 mb-3" 
        />
        {esGrupo && distribuir && monto && (
          <p className="text-xs text-gray-500 -mt-2 mb-3">
            Cada persona pagará: ${(parseFloat(monto) / miembros.length).toFixed(2)}
          </p>
        )}

        <label className="text-sm text-gray-500 block mb-1">Método de pago</label>
        <select 
          value={metodo} 
          onChange={(e) => setMetodo(e.target.value)} 
          className="w-full border rounded-lg p-2 mb-4"
        >
          <option>Efectivo</option>
          <option>Transferencia</option>
          <option>Tarjeta</option>
          <option>Otro</option>
        </select>

        <div className="flex gap-2">
          <button 
            onClick={onCancel} 
            className="flex-1 border rounded-lg p-2"
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={guardando || !monto}
            className="flex-1 border rounded-lg p-2 bg-gray-900 text-white disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}