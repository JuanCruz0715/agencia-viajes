import { createClient } from '@/lib/supabase/server'
import FormularioInscripcion from '@/components/FormularioInscripcion'

export default async function FormularioPage() {
  const supabase = await createClient()
  const { data: viajes } = await supabase
    .from('viajes')
    .select('id, destino, fecha_inicio, fecha_fin,precio')
    .order('fecha_inicio', { ascending: true })

  return <FormularioInscripcion viajes={viajes ?? []} />
}