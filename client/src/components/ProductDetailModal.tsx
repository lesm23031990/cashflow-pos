import type { Producto, Tasas } from '../types'

interface Props {
  producto: Producto
  tasas: Tasas
  onClose: () => void
}

export default function ProductDetailModal({ producto, tasas, onClose }: Props) {
  const { p, b, m, c, v } = producto
  const usd = tasas.usd > 0 ? v / tasas.usd : 0
  const ves = tasas.ves > 0 ? v / tasas.ves : 0

  return (
    <div className="modal-overlay abierto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-detail">
        <h2>Producto encontrado</h2>
        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-label">Producto</span>
            <span className="detail-value detail-name">{p}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Código de barras</span>
            <span className="detail-value detail-barcode">{b}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Marca</span>
            <span className="detail-value">{m || '—'}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Categoría</span>
            <span className="detail-value">{c || '—'}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Precio COP</span>
            <span className="detail-value precio-cop">${v.toLocaleString('es-CO')}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Precio USD</span>
            <span className="detail-value precio-usd">${usd.toFixed(2)}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Precio VES</span>
            <span className="detail-value precio-ves">Bs. {ves.toFixed(2)}</span>
          </div>
        </div>
        <div className="modal-btns">
          <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
