import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FormularioViaje from '@/components/FormularioViaje'

export default async function EditarViajePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: viaje, error } = await supabase.from('viajes').select('*').eq('id', id).single()
  if (error || !viaje) {
    notFound()
  }
  return <FormularioViaje viaje={viaje} />
}