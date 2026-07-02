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
  const [errorMonto, setErrorMonto] = useState('')
  
  // Estados para tarjeta
  const [tipoTarjeta, setTipoTarjeta] = useState<'debito' | 'credito'>('debito')
  const [cantidadCuotas, setCantidadCuotas] = useState(1)
  const [recargoPersonalizado, setRecargoPersonalizado] = useState<number>(0)

  // Calcular monto máximo a pagar
  const calcularMontoMaximo = () => {
    if (esGrupo && miembros.length > 0) {
      const totalDeuda = miembros.reduce((sum, m) => sum + (m.montoTotal || 0), 0)
      const totalPagado = miembros.reduce((sum, m) => sum + (m.montoPagado || 0), 0)
      const deudaRestante = totalDeuda - totalPagado
      return Math.max(0, deudaRestante)
    } else if (miembros.length === 1) {
      const deuda = (miembros[0].montoTotal || 0) - (miembros[0].montoPagado || 0)
      return Math.max(0, deuda)
    }
    return null
  }

  const montoMaximo = calcularMontoMaximo()

  // Manejar cambio en el input
  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    const numeros = valor.replace(/\D/g, '')
    
    if (!numeros) {
      setMonto('')
      setErrorMonto('')
      return
    }
    
    const montoNum = parseInt(numeros, 10)
    const montoFormateado = montoNum.toLocaleString('es-AR')
    setMonto(montoFormateado)
    
    if (montoMaximo !== null && montoMaximo > 0 && montoNum > montoMaximo) {
      setErrorMonto(`El monto no puede superar $${montoMaximo.toLocaleString('es-AR')}`)
    } else {
      setErrorMonto('')
    }
  }

  const esTarjeta = metodo === 'Tarjeta'
  const esCredito = esTarjeta && tipoTarjeta === 'credito'

  const montoNum = parseInt(monto.replace(/\./g, '')) || 0
  const recargoDecimal = recargoPersonalizado / 100
  const montoConRecargo = montoNum * (1 + recargoDecimal)
  const recargoEnPesos = montoConRecargo - montoNum

  const handleConfirm = () => {
    if (montoNum <= 0) {
      setErrorMonto('Ingresá un monto válido')
      return
    }
    
    if (montoMaximo !== null && montoMaximo > 0 && montoNum > montoMaximo) {
      setErrorMonto(`El monto no puede superar $${montoMaximo.toLocaleString('es-AR')}`)
      return
    }
    
    let tipoTarjetaFinal: string | undefined = undefined
    let cuotasFinal = 1
    let recargoFinal = 0
    
    if (metodo === 'Tarjeta') {
      tipoTarjetaFinal = tipoTarjeta
      cuotasFinal = cantidadCuotas
      recargoFinal = recargoDecimal
    }
    
    onConfirm(montoNum, metodo, tipoTarjetaFinal, cuotasFinal, recargoFinal)
  }

  const isDisabled = guardando || !monto || !!errorMonto || montoNum <= 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <h2 className="font-medium mb-1 text-black">
          {esGrupo ? `Registrar pago grupal (${miembros.length} personas)` : 'Registrar pago'}
        </h2>
        <p className="text-sm text-gray-600 mb-4">{nombrePasajero}</p>

        {/* SOLO LISTA DE MIEMBROS Y DEUDA TOTAL - SIN TEXTOS CONFUSOS */}
        {esGrupo && miembros.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 mb-3 text-sm">
            <p className="font-medium text-blue-700">👥 Miembros del grupo:</p>
            <ul className="text-gray-700 mt-1">
              {miembros.map((m) => (
                <li key={m.id} className="flex justify-between">
                  <span className="text-black">• {m.nombre}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 text-xs text-gray-700 border-t pt-2">
              <p className="text-black">Deuda total del grupo: <span className="font-bold">${(montoMaximo ?? 0).toLocaleString('es-AR')}</span></p>
            </div>
          </div>
        )}

        <label className="text-sm text-gray-600 block mb-1">
          Monto a pagar
        </label>
        <div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input 
              type="text" 
              value={monto} 
              onChange={handleMontoChange} 
              placeholder="0" 
              className={`w-full pl-7 border rounded-lg p-2 mb-1 text-black bg-white placeholder-gray-400 text-right ${errorMonto ? 'border-red-500' : ''}`}
            />
          </div>
          {montoMaximo !== null && montoMaximo > 0 && (
            <p className="text-xs text-gray-500">
              Máximo: ${montoMaximo.toLocaleString('es-AR')}
            </p>
          )}
        </div>
        {errorMonto && (
          <p className="text-xs text-red-500 mt-1 mb-2">{errorMonto}</p>
        )}

        <label className="text-sm text-gray-600 block mb-1">Método de pago</label>
        <select 
          value={metodo} 
          onChange={(e) => {
            setMetodo(e.target.value)
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
                      Monto original: <span className="font-medium">${montoNum.toLocaleString('es-AR')}</span><br />
                      Recargo: <span className="font-medium text-amber-600">${recargoEnPesos.toLocaleString('es-AR')} ({recargoPersonalizado}%)</span><br />
                      <span className="font-bold text-blue-700">Total a pagar: ${montoConRecargo.toLocaleString('es-AR')}</span><br />
                      <span className="text-xs text-gray-500">{cantidadCuotas} cuota{cantidadCuotas > 1 ? 's' : ''} de ${(montoConRecargo / cantidadCuotas).toLocaleString('es-AR')}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {esTarjeta && tipoTarjeta === 'debito' && montoNum > 0 && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Total a pagar: ${montoNum.toLocaleString('es-AR')}</span>
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
            disabled={isDisabled}
            className="flex-1 border rounded-lg p-2 bg-gray-900 text-white disabled:opacity-50 hover:bg-gray-800"
          >
            {guardando ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}