import { useState, useEffect, useRef } from 'react'
import type { Producto } from '../types'

const CATEGORIAS = [
  'CERVECERIA Y BEBIDAS', 'LACTEOS Y BEBIDAS', 'CHOCOLATES Y DULCES',
  'SANGRIA Y LICORES', 'REFRESCOS Y AGUAS', 'SNACKS Y VARIOS',
  'VIVERES', 'MEDICAMENTOS', 'VENEZOLANO', 'COLOMBIANO',
  'HAMBURGUESERIA', 'PIZZERIA', 'OTRA',
]

const ESTADOS = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'no_disponible', label: 'No disponible' },
  { value: 'por_revisar', label: 'Por revisar' },
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
  const [s, setS] = useState('')
  const [st, setSt] = useState('disponible')
  const [saving, setSaving] = useState(false)

  const lastBarcodeTime = useRef(0)
  const isScanningBarcode = useRef(false)

  useEffect(() => {
    if (producto) {
      setP(producto.p || '')
      setB(producto.b || '')
      setM(producto.m || '')
      setC(producto.c || 'Otra')
      setV(producto.v != null ? String(producto.v) : '')
      setS(producto.s != null ? String(producto.s) : '0')
      setSt(producto.st || 'disponible')
    } else {
      setP(''); setB(''); setM(''); setC('Otra'); setV(''); setS('0'); setSt('disponible')
    }
  }, [producto])

  function handleBarcodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const now = Date.now()
    const elapsed = now - lastBarcodeTime.current
    lastBarcodeTime.current = now

    if (elapsed < 50) {
      if (!isScanningBarcode.current) {
        isScanningBarcode.current = true
        setB(e.target.value)
      } else {
        setB(e.target.value)
      }
    } else {
      isScanningBarcode.current = false
      setB(e.target.value)
    }
  }

  function handleSubmit() {
    if (!p.trim()) return
    const val = parseFloat(v)
    const stockVal = parseInt(s) || 0
    const precioVal = isNaN(val) ? 0 : val
    setSaving(true)
    onSave({ p: p.trim(), b: b.trim(), m: m.trim() || 'Genérico', c, v: precioVal, s: stockVal, st })
  }

  return (
    <div className="modal-overlay abierto">
      <div className="modal">
        <h2>{producto?.id ? 'Editar producto' : 'Nuevo producto'}</h2>
        <div className="campo">
          <label htmlFor="frmProducto">Producto</label>
          <input id="frmProducto" value={p} onChange={e => setP(e.target.value)} placeholder="Ej: Coca Cola 2 Litros" />
        </div>
        <div className="campo">
          <label htmlFor="frmBarcode">Código de barras</label>
          <input id="frmBarcode" value={b} onChange={handleBarcodeChange} placeholder="Escanea o escribe el código" />
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
        <div className="campo">
          <label htmlFor="frmStock">Stock</label>
          <input id="frmStock" type="number" step="1" min="0" value={s} onChange={e => setS(e.target.value)} placeholder="0" />
        </div>
        <div className="campo">
          <label htmlFor="frmEstado">Estado</label>
          <select id="frmEstado" value={st} onChange={e => setSt(e.target.value)}>
            {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
        <div className="modal-btns">
          <button className="btn btn-cancel" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !p.trim()}>
            {saving ? 'Guardando...' : producto?.id ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
