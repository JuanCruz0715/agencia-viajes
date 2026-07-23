'use client'

import { useState } from 'react'

type Pasajero = {
  id: string
  nombre: string | null
  apellido: string | null
  nombre_pasajero: string | null
  numero_documento: string | null
  tipo_documento?: string | null
  estado_revision: string
  estado_pago: string
  monto_pagado: number | null
  monto_total: number | null
  grupo_id: string | null
  es_titular: boolean
  parentesco_con_titular?: string | null
  email_pasajero?: string | null
  telefono_pasajero?: string | null
  fecha_nacimiento?: string | null
  genero_pasajero?: string | null
  nacionalidad?: string | null
  contacto_emergencia_nombre?: string | null
  contacto_emergencia_telefono?: string | null
  contacto_emergencia_parentesco?: string | null
  enfermedad?: string | null
  alergia?: string | null
  dieta_especial?: string | null
  sugerencias?: string | null
  edad?: number | null
  es_menor_3?: boolean | null
  es_menor_18?: boolean | null
  vendedor?: string | null
  iniciales_vendedor?: string | null
}

type Props = {
  pasajero: Pasajero
  esGrupo?: boolean
  miembros?: Pasajero[]
  onAprobar: (iniciales: string) => void
  onCancel: () => void
  onEliminar?: () => void
  onEditar?: () => void
  onCancelar?: () => void
  onVerHistorial?: (pasajeroId: string, nombre: string) => void
  estaAprobando?: boolean
  onMover?: () => void
  onMoverGrupo?: () => void
}

// SOLO 3 VENDEDORES
const VENDEDORES = [
  { iniciales: 'MT', nombre: 'Maria Jose Tapia' },
  { iniciales: 'GP', nombre: 'Gabriela Paladini' },
  { iniciales: 'MM', nombre: 'Mauricio Murua' },
]

