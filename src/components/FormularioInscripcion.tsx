'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type Viaje = { id: string; destino: string; fecha_inicio: string; fecha_fin: string; precio: number }

type Acompanante = {
  nombre: string
  apellido: string
  documento: string
  fechaNacimiento: string
  parentesco: string
  enfermedad: string
  alergia: string
  dieta: string
  nacionalidad: string
}

const acompananteVacio: Acompanante = {
  nombre: '',
  apellido: '',
  documento: '',
  fechaNacimiento: '',
  parentesco: '',
  enfermedad: '',
  alergia: '',
  dieta: '',
  nacionalidad: ''
}

function calcularEdad(fechaNacimiento: string) {
  if (!fechaNacimiento) return null
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  return edad
}

export default function FormularioInscripcion({ viajes }: { viajes: Viaje[] }) {
  const [viajeId, setViajeId] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [tipoDocumento, setTipoDocumento] = useState('DNI')
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [genero, setGenero] = useState('')
  const [nacionalidad, setNacionalidad] = useState('')
  const [contactoNombre, setContactoNombre] = useState('')
  const [contactoTelefono, setContactoTelefono] = useState('')
  const [contactoParentesco, setContactoParentesco] = useState('')
  const [enfermedad, setEnfermedad] = useState('')
  const [alergia, setAlergia] = useState('')
  const [dieta, setDieta] = useState('')
  const [sugerencias, setSugerencias] = useState('')

  const [tieneGrupo, setTieneGrupo] = useState(false)
  const [acompanantes, setAcompanantes] = useState<Acompanante[]>([])

  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  function agregarAcompanante() {
    setAcompanantes([...acompanantes, { ...acompananteVacio }])
  }

  function quitarAcompanante(index: number) {
    setAcompanantes(acompanantes.filter((_, i) => i !== index))
  }

  function actualizarAcompanante(index: number, campo: keyof Acompanante, valor: string) {
    const copia = [...acompanantes]
    copia[index] = { ...copia[index], [campo]: valor }
    setAcompanantes(copia)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    setEnviando(true)

    const supabase = createClient()
    const grupoId = acompanantes.length > 0 ? crypto.randomUUID() : null
    const viajeSeleccionado = viajes.find((v) => v.id === viajeId)
    const precioViaje = viajeSeleccionado?.precio ?? 0
    
    const titularRow = {
      viaje_id: viajeId,
      grupo_id: grupoId,
      es_titular: true,
      nombre: nombre,
      apellido: apellido,
      nombre_pasajero: `${nombre} ${apellido}`,
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      email_pasajero: email,
      telefono_pasajero: telefono,
      fecha_nacimiento: fechaNacimiento || null,
      genero_pasajero: genero,
      nacionalidad: nacionalidad || null,
      contacto_emergencia_nombre: contactoNombre,
      contacto_emergencia_telefono: contactoTelefono,
      contacto_emergencia_parentesco: contactoParentesco,
      enfermedad,
      alergia,
      dieta_especial: dieta,
      sugerencias,
      estado_revision: 'pendiente',
      estado_pago: 'pendiente',
      monto_total: precioViaje,
    }

    const filas = [
      titularRow,
      ...acompanantes.map((a) => ({
        viaje_id: viajeId,
        grupo_id: grupoId,
        es_titular: false,
        nombre: a.nombre,
        apellido: a.apellido,
        nombre_pasajero: `${a.nombre} ${a.apellido}`,
        numero_documento: a.documento,
        tipo_documento: 'DNI',
        fecha_nacimiento: a.fechaNacimiento || null,
        parentesco_con_titular: a.parentesco,
        genero_pasajero: null,
        nacionalidad: a.nacionalidad || nacionalidad || null,
        contacto_emergencia_nombre: contactoNombre,
        contacto_emergencia_telefono: contactoTelefono,
        contacto_emergencia_parentesco: contactoParentesco,
        enfermedad: a.enfermedad,
        alergia: a.alergia,
        dieta_especial: a.dieta,
        estado_revision: 'pendiente',
        estado_pago: 'pendiente',
        monto_total: precioViaje,
      })),
    ]

    const { error } = await supabase.from('pasajeros').insert(filas)
    setEnviando(false)

    if (error) {
      setErrorMsg('Hubo un error al enviar el formulario: ' + error.message)
      return
    }
    setEnviado(true)
  }

  if (enviado) {
    return (
      <main className="flex items-center justify-center min-h-screen p-8 bg-gray-50">
        <div className="text-center max-w-sm bg-white p-8 rounded-xl shadow-lg">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-semibold mb-2 text-gray-800">¡Listo!</h1>
          <p className="text-gray-600">Tu inscripción fue enviada correctamente. La agencia la va a revisar y te va a contactar.</p>
        </div>
      </main>
    )
  }

  const edadTitular = calcularEdad(fechaNacimiento)

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
        {/* TITULO */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">✈️ SN Viajes y Turismo</h1>
        
        {/* LOGO */}
        <div className="flex justify-center mb-4">
          <div className="relative w-56 h-24">
            <Image
              src="/logo-sn.png"
              alt="SN Viajes y Turismo"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain"
              priority
            />
          </div>
        </div>

        <p className="text-sm text-gray-500 text-center mb-6">Completá tus datos para confirmar tu lugar</p>
        <div className="w-20 h-1 bg-blue-500 mx-auto mb-6 rounded-full"></div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Viaje */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              📍 Viaje
            </label>
            <select 
              required 
              value={viajeId} 
              onChange={(e) => setViajeId(e.target.value)} 
              className="w-full border-2 border-gray-200 rounded-xl p-3 bg-white text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            >
              <option value="" className="text-gray-500">Seleccioná un viaje</option>
              {viajes.map((v) => (
                <option key={v.id} value={v.id} className="text-gray-800">
                  {v.destino} · {v.fecha_inicio} a {v.fecha_fin} · ${v.precio?.toLocaleString('es-AR')}
                </option>
              ))}
            </select>
          </div>

          {/* Datos personales */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              👤 Tus datos
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input 
                required 
                placeholder="Nombre" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                className="border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
              <input 
                required 
                placeholder="Apellido" 
                value={apellido} 
                onChange={(e) => setApellido(e.target.value)} 
                className="border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>
          </div>

          {/* Documento */}
          <div className="grid grid-cols-3 gap-3">
            <select 
              value={tipoDocumento} 
              onChange={(e) => setTipoDocumento(e.target.value)} 
              className="border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            >
              <option className="text-gray-800">DNI</option>
              <option className="text-gray-800">Pasaporte</option>
              <option className="text-gray-800">LE</option>
              <option className="text-gray-800">LC</option>
            </select>
            <input 
              required 
              placeholder="Número de documento" 
              value={numeroDocumento} 
              onChange={(e) => setNumeroDocumento(e.target.value)} 
              className="col-span-2 border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            />
          </div>

          {/* Email y Teléfono */}
          <input 
            required 
            type="email" 
            placeholder="📧 Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
          />
          <input 
            required 
            placeholder="📱 Teléfono" 
            value={telefono} 
            onChange={(e) => setTelefono(e.target.value)} 
            className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
          />

          {/* Fecha de nacimiento */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              🎂 Fecha de nacimiento
            </label>
            <input 
              type="date" 
              value={fechaNacimiento} 
              onChange={(e) => setFechaNacimiento(e.target.value)} 
              className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            />
            {fechaNacimiento && edadTitular !== null && (
              <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-700">
                  Edad: <span className="font-semibold text-blue-600">{edadTitular} años</span>
                </p>
              </div>
            )}
          </div>

          {/* Género y Nacionalidad */}
          <div className="grid grid-cols-2 gap-3">
            <select 
              value={genero} 
              onChange={(e) => setGenero(e.target.value)} 
              className="border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            >
              <option value="" className="text-gray-500">Género</option>
              <option className="text-gray-800">Femenino</option>
              <option className="text-gray-800">Masculino</option>
              <option className="text-gray-800">Otro</option>
              <option className="text-gray-800">Prefiero no decir</option>
            </select>
            <input 
              placeholder="🌍 Nacionalidad" 
              value={nacionalidad} 
              onChange={(e) => setNacionalidad(e.target.value)} 
              className="border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            />
          </div>

          {/* Contacto de emergencia */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              🆘 Contacto de emergencia
            </label>
            <input 
              required 
              placeholder="Nombre" 
              value={contactoNombre} 
              onChange={(e) => setContactoNombre(e.target.value)} 
              className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none mb-3"
            />
            <div className="grid grid-cols-2 gap-3">
              <input 
                required 
                placeholder="Teléfono" 
                value={contactoTelefono} 
                onChange={(e) => setContactoTelefono(e.target.value)} 
                className="border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
              <input 
                required 
                placeholder="Parentesco" 
                value={contactoParentesco} 
                onChange={(e) => setContactoParentesco(e.target.value)} 
                className="border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>
          </div>

          {/* Información médica */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              🏥 Información médica
            </label>
            <input 
              placeholder="Enfermedad" 
              value={enfermedad} 
              onChange={(e) => setEnfermedad(e.target.value)} 
              className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none mb-3"
            />
            <input 
              placeholder="Alergia" 
              value={alergia} 
              onChange={(e) => setAlergia(e.target.value)} 
              className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none mb-3"
            />
            <input 
              placeholder="Dieta especial" 
              value={dieta} 
              onChange={(e) => setDieta(e.target.value)} 
              className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none mb-3"
            />
            <textarea 
              placeholder="Sugerencias (opcional)" 
              value={sugerencias} 
              onChange={(e) => setSugerencias(e.target.value)} 
              rows={3}
              className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
            />
          </div>

          {/* Grupo */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={tieneGrupo} 
                onChange={(e) => setTieneGrupo(e.target.checked)} 
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 cursor-pointer"
              />
              Viajo en grupo
            </label>
          </div>

          {tieneGrupo && (
            <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 bg-blue-50">
              <p className="text-xs text-gray-500 mb-3">El viaje y el contacto de emergencia son los mismos para todo el grupo.</p>
              {acompanantes.map((a, i) => {
                const edadAcomp = calcularEdad(a.fechaNacimiento)
                return (
                  <div key={i} className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-medium text-gray-700">👤 Acompañante {i + 1}</p>
                      <button 
                        type="button" 
                        onClick={() => quitarAcompanante(i)} 
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        ✕ Quitar
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input 
                        placeholder="Nombre" 
                        value={a.nombre} 
                        onChange={(e) => actualizarAcompanante(i, 'nombre', e.target.value)} 
                        className="border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                      <input 
                        placeholder="Apellido" 
                        value={a.apellido} 
                        onChange={(e) => actualizarAcompanante(i, 'apellido', e.target.value)} 
                        className="border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input 
                        placeholder="DNI" 
                        value={a.documento} 
                        onChange={(e) => actualizarAcompanante(i, 'documento', e.target.value)} 
                        className="border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Fecha nacimiento</label>
                        <input 
                          type="date" 
                          value={a.fechaNacimiento} 
                          onChange={(e) => actualizarAcompanante(i, 'fechaNacimiento', e.target.value)} 
                          className="w-full border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <select 
                        value={a.parentesco} 
                        onChange={(e) => actualizarAcompanante(i, 'parentesco', e.target.value)} 
                        className="border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      >
                        <option value="" className="text-gray-500">Parentesco</option>
                        <option className="text-gray-800">Hijo/a</option>
                        <option className="text-gray-800">Pareja</option>
                        <option className="text-gray-800">Hermano/a</option>
                        <option className="text-gray-800">Padre/Madre</option>
                        <option className="text-gray-800">Otro</option>
                      </select>
                      <input 
                        placeholder="🌍 Nacionalidad" 
                        value={a.nacionalidad} 
                        onChange={(e) => actualizarAcompanante(i, 'nacionalidad', e.target.value)} 
                        className="border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                    </div>
                    {a.fechaNacimiento && edadAcomp !== null && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600">
                          Edad: <span className="font-medium text-blue-600">{edadAcomp} años</span>
                        </p>
                      </div>
                    )}
                    <input 
                      placeholder="Enfermedad" 
                      value={a.enfermedad} 
                      onChange={(e) => actualizarAcompanante(i, 'enfermedad', e.target.value)} 
                      className="w-full border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none mb-2"
                    />
                    <input 
                      placeholder="Alergia" 
                      value={a.alergia} 
                      onChange={(e) => actualizarAcompanante(i, 'alergia', e.target.value)} 
                      className="w-full border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none mb-2"
                    />
                    <input 
                      placeholder="Dieta especial" 
                      value={a.dieta} 
                      onChange={(e) => actualizarAcompanante(i, 'dieta', e.target.value)} 
                      className="w-full border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                )
              })}
              <button 
                type="button" 
                onClick={agregarAcompanante} 
                className="w-full border-2 border-dashed border-blue-300 rounded-xl p-3 text-sm text-blue-600 hover:bg-blue-100 hover:border-blue-400 transition-all font-medium"
              >
                + Agregar acompañante
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={enviando} 
            className="w-full rounded-xl p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold disabled:opacity-50 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            {enviando ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </span>
            ) : (
              '📨 Enviar inscripción'
            )}
          </button>
        </form>
      </div>
    </main>
  )
}