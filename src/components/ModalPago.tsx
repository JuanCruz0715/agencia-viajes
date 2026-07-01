'use client'

import { useState } from 'react'

type Props = {
  nombrePasajero: string
  esGrupo?: boolean
  miembros?: { id: string; nombre: string; montoTotal?: number; montoPagado?: number }[]
  onConfirm: (monto: number, metodo: string, tipoTarjeta?: string, cuotas?: number, recargo?: number) => void
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
  
  // Estados para tarjeta
  const [tipoTarjeta, setTipoTarjeta] = useState<'debito' | 'credito'>('debito')
  const [cantidadCuotas, setCantidadCuotas] = useState(1)
  const [recargoPersonalizado, setRecargoPersonalizado] = useState<number>(0)
  const [mostrarDetalleCuotas, setMostrarDetalleCuotas] = useState(false)

  const calcularDeudaPorPersona = () => {
    if (!esGrupo || miembros.length === 0) return 0
    
    const totalDeuda = miembros.reduce((sum, m) => sum + (m.montoTotal || 0), 0)
    const totalPagado = miembros.reduce((sum, m) => sum + (m.montoPagado || 0), 0)
    const deudaRestante = totalDeuda - totalPagado
    
    if (distribuir) {
      return Math.round(deudaRestante / miembros.length)
    }
    
    return deudaRestante
  }

  const deudaPorPersona = calcularDeudaPorPersona()

  const esTarjeta = metodo === 'Tarjeta'
  const esCredito = esTarjeta && tipoTarjeta === 'credito'

  const montoNum = parseFloat(monto) || 0
  const recargoDecimal = recargoPersonalizado / 100
  const montoConRecargo = montoNum * (1 + recargoDecimal)
  const recargoEnPesos = montoConRecargo - montoNum

  const handleConfirm = () => {
    const montoNum = parseFloat(monto)
    if (!montoNum || montoNum <= 0) return
    
    const montoFinal = esGrupo && distribuir && miembros.length > 0 
      ? montoNum / miembros.length 
      : montoNum
    
    let tipoTarjetaFinal: string | undefined = undefined
    let cuotasFinal = 1
    let recargoFinal = 0
    
    if (metodo === 'Tarjeta') {
      tipoTarjetaFinal = tipoTarjeta
      cuotasFinal = cantidadCuotas
      recargoFinal = recargoDecimal
    }
    
    onConfirm(montoFinal, metodo, tipoTarjetaFinal, cuotasFinal, recargoFinal)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <h2 className="font-medium mb-1 text-black">
          {esGrupo ? `Registrar pago grupal (${miembros.length} personas)` : 'Registrar pago'}
        </h2>
        <p className="text-sm text-gray-600 mb-4">{nombrePasajero}</p>

        {esGrupo && miembros.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 mb-3 text-sm">
            <p className="font-medium text-blue-700">👥 Miembros del grupo:</p>
            <ul className="text-gray-700 mt-1">
              {miembros.map((m) => {
                const deuda = (m.montoTotal || 0) - (m.montoPagado || 0)
                return (
                  <li key={m.id} className="flex justify-between">
                    <span className="text-black">• {m.nombre}</span>
                    <span className={deuda <= 0 ? 'text-green-600' : 'text-amber-600'}>
                      {deuda <= 0 ? '✅ Pagado' : `$${deuda.toLocaleString()} pendiente`}
                    </span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-2 text-xs text-gray-700 border-t pt-2">
              <p className="text-black">Deuda total del grupo: ${((miembros.reduce((sum, m) => sum + (m.montoTotal || 0), 0) - miembros.reduce((sum, m) => sum + (m.montoPagado || 0), 0))).toLocaleString()}</p>
              {distribuir && (
                <p className="text-blue-600">Cada persona debe pagar: ${deudaPorPersona.toLocaleString()}</p>
              )}
            </div>
            <label className="flex items-center gap-2 mt-2 text-black">
              <input
                type="checkbox"
                checked={distribuir}
                onChange={(e) => setDistribuir(e.target.checked)}
              />
              Distribuir el monto equitativamente entre todos
            </label>
          </div>
        )}

        <label className="text-sm text-gray-600 block mb-1">
          {esGrupo && distribuir ? 'Monto total a pagar (se dividirá)' : 'Monto a pagar'}
        </label>
        <input 
          type="number" 
          value={monto} 
          onChange={(e) => setMonto(e.target.value)} 
          placeholder="0" 
          className="w-full border rounded-lg p-2 mb-3 text-black bg-white placeholder-gray-400" 
        />
        {esGrupo && distribuir && monto && (
          <p className="text-xs text-gray-600 -mt-2 mb-3">
            Cada persona pagará: ${(parseFloat(monto) / miembros.length).toFixed(2)}
          </p>
        )}

        <label className="text-sm text-gray-600 block mb-1">Método de pago</label>
        <select 
          value={metodo} 
          onChange={(e) => {
            setMetodo(e.target.value)
            if (e.target.value !== 'Tarjeta') {
              setMostrarDetalleCuotas(false)
            }
          }} 
          className="w-full border rounded-lg p-2 mb-3 text-black bg-white"
        >
          <option className="text-black">Efectivo</option>
          <option className="text-black">Transferencia</option>
          <option className="text-black">Tarjeta</option>
          <option className="text-black">Otro</option>
        </select>

        {esTarjeta && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <label className="text-sm text-gray-600 block mb-1">Tipo de tarjeta</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTipoTarjeta('debito')
                  setMostrarDetalleCuotas(false)
                  setRecargoPersonalizado(0)
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  tipoTarjeta === 'debito' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                💳 Débito
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipoTarjeta('credito')
                  setMostrarDetalleCuotas(true)
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  tipoTarjeta === 'credito' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                💳 Crédito
              </button>
            </div>

            {esCredito && (
              <div className="mt-3">
                <label className="text-sm text-gray-600 block mb-1">Cantidad de cuotas</label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={cantidadCuotas}
                  onChange={(e) => setCantidadCuotas(Number(e.target.value) || 1)}
                  className="w-full border rounded-lg p-2 text-black bg-white mb-2"
                />
                
                <label className="text-sm text-gray-600 block mb-1">Recargo (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={recargoPersonalizado}
                  onChange={(e) => setRecargoPersonalizado(Number(e.target.value) || 0)}
                  className="w-full border rounded-lg p-2 text-black bg-white"
                  placeholder="Ej: 5, 10, 15, 20"
                />

                {montoNum > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Resumen:</span><br />
                      Monto original: <span className="font-medium">${montoNum.toFixed(2)}</span><br />
                      Recargo: <span className="font-medium text-amber-600">${recargoEnPesos.toFixed(2)} ({recargoPersonalizado}%)</span><br />
                      <span className="font-bold text-blue-700">Total a pagar: ${montoConRecargo.toFixed(2)}</span><br />
                      <span className="text-xs text-gray-500">{cantidadCuotas} cuota{cantidadCuotas > 1 ? 's' : ''} de ${(montoConRecargo / cantidadCuotas).toFixed(2)}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {esTarjeta && tipoTarjeta === 'debito' && montoNum > 0 && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Total a pagar: ${montoNum.toFixed(2)}</span>
                  <br />
                  <span className="text-xs text-gray-500">Sin recargo por pago con débito</span>
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button 
            onClick={onCancel} 
            className="flex-1 border rounded-lg p-2 text-black hover:bg-gray-50"
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={guardando || !monto}
            className="flex-1 border rounded-lg p-2 bg-gray-900 text-white disabled:opacity-50 hover:bg-gray-800"
          >
            {guardando ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}