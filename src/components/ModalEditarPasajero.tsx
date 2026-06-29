'use client'

import { useState } from 'react'

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

type AcompananteData = {
  id: string
  nombre_pasajero: string
  numero_documento: string
  parentesco_con_titular?: string
  fecha_nacimiento?: string
  enfermedad?: string
  alergia?: string
  dieta_especial?: string
}

type EdicionData = {
  titular: {
    id: string
    nombre_pasajero: string
    numero_documento: string
    tipo_documento?: string
    email_pasajero?: string
    telefono_pasajero?: string
    fecha_nacimiento?: string
    genero_pasajero?: string
    contacto_emergencia_nombre?: string
    contacto_emergencia_telefono?: string
    contacto_emergencia_parentesco?: string
    enfermedad?: string
    alergia?: string
    dieta_especial?: string
    sugerencias?: string
    parentesco_con_titular?: string
  }
  acompanantes: AcompananteData[]
}

type Props = {
  pasajero: Pasajero
  esGrupo?: boolean
  miembros?: Pasajero[]
  onGuardar: (data: EdicionData) => void
  onCancel: () => void
  guardando?: boolean
}

export default function ModalEditarPasajero({
  pasajero,
  esGrupo = false,
  miembros = [],
  onGuardar,
  onCancel,
  guardando = false,
}: Props) {
  const titular = miembros.find((m) => m.es_titular) ?? pasajero
  const resto = miembros.filter((m) => m.id !== titular.id)

  const [formData, setFormData] = useState({
    nombre_pasajero: titular.nombre_pasajero || '',
    numero_documento: titular.numero_documento || '',
    tipo_documento: titular.tipo_documento || 'DNI',
    email_pasajero: titular.email_pasajero || '',
    telefono_pasajero: titular.telefono_pasajero || '',
    fecha_nacimiento: titular.fecha_nacimiento || '',
    genero_pasajero: titular.genero_pasajero || '',
    contacto_emergencia_nombre: titular.contacto_emergencia_nombre || '',
    contacto_emergencia_telefono: titular.contacto_emergencia_telefono || '',
    contacto_emergencia_parentesco: titular.contacto_emergencia_parentesco || '',
    enfermedad: titular.enfermedad || '',
    alergia: titular.alergia || '',
    dieta_especial: titular.dieta_especial || '',
    sugerencias: titular.sugerencias || '',
    parentesco_con_titular: titular.parentesco_con_titular || '',
  })

  const [acompanantesData, setAcompanantesData] = useState(
    resto.map((m) => ({
      id: m.id,
      nombre_pasajero: m.nombre_pasajero || '',
      numero_documento: m.numero_documento || '',
      parentesco_con_titular: m.parentesco_con_titular || '',
      fecha_nacimiento: m.fecha_nacimiento || '',
      enfermedad: m.enfermedad || '',
      alergia: m.alergia || '',
      dieta_especial: m.dieta_especial || '',
    }))
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const data: EdicionData = {
      titular: {
        id: titular.id,
        ...formData
      },
      acompanantes: acompanantesData
    }
    
    onGuardar(data)
  }

  const handleAcompananteChange = (index: number, field: keyof AcompananteData, value: string) => {
    const updated = [...acompanantesData]
    updated[index] = { ...updated[index], [field]: value }
    setAcompanantesData(updated)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {esGrupo ? 'Editar grupo' : 'Editar pasajero'}
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Información del titular */}
          <div className="border rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <p className="font-medium">Titular</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Titular</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nombre completo *</label>
                <input
                  type="text"
                  value={formData.nombre_pasajero}
                  onChange={(e) => setFormData({ ...formData, nombre_pasajero: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Documento *</label>
                <div className="flex gap-2">
                  <select
                    value={formData.tipo_documento}
                    onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                    className="border rounded-lg p-2 text-sm w-24"
                  >
                    <option>DNI</option>
                    <option>Pasaporte</option>
                  </select>
                  <input
                    type="text"
                    value={formData.numero_documento}
                    onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                    className="flex-1 border rounded-lg p-2 text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email_pasajero}
                  onChange={(e) => setFormData({ ...formData, email_pasajero: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formData.telefono_pasajero}
                  onChange={(e) => setFormData({ ...formData, telefono_pasajero: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Género</label>
                <select
                  value={formData.genero_pasajero}
                  onChange={(e) => setFormData({ ...formData, genero_pasajero: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                >
                  <option value="">Seleccionar</option>
                  <option>Femenino</option>
                  <option>Masculino</option>
                  <option>Otro</option>
                  <option>Prefiero no decir</option>
                </select>
              </div>
              {esGrupo && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Parentesco (opcional)</label>
                  <input
                    type="text"
                    value={formData.parentesco_con_titular || ''}
                    onChange={(e) => setFormData({ ...formData, parentesco_con_titular: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm"
                    placeholder="Ej: Padre, Madre, etc."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Contacto de emergencia */}
          <div className="border rounded-lg p-4 mb-4">
            <p className="font-medium text-sm mb-2">📞 Contacto de emergencia</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.contacto_emergencia_nombre}
                  onChange={(e) => setFormData({ ...formData, contacto_emergencia_nombre: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formData.contacto_emergencia_telefono}
                  onChange={(e) => setFormData({ ...formData, contacto_emergencia_telefono: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Parentesco</label>
                <input
                  type="text"
                  value={formData.contacto_emergencia_parentesco}
                  onChange={(e) => setFormData({ ...formData, contacto_emergencia_parentesco: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Información médica */}
          <div className="border rounded-lg p-4 mb-4">
            <p className="font-medium text-sm mb-2">🏥 Información médica</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Enfermedades</label>
                <input
                  type="text"
                  value={formData.enfermedad}
                  onChange={(e) => setFormData({ ...formData, enfermedad: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="¿Enfermedad? ¿Cuál?"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Alergias</label>
                <input
                  type="text"
                  value={formData.alergia}
                  onChange={(e) => setFormData({ ...formData, alergia: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="¿Alergia? ¿Cuál?"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Dieta especial</label>
                <input
                  type="text"
                  value={formData.dieta_especial}
                  onChange={(e) => setFormData({ ...formData, dieta_especial: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="Dieta o requerimiento especial"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-sm text-gray-600 block mb-1">Sugerencias</label>
              <textarea
                value={formData.sugerencias}
                onChange={(e) => setFormData({ ...formData, sugerencias: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="Sugerencias para el viaje (opcional)"
                rows={2}
              />
            </div>
          </div>

          {/* Acompañantes */}
          {esGrupo && acompanantesData.length > 0 && (
            <div className="mb-4">
              <p className="font-medium text-sm mb-2">👥 Acompañantes ({acompanantesData.length})</p>
              {acompanantesData.map((acompanante, index) => (
                <div key={acompanante.id} className="border rounded-lg p-4 mb-3">
                  <p className="text-xs text-gray-500 mb-2">Acompañante #{index + 1}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Nombre completo *</label>
                      <input
                        type="text"
                        value={acompanante.nombre_pasajero}
                        onChange={(e) => handleAcompananteChange(index, 'nombre_pasajero', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Documento *</label>
                      <input
                        type="text"
                        value={acompanante.numero_documento}
                        onChange={(e) => handleAcompananteChange(index, 'numero_documento', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Fecha nacimiento</label>
                      <input
                        type="date"
                        value={acompanante.fecha_nacimiento || ''}
                        onChange={(e) => handleAcompananteChange(index, 'fecha_nacimiento', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Parentesco</label>
                      <input
                        type="text"
                        value={acompanante.parentesco_con_titular || ''}
                        onChange={(e) => handleAcompananteChange(index, 'parentesco_con_titular', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="Ej: Hijo/a, Hermano, etc."
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Enfermedad</label>
                      <input
                        type="text"
                        value={acompanante.enfermedad || ''}
                        onChange={(e) => handleAcompananteChange(index, 'enfermedad', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="Si posee"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Alergia</label>
                      <input
                        type="text"
                        value={acompanante.alergia || ''}
                        onChange={(e) => handleAcompananteChange(index, 'alergia', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="Si posee"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-600 block mb-1">Dieta especial</label>
                      <input
                        type="text"
                        value={acompanante.dieta_especial || ''}
                        onChange={(e) => handleAcompananteChange(index, 'dieta_especial', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="Si posee"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border rounded-lg p-2 hover:bg-gray-50"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gray-900 text-white rounded-lg p-2 hover:bg-gray-800 disabled:opacity-50"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : '💾 Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}