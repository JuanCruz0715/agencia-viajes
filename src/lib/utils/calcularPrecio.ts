// src/lib/utils/calcularPrecio.ts

export type RangoEdad = {
  id: string
  edad_min: number
  edad_max: number
  precio: number
  descripcion: string
}

export function calcularEdad(fechaNacimiento: string): number {
  if (!fechaNacimiento) return 0
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  return edad
}

export function calcularPrecioPorEdad(
  fechaNacimiento: string, 
  rangosEdad: RangoEdad[]
): number {
  if (!fechaNacimiento || !rangosEdad || rangosEdad.length === 0) return 0
  
  const edad = calcularEdad(fechaNacimiento)
  
  const rango = rangosEdad.find(r => 
    edad >= r.edad_min && edad <= r.edad_max
  )
  
  return rango?.precio || 0
}

export function obtenerDescripcionRango(
  fechaNacimiento: string,
  rangosEdad: RangoEdad[]
): string {
  if (!fechaNacimiento || !rangosEdad || rangosEdad.length === 0) return ''
  
  const edad = calcularEdad(fechaNacimiento)
  const rango = rangosEdad.find(r => 
    edad >= r.edad_min && edad <= r.edad_max
  )
  
  return rango?.descripcion || ''
}