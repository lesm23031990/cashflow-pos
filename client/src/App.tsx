import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import type { Producto, Tasas, MetodoPago } from './types'
import {
  getProductos, getProductoByBarcode, crearProducto,
  actualizarProducto, eliminarProducto, exportarProductos,
  verificarToken, getTasas, actualizarTasas,
  getMetodosPago, crearMetodoPago, actualizarMetodoPago, eliminarMetodoPago,
} from './api'
import TasasForm from './components/TasasForm'
import ProductTable from './components/ProductTable'
import ProductModal from './components/ProductModal'
import ProductDetailModal from './components/ProductDetailModal'
import Toast from './components/Toast'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Facturacion from './components/Facturacion'

type AuthState = 'loading' | 'login' | 'authed'

function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname.replace('/admin', '') || '/'

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">Barebare</h1>
      </div>
      <nav className="topbar-nav">
        <Link to="/admin" className={path === '/' || path === '' ? 'active' : ''}>Admin</Link>
        <Link to="/admin/facturacion" className={path.includes('facturacion') ? 'active' : ''}>Facturación</Link>
        <Link to="/admin/dashboard" className={path.includes('dashboard') ? 'active' : ''}>Dashboard</Link>
      </nav>
    </div>
  )
}

function AdminPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [tasas, setTasas] = useState<Tasas>({ usd: 3500, ves: 4.7 })
  const [filtro, setFiltro] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [editando, setEditando] = useState<Partial<Producto> | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [productoDetalle, setProductoDetalle] = useState<Producto | null>(null)
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null)
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [nuevoMetodo, setNuevoMetodo] = useState('')

  const showToast = useCallback((msg: string, err?: boolean) => {
    setToast({ msg, err })
  }, [])

  function cargar() {
    getProductos().then(setProductos).catch(() => showToast('Error al cargar productos', true))
    getTasas().then(setTasas).catch(() => {})
    getMetodosPago().then(setMetodosPago).catch(() => {})
  }

  useEffect(() => { cargar() }, [])

  const handleBarcodeScan = useCallback(async () => {
    const codigo = barcodeInput.trim()
    if (!codigo) return
    try {
      const existente = await getProductoByBarcode(codigo)
      if (existente) {
        setProductoDetalle(existente)
        setBarcodeInput('')
        return
      }
      setEditando({ b: codigo, c: 'Otra' })
      setModalOpen(true)
      setBarcodeInput('')
    } catch {
      showToast('Error al buscar código', true)
    }
  }, [barcodeInput, showToast])

  function handleSave(data: Partial<Producto>) {
    const promise = editando?.id
      ? actualizarProducto(editando.id, data)
      : crearProducto(data)
    promise
      .then(() => {
        showToast(editando?.id ? 'Producto actualizado' : 'Producto agregado')
        setModalOpen(false)
        setEditando(null)
        cargar()
      })
      .catch((err: Error) => showToast(err.message, true))
  }

  function handleEdit(idx: number) {
    setEditando(productos[idx])
    setModalOpen(true)
  }

  function handleDelete(idx: number) {
    const item = productos[idx]
    if (!confirm(`¿Eliminar "${item.p}"?`)) return
    eliminarProducto(item.id)
      .then(() => { showToast('Producto eliminado'); cargar() })
      .catch((err: Error) => showToast(err.message, true))
  }

  function handleExport() {
    exportarProductos()
      .then(data => {
        const json = JSON.stringify(data, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'productos.json'; a.click()
        URL.revokeObjectURL(url)
        showToast('Exportado como productos.json')
      })
      .catch((err: Error) => showToast(err.message, true))
  }

  function handleTasasChange(usd: number, ves: number) {
    setTasas({ usd, ves })
    actualizarTasas(usd, ves).catch(() => {})
  }

  function agregarMetodo() {
    const nombre = nuevoMetodo.trim()
    if (!nombre) return
    crearMetodoPago(nombre).then(() => { setNuevoMetodo(''); getMetodosPago().then(setMetodosPago); showToast('Método agregado') }).catch(err => showToast(err.message, true))
  }

  function editarMetodo(m: MetodoPago) {
    const nuevo = prompt('Editar nombre:', m.nombre)
    if (nuevo && nuevo.trim() && nuevo.trim() !== m.nombre) {
      actualizarMetodoPago(m.id, nuevo.trim()).then(() => { getMetodosPago().then(setMetodosPago); showToast('Actualizado') }).catch(err => showToast(err.message, true))
    }
  }

  function eliminarMetodo(id: number) {
    if (!confirm('Eliminar este método de pago?')) return
    eliminarMetodoPago(id).then(() => { getMetodosPago().then(setMetodosPago); showToast('Eliminado') }).catch(err => showToast(err.message, true))
  }

  return (
    <div className="wrapper">
      <TasasForm tasas={tasas} onChange={handleTasasChange} onToast={showToast} />

      <div className="toolbar">
        <input type="text" placeholder="Buscar producto..." value={filtro} onChange={e => setFiltro(e.target.value)} />
        <input type="text" className="scan-input" placeholder="📷 Escanea código de barras..." value={barcodeInput}
          onChange={e => setBarcodeInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleBarcodeScan() }} />
        <button className="btn btn-primary" onClick={() => { setEditando(null); setModalOpen(true) }}>+ Nuevo</button>
        <button className="btn btn-danger" onClick={handleExport}>Exportar</button>
      </div>

      <ProductTable productos={productos} tasas={tasas} filtro={filtro} onEdit={handleEdit} onDelete={handleDelete} />

      {modalOpen && (
        <ProductModal producto={editando} onSave={handleSave} onClose={() => { setModalOpen(false); setEditando(null) }} />
      )}

      {productoDetalle && (
        <ProductDetailModal producto={productoDetalle} tasas={tasas} onClose={() => setProductoDetalle(null)} />
      )}

      <hr className="sep" style={{ border: 'none', borderTop: '1px solid #1e293b', margin: '1.5rem 0' }} />

      <div className="metodos-pago">
        <h2>Métodos de Pago</h2>
        <div className="metodos-row">
          <input type="text" className="inp-met" placeholder="Nuevo método" value={nuevoMetodo} onChange={e => setNuevoMetodo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') agregarMetodo() }} />
          <button className="btn btn-primary" onClick={agregarMetodo}>Agregar</button>
        </div>
        <ul className="metodos-list">
          {metodosPago.map(m => (
            <li key={m.id}>
              {m.nombre}
              <button className="btn-edit-met" onClick={() => editarMetodo(m)}>✎</button>
              <button className="btn-del-met" onClick={() => eliminarMetodo(m.id)}>✖</button>
            </li>
          ))}
        </ul>
      </div>

      {toast && <Toast message={toast.msg} error={toast.err} onClose={() => setToast(null)} />}
    </div>
  )
}

function AppContent() {
  const [auth, setAuth] = useState<AuthState>('loading')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setAuth('login'); return }
    verificarToken()
      .then(() => setAuth('authed'))
      .catch(() => {
        localStorage.removeItem('token'); localStorage.removeItem('usuario')
        setAuth('login')
      })
  }, [])

  if (auth === 'loading') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', color: '#64748b' }}>Cargando...</div>
  }

  if (auth === 'login') {
    return <Login onLogin={() => setAuth('authed')} />
  }

  return (
    <>
      <Topbar />
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/facturacion" element={<Facturacion />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
