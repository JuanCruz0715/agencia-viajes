'use client'

export default function BotonImprimir() {
  return (
    <button onClick={() => window.print()} className="w-full border rounded-lg p-2 mt-6 print:hidden">
      Imprimir / Guardar como PDF
    </button>
  )
}