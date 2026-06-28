import { useState, useEffect } from 'react'
import type { Factura, Producto, Cliente, Tasas } from '../types'
import { getFacturas, getProductos, getClientes, getTasas, actualizarTasas } from '../api'
import Toast from './Toast'

function fmt(n: number, frac?: number) {
  return Number(n).toLocaleString('es-CO', { minimumFractionDigits: frac ?? 0, maximumFractionDigits: frac ?? 0 })
}

function fmtMoneda(n: number, moneda?: string) {
  const s = moneda === 'VES' ? 'Bs ' : '$'
  return s + fmt(n)
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

export default function Dashboard() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientesData, setClientesData] = useState<Cliente[]>([])
  const [tasas, setTasas] = useState<Tasas>({ usd: 3500, ves: 4.7 })
  const [editTasas, setEditTasas] = useState<Tasas>({ usd: 3500, ves: 4.7 })
  const [modalTasas, setModalTasas] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null)

  function cargar() {
    Promise.all([getFacturas(), getProductos(), getClientes(), getTasas()])
      .then(([f, p, c, t]) => {
        setFacturas(f)
        setProductos(p)
        setClientesData(c)
        setTasas(t)
        setEditTasas(t)
      })
  }

  useEffect(() => { cargar() }, [])

  const facturasHoy = facturas.filter(f => f.fecha.slice(0, 10) === hoy())
  const ingresosHoy = facturasHoy.reduce((s, f) => s + f.total, 0)
  const ingresosTotal = facturas.reduce((s, f) => s + f.total, 0)

  function guardarTasas() {
    actualizarTasas(editTasas.usd, editTasas.ves)
      .then(t => { setTasas(t); setModalTasas(false); setToast({ msg: 'Tasas actualizadas' }) })
      .catch(() => setToast({ msg: 'Error al guardar tasas', err: true }))
  }

  return (
    <div className="wrapper">
      <div className="kpi-grid">
        <div className="kpi"><span className="kpi-value">{facturasHoy.length}</span><span className="kpi-label">Facturas Hoy</span></div>
        <div className="kpi"><span className="kpi-value">{fmtMoneda(ingresosHoy)}</span><span className="kpi-label">Ingresos Hoy</span></div>
        <div className="kpi"><span className="kpi-value">{fmtMoneda(ingresosTotal)}</span><span className="kpi-label">Ingresos Totales</span></div>
        <div className="kpi"><span className="kpi-value">{productos.length}</span><span className="kpi-label">Productos</span></div>
        <div className="kpi"><span className="kpi-value">{clientesData.length}</span><span className="kpi-label">Clientes</span></div>
        <div className="kpi"><span className="kpi-value">{facturas.length}</span><span className="kpi-label">Facturas Totales</span></div>
      </div>

      <div className="card">
        <div className="card-head"><h2>Tasas de Cambio</h2></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8' }}><strong style={{ color: '#34d399' }}>USD</strong> 1 USD = {fmt(tasas.usd)} COP</span>
            <span style={{ color: '#94a3b8' }}><strong style={{ color: '#f472b6' }}>VES</strong> 1 VES = {fmt(tasas.ves, 1)} COP</span>
            <button className="btn btn-outline btn-sm" onClick={() => setModalTasas(true)}>Editar</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h2>Últimas Facturas</h2></div>
        <div className="card-body">
          <table>
            <thead>
              <tr><th>#</th><th>Cliente</th><th>Fecha</th><th className="num">Total</th><th>Moneda</th></tr>
            </thead>
            <tbody>
              {facturas.length === 0 ? (
                <tr><td colSpan={5} className="vacio">Sin facturas</td></tr>
              ) : facturas.slice(0, 15).map(f => (
                <tr key={f.id}>
                  <td>{f.id}</td><td>{f.cliente_nombre}</td><td>{f.fecha.slice(0, 10)}</td>
                  <td className="num">{fmtMoneda(f.total, f.moneda)}</td><td>{f.moneda}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalTasas && (
        <div className="modal-overlay abierto" onClick={e => { if (e.target === e.currentTarget) setModalTasas(false) }}>
          <div className="modal">
            <h2>Editar Tasas de Cambio</h2>
            <div className="campo">
              <label>1 USD = ? COP</label>
              <input type="number" value={editTasas.usd} onChange={e => setEditTasas(p => ({ ...p, usd: +e.target.value }))} step={1} min={0} />
            </div>
            <div className="campo">
              <label>1 VES = ? COP</label>
              <input type="number" value={editTasas.ves} onChange={e => setEditTasas(p => ({ ...p, ves: +e.target.value }))} step="any" min={0} />
            </div>
            <div className="modal-btns">
              <button className="btn btn-cancel" onClick={() => setModalTasas(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarTasas}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} error={toast.err} onClose={() => setToast(null)} />}
    </div>
  )
}
