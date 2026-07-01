import { useState } from 'react'
import type { Producto, Tasas } from '../types'

const CATEGORIAS = [
  'Cervezas y Bebidas', 'Lácteos y Bebidas', 'Chocolates y Dulces',
  'Sangría y Licores', 'Refrescos y Aguas', 'Snacks y Varios',
  'Víveres', 'Medicamentos', 'Venezolano', 'Colombiano', 'Otra',
]

interface Props {
  producto: Producto
  tasas: Tasas | null
  onClose: () => void
  onSave: (id: number, data: Partial<Producto>) => Promise<void>
}

export default function ProductDetailModal({ producto, tasas, onClose, onSave }: Props) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(producto.p)
  const [codigo, setCodigo] = useState(producto.b)
  const [marca, setMarca] = useState(producto.m)
  const [categoria, setCategoria] = useState(producto.c || 'Otra')
  const [precio, setPrecio] = useState(String(producto.v))
  const [guardando, setGuardando] = useState(false)

  const usd = tasas && tasas.usd > 0 ? producto.v / tasas.usd : 0
  const ves = tasas && tasas.ves > 0 ? producto.v / tasas.ves : 0

  function cancelarEdicion() {
    setNombre(producto.p)
    setCodigo(producto.b)
    setMarca(producto.m)
    setCategoria(producto.c || 'Otra')
    setPrecio(String(producto.v))
    setEditando(false)
  }

  function guardar() {
    const p = parseFloat(precio)
    if (!nombre.trim() || !p || p <= 0) return
    setGuardando(true)
    onSave(producto.id, {
      p: nombre.trim(),
      b: codigo.trim(),
      m: marca.trim() || 'Genérico',
      c: categoria,
      v: p,
    }).then(() => {
      setEditando(false)
      setGuardando(false)
    }).catch(() => setGuardando(false))
  }

  return (
    <div className="modal-overlay abierto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-detail">
        <h2>{editando ? 'Editar producto' : 'Producto encontrado'}</h2>
        <div className="detail-grid">
          {editando ? (
            <>
              <div className="campo">
                <label>Producto</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del producto" />
              </div>
              <div className="campo">
                <label>Código de barras</label>
                <input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Código de barras" />
              </div>
              <div className="campo">
                <label>Marca</label>
                <input value={marca} onChange={e => setMarca(e.target.value)} placeholder="Marca" />
              </div>
              <div className="campo">
                <label>Categoría</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)}>
                  {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="campo">
                <label>Precio COP ($)</label>
                <input type="number" step="1" min="0" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Ej: 6000" />
              </div>
            </>
          ) : (
            <>
              <div className="detail-field">
                <span className="detail-label">Producto</span>
                <span className="detail-value detail-name">{producto.p}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Código de barras</span>
                <span className="detail-value detail-barcode">{producto.b}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Marca</span>
                <span className="detail-value">{producto.m || '—'}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Categoría</span>
                <span className="detail-value">{producto.c || '—'}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Precio COP</span>
                <span className="detail-value precio-cop">${producto.v.toLocaleString('es-CO')}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Precio USD</span>
                <span className="detail-value precio-usd">${Number(usd).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Precio VES</span>
                <span className="detail-value precio-ves">Bs. {Number(ves).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </>
          )}
        </div>
        <div className="modal-btns">
          {editando ? (
            <>
              <button className="btn btn-cancel" onClick={cancelarEdicion} disabled={guardando}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar} disabled={guardando || !nombre.trim() || !precio || parseFloat(precio) <= 0}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => setEditando(true)}>Editar</button>
              <button className="btn btn-cancel" onClick={onClose}>Cerrar</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
