'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { aprobarPasajero, aprobarGrupo, registrarPago, cancelarPasajero, deshacerPago } from '@/app/viaje/[id]/actions'
import ModalPago from '@/components/ModalPago'
import ModalDetallePasajero from '@/components/ModalDetallePasajero'
import ModalEditarPasajero from '@/components/ModalEditarPasajero'
import ModalCancelarPasajero from '@/components/ModalCancelarPasajero'
import ModalHistorialPagos from '@/components/ModalHistorialPagos'
import BotonExportarPasajeros from '@/components/BotonExportarPasajeros'
import BotonExportarCNRT from '@/components/BotonExportarCNRT'
import ContenidoAsientos from '@/components/ContenidoAsientos'
import ContenidoItinerario from '@/components/ContenidoItinerario'
import ContenidoHoteles from '@/components/ContenidoHoteles'
import { createClient } from '@/lib/supabase/client'

// ============================================
// CONSTANTES
// ============================================

const SN_AZUL = '#1B3A5C'
const SN_CELESTE = '#2D9CB8'
const SN_AMARILLO = '#F2B632'
const BG_PAGINA = '#0B1620'
const BG_CARD = '#15212C'
const BORDE = '#1E2D3D'
const TEXTO_MUTED = '#9FB3C2'

// ============================================
// TIPOS
// ============================================

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
  viaje_id?: string | null
}

