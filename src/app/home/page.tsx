import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: viajes, error } = await supabase
    .from('viajes')
    .select('*')
    .order('fecha_inicio', { ascending: true })

  if (error) {
    return <div className="p-8">Error cargando viajes: {error.message}</div>
  }

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-semibold">Viajes - SN VIAJES Y TURISMO</h1>
  <a href="/viaje/nuevo" className="border rounded-lg px-4 py-2 text-sm">+ Nuevo viaje</a>
</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {viajes?.map((viaje) => (
          <Link
            key={viaje.id}
            href={`/viaje/${viaje.id}`}
            className="border rounded-lg p-4 hover:bg-gray-50"
          >
            <p className="font-medium">{viaje.destino}</p>
            <p className="text-sm text-gray-500">
              {viaje.fecha_inicio} - {viaje.fecha_fin}
            </p>
            <p className="text-sm text-gray-500 mt-2">Cupo: {viaje.cupo_total}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}