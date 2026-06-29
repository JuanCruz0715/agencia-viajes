'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { aprobarPasajero, aprobarGrupo, registrarPago } from '@/app/viaje/[id]/actions'
import ModalPago from '@/components/ModalPago'
import ModalDetallePasajero from '@/components/ModalDetallePasajero'
import ModalEditarPasajero from '@/components/ModalEditarPasajero'
import { createClient } from '@/lib/supabase/client'
import BotonExportarPasajeros from '@/components/BotonExportarPasajeros'

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

type Viaje = {
  id: string
  destino: string
  fecha_inicio: string
  fecha_fin: string
  cupo_total: number
  descripcion: string | null
}

type Dia = {
  id: string
  dia_numero: number
  fecha: string | null
  hora_inicio: string | null
  hora_fin: string | null
  actividad: string
  lugar: string | null
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

function agruparPasajeros(lista: Pasajero[]) {
  const grupos: Record<string, Pasajero[]> = {}
  const individuales: Pasajero[] = []
  lista.forEach((p) => {
    if (p.grupo_id) {
      if (!grupos[p.grupo_id]) grupos[p.grupo_id] = []
      grupos[p.grupo_id].push(p)
    } else {
      individuales.push(p)
    }
  })
  return { grupos, individuales }
}

export default function FichaViaje({ viaje, pasajeros, hojaRuta }: { viaje: Viaje; pasajeros: Pasajero[]; hojaRuta: Dia[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<'pasajeros' | 'ruta' | 'pagos'>('pasajeros')
  const [expandido, setExpandido] = useState<Record<string, boolean>>({})
  const [aprobando, setAprobando] = useState<string | null>(null)
  const [pasajeroModal, setPasajeroModal] = useState<{ id: string; nombre: string } | null>(null)
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [detalleModal, setDetalleModal] = useState<{
    pasajero: Pasajero
    esGrupo: boolean
    miembros: Pasajero[]
  } | null>(null)
  const [editando, setEditando] = useState<{
    pasajero: Pasajero
    esGrupo: boolean
    miembros: Pasajero[]
  } | null>(null)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
const [pagoGrupal, setPagoGrupal] = useState(false)
const [miembrosGrupo, setMiembrosGrupo] = useState<{ id: string; nombre: string }[]>([])


  async function handleRegistrarPago(pasajeroId: string, monto: number, metodo: string) {
    if (!monto || monto <= 0) return
    setAprobando(pasajeroId)
    const resultado = await registrarPago(pasajeroId, monto, metodo, viaje.id)
    setAprobando(null)
    setPasajeroModal(null)
    if (resultado.pagoId) {
      window.open(`/recibo/${resultado.pagoId}`, '_blank')
    }
  }

  async function handleAprobarPasajero(id: string) {
    console.log('🟢 handleAprobarPasajero llamado para ID:', id)
    setAprobando(id)
    await aprobarPasajero(id, viaje.id)
    console.log('✅ Pasajero aprobado')
    setAprobando(null)
    setDetalleModal(null)
    router.refresh()
  }

  async function handleAprobarGrupo(grupoId: string) {
    console.log('🟢 handleAprobarGrupo llamado para grupo:', grupoId)
    setAprobando(grupoId)
    await aprobarGrupo(grupoId, viaje.id)
    console.log('✅ Grupo aprobado')
    setAprobando(null)
    setDetalleModal(null)
    router.refresh()
  }
async function handleRegistrarPagoGrupal(miembrosIds: string[], monto: number, metodo: string) {
  if (!monto || monto <= 0) return
  setAprobando('grupo')
  
  // Obtener el grupoId del primer miembro
  const supabase = createClient()
  const { data: primerMiembro } = await supabase
    .from('pasajeros')
    .select('grupo_id')
    .eq('id', miembrosIds[0])
    .single()
  
  const grupoId = primerMiembro?.grupo_id
  const idsRecibos: string[] = []
  
  // Registrar pago para cada miembro del grupo
  for (const id of miembrosIds) {
    const resultado = await registrarPago(
      id, 
      monto, // El monto ya viene dividido desde el modal
      metodo, 
      viaje.id,
      true, // esPagoGrupal
      grupoId || undefined
    )
    
    if (resultado.pagoId) {
      idsRecibos.push(resultado.pagoId)
    }
  }
  
  setAprobando(null)
  setPasajeroModal(null)
  setPagoGrupal(false)
  setMiembrosGrupo([])
  router.refresh()
  
  // Abrir recibos en nuevas pestañas
  if (idsRecibos.length > 0) {
    // Si hay varios recibos, abrir el primero (o todos en pestañas)
    // Abrir el recibo del titular o el primero
    window.open(`/recibo/${idsRecibos[0]}`, '_blank')
    
    // Si quieres abrir todos los recibos (puede ser molesto para el usuario)
    // idsRecibos.forEach(id => window.open(`/recibo/${id}`, '_blank'))
  }
}
  const handleEliminarViaje = async () => {
    setEliminando(true)
    const supabase = createClient()

    try {
      const { error: errorPasajeros } = await supabase
        .from('pasajeros')
        .delete()
        .eq('viaje_id', viaje.id)

      if (errorPasajeros) throw errorPasajeros

      const { error: errorHojaRuta } = await supabase
        .from('hoja_ruta')
        .delete()
        .eq('viaje_id', viaje.id)

      if (errorHojaRuta) throw errorHojaRuta

      const { error: errorViaje } = await supabase
        .from('viajes')
        .delete()
        .eq('id', viaje.id)

      if (errorViaje) throw errorViaje

      router.push('/home')
      router.refresh()
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('Error al eliminar el viaje')
      setEliminando(false)
      setMostrarConfirmacionEliminar(false)
    }
  }

  const handleEliminarPasajero = async (pasajeroId: string) => {
    console.log('🔴 handleEliminarPasajero llamado para ID:', pasajeroId)
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('pasajeros')
        .delete()
        .eq('id', pasajeroId)

      if (error) throw error
      
      console.log('✅ Pasajero eliminado')
      setDetalleModal(null)
      router.refresh()
    } catch (error) {
      console.error('❌ Error al eliminar pasajero:', error)
      alert('Error al eliminar el pasajero')
    }
  }

  const handleEliminarGrupo = async (grupoId: string) => {
    console.log('🔴 handleEliminarGrupo llamado para grupo:', grupoId)
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('pasajeros')
        .delete()
        .eq('grupo_id', grupoId)

      if (error) throw error
      
      console.log('✅ Grupo eliminado')
      setDetalleModal(null)
      router.refresh()
    } catch (error) {
      console.error('❌ Error al eliminar grupo:', error)
      alert('Error al eliminar el grupo')
    }
  }

  const handleGuardarEdicion = async (data: EdicionData) => {
    console.log('📝 handleGuardarEdicion llamado')
    setGuardandoEdicion(true)
    const supabase = createClient()

    try {
      // Actualizar titular
      const { error: errorTitular } = await supabase
        .from('pasajeros')
        .update({
          nombre_pasajero: data.titular.nombre_pasajero,
          numero_documento: data.titular.numero_documento,
          tipo_documento: data.titular.tipo_documento,
          email_pasajero: data.titular.email_pasajero,
          telefono_pasajero: data.titular.telefono_pasajero,
          fecha_nacimiento: data.titular.fecha_nacimiento,
          genero_pasajero: data.titular.genero_pasajero,
          contacto_emergencia_nombre: data.titular.contacto_emergencia_nombre,
          contacto_emergencia_telefono: data.titular.contacto_emergencia_telefono,
          contacto_emergencia_parentesco: data.titular.contacto_emergencia_parentesco,
          enfermedad: data.titular.enfermedad,
          alergia: data.titular.alergia,
          dieta_especial: data.titular.dieta_especial,
          sugerencias: data.titular.sugerencias,
          parentesco_con_titular: data.titular.parentesco_con_titular,
        })
        .eq('id', data.titular.id)

      if (errorTitular) throw errorTitular

      // Actualizar acompañantes si es grupo
      if (data.acompanantes && data.acompanantes.length > 0) {
        for (const acompanante of data.acompanantes) {
          const { error: errorAcompanante } = await supabase
            .from('pasajeros')
            .update({
              nombre_pasajero: acompanante.nombre_pasajero,
              numero_documento: acompanante.numero_documento,
              parentesco_con_titular: acompanante.parentesco_con_titular,
              fecha_nacimiento: acompanante.fecha_nacimiento,
              enfermedad: acompanante.enfermedad,
              alergia: acompanante.alergia,
              dieta_especial: acompanante.dieta_especial,
            })
            .eq('id', acompanante.id)

          if (errorAcompanante) throw errorAcompanante
        }
      }

      console.log('✅ Edición guardada correctamente')
      setEditando(null)
      setGuardandoEdicion(false)
      router.refresh()
    } catch (error) {
      console.error('❌ Error al guardar edición:', error)
      alert('Error al guardar los cambios')
      setGuardandoEdicion(false)
    }
  }

  function toggleGrupo(grupoId: string) {
    setExpandido((prev) => ({ ...prev, [grupoId]: !prev[grupoId] }))
  }

  const pendientes = pasajeros.filter((p) => p.estado_revision === 'pendiente')
  const confirmados = pasajeros.filter((p) => p.estado_revision === 'aprobado')

  const { grupos: gruposPendientes, individuales: individualesPendientes } = agruparPasajeros(pendientes)
  const { grupos: gruposConfirmados, individuales: individualesConfirmados } = agruparPasajeros(confirmados)

  const abrirDetalleIndividual = (pasajero: Pasajero) => {
    console.log('🟢 abrirDetalleIndividual llamado para:', pasajero.nombre_pasajero)
    setDetalleModal({
      pasajero,
      esGrupo: false,
      miembros: [pasajero]
    })
  }

  const abrirDetalleGrupo = (grupoId: string, miembros: Pasajero[]) => {
    console.log('🟢 abrirDetalleGrupo llamado para grupo:', grupoId)
    const titular = miembros.find((m) => m.es_titular) ?? miembros[0]
    setDetalleModal({
      pasajero: titular,
      esGrupo: true,
      miembros
    })
  }

  const abrirEdicion = () => {
    console.log('🟣 abrirEdicion llamado')
    if (detalleModal) {
      setEditando(detalleModal)
      setDetalleModal(null)
    }
  }

  return (
    <main className="p-8 max-w-5xl mx-auto">
      
      <div className="flex items-center justify-between">
  <a href="/home" className="text-sm text-gray-500">&larr; Volver</a>
  <div className="flex gap-2">
    <BotonExportarPasajeros 
      pasajeros={pasajeros} 
      viajeNombre={viaje.destino} 
    />
    <a href={`/viaje/${viaje.id}/editar`} className="text-sm border rounded-lg px-3 py-1">
      Editar viaje
    </a>
    <button
      onClick={() => setMostrarConfirmacionEliminar(true)}
      className="text-sm border rounded-lg px-3 py-1 bg-red-600 text-white hover:bg-red-700"
    >
      Eliminar
    </button>
  </div>
</div>

      <h1 className="text-2xl font-semibold mt-2">{viaje.destino}</h1>
      <p className="text-gray-500">{viaje.fecha_inicio} - {viaje.fecha_fin}</p>
      <p className="text-gray-500 mt-2">{confirmados.length}/{viaje.cupo_total} pasajeros confirmados</p>

      <div className="flex gap-6 border-b mt-6 mb-6">
        <button onClick={() => setTab('pasajeros')} className={`pb-2 ${tab === 'pasajeros' ? 'border-b-2 border-gray-900 font-medium' : 'text-gray-500'}`}>Pasajeros</button>
        <button onClick={() => setTab('ruta')} className={`pb-2 ${tab === 'ruta' ? 'border-b-2 border-gray-900 font-medium' : 'text-gray-500'}`}>Hoja de ruta</button>
        <button onClick={() => setTab('pagos')} className={`pb-2 ${tab === 'pagos' ? 'border-b-2 border-gray-900 font-medium' : 'text-gray-500'}`}>Pagos</button>
      </div>

      {tab === 'pasajeros' && (
        <div>
          <h2 className="font-medium mb-2">Pendientes de revisión ({pendientes.length})</h2>
          <div className="border rounded-lg mb-6">
            {pendientes.length === 0 && <p className="p-4 text-sm text-gray-500">No hay pasajeros pendientes.</p>}

            {Object.entries(gruposPendientes).map(([grupoId, miembros]) => {
              const titular = miembros.find((m) => m.es_titular) ?? miembros[0]
              const resto = miembros.filter((m) => m.id !== titular.id)
              const abierto = expandido[grupoId]
              return (
                <div key={grupoId} className="border-b last:border-b-0">
                  <div className="flex items-center justify-between p-3">
                    <button 
                      onClick={() => toggleGrupo(grupoId)} 
                      className="text-left flex-1"
                    >
                      <p className="text-sm">
                        {titular.nombre_pasajero}
                        {resto.length > 0 && <span className="text-gray-500"> +{resto.length}</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        DNI {titular.numero_documento} · {miembros.length} integrante{miembros.length > 1 ? 's' : ''}
                      </p>
                    </button>
                    <button
                      onClick={() => abrirDetalleGrupo(grupoId, miembros)}
                      className="text-sm border rounded px-3 py-1 hover:bg-gray-50"
                    >
                      Ver detalle
                    </button>
                  </div>
                  {abierto && resto.length > 0 && (
                    <div className="pl-6 pb-2">
                      {resto.map((m) => (
                        <p key={m.id} className="text-xs text-gray-500 py-1">
                          {m.nombre_pasajero} · {m.parentesco_con_titular || 'acompañante'}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {individualesPendientes.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                <div>
                  <p className="text-sm">{p.nombre_pasajero}</p>
                  <p className="text-xs text-gray-500">DNI {p.numero_documento}</p>
                </div>
                <button
                  onClick={() => abrirDetalleIndividual(p)}
                  className="text-sm border rounded px-3 py-1 hover:bg-gray-50"
                >
                  Ver detalle
                </button>
              </div>
            ))}
          </div>

          <h2 className="font-medium mb-2">Confirmados ({confirmados.length})</h2>
          <div className="border rounded-lg">
            {confirmados.length === 0 && <p className="p-4 text-sm text-gray-500">Todavía no hay pasajeros confirmados.</p>}

            {Object.entries(gruposConfirmados).map(([grupoId, miembros]) => {
              const titular = miembros.find((m) => m.es_titular) ?? miembros[0]
              const resto = miembros.filter((m) => m.id !== titular.id)
              const abierto = expandido[grupoId]
              const pagaron = miembros.filter((m) => m.estado_pago === 'pagado').length
              return (
                <div key={grupoId} className="border-b last:border-b-0">
                  <div className="flex items-center justify-between p-3">
                    <button 
                      onClick={() => toggleGrupo(grupoId)} 
                      className="text-left flex-1"
                    >
                      <p className="text-sm">
                        {titular.nombre_pasajero}
                        {resto.length > 0 && <span className="text-gray-500"> +{resto.length}</span>}
                      </p>
                    </button>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">
                        {pagaron} de {miembros.length} pagaron
                      </span>
                      <button
                        onClick={() => abrirDetalleGrupo(grupoId, miembros)}
                        className="text-sm border rounded px-3 py-1 hover:bg-gray-50"
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                  {abierto && resto.length > 0 && (
                    <div className="pl-6 pb-2">
                      {resto.map((m) => (
                        <div key={m.id} className="flex items-center justify-between py-1">
                          <p className="text-xs text-gray-500">{m.nombre_pasajero} · {m.parentesco_con_titular || 'acompañante'}</p>
                          <span className={`text-xs px-2 py-0.5 rounded ${m.estado_pago === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {m.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {individualesConfirmados.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                <p className="text-sm">{p.nombre_pasajero}</p>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${p.estado_pago === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {p.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
                  </span>
                  <button
                    onClick={() => abrirDetalleIndividual(p)}
                    className="text-sm border rounded px-3 py-1 hover:bg-gray-50"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'ruta' && (
        <div>
          {hojaRuta.length === 0 && <p className="text-sm text-gray-500">Todavía no se cargó la hoja de ruta.</p>}
          {hojaRuta.map((dia) => (
            <div key={dia.id} className="border rounded-lg p-4 mb-3">
              <p className="text-sm text-gray-500 mb-1">
                Día {dia.dia_numero}{dia.fecha ? ` · ${dia.fecha}` : ''}
                {dia.hora_inicio ? ` · ${dia.hora_inicio.slice(0, 5)} a ${dia.hora_fin?.slice(0, 5)}` : ''}
              </p>
              <p>{dia.actividad}{dia.lugar ? ` — ${dia.lugar}` : ''}</p>
            </div>
          ))}
        </div>
      )}

     {tab === 'pagos' && (
  <div className="border rounded-lg">
    {confirmados.length === 0 && <p className="p-4 text-sm text-gray-500">No hay pasajeros confirmados todavía.</p>}
    
    {/* Agrupar por familia para mostrar un botón de pago grupal */}
    {Object.entries(gruposConfirmados).map(([grupoId, miembros]) => {
      const titular = miembros.find((m) => m.es_titular) ?? miembros[0]
      const todosPagados = miembros.every((m) => m.estado_pago === 'pagado')
      const montoTotalGrupo = miembros.reduce((sum, m) => sum + (m.monto_total || 0), 0)
      const montoPagadoGrupo = miembros.reduce((sum, m) => sum + (m.monto_pagado || 0), 0)
      const deudaRestante = montoTotalGrupo - montoPagadoGrupo

      return (
        <div key={grupoId} className="border-b last:border-b-0 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{titular.nombre_pasajero} y grupo</p>
              <p className="text-xs text-gray-500">
                {miembros.length} personas · ${montoPagadoGrupo.toLocaleString()} de ${montoTotalGrupo.toLocaleString()}
              </p>
              {deudaRestante > 0 && (
                <p className="text-xs text-amber-600">Falta: ${deudaRestante.toLocaleString()}</p>
              )}
            </div>
            {todosPagados ? (
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">✅ Grupo pagado</span>
            ) : (
              <button 
                onClick={() => {
                  setPasajeroModal({ 
                    id: grupoId, 
                    nombre: `${titular.nombre_pasajero} y grupo` 
                  })
                  setPagoGrupal(true)
                  setMiembrosGrupo(miembros.map(m => ({ 
                    id: m.id, 
                    nombre: m.nombre_pasajero,
                    montoTotal: m.monto_total || 0,
                    montoPagado: m.monto_pagado || 0
                  })))
                }} 
                className="text-sm border rounded px-3 py-1 hover:bg-gray-50"
              >
                Registrar pago grupal
              </button>
            )}
          </div>
        </div>
      )
    })}

    {/* Pasajeros individuales */}
    {individualesConfirmados.map((p) => {
      const deuda = (p.monto_total || 0) - (p.monto_pagado || 0)
      const estaPagado = p.estado_pago === 'pagado' || deuda <= 0
      
      return (
        <div key={p.id} className="flex items-center justify-between gap-3 p-3 border-b last:border-b-0">
          <div>
            <p className="text-sm">{p.nombre_pasajero}</p>
            <p className="text-xs text-gray-500">
              ${p.monto_pagado?.toLocaleString() ?? 0} de ${p.monto_total?.toLocaleString() ?? 0}
            </p>
          </div>
          {estaPagado ? (
            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">✅ Pagado</span>
          ) : (
            <button 
              onClick={() => {
                setPasajeroModal({ id: p.id, nombre: p.nombre_pasajero })
                setPagoGrupal(false)
                setMiembrosGrupo([])
              }} 
              className="text-sm border rounded px-3 py-1 hover:bg-gray-50"
            >
              Registrar pago
            </button>
          )}
        </div>
      )
    })}

   {pasajeroModal && (
      <ModalPago
        nombrePasajero={pasajeroModal.nombre}
        esGrupo={pagoGrupal}
        miembros={miembrosGrupo}
        guardando={aprobando === pasajeroModal.id}
        onCancel={() => {
          setPasajeroModal(null)
          setPagoGrupal(false)
          setMiembrosGrupo([])
        }}
        onConfirm={(monto, metodo) => {
          if (pagoGrupal && miembrosGrupo.length > 0) {
            // Pago grupal: registrar para todos los miembros
            handleRegistrarPagoGrupal(miembrosGrupo.map(m => m.id), monto, metodo)
          } else {
            // Pago individual
            handleRegistrarPago(pasajeroModal.id, monto, metodo)
          }
        }}
      />
    )}
  </div>
)}

      {/* Modal de detalle de pasajero */}
      {detalleModal && (
        <ModalDetallePasajero
          pasajero={detalleModal.pasajero}
          esGrupo={detalleModal.esGrupo}
          miembros={detalleModal.miembros}
          aprobando={aprobando === detalleModal.pasajero.id || aprobando === detalleModal.miembros[0]?.grupo_id}
          onAprobar={() => {
            console.log('📌 onAprobar llamado desde FichaViaje')
            if (detalleModal.esGrupo) {
              handleAprobarGrupo(detalleModal.miembros[0].grupo_id!)
            } else {
              handleAprobarPasajero(detalleModal.pasajero.id)
            }
          }}
          onCancel={() => {
            console.log('📌 onCancel llamado desde FichaViaje')
            setDetalleModal(null)
          }}
          onEliminar={() => {
            console.log('📌 onEliminar llamado desde FichaViaje')
            if (detalleModal.esGrupo) {
              handleEliminarGrupo(detalleModal.miembros[0].grupo_id!)
            } else {
              handleEliminarPasajero(detalleModal.pasajero.id)
            }
          }}
          onEditar={() => {
            console.log('📌 onEditar llamado desde FichaViaje')
            abrirEdicion()
          }}
        />
      )}

      {/* Modal de edición de pasajero */}
      {editando && (
        <ModalEditarPasajero
          pasajero={editando.pasajero}
          esGrupo={editando.esGrupo}
          miembros={editando.miembros}
          onGuardar={handleGuardarEdicion}
          onCancel={() => setEditando(null)}
          guardando={guardandoEdicion}
        />
      )}

      {/* Modal de confirmación para eliminar viaje */}
      {mostrarConfirmacionEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">¿Eliminar viaje?</h3>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro que deseas eliminar el viaje a <strong>{viaje.destino}</strong>?
              <br />
              <span className="text-sm text-red-600">
                Se eliminarán todos los pasajeros y la hoja de ruta asociados.
              </span>
              <br />
              <span className="text-sm font-semibold text-red-600">
                Esta acción no se puede deshacer.
              </span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarConfirmacionEliminar(false)}
                className="flex-1 border rounded-lg p-2 hover:bg-gray-50"
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarViaje}
                className="flex-1 bg-red-600 text-white rounded-lg p-2 hover:bg-red-700 disabled:opacity-50"
                disabled={eliminando}
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
              
            </div>
          </div>
        </div>
      )}
    </main>
  )
}