export default function ModalDetallePasajero({
  pasajero,
  esGrupo = false,
  miembros = [],
  onAprobar,
  onCancel,
  onEliminar,
  onEditar,
  onCancelar,
  onVerHistorial,
  estaAprobando = false,
  onMover,
  onMoverGrupo,
}: Props) {
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<{ iniciales: string; nombre: string } | null>(null)
  const [mostrarListaVendedores, setMostrarListaVendedores] = useState(false)

  const titular = miembros.find((m) => m.es_titular) ?? pasajero
  const resto = miembros.filter((m) => m.id !== titular.id)
  const yaAprobado = pasajero.estado_revision === 'aprobado'

  const handleAprobar = () => {
    console.log('🟢 handleAprobar - vendedorSeleccionado:', vendedorSeleccionado)
    if (!vendedorSeleccionado) {
      alert('Por favor, seleccioná un vendedor')
      return
    }
    console.log('🟢 Aprobando con vendedor:', vendedorSeleccionado)
    onAprobar(vendedorSeleccionado.iniciales)
  }

  const seleccionarVendedor = (iniciales: string, nombre: string) => {
    console.log('🟢 Vendedor seleccionado:', { iniciales, nombre })
    setVendedorSeleccionado({ iniciales, nombre })
    setMostrarListaVendedores(false)
  }

  const handleCerrar = () => {
    console.log('🟡 Cerrando modal - resetear aprobando')
    setVendedorSeleccionado(null)
    onCancel()
  }

  const handleVerHistorial = () => {
    if (onVerHistorial) {
      const nombre = `${titular.nombre || ''} ${titular.apellido || ''}`.trim() || 'Pasajero'
      onVerHistorial(titular.id, nombre)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>

          {/* HEADER FIJO */}
          <div className="px-6 pt-5 pb-3 border-b flex items-center justify-between flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900">
              {esGrupo ? 'Detalles del grupo' : 'Detalles del pasajero'}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              yaAprobado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {yaAprobado ? '✅ Confirmado' : '⏳ Pendiente'}
            </span>
          </div>

          {/* CONTENIDO SCROLLEABLE */}
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

            {/* Datos del titular */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900 text-base">
                  {titular.nombre} {titular.apellido}
                </p>
                {titular.es_titular && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Titular</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Documento</p>
                  <p className="text-gray-900">{titular.tipo_documento || 'DNI'} {titular.numero_documento || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Email</p>
                  <p className="text-gray-900">{titular.email_pasajero || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Teléfono</p>
                  <p className="text-gray-900">{titular.telefono_pasajero || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Fecha de nacimiento</p>
                  <p className="text-gray-900">{titular.fecha_nacimiento || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Edad</p>
                  <p className="text-gray-900 flex items-center gap-1 flex-wrap">
                    {titular.edad !== null && titular.edad !== undefined ? `${titular.edad} años` : '—'}
                    {titular.es_menor_3 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 rounded-full">👶 sin butaca</span>
                    )}
                    {titular.es_menor_18 && !titular.es_menor_3 && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 rounded-full">🧒 menor</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Género</p>
                  <p className="text-gray-900">{titular.genero_pasajero || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Nacionalidad</p>
                  <p className="text-gray-900">{titular.nacionalidad || '—'}</p>
                </div>
                {titular.vendedor && (
                  <div>
                    <p className="text-gray-400 text-xs">Vendedor asignado</p>
                    <p className="text-gray-900 font-medium">{titular.vendedor}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contacto de emergencia */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📞 Contacto de emergencia</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Nombre</p>
                  <p className="text-gray-900">{titular.contacto_emergencia_nombre || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Teléfono</p>
                  <p className="text-gray-900">{titular.contacto_emergencia_telefono || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Parentesco</p>
                  <p className="text-gray-900">{titular.contacto_emergencia_parentesco || '—'}</p>
                </div>
              </div>
            </div>

            {/* Info médica */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🏥 Información médica</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Enfermedades</p>
                  <p className="text-gray-900">{titular.enfermedad || 'Ninguna'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Alergias</p>
                  <p className="text-gray-900">{titular.alergia || 'Ninguna'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Dieta especial</p>
                  <p className="text-gray-900">{titular.dieta_especial || 'Ninguna'}</p>
                </div>
              </div>
              {titular.sugerencias && (
                <div className="mt-2 text-sm">
                  <p className="text-gray-400 text-xs">Sugerencias</p>
                  <p className="text-gray-900">{titular.sugerencias}</p>
                </div>
              )}
            </div>

            {/* Acompañantes */}
            {esGrupo && resto.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  👥 Acompañantes ({resto.length})
                </p>
                <div className="space-y-2">
                  {resto.map((m) => (
                    <div key={m.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{m.nombre} {m.apellido}</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 mt-1">
                            <p>{m.tipo_documento || 'DNI'}: {m.numero_documento || '—'}</p>
                            {m.parentesco_con_titular && <p>Parentesco: {m.parentesco_con_titular}</p>}
                            {m.fecha_nacimiento && <p>Nac.: {m.fecha_nacimiento}</p>}
                            {m.edad !== null && m.edad !== undefined && (
                              <p>Edad: {m.edad} años {m.es_menor_3 ? '👶' : m.es_menor_18 ? '🧒' : ''}</p>
                            )}
                            {m.enfermedad && <p>Enfermedad: {m.enfermedad}</p>}
                            {m.alergia && <p>Alergia: {m.alergia}</p>}
                            {m.dieta_especial && <p>Dieta: {m.dieta_especial}</p>}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                          m.estado_revision === 'aprobado'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {m.estado_revision === 'aprobado' ? 'Confirmado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VENDEDOR - SOLO LISTA */}
            {!yaAprobado && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2">
                  👤 Vendedor <span className="text-red-500">*</span>
                </p>
                
                {vendedorSeleccionado ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full bg-green-100 text-green-700 text-sm font-bold flex items-center justify-center">
                        {vendedorSeleccionado.iniciales}
                      </span>
                      <span className="text-sm text-gray-900 font-medium">{vendedorSeleccionado.nombre}</span>
                    </div>
                    <button
                      onClick={() => setVendedorSeleccionado(null)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                      type="button"
                    >
                      ✕ Quitar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setMostrarListaVendedores(true)}
                    className="w-full border-2 border-dashed border-blue-300 rounded-lg py-3 text-sm text-blue-600 hover:bg-blue-100 transition-colors font-medium"
                    type="button"
                  >
                    + Seleccionar vendedor
                  </button>
                )}
                <p className="text-xs text-blue-500 mt-1">
                  {vendedorSeleccionado ? 'Vendedor asignado ✅' : 'Requerido para confirmar la reserva'}
                </p>
              </div>
            )}
          </div>

          {/* BOTONES FIJOS ABAJO */}
          <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex flex-wrap gap-2 flex-shrink-0">
            <button
              onClick={handleCerrar}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              type="button"
            >
              Cerrar
            </button>

            {onEditar && (
              <button
                onClick={onEditar}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 transition-colors"
                type="button"
              >
                ✏️ Editar
              </button>
            )}

            {onEliminar && (
              <button
                onClick={onEliminar}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm hover:bg-red-700 transition-colors"
                type="button"
              >
                🗑️ Eliminar
              </button>
            )}

            {onCancelar && (
              <button
                onClick={onCancelar}
                className="flex-1 bg-orange-500 text-white rounded-lg py-2 text-sm hover:bg-orange-600 transition-colors"
                type="button"
              >
                ❌ Cancelar reserva
              </button>
            )}

            {onVerHistorial && (
              <button
                onClick={handleVerHistorial}
                className="flex-1 bg-purple-600 text-white rounded-lg py-2 text-sm hover:bg-purple-700 transition-colors"
                type="button"
              >
                📋 Historial de pagos
              </button>
            )}

            {/* Mover individual */}
            {!esGrupo && onMover && (
              <button
                onClick={onMover}
                className="flex-1 bg-purple-600 text-white rounded-lg py-2 text-sm hover:bg-purple-700 transition-colors"
                type="button"
              >
                ✈️ Mover a otro viaje
              </button>
            )}

            {/* Mover grupo completo */}
            {esGrupo && onMoverGrupo && (
              <button
                onClick={onMoverGrupo}
                className="flex-1 bg-purple-600 text-white rounded-lg py-2 text-sm hover:bg-purple-700 transition-colors"
                type="button"
              >
                ✈️ Mover grupo completo
              </button>
            )}

            {!yaAprobado && (
              <button
                onClick={handleAprobar}
                disabled={estaAprobando || !vendedorSeleccionado}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  vendedorSeleccionado && !estaAprobando
                    ? 'bg-blue-900 hover:bg-blue-800 text-white' 
                    : 'bg-gray-300 text-gray-500'
                }`}
                type="button"
              >
                {estaAprobando ? 'Aprobando...' : '✅ Aprobar'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE LISTA DE VENDEDORES */}
      {mostrarListaVendedores && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">👤 Seleccionar vendedor</h3>
              <button
                onClick={() => setMostrarListaVendedores(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {VENDEDORES.map((v) => (
                <button
                  key={v.iniciales}
                  onClick={() => seleccionarVendedor(v.iniciales, v.nombre)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-left border border-transparent hover:border-blue-200"
                  type="button"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-700">{v.iniciales}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{v.nombre}</p>
                    <p className="text-xs text-gray-500">Iniciales: {v.iniciales}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t flex justify-end">
              <button
                onClick={() => setMostrarListaVendedores(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                type="button"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}