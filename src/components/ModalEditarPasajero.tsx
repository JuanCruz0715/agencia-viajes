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
}

type AcompananteData = {
  id: string
  nombre: string
  apellido: string
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
    nombre: string
    apellido: string
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
    nombre: titular.nombre || '',
    apellido: titular.apellido || '',
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
      nombre: m.nombre || '',
      apellido: m.apellido || '',
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

  const edadCalculada = (() => {
    if (!formData.fecha_nacimiento) return null
    const hoy = new Date()
    const nacimiento = new Date(formData.fecha_nacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad
  })()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-black">
          {esGrupo ? 'Editar grupo' : 'Editar pasajero'}
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Información del titular */}
          <div className="border rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <p className="font-medium text-black">Titular</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Titular</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Apellido *</label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Documento *</label>
                <div className="flex gap-2">
                  <select
                    value={formData.tipo_documento}
                    onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                    className="border rounded-lg p-2 text-sm w-24 text-black bg-white"
                  >
                    <option className="text-black">DNI</option>
                    <option className="text-black">Pasaporte</option>
                  </select>
                  <input
                    type="text"
                    value={formData.numero_documento}
                    onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                    className="flex-1 border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
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
                  className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formData.telefono_pasajero}
                  onChange={(e) => setFormData({ ...formData, telefono_pasajero: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm text-black bg-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Edad (calculada)</label>
                <div className="w-full border rounded-lg p-2 text-sm bg-gray-100 text-black">
                  {edadCalculada !== null ? `${edadCalculada} años` : 'No disponible'}
                  {edadCalculada !== null && edadCalculada < 3 && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      👶 No ocupa butaca
                    </span>
                  )}
                  {edadCalculada !== null && edadCalculada < 18 && edadCalculada >= 3 && (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      🧒 Menor de edad
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  La edad se calcula automáticamente a partir de la fecha de nacimiento.
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Género</label>
                <select
                  value={formData.genero_pasajero}
                  onChange={(e) => setFormData({ ...formData, genero_pasajero: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm text-black bg-white"
                >
                  <option value="" className="text-black">Seleccionar</option>
                  <option className="text-black">Femenino</option>
                  <option className="text-black">Masculino</option>
                  <option className="text-black">Otro</option>
                  <option className="text-black">Prefiero no decir</option>
                </select>
              </div>
              {esGrupo && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Parentesco (opcional)</label>
                  <input
                    type="text"
                    value={formData.parentesco_con_titular || ''}
                    onChange={(e) => setFormData({ ...formData, parentesco_con_titular: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                    placeholder="Ej: Padre, Madre, etc."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Contacto de emergencia */}
          <div className="border rounded-lg p-4 mb-4">
            <p className="font-medium text-sm mb-2 text-black">📞 Contacto de emergencia</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.contacto_emergencia_nombre}
                  onChange={(e) => setFormData({ ...formData, contacto_emergencia_nombre: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formData.contacto_emergencia_telefono}
                  onChange={(e) => setFormData({ ...formData, contacto_emergencia_telefono: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Parentesco</label>
                <input
                  type="text"
                  value={formData.contacto_emergencia_parentesco}
                  onChange={(e) => setFormData({ ...formData, contacto_emergencia_parentesco: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Información médica */}
          <div className="border rounded-lg p-4 mb-4">
            <p className="font-medium text-sm mb-2 text-black">🏥 Información médica</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Enfermedades</label>
                <input
                  type="text"
                  value={formData.enfermedad}
                  onChange={(e) => setFormData({ ...formData, enfermedad: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                  placeholder="¿Enfermedad? ¿Cuál?"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Alergias</label>
                <input
                  type="text"
                  value={formData.alergia}
                  onChange={(e) => setFormData({ ...formData, alergia: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                  placeholder="¿Alergia? ¿Cuál?"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Dieta especial</label>
                <input
                  type="text"
                  value={formData.dieta_especial}
                  onChange={(e) => setFormData({ ...formData, dieta_especial: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                  placeholder="Dieta o requerimiento especial"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-sm text-gray-600 block mb-1">Sugerencias</label>
              <textarea
                value={formData.sugerencias}
                onChange={(e) => setFormData({ ...formData, sugerencias: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                placeholder="Sugerencias para el viaje (opcional)"
                rows={2}
              />
            </div>
          </div>

          {/* Acompañantes */}
          {esGrupo && acompanantesData.length > 0 && (
            <div className="mb-4">
              <p className="font-medium text-sm mb-2 text-black">👥 Acompañantes ({acompanantesData.length})</p>
              {acompanantesData.map((acompanante, index) => (
                <div key={acompanante.id} className="border rounded-lg p-4 mb-3">
                  <p className="text-xs text-gray-500 mb-2">Acompañante #{index + 1}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={acompanante.nombre}
                        onChange={(e) => handleAcompananteChange(index, 'nombre', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Apellido *</label>
                      <input
                        type="text"
                        value={acompanante.apellido}
                        onChange={(e) => handleAcompananteChange(index, 'apellido', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Documento *</label>
                      <input
                        type="text"
                        value={acompanante.numero_documento}
                        onChange={(e) => handleAcompananteChange(index, 'numero_documento', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Fecha nacimiento</label>
                      <input
                        type="date"
                        value={acompanante.fecha_nacimiento || ''}
                        onChange={(e) => handleAcompananteChange(index, 'fecha_nacimiento', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm text-black bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Parentesco</label>
                      <input
                        type="text"
                        value={acompanante.parentesco_con_titular || ''}
                        onChange={(e) => handleAcompananteChange(index, 'parentesco_con_titular', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                        placeholder="Ej: Hijo/a, Hermano, etc."
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Enfermedad</label>
                      <input
                        type="text"
                        value={acompanante.enfermedad || ''}
                        onChange={(e) => handleAcompananteChange(index, 'enfermedad', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                        placeholder="Si posee"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Alergia</label>
                      <input
                        type="text"
                        value={acompanante.alergia || ''}
                        onChange={(e) => handleAcompananteChange(index, 'alergia', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
                        placeholder="Si posee"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-600 block mb-1">Dieta especial</label>
                      <input
                        type="text"
                        value={acompanante.dieta_especial || ''}
                        onChange={(e) => handleAcompananteChange(index, 'dieta_especial', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm text-black bg-white placeholder-gray-400"
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
              className="flex-1 border rounded-lg p-2 hover:bg-gray-50 text-black"
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