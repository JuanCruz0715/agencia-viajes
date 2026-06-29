'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Viaje = { id: string; destino: string; fecha_inicio: string; fecha_fin: string;precio: number }

type Acompanante = {
  nombre: string
  documento: string
  fechaNacimiento: string
  parentesco: string
  enfermedad: string
  alergia: string
  dieta: string
}

const acompananteVacio: Acompanante = {
  nombre: '', documento: '', fechaNacimiento: '', parentesco: '', enfermedad: '', alergia: '', dieta: ''
}

export default function FormularioInscripcion({ viajes }: { viajes: Viaje[] }) {
  const [viajeId, setViajeId] = useState('')
  const [nombre, setNombre] = useState('')
  const [tipoDocumento, setTipoDocumento] = useState('DNI')
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [genero, setGenero] = useState('')
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
      nombre_pasajero: nombre,
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      email_pasajero: email,
      telefono_pasajero: telefono,
      fecha_nacimiento: fechaNacimiento || null,
      genero_pasajero: genero,
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
        nombre_pasajero: a.nombre,
        numero_documento: a.documento,
        fecha_nacimiento: a.fechaNacimiento || null,
        parentesco_con_titular: a.parentesco,
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
      <main className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold mb-2">¡Listo! ✅</h1>
          <p className="text-gray-500">Tu inscripción fue enviada correctamente. La agencia la va a revisar y te va a contactar.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <h1 className="text-xl font-semibold text-center mb-1">Travesía viajes</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Completá tus datos para confirmar tu lugar</p>

        <p className="text-sm font-medium mt-4 mb-2">Viaje</p>
        <select required value={viajeId} onChange={(e) => setViajeId(e.target.value)} className="w-full border rounded-lg p-2 mb-4">
          <option value="">Seleccioná un viaje</option>
          {viajes.map((v) => (
            <option key={v.id} value={v.id}>{v.destino} · {v.fecha_inicio} a {v.fecha_fin} · ${v.precio?.toLocaleString('es-AR')}</option>
          ))}
        </select>

        <p className="text-sm font-medium mb-2">Tus datos</p>
        <input required placeholder="Nombre y apellido completo" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />
        <div className="flex gap-2 mb-3">
          <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} className="border rounded-lg p-2">
            <option>DNI</option>
            <option>Pasaporte</option>
          </select>
          <input required placeholder="Número de documento" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} className="flex-1 border rounded-lg p-2" />
        </div>
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />
        <input required placeholder="Teléfono celular" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />
        <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />
        <select value={genero} onChange={(e) => setGenero(e.target.value)} className="w-full border rounded-lg p-2 mb-4">
          <option value="">Género</option>
          <option>Femenino</option>
          <option>Masculino</option>
          <option>Otro</option>
          <option>Prefiero no decir</option>
        </select>

        <p className="text-sm font-medium mb-2">Contacto de emergencia</p>
        <input required placeholder="Nombre" value={contactoNombre} onChange={(e) => setContactoNombre(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />
        <input required placeholder="Teléfono" value={contactoTelefono} onChange={(e) => setContactoTelefono(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />
        <input required placeholder="Parentesco" value={contactoParentesco} onChange={(e) => setContactoParentesco(e.target.value)} className="w-full border rounded-lg p-2 mb-4" />

        <p className="text-sm font-medium mb-2">Información médica y alimentaria</p>
        <input placeholder="¿Enfermedad? ¿Cuál?" value={enfermedad} onChange={(e) => setEnfermedad(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />
        <input placeholder="¿Alergia? ¿Cuál?" value={alergia} onChange={(e) => setAlergia(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />
        <input placeholder="Dieta o requerimiento especial" value={dieta} onChange={(e) => setDieta(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />
        <textarea placeholder="Sugerencias para el viaje (opcional)" value={sugerencias} onChange={(e) => setSugerencias(e.target.value)} className="w-full border rounded-lg p-2 mb-4" />

        <label className="flex items-center gap-2 text-sm mb-3 border-t pt-4">
          <input type="checkbox" checked={tieneGrupo} onChange={(e) => setTieneGrupo(e.target.checked)} />
          Viajo con más personas (familia o grupo)
        </label>

        {tieneGrupo && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-3">El viaje y el contacto de emergencia son los mismos para todo el grupo.</p>
            {acompanantes.map((a, i) => (
              <div key={i} className="border rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">Acompañante {i + 1}</p>
                  <button type="button" onClick={() => quitarAcompanante(i)} className="text-xs text-red-600">Quitar</button>
                </div>
                <input placeholder="Nombre y apellido" value={a.nombre} onChange={(e) => actualizarAcompanante(i, 'nombre', e.target.value)} className="w-full border rounded-lg p-2 mb-2" />
                <div className="flex gap-2 mb-2">
                  <input placeholder="DNI" value={a.documento} onChange={(e) => actualizarAcompanante(i, 'documento', e.target.value)} className="flex-1 border rounded-lg p-2" />
                  <input type="date" value={a.fechaNacimiento} onChange={(e) => actualizarAcompanante(i, 'fechaNacimiento', e.target.value)} className="flex-1 border rounded-lg p-2" />
                </div>
                <select value={a.parentesco} onChange={(e) => actualizarAcompanante(i, 'parentesco', e.target.value)} className="w-full border rounded-lg p-2 mb-2">
                  <option value="">Parentesco con el titular</option>
                  <option>Hijo/a</option>
                  <option>Pareja</option>
                  <option>Hermano/a</option>
                  <option>Padre/Madre</option>
                  <option>Otro</option>
                </select>
                <input placeholder="Enfermedad (si posee)" value={a.enfermedad} onChange={(e) => actualizarAcompanante(i, 'enfermedad', e.target.value)} className="w-full border rounded-lg p-2 mb-2" />
                <input placeholder="Alergia (si posee)" value={a.alergia} onChange={(e) => actualizarAcompanante(i, 'alergia', e.target.value)} className="w-full border rounded-lg p-2 mb-2" />
                <input placeholder="Dieta especial (si posee)" value={a.dieta} onChange={(e) => actualizarAcompanante(i, 'dieta', e.target.value)} className="w-full border rounded-lg p-2" />
              </div>
            ))}
            <button type="button" onClick={agregarAcompanante} className="w-full border rounded-lg p-2 text-sm">+ Agregar acompañante</button>
          </div>
        )}

        {errorMsg && <p className="text-sm text-red-600 mb-3">{errorMsg}</p>}

        <button type="submit" disabled={enviando} className="w-full border rounded-lg p-2 bg-gray-900 text-white disabled:opacity-50">
          {enviando ? 'Enviando...' : 'Enviar inscripción'}
        </button>
      </form>
    </main>
  )
}