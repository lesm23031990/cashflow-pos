import { useState } from 'react'
import type { Producto } from '../types'

type Tab = 'disponibles' | 'no_disponibles'

interface Props {
  productos: Producto[]
  tasas: { usd: number; ves: number } | null
  filtro: string
  onEdit: (idx: number) => void
  onDelete: (idx: number) => void
  onToggleEstado: (idx: number) => void
}

function esc(s: string) {
  const d = document.createElement('div')
  d.appendChild(document.createTextNode(s))
  return d.innerHTML
}

const ESTADO_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  no_disponible: 'No disponible',
  por_revisar: 'Por revisar',
}

const ESTADO_CLASSES: Record<string, string> = {
  disponible: 'estado-ok',
  no_disponible: 'estado-cero',
  por_revisar: 'estado-revisar',
}

export default function ProductTable({ productos, tasas, filtro, onEdit, onDelete, onToggleEstado }: Props) {
  const [tab, setTab] = useState<Tab>('disponibles')
  const usd = tasas?.usd ?? 0
  const ves = tasas?.ves ?? 0

  const disponibles = productos.filter(p => p.st === 'disponible')
  const noDisponibles = productos.filter(p => p.st !== 'disponible')

  const filtrados = tab === 'disponibles' ? disponibles : noDisponibles

  const lista = filtro
    ? filtrados.filter(item => {
        const txt = (item.p + ' ' + (item.m || '') + ' ' + (item.c || '') + ' ' + (item.b || '')).toLowerCase()
        return txt.includes(filtro.toLowerCase())
      })
    : filtrados

  function renderTable() {
    if (lista.length === 0) {
      return (
        <table>
          <thead>
            <tr>
              <th>Producto</th><th>Código</th><th>Marca</th><th>Categoría</th>
              <th className="num">Stock</th>
              <th>Estado</th>
              <th className="num">COP</th><th className="num">USD</th><th className="num">VES</th>
              <th className="acciones-th">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={10} className="vacio">No hay productos</td></tr>
          </tbody>
        </table>
      )
    }

    return (
      <table>
        <thead>
          <tr>
            <th>Producto</th><th>Código</th><th>Marca</th><th>Categoría</th>
            <th className="num">Stock</th>
            <th>Estado</th>
            <th className="num">COP</th><th className="num">USD</th><th className="num">VES</th>
            <th className="acciones-th">Acción</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((item, i) => {
            const idx = productos.indexOf(item)
            const cop = item.v
            const usdVal = usd > 0 ? cop / usd : 0
            const vesVal = ves > 0 ? cop / ves : 0
            const st = item.st || 'disponible'
            const estadoCls = ESTADO_CLASSES[st] || 'estado-ok'
            const estadoLabel = ESTADO_LABELS[st] || st
            const rowCls = st === 'no_disponible' ? 'row-sin-stock' : ''
            return (
              <tr key={item.id} className={rowCls}>
                <td>{esc(item.p)}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: item.b ? '#fbbf24' : '#475569' }}>
                  {item.b || '—'}
                </td>
                <td>{esc(item.m || '')}</td>
                <td>{esc(item.c || '')}</td>
                <td className="num" style={{ color: '#94a3b8' }}>{item.s}</td>
                <td className={`estado-cell ${estadoCls}`} style={{ cursor: 'pointer' }} onClick={() => onToggleEstado(idx)} title="Cambiar estado">
                  <span className="estado-badge">{estadoLabel}</span>
                </td>
                <td className="num precio-cop">${Number(cop).toLocaleString('es-CO')}</td>
                <td className="num precio-usd">${Number(usdVal).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="num precio-ves">Bs {Number(vesVal).toLocaleString('es-CO', { maximumFractionDigits: 2 })}</td>
                <td className="acciones">
                  <button onClick={() => onEdit(idx)} title="Editar">✏️</button>
                  <button onClick={() => onDelete(idx)} title="Eliminar">❌</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <>
      <div className="tabs">
        <button className={`tab ${tab === 'disponibles' ? 'activo' : ''}`} onClick={() => setTab('disponibles')}>
          Disponibles <span className="tab-count">{disponibles.length}</span>
        </button>
        <button className={`tab ${tab === 'no_disponibles' ? 'activo' : ''}`} onClick={() => setTab('no_disponibles')}>
          No disponibles <span className="tab-count">{noDisponibles.length}</span>
        </button>
      </div>
      {renderTable()}
      <p className="total">
        <span>{lista.length}</span> productos
      </p>
    </>
  )
}
