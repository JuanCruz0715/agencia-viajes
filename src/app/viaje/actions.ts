'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type DatosViaje = {
  destino: string
  fecha_inicio: string
  fecha_fin: string
  cupo_total: number
  descripcion: string | null
  precio: number | null
}

export async function crearViaje(datos: DatosViaje) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('viajes').insert(datos).select('id').single()

  if (error) {
    return { error: error.message }
  }
  revalidatePath('/home')
  redirect(`/viaje/${data.id}`)
}

export async function actualizarViaje(viajeId: string, datos: DatosViaje) {
  const supabase = await createClient()
  const { error } = await supabase.from('viajes').update(datos).eq('id', viajeId)

  if (error) {
    return { error: error.message }
  }
  revalidatePath('/home')
  revalidatePath(`/viaje/${viajeId}`)
  redirect(`/viaje/${viajeId}`)
}