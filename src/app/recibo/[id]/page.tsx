import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BotonImprimir from '@/components/BotonImprimir'

export default async function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: pago, error } = await supabase
    .from('pagos')
    .select('*, pasajeros(nombre_pasajero, numero_documento, monto_pagado, monto_total), viajes(destino, fecha_inicio, fecha_fin)')
    .eq('id', id)
    .single()

  if (error || !pago) {
    notFound()
  }

  const pasajero = pago.pasajeros as any
  const viaje = pago.viajes as any
  const saldo = (pasajero?.monto_total ?? 0) - (pasajero?.monto_pagado ?? 0)

  return (
    <main className="p-8 max-w-md mx-auto">
      <div className="border rounded-lg p-6">
        <p className="text-center text-sm text-gray-500 mb-1">SN Viajes y Turismo</p>
        <h1 className="text-center text-lg font-semibold mb-4">Recibo de pago Nº {pago.numero_recibo}</h1>

        <div className="text-sm space-y-1 mb-4">
          <p><span className="text-gray-500">Fecha:</span> {new Date(pago.created_at).toLocaleDateString('es-AR')}</p>
          <p><span className="text-gray-500">Pasajero:</span> {pasajero?.nombre_pasajero}</p>
          <p><span className="text-gray-500">Documento:</span> {pasajero?.numero_documento}</p>
          <p><span className="text-gray-500">Viaje:</span> {viaje?.destino}</p>
          <p><span className="text-gray-500">Fechas:</span> {viaje?.fecha_inicio} a {viaje?.fecha_fin}</p>
        </div>

        <div className="border-t pt-4 text-sm space-y-1">
          <p className="flex justify-between"><span>Monto abonado ahora:</span><span className="font-medium">${pago.monto}</span></p>
          <p className="flex justify-between"><span>Total pagado a la fecha:</span><span>${pasajero?.monto_pagado ?? 0}</span></p>
          <p className="flex justify-between"><span>Saldo pendiente:</span><span>${saldo > 0 ? saldo : 0}</span></p>
          <p><span className="text-gray-500">Método de pago:</span> {pago.metodo_pago}</p>
        </div>

        <BotonImprimir />
      </div>
    </main>
  )
}