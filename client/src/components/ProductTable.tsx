import { useState, useRef, useEffect } from 'react'
import type { Producto } from '../types'

interface Props {
  productos: Producto[]
  tasas: { usd: number; ves: number } | null
  filtro: string
  onEdit: (idx: number) => void
  onDelete: (idx: number) => void
  onUpdate: (id: number, field: string, value: string | number) => Promise<void>
}

type EditingCell = { id: number; field: string } | null

function esc(s: string) {
  const d = document.createElement('div')
  d.appendChild(document.createTextNode(s))
  return d.innerHTML
}

export default function ProductTable({ productos, tasas, filtro, onEdit, onDelete, onUpdate }: Props) {
  const usd = tasas?.usd ?? 0
  const ves = tasas?.ves ?? 0
  const [editing, setEditing] = useState<EditingCell>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const lista = filtro
    ? productos.filter(item => {
        const txt = (item.p + ' ' + (item.m || '') + ' ' + (item.c || '') + ' ' + (item.b || '')).toLowerCase()
        return txt.includes(filtro.toLowerCase())
      })
    : productos

  function handleDoubleClick(item: Producto, field: string, currentValue: string | number) {
    setEditing({ id: item.id, field })
    setEditValue(String(currentValue))
  }

  function handleBlur() {
    if (!editing) return
    const val = editValue.trim()
    if (val === '') { setEditing(null); return }
    const fieldMap: Record<string, string> = {
      p: 'nombre', b: 'codigo_barras', m: 'marca', c: 'categoria', v: 'precio_cop'
    }
    const apiField = fieldMap[editing.field]
    const parsed = editing.field === 'v' ? parseFloat(val) : val
    onUpdate(editing.id, apiField, parsed).then(() => setEditing(null)).catch(() => setEditing(null))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { (e.target as HTMLInputElement).blur() }
    if (e.key === 'Escape') { setEditing(null) }
  }

  function renderCell(item: Producto, field: string, display: string, className = '') {
    const isEditing = editing?.id === item.id && editing?.field === field
    if (isEditing) {
      return (
        <td className={className}>
          <input
            ref={inputRef}
            type={field === 'v' ? 'number' : 'text'}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="inline-edit-input"
            step={field === 'v' ? '1' : undefined}
            min={field === 'v' ? '0' : undefined}
          />
        </td>
      )
    }
    return (
      <td className={className} onDoubleClick={() => handleDoubleClick(item, field, field === 'v' ? item.v : display)} style={{ cursor: 'pointer' }}>
        {display}
      </td>
    )
  }

  if (lista.length === 0) {
    return (
      <>
        <table>
          <thead>
            <tr>
              <th>Producto</th><th>Código</th><th>Marca</th><th>Categoría</th>
              <th className="num">COP</th><th className="num">USD</th><th className="num">VES</th>
              <th className="acciones-th">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={8} className="vacio">No hay productos</td></tr>
          </tbody>
        </table>
        <p className="total"><span>{productos.length}</span> productos</p>
      </>
    )
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Producto <span className="hint">(doble clic para editar)</span></th>
            <th>Código</th><th>Marca</th><th>Categoría</th>
            <th className="num">COP</th><th className="num">USD</th><th className="num">VES</th>
            <th className="acciones-th">Acción</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((item) => {
            const cop = item.v
            const usdVal = usd > 0 ? cop / usd : 0
            const vesVal = ves > 0 ? cop / ves : 0
            return (
              <tr key={item.id}>
                {renderCell(item, 'p', esc(item.p))}
                {renderCell(item, 'b', item.b || '—', 'barcode-cell')}
                {renderCell(item, 'm', esc(item.m || ''))}
                {renderCell(item, 'c', esc(item.c || ''))}
                {renderCell(item, 'v', '$' + Number(cop).toLocaleString('es-CO'), 'num precio-cop')}
                <td className="num precio-usd">${Number(usdVal).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="num precio-ves">Bs {Number(vesVal).toLocaleString('es-CO', { maximumFractionDigits: 2 })}</td>
                <td className="acciones">
                  <button onClick={() => onEdit(productos.indexOf(item))} title="Editar en modal">✏️</button>
                  <button onClick={() => onDelete(productos.indexOf(item))} title="Eliminar">❌</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="total"><span>{productos.length}</span> productos</p>
    </>
  )
}