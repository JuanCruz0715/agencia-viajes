// app/viaje/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FichaViaje from '@/components/FichaViaje'
import DebugErrorBoundary from '@/components/DebugErrorBoundary'

export default async function ViajePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: viaje, error } = await supabase.from('viajes').select('*').eq('id', id).single()
  if (error || !viaje) {
    notFound()
  }

  const { data: pasajeros } = await supabase.from('pasajeros').select('*').eq('viaje_id', id)
  const { data: hojaRuta } = await supabase
    .from('hoja_ruta')
    .select('*')
    .eq('viaje_id', id)
    .order('dia_numero', { ascending: true })

  const pasajerosArray = Array.isArray(pasajeros) ? pasajeros : []
  const hojaRutaArray = Array.isArray(hojaRuta) ? hojaRuta : []

  return (
    <DebugErrorBoundary>
      <FichaViaje 
        viaje={viaje} 
        pasajeros={pasajerosArray} 
        hojaRuta={hojaRutaArray}
        
      />
    </DebugErrorBoundary>
  )
}