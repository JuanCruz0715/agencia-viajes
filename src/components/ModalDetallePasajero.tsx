'use client'

type Pasajero = {
  id: string
  nombre_pasajero: string
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
  contacto_emergencia_nombre?: string | null
  contacto_emergencia_telefono?: string | null
  contacto_emergencia_parentesco?: string | null
  enfermedad?: string | null
  alergia?: string | null
  dieta_especial?: string | null
  sugerencias?: string | null
}

type Props = {
  pasajero: Pasajero
  esGrupo?: boolean
  miembros?: Pasajero[]
  onAprobar: () => void
  onCancel: () => void
  onEliminar?: () => void
  onEditar?: () => void
  estaAprobando?: boolean
}

export default function ModalDetallePasajero({
  pasajero,
  esGrupo = false,
  miembros = [],
  onAprobar,
  onCancel,
  onEliminar,
  onEditar,
  estaAprobando = false,
}: Props) {
  const titular = miembros.find((m) => m.es_titular) ?? pasajero
  const resto = miembros.filter((m) => m.id !== titular.id)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-black">
          {esGrupo ? 'Detalles del grupo' : 'Detalles del pasajero'}
        </h3>

        {/* Información del titular */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex justify-between items-start mb-3">
            <p className="font-medium text-lg text-black">{titular.nombre_pasajero}</p>
            {titular.es_titular && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Titular</span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Documento</p>
              <p className="text-black">{titular.tipo_documento || 'DNI'} {titular.numero_documento || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="text-black">{titular.email_pasajero || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-gray-500">Teléfono</p>
              <p className="text-black">{titular.telefono_pasajero || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-gray-500">Fecha de nacimiento</p>
              <p className="text-black">{titular.fecha_nacimiento || 'No registrada'}</p>
            </div>
            <div>
              <p className="text-gray-500">Género</p>
              <p className="text-black">{titular.genero_pasajero || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-gray-500">Estado</p>
              <p className={`font-medium ${titular.estado_revision === 'aprobado' ? 'text-green-600' : 'text-amber-600'}`}>
                {titular.estado_revision === 'aprobado' ? '✅ Confirmado' : '⏳ Pendiente'}
              </p>
            </div>
            {titular.parentesco_con_titular && (
              <div>
                <p className="text-gray-500">Parentesco</p>
                <p className="text-black">{titular.parentesco_con_titular}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contacto de emergencia */}
        <div className="border rounded-lg p-4 mb-4">
          <p className="font-medium text-sm mb-2 text-black">📞 Contacto de emergencia</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Nombre</p>
              <p className="text-black">{titular.contacto_emergencia_nombre || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-gray-500">Teléfono</p>
              <p className="text-black">{titular.contacto_emergencia_telefono || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-gray-500">Parentesco</p>
              <p className="text-black">{titular.contacto_emergencia_parentesco || 'No registrado'}</p>
            </div>
          </div>
        </div>

        {/* Información médica */}
        <div className="border rounded-lg p-4 mb-4">
          <p className="font-medium text-sm mb-2 text-black">🏥 Información médica</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Enfermedades</p>
              <p className="text-black">{titular.enfermedad || 'Ninguna'}</p>
            </div>
            <div>
              <p className="text-gray-500">Alergias</p>
              <p className="text-black">{titular.alergia || 'Ninguna'}</p>
            </div>
            <div>
              <p className="text-gray-500">Dieta especial</p>
              <p className="text-black">{titular.dieta_especial || 'Ninguna'}</p>
            </div>
          </div>
          {titular.sugerencias && (
            <div className="mt-2 text-sm">
              <p className="text-gray-500">Sugerencias</p>
              <p className="text-black">{titular.sugerencias}</p>
            </div>
          )}
        </div>

        {/* Miembros del grupo */}
        {esGrupo && resto.length > 0 && (
          <div className="mb-4">
            <p className="font-medium text-sm mb-2 text-black">👥 Acompañantes ({resto.length})</p>
            <div className="space-y-2">
              {resto.map((m) => (
                <div key={m.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-black">{m.nombre_pasajero}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-1">
                        <p className="text-black">DNI: {m.numero_documento || 'No registrado'}</p>
                        {m.parentesco_con_titular && <p className="text-black">Parentesco: {m.parentesco_con_titular}</p>}
                        {m.fecha_nacimiento && <p className="text-black">Fecha nac.: {m.fecha_nacimiento}</p>}
                        {m.enfermedad && <p className="text-black">Enfermedad: {m.enfermedad}</p>}
                        {m.alergia && <p className="text-black">Alergia: {m.alergia}</p>}
                        {m.dieta_especial && <p className="text-black">Dieta: {m.dieta_especial}</p>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${m.estado_revision === 'aprobado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {m.estado_revision === 'aprobado' ? 'Confirmado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTONES */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 border rounded-lg p-2 hover:bg-gray-50 text-black"
            type="button"
          >
            Cancelar
          </button>
          
          {onEditar && (
            <button
              onClick={onEditar}
              className="flex-1 bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 disabled:opacity-50"
              type="button"
            >
              ✏️ Editar
            </button>
          )}
          
          {onEliminar && (
            <button
              onClick={onEliminar}
              className="flex-1 bg-red-600 text-white rounded-lg p-2 hover:bg-red-700 disabled:opacity-50"
              type="button"
            >
              🗑️ Eliminar
            </button>
          )}
          
          <button
            onClick={onAprobar}
            className="flex-1 bg-gray-900 text-white rounded-lg p-2 hover:bg-gray-800 disabled:opacity-50"
            disabled={estaAprobando || pasajero.estado_revision === 'aprobado'}
            type="button"
          >
            {estaAprobando ? 'Aprobando...' : '✅ Aprobar'}
          </button>
        </div>
      </div>
    </div>
  )
}