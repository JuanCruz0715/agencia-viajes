'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { aprobarPasajero, aprobarGrupo, registrarPago, cancelarPasajero, deshacerPago } from '@/app/viaje/[id]/actions'
import ModalPago from '@/components/ModalPago'
import ModalDetallePasajero from '@/components/ModalDetallePasajero'
import ModalEditarPasajero from '@/components/ModalEditarPasajero'
import ModalCancelarPasajero from '@/components/ModalCancelarPasajero'
import BotonExportarPasajeros from '@/components/BotonExportarPasajeros'
import BotonExportarCNRT from '@/components/BotonExportarCNRT'
import ModalDeshacerPago from '@/components/ModalDeshacerPago'
import { createClient } from '@/lib/supabase/client'

const SN_AZUL = '#1B3A5C'
const SN_CELESTE = '#2D9CB8'
const SN_AMARILLO = '#F2B632'
const BG_PAGINA = '#0B1620'
const BG_CARD = '#15212C'
const BORDE = '#1E2D3D'
const TEXTO_MUTED = '#9FB3C2'

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
  nombre: string
  apellido: string
  tipo_documento: string
  numero_documento: string
  genero_pasajero?: string
  parentesco_con_titular?: string
  fecha_nacimiento?: string
  nacionalidad?: string
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
    nacionalidad?: string
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

