import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FichaViaje from '@/components/FichaViaje'

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

  return <FichaViaje viaje={viaje} pasajeros={pasajeros ?? []} hojaRuta={hojaRuta ?? []} />
}