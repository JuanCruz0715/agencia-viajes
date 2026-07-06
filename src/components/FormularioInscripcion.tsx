'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type Viaje = { id: string; destino: string; fecha_inicio: string; fecha_fin: string; precio: number }

type Acompanante = {
  nombre: string
  apellido: string
  tipoDocumento: string
  documento: string
  genero: string
  fechaNacimiento: string
  parentesco: string
  enfermedad: string
  alergia: string
  dieta: string
  nacionalidad: string
}

const acompananteVacio: Acompanante = {
  nombre: '', apellido: '', tipoDocumento: 'DNI', documento: '',
  genero: '', fechaNacimiento: '', parentesco: '', enfermedad: '',
  alergia: '', dieta: '', nacionalidad: ''
}

function calcularEdad(fechaNacimiento: string) {
  if (!fechaNacimiento) return null
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--
  return edad
}

function soloLetras(valor: string) {
  return /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/.test(valor.trim())
}

function soloNumeros(valor: string) {
  return /^\d+$/.test(valor.trim())
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validarDocumento(tipo: string, numero: string) {
  if (!numero.trim()) return 'El documento es requerido'
  if (!soloNumeros(numero.replace(/\./g, ''))) return 'Solo debe contener números'
  const limpio = numero.replace(/\./g, '')
  if (tipo === 'DNI') {
    if (limpio.length < 7 || limpio.length > 8) return 'El DNI debe tener 7 u 8 dígitos'
  }
  return null
}

function validarTelefono(tel: string) {
  const limpio = tel.replace(/[\s\-\(\)]/g, '')
  if (!limpio) return 'El teléfono es requerido'
  if (!/^\+?[\d]{8,15}$/.test(limpio)) return 'Ingresá un teléfono válido (mínimo 8 dígitos)'
  return null
}

function claseInput(error?: string, touched?: boolean) {
  if (!touched) return 'w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none'
  if (error) return 'w-full border-2 border-red-400 rounded-xl p-3 bg-red-50 text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all outline-none'
  return 'w-full border-2 border-green-400 rounded-xl p-3 bg-green-50 text-gray-800 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none'
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

  // Touched states para mostrar errores solo después de que el usuario tocó el campo
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  function touch(campo: string) {
    setTouched(prev => ({ ...prev, [campo]: true }))
  }

  // Errores en tiempo real
  const errores = {
    viaje: !viajeId ? 'Seleccioná un viaje' : null,
    nombre: !nombre.trim() ? 'El nombre es requerido' : !soloLetras(nombre) ? 'Solo letras, sin números' : null,
    apellido: !apellido.trim() ? 'El apellido es requerido' : !soloLetras(apellido) ? 'Solo letras, sin números' : null,
    documento: validarDocumento(tipoDocumento, numeroDocumento),
    email: !email.trim() ? 'El email es requerido' : !validarEmail(email) ? 'Ingresá un email válido (ej: juan@gmail.com)' : null,
    telefono: validarTelefono(telefono),
    fechaNacimiento: !fechaNacimiento ? 'La fecha de nacimiento es requerida' :
      calcularEdad(fechaNacimiento)! < 0 ? 'La fecha no puede ser futura' :
      calcularEdad(fechaNacimiento)! > 110 ? 'Revisá la fecha ingresada' : null,
    contactoNombre: !contactoNombre.trim() ? 'El nombre del contacto es requerido' : !soloLetras(contactoNombre) ? 'Solo letras' : null,
    contactoTelefono: validarTelefono(contactoTelefono),
    contactoParentesco: !contactoParentesco.trim() ? 'El parentesco es requerido' : null,
  }

  const hayErrores = Object.values(errores).some(Boolean)

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

    // Marcar todos los campos como tocados para mostrar todos los errores
    const todosTouched: Record<string, boolean> = {}
    Object.keys(errores).forEach(k => { todosTouched[k] = true })
    setTouched(todosTouched)

    if (hayErrores) {
      setErrorMsg('Por favor corregí los errores antes de enviar.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Validar acompañantes
    for (let i = 0; i < acompanantes.length; i++) {
      const a = acompanantes[i]
      if (!a.nombre.trim() || !a.apellido.trim()) {
        setErrorMsg(`El acompañante ${i + 1} debe tener nombre y apellido.`)
        return
      }
      if (!a.documento.trim()) {
        setErrorMsg(`El acompañante ${i + 1} debe tener documento.`)
        return
      }
    }

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
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      nombre_pasajero: `${nombre.trim()} ${apellido.trim()}`,
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento.trim(),
      email_pasajero: email.trim().toLowerCase(),
      telefono_pasajero: telefono.trim(),
      fecha_nacimiento: fechaNacimiento || null,
      genero_pasajero: genero,
      nacionalidad: nacionalidad.trim() || null,
      contacto_emergencia_nombre: contactoNombre.trim(),
      contacto_emergencia_telefono: contactoTelefono.trim(),
      contacto_emergencia_parentesco: contactoParentesco.trim(),
      enfermedad: enfermedad.trim(),
      alergia: alergia.trim(),
      dieta_especial: dieta.trim(),
      sugerencias: sugerencias.trim(),
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
        nombre: a.nombre.trim(),
        apellido: a.apellido.trim(),
        nombre_pasajero: `${a.nombre.trim()} ${a.apellido.trim()}`,
        tipo_documento: a.tipoDocumento || 'DNI',
        numero_documento: a.documento.trim(),
        genero_pasajero: a.genero || null,
        fecha_nacimiento: a.fechaNacimiento || null,
        parentesco_con_titular: a.parentesco,
        nacionalidad: a.nacionalidad.trim() || null,
        contacto_emergencia_nombre: contactoNombre.trim(),
        contacto_emergencia_telefono: contactoTelefono.trim(),
        contacto_emergencia_parentesco: contactoParentesco.trim(),
        enfermedad: a.enfermedad.trim(),
        alergia: a.alergia.trim(),
        dieta_especial: a.dieta.trim(),
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
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">✈️ SN Viajes y Turismo</h1>
        <div className="flex justify-center mb-4">
          <div className="relative w-56 h-24">
            <Image src="/logo-sn.png" alt="SN Viajes y Turismo" fill sizes="224px" className="object-contain" priority />
          </div>
        </div>
        <p className="text-sm text-gray-500 text-center mb-2">Completá tus datos para confirmar tu lugar</p>
        <p className="text-xs text-center text-red-500 mb-4">* Los campos marcados son obligatorios</p>
        <div className="w-20 h-1 bg-blue-500 mx-auto mb-6 rounded-full"></div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 font-medium">⚠️ {errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* VIAJE */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">📍 Viaje *</label>
            <select
              required
              value={viajeId}
              onChange={(e) => { setViajeId(e.target.value); touch('viaje') }}
              onBlur={() => touch('viaje')}
              className={`w-full border-2 rounded-xl p-3 text-gray-800 focus:ring-2 transition-all outline-none ${
                !touched.viaje ? 'border-gray-200 bg-white' :
                errores.viaje ? 'border-red-400 bg-red-50 focus:ring-red-200' :
                'border-green-400 bg-green-50 focus:ring-green-200'
              }`}
            >
              <option value="">Seleccioná un viaje</option>
              {viajes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.destino} · {v.fecha_inicio} a {v.fecha_fin} · ${v.precio?.toLocaleString('es-AR')}
                </option>
              ))}
            </select>
            {touched.viaje && errores.viaje && <p className="text-xs text-red-500 mt-1">⚠ {errores.viaje}</p>}
          </div>

          {/* DATOS PERSONALES */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">👤 Tus datos *</label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <input
                  required
                  placeholder="Nombre *"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onBlur={() => touch('nombre')}
                  className={claseInput(errores.nombre || undefined, touched.nombre)}
                />
                {touched.nombre && errores.nombre && <p className="text-xs text-red-500 mt-1">⚠ {errores.nombre}</p>}
              </div>
              <div>
                <input
                  required
                  placeholder="Apellido *"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  onBlur={() => touch('apellido')}
                  className={claseInput(errores.apellido || undefined, touched.apellido)}
                />
                {touched.apellido && errores.apellido && <p className="text-xs text-red-500 mt-1">⚠ {errores.apellido}</p>}
              </div>
            </div>

            {/* DOCUMENTO */}
            <div className="grid grid-cols-3 gap-3 mb-1">
              <select
                value={tipoDocumento}
                onChange={(e) => { setTipoDocumento(e.target.value); touch('documento') }}
                className="border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              >
                <option>DNI</option>
                <option>Pasaporte</option>
                <option>LE</option>
                <option>LC</option>
              </select>
              <input
                required
                placeholder="Número *"
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value.replace(/\D/g, ''))}
                onBlur={() => touch('documento')}
                maxLength={8}
                className={`col-span-2 ${claseInput(errores.documento || undefined, touched.documento)}`}
              />
            </div>
            {touched.documento && errores.documento && <p className="text-xs text-red-500 mt-1">⚠ {errores.documento}</p>}
            <p className="text-xs text-gray-400 mt-1">Solo números, sin puntos ni espacios</p>
          </div>

          {/* EMAIL */}
          <div>
            <input
              required
              type="email"
              placeholder="📧 Email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => touch('email')}
              className={claseInput(errores.email || undefined, touched.email)}
            />
            {touched.email && errores.email && <p className="text-xs text-red-500 mt-1">⚠ {errores.email}</p>}
          </div>

          {/* TELÉFONO */}
          <div>
            <input
              required
              placeholder="📱 Teléfono * (ej: 2645551234)"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/[^\d\s\-\(\)\+]/g, ''))}
              onBlur={() => touch('telefono')}
              className={claseInput(errores.telefono || undefined, touched.telefono)}
            />
            {touched.telefono && errores.telefono && <p className="text-xs text-red-500 mt-1">⚠ {errores.telefono}</p>}
            <p className="text-xs text-gray-400 mt-1">Sin guiones ni paréntesis, incluí el código de área</p>
          </div>

          {/* FECHA DE NACIMIENTO */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">🎂 Fecha de nacimiento *</label>
            <input
              type="date"
              required
              value={fechaNacimiento}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              onBlur={() => touch('fechaNacimiento')}
              className={claseInput(errores.fechaNacimiento || undefined, touched.fechaNacimiento)}
            />
            {touched.fechaNacimiento && errores.fechaNacimiento && <p className="text-xs text-red-500 mt-1">⚠ {errores.fechaNacimiento}</p>}
            {fechaNacimiento && edadTitular !== null && !errores.fechaNacimiento && (
              <div className="mt-2 p-2 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-gray-700">
                  Edad: <span className="font-semibold text-blue-600">{edadTitular} años</span>
                  {edadTitular < 3 && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">👶 No ocupa butaca</span>}
                  {edadTitular >= 3 && edadTitular < 18 && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">🧒 Menor de edad</span>}
                </p>
              </div>
            )}
          </div>

          {/* GÉNERO Y NACIONALIDAD */}
          <div className="grid grid-cols-2 gap-3">
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              className="border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            >
              <option value="">Género</option>
              <option>Femenino</option>
              <option>Masculino</option>
              <option>Otro</option>
              <option>Prefiero no decir</option>
            </select>
            <input
              placeholder="🌍 Nacionalidad"
              value={nacionalidad}
              onChange={(e) => setNacionalidad(e.target.value)}
              className="border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            />
          </div>

          {/* CONTACTO DE EMERGENCIA */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">🆘 Contacto de emergencia *</label>
            <input
              required
              placeholder="Nombre y apellido *"
              value={contactoNombre}
              onChange={(e) => setContactoNombre(e.target.value)}
              onBlur={() => touch('contactoNombre')}
              className={`${claseInput(errores.contactoNombre || undefined, touched.contactoNombre)} mb-1`}
            />
            {touched.contactoNombre && errores.contactoNombre && <p className="text-xs text-red-500 mb-2">⚠ {errores.contactoNombre}</p>}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <input
                  required
                  placeholder="Teléfono *"
                  value={contactoTelefono}
                  onChange={(e) => setContactoTelefono(e.target.value.replace(/[^\d\s\-\(\)\+]/g, ''))}
                  onBlur={() => touch('contactoTelefono')}
                  className={claseInput(errores.contactoTelefono || undefined, touched.contactoTelefono)}
                />
                {touched.contactoTelefono && errores.contactoTelefono && <p className="text-xs text-red-500 mt-1">⚠ {errores.contactoTelefono}</p>}
              </div>
              <div>
                <input
                  required
                  placeholder="Parentesco *"
                  value={contactoParentesco}
                  onChange={(e) => setContactoParentesco(e.target.value)}
                  onBlur={() => touch('contactoParentesco')}
                  className={claseInput(errores.contactoParentesco || undefined, touched.contactoParentesco)}
                />
                {touched.contactoParentesco && errores.contactoParentesco && <p className="text-xs text-red-500 mt-1">⚠ {errores.contactoParentesco}</p>}
              </div>
            </div>
          </div>

          {/* INFORMACIÓN MÉDICA */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">🏥 Información médica <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input
              placeholder="¿Alguna enfermedad? Si no, dejá en blanco"
              value={enfermedad}
              onChange={(e) => setEnfermedad(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none mb-3"
            />
            <input
              placeholder="¿Alguna alergia? Si no, dejá en blanco"
              value={alergia}
              onChange={(e) => setAlergia(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none mb-3"
            />
            <input
              placeholder="¿Dieta especial? (vegana, celíaca, etc.)"
              value={dieta}
              onChange={(e) => setDieta(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none mb-3"
            />
            <textarea
              placeholder="Sugerencias o comentarios para el viaje (opcional)"
              value={sugerencias}
              onChange={(e) => setSugerencias(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
            />
            {sugerencias && <p className="text-xs text-gray-400 text-right">{sugerencias.length}/500</p>}
          </div>

          {/* GRUPO */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={tieneGrupo}
                onChange={(e) => setTieneGrupo(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 cursor-pointer"
              />
              Viajo con más personas (familia o grupo)
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
                      <button type="button" onClick={() => quitarAcompanante(i)} className="text-xs text-red-500 hover:text-red-700 font-medium">✕ Quitar</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        placeholder="Nombre *"
                        value={a.nombre}
                        onChange={(e) => actualizarAcompanante(i, 'nombre', e.target.value)}
                        className="border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                      <input
                        placeholder="Apellido *"
                        value={a.apellido}
                        onChange={(e) => actualizarAcompanante(i, 'apellido', e.target.value)}
                        className="border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                    </div>
                    <div className="flex gap-2 mb-3">
                      <select
                        value={a.tipoDocumento || 'DNI'}
                        onChange={(e) => actualizarAcompanante(i, 'tipoDocumento', e.target.value)}
                        className="border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 focus:border-blue-500 transition-all outline-none"
                      >
                        <option>DNI</option>
                        <option>Pasaporte</option>
                        <option>LE</option>
                        <option>LC</option>
                      </select>
                      <input
                        placeholder="Número de documento *"
                        value={a.documento}
                        onChange={(e) => actualizarAcompanante(i, 'documento', e.target.value.replace(/\D/g, ''))}
                        maxLength={8}
                        className="text-center border-2 border-gray-200 rounded-xl p-2.0 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 transition-all outline-none"
                      />
                    </div>
                    <select
                      value={a.genero || ''}
                      onChange={(e) => actualizarAcompanante(i, 'genero', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 focus:border-blue-500 transition-all outline-none mb-3"
                    >
                      <option value="">Género</option>
                      <option>Femenino</option>
                      <option>Masculino</option>
                      <option>Otro</option>
                      <option>Prefiero no decir</option>
                    </select>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Fecha nacimiento</label>
                        <input
                          type="date"
                          value={a.fechaNacimiento}
                          max={new Date().toISOString().split('T')[0]}
                          onChange={(e) => actualizarAcompanante(i, 'fechaNacimiento', e.target.value)}
                          className="w-full border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 focus:border-blue-500 transition-all outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Parentesco</label>
                        <select
                          value={a.parentesco}
                          onChange={(e) => actualizarAcompanante(i, 'parentesco', e.target.value)}
                          className="w-full border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 focus:border-blue-500 transition-all outline-none"
                        >
                          <option value="">Parentesco</option>
                          <option>Hijo/a</option>
                          <option>Pareja</option>
                          <option>Hermano/a</option>
                          <option>Padre/Madre</option>
                          <option>Otro</option>
                        </select>
                      </div>
                    </div>
                    {a.fechaNacimiento && edadAcomp !== null && (
                      <div className="mt-1 mb-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600">
                          Edad: <span className="font-medium text-blue-600">{edadAcomp} años</span>
                          {edadAcomp < 3 && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 rounded-full">👶 No ocupa butaca</span>}
                          {edadAcomp >= 3 && edadAcomp < 18 && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 rounded-full">🧒 Menor</span>}
                        </p>
                      </div>
                    )}
                    <input
                      placeholder="Enfermedad (si tiene)"
                      value={a.enfermedad}
                      onChange={(e) => actualizarAcompanante(i, 'enfermedad', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 transition-all outline-none mb-2"
                    />
                    <input
                      placeholder="Alergia (si tiene)"
                      value={a.alergia}
                      onChange={(e) => actualizarAcompanante(i, 'alergia', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 transition-all outline-none mb-2"
                    />
                    <input
                      placeholder="Dieta especial (si tiene)"
                      value={a.dieta}
                      onChange={(e) => actualizarAcompanante(i, 'dieta', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 transition-all outline-none"
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
              <p className="text-sm text-red-600">⚠️ {errorMsg}</p>
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
            ) : '📨 Enviar inscripción'}
          </button>
        </form>
      </div>
    </main>
  )
}