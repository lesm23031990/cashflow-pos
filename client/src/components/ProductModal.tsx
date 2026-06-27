import { useState, useEffect } from 'react'
import type { Producto } from '../types'

const CATEGORIAS = [
  'Cervezas y Bebidas', 'Lácteos y Bebidas', 'Chocolates y Dulces',
  'Sangría y Licores', 'Refrescos y Aguas', 'Snacks y Varios', 'Otra',
]

interface Props {
  producto: Partial<Producto> | null
  onSave: (data: Partial<Producto>) => void
  onClose: () => void
}

export default function ProductModal({ producto, onSave, onClose }: Props) {
  const [p, setP] = useState('')
  const [b, setB] = useState('')
  const [m, setM] = useState('')
  const [c, setC] = useState('Otra')
  const [v, setV] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (producto) {
      setP(producto.p || '')
      setB(producto.b || '')
      setM(producto.m || '')
      setC(producto.c || 'Otra')
      setV(producto.v != null ? String(producto.v) : '')
    } else {
      setP(''); setB(''); setM(''); setC('Otra'); setV('')
    }
  }, [producto])

  function handleSubmit() {
    if (!p.trim()) return
    const val = parseFloat(v)
    if (!val || val <= 0) return
    setSaving(true)
    onSave({ p: p.trim(), b: b.trim(), m: m.trim() || 'Genérico', c, v: val })
  }

  return (
    <div className="modal-overlay abierto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <h2>{producto?.id ? 'Editar producto' : 'Nuevo producto'}</h2>
        <div className="campo">
          <label htmlFor="frmProducto">Producto</label>
          <input id="frmProducto" value={p} onChange={e => setP(e.target.value)} placeholder="Ej: Coca Cola 2 Litros" />
        </div>
        <div className="campo">
          <label htmlFor="frmBarcode">Código de barras</label>
          <input id="frmBarcode" value={b} onChange={e => setB(e.target.value)} placeholder="Escanea o escribe el código" />
        </div>
        <div className="campo">
          <label htmlFor="frmMarca">Marca</label>
          <input id="frmMarca" value={m} onChange={e => setM(e.target.value)} placeholder="Ej: Coca Cola" />
        </div>
        <div className="campo">
          <label htmlFor="frmCategoria">Categoría</label>
          <select id="frmCategoria" value={c} onChange={e => setC(e.target.value)}>
            {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="frmPrecio">Precio (COP $)</label>
          <input id="frmPrecio" type="number" step="1" min="0" value={v} onChange={e => setV(e.target.value)} placeholder="Ej: 6000" />
        </div>
        <div className="modal-btns">
          <button className="btn btn-cancel" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !p.trim() || !v || parseFloat(v) <= 0}>
            {saving ? 'Guardando...' : producto?.id ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