type Viaje = {
  id: string
  destino: string
  fecha_inicio: string
  fecha_fin: string
  cupo_total: number
  descripcion: string | null
  precio?: number | null
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

// ============================================
// TIPOS PARA HOJA DE RUTA
// ============================================

type Asiento = {
  numero: number
  estado: 'ocupado' | 'disponible' | 'cama_ocupada' | 'cama_libre'
  pasajeroId?: string
  nombrePasajero?: string
  tipo: 'semi_cama' | 'cama'
}

type PasajeroSinAsiento = {
  id: string
  nombre: string
  apellido: string
  iniciales: string
}

type Evento = {
  id: string
  dia: number
  fecha: string
  hora: string
  titulo: string
  descripcion: string
  ubicacion?: string
}

type Habitacion = {
  id: string
  numero: string
  tipo: string
  pasajeros: string[]
  capacidad: number
}

type Hotel = {
  nombre: string
  fechaInicio: string
  fechaFin: string
  noches: number
}

// ============================================
// TIPOS PARA MOVER PASAJERO
// ============================================

type ViajeDisponible = {
  id: string
  destino: string
  fecha_inicio: string
  fecha_fin: string
  precio: number | null
  cupo_total: number
  cupos_disponibles: number
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

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

// Generar asientos (60 asientos: 12 cama + 48 semi cama)
const generarAsientos = (): Asiento[] => {
  const asientos: Asiento[] = []
  
  // Asientos cama (1-12) - TODOS LIBRES
  for (let i = 1; i <= 12; i++) {
    asientos.push({
      numero: i,
      estado: 'cama_libre',
      tipo: 'cama',
      nombrePasajero: undefined,
      pasajeroId: undefined
    })
  }
  
  // Asientos semi cama (13-60) - TODOS DISPONIBLES
  for (let i = 13; i <= 60; i++) {
    asientos.push({
      numero: i,
      estado: 'disponible',
      tipo: 'semi_cama',
      nombrePasajero: undefined,
      pasajeroId: undefined
    })
  }
  
  return asientos
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function FichaViaje({ viaje, pasajeros, hojaRuta }: { viaje: Viaje; pasajeros: Pasajero[]; hojaRuta: Dia[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<'pasajeros' | 'ruta' | 'pagos'>('pasajeros')
  const [subTabRuta, setSubTabRuta] = useState<'asientos' | 'itinerario' | 'hoteles'>('asientos')
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
  const [historialPagos, setHistorialPagos] = useState<{
    pasajeroId: string
    nombre: string
  } | null>(null)

  // Estados para Hoja de Ruta
  const [asientos, setAsientos] = useState<Asiento[]>(generarAsientos())
  const [eventos, setEventos] = useState<Evento[]>([])
  const [hotel, setHotel] = useState<Hotel>({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    noches: 0
  })
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([])

  // ============================================
  // ESTADOS PARA MOVER PASAJERO
  // ============================================
  const [mostrarModalMover, setMostrarModalMover] = useState(false)
  const [pasajeroAMover, setPasajeroAMover] = useState<Pasajero | null>(null)
  const [viajesDisponibles, setViajesDisponibles] = useState<ViajeDisponible[]>([])
  const [moviendoPasajero, setMoviendoPasajero] = useState(false)
  const [viajeSeleccionado, setViajeSeleccionado] = useState('')
  const [asientoSeleccionado, setAsientoSeleccionado] = useState<number | null>(null)
  const [asientosDestino, setAsientosDestino] = useState<Asiento[]>([])

  const pasajerosSinAsiento = useMemo(() => {
    const confirmados = pasajeros.filter(p => p.estado_revision === 'aprobado')
    return confirmados
      .filter(p => !asientos.some(a => a.pasajeroId === p.id))
      .map(p => ({
        id: p.id,
        nombre: p.nombre || '',
        apellido: p.apellido || '',
        iniciales: `${(p.nombre || '')[0]}${(p.apellido || '')[0]}`.toUpperCase()
      }))
  }, [pasajeros, asientos])

  // ============================================
  // FUNCIONES PARA MOVER PASAJERO
  // ============================================

 const cargarViajesDisponibles = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('viajes')
    .select('*')
    .neq('id', viaje.id)  // Solo excluir el viaje actual
    // .gte('fecha_inicio', new Date().toISOString()) // ELIMINA esta línea
    .order('fecha_inicio', { ascending: true })
    
  if (!error && data) {
    const viajesConCupos = await Promise.all(data.map(async (v) => {
      const { count } = await supabase
        .from('pasajeros')
        .select('*', { count: 'exact', head: true })
        .eq('viaje_id', v.id)
        .eq('estado_revision', 'aprobado')
      
      return {
        ...v,
        cupos_disponibles: v.cupo_total - (count || 0)
      }
    }))
    setViajesDisponibles(viajesConCupos)
  }
}

  const cargarAsientosDestino = async (viajeId: string) => {
    const supabase = createClient()
    const { data: pasajerosViaje } = await supabase
      .from('pasajeros')
      .select('*')
      .eq('viaje_id', viajeId)
      .eq('estado_revision', 'aprobado')

    // Generar asientos base
    const asientosGenerados = generarAsientos()
    
    // Marcar los ocupados
    if (pasajerosViaje) {
      // Por simplicidad, asignamos números secuenciales
      // En un caso real, tendrías una tabla de asignación de asientos
      pasajerosViaje.forEach((p, index) => {
        if (index < asientosGenerados.length) {
          asientosGenerados[index].estado = 'ocupado'
          asientosGenerados[index].pasajeroId = p.id
          asientosGenerados[index].nombrePasajero = `${p.nombre || ''} ${p.apellido || ''}`
        }
      })
    }
    
    setAsientosDestino(asientosGenerados)
  }

 const handleMoverPasajero = async () => {
  // Eliminar la verificación de asientoSeleccionado
  if (!pasajeroAMover || !viajeSeleccionado) return
  
  setMoviendoPasajero(true)
  const supabase = createClient()
  
  try {
    // 1. Obtener la reserva actual del pasajero
    const { data: reservaActual, error: errorReserva } = await supabase
      .from('pasajeros')
      .select('*')
      .eq('id', pasajeroAMover.id)
      .single()
      
    if (errorReserva || !reservaActual) {
      throw new Error('No se encontró la reserva del pasajero')
    }
    
    // 2. Verificar si es titular de un grupo
    const { data: grupoInfo } = await supabase
      .from('pasajeros')
      .select('grupo_id, es_titular')
      .eq('id', pasajeroAMover.id)
      .single()

    const esTitularGrupo = grupoInfo?.es_titular === true
    const grupoId = grupoInfo?.grupo_id

    // 3. Obtener todos los miembros del grupo
    let miembrosGrupo: Pasajero[] = []
    if (esTitularGrupo && grupoId) {
      const { data: miembros } = await supabase
        .from('pasajeros')
        .select('*')
        .eq('grupo_id', grupoId)
      
      miembrosGrupo = miembros || []
    }

    // 4. Obtener información de los viajes
    const { data: viajeOrigen } = await supabase
      .from('viajes')
      .select('*')
      .eq('id', viaje.id)
      .single()
      
    const { data: viajeDestino } = await supabase
      .from('viajes')
      .select('*')
      .eq('id', viajeSeleccionado)
      .single()
      
    if (!viajeOrigen || !viajeDestino) {
      throw new Error('Viaje no encontrado')
    }
    
    // 5. Calcular diferencias de precio
    const precioOrigen = viajeOrigen.precio || 0
    const precioDestino = viajeDestino.precio || 0
    const diferenciaPrecio = precioDestino - precioOrigen

    // 6. Si es grupo, mover todos los miembros
    if (esTitularGrupo && miembrosGrupo.length > 0) {
      let mensajeGrupo = `✅ Grupo movido exitosamente!\n\n`
      mensajeGrupo += `Viaje original: ${viajeOrigen.destino} ($${precioOrigen.toLocaleString()})\n`
      mensajeGrupo += `Viaje destino: ${viajeDestino.destino} ($${precioDestino.toLocaleString()})\n`
      mensajeGrupo += `Cantidad de pasajeros: ${miembrosGrupo.length}\n\n`
      mensajeGrupo += `Detalles por pasajero:\n`

      for (const miembro of miembrosGrupo) {
        const montoPagadoOriginal = miembro.monto_pagado || 0
        const deudaRestante = precioDestino - montoPagadoOriginal
        const estaPagado = deudaRestante <= 0
        
        const { error: errorUpdate } = await supabase
          .from('pasajeros')
          .update({
            viaje_id: viajeSeleccionado,
            monto_total: precioDestino,
            estado_pago: estaPagado ? 'pagado' : 'pendiente'
          })
          .eq('id', miembro.id)
          
        if (errorUpdate) throw errorUpdate

        const nombre = `${miembro.nombre || ''} ${miembro.apellido || ''}`.trim() || 'Sin nombre'
        mensajeGrupo += `  ${nombre}: Pagado $${montoPagadoOriginal.toLocaleString()} | Debe $${deudaRestante > 0 ? deudaRestante.toLocaleString() : '0'} ${estaPagado ? '✅' : '⚠️'}\n`
      }

      alert(mensajeGrupo)
      
    } else {
      // Mover un solo pasajero
      const montoPagadoOriginal = pasajeroAMover.monto_pagado || 0
      const deudaRestante = precioDestino - montoPagadoOriginal
      const estaPagado = deudaRestante <= 0
      
      const { error: errorUpdate } = await supabase
        .from('pasajeros')
        .update({
          viaje_id: viajeSeleccionado,
          monto_total: precioDestino,
          estado_pago: estaPagado ? 'pagado' : 'pendiente'
        })
        .eq('id', pasajeroAMover.id)
        
      if (errorUpdate) throw errorUpdate

      const mensaje = `
✅ Pasajero movido exitosamente!

Viaje original: ${viajeOrigen.destino} ($${precioOrigen.toLocaleString()})
Viaje destino: ${viajeDestino.destino} ($${precioDestino.toLocaleString()})

💰 Resumen de pago:
Monto pagado: $${montoPagadoOriginal.toLocaleString()}
Precio nuevo viaje: $${precioDestino.toLocaleString()}
Diferencia: ${diferenciaPrecio >= 0 ? '+' : '-'}$${Math.abs(diferenciaPrecio).toLocaleString()}
Deuda restante: $${deudaRestante > 0 ? deudaRestante.toLocaleString() : '0'}

Estado: ${estaPagado ? '✅ Pagado' : `⚠️ Pendiente de pago (falta $${deudaRestante.toLocaleString()})`}
      `
      alert(mensaje)
    }
    
    router.refresh()
    setMostrarModalMover(false)
    setPasajeroAMover(null)
    setViajeSeleccionado('')
    
  } catch (error) {
    console.error('Error al mover pasajero:', error)
    alert('❌ Error al mover el pasajero. Por favor, intenta de nuevo.')
  } finally {
    setMoviendoPasajero(false)
  }
}

 

  // ============================================
  // HANDLERS DE PAGOS
  // ============================================

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
    const resultado = await registrarPago(
      pasajeroId,
      monto,
      metodo,
      viaje.id,
      false,
      undefined,
      tipoTarjeta,
      cuotas,
      recargo
    )
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

    const resultado = await registrarPago(
      titular.id,
      monto,
      metodo,
      viaje.id,
      true,
      grupoId,
      tipoTarjeta,
      cuotas,
      recargo
    )

    const { data: acompanantes } = await supabase
      .from('pasajeros')
      .select('id')
      .eq('grupo_id', grupoId)
      .neq('es_titular', true)

    if (acompanantes && acompanantes.length > 0) {
      for (const acomp of acompanantes) {
        await supabase
          .from('pasajeros')
          .update({ estado_pago: 'pagado' })
          .eq('id', acomp.id)
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

  // ============================================
  // HANDLERS DE APROBACIÓN
  // ============================================

  async function handleAprobarPasajero(id: string, iniciales?: string) {
    setAprobando(id)
    try {
      const resultado = await aprobarPasajero(id, viaje.id, iniciales)
      if (resultado?.error) {
        alert('Error al aprobar: ' + resultado.error)
        return
      }
      setDetalleModal(null)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al aprobar el pasajero')
    } finally {
      setAprobando(null)
    }
  }

  async function handleAprobarGrupo(grupoId: string, iniciales?: string) {
    setAprobando(grupoId)
    try {
      const resultado = await aprobarGrupo(grupoId, viaje.id, iniciales)
      if (resultado?.error) {
        alert('Error al aprobar: ' + resultado.error)
        return
      }
      setDetalleModal(null)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al aprobar el grupo')
    } finally {
      setAprobando(null)
    }
  }

  // ============================================
  // HANDLERS DE ELIMINACIÓN
  // ============================================

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
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('pasajeros')
        .delete()
        .eq('id', pasajeroId)

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
      const { error } = await supabase
        .from('pasajeros')
        .delete()
        .eq('grupo_id', grupoId)

      if (error) throw error

      setDetalleModal(null)
      router.refresh()
    } catch (error) {
      console.error('Error al eliminar grupo:', error)
      alert('Error al eliminar el grupo')
    }
  }

  // ============================================
  // HANDLERS DE EDICIÓN Y CANCELACIÓN
  // ============================================

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

  // ============================================
  // FUNCIONES DE NAVEGACIÓN
  // ============================================

  function toggleGrupo(grupoId: string) {
    setExpandido((prev) => ({ ...prev, [grupoId]: !prev[grupoId] }))
  }

  const pendientes = pasajeros.filter((p) => p.estado_revision === 'pendiente')
  const confirmados = pasajeros.filter((p) => p.estado_revision === 'aprobado')

  const { grupos: gruposPendientes, individuales: individualesPendientes } = agruparPasajeros(pendientes)
  const { grupos: gruposConfirmados, individuales: individualesConfirmados } = agruparPasajeros(confirmados)

  const abrirDetalleIndividual = (pasajero: Pasajero) => {
    setAprobando(null)
    setDetalleModal({
      pasajero,
      esGrupo: false,
      miembros: [pasajero]
    })
  }

  const abrirDetalleGrupo = (grupoId: string, miembros: Pasajero[]) => {
    setAprobando(null)
    const titular = miembros.find((m) => m.es_titular) ?? miembros[0]
    setDetalleModal({
      pasajero: titular,
      esGrupo: true,
      miembros
    })
  }

  const abrirEdicion = () => {
    if (detalleModal) {
      setEditando(detalleModal)
      setDetalleModal(null)
    }
  }

  const totalMenores3 = pasajeros.filter(p => p.es_menor_3).length
  const totalMenores18 = pasajeros.filter(p => p.es_menor_18).length

  // ============================================
  // RENDER
  // ============================================

  return (
    <main className="min-h-screen" style={{ background: BG_PAGINA }}>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between" style={{ background: SN_AZUL, boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2" style={{ borderColor: SN_CELESTE }}>
            <Image
              src="/logo-sn.png"
              alt="SN Viajes"
              fill
              className="object-cover"
              sizes="40px"
            />
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg"
            style={{ background: SN_AMARILLO, color: SN_AZUL, boxShadow: '0 2px 8px rgba(242, 182, 50, 0.3)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </Link>
          <button
            onClick={() => setMostrarConfirmacionEliminar(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg"
            style={{ background: '#DC2626', color: 'white', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </button>
          <Link
            href="/home"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#9FC8DC', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header del viaje */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{viaje.destino}</h1>
            <p className="text-sm text-gray-400">
              📅 {viaje.fecha_inicio} → {viaje.fecha_fin}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              👥 {confirmados.length}/{viaje.cupo_total} pasajeros confirmados
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-gray-800/50 rounded-xl px-4 py-2 text-center border border-gray-700">
              <p className="text-xs text-gray-400">Confirmados</p>
              <p className="text-xl font-bold text-white">{confirmados.length}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl px-4 py-2 text-center border border-gray-700">
              <p className="text-xs text-gray-400">Pendientes</p>
              <p className="text-xl font-bold text-yellow-500">{pendientes.length}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl px-4 py-2 text-center border border-gray-700">
              <p className="text-xs text-gray-400">Cupo</p>
              <p className="text-xl font-bold text-blue-400">{viaje.cupo_total}</p>
            </div>
          </div>
        </div>

        {/* Stats menores */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700">
          <div>
            <p className="text-xs text-gray-400">Total pasajeros</p>
            <p className="text-lg font-semibold text-white">{pasajeros.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">👶 Menores de 3 (sin butaca)</p>
            <p className="text-lg font-semibold text-blue-400">{totalMenores3}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">🧒 Menores de 18</p>
            <p className="text-lg font-semibold text-yellow-500">{totalMenores18}</p>
          </div>
        </div>

        {/* Tabs principales */}
        <div className="flex gap-8 mb-6 border-b border-gray-700">
          {['pasajeros', 'ruta', 'pagos'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as typeof tab)}
              className={`pb-3 px-1 text-sm font-medium transition-all ${
                tab === t
                  ? 'border-b-2 border-blue-500 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {t === 'pasajeros' ? '👥 Pasajeros' : t === 'ruta' ? '🗺️ Hoja de ruta' : '💳 Pagos'}
            </button>
          ))}
        </div>

        {/* ============================================
            TAB: PASAJEROS
            ============================================ */}
        {tab === 'pasajeros' && (
          <div>
            {/* Pendientes */}
            <h2 className="font-medium mb-3 text-sm text-blue-400">Pendientes de revisión ({pendientes.length})</h2>
            <div className="rounded-xl mb-6 overflow-hidden bg-gray-800/50 border border-gray-700">
              {pendientes.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-400">✅ No hay pasajeros pendientes</p>
                </div>
              )}
              {Object.entries(gruposPendientes).map(([grupoId, miembros]) => {
                const titular = miembros.find((m) => m.es_titular) ?? miembros[0]
                const resto = miembros.filter((m) => m.id !== titular.id)
                const abierto = expandido[grupoId]
                return (
                  <div key={grupoId} className="border-b border-gray-700 last:border-0">
                    <div className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
                      <button onClick={() => toggleGrupo(grupoId)} className="text-left flex-1">
                        <p className="text-sm text-white">
                          {titular.nombre} {titular.apellido}
                          {resto.length > 0 && <span className="text-gray-400"> +{resto.length}</span>}
                        </p>
                        <p className="text-xs text-gray-400">
                          DNI {titular.numero_documento} · {miembros.length} integrante{miembros.length > 1 ? 's' : ''}
                        </p>
                      </button>
                      <button
                        onClick={() => abrirDetalleGrupo(grupoId, miembros)}
                        className="text-xs rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80 border border-blue-500 text-blue-400 hover:bg-blue-500/10"
                      >
                        Ver detalle
                      </button>
                    </div>
                    {abierto && resto.length > 0 && (
                      <div className="pl-6 pb-2 space-y-1">
                        {resto.map((m) => (
                          <p key={m.id} className="text-xs text-gray-400 py-1">
                            {m.nombre} {m.apellido} · {m.parentesco_con_titular || 'acompañante'}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {individualesPendientes.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors border-b border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm text-white">{p.nombre} {p.apellido}</p>
                    <p className="text-xs text-gray-400">DNI {p.numero_documento}</p>
                  </div>
                  <button
                    onClick={() => abrirDetalleIndividual(p)}
                    className="text-xs rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80 border border-blue-500 text-blue-400 hover:bg-blue-500/10"
                  >
                    Ver detalle
                  </button>
                </div>
              ))}
            </div>

            {/* Confirmados */}
            <h2 className="font-medium mb-3 text-sm text-blue-400">Confirmados ({confirmados.length})</h2>
            <div className="rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700">
              {confirmados.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-400">Todavía no hay pasajeros confirmados</p>
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
                  <div key={grupoId} className="border-b border-gray-700 last:border-0">
                    <div className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
                      <button onClick={() => toggleGrupo(grupoId)} className="text-left flex-1">
                        <p className="text-sm text-white">
                          {titular.nombre} {titular.apellido}
                          {resto.length > 0 && <span className="text-gray-400"> +{resto.length}</span>}
                        </p>
                      </button>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                          {pagaron} de {miembros.length} pagaron
                        </span>
                        <button
                          onClick={() => abrirDetalleGrupo(grupoId, miembros)}
                          className="text-xs rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80 border border-blue-500 text-blue-400 hover:bg-blue-500/10"
                        >
                          Ver detalle
                        </button>
                      </div>
                    </div>
                    {abierto && resto.length > 0 && (
                      <div className="pl-6 pb-2 space-y-1">
                        {resto.map((m) => (
                          <div key={m.id} className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">{m.nombre} {m.apellido} · {m.parentesco_con_titular || 'acompañante'}</p>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                m.estado_pago === 'pagado'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}
                            >
                              {m.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {individualesConfirmados.map((p) => {
                const deuda = (p.monto_total || 0) - (p.monto_pagado || 0)
                const estaPagado = p.estado_pago === 'pagado' || deuda <= 0
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors border-b border-gray-700 last:border-0">
                    <p className="text-sm text-white">{p.nombre} {p.apellido}</p>
                    <div className="flex gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          estaPagado
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {estaPagado ? '✅ Pagado' : 'Pendiente'}
                      </span>
                      <button
                        onClick={() => abrirDetalleIndividual(p)}
                        className="text-xs rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80 border border-blue-500 text-blue-400 hover:bg-blue-500/10"
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

        {/* ============================================
            TAB: HOJA DE RUTA
            ============================================ */}
        {tab === 'ruta' && (
          <div>
            {/* SUBPESTAÑAS */}
            <div className="flex gap-6 mb-6 border-b border-gray-700">
              <button
                onClick={() => setSubTabRuta('asientos')}
                className={`pb-3 px-1 text-sm font-medium transition-all ${
                  subTabRuta === 'asientos'
                    ? 'border-b-2 border-blue-500 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                🪑 Asientos
              </button>
              <button
                onClick={() => setSubTabRuta('itinerario')}
                className={`pb-3 px-1 text-sm font-medium transition-all ${
                  subTabRuta === 'itinerario'
                    ? 'border-b-2 border-blue-500 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                📅 Itinerario
              </button>
              <button
                onClick={() => setSubTabRuta('hoteles')}
                className={`pb-3 px-1 text-sm font-medium transition-all ${
                  subTabRuta === 'hoteles'
                    ? 'border-b-2 border-blue-500 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                🏨 Hoteles
              </button>
            </div>

            {/* CONTENIDO DE SUBPESTAÑAS */}
            {subTabRuta === 'asientos' && (
              <ContenidoAsientos 
                asientos={asientos}
                pasajerosSinAsiento={pasajerosSinAsiento}
                onAsignarAsiento={(asientoNumero, pasajeroId) => {
                  const pasajero = pasajerosSinAsiento.find(p => p.id === pasajeroId)
                  if (!pasajero) return

                  const nuevosAsientos = asientos.map(a =>
                    a.numero === asientoNumero
                      ? { 
                          ...a, 
                          estado: 'ocupado' as const,
                          pasajeroId, 
                          nombrePasajero: `${pasajero.nombre} ${pasajero.apellido}`
                        }
                      : a
                  )
                  setAsientos(nuevosAsientos)
                }}
                onDesasignarAsiento={(asientoNumero) => {
                  const nuevosAsientos = asientos.map(a =>
                    a.numero === asientoNumero
                      ? { 
                          ...a, 
                          estado: a.tipo === 'cama' ? 'cama_libre' as const : 'disponible' as const,
                          pasajeroId: undefined, 
                          nombrePasajero: undefined
                        }
                      : a
                  )
                  setAsientos(nuevosAsientos)
                }}
              />
            )}

            {subTabRuta === 'itinerario' && (
              <ContenidoItinerario 
                eventos={eventos}
                onAgregarEvento={(evento) => {
                  setEventos([...eventos, { ...evento, id: crypto.randomUUID() }])
                }}
                onEliminarEvento={(id) => {
                  setEventos(eventos.filter(e => e.id !== id))
                }}
              />
            )}

            {subTabRuta === 'hoteles' && (
              <ContenidoHoteles 
                hotel={hotel}
                habitaciones={habitaciones}
                pasajeros={pasajeros}
                onAgregarHabitacion={(numero, tipo, capacidad) => {
                  setHabitaciones([...habitaciones, {
                    id: crypto.randomUUID(),
                    numero,
                    tipo,
                    capacidad,
                    pasajeros: []
                  }])
                }}
                onAsignarPasajero={(habitacionId, pasajeroId) => {
                  const nuevas = habitaciones.map(h => ({
                    ...h,
                    pasajeros: h.pasajeros.filter(id => id !== pasajeroId)
                  }))
                  const final = nuevas.map(h => ({
                    ...h,
                    pasajeros: h.id === habitacionId
                      ? [...h.pasajeros, pasajeroId]
                      : h.pasajeros
                  }))
                  setHabitaciones(final)
                }}
                onQuitarPasajero={(habitacionId, pasajeroId) => {
                  const nuevas = habitaciones.map(h => ({
                    ...h,
                    pasajeros: h.id === habitacionId
                      ? h.pasajeros.filter(id => id !== pasajeroId)
                      : h.pasajeros
                  }))
                  setHabitaciones(nuevas)
                }}
                onEliminarHabitacion={(id) => {
                  setHabitaciones(habitaciones.filter(h => h.id !== id))
                }}
              />
            )}
          </div>
        )}

        {/* ============================================
            TAB: PAGOS
            ============================================ */}
        {tab === 'pagos' && (
          <div className="rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700">
            {confirmados.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-400">No hay pasajeros confirmados todavía</p>
              </div>
            )}
            {Object.entries(gruposConfirmados).map(([grupoId, miembros]) => {
              const titular = miembros.find((m) => m.es_titular) ?? miembros[0]
              const montoTotalGrupo = miembros.reduce((sum, m) => sum + (m.monto_total || 0), 0)
              const montoPagadoGrupo = miembros.reduce((sum, m) => sum + (m.monto_pagado || 0), 0)
              const deudaRestante = montoTotalGrupo - montoPagadoGrupo
              const todosPagados = deudaRestante <= 0

              return (
                <div key={grupoId} className="p-4 hover:bg-white/5 transition-colors border-b border-gray-700 last:border-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">{titular.nombre} {titular.apellido} y grupo</p>
                      <p className="text-xs text-gray-400">
                        {miembros.length} personas · ${montoPagadoGrupo.toLocaleString()} de ${montoTotalGrupo.toLocaleString()}
                      </p>
                      {deudaRestante > 0 && (
                        <p className="text-xs text-yellow-500">Falta: ${deudaRestante.toLocaleString()}</p>
                      )}
                    </div>
                    {todosPagados ? (
                      <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-500/20 text-green-400">
                        ✅ Grupo pagado
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setPasajeroModal({
                            id: grupoId,
                            nombre: `${titular.nombre} ${titular.apellido} y grupo`
                          })
                          setPagoGrupal(true)
                          setMiembrosGrupo(miembros.map(m => ({
                            id: m.id,
                            nombre: `${m.nombre || ''} ${m.apellido || ''}`.trim() || 'Sin nombre',
                            montoTotal: m.monto_total || 0,
                            montoPagado: m.monto_pagado || 0
                          })))
                        }}
                        className="text-xs rounded-lg px-3 py-1.5 font-medium border-none transition-opacity hover:opacity-85 bg-yellow-500 text-gray-900"
                      >
                        Registrar pago grupal
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {individualesConfirmados.map((p) => {
              const deuda = (p.monto_total || 0) - (p.monto_pagado || 0)
              const estaPagado = p.estado_pago === 'pagado' || deuda <= 0
              return (
                <div key={p.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{p.nombre} {p.apellido}</p>
                    <p className="text-xs text-gray-400">
                      ${p.monto_pagado?.toLocaleString() ?? 0} de ${p.monto_total?.toLocaleString() ?? 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {estaPagado ? (
                      <>
                        <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-500/20 text-green-400">
                          ✅ Pagado
                        </span>
                        <button
                          onClick={() => {
                            setDeshacerModal({
                              id: p.id,
                              monto: p.monto_pagado || 0,
                              metodo_pago: 'No especificado',
                              numero_recibo: 0,
                              pasajero_nombre: `${p.nombre} ${p.apellido}`
                            })
                          }}
                          className="text-xs px-2 py-0.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          Deshacer
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setPasajeroModal({
                            id: p.id,
                            nombre: `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin nombre'
                          })
                          setPagoGrupal(false)
                          setMiembrosGrupo([])
                        }}
                        className="text-xs rounded-lg px-3 py-1.5 font-medium border-none transition-opacity hover:opacity-85 bg-yellow-500 text-gray-900"
                      >
                        Registrar pago
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ============================================
            MODALES
            ============================================ */}

        {/* Modal Detalle Pasajero */}
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
            onCancel={() => {
              setAprobando(null)
              setDetalleModal(null)
            }}
            onEliminar={() => {
              setAprobando(null)
              if (detalleModal.esGrupo) {
                handleEliminarGrupo(detalleModal.miembros[0].grupo_id!)
              } else {
                handleEliminarPasajero(detalleModal.pasajero.id)
              }
            }}
            onEditar={() => {
              setAprobando(null)
              abrirEdicion()
            }}
            onCancelar={() => {
              setCancelando(detalleModal.pasajero)
              setDetalleModal(null)
            }}
            onVerHistorial={(id, nombre) => {
              setHistorialPagos({ pasajeroId: id, nombre })
            }}
            onMover={() => {
      // Mover individual
      if (!detalleModal.esGrupo) {
        setPasajeroAMover(detalleModal.pasajero)
        setDetalleModal(null)
        cargarViajesDisponibles()
        setMostrarModalMover(true)
      }
    }}
    onMoverGrupo={() => {
      // Mover grupo completo
      if (detalleModal.esGrupo) {
        const titular = detalleModal.miembros.find(m => m.es_titular) || detalleModal.pasajero
        setPasajeroAMover(titular)
        setDetalleModal(null)
        cargarViajesDisponibles()
        setMostrarModalMover(true)
      }
    }}
  />
)}

        {/* Modal Editar Pasajero */}
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

        {/* Modal Cancelar Pasajero */}
        {cancelando && (
          <ModalCancelarPasajero
            pasajero={cancelando}
            onConfirm={handleCancelarPasajero}
            onCancel={() => setCancelando(null)}
            guardando={procesandoCancelacion}
          />
        )}

        {/* Modal Registrar Pago */}
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
              setAprobando(null)
            }}
            onConfirm={(monto, metodo, tipoTarjeta, cuotas, recargo) => {
              if (pagoGrupal && miembrosGrupo.length > 0) {
                handleRegistrarPagoGrupal(miembrosGrupo.map(m => m.id), monto, metodo, tipoTarjeta, cuotas, recargo)
              } else {
                handleRegistrarPago(pasajeroModal.id, monto, metodo, tipoTarjeta, cuotas, recargo)
              }
            }}
          />
        )}

        {/* Modal Deshacer Pago */}
        {deshacerModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Deshacer pago</h3>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                Estás por deshacer el pago de <strong className="text-gray-900">{deshacerModal.pasajero_nombre}</strong>
              </p>

              <div className="bg-gray-100 rounded-lg p-4 mb-4 border border-gray-300">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Detalle del pago</p>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-600 font-medium">Recibo Nº:</span>
                  <span className="text-gray-900 font-bold">{deshacerModal.numero_recibo || '---'}</span>
                  <span className="text-gray-600 font-medium">Monto:</span>
                  <span className="text-gray-900 font-bold">${deshacerModal.monto?.toLocaleString() || 0}</span>
                  <span className="text-gray-600 font-medium">Método:</span>
                  <span className="text-gray-900 font-medium">{deshacerModal.metodo_pago || 'No especificado'}</span>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const motivoSelect = form.querySelector('select') as HTMLSelectElement
                const motivoOtro = form.querySelector('input[type="text"]') as HTMLInputElement
                let motivo = motivoSelect.value
                if (motivo === 'Otro' && motivoOtro) {
                  motivo = motivoOtro.value
                }
                if (motivo) {
                  handleDeshacerPago(motivo)
                }
              }} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    Motivo del deshacer <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full border-2 border-gray-300 rounded-lg p-2.5 text-gray-900 bg-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all"
                    onChange={(e) => {
                      const otroInput = document.getElementById('otroMotivo') as HTMLInputElement
                      if (otroInput) {
                        otroInput.style.display = e.target.value === 'Otro' ? 'block' : 'none'
                      }
                    }}
                  >
                    <option value="">Seleccioná un motivo</option>
                    <option value="Pago registrado por error">Pago registrado por error</option>
                    <option value="Monto incorrecto">Monto incorrecto</option>
                    <option value="Pasajero canceló el viaje">Pasajero canceló el viaje</option>
                    <option value="Se realizó un reembolso">Se realizó un reembolso</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <input
                    id="otroMotivo"
                    type="text"
                    placeholder="Especificá el motivo..."
                    className="w-full border-2 border-gray-300 rounded-lg p-2.5 text-gray-900 bg-white placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all hidden"
                  />
                </div>

                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-300">
                  <p className="text-xs font-semibold text-yellow-800">⚠️ Esta acción no se puede deshacer</p>
                </div>

                <div className="flex gap-2 mt-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeshacerModal(null)}
                    className="flex-1 border-2 border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    disabled={procesandoDeshacer}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={procesandoDeshacer}
                  >
                    {procesandoDeshacer ? 'Procesando...' : 'Confirmar deshacer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Historial de Pagos */}
        {historialPagos && (
          <ModalHistorialPagos
            pasajeroId={historialPagos.pasajeroId}
            nombrePasajero={historialPagos.nombre}
            onClose={() => setHistorialPagos(null)}
          />
        )}

        {/* Modal Confirmación Eliminar Viaje */}
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

        {/* ============================================
    MODAL MOVER PASAJERO (SIMPLIFICADO)
    ============================================ */}
{mostrarModalMover && pasajeroAMover && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
    <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-400 text-xl">✈️</span>
        </div>
        <h3 className="text-xl font-bold text-white">Mover pasajero</h3>
      </div>

      <p className="text-sm text-gray-300 mb-4">
        Mover a <strong className="text-white">{pasajeroAMover.nombre} {pasajeroAMover.apellido}</strong>
        <br />
        <span className="text-xs text-gray-400">Viaje actual: {viaje.destino}</span>
      </p>

      {/* Viaje destino - Select simplificado */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-gray-300 block mb-1">
          🎯 Viaje destino:
        </label>
        <select
          value={viajeSeleccionado}
          onChange={(e) => setViajeSeleccionado(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">Seleccionar viaje...</option>
          {viajesDisponibles.map(v => (
            <option key={v.id} value={v.id}>
              {v.destino} - {v.fecha_inicio} (${v.precio?.toLocaleString() || 0}) - {v.cupos_disponibles} cupos
            </option>
          ))}
        </select>
      </div>

      {/* Diferencia de precio */}
      {viajeSeleccionado && (
        <>
          {(() => {
            const viajeDest = viajesDisponibles.find(v => v.id === viajeSeleccionado)
            if (!viajeDest) return null
            const precioOrigen = viaje.precio || 0
            const precioDestino = viajeDest.precio || 0
            const diferencia = precioDestino - precioOrigen
            const montoPagado = pasajeroAMover.monto_pagado || 0
            const deudaRestante = precioDestino - montoPagado
            
            return (
              <div className={`p-3 rounded-lg mb-4 ${
                deudaRestante > 0
                  ? 'bg-yellow-500/10 border border-yellow-500/50'
                  : 'bg-green-500/10 border border-green-500/50'
              }`}>
                <p className="text-sm text-gray-300">
                  💰 Resumen de pago:
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-gray-300">
                    Pagado: <span className="text-green-400 font-semibold">${montoPagado.toLocaleString()}</span>
                  </p>
                  <p className="text-gray-300">
                    Precio destino: <span className="text-blue-400 font-semibold">${precioDestino.toLocaleString()}</span>
                  </p>
                  <p className="text-gray-300">
                    Diferencia: <span className={`font-semibold ${diferencia >= 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {diferencia >= 0 ? '+' : ''}{diferencia.toLocaleString()}
                    </span>
                  </p>
                  <p className={`font-semibold ${deudaRestante > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {deudaRestante > 0 
                      ? `⚠️ Debe: $${deudaRestante.toLocaleString()}`
                      : '✅ Saldo suficiente'}
                  </p>
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* Botones */}
      <div className="flex gap-2 mt-4 pt-2 border-t border-gray-700">
        <button
          onClick={() => {
            setMostrarModalMover(false)
            setPasajeroAMover(null)
            setViajeSeleccionado('')
          }}
          className="flex-1 border border-gray-600 rounded-lg py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
          disabled={moviendoPasajero}
        >
          Cancelar
        </button>
        <button
          onClick={handleMoverPasajero}
          disabled={!viajeSeleccionado || moviendoPasajero}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
            viajeSeleccionado && !moviendoPasajero
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {moviendoPasajero ? 'Moviendo...' : 'Mover pasajero'}
        </button>
      </div>
    </div>
  </div>
)}
        
      </div>
    </main>
  )
}