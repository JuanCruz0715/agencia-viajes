'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bricolage_Grotesque, IBM_Plex_Mono } from 'next/font/google'

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' })

// ============================================
// PALETA — misma que el resto de la app
// ============================================
const INK = '#12131C'
const PANEL = '#1B1D2B'
const LINE = '#2C2E42'
const CHALK_DIM = '#9CA0B8'
const CORAL = '#E8734A'
const GOLD = '#D9A441'
const ROUTE = '#5FB8AD'
const ROJO = '#DC2626'

type RangoEdad = {
  id: string
  edad_min: number
  edad_max: number
  precio: number
  descripcion: string
}

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
  seguro_incluido?: boolean | null
}

type Props = {
  pasajero: Pasajero
  esGrupo?: boolean
  miembros?: Pasajero[]
  onAprobar: (iniciales: string) => void
  onCancel: () => void
  onEliminar?: () => void
  onEditar?: () => void
  onCancelar?: () => void
  onVerHistorial?: (pasajeroId: string, nombre: string) => void
  estaAprobando?: boolean
  onMover?: () => void
  onMoverGrupo?: () => void
  onEditarMontoTotal?: (data: { pasajeroId: string; montoTotal: number; nombre: string }) => void // ✅ NUEVO
}

// SOLO 3 VENDEDORES
const VENDEDORES = [
  { iniciales: 'MT', nombre: 'Maria Jose Tapia' },
  { iniciales: 'GP', nombre: 'Gabriela Paladini' },
  { iniciales: 'MM', nombre: 'Mauricio Murua' },
]

