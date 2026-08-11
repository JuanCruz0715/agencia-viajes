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
import BotonExportarPagos from '@/components/BotonExportarPagos'
import ContenidoAsientos from '@/components/ContenidoAsientos'
import ContenidoItinerario from '@/components/ContenidoItinerario'
import ContenidoHoteles from '@/components/ContenidoHoteles'
import BotonExportarAsientos from '@/components/BotonExportarAsientos'
import BotonDeshacerPago from '@/components/BotonDeshacerPago' // ✅ NUEVO IMPORT
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
  seguro_incluido?: boolean | null
  recargo_asiento?: number | null
}

type Viaje = {
  id: string
  destino: string
  fecha_inicio: string
  fecha_fin: string
  cupo_total: number
  descripcion: string | null
  precio?: number | null
  rangos_edad?: RangoEdad[]
  seguro_incluido?: boolean
  precio_seguro?: number
}

type RangoEdad = {
  id: string
  edad_min: number
  edad_max: number
  precio: number
  descripcion: string
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
  recargo_asiento?: number
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
// TIPOS PARA PAGOS
// ============================================

type Pago = {
  id: string
  pasajero_id: string
  viaje_id: string
  monto: number
  metodo_pago: string
  numero_recibo: number
  created_at: string
  tipo_tarjeta?: string
  cantidad_cuotas?: number
  recargo_aplicado?: number
  monto_original?: number
  monto_final?: number
  es_pago_grupal?: boolean
  grupo_id?: string
  notas?: string
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

function calcularEdad(fechaNacimiento: string | null | undefined) {
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
      pasajeroId: undefined,
      recargo_asiento: (i >= 1 && i <= 4) ? 10000 : 0
    })
  }
  
  // Asientos semi cama (13-60) - TODOS DISPONIBLES
  for (let i = 13; i <= 60; i++) {
    asientos.push({
      numero: i,
      estado: 'disponible',
      tipo: 'semi_cama',
      nombrePasajero: undefined,
      pasajeroId: undefined,
      recargo_asiento: (i >= 45 && i <= 56) ? 10000 : 0
    })
  }
  
  return asientos
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function FichaViaje({ viaje, pasajeros, hojaRuta }: { viaje: Viaje; pasajeros: Pasajero[]; hojaRuta: Dia[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<'pasajeros' | 'ruta'>('pasajeros')
  const [subTabPasajeros, setSubTabPasajeros] = useState<'lista' | 'pagos'>('lista')
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
  // ✅ Eliminamos 'deshacerModal' porque ahora usamos BotonDeshacerPago
  const [historialPagos, setHistorialPagos] = useState<{
    pasajeroId: string
    nombre: string
  } | null>(null)

  // ============================================
  // ESTADOS PARA PAGOS
  // ============================================
  const [pagos, setPagos] = useState<Pago[]>([])

  // ============================================
  // ESTADOS PARA EDITAR PAGOS
  // ============================================
  const [editandoPago, setEditandoPago] = useState<{
  id: string
  monto: number
  metodo_pago: string
  created_at: string
  notas?: string
  tipo_tarjeta?: string
  cuotas?: number
  recargo?: number
  pasajero_id?: string
} | null>(null)
  const [guardandoEdicionPago, setGuardandoEdicionPago] = useState(false)

  // ============================================
  // ESTADOS PARA EDITAR MONTO TOTAL
  // ============================================
  const [editandoMontoTotal, setEditandoMontoTotal] = useState<{
    pasajeroId: string
    montoTotal: number
    nombre: string
  } | null>(null)

  const [editandoMontoGrupal, setEditandoMontoGrupal] = useState<{
    grupoId: string
    montoTotal: number
    nombre: string
    miembros: Pasajero[]
  } | null>(null)

  const [guardandoMontoTotal, setGuardandoMontoTotal] = useState(false)

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
    .neq('id', viaje.id)
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

// ============================================
// FUNCIÓN PARA RECALCULAR MONTO TOTAL
// ============================================

const recalcularMontoTotal = async (pasajeroId: string) => {
  const supabase = createClient()
  
  try {
    // Obtener el pasajero
    const { data: pasajero, error: errorPasajero } = await supabase
      .from('pasajeros')
      .select('viaje_id, seguro_incluido, fecha_nacimiento, recargo_asiento')
      .eq('id', pasajeroId)
      .single()
    
    if (errorPasajero || !pasajero) return
    
    // Obtener el viaje
    const { data: viajeData, error: errorViaje } = await supabase
      .from('viajes')
      .select('precio, precio_seguro, rangos_edad')
      .eq('id', pasajero.viaje_id)
      .single()
    
    if (errorViaje || !viajeData) return
    
    // Calcular precio base según edad
    const edad = calcularEdad(pasajero.fecha_nacimiento)
    let precioBase = viajeData.precio || 0
    
    if (edad !== null && viajeData.rangos_edad && viajeData.rangos_edad.length > 0) {
      const rango = viajeData.rangos_edad.find((r: RangoEdad) => edad >= r.edad_min && edad <= r.edad_max)
      if (rango) {
        precioBase = rango.precio
      }
    }
    
    // Sumar seguro si corresponde
    const precioSeguro = pasajero.seguro_incluido ? (viajeData.precio_seguro || 20000) : 0
    const recargoAsiento = pasajero.recargo_asiento || 0
    const nuevoMontoTotal = precioBase + precioSeguro + recargoAsiento
    
    // Actualizar el monto_total del pasajero
    await supabase
      .from('pasajeros')
      .update({ monto_total: nuevoMontoTotal })
      .eq('id', pasajeroId)
    
    return nuevoMontoTotal
  } catch (error) {
    // Error ignorado (sin console.error)
  }
}

// ============================================
// HANDLER PARA EDITAR MONTO TOTAL INDIVIDUAL
// ============================================
const handleGuardarMontoTotal = async () => {
  if (!editandoMontoTotal) return
  
  setGuardandoMontoTotal(true)
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('pasajeros')
      .update({ monto_total: editandoMontoTotal.montoTotal })
      .eq('id', editandoMontoTotal.pasajeroId)
    
    if (error) throw error
    
    setEditandoMontoTotal(null)
    setGuardandoMontoTotal(false)
    router.refresh()
    alert('✅ Monto total actualizado correctamente')
    
  } catch (error) {
    alert('❌ Error al editar el monto total')
    setGuardandoMontoTotal(false)
  }
}

// ============================================
// HANDLER PARA EDITAR MONTO TOTAL GRUPAL
// ============================================
const handleGuardarMontoGrupal = async () => {
  if (!editandoMontoGrupal) return
  
  setGuardandoMontoTotal(true)
  const supabase = createClient()
  
  try {
    // Calcular el nuevo monto por pasajero (dividir equitativamente)
    const cantidadMiembros = editandoMontoGrupal.miembros.length
    const montoPorPasajero = Math.round(editandoMontoGrupal.montoTotal / cantidadMiembros)
    
    // Actualizar cada miembro del grupo
    for (const miembro of editandoMontoGrupal.miembros) {
      const { error } = await supabase
        .from('pasajeros')
        .update({ monto_total: montoPorPasajero })
        .eq('id', miembro.id)
      
      if (error) throw error
    }
    
    setEditandoMontoGrupal(null)
    setGuardandoMontoTotal(false)
    router.refresh()
    alert(`✅ Monto total del grupo actualizado correctamente\nCada pasajero: $${montoPorPasajero.toLocaleString()}`)
    
  } catch (error) {
    alert('❌ Error al editar el monto total del grupo')
    setGuardandoMontoTotal(false)
  }
}

const handleMoverPasajero = async () => {
  if (!pasajeroAMover || !viajeSeleccionado) return
  
  setMoviendoPasajero(true)
  const supabase = createClient()
  
  try {
    const { data: reservaActual, error: errorReserva } = await supabase
      .from('pasajeros')
      .select('*')
      .eq('id', pasajeroAMover.id)
      .single()
      
    if (errorReserva || !reservaActual) {
      throw new Error('No se encontró la reserva del pasajero')
    }
    
    const { data: grupoInfo } = await supabase
      .from('pasajeros')
      .select('grupo_id, es_titular')
      .eq('id', pasajeroAMover.id)
      .single()

    const esTitularGrupo = grupoInfo?.es_titular === true
    const grupoId = grupoInfo?.grupo_id

    let miembrosGrupo: Pasajero[] = []
    if (esTitularGrupo && grupoId) {
      const { data: miembros } = await supabase
        .from('pasajeros')
        .select('*')
        .eq('grupo_id', grupoId)
      
      miembrosGrupo = miembros || []
    }

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
    
    const precioDestino = viajeDestino.precio || 0

    if (esTitularGrupo && miembrosGrupo.length > 0) {
      let mensajeGrupo = `✅ Grupo movido exitosamente!\n\n`
      mensajeGrupo += `Viaje original: ${viajeOrigen.destino}\n`
      mensajeGrupo += `Viaje destino: ${viajeDestino.destino}\n`
      mensajeGrupo += `Cantidad de pasajeros: ${miembrosGrupo.length}\n\n`
      mensajeGrupo += `Detalles por pasajero:\n`

      for (const miembro of miembrosGrupo) {
        const { data: pagosMiembro } = await supabase
          .from('pagos')
          .select('monto')
          .eq('pasajero_id', miembro.id)
          .eq('eliminado', false)

        const montoPagadoReal = pagosMiembro?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0
        
        // Recalcular monto total con el nuevo viaje
        const nuevoMontoTotal = await recalcularMontoTotal(miembro.id) || precioDestino
        const deudaRestante = nuevoMontoTotal - montoPagadoReal
        const estaPagado = deudaRestante <= 0
        
        const { error: errorUpdate } = await supabase
          .from('pasajeros')
          .update({
            viaje_id: viajeSeleccionado,
            monto_total: nuevoMontoTotal,
            monto_pagado: montoPagadoReal,
            estado_pago: estaPagado ? 'pagado' : 'pendiente'
          })
          .eq('id', miembro.id)
          
        if (errorUpdate) throw errorUpdate

        const nombre = `${miembro.nombre || ''} ${miembro.apellido || ''}`.trim() || 'Sin nombre'
        mensajeGrupo += `  ${nombre}: Pagado $${montoPagadoReal.toLocaleString()} | Total $${nuevoMontoTotal.toLocaleString()} | Debe $${deudaRestante > 0 ? deudaRestante.toLocaleString() : '0'} ${estaPagado ? '✅' : '⚠️'}\n`
      }

      alert(mensajeGrupo)
      
    } else {
      const { data: pagosPasajero } = await supabase
        .from('pagos')
        .select('monto')
        .eq('pasajero_id', pasajeroAMover.id)
        .eq('eliminado', false)

      const montoPagadoReal = pagosPasajero?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0
      
      // Recalcular monto total con el nuevo viaje
      const nuevoMontoTotal = await recalcularMontoTotal(pasajeroAMover.id) || precioDestino
      const deudaRestante = nuevoMontoTotal - montoPagadoReal
      const estaPagado = deudaRestante <= 0
      
      const { error: errorUpdate } = await supabase
        .from('pasajeros')
        .update({
          viaje_id: viajeSeleccionado,
          monto_total: nuevoMontoTotal,
          monto_pagado: montoPagadoReal,
          estado_pago: estaPagado ? 'pagado' : 'pendiente'
        })
        .eq('id', pasajeroAMover.id)
        
      if (errorUpdate) throw errorUpdate

      const mensaje = `
✅ Pasajero movido exitosamente!

Viaje original: ${viajeOrigen.destino}
Viaje destino: ${viajeDestino.destino}

💰 Resumen de pago:
Monto pagado real: $${montoPagadoReal.toLocaleString()}
Monto total nuevo viaje: $${nuevoMontoTotal.toLocaleString()}
Deuda restante: $${deudaRestante > 0 ? deudaRestante.toLocaleString() : '0'}

Estado: ${estaPagado ? '✅ Pagado' : `⚠️ Pendiente de pago (falta $${deudaRestante.toLocaleString()})`}
      `
      alert(mensaje)
    }
    
    router.replace(`/viaje/${viaje.id}`)
    setMostrarModalMover(false)
    setPasajeroAMover(null)
    setViajeSeleccionado('')
    
  } catch (error) {
    alert('❌ Error al mover el pasajero. Por favor, intenta de nuevo.')
  } finally {
    setMoviendoPasajero(false)
  }
}

// ============================================
// CARGAR HABITACIONES Y ASIGNACIONES (CORREGIDO)
// ============================================
useEffect(() => {
  const cargarHabitaciones = async () => {
    if (!viaje.id) return // Asegurar que tenemos ID

    const supabase = createClient()
    
    // 1. Traer las habitaciones del viaje
    const { data: habitacionesData, error: errorHab } = await supabase
      .from('habitaciones')
      .select('*')
      .eq('viaje_id', viaje.id)
    
    if (errorHab) return

    // 2. Traer todas las asignaciones de este viaje
    const { data: asignacionesData, error: errorAsig } = await supabase
      .from('habitaciones_pasajeros')
      .select('*')
      .eq('viaje_id', viaje.id)

    if (errorAsig) return

    // 3. Combinar los datos correctamente
    const habs = (habitacionesData || []).map(h => ({
      id: h.id,
      numero: h.numero,
      tipo: h.tipo,
      capacidad: h.capacidad,
      // Filtramos solo los pasajeros que pertenecen a esta habitación específica
      pasajeros: (asignacionesData || [])
        .filter(a => a.habitacion_id === h.id)
        .map(a => a.pasajero_id)
    }))

    // 4. Actualizar el estado de React
    setHabitaciones(habs)
  }

  cargarHabitaciones()
}, [viaje.id]) // Se ejecuta cada vez que cambia el ID del viaje

// ============================================
// CARGAR ASIGNACIONES DE ASIENTOS
// ============================================
useEffect(() => {
  const cargarAsignaciones = async () => {
    if (!viaje.id) return

    const supabase = createClient()
    
    // 1. Traer las asignaciones de asientos de la base de datos
    const { data, error } = await supabase
      .from('asignaciones_asientos')
      .select('*')
      .eq('viaje_id', viaje.id)

    if (error || !data) return

    // 2. Actualizar el estado de los asientos basándonos en lo que devolvió la base de datos
    const nuevosAsientos = asientos.map(a => {
      const asignacion = data.find(ass => ass.numero_asiento === a.numero)
      if (asignacion) {
        const pasajero = pasajeros.find(p => p.id === asignacion.pasajero_id)
        return {
          ...a,
          estado: a.tipo === 'cama' ? 'cama_ocupada' as const : 'ocupado' as const,
          pasajeroId: asignacion.pasajero_id,
          nombrePasajero: pasajero ? `${pasajero.nombre || ''} ${pasajero.apellido || ''}`.trim() : 'Desconocido'
        }
      }
      return a
    })

    // 3. Actualizar el estado de React (solo si encontró asientos ocupados)
    if (nuevosAsientos.some(a => a.estado === 'ocupado' || a.estado === 'cama_ocupada')) {
      setAsientos(nuevosAsientos)
    }
  }

  cargarAsignaciones()
}, [viaje.id, pasajeros]) // Se ejecuta al cargar el viaje o cuando cambia la lista de pasajeros

  // ============================================
  // CARGAR PAGOS
  // ============================================

  useEffect(() => {
    const cargarPagos = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .eq('viaje_id', viaje.id)
        .eq('eliminado', false)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setPagos(data)
      }
    }
    cargarPagos()
  }, [viaje.id])

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

    // ✅ Evita hacer clic dos veces seguidas mientras se procesa
    if (aprobando === pasajeroId) return

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

    if (resultado.pagoId) {
      // ✅ El modal se cierra SOLO si el pago fue exitoso
      setPasajeroModal(null)
      router.refresh()
      window.open(`/recibo/${resultado.pagoId}`, '_blank')
    } else {
      // Si falló, no cerramos el modal para que el usuario pueda reintentar
      alert('Hubo un problema al registrar el pago. Inténtalo de nuevo.')
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

    // ✅ Evita hacer clic dos veces seguidas mientras se procesa
    if (aprobando === 'grupo') return

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

    if (resultado.pagoId) {
      // ✅ Todo el reseteo y cierre se hace SOLO si el pago fue exitoso
      setPasajeroModal(null)
      setPagoGrupal(false)
      setMiembrosGrupo([])
      router.refresh()
      window.open(`/recibo/${resultado.pagoId}`, '_blank')
    } else {
      alert('Hubo un problema al registrar el pago grupal. Inténtalo de nuevo.')
    }
  }

  // ============================================
  // HANDLER PARA EDITAR PAGO
  // ============================================

 const handleGuardarEdicionPago = async () => {
  if (!editandoPago) return
  
  setGuardandoEdicionPago(true)
  const supabase = createClient()
  
  try {
    // 1. Obtener el pago original (para saber el pasajero_id)
    const { data: pagoOriginal, error: errorOriginal } = await supabase
      .from('pagos')
      .select('pasajero_id')
      .eq('id', editandoPago.id)
      .single()
    
    if (errorOriginal || !pagoOriginal) {
      throw new Error('No se encontró el pago original')
    }
    
    // 2. Actualizar el pago con el nuevo monto
    const { error: errorUpdate } = await supabase
      .from('pagos')
      .update({
        monto: editandoPago.monto,
        metodo_pago: editandoPago.metodo_pago,
        tipo_tarjeta: editandoPago.tipo_tarjeta || null,
        cantidad_cuotas: editandoPago.cuotas || null,
        recargo_aplicado: editandoPago.recargo || 0,
        notas: editandoPago.notas || null
      })
      .eq('id', editandoPago.id)
    
    if (errorUpdate) throw errorUpdate
    
    // 3. ✅ RECALCULAR SUMA TOTAL DE PAGOS (desde cero)
    const { data: todosLosPagos, error: errorPagos } = await supabase
      .from('pagos')
      .select('monto')
      .eq('pasajero_id', pagoOriginal.pasajero_id)
      .eq('eliminado', false)
    
    if (errorPagos) throw errorPagos
    
    const nuevoMontoPagado = todosLosPagos?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0
    
    // 4. Obtener el monto_total del pasajero
    const { data: pasajero, error: errorPasajero } = await supabase
      .from('pasajeros')
      .select('monto_total')
      .eq('id', pagoOriginal.pasajero_id)
      .single()
    
    if (errorPasajero || !pasajero) {
      throw new Error('No se encontró el pasajero')
    }
    
    const estaPagado = nuevoMontoPagado >= (pasajero.monto_total || 0)
    
    // 5. Actualizar el pasajero con el NUEVO monto pagado
    const { error: errorUpdatePasajero } = await supabase
      .from('pasajeros')
      .update({
        monto_pagado: nuevoMontoPagado,
        estado_pago: estaPagado ? 'pagado' : 'pendiente'
      })
      .eq('id', pagoOriginal.pasajero_id)
    
    if (errorUpdatePasajero) throw errorUpdatePasajero
    
    // 6. ✅ Recalcular el monto_total del pasajero (por si cambió el seguro)
    await recalcularMontoTotal(pagoOriginal.pasajero_id)
    
    // 7. Cerrar modal y recargar
    setEditandoPago(null)
    setGuardandoEdicionPago(false)
    
    router.replace(`/viaje/${viaje.id}`)
    
    alert('✅ Pago editado correctamente')
    
  } catch (error) {
    alert('❌ Error al editar el pago')
    setGuardandoEdicionPago(false)
  }
}

  // ============================================
  // HANDLERS DE APROBACIÓN
  // ============================================

