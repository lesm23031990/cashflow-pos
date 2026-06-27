import { useState, useEffect, useCallback } from 'react'
import type { Producto, Tasas } from './types'
import {
  getProductos, getProductoByBarcode, crearProducto,
  actualizarProducto, eliminarProducto, exportarProductos,
  verificarToken,
} from './api'
import TasasForm from './components/TasasForm'
import ProductTable from './components/ProductTable'
import ProductModal from './components/ProductModal'
import ProductDetailModal from './components/ProductDetailModal'
import Toast from './components/Toast'
import Login from './components/Login'

type AuthState = 'loading' | 'login' | 'authed'

export default function App() {
  const [auth, setAuth] = useState<AuthState>('loading')
  const [productos, setProductos] = useState<Producto[]>([])
  const [tasas, setTasas] = useState<Tasas>({ usd: 3500, ves: 4.7 })
  const [filtro, setFiltro] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [editando, setEditando] = useState<Partial<Producto> | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [productoDetalle, setProductoDetalle] = useState<Producto | null>(null)
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setAuth('login')
      return
    }
    verificarToken()
      .then(() => setAuth('authed'))
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        setAuth('login')
      })
  }, [])

  const showToast = useCallback((msg: string, err?: boolean) => {
    setToast({ msg, err })
  }, [])

  function cargar() {
    getProductos()
      .then(setProductos)
      .catch(() => showToast('Error al cargar productos', true))
  }

  useEffect(() => {
    if (auth === 'authed') cargar()
  }, [auth])

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
      .then(() => {
        showToast('Producto eliminado')
        cargar()
      })
      .catch((err: Error) => showToast(err.message, true))
  }

  function handleExport() {
    exportarProductos()
      .then(data => {
        const json = JSON.stringify(data, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'productos.json'
        a.click()
        URL.revokeObjectURL(url)
        showToast('Exportado como productos.json')
      })
      .catch((err: Error) => showToast(err.message, true))
  }

  function handleTasasChange(field: 'usd' | 'ves', value: number) {
    setTasas(prev => ({ ...prev, [field]: value }))
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setAuth('login')
  }

  if (auth === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', color: '#64748b' }}>
        Cargando...
      </div>
    )
  }

  if (auth === 'login') {
    return <Login onLogin={() => setAuth('authed')} />
  }

  return (
    <div className="wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Admin - Precios</h1>
        <button className="btn btn-cancel" onClick={handleLogout} style={{ fontSize: '0.8rem' }}>
          Cerrar sesión
        </button>
      </div>

      <TasasForm tasas={tasas} onChange={handleTasasChange} onToast={showToast} />

      <div className="toolbar">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
        />
        <input
          type="text"
          className="scan-input"
          placeholder="📷 Escanea código de barras..."
          value={barcodeInput}
          onChange={e => setBarcodeInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleBarcodeScan() }}
        />
        <button className="btn btn-primary" onClick={() => { setEditando(null); setModalOpen(true) }}>
          + Nuevo
        </button>
        <button className="btn btn-danger" onClick={handleExport}>
          Exportar
        </button>
      </div>

      <ProductTable
        productos={productos}
        tasas={tasas}
        filtro={filtro}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {modalOpen && (
        <ProductModal
          producto={editando}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditando(null) }}
        />
      )}

      {productoDetalle && (
        <ProductDetailModal
          producto={productoDetalle}
          tasas={tasas}
          onClose={() => setProductoDetalle(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.msg}
          error={toast.err}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
