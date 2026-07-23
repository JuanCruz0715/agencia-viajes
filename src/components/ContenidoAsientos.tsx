'use client'

import { useState } from 'react'

const SN_AZUL = '#1B3A5C'
const SN_CELESTE = '#2D9CB8'
const SN_AMARILLO = '#F2B632'
const BG_PAGINA = '#0B1620'
const BG_CARD = '#15212C'
const BORDE = '#1E2D3D'
const TEXTO_MUTED = '#9FB3C2'

type Asiento = {
  numero: number
  estado: 'ocupado' | 'disponible' | 'cama_ocupada' | 'cama_libre'
  pasajeroId?: string
  nombrePasajero?: string
  tipo: 'semi_cama' | 'cama'
}

type PasajeroSinAsiento = {
  id: string
  nombre: string
  apellido: string
  iniciales: string
}

type Props = {
  asientos: Asiento[]
  pasajerosSinAsiento: PasajeroSinAsiento[]
  onAsignarAsiento: (asientoNumero: number, pasajeroId: string) => void
  onDesasignarAsiento?: (asientoNumero: number) => void
}

// Distribución con el tipo correcto
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

const FILAS_PLANTA_BAJA: Array<[number | null, number | null, number | null, number | null]> = [
  [45, 46, 47, 48],
  [49, 50, 51, 52],
  [53, 54, 55, 56],
  [57, 58, 59, 60],
]

type PlantaColectivoProps = {
  titulo: string
  filas: Array<[number | null, number | null, number | null, number | null]>
  esCama?: boolean
  asientos: Asiento[]
  asientoSeleccionado: number | null
  onAsientoClick: (numero: number) => void
  onTooltipChange: (numero: number | null) => void
}

