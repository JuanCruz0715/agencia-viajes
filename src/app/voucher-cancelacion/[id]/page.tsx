'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const SN_AZUL = '#1B3A5C'
const SN_CELESTE = '#2D9CB8'
const SN_AMARILLO = '#F2B632'

type Cancelacion = {
  id: string
  pasajero_id: string
  viaje_id: string
  nombre_pasajero: string
  monto_total: number
  monto_pagado: number
  tipo_reembolso: string
  monto_reembolsado: number
  motivo: string
  fecha_cancelacion: string
  created_at: string
  pasajeros?: {
    nombre: string
    apellido: string
    nombre_pasajero: string
    numero_documento: string
  }
  viajes?: {
    destino: string
    fecha_inicio: string
    fecha_fin: string
  }
}

export default function VoucherCancelacionPage() {
  const params = useParams()
  const [cancelacion, setCancelacion] = useState<Cancelacion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarCancelacion = async () => {
      try {
        const supabase = createClient()
        
        // Obtener la cancelación
        const { data: cancelacionData, error: cancelacionError } = await supabase
          .from('cancelaciones')
          .select('*')
          .eq('id', params.id)
          .single()

        if (cancelacionError) {
          console.error('Error al cargar cancelación:', cancelacionError)
          setError(cancelacionError.message)
          setCargando(false)
          return
        }

        // Obtener el pasajero
        const { data: pasajeroData, error: pasajeroError } = await supabase
          .from('pasajeros')
          .select('nombre, apellido, nombre_pasajero, numero_documento')
          .eq('id', cancelacionData.pasajero_id)
          .single()

        if (pasajeroError) {
          console.error('Error al cargar pasajero:', pasajeroError)
          setError(pasajeroError.message)
          setCargando(false)
          return
        }

        // Obtener el viaje
        const { data: viajeData, error: viajeError } = await supabase
          .from('viajes')
          .select('destino, fecha_inicio, fecha_fin')
          .eq('id', cancelacionData.viaje_id)
          .single()

        if (viajeError) {
          console.error('Error al cargar viaje:', viajeError)
          // No es crítico, continuar sin viaje
        }

        setCancelacion({
          ...cancelacionData,
          pasajeros: pasajeroData,
          viajes: viajeData || undefined
        })
        
        setCargando(false)
      } catch (err) {
        console.error('Error inesperado:', err)
        setError('Error al cargar el voucher')
        setCargando(false)
      }
    }

    if (params.id) {
      cargarCancelacion()
    }
  }, [params.id])

  const handleImprimir = () => {
    window.print()
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#F5F8FA' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: SN_CELESTE }}></div>
          <p className="mt-4 text-gray-500">Cargando voucher...</p>
        </div>
      </div>
    )
  }

  if (error || !cancelacion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#F5F8FA' }}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-xl font-semibold text-gray-800">Voucher no encontrado</h1>
          <p className="text-gray-500 mt-2">El voucher que buscas no existe o fue eliminado.</p>
          <p className="text-xs text-gray-400 mt-4">Error: {error || 'No encontrado'}</p>
        </div>
      </div>
    )
  }

  const nombreCompleto = cancelacion.pasajeros?.nombre_pasajero || 
    `${cancelacion.pasajeros?.nombre || ''} ${cancelacion.pasajeros?.apellido || ''}`.trim() || 
    'No disponible'

  const tipoReembolsoTexto = {
    'voucher': '🎫 Voucher',
    'devolucion': '💰 Devolución de dinero',
    'sin_reembolso': '❌ Sin reembolso'
  }[cancelacion.tipo_reembolso] || cancelacion.tipo_reembolso

  const colorReembolso = {
    'voucher': '#2D9CB8',
    'devolucion': '#F2B632',
    'sin_reembolso': '#DC2626'
  }[cancelacion.tipo_reembolso] || '#1B3A5C'

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#F5F8FA' }}>
      {/* Botón imprimir */}
      <div className="max-w-2xl mx-auto mb-4 flex justify-end print:hidden">
        <button
          onClick={handleImprimir}
          className="px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2"
          style={{ background: SN_AZUL }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir / Guardar como PDF
        </button>
      </div>

      {/* VOUCHER */}
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 print:shadow-none">
        {/* Logo y título */}
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: '#DC2626' }}>
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16">
              <Image
                src="/logo-sn.png"
                alt="SN Viajes y Turismo"
                fill
                className="object-contain"
                sizes="64px"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: SN_AZUL }}>SN Viajes y Turismo</h1>
              <p className="text-xs" style={{ color: '#DC2626' }}>VOUCHER DE CANCELACIÓN Nº {cancelacion.id.slice(0, 8)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Fecha de cancelación</p>
            <p className="text-sm font-medium" style={{ color: SN_AZUL }}>
              {new Date(cancelacion.fecha_cancelacion || cancelacion.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Estado de cancelación */}
        <div className="mt-4 p-3 rounded-lg text-center" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <p className="text-sm font-semibold text-red-600">
            ⚠️ CANCELACIÓN CONFIRMADA
          </p>
        </div>

        {/* Datos del pasajero */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Pasajero</p>
            <p className="text-sm font-medium" style={{ color: SN_AZUL }}>{nombreCompleto}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Documento</p>
            <p className="text-sm font-medium" style={{ color: SN_AZUL }}>{cancelacion.pasajeros?.numero_documento || 'No disponible'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Viaje</p>
            <p className="text-sm font-medium" style={{ color: SN_AZUL }}>{cancelacion.viajes?.destino || 'No disponible'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Fechas</p>
            <p className="text-sm font-medium" style={{ color: SN_AZUL }}>
              {cancelacion.viajes?.fecha_inicio || ''} a {cancelacion.viajes?.fecha_fin || ''}
            </p>
          </div>
        </div>

        {/* Motivo */}
        <div className="mt-4 p-3 rounded-lg" style={{ background: '#F8FAFC' }}>
          <p className="text-xs text-gray-500">Motivo de cancelación</p>
          <p className="text-sm font-medium" style={{ color: SN_AZUL }}>{cancelacion.motivo || 'No especificado'}</p>
        </div>

        {/* Detalle del reembolso */}
        <div className="mt-4 border-t pt-4" style={{ borderColor: '#E5E7EB' }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Monto total del viaje</p>
              <p className="text-lg font-bold" style={{ color: SN_AZUL }}>
                ${cancelacion.monto_total.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Monto pagado a la fecha</p>
              <p className="text-lg font-bold" style={{ color: SN_CELESTE }}>
                ${cancelacion.monto_pagado.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tipo de reembolso */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Tipo de reembolso</p>
            <p className="text-sm font-medium" style={{ color: colorReembolso }}>
              {tipoReembolsoTexto}
            </p>
          </div>
          {cancelacion.tipo_reembolso !== 'sin_reembolso' && cancelacion.monto_reembolsado !== undefined && (
            <div>
              <p className="text-xs text-gray-500">Monto reembolsado</p>
              <p className="text-lg font-bold" style={{ color: '#DC2626' }}>
                ${cancelacion.monto_reembolsado.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Mensaje adicional */}
        <div className="mt-4 p-3 rounded-lg text-center" style={{ background: '#F0F8FA' }}>
          {cancelacion.tipo_reembolso === 'voucher' && (
            <p className="text-sm text-gray-700">
              🎫 El pasajero recibió un <strong>voucher</strong> por ${cancelacion.monto_reembolsado?.toLocaleString() || 0} 
              para utilizar en un futuro viaje.
            </p>
          )}
          {cancelacion.tipo_reembolso === 'devolucion' && (
            <p className="text-sm text-gray-700">
              💰 Se realizó la devolución del dinero por ${cancelacion.monto_reembolsado?.toLocaleString() || 0} 
              al pasajero.
            </p>
          )}
          {cancelacion.tipo_reembolso === 'sin_reembolso' && (
            <p className="text-sm text-gray-700">
              ❌ La cancelación se realizó sin derecho a reembolso.
            </p>
          )}
        </div>

        {/* Pie de página */}
        <div className="mt-6 text-center text-xs text-gray-400 border-t pt-4" style={{ borderColor: '#E5E7EB' }}>
          <p>Este voucher es un comprobante válido de cancelación.</p>
          <p>SN Viajes y Turismo - Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}