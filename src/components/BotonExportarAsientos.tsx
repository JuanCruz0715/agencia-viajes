// src/components/BotonExportarAsientos.tsx
'use client'

import { useRef } from 'react'
import html2canvas from 'html2canvas'

type Asiento = {
  numero: number
  estado: 'ocupado' | 'disponible' | 'cama_ocupada' | 'cama_libre'
  pasajeroId?: string
  nombrePasajero?: string
  tipo: 'semi_cama' | 'cama'
}

type Props = {
  asientos: Asiento[]
  viajeNombre: string
}

const SN_AZUL = '#1B3A5C'
const SN_CELESTE = '#2D9CB8'
const SN_AMARILLO = '#F2B632'
const BG_PAGINA = '#0B1620'
const BG_CARD = '#15212C'
const BORDE = '#1E2D3D'
const TEXTO_MUTED = '#9FB3C2'

const ASIENTOS_ESPECIALES = [1, 2, 3, 4, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56]
// Distribución de asientos - PLANTA ALTA
const FILAS_PLANTA_ALTA: Array<[number | null, number | null, number | null, number | null]> = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
  [21, 22, 23, 24],
  [25, 26, 27, 28],
  [29, 30, 31, 32],
  [33, 34, 35, 36],
  [37, 38, 39, 40],
  [41, 42, 43, 44],
]

// Distribución de asientos - PLANTA BAJA (3 a la izquierda)
const FILAS_PLANTA_BAJA: Array<[number | null, number | null, number | null, number | null]> = [
  [45, 46, 47, null],
  [48, 49, 50, null],
  [51, 52, 53, null],
  [54, 55, 56, null],
]

type PlantaExportProps = {
  titulo: string
  filas: Array<[number | null, number | null, number | null, number | null]>
  esCama?: boolean
  asientos: Asiento[]
}

