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

// ✅ COMPONENTES AUXILIARES FUERA DEL COMPONENTE PRINCIPAL

function Pasillo() {
  return <div style={{ width: 12, flexShrink: 0 }} />
}

function Separador({ label }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0' }}>
      <div style={{ flex: 1, height: 1, background: BORDE, opacity: .5 }} />
      {label && <span style={{ fontSize: 8, color: TEXTO_MUTED, letterSpacing: .5 }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: BORDE, opacity: .5 }} />
    </div>
  )
}

// ✅ COMPONENTE ASIENTO FUERA
function Asiento({ 
  num, 
  asiento, 
  seleccionado, 
  onSelect, 
  onMouseEnter, 
  onMouseLeave, 
  tooltip 
}: { 
  num: number
  asiento?: Asiento
  seleccionado: boolean
  onSelect: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  tooltip: number | null
}) {
  if (!asiento) {
    return <div style={{ width: 32, height: 32, flexShrink: 0 }} />
  }

  const getEstilo = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: 32, height: 32, borderRadius: 5, fontSize: 10, fontWeight: 500,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, border: '1.5px solid', transition: 'all .12s', position: 'relative'
    }
    if (seleccionado) {
      return { ...base, background: SN_AMARILLO, borderColor: SN_AMARILLO, color: SN_AZUL, transform: 'scale(1.1)' }
    }
    switch (asiento.estado) {
      case 'ocupado': return { ...base, background: SN_CELESTE, borderColor: SN_CELESTE, color: 'white' }
      case 'disponible': return { ...base, background: BG_CARD, borderColor: BORDE, color: TEXTO_MUTED }
      case 'cama_ocupada': return { ...base, background: SN_AMARILLO, borderColor: SN_AMARILLO, color: SN_AZUL }
      case 'cama_libre': return { ...base, background: BG_CARD, borderColor: SN_AMARILLO, color: SN_AMARILLO }
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onSelect}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={getEstilo()}
        title={asiento.nombrePasajero ? `${num} — ${asiento.nombrePasajero}` : `Asiento ${num}`}
      >
        {num}
      </button>
      {tooltip === num && asiento.nombrePasajero && (
        <div style={{
          position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.9)', color: 'white', padding: '3px 8px',
          borderRadius: 4, fontSize: 9, whiteSpace: 'nowrap', zIndex: 20, pointerEvents: 'none'
        }}>
          {asiento.nombrePasajero}
        </div>
      )}
    </div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ContenidoAsientos({
  asientos,
  pasajerosSinAsiento,
  onAsignarAsiento,
  onDesasignarAsiento
}: Props) {
  const [asientoSel, setAsientoSel] = useState<number | null>(null)
  const [pasajeroSel, setPasajeroSel] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<number | null>(null)

  const getAsiento = (num: number) => asientos.find(a => a.numero === num)
  const asientoSelObj = asientoSel ? asientos.find(a => a.numero === asientoSel) : null

  const handleAsignar = () => {
    if (asientoSel && pasajeroSel) {
      onAsignarAsiento(asientoSel, pasajeroSel)
      setAsientoSel(null)
      setPasajeroSel(null)
    }
  }

  const handleDesasignar = () => {
    if (asientoSel && onDesasignarAsiento) {
      onDesasignarAsiento(asientoSel)
      setAsientoSel(null)
    }
  }

  // Renderizar Asiento con las props necesarias
  const renderAsiento = (num: number) => {
    const a = getAsiento(num)
    return (
      <Asiento
        key={num}
        num={num}
        asiento={a}
        seleccionado={asientoSel === num}
        onSelect={() => setAsientoSel(prev => prev === num ? null : num)}
        onMouseEnter={() => setTooltip(num)}
        onMouseLeave={() => setTooltip(null)}
        tooltip={tooltip}
      />
    )
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

      {/* ===== MAPA DEL COLECTIVO ===== */}
      <div style={{ flex: 1, minWidth: 300, background: BG_CARD, border: `0.5px solid ${BORDE}`, borderRadius: 12, padding: 14, overflowX: 'auto' }}>

        {/* Header + leyenda */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ margin: 0, fontWeight: 500, color: 'white', fontSize: 13 }}>Mapa de asientos</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { bg: SN_CELESTE, label: 'Ocupado' },
              { bg: BG_CARD, bd: TEXTO_MUTED, label: 'Libre' },
              { bg: SN_AMARILLO, label: 'Cama ocup.' },
              { bg: BG_CARD, bd: SN_AMARILLO, label: 'Cama libre' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: l.bg, border: l.bd ? `1.5px solid ${l.bd}` : undefined, display: 'inline-block' }} />
                <span style={{ fontSize: 9, color: TEXTO_MUTED }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ---- PISO SUPERIOR ---- */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: '0 0 6px', fontSize: 9, fontWeight: 500, color: TEXTO_MUTED, textTransform: 'uppercase', letterSpacing: 1 }}>Piso superior — semi cama</p>

          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 3, background: BG_PAGINA, borderRadius: 8, padding: 10, border: `1px solid ${BORDE}` }}>
            {/* Fila superior arriba: 1 59 | 11 15 19 23 27 31 35 39 43 | 47 50 53 56 */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {renderAsiento(1)}{renderAsiento(59)}
              <Pasillo />
              {renderAsiento(11)}{renderAsiento(15)}{renderAsiento(19)}{renderAsiento(23)}
              {renderAsiento(27)}{renderAsiento(31)}{renderAsiento(35)}{renderAsiento(39)}{renderAsiento(43)}
              <Pasillo />
              <div style={{ borderLeft: `1px dashed ${SN_AMARILLO}`, height: 32, opacity: .5, marginRight: 4 }} />
              {renderAsiento(47)}{renderAsiento(50)}{renderAsiento(53)}{renderAsiento(56)}
            </div>

            <Separador label="pasillo" />

            {/* Fila superior abajo: 2 60 | 12 16 20 24 28 32 36 40 44 | 48 51 54 57 */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {renderAsiento(2)}{renderAsiento(60)}
              <Pasillo />
              {renderAsiento(12)}{renderAsiento(16)}{renderAsiento(20)}{renderAsiento(24)}
              {renderAsiento(28)}{renderAsiento(32)}{renderAsiento(36)}{renderAsiento(40)}{renderAsiento(44)}
              <Pasillo />
              <div style={{ borderLeft: `1px dashed ${SN_AMARILLO}`, height: 32, opacity: .5, marginRight: 4 }} />
              {renderAsiento(48)}{renderAsiento(51)}{renderAsiento(54)}{renderAsiento(57)}
            </div>
          </div>
        </div>

        {/* ---- PISO INFERIOR ---- */}
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 9, fontWeight: 500, color: TEXTO_MUTED, textTransform: 'uppercase', letterSpacing: 1 }}>Piso inferior — semi cama</p>

          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 3, background: BG_PAGINA, borderRadius: 8, padding: 10, border: `1px solid ${BORDE}` }}>
            {/* Fila inferior arriba: 3 5 7 9 | 13 17 21 25 29 33 37 41 45 | WC | 48 51 54 57 */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {renderAsiento(3)}{renderAsiento(5)}{renderAsiento(7)}{renderAsiento(9)}
              <Pasillo />
              {renderAsiento(13)}{renderAsiento(17)}{renderAsiento(21)}{renderAsiento(25)}
              {renderAsiento(29)}{renderAsiento(33)}{renderAsiento(37)}{renderAsiento(41)}{renderAsiento(45)}
              <Pasillo />
              <div style={{ width: 28, height: 32, borderRadius: 4, border: `1px solid ${BORDE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 8, color: TEXTO_MUTED }}>WC</span>
              </div>
              <Pasillo />
              <div style={{ borderLeft: `1px dashed ${SN_AMARILLO}`, height: 32, opacity: .5, marginRight: 4 }} />
              {renderAsiento(49)}{renderAsiento(52)}{renderAsiento(55)}{renderAsiento(58)}
            </div>

            <Separador label="pasillo" />

            {/* Fila inferior abajo: 4 6 8 10 | 14 18 22 26 30 34 38 42 46 | WC | 48 51 54 57 */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {renderAsiento(4)}{renderAsiento(6)}{renderAsiento(8)}{renderAsiento(10)}
              <Pasillo />
              {renderAsiento(14)}{renderAsiento(18)}{renderAsiento(22)}{renderAsiento(26)}
              {renderAsiento(30)}{renderAsiento(34)}{renderAsiento(38)}{renderAsiento(42)}{renderAsiento(46)}
              <Pasillo />
              <div style={{ width: 28, height: 32, flexShrink: 0 }} />
              <Pasillo />
              <div style={{ borderLeft: `1px dashed ${SN_AMARILLO}`, height: 32, opacity: .5, marginRight: 4 }} />
              {renderAsiento(48)}{renderAsiento(51)}{renderAsiento(54)}{renderAsiento(57)}
            </div>
          </div>
        </div>

        {/* Info asiento seleccionado */}
        {asientoSel && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(45,156,184,0.1)', border: `1px solid ${SN_CELESTE}`, borderRadius: 8 }}>
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
      <div style={{ width: 196, background: BG_CARD, border: `0.5px solid ${BORDE}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column' }}>
        <p style={{ margin: '0 0 10px', fontWeight: 500, fontSize: 12, color: TEXTO_MUTED }}>
          Sin asiento ({pasajerosSinAsiento.length})
        </p>

        <div style={{ flex: 1, overflowY: 'auto', maxHeight: 300, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {pasajerosSinAsiento.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 22, margin: '0 0 4px' }}>✅</p>
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
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
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

        {/* Botones */}
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
              Cancelar selección
            </button>
          )}
        </div>

        <p style={{ fontSize: 9, color: TEXTO_MUTED, textAlign: 'center', margin: '10px 0 0', lineHeight: 1.4 }}>
          Clickeá un asiento libre, luego un pasajero para asignar
        </p>
      </div>
    </div>
  )
}