function PlantaColectivo({ 
  titulo, 
  filas, 
  esCama = false,
  asientos,
  asientoSeleccionado,
  onAsientoClick,
  onTooltipChange
}: PlantaColectivoProps) {
  function BtnAsiento({ num }: { num: number | null }) {
    if (!num) return <div style={{ width: 38, height: 38, flexShrink: 0 }} />
    const a = asientos.find(a => a.numero === num)
    if (!a) return <div style={{ width: 38, height: 38, flexShrink: 0 }} />

    const isSelected = asientoSeleccionado === num

    function estiloBtn(a: Asiento | undefined, sel: boolean): React.CSSProperties {
      const base: React.CSSProperties = {
        width: 38, height: 38, borderRadius: 6, fontSize: 11, fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, border: '2px solid', transition: 'all .12s'
      }
      if (!a) return { ...base, background: 'transparent', borderColor: 'transparent', cursor: 'default', color: 'transparent' }
      if (sel) return { ...base, background: SN_AMARILLO, borderColor: SN_AMARILLO, color: SN_AZUL, transform: 'scale(1.08)' }
      switch (a.estado) {
        case 'ocupado': return { ...base, background: SN_CELESTE, borderColor: '#1a7a9a', color: 'white' }
        case 'disponible': return { ...base, background: '#1a2a3a', borderColor: '#2a3a4a', color: TEXTO_MUTED }
        case 'cama_ocupada': return { ...base, background: SN_AMARILLO, borderColor: '#c49020', color: SN_AZUL }
        case 'cama_libre': return { ...base, background: '#1a2a1a', borderColor: SN_AMARILLO, color: SN_AMARILLO }
      }
    }

    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => onAsientoClick(num)}
          onMouseEnter={() => onTooltipChange(num)}
          onMouseLeave={() => onTooltipChange(null)}
          style={estiloBtn(a, isSelected)}
          title={a.nombrePasajero ? `${num} — ${a.nombrePasajero}` : `Asiento ${num}`}
        >
          {num}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Cabecera del colectivo */}
      <div style={{
        width: '100%', height: 36, borderRadius: '60px 60px 0 0',
        background: '#1a2535', border: `1px solid ${BORDE}`, borderBottom: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 0
      }}>
        {esCama ? (
          <div style={{ width: 28, height: 18, borderRadius: 4, border: `1px solid ${BORDE}`, background: '#0d1825' }} />
        ) : (
          <div style={{ width: 40, height: 10, borderRadius: 10, background: '#0d1825', border: `1px solid ${BORDE}` }} />
        )}
      </div>

      {/* Cuerpo */}
      <div style={{
        background: BG_PAGINA, border: `1px solid ${BORDE}`,
        borderRadius: '0 0 8px 8px', padding: '10px 14px',
        display: 'flex', flexDirection: 'column', gap: 3
      }}>
        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 600, color: TEXTO_MUTED, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>
          {titulo}
        </p>

        {filas.map((fila, i) => {
          // Fila vacía = separador (WC o espacio)
          if (fila.every(n => n === null)) {
            return (
              <div key={i} style={{ height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: 1, background: BORDE, opacity: .4 }} />
              </div>
            )
          }
          return (
            <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {/* Lado izquierdo */}
              <BtnAsiento num={fila[0]} />
              <BtnAsiento num={fila[1]} />
              {/* Pasillo */}
              <div style={{ width: 14, flexShrink: 0 }} />
              {/* Lado derecho */}
              <BtnAsiento num={fila[2]} />
              <BtnAsiento num={fila[3]} />
            </div>
          )
        })}

        {/* WC en planta baja */}
        {esCama && (
          <div style={{
            marginTop: 4, padding: '4px 8px', borderRadius: 6,
            border: `1px dashed ${BORDE}`, textAlign: 'center'
          }}>
            <span style={{ fontSize: 9, color: TEXTO_MUTED }}>🚻 WC</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ContenidoAsientos({
  asientos,
  pasajerosSinAsiento,
  onAsignarAsiento,
  onDesasignarAsiento
}: Props) {
  const [asientoSel, setAsientoSel] = useState<number | null>(null)
  const [pasajeroSel, setPasajeroSel] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<number | null>(null)

  const asientoSelObj = asientoSel ? asientos.find(a => a.numero === asientoSel) : null

  function handleAsignar() {
    if (asientoSel && pasajeroSel) {
      onAsignarAsiento(asientoSel, pasajeroSel)
      setAsientoSel(null)
      setPasajeroSel(null)
    }
  }

  function handleDesasignar() {
    if (asientoSel && onDesasignarAsiento) {
      onDesasignarAsiento(asientoSel)
      setAsientoSel(null)
    }
  }

  const totalOcupados = asientos.filter(a => a.estado === 'ocupado' || a.estado === 'cama_ocupada').length

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>

      {/* ===== COLECTIVO ===== */}
      <div style={{ background: BG_CARD, border: `0.5px solid ${BORDE}`, borderRadius: 12, padding: 16, flex: 1, minWidth: 320 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ margin: 0, fontWeight: 500, color: 'white', fontSize: 13 }}>
            Mapa de asientos
            <span style={{ marginLeft: 8, fontSize: 11, color: TEXTO_MUTED }}>
              {totalOcupados}/{asientos.length} ocupados
            </span>
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { bg: SN_CELESTE, label: 'Ocupado' },
              { bg: '#1a2a3a', bd: '#2a3a4a', label: 'Libre' },
              { bg: SN_AMARILLO, label: 'Cama ocup.' },
              { bg: '#1a2a1a', bd: SN_AMARILLO, label: 'Cama libre' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: l.bg, border: l.bd ? `1.5px solid ${l.bd}` : undefined, display: 'inline-block' }} />
                <span style={{ fontSize: 9, color: TEXTO_MUTED }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Las dos plantas side by side */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          <PlantaColectivo 
            titulo="Planta alta" 
            filas={FILAS_PLANTA_ALTA}
            asientos={asientos}
            asientoSeleccionado={asientoSel}
            onAsientoClick={setAsientoSel}
            onTooltipChange={setTooltip}
          />
          <PlantaColectivo 
            titulo="Planta baja" 
            filas={FILAS_PLANTA_BAJA} 
            esCama
            asientos={asientos}
            asientoSeleccionado={asientoSel}
            onAsientoClick={setAsientoSel}
            onTooltipChange={setTooltip}
          />
        </div>

        {/* Info asiento seleccionado */}
        {asientoSel && (
          <div style={{ marginTop: 14, padding: '9px 14px', background: 'rgba(45,156,184,0.1)', border: `1px solid ${SN_CELESTE}`, borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: SN_CELESTE }}>
              {asientoSelObj?.nombrePasajero
                ? `Asiento ${asientoSel} — ${asientoSelObj.nombrePasajero}`
                : `Asiento ${asientoSel} seleccionado`}
              {pasajeroSel && !asientoSelObj?.nombrePasajero && (
                <> → {pasajerosSinAsiento.find(p => p.id === pasajeroSel)?.nombre} {pasajerosSinAsiento.find(p => p.id === pasajeroSel)?.apellido}</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* ===== PANEL PASAJEROS ===== */}
      <div style={{ width: 200, background: BG_CARD, border: `0.5px solid ${BORDE}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column' }}>
        <p style={{ margin: '0 0 10px', fontWeight: 500, fontSize: 12, color: TEXTO_MUTED }}>
          Sin asiento ({pasajerosSinAsiento.length})
        </p>

        <div style={{ flex: 1, overflowY: 'auto', maxHeight: 320, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {pasajerosSinAsiento.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: 24, margin: '0 0 4px' }}>✅</p>
              <p style={{ fontSize: 12, color: '#7EC55A', margin: 0 }}>Todos tienen asiento</p>
            </div>
          ) : pasajerosSinAsiento.map(p => (
            <div
              key={p.id}
              onClick={() => setPasajeroSel(prev => prev === p.id ? null : p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                borderRadius: 8, cursor: 'pointer', transition: 'all .12s',
                border: `1.5px solid ${pasajeroSel === p.id ? SN_CELESTE : BORDE}`,
                background: pasajeroSel === p.id ? 'rgba(45,156,184,0.1)' : 'transparent'
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(45,156,184,0.2)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 10, fontWeight: 700, color: SN_CELESTE
              }}>
                {p.iniciales}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.nombre} {p.apellido}
                </p>
                <p style={{ margin: 0, fontSize: 9, color: '#F87171' }}>Sin asiento</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
          {asientoSel && pasajeroSel && !asientoSelObj?.nombrePasajero && (
            <button
              onClick={handleAsignar}
              style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: 'none', background: SN_CELESTE, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Asignar asiento {asientoSel}
            </button>
          )}
          {asientoSelObj?.nombrePasajero && onDesasignarAsiento && (
            <button
              onClick={handleDesasignar}
              style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: 'none', background: '#DC2626', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Desasignar asiento {asientoSel}
            </button>
          )}
          {asientoSel && (
            <button
              onClick={() => { setAsientoSel(null); setPasajeroSel(null) }}
              style={{ width: '100%', padding: '7px 0', borderRadius: 8, border: `1px solid ${BORDE}`, background: 'transparent', color: TEXTO_MUTED, fontSize: 11, cursor: 'pointer' }}
            >
              Cancelar
            </button>
          )}
        </div>

        <p style={{ fontSize: 9, color: TEXTO_MUTED, textAlign: 'center', margin: '10px 0 0', lineHeight: 1.4 }}>
          Clickeá un asiento libre, luego un pasajero
        </p>
      </div>
    </div>
  )
}