// ✅ MOVER PlantaExport FUERA del componente principal
function PlantaExport({
  titulo,
  filas,
  esCama = false,
  asientos,
}: PlantaExportProps) {
  function BtnAsientoExport({ num }: { num: number | null }) {
    if (!num) return <div style={{ width: 32, height: 32, flexShrink: 0 }} />
    const a = asientos.find(a => a.numero === num)
    if (!a) return <div style={{ width: 32, height: 32, flexShrink: 0 }} />

    const isOcupado = a.estado === 'ocupado' || a.estado === 'cama_ocupada'
    const esCama = a.tipo === 'cama'
    const esEspecial = a.numero && ASIENTOS_ESPECIALES.includes(a.numero)

    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 4,
          fontSize: 9,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1.5px solid ${isOcupado ? (esEspecial ? SN_AMARILLO : SN_CELESTE) : (esEspecial ? SN_AMARILLO : '#2a3a4a')}`,
          background: isOcupado 
            ? (esEspecial ? 'rgba(242,182,50,0.3)' : 'rgba(45,156,184,0.2)')
            : (esEspecial ? 'rgba(242,182,50,0.1)' : '#1a2a3a'),
          color: isOcupado ? (esEspecial ? SN_AZUL : 'white') : (esEspecial ? SN_AMARILLO : TEXTO_MUTED),
          position: 'relative',
        }}
        title={a.nombrePasajero || `Asiento ${num}`}
      >
        {num}
        {esCama && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              fontSize: 6,
              background: SN_AMARILLO,
              color: SN_AZUL,
              borderRadius: 2,
              padding: '0 2px',
            }}
          >
            C
          </span>
        )}
        {esEspecial && (
          <span
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              fontSize: 5,
              background: '#DC2626',
              color: 'white',
              borderRadius: 2,
              padding: '0 2px',
            }}
          >
            +$10k
          </span>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          width: '100%',
          height: 24,
          borderRadius: '40px 40px 0 0',
          background: '#1a2535',
          border: `1px solid ${BORDE}`,
          borderBottom: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {esCama ? (
          <div
            style={{
              width: 20,
              height: 12,
              borderRadius: 3,
              border: `1px solid ${BORDE}`,
              background: '#0d1825',
            }}
          />
        ) : (
          <div
            style={{
              width: 30,
              height: 8,
              borderRadius: 8,
              background: '#0d1825',
              border: `1px solid ${BORDE}`,
            }}
          />
        )}
      </div>

      <div
        style={{
          background: BG_PAGINA,
          border: `1px solid ${BORDE}`,
          borderRadius: '0 0 6px 6px',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 8,
            fontWeight: 600,
            color: TEXTO_MUTED,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {titulo}
        </p>

        {filas.map((fila, i) => {
          if (fila.every(n => n === null)) {
            return (
              <div key={i} style={{ height: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: 1, background: BORDE, opacity: 0.4 }} />
              </div>
            )
          }
          return (
            <div key={i} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <BtnAsientoExport num={fila[0]} />
              <BtnAsientoExport num={fila[1]} />
              <div style={{ width: 10, flexShrink: 0 }} />
              <BtnAsientoExport num={fila[2]} />
              <BtnAsientoExport num={fila[3]} />
            </div>
          )
        })}

        {esCama && (
          <div
            style={{
              marginTop: 3,
              padding: '2px 6px',
              borderRadius: 4,
              border: `1px dashed ${BORDE}`,
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 7, color: TEXTO_MUTED }}>🚻 WC</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BotonExportarAsientos({ asientos, viajeNombre }: Props) {
  const captureRef = useRef<HTMLDivElement>(null)

  const exportarImagen = async () => {
    if (!captureRef.current) return

    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        backgroundColor: BG_PAGINA,
        allowTaint: true,
        useCORS: true,
        logging: false,
      })

      const link = document.createElement('a')
      link.download = `Mapa_Asientos_${viajeNombre}_${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error al exportar imagen:', error)
      alert('❌ Error al exportar la imagen')
    }
  }

  // Calcular ocupación
  const totalOcupados = asientos.filter(a => a.estado === 'ocupado' || a.estado === 'cama_ocupada').length
  const totalAsientos = asientos.length

  return (
    <>
      {/* Botón para exportar */}
      <button
        onClick={exportarImagen}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg"
        style={{
          background: '#8B5CF6',
          color: 'white',
          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Exportar asientos
      </button>

      {/* Contenido oculto para capturar */}
      <div
        ref={captureRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          background: BG_PAGINA,
          padding: '24px 32px',
          width: '800px',
          zIndex: -1,
        }}
      >
        {/* Título */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>
              🪑 Mapa de asientos
            </h2>
            <p style={{ color: TEXTO_MUTED, fontSize: 12, margin: '2px 0 0' }}>
              {viajeNombre} · {totalOcupados}/{totalAsientos} ocupados
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: '#1a2a3a', border: '1px solid #2a3a4a' }} />
              <span style={{ color: TEXTO_MUTED, fontSize: 9 }}>Libre</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: SN_CELESTE }} />
              <span style={{ color: TEXTO_MUTED, fontSize: 9 }}>Ocupado</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: SN_AMARILLO }} />
              <span style={{ color: TEXTO_MUTED, fontSize: 9 }}>Cama</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: '#F2B632', border: '1px solid #F2B632' }} />
              <span style={{ color: TEXTO_MUTED, fontSize: 9 }}>+$10k</span>
            </div>
          </div>
        </div>

        {/* Planta alta y baja */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
          <PlantaExport titulo="Planta alta" filas={FILAS_PLANTA_ALTA} asientos={asientos} />
          <PlantaExport titulo="Planta baja" filas={FILAS_PLANTA_BAJA} esCama asientos={asientos} />
        </div>

        {/* Leyenda de pasajeros */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${BORDE}` }}>
          <p style={{ color: TEXTO_MUTED, fontSize: 9, marginBottom: 6 }}>👥 Pasajeros asignados:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {asientos
              .filter(a => a.estado === 'ocupado' || a.estado === 'cama_ocupada')
              .sort((a, b) => a.numero - b.numero)
              .map(a => (
                <span
                  key={a.numero}
                  style={{
                    background: 'rgba(45,156,184,0.15)',
                    border: `1px solid ${BORDE}`,
                    borderRadius: 4,
                    padding: '2px 8px',
                    fontSize: 8,
                    color: 'white',
                  }}
                >
                  #{a.numero} {a.nombrePasajero || 'Desconocido'}
                </span>
              ))}
            {asientos.filter(a => a.estado === 'ocupado' || a.estado === 'cama_ocupada').length === 0 && (
              <span style={{ color: TEXTO_MUTED, fontSize: 8 }}>No hay pasajeros asignados</span>
            )}
          </div>
        </div>

        {/* Pie de página */}
        <div style={{ marginTop: 12, paddingTop: 8, borderTop: `1px solid ${BORDE}`, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: TEXTO_MUTED, fontSize: 7 }}>SN Viajes & Turismo</span>
          <span style={{ color: TEXTO_MUTED, fontSize: 7 }}>
            Generado: {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR')}
          </span>
        </div>
      </div>
    </>
  )
}