'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type RangoEdad = {
  id: string
  edad_min: number
  edad_max: number
  precio: number
  descripcion: string
}

type DatosViaje = {
  destino: string
  fecha_inicio: string
  fecha_fin: string
  cupo_total: number
  descripcion: string | null
  precio: number | null
  rangos_edad?: RangoEdad[] // ✅ AGREGAR ESTO
}

export async function crearViaje(datos: DatosViaje) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('viajes')
    .insert({
      destino: datos.destino,
      fecha_inicio: datos.fecha_inicio,
      fecha_fin: datos.fecha_fin,
      cupo_total: datos.cupo_total,
      descripcion: datos.descripcion,
      precio: datos.precio,
      rangos_edad: datos.rangos_edad || [], // ✅ AGREGAR ESTO
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }
  revalidatePath('/home')
  redirect(`/viaje/${data.id}`)
}

export async function actualizarViaje(viajeId: string, datos: DatosViaje) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('viajes')
    .update({
      destino: datos.destino,
      fecha_inicio: datos.fecha_inicio,
      fecha_fin: datos.fecha_fin,
      cupo_total: datos.cupo_total,
      descripcion: datos.descripcion,
      precio: datos.precio,
      rangos_edad: datos.rangos_edad || [], // ✅ AGREGAR ESTO
    })
    .eq('id', viajeId)

  if (error) {
    return { error: error.message }
  }
  revalidatePath('/home')
  revalidatePath(`/viaje/${viajeId}`)
  redirect(`/viaje/${viajeId}`)
}