export default function ModalDetallePasajero({
  pasajero,
  esGrupo = false,
  miembros = [],
  onAprobar,
  onCancel,
  onEliminar,
  onEditar,
  onCancelar,
  onVerHistorial,
  estaAprobando = false,
  onMover,
  onMoverGrupo,
  onEditarMontoTotal, // ✅ NUEVO
}: Props) {
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<{ iniciales: string; nombre: string } | null>(null)
  const [mostrarListaVendedores, setMostrarListaVendedores] = useState(false)

  const titular = miembros.find((m) => m.es_titular) ?? pasajero
  const resto = miembros.filter((m) => m.id !== titular.id)
  const yaAprobado = pasajero.estado_revision === 'aprobado'

  const handleAprobar = () => {
    console.log('🟢 handleAprobar - EJECUTADO')
    console.log('🟢 pasajero.id:', pasajero.id)
    console.log('🟢 vendedorSeleccionado:', vendedorSeleccionado)
    const iniciales = vendedorSeleccionado?.iniciales || ''
    console.log('🟢 iniciales a enviar:', iniciales)
    onAprobar(iniciales)
  }

  const seleccionarVendedor = (iniciales: string, nombre: string) => {
    console.log('🟢 Vendedor seleccionado:', { iniciales, nombre })
    setVendedorSeleccionado({ iniciales, nombre })
    setMostrarListaVendedores(false)
  }

  const handleCerrar = () => {
    console.log('🟡 Cerrando modal - resetear aprobando')
    setVendedorSeleccionado(null)
    onCancel()
  }

  const handleVerHistorial = () => {
    if (onVerHistorial) {
      const nombre = `${titular.nombre || ''} ${titular.apellido || ''}`.trim() || 'Pasajero'
      onVerHistorial(titular.id, nombre)
    }
  }

  // 🔥 Función de aprobación directa - CON CÁLCULO DE SEGURO
  const aprobarDirecto = async () => {
    console.log('🔥🔥🔥 APROBACIÓN DIRECTA DESDE MODAL 🔥🔥🔥')
    console.log('pasajero.id:', pasajero.id)

    try {
      const supabase = createClient()

      // 1. Obtener los datos del pasajero y su viaje
      const { data: pasajeroData, error: errorPasajero } = await supabase
        .from('pasajeros')
        .select('viaje_id, fecha_nacimiento, seguro_incluido')
        .eq('id', pasajero.id)
        .single()

      if (errorPasajero || !pasajeroData) {
        console.error('🔴 Error al obtener pasajero:', errorPasajero)
        alert('❌ Error al obtener datos del pasajero')
        return
      }

      // 2. Obtener los datos del viaje
      const { data: viajeData, error: errorViaje } = await supabase
        .from('viajes')
        .select('precio, precio_seguro, rangos_edad')
        .eq('id', pasajeroData.viaje_id)
        .single()

      if (errorViaje || !viajeData) {
        console.error('🔴 Error al obtener viaje:', errorViaje)
        alert('❌ Error al obtener datos del viaje')
        return
      }

      // 3. Calcular el precio según la edad
      let montoTotal: number = viajeData.precio || 0
      let edad: number | null = null

      if (pasajeroData.fecha_nacimiento) {
        const hoy = new Date()
        const nac = new Date(pasajeroData.fecha_nacimiento)
        edad = hoy.getFullYear() - nac.getFullYear()
        const mes = hoy.getMonth() - nac.getMonth()
        if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) {
          edad = edad - 1
        }

        // Buscar en rangos_edad
        if (viajeData.rangos_edad && viajeData.rangos_edad.length > 0) {
          const rango = viajeData.rangos_edad.find(
            (r: RangoEdad) => edad !== null && edad >= r.edad_min && edad <= r.edad_max
          )
          if (rango) {
            montoTotal = rango.precio
          }
        }
      }

      // 4. ✅ SUMAR EL SEGURO SI CORRESPONDE
      const precioSeguro: number = viajeData.precio_seguro || 20000
      if (pasajeroData.seguro_incluido) {
        montoTotal = montoTotal + precioSeguro
        console.log('🟢 Seguro incluido: +$' + precioSeguro)
      }

      console.log('🟢 Monto total calculado:', montoTotal)

      // 5. Actualizar el pasajero con estado_revision y monto_total
      const { error } = await supabase
        .from('pasajeros')
        .update({
          estado_revision: 'aprobado',
          monto_total: montoTotal
        })
        .eq('id', pasajero.id)

      if (error) {
        console.error('🔴 Error en aprobación directa:', error)
        alert('❌ Error: ' + error.message)
        return
      }

      console.log('🟢 Pasajero aprobado con monto total: $' + montoTotal.toLocaleString())
      alert('✅ Pasajero aprobado correctamente!\nMonto total: $' + montoTotal.toLocaleString())

      // Recargar la página para ver los cambios
      window.location.reload()

    } catch (err) {
      console.error('🔴 Error en catch de aprobación directa:', err)
      alert('❌ Error: ' + (err as Error).message)
    }
  }

  // ============================================
  // ESTILOS COMPARTIDOS
  // ============================================
  const subPanel = { background: INK, border: `1px solid ${LINE}` }
  const label = 'text-[11px] uppercase tracking-wide'

  const actionBtn = (color: string, filled = false) => ({
    background: filled ? color : 'transparent',
    color: filled ? INK : color,
    border: `1px solid ${filled ? color : color + '55'}`,
  })

  return (
    <>
      <div className={`${display.variable} ${mono.variable} fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50`}>
        <style jsx global>{`
          .font-display { font-family: var(--font-display), sans-serif; }
          .font-mono-t { font-family: var(--font-mono), monospace; }
        `}</style>

        <div className="rounded-2xl w-full max-w-2xl flex flex-col" style={{ background: PANEL, border: `1px solid ${LINE}`, maxHeight: '90vh' }}>

          {/* HEADER FIJO */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: `1px solid ${LINE}` }}>
            <h3 className="font-display text-lg font-semibold text-white">
              {esGrupo ? 'Detalles del grupo' : 'Detalles del pasajero'}
            </h3>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium font-mono-t"
              style={{ background: yaAprobado ? `${ROUTE}22` : `${GOLD}22`, color: yaAprobado ? ROUTE : GOLD }}
            >
              {yaAprobado ? 'Confirmado' : 'Pendiente'}
            </span>
          </div>

          {/* CONTENIDO SCROLLEABLE */}
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

            {/* Datos del titular */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-display font-semibold text-white text-base">
                  {titular.nombre} {titular.apellido}
                </p>
                {titular.es_titular && (
                  <span className="text-xs px-2 py-0.5 rounded font-mono-t" style={{ background: `${ROUTE}22`, color: ROUTE }}>Titular</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className={label} style={{ color: CHALK_DIM }}>Documento</p>
                  <p className="text-white font-mono-t text-sm mt-0.5">{titular.tipo_documento || 'DNI'} {titular.numero_documento || '—'}</p>
                </div>
                <div>
                  <p className={label} style={{ color: CHALK_DIM }}>Email</p>
                  <p className="text-white mt-0.5">{titular.email_pasajero || '—'}</p>
                </div>
                <div>
                  <p className={label} style={{ color: CHALK_DIM }}>Teléfono</p>
                  <p className="text-white font-mono-t text-sm mt-0.5">{titular.telefono_pasajero || '—'}</p>
                </div>
                <div>
                  <p className={label} style={{ color: CHALK_DIM }}>Fecha de nacimiento</p>
                  <p className="text-white font-mono-t text-sm mt-0.5">{titular.fecha_nacimiento || '—'}</p>
                </div>
                <div>
                  <p className={label} style={{ color: CHALK_DIM }}>Edad</p>
                  <p className="text-white flex items-center gap-1.5 flex-wrap mt-0.5">
                    {titular.edad !== null && titular.edad !== undefined ? `${titular.edad} años` : '—'}
                    {titular.es_menor_3 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-mono-t" style={{ background: `${ROUTE}22`, color: ROUTE }}>sin butaca</span>
                    )}
                    {titular.es_menor_18 && !titular.es_menor_3 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-mono-t" style={{ background: `${GOLD}22`, color: GOLD }}>menor</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className={label} style={{ color: CHALK_DIM }}>Género</p>
                  <p className="text-white mt-0.5">{titular.genero_pasajero || '—'}</p>
                </div>
                <div>
                  <p className={label} style={{ color: CHALK_DIM }}>Nacionalidad</p>
                  <p className="text-white mt-0.5">{titular.nacionalidad || '—'}</p>
                </div>
                <div>
                  <p className={label} style={{ color: CHALK_DIM }}>Seguro de viaje</p>
                  <p className="mt-0.5">
                    {titular.seguro_incluido ? (
                      <span style={{ color: ROUTE }} className="font-medium">Incluido</span>
                    ) : (
                      <span style={{ color: CHALK_DIM }}>No contratado</span>
                    )}
                  </p>
                </div>
                {titular.vendedor && (
                  <div>
                    <p className={label} style={{ color: CHALK_DIM }}>Vendedor asignado</p>
                    <p className="text-white font-medium mt-0.5">{titular.vendedor}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contacto de emergencia */}
            <div className="rounded-lg p-3" style={subPanel}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: CHALK_DIM }}>Contacto de emergencia</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className={label} style={{ color: CHALK_DIM }}>Nombre</p>
                  <p className="text-white mt-0.5">{titular.contacto_emergencia_nombre || '—'}</p>
                </div>
                <div>
                  <p className={label} style={{ color: CHALK_DIM }}>Teléfono</p>
                  <p className="text-white font-mono-t text-sm mt-0.5">{titular.contacto_emergencia_telefono || '—'}</p>
                </div>
                <div>
                  <p className={label} style={{ color: CHALK_DIM }}>Parentesco</p>
                  <p className="text-white mt-0.5">{titular.contacto_emergencia_parentesco || '—'}</p>
                </div>
              </div>
            </div>

            {/* Info médica */}
            <div className="rounded-lg p-3" style={subPanel}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: CHALK_DIM }}>Información médica</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className={label} style={{ color: CHALK_DIM }}>Enfermedades</p>
                  <p className="text-white mt-0.5">{titular.enfermedad || 'Ninguna'}</p>
                </div>
                <div>
                  <p className={label} style={{ color: CHALK_DIM }}>Alergias</p>
                  <p className="text-white mt-0.5">{titular.alergia || 'Ninguna'}</p>
                </div>
                <div>
                  <p className={label} style={{ color: CHALK_DIM }}>Dieta especial</p>
                  <p className="text-white mt-0.5">{titular.dieta_especial || 'Ninguna'}</p>
                </div>
              </div>
              {titular.sugerencias && (
                <div className="mt-2 text-sm">
                  <p className={label} style={{ color: CHALK_DIM }}>Sugerencias</p>
                  <p className="text-white mt-0.5">{titular.sugerencias}</p>
                </div>
              )}
            </div>

            {/* Acompañantes */}
            {esGrupo && resto.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: CHALK_DIM }}>
                  Acompañantes ({resto.length})
                </p>
                <div className="space-y-2">
                  {resto.map((m) => (
                    <div key={m.id} className="rounded-lg p-3" style={subPanel}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-white">{m.nombre} {m.apellido}</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1.5 font-mono-t" style={{ color: CHALK_DIM }}>
                            <p>{m.tipo_documento || 'DNI'}: {m.numero_documento || '—'}</p>
                            {m.parentesco_con_titular && <p className="font-sans">Parentesco: {m.parentesco_con_titular}</p>}
                            {m.fecha_nacimiento && <p>Nac.: {m.fecha_nacimiento}</p>}
                            {m.edad !== null && m.edad !== undefined && (
                              <p className="font-sans">Edad: {m.edad} años {m.es_menor_3 ? '· sin butaca' : m.es_menor_18 ? '· menor' : ''}</p>
                            )}
                            {m.enfermedad && <p className="font-sans">Enfermedad: {m.enfermedad}</p>}
                            {m.alergia && <p className="font-sans">Alergia: {m.alergia}</p>}
                            {m.dieta_especial && <p className="font-sans">Dieta: {m.dieta_especial}</p>}
                            <p className="font-sans">Seguro: {m.seguro_incluido ? 'Incluido' : 'No'}</p>
                          </div>
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0 font-mono-t"
                          style={{
                            background: m.estado_revision === 'aprobado' ? `${ROUTE}22` : `${GOLD}22`,
                            color: m.estado_revision === 'aprobado' ? ROUTE : GOLD
                          }}
                        >
                          {m.estado_revision === 'aprobado' ? 'Confirmado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VENDEDOR - OPCIONAL */}
            <div className="rounded-lg p-4" style={{ background: `${ROUTE}0f`, border: `1px solid ${ROUTE}40` }}>
              <p className="text-sm font-semibold mb-2" style={{ color: ROUTE }}>
                Vendedor <span style={{ color: CHALK_DIM }} className="font-normal">(opcional)</span>
              </p>

              {vendedorSeleccionado ? (
                <div className="flex items-center justify-between rounded-lg p-2" style={{ background: `${ROUTE}18`, border: `1px solid ${ROUTE}55` }}>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full text-sm font-bold flex items-center justify-center font-mono-t" style={{ background: `${ROUTE}30`, color: ROUTE }}>
                      {vendedorSeleccionado.iniciales}
                    </span>
                    <span className="text-sm text-white font-medium">{vendedorSeleccionado.nombre}</span>
                  </div>
                  <button
                    onClick={() => setVendedorSeleccionado(null)}
                    className="text-xs font-medium transition-colors"
                    style={{ color: CORAL }}
                    type="button"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setMostrarListaVendedores(true)}
                  className="w-full rounded-lg py-3 text-sm transition-colors font-medium"
                  style={{ border: `2px dashed ${ROUTE}55`, color: ROUTE }}
                  type="button"
                >
                  + Seleccionar vendedor (opcional)
                </button>
              )}
              <p className="text-xs mt-1.5" style={{ color: CHALK_DIM }}>
                {vendedorSeleccionado ? 'Vendedor asignado' : 'No es obligatorio para aprobar'}
              </p>
            </div>
          </div>

          {/* BOTONES FIJOS ABAJO */}
          <div className="px-6 py-4 flex flex-col gap-2.5 flex-shrink-0" style={{ borderTop: `1px solid ${LINE}`, background: `${INK}80` }}>

            {/* Fila principal: cerrar + aprobar */}
            <div className="flex gap-2">
              <button
                onClick={handleCerrar}
                className="flex-1 rounded-lg py-2 text-sm transition-colors"
                style={{ border: `1px solid ${LINE}`, color: CHALK_DIM, background: 'transparent' }}
                type="button"
              >
                Cerrar
              </button>

              {!yaAprobado && (
                <button
                  onClick={aprobarDirecto}
                  className="flex-[2] rounded-lg py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: ROUTE, color: INK }}
                  type="button"
                >
                  ✓ Aprobar pasajero
                </button>
              )}
            </div>

            {/* Fila de acciones neutrales */}
            <div className="flex flex-wrap gap-2">
              {onEditar && (
                <button onClick={onEditar} className="flex-1 rounded-lg py-2 text-xs font-medium transition-colors" style={actionBtn(GOLD)} type="button">
                  Editar datos
                </button>
              )}
              {onVerHistorial && (
                <button onClick={handleVerHistorial} className="flex-1 rounded-lg py-2 text-xs font-medium transition-colors" style={actionBtn(ROUTE)} type="button">
                  Historial de pagos
                </button>
              )}
              {!esGrupo && onMover && (
                <button onClick={onMover} className="flex-1 rounded-lg py-2 text-xs font-medium transition-colors" style={actionBtn(ROUTE)} type="button">
                  Mover a otro viaje
                </button>
              )}
              {esGrupo && onMoverGrupo && (
                <button onClick={onMoverGrupo} className="flex-1 rounded-lg py-2 text-xs font-medium transition-colors" style={actionBtn(ROUTE)} type="button">
                  Mover grupo completo
                </button>
              )}
              {onEditarMontoTotal && (
                <button
                  onClick={() => {
                    onEditarMontoTotal({
                      pasajeroId: pasajero.id,
                      montoTotal: pasajero.monto_total || 0,
                      nombre: `${pasajero.nombre || ''} ${pasajero.apellido || ''}`.trim() || 'Sin nombre'
                    })
                  }}
                  className="flex-1 rounded-lg py-2 text-xs font-medium transition-colors"
                  style={actionBtn(ROUTE)}
                  type="button"
                >
                  Editar monto total
                </button>
              )}
            </div>

            {/* Zona de acciones sensibles */}
            {(onCancelar || onEliminar) && (
              <div className="flex gap-2 pt-2" style={{ borderTop: `1px solid ${LINE}` }}>
                {onCancelar && (
                  <button onClick={onCancelar} className="flex-1 rounded-lg py-2 text-xs font-medium transition-colors" style={actionBtn(GOLD)} type="button">
                    Cancelar reserva
                  </button>
                )}
                {onEliminar && (
                  <button onClick={onEliminar} className="flex-1 rounded-lg py-2 text-xs font-medium transition-colors" style={actionBtn(ROJO)} type="button">
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE LISTA DE VENDEDORES */}
      {mostrarListaVendedores && (
        <div className={`${display.variable} ${mono.variable} fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]`}>
          <div className="rounded-xl p-6 max-w-md w-full" style={{ background: PANEL, border: `1px solid ${LINE}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-white">Seleccionar vendedor</h3>
              <button
                onClick={() => setMostrarListaVendedores(false)}
                className="transition-colors"
                style={{ color: CHALK_DIM }}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {VENDEDORES.map((v) => (
                <button
                  key={v.iniciales}
                  onClick={() => seleccionarVendedor(v.iniciales, v.nombre)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left"
                  style={{ border: `1px solid ${LINE}`, background: INK }}
                  type="button"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${ROUTE}22` }}>
                    <span className="text-sm font-bold font-mono-t" style={{ color: ROUTE }}>{v.iniciales}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{v.nombre}</p>
                    <p className="text-xs font-mono-t" style={{ color: CHALK_DIM }}>Iniciales: {v.iniciales}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 flex justify-end" style={{ borderTop: `1px solid ${LINE}` }}>
              <button
                onClick={() => setMostrarListaVendedores(false)}
                className="px-4 py-2 text-sm transition-colors"
                style={{ color: CHALK_DIM }}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}