type MiembroGrupoPago = {
  id: string
  nombre: string
  montoTotal?: number
  montoPagado?: number
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
  const [miembrosGrupo, setMiembrosGrupo] = useState<MiembroGrupoPago[]>([])
  const [cancelando, setCancelando] = useState<Pasajero | null>(null)
  const [procesandoCancelacion, setProcesandoCancelacion] = useState(false)
  const [deshacerModal, setDeshacerModal] = useState<{
    id: string
    monto: number
    metodo_pago: string
    numero_recibo: number
    pasajero_nombre: string
  } | null>(null)
  const [procesandoDeshacer, setProcesandoDeshacer] = useState(false)

  async function handleRegistrarPago(
    pasajeroId: string,
    monto: number,
    metodo: string,
    tipoTarjeta?: string,
    cuotas?: number,
    recargo?: number
  ) {
    if (!monto || monto <= 0) return
    setAprobando(pasajeroId)
    const resultado = await registrarPago(pasajeroId, monto, metodo, viaje.id, false, undefined, tipoTarjeta, cuotas, recargo)
    setAprobando(null)
    setPasajeroModal(null)
    if (resultado.pagoId) {
      window.open(`/recibo/${resultado.pagoId}`, '_blank')
    }
  }

  async function handleRegistrarPagoGrupal(
    miembrosIds: string[],
    monto: number,
    metodo: string,
    tipoTarjeta?: string,
    cuotas?: number,
    recargo?: number
  ) {
    if (!monto || monto <= 0) return
    setAprobando('grupo')
    const supabase = createClient()

    const { data: primerMiembro } = await supabase
      .from('pasajeros')
      .select('grupo_id')
      .eq('id', miembrosIds[0])
      .single()

    const grupoId = primerMiembro?.grupo_id
    if (!grupoId) {
      alert('Error: No se encontró el grupo')
      setAprobando(null)
      return
    }

    const { data: titular, error: errorTitular } = await supabase
      .from('pasajeros')
      .select('id')
      .eq('grupo_id', grupoId)
      .eq('es_titular', true)
      .single()

    if (errorTitular || !titular) {
      alert('Error: No se encontró el titular del grupo')
      setAprobando(null)
      return
    }

    const resultado = await registrarPago(titular.id, monto, metodo, viaje.id, true, grupoId, tipoTarjeta, cuotas, recargo)

    const { data: acompanantes } = await supabase
      .from('pasajeros')
      .select('id')
      .eq('grupo_id', grupoId)
      .neq('es_titular', true)

    if (acompanantes && acompanantes.length > 0) {
      for (const acomp of acompanantes) {
        await supabase.from('pasajeros').update({ estado_pago: 'pagado' }).eq('id', acomp.id)
      }
    }

    setAprobando(null)
    setPasajeroModal(null)
    setPagoGrupal(false)
    setMiembrosGrupo([])
    router.refresh()

    if (resultado.pagoId) {
      window.open(`/recibo/${resultado.pagoId}`, '_blank')
    }
  }

  async function handleAbrirDeshacerPago(pasajeroId: string, nombrePasajero: string) {
    const supabase = createClient()
    const { data: pagos } = await supabase
      .from('pagos')
      .select('id, monto, metodo_pago, numero_recibo')
      .eq('pasajero_id', pasajeroId)
      .eq('eliminado', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!pagos || pagos.length === 0) {
      alert('No se encontró ningún pago registrado para este pasajero')
      return
    }

    const ultimoPago = pagos[0]
    setDeshacerModal({
      id: ultimoPago.id,
      monto: ultimoPago.monto,
      metodo_pago: ultimoPago.metodo_pago || 'No especificado',
      numero_recibo: ultimoPago.numero_recibo || 0,
      pasajero_nombre: nombrePasajero
    })
  }

  async function handleDeshacerPago(motivo: string) {
    if (!deshacerModal) return
    setProcesandoDeshacer(true)
    const resultado = await deshacerPago(deshacerModal.id, motivo)
    setProcesandoDeshacer(false)
    setDeshacerModal(null)
    if (resultado.error) {
      alert('Error al deshacer el pago: ' + resultado.error)
    } else {
      router.refresh()
    }
  }

  async function handleAprobarPasajero(id: string, iniciales?: string) {
    setDetalleModal(null)
    try {
      const resultado = await aprobarPasajero(id, viaje.id, iniciales)
      if (resultado?.error) {
        alert('Error al aprobar: ' + resultado.error)
      }
      router.refresh()
    } catch (error) {
      alert('Error: ' + String(error))
    }
  }

  async function handleAprobarGrupo(grupoId: string, iniciales?: string) {
    setDetalleModal(null)
    try {
      const resultado = await aprobarGrupo(grupoId, viaje.id, iniciales)
      if (resultado?.error) {
        alert('Error al aprobar: ' + resultado.error)
      }
      router.refresh()
    } catch (error) {
      alert('Error: ' + String(error))
    }
  }

  const handleEliminarViaje = async () => {
    setEliminando(true)
    const supabase = createClient()
    try {
      const { error: errorPasajeros } = await supabase.from('pasajeros').delete().eq('viaje_id', viaje.id)
      if (errorPasajeros) throw errorPasajeros
      const { error: errorHojaRuta } = await supabase.from('hoja_ruta').delete().eq('viaje_id', viaje.id)
      if (errorHojaRuta) throw errorHojaRuta
      const { error: errorViaje } = await supabase.from('viajes').delete().eq('id', viaje.id)
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
    const supabase = createClient()
    try {
      const { error } = await supabase.from('pasajeros').delete().eq('id', pasajeroId)
      if (error) throw error
      setDetalleModal(null)
      router.refresh()
    } catch (error) {
      console.error('Error al eliminar pasajero:', error)
      alert('Error al eliminar el pasajero')
    }
  }

  const handleEliminarGrupo = async (grupoId: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase.from('pasajeros').delete().eq('grupo_id', grupoId)
      if (error) throw error
      setDetalleModal(null)
      router.refresh()
    } catch (error) {
      console.error('Error al eliminar grupo:', error)
      alert('Error al eliminar el grupo')
    }
  }

  const handleGuardarEdicion = async (data: EdicionData) => {
    setGuardandoEdicion(true)
    const supabase = createClient()
    try {
      const { error: errorTitular } = await supabase
        .from('pasajeros')
        .update({
          nombre: data.titular.nombre,
          apellido: data.titular.apellido,
          nombre_pasajero: `${data.titular.nombre} ${data.titular.apellido}`,
          numero_documento: data.titular.numero_documento,
          tipo_documento: data.titular.tipo_documento,
          email_pasajero: data.titular.email_pasajero,
          telefono_pasajero: data.titular.telefono_pasajero,
          fecha_nacimiento: data.titular.fecha_nacimiento,
          genero_pasajero: data.titular.genero_pasajero,
          nacionalidad: data.titular.nacionalidad,
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

      if (data.acompanantes && data.acompanantes.length > 0) {
        for (const acompanante of data.acompanantes) {
          const { error: errorAcompanante } = await supabase
            .from('pasajeros')
            .update({
              nombre: acompanante.nombre,
              apellido: acompanante.apellido,
              nombre_pasajero: `${acompanante.nombre} ${acompanante.apellido}`,
              numero_documento: acompanante.numero_documento,
              tipo_documento: acompanante.tipo_documento,
              genero_pasajero: acompanante.genero_pasajero,
              parentesco_con_titular: acompanante.parentesco_con_titular,
              fecha_nacimiento: acompanante.fecha_nacimiento,
              nacionalidad: acompanante.nacionalidad,
              enfermedad: acompanante.enfermedad,
              alergia: acompanante.alergia,
              dieta_especial: acompanante.dieta_especial,
            })
            .eq('id', acompanante.id)
          if (errorAcompanante) throw errorAcompanante
        }
      }

      setEditando(null)
      setGuardandoEdicion(false)
      router.refresh()
    } catch (error) {
      console.error('Error al guardar edición:', error)
      alert('Error al guardar los cambios')
      setGuardandoEdicion(false)
    }
  }

  const handleCancelarPasajero = async (data: { motivo: string; tipoReembolso: string; montoReembolsado: number }) => {
    if (!cancelando) return
    setProcesandoCancelacion(true)
    const resultado = await cancelarPasajero(cancelando.id, viaje.id, data)
    setProcesandoCancelacion(false)
    setCancelando(null)
    setDetalleModal(null)
    if (resultado.error) {
      alert('Error al cancelar: ' + resultado.error)
    } else {
      if (resultado.cancelacionId) {
        window.open(`/voucher-cancelacion/${resultado.cancelacionId}`, '_blank')
      }
      router.refresh()
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
    setAprobando(null)
    setDetalleModal({ pasajero, esGrupo: false, miembros: [pasajero] })
  }

  const abrirDetalleGrupo = (grupoId: string, miembros: Pasajero[]) => {
    setAprobando(null)
    const titular = miembros.find((m) => m.es_titular) ?? miembros[0]
    setDetalleModal({ pasajero: titular, esGrupo: true, miembros })
  }

  const abrirEdicion = () => {
    if (detalleModal) {
      setEditando(detalleModal)
      setDetalleModal(null)
    }
  }

  const totalMenores3 = pasajeros.filter(p => p.es_menor_3).length
  const totalMenores18 = pasajeros.filter(p => p.es_menor_18).length

  return (
    <main className="min-h-screen" style={{ background: BG_PAGINA }}>
      <nav className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between" style={{ background: SN_AZUL, boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2" style={{ borderColor: SN_CELESTE }}>
            <Image src="/logo-sn.png" alt="SN Viajes" fill className="object-cover" sizes="40px" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">SN Viajes <span style={{ color: SN_AMARILLO }}>&</span> Turismo</p>
            <p className="text-xs mt-0.5" style={{ color: '#7AAEC4' }}>Detalle del viaje</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <BotonExportarPasajeros pasajeros={pasajeros} viajeNombre={viaje.destino} />
          <BotonExportarCNRT pasajeros={pasajeros} viajeNombre={viaje.destino} />
          <Link
            href={`/viaje/${viaje.id}/editar`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all hover:scale-[1.02]"
            style={{ background: SN_AMARILLO, color: SN_AZUL }}
          >
            Editar
          </Link>
          <button
            onClick={() => setMostrarConfirmacionEliminar(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl"
            style={{ background: '#DC2626', color: 'white' }}
          >
            Eliminar
          </button>
          <Link
            href="/home"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#9FC8DC', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            Volver
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'white' }}>{viaje.destino}</h1>
            <p className="text-sm" style={{ color: TEXTO_MUTED }}>📅 {viaje.fecha_inicio} → {viaje.fecha_fin}</p>
            <p className="text-sm mt-1" style={{ color: TEXTO_MUTED }}>👥 {confirmados.length}/{viaje.cupo_total} pasajeros confirmados</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl px-4 py-2 text-center" style={{ background: BG_CARD, border: `1px solid ${BORDE}` }}>
              <p className="text-xs" style={{ color: TEXTO_MUTED }}>Confirmados</p>
              <p className="text-xl font-bold" style={{ color: 'white' }}>{confirmados.length}</p>
            </div>
            <div className="rounded-xl px-4 py-2 text-center" style={{ background: BG_CARD, border: `1px solid ${BORDE}` }}>
              <p className="text-xs" style={{ color: TEXTO_MUTED }}>Pendientes</p>
              <p className="text-xl font-bold" style={{ color: SN_AMARILLO }}>{pendientes.length}</p>
            </div>
            <div className="rounded-xl px-4 py-2 text-center" style={{ background: BG_CARD, border: `1px solid ${BORDE}` }}>
              <p className="text-xs" style={{ color: TEXTO_MUTED }}>Cupo</p>
              <p className="text-xl font-bold" style={{ color: SN_CELESTE }}>{viaje.cupo_total}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-xl" style={{ background: BG_CARD, border: `1px solid ${BORDE}` }}>
          <div>
            <p className="text-xs" style={{ color: TEXTO_MUTED }}>Total pasajeros</p>
            <p className="text-lg font-semibold" style={{ color: 'white' }}>{pasajeros.length}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: TEXTO_MUTED }}>👶 Menores de 3 (sin butaca)</p>
            <p className="text-lg font-semibold" style={{ color: SN_CELESTE }}>{totalMenores3}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: TEXTO_MUTED }}>🧒 Menores de 18</p>
            <p className="text-lg font-semibold" style={{ color: SN_AMARILLO }}>{totalMenores18}</p>
          </div>
        </div>

        <div className="flex gap-6 mb-6" style={{ borderBottom: `1px solid ${BORDE}` }}>
          {(['pasajeros', 'ruta', 'pagos'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="pb-2 px-1 text-sm font-medium transition-all"
              style={tab === t
                ? { borderBottom: `2px solid ${SN_CELESTE}`, color: 'white' }
                : { color: TEXTO_MUTED, borderBottom: '2px solid transparent' }}
            >
              {t === 'pasajeros' ? '👥 Pasajeros' : t === 'ruta' ? '🗺️ Hoja de ruta' : '💳 Pagos'}
            </button>
          ))}
        </div>

        {/* ===== PESTAÑA PASAJEROS ===== */}
        {tab === 'pasajeros' && (
          <div>
            <h2 className="font-medium mb-3 text-sm" style={{ color: SN_CELESTE }}>Pendientes de revisión ({pendientes.length})</h2>
            <div className="rounded-xl mb-6 overflow-hidden" style={{ background: BG_CARD, border: `1px solid ${BORDE}` }}>
              {pendientes.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-sm" style={{ color: TEXTO_MUTED }}>✅ No hay pasajeros pendientes</p>
                </div>
              )}
              {Object.entries(gruposPendientes).map(([grupoId, miembros]) => {
                const titular = miembros.find((m) => m.es_titular) ?? miembros[0]
                const resto = miembros.filter((m) => m.id !== titular.id)
                const abierto = expandido[grupoId]
                return (
                  <div key={grupoId} style={{ borderBottom: `1px solid ${BORDE}` }}>
                    <div className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
                      <button onClick={() => toggleGrupo(grupoId)} className="text-left flex-1">
                        <p className="text-sm" style={{ color: 'white' }}>
                          {titular.nombre} {titular.apellido}
                          {resto.length > 0 && <span style={{ color: TEXTO_MUTED }}> +{resto.length}</span>}
                        </p>
                        <p className="text-xs" style={{ color: TEXTO_MUTED }}>
                          DNI {titular.numero_documento} · {miembros.length} integrante{miembros.length > 1 ? 's' : ''}
                        </p>
                      </button>
                      <button
                        onClick={() => abrirDetalleGrupo(grupoId, miembros)}
                        className="text-xs rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80"
                        style={{ border: `1px solid ${SN_CELESTE}`, color: SN_CELESTE }}
                      >
                        Ver detalle
                      </button>
                    </div>
                    {abierto && resto.length > 0 && (
                      <div className="pl-6 pb-2 space-y-1">
                        {resto.map((m) => (
                          <p key={m.id} className="text-xs" style={{ color: TEXTO_MUTED }}>
                            {m.nombre} {m.apellido} · {m.parentesco_con_titular || 'acompañante'}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {individualesPendientes.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors" style={{ borderBottom: `1px solid ${BORDE}` }}>
                  <div>
                    <p className="text-sm" style={{ color: 'white' }}>{p.nombre} {p.apellido}</p>
                    <p className="text-xs" style={{ color: TEXTO_MUTED }}>DNI {p.numero_documento}</p>
                  </div>
                  <button
                    onClick={() => abrirDetalleIndividual(p)}
                    className="text-xs rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80"
                    style={{ border: `1px solid ${SN_CELESTE}`, color: SN_CELESTE }}
                  >
                    Ver detalle
                  </button>
                </div>
              ))}
            </div>

            <h2 className="font-medium mb-3 text-sm" style={{ color: SN_CELESTE }}>Confirmados ({confirmados.length})</h2>
            <div className="rounded-xl overflow-hidden" style={{ background: BG_CARD, border: `1px solid ${BORDE}` }}>
              {confirmados.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-sm" style={{ color: TEXTO_MUTED }}>Todavía no hay pasajeros confirmados</p>
                </div>
              )}
              {Object.entries(gruposConfirmados).map(([grupoId, miembros]) => {
                const titular = miembros.find((m) => m.es_titular) ?? miembros[0]
                const resto = miembros.filter((m) => m.id !== titular.id)
                const abierto = expandido[grupoId]
                const montoTotalGrupo = miembros.reduce((sum, m) => sum + (m.monto_total || 0), 0)
                const montoPagadoGrupo = miembros.reduce((sum, m) => sum + (m.monto_pagado || 0), 0)
                const grupoCompleto = (montoTotalGrupo - montoPagadoGrupo) <= 0
                const pagaron = grupoCompleto ? miembros.length : miembros.filter(m => m.estado_pago === 'pagado').length
                return (
                  <div key={grupoId} style={{ borderBottom: `1px solid ${BORDE}` }}>
                    <div className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
                      <button onClick={() => toggleGrupo(grupoId)} className="text-left flex-1">
                        <p className="text-sm" style={{ color: 'white' }}>
                          {titular.nombre} {titular.apellido}
                          {resto.length > 0 && <span style={{ color: TEXTO_MUTED }}> +{resto.length}</span>}
                        </p>
                      </button>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#FAEEDA', color: '#854F0B' }}>
                          {pagaron} de {miembros.length} pagaron
                        </span>
                        <button
                          onClick={() => abrirDetalleGrupo(grupoId, miembros)}
                          className="text-xs rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80"
                          style={{ border: `1px solid ${SN_CELESTE}`, color: SN_CELESTE }}
                        >
                          Ver detalle
                        </button>
                      </div>
                    </div>
                    {abierto && resto.length > 0 && (
                      <div className="pl-6 pb-2 space-y-1">
                        {resto.map((m) => (
                          <div key={m.id} className="flex items-center justify-between">
                            <p className="text-xs" style={{ color: TEXTO_MUTED }}>
                              {m.nombre} {m.apellido} · {m.parentesco_con_titular || 'acompañante'}
                            </p>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={m.estado_pago === 'pagado'
                                ? { background: 'rgba(59,109,17,0.2)', color: '#7EC55A' }
                                : { background: '#FAEEDA', color: '#854F0B' }}
                            >
                              {m.estado_pago === 'pagado' ? 'Pagado' : '💰 Sin pago'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* INDIVIDUALES EN PASAJEROS - solo badge de pago + ver detalle */}
              {individualesConfirmados.map((p) => {
                const deuda = (p.monto_total || 0) - (p.monto_pagado || 0)
                const estaPagado = p.estado_pago === 'pagado' || deuda <= 0
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors" style={{ borderBottom: `1px solid ${BORDE}` }}>
                    <p className="text-sm" style={{ color: 'white' }}>{p.nombre} {p.apellido}</p>
                    <div className="flex gap-2">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={estaPagado
                          ? { background: 'rgba(59,109,17,0.2)', color: '#7EC55A' }
                          : { background: '#FAEEDA', color: '#854F0B' }}
                      >
                        {estaPagado ? '✅ Pagado' : '💰 Sin pago'}
                      </span>
                      <button
                        onClick={() => abrirDetalleIndividual(p)}
                        className="text-xs rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80"
                        style={{ border: `1px solid ${SN_CELESTE}`, color: SN_CELESTE }}
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ===== PESTAÑA HOJA DE RUTA ===== */}
        {tab === 'ruta' && (
          <div className="space-y-3">
            {hojaRuta.length === 0 && (
              <div className="text-center py-12 rounded-xl" style={{ background: BG_CARD, border: `1px dashed ${BORDE}` }}>
                <p className="text-3xl mb-2">🗺️</p>
                <p className="text-sm" style={{ color: TEXTO_MUTED }}>Todavía no se cargó la hoja de ruta</p>
              </div>
            )}
            {hojaRuta.map((dia) => (
              <div key={dia.id} className="rounded-xl p-4" style={{ background: BG_CARD, border: `1px solid ${BORDE}`, borderLeft: `3px solid ${SN_CELESTE}` }}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(45,156,184,0.15)', color: SN_CELESTE }}>
                    Día {dia.dia_numero}
                  </span>
                  {dia.fecha && <span className="text-xs" style={{ color: TEXTO_MUTED }}>{dia.fecha}</span>}
                  {dia.hora_inicio && (
                    <span className="text-xs" style={{ color: TEXTO_MUTED }}>
                      🕐 {dia.hora_inicio.slice(0, 5)} - {dia.hora_fin?.slice(0, 5)}
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'white' }}>{dia.actividad}</p>
                {dia.lugar && <p className="text-xs" style={{ color: TEXTO_MUTED }}>📍 {dia.lugar}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ===== PESTAÑA PAGOS ===== */}
        {tab === 'pagos' && (
          <div className="rounded-xl overflow-hidden" style={{ background: BG_CARD, border: `1px solid ${BORDE}` }}>
            {confirmados.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-sm" style={{ color: TEXTO_MUTED }}>No hay pasajeros confirmados todavía</p>
              </div>
            )}

            {/* GRUPOS EN PAGOS */}
            {Object.entries(gruposConfirmados).map(([grupoId, miembros]) => {
              const titular = miembros.find((m) => m.es_titular) ?? miembros[0]
              const montoTotalGrupo = miembros.reduce((sum, m) => sum + (m.monto_total || 0), 0)
              const montoPagadoGrupo = miembros.reduce((sum, m) => sum + (m.monto_pagado || 0), 0)
              const deudaRestante = montoTotalGrupo - montoPagadoGrupo
              const todosPagados = deudaRestante <= 0
              const tienePagosGrupo = montoPagadoGrupo > 0

              return (
                <div key={grupoId} className="p-4 hover:bg-white/5 transition-colors" style={{ borderBottom: `1px solid ${BORDE}` }}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'white' }}>{titular.nombre} {titular.apellido} y grupo</p>
                      <p className="text-xs" style={{ color: TEXTO_MUTED }}>
                        {miembros.length} personas · ${montoPagadoGrupo.toLocaleString()} de ${montoTotalGrupo.toLocaleString()}
                      </p>
                      {deudaRestante > 0 && (
                        <p className="text-xs" style={{ color: SN_AMARILLO }}>Falta: ${deudaRestante.toLocaleString()}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {todosPagados ? (
                        <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(59,109,17,0.2)', color: '#7EC55A' }}>
                          ✅ Grupo pagado
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setPasajeroModal({ id: grupoId, nombre: `${titular.nombre} ${titular.apellido} y grupo` })
                            setPagoGrupal(true)
                            setMiembrosGrupo(miembros.map(m => ({
                              id: m.id,
                              nombre: `${m.nombre || ''} ${m.apellido || ''}`.trim() || 'Sin nombre',
                              montoTotal: m.monto_total || 0,
                              montoPagado: m.monto_pagado || 0
                            })))
                          }}
                          className="text-xs rounded-lg px-3 py-1.5 font-medium border-none transition-opacity hover:opacity-85"
                          style={{ background: SN_AMARILLO, color: SN_AZUL }}
                        >
                          Registrar pago grupal
                        </button>
                      )}
                      {tienePagosGrupo && (
                        <button
                          onClick={() => handleAbrirDeshacerPago(titular.id, `${titular.nombre || ''} ${titular.apellido || ''}`.trim())}
                          className="text-xs px-2 py-1 rounded-lg transition-colors"
                          style={{ color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }}
                        >
                          Deshacer pago
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* INDIVIDUALES EN PAGOS - registrar + deshacer */}
            {individualesConfirmados.map((p) => {
              const deuda = (p.monto_total || 0) - (p.monto_pagado || 0)
              const estaPagado = p.estado_pago === 'pagado' || deuda <= 0
              const tienePagos = (p.monto_pagado || 0) > 0
              return (
                <div key={p.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors" style={{ borderBottom: `1px solid ${BORDE}` }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'white' }}>{p.nombre} {p.apellido}</p>
                    <p className="text-xs" style={{ color: TEXTO_MUTED }}>
                      ${p.monto_pagado?.toLocaleString() ?? 0} de ${p.monto_total?.toLocaleString() ?? 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {estaPagado ? (
                      <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(59,109,17,0.2)', color: '#7EC55A' }}>
                        ✅ Pagado
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setPasajeroModal({ id: p.id, nombre: `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin nombre' })
                          setPagoGrupal(false)
                          setMiembrosGrupo([])
                        }}
                        className="text-xs rounded-lg px-3 py-1.5 font-medium border-none transition-opacity hover:opacity-85"
                        style={{ background: SN_AMARILLO, color: SN_AZUL }}
                      >
                        Registrar pago
                      </button>
                    )}
                    {tienePagos && (
                      <button
                        onClick={() => handleAbrirDeshacerPago(p.id, `${p.nombre || ''} ${p.apellido || ''}`.trim())}
                        className="text-xs px-2 py-1 rounded-lg transition-colors"
                        style={{ color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }}
                      >
                        Deshacer pago
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ===== MODALES ===== */}
        {detalleModal && (
          <ModalDetallePasajero
            pasajero={detalleModal.pasajero}
            esGrupo={detalleModal.esGrupo}
            miembros={detalleModal.miembros}
            estaAprobando={aprobando === detalleModal.pasajero.id || aprobando === detalleModal.miembros[0]?.grupo_id}
            onAprobar={(iniciales) => {
              if (detalleModal.esGrupo) {
                handleAprobarGrupo(detalleModal.miembros[0].grupo_id!, iniciales)
              } else {
                handleAprobarPasajero(detalleModal.pasajero.id, iniciales)
              }
            }}
            onCancel={() => { setAprobando(null); setDetalleModal(null) }}
            onEliminar={() => {
              setAprobando(null)
              if (detalleModal.esGrupo) {
                handleEliminarGrupo(detalleModal.miembros[0].grupo_id!)
              } else {
                handleEliminarPasajero(detalleModal.pasajero.id)
              }
            }}
            onEditar={() => { setAprobando(null); abrirEdicion() }}
            onCancelar={() => { setCancelando(detalleModal.pasajero); setDetalleModal(null) }}
          />
        )}

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

        {cancelando && (
          <ModalCancelarPasajero
            pasajero={cancelando}
            onConfirm={handleCancelarPasajero}
            onCancel={() => setCancelando(null)}
            guardando={procesandoCancelacion}
          />
        )}

        {pasajeroModal && (
          <ModalPago
            nombrePasajero={pasajeroModal.nombre}
            esGrupo={pagoGrupal}
            miembros={miembrosGrupo}
            guardando={aprobando === pasajeroModal.id}
            onCancel={() => { setPasajeroModal(null); setPagoGrupal(false); setMiembrosGrupo([]); setAprobando(null) }}
            onConfirm={(monto, metodo, tipoTarjeta, cuotas, recargo) => {
              if (pagoGrupal && miembrosGrupo.length > 0) {
                handleRegistrarPagoGrupal(miembrosGrupo.map(m => m.id), monto, metodo, tipoTarjeta, cuotas, recargo)
              } else {
                handleRegistrarPago(pasajeroModal.id, monto, metodo, tipoTarjeta, cuotas, recargo)
              }
            }}
          />
        )}

        {deshacerModal && (
          <ModalDeshacerPago
            pago={{
              id: deshacerModal.id,
              monto: deshacerModal.monto,
              metodo_pago: deshacerModal.metodo_pago,
              numero_recibo: deshacerModal.numero_recibo,
              pasajeros: {
                nombre: deshacerModal.pasajero_nombre.split(' ')[0] || '',
                apellido: deshacerModal.pasajero_nombre.split(' ').slice(1).join(' ') || '',
                nombre_pasajero: deshacerModal.pasajero_nombre
              }
            }}
            onConfirm={handleDeshacerPago}
            onCancel={() => setDeshacerModal(null)}
            guardando={procesandoDeshacer}
          />
        )}

        {mostrarConfirmacionEliminar && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-2">¿Eliminar viaje?</h3>
              <p className="text-gray-600 mb-4">
                ¿Estás seguro que deseas eliminar el viaje a <strong>{viaje.destino}</strong>?
                <br />
                <span className="text-sm text-red-600">Se eliminarán todos los pasajeros y la hoja de ruta asociados.</span>
                <br />
                <span className="text-sm font-semibold text-red-600">Esta acción no se puede deshacer.</span>
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
      </div>
    </main>
  )
}