async function handleAprobarPasajero(id: string, iniciales?: string) {
  setAprobando(id)
  try {
    const resultado = await aprobarPasajero(id, viaje.id, iniciales || undefined)
    if (resultado?.error) {
      alert('Error al aprobar: ' + resultado.error)
      setAprobando(null)
      return
    }
    
    await recalcularMontoTotal(id)
    setDetalleModal(null)
    router.refresh()
  } catch (error) {
    alert('Error al aprobar el pasajero')
  } finally {
    setAprobando(null)
  }
}

  async function handleAprobarGrupo(grupoId: string, iniciales?: string) {
  setAprobando(grupoId)
  try {
    // ✅ Pasar undefined si no hay iniciales
    const resultado = await aprobarGrupo(grupoId, viaje.id, iniciales || undefined)
    if (resultado?.error) {
      alert('Error al aprobar: ' + resultado.error)
      return
    }
    
    // ✅ Recalcular monto_total de todos los miembros del grupo
    const supabase = createClient()
    const { data: miembros } = await supabase
      .from('pasajeros')
      .select('id')
      .eq('grupo_id', grupoId)
    
    if (miembros) {
      for (const miembro of miembros) {
        await recalcularMontoTotal(miembro.id)
      }
    }
    
    setDetalleModal(null)
    router.refresh()
  } catch (error) {
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
            {viaje.rangos_edad && viaje.rangos_edad.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {viaje.rangos_edad.map((rango) => (
                  <span key={rango.id} className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-300">
                    {rango.descripcion}: ${rango.precio.toLocaleString()}
                  </span>
                ))}
              </div>
            )}
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

        {/* Tabs principales - AHORA SOLO 2 */}
        <div className="flex gap-8 mb-6 border-b border-gray-700">
          {['pasajeros', 'ruta'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as typeof tab)}
              className={`pb-3 px-1 text-sm font-medium transition-all ${
                tab === t
                  ? 'border-b-2 border-blue-500 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {t === 'pasajeros' ? '👥 Pasajeros y Pagos' : '🗺️ Hoja de ruta'}
            </button>
          ))}
        </div>

        {/* ============================================
            TAB: PASAJEROS + PAGOS (UNIDOS)
            ============================================ */}
        {tab === 'pasajeros' && (
          <div>
            {/* Sub-pestañas dentro de Pasajeros */}
            <div className="flex gap-4 mb-4 border-b border-gray-700">
              <button
                onClick={() => setSubTabPasajeros('lista')}
                className={`pb-2 px-1 text-xs font-medium transition-all ${
                  subTabPasajeros === 'lista'
                    ? 'border-b-2 border-blue-500 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                👥 Lista de pasajeros
              </button>
              <button
                onClick={() => setSubTabPasajeros('pagos')}
                className={`pb-2 px-1 text-xs font-medium transition-all ${
                  subTabPasajeros === 'pagos'
                    ? 'border-b-2 border-blue-500 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                💳 Pagos
              </button>
            </div>

            {/* Contenido de Pasajeros - Lista */}
            {subTabPasajeros === 'lista' && (
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

            {/* Contenido de Pasajeros - Pagos */}
            {subTabPasajeros === 'pagos' && (
              <div>
                {/* Header con botón de exportar */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">💳 Pagos</h2>
                  <BotonExportarPagos 
                    pagos={pagos}
                    pasajeros={pasajeros}
                    viajeNombre={viaje.destino}
                  />
                </div>
                
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
                          <div className="flex gap-2 flex-wrap">
                            {/* ✅ BOTÓN EDITAR MONTO TOTAL DEL GRUPO */}
                            <button
                              onClick={() => {
                                setEditandoMontoGrupal({
                                  grupoId: grupoId,
                                  montoTotal: montoTotalGrupo,
                                  nombre: `${titular.nombre || ''} ${titular.apellido || ''}`.trim() || 'Grupo',
                                  miembros: miembros
                                })
                              }}
                              className="text-xs rounded-lg px-3 py-1.5 font-medium border-none transition-opacity hover:opacity-85 bg-green-600 text-white"
                            >
                              💰 Editar monto total
                            </button>
                            
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
                              {/* ✅ BOTÓN DESHACER CON EL NUEVO COMPONENTE */}
                              <BotonDeshacerPago
                                pagoId={p.id}
                                monto={p.monto_pagado || 0}
                                metodoPago={p.metodo_pago || 'No especificado'}
                                numeroRecibo={p.numero_recibo || 0}
                                pasajeroNombre={`${p.nombre || ''} ${p.apellido || ''}`.trim()}
                                onDeshacer={() => {
                                  router.refresh()
                                }}
                              />
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
              </div>
            )}
          </div>
        )}

        {/* ============================================
            TAB: HOJA DE RUTA (SOLO RUTA)
            ============================================ */}
        {tab === 'ruta' && (
          <div>
            {/* SUBPESTAÑAS DE RUTA */}
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

            {/* CONTENIDO DE RUTA */}
           {subTabRuta === 'asientos' && (
  <div>
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-white font-medium">🪑 Mapa de asientos</h3>
      <BotonExportarAsientos 
        asientos={asientos}
        viajeNombre={viaje.destino}
      />
    </div>
            
  <ContenidoAsientos 
    asientos={asientos}
    pasajerosSinAsiento={pasajerosSinAsiento}
    onAsignarAsiento={(asientoNumero, pasajeroId) => {
      const pasajero = pasajerosSinAsiento.find(p => p.id === pasajeroId)
      if (!pasajero) return

      const asiento = asientos.find(a => a.numero === asientoNumero)
      const recargo = asiento?.recargo_asiento || 0

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

      const guardarRecargo = async () => {
        const supabase = createClient()
        const { error } = await supabase
          .from('pasajeros')
          .update({ recargo_asiento: recargo })
          .eq('id', pasajeroId)
        
        if (!error) {
          await recalcularMontoTotal(pasajeroId)
          router.refresh()
        }
      }
      guardarRecargo()
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

      const quitarRecargo = async () => {
        const asiento = asientos.find(a => a.numero === asientoNumero)
        if (asiento?.pasajeroId) {
          const supabase = createClient()
          const { error } = await supabase
            .from('pasajeros')
            .update({ recargo_asiento: 0 })
            .eq('id', asiento.pasajeroId)
          
          if (!error) {
            await recalcularMontoTotal(asiento.pasajeroId)
            router.refresh()
          }
        }
      }
      quitarRecargo()
    }}
    viajeId={viaje.id}
  />
  </div>
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
                viajeId={viaje.id}
                onAgregarHabitacion={(habitacion) => {
                  setHabitaciones([...habitaciones, habitacion])
                }}
                onAsignarPasajero={(habitacionId, pasajeroId) => {
                  const nuevas = habitaciones.map(h => {
                    if (h.id === habitacionId) {
                      return { ...h, pasajeros: [...h.pasajeros, pasajeroId] }
                    }
                    return h
                  })
                  setHabitaciones(nuevas)
                }}
                onQuitarPasajero={(habitacionId, pasajeroId) => {
                  const nuevas = habitaciones.map(h => {
                    if (h.id === habitacionId) {
                      return { ...h, pasajeros: h.pasajeros.filter(id => id !== pasajeroId) }
                    }
                    return h
                  })
                  setHabitaciones(nuevas)
                }}
                onEliminarHabitacion={(id) => {
                  setHabitaciones(habitaciones.filter(h => h.id !== id))
                }}
                onRefresh={() => {
                  // Función para recargar las habitaciones desde la base de datos si hay cambios en otro lado
                }}
              />
            )}
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
              if (!detalleModal) return
              
              const esGrupo = detalleModal.esGrupo
              const pasajeroId = detalleModal.pasajero.id
              const grupoId = detalleModal.miembros[0]?.grupo_id
              
              if (esGrupo && grupoId) {
                handleAprobarGrupo(grupoId, iniciales)
              } else if (pasajeroId) {
                handleAprobarPasajero(pasajeroId, iniciales)
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
              if (!detalleModal.esGrupo) {
                setPasajeroAMover(detalleModal.pasajero)
                setDetalleModal(null)
                cargarViajesDisponibles()
                setMostrarModalMover(true)
              }
            }}
            onMoverGrupo={() => {
              if (detalleModal.esGrupo) {
                const titular = detalleModal.miembros.find(m => m.es_titular) || detalleModal.pasajero
                setPasajeroAMover(titular)
                setDetalleModal(null)
                cargarViajesDisponibles()
                setMostrarModalMover(true)
              }
            }}
            onEditarMontoTotal={(data) => {
              setEditandoMontoTotal(data)
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

        {/* Modal Historial de Pagos */}
        {historialPagos && (
          <ModalHistorialPagos
            pasajeroId={historialPagos.pasajeroId}
            nombrePasajero={historialPagos.nombre}
            onClose={() => setHistorialPagos(null)}
            onEditarPago={(pago) => {
              setEditandoPago({
                id: pago.id,
                monto: pago.monto,
                metodo_pago: pago.metodo_pago || 'Efectivo',
                created_at: pago.created_at,
                notas: pago.notas || '',
                tipo_tarjeta: pago.tipo_tarjeta || '',
                cuotas: pago.cantidad_cuotas || 0,
                recargo: pago.recargo_aplicado || 0,
                pasajero_id: historialPagos.pasajeroId
              })
              setHistorialPagos(null)
            }}
            onPagoEliminado={() => {
              router.refresh()
            }}
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

              {/* Viaje destino */}
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
                    const precioDestino = viajeDest.precio || 0
                    const montoPagado = pasajeroAMover.monto_pagado || 0
                    
                    const nuevoMontoTotal = precioDestino
                    const deudaRestante = nuevoMontoTotal - montoPagado
                    
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

        {/* ============================================
            MODAL EDITAR PAGO
            ============================================ */}
        {editandoPago && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 text-xl">✏️</span>
                </div>
                <h3 className="text-xl font-bold text-white">Editar pago</h3>
              </div>

              <div className="space-y-4">
                {/* Monto */}
                <div>
                  <label className="text-sm font-semibold text-gray-300 block mb-1">
                    💰 Monto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editandoPago.monto}
                    onChange={(e) => setEditandoPago({
                      ...editandoPago,
                      monto: parseFloat(e.target.value) || 0
                    })}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                    min="0"
                    step="100"
                  />
                </div>

                {/* Método de pago */}
                <div>
                  <label className="text-sm font-semibold text-gray-300 block mb-1">
                    💳 Método de pago <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editandoPago.metodo_pago}
                    onChange={(e) => setEditandoPago({
                      ...editandoPago,
                      metodo_pago: e.target.value
                    })}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta Débito">Tarjeta Débito</option>
                    <option value="Tarjeta Crédito">Tarjeta Crédito</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                  </select>
                </div>

                {/* Tipo de tarjeta */}
                {editandoPago.metodo_pago === 'Tarjeta Crédito' && (
                  <div>
                    <label className="text-sm font-semibold text-gray-300 block mb-1">
                      Tipo de tarjeta
                    </label>
                    <select
                      value={editandoPago.tipo_tarjeta || ''}
                      onChange={(e) => setEditandoPago({
                        ...editandoPago,
                        tipo_tarjeta: e.target.value
                      })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="American Express">American Express</option>
                      <option value="Naranja">Naranja</option>
                    </select>
                  </div>
                )}

                {/* Cuotas */}
                {editandoPago.metodo_pago === 'Tarjeta Crédito' && (
                  <div>
                    <label className="text-sm font-semibold text-gray-300 block mb-1">
                      Cuotas
                    </label>
                    <select
                      value={editandoPago.cuotas || 1}
                      onChange={(e) => setEditandoPago({
                        ...editandoPago,
                        cuotas: parseInt(e.target.value)
                      })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 9, 12, 18, 24].map(n => (
                        <option key={n} value={n}>{n} cuota{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Notas */}
                <div>
                  <label className="text-sm font-semibold text-gray-300 block mb-1">
                    📝 Notas (opcional)
                  </label>
                  <input
                    type="text"
                    value={editandoPago.notas || ''}
                    onChange={(e) => setEditandoPago({
                      ...editandoPago,
                      notas: e.target.value
                    })}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Motivo del cambio..."
                  />
                </div>

                {/* Advertencia */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-xs text-yellow-400">
                    ⚠️ Al editar el monto, se actualizará automáticamente el total pagado del pasajero.
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setEditandoPago(null)}
                  className="flex-1 border border-gray-600 rounded-lg py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
                  disabled={guardandoEdicionPago}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarEdicionPago}
                  disabled={guardandoEdicionPago || !editandoPago.monto || editandoPago.monto <= 0}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                    !guardandoEdicionPago && editandoPago.monto > 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {guardandoEdicionPago ? 'Guardando...' : '💾 Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            MODAL EDITAR MONTO TOTAL INDIVIDUAL
            ============================================ */}
        {editandoMontoTotal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-400 text-xl">💰</span>
                </div>
                <h3 className="text-xl font-bold text-white">Editar monto total</h3>
              </div>

              <p className="text-sm text-gray-300 mb-4">
                Editando el monto total de <strong className="text-white">{editandoMontoTotal.nombre}</strong>
              </p>

              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-300 block mb-1">
                  💰 Monto total <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={editandoMontoTotal.montoTotal}
                  onChange={(e) => setEditandoMontoTotal({
                    ...editandoMontoTotal,
                    montoTotal: parseFloat(e.target.value) || 0
                  })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                  min="0"
                  step="100"
                />
                <p className="text-xs text-gray-400 mt-1">Este monto aparecerá en el recibo del pasajero</p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-400">
                  ⚠️ Al editar el monto total, se actualizará el recibo y la deuda del pasajero.
                  <br />
                  <span className="text-gray-400">El monto pagado no se modificará.</span>
                </p>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setEditandoMontoTotal(null)}
                  className="flex-1 border border-gray-600 rounded-lg py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
                  disabled={guardandoMontoTotal}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarMontoTotal}
                  disabled={guardandoMontoTotal || editandoMontoTotal.montoTotal < 0}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                    !guardandoMontoTotal && editandoMontoTotal.montoTotal >= 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {guardandoMontoTotal ? 'Guardando...' : '💾 Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            MODAL EDITAR MONTO TOTAL GRUPAL
            ============================================ */}
        {editandoMontoGrupal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-400 text-xl">👥</span>
                </div>
                <h3 className="text-xl font-bold text-white">Editar monto total del grupo</h3>
              </div>

              <p className="text-sm text-gray-300 mb-4">
                Editando el monto total de <strong className="text-white">{editandoMontoGrupal.nombre}</strong>
                <br />
                <span className="text-xs text-gray-400">{editandoMontoGrupal.miembros.length} integrantes</span>
              </p>

              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-300 block mb-1">
                  💰 Monto total del grupo <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={editandoMontoGrupal.montoTotal}
                  onChange={(e) => setEditandoMontoGrupal({
                    ...editandoMontoGrupal,
                    montoTotal: parseFloat(e.target.value) || 0
                  })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                  min="0"
                  step="100"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Se dividirá equitativamente entre los {editandoMontoGrupal.miembros.length} integrantes
                  <br />
                  <span className="text-green-400">
                    Cada pasajero: ${Math.round(editandoMontoGrupal.montoTotal / editandoMontoGrupal.miembros.length).toLocaleString()}
                  </span>
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-400">
                  ⚠️ Al editar el monto total del grupo, se actualizarán todos los recibos.
                  <br />
                  <span className="text-gray-400">El monto pagado no se modificará.</span>
                </p>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setEditandoMontoGrupal(null)}
                  className="flex-1 border border-gray-600 rounded-lg py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
                  disabled={guardandoMontoTotal}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarMontoGrupal}
                  disabled={guardandoMontoTotal || editandoMontoGrupal.montoTotal < 0}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                    !guardandoMontoTotal && editandoMontoGrupal.montoTotal >= 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {guardandoMontoTotal ? 'Guardando...' : '💾 Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </main>
  )
}