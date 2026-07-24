import { useState, useEffect, useCallback, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import type { Producto, Tasas, MetodoPago } from './types'
import {
  getProductos, getProductoByBarcode, crearProducto,
  actualizarProducto, eliminarProducto, exportarProductos,
  verificarToken,
  getMetodosPago, crearMetodoPago, actualizarMetodoPago, eliminarMetodoPago,
} from './api'
import { TasasProvider, useTasas } from './TasasContext'
import ProductTable from './components/ProductTable'
import ProductModal from './components/ProductModal'
import ProductDetailModal from './components/ProductDetailModal'
import Toast from './components/Toast'
import BulkPriceUpdate from './components/BulkPriceUpdate'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Facturacion from './components/Facturacion'

type AuthState = 'loading' | 'login' | 'authed'

function Topbar({ appName }: { appName: string }) {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname.replace('/admin', '') || '/'
  const { tasas, guardarTasas: contextGuardarTasas } = useTasas()
  const [editTasas, setEditTasas] = useState<Tasas>({ usd: 0, ves: 0 })
  const [modalTasas, setModalTasas] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null)

  useEffect(() => {
    if (tasas) setEditTasas(tasas)
  }, [tasas])

  function guardarTasas() {
    contextGuardarTasas(editTasas.usd, editTasas.ves)
      .then(() => { setModalTasas(false); setToast({ msg: 'Tasas actualizadas' }) })
      .catch(() => setToast({ msg: 'Error al guardar tasas', err: true }))
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">{appName}</h1>
          {tasas ? (
            <span className="tasas-badge" onClick={() => setModalTasas(true)} title="Editar tasas de cambio">
              <span className="tasa-chip">USD <span>{Number(tasas.usd).toLocaleString('es-CO')}</span></span>
              <span className="tasa-chip">VES <span>{Number(tasas.ves).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span></span>
              <span style={{ color: '#64748b', fontSize: '.75rem', marginLeft: '.15rem' }}>✎</span>
            </span>
          ) : (
            <span className="tasas-badge" style={{ opacity: 0.5 }}>Cargando tasas...</span>
          )}
        </div>
        <nav className="topbar-nav">
          <Link to="/admin" className={path === '/' || path === '' ? 'active' : ''}>Admin</Link>
          <Link to="/admin/facturacion" className={path.includes('facturacion') ? 'active' : ''}>Facturación</Link>
          <Link to="/admin/dashboard" className={path.includes('dashboard') ? 'active' : ''}>Dashboard</Link>
        </nav>
      </div>

      {modalTasas && (
        <div className="modal-overlay abierto" onClick={e => { if (e.target === e.currentTarget) setModalTasas(false) }}>
          <div className="modal modal-sm">
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
    </>
  )
}

function AdminPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const { tasas } = useTasas()
  const [searchInput, setSearchInput] = useState('')
  const [editando, setEditando] = useState<Partial<Producto> | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [productoDetalle, setProductoDetalle] = useState<Producto | null>(null)
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null)
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [nuevoMetodo, setNuevoMetodo] = useState('')
  const [toolbarCompact, setToolbarCompact] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const barcodeBuffer = useRef('')
  const barcodeTimer = useRef<ReturnType<typeof setTimeout>>()
  const lastKeyTime = useRef(0)

  const showToast = useCallback((msg: string, err?: boolean) => {
    setToast({ msg, err })
  }, [])

  function cargar() {
    getProductos().then(setProductos).catch(() => showToast('Error al cargar productos', true))
    getMetodosPago().then(setMetodosPago).catch(() => {})
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      const now = Date.now()
      const elapsed = now - lastKeyTime.current
      lastKeyTime.current = now

      if (e.key === 'Enter' && barcodeBuffer.current.length >= 3) {
        const codigo = barcodeBuffer.current
        barcodeBuffer.current = ''
        if (searchRef.current) searchRef.current.focus()
        setSearchInput(codigo)
        buscarBarcode(codigo)
        e.preventDefault()
        return
      }

      if (e.key.length === 1 && elapsed < 50) {
        barcodeBuffer.current += e.key
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current)
        barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = '' }, 200)
      } else if (elapsed >= 50) {
        barcodeBuffer.current = ''
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    function onScroll() {
      setToolbarCompact(window.scrollY > 60)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function buscarBarcode(codigo: string) {
    if (!codigo) return
    getProductoByBarcode(codigo)
      .then(existente => {
        if (existente) {
          setProductoDetalle(existente)
        } else {
          setEditando({ b: codigo, c: 'Otra' })
          setModalOpen(true)
        }
      })
      .catch(() => showToast('Error al buscar código', true))
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchInput(e.target.value)
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const val = searchInput.trim()
      if (!val) return
      buscarBarcode(val)
    }
  }

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

  function handleUpdate(id: number, field: string, value: string | number): Promise<void> {
    return actualizarProducto(id, { [field]: value })
      .then(() => { showToast('Producto actualizado'); cargar() })
      .catch((err: Error) => { showToast(err.message, true); throw err })
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

      <div className={`toolbar${toolbarCompact ? ' compact' : ''}`}>
        <input ref={searchRef} type="text" className="scan-input" placeholder="Buscar producto o escanear código de barras..." value={searchInput}
          onChange={handleSearchChange} onKeyDown={handleSearchKeyDown} />
        <button className="btn btn-primary" onClick={() => { setEditando(null); setModalOpen(true) }}>+ Nuevo</button>
        <button className="btn btn-outline" onClick={() => setBulkOpen(true)}>📷 Actualizar desde foto</button>
        <button className="btn btn-danger" onClick={handleExport}>Exportar</button>
      </div>

      <ProductTable productos={productos} tasas={tasas} filtro={searchInput} onEdit={handleEdit} onDelete={handleDelete} onUpdate={handleUpdate} />

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

      {bulkOpen && <BulkPriceUpdate onClose={() => { setBulkOpen(false); cargar() }} onToast={showToast} />}

      {toast && <Toast message={toast.msg} error={toast.err} onClose={() => setToast(null)} />}
    </div>
  )
}

function AppContent() {
  const [auth, setAuth] = useState<AuthState>('loading')
  const [appName, setAppName] = useState('Barebare')

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => { if (cfg.nombre_app) setAppName(cfg.nombre_app) })
      .catch(() => {})
  }, [])

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
    <TasasProvider>
      <Topbar appName={appName} />
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/facturacion" element={<Facturacion />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </TasasProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
