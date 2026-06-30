import { useState, useEffect, useCallback, useRef } from 'react'
import type { Producto, Cliente, MetodoPago, Factura, Tasas, FacturaDetalle } from '../types'
import {
  getProductos, getClientes, getFacturas, getFactura, getMetodosPago,
  crearFactura, actualizarFactura, crearCliente,
} from '../api'
import { useTasas } from '../TasasContext'
import Toast from './Toast'

function fmt(n: number, frac?: number) {
  return Number(n).toLocaleString('es-CO', { minimumFractionDigits: frac ?? 0, maximumFractionDigits: frac ?? 0 })
}

function badge(status: string) {
  const cls = status === 'pagada' ? 'badge-ok' : 'badge-warn'
  return <span className={'badge ' + cls}>{status}</span>
}

export default function Facturacion() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientesList, setClientesList] = useState<Cliente[]>([])
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])
  const { tasas, guardarTasas: contextGuardarTasas } = useTasas()

  const [detalles, setDetalles] = useState<(FacturaDetalle & { _tempId: number })[]>([])
  const [nextTempId, setNextTempId] = useState(1)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Producto[]>([])
  const [selectedProd, setSelectedProd] = useState<Producto | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [suggestIdx, setSuggestIdx] = useState(-1)
  const [selectedRow, setSelectedRow] = useState(-1)

  const [clienteId, setClienteId] = useState('')
  const [moneda, setMoneda] = useState('COP')
  const [descuento, setDescuento] = useState(0)
  const [metodoPago, setMetodoPago] = useState('')
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('')
  const [nuevoClienteTel, setNuevoClienteTel] = useState('')

  const [modalCliente, setModalCliente] = useState(false)
  const [modalFactura, setModalFactura] = useState<Factura | null>(null)
  const [modalTasas, setModalTasas] = useState(false)
  const [editTasas, setEditTasas] = useState<Tasas>({ usd: 0, ves: 0 })
  const [consultarOpen, setConsultarOpen] = useState(false)
  const [consSearch, setConsSearch] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)
  const clienteRef = useRef<HTMLSelectElement>(null)
  const monedaRef = useRef<HTMLSelectElement>(null)
  const descuentoRef = useRef<HTMLInputElement>(null)
  const consSearchRef = useRef<HTMLInputElement>(null)

  function cargarDatos() {
    getProductos().then(setProductos)
    getClientes().then(setClientesList)
    getMetodosPago().then(setMetodosPago)
    getFacturas().then(setFacturas)
  }

  useEffect(() => {
    if (tasas) setEditTasas(tasas)
  }, [tasas])

  useEffect(() => { cargarDatos() }, [])

  const prodFiltrados = search.trim()
    ? productos.filter(p => (p.p + ' ' + (p.m || '')).toLowerCase().includes(search.toLowerCase())).slice(0, 10)
    : []

  useEffect(() => {
    setSearchResults(prodFiltrados)
    setSuggestIdx(-1)
  }, [search])

  const subtotal = detalles.reduce((s, d) => s + d.subtotal, 0)
  const total = Math.max(0, subtotal - descuento)
  const sim = moneda === 'COP' ? '$' : moneda === 'USD' ? '$' : 'Bs '

  function agregarProducto(prod?: Producto) {
    const p = prod || selectedProd
    if (!p) return
    const existente = detalles.find(d => d.producto_id === p.id)
    if (existente) {
      setDetalles(detalles.map(d =>
        d._tempId === existente._tempId
          ? { ...d, cantidad: d.cantidad + cantidad, subtotal: (d.cantidad + cantidad) * d.precio_unitario }
          : d
      ))
    } else {
      const nd = { _tempId: nextTempId, producto_id: p.id, producto_nombre: p.p, cantidad, precio_unitario: p.v, subtotal: cantidad * p.v }
      setNextTempId(nextTempId + 1)
      setDetalles([...detalles, nd])
    }
    setSearch('')
    setSelectedProd(null)
    setCantidad(1)
    searchRef.current?.focus()
  }

  function quitarDetalle(tempId: number) {
    setDetalles(detalles.filter(d => d._tempId !== tempId))
  }

  function nuevaFactura() {
    if (detalles.length > 0 && !confirm('¿Limpiar factura actual?')) return
    setDetalles([])
    setSelectedRow(-1)
    setDescuento(0)
    setMetodoPago('')
    setClienteId('')
    setMoneda('COP')
    setSearch('')
    setSelectedProd(null)
    searchRef.current?.focus()
  }

  function generarFactura() {
    if (detalles.length === 0) { setToast({ msg: 'Agrega al menos un producto', err: true }); return }
    if (!metodoPago) { setToast({ msg: 'Selecciona un método de pago', err: true }); return }

    if ((metodoPago === 'Pago Móvil' || metodoPago === 'Bancolombia') && (!nuevoClienteNombre || !nuevoClienteTel)) {
      setToast({ msg: 'Nombre y teléfono del cliente obligatorios', err: true }); return
    }

    setGenerando(true)
    const body: any = {
      moneda,
      descuento,
      metodo_pago: metodoPago,
      detalles: detalles.map(d => ({ producto_id: d.producto_id, cantidad: d.cantidad, precio_unitario: d.precio_unitario })),
    }
    if (clienteId) body.cliente_id = +clienteId
    if (nuevoClienteNombre) { body.cliente_nombre = nuevoClienteNombre; body.cliente_telefono = nuevoClienteTel }

    crearFactura(body)
      .then(f => {
        setToast({ msg: 'Factura #' + f.id + ' generada' })
        setDetalles([])
        setSelectedRow(-1)
        setDescuento(0)
        setMetodoPago('')
        cargarDatos()
        setModalFactura(f)
      })
      .catch(err => setToast({ msg: err.message, err: true }))
      .finally(() => setGenerando(false))
  }

  function verFactura(id: number) {
    getFactura(id).then(setModalFactura).catch(err => setToast({ msg: err.message, err: true }))
  }

  function guardarCambiosFactura() {
    if (!modalFactura) return
    actualizarFactura(modalFactura.id, { status: modalFactura.status, metodo_pago: modalFactura.metodo_pago })
      .then(f => { setModalFactura(f); cargarDatos(); setToast({ msg: 'Factura actualizada' }) })
      .catch(err => setToast({ msg: err.message, err: true }))
  }

  function guardarTasas() {
    contextGuardarTasas(editTasas.usd, editTasas.ves)
      .then(() => { setModalTasas(false); setToast({ msg: 'Tasas actualizadas' }) })
      .catch(() => setToast({ msg: 'Error al guardar tasas', err: true }))
  }

  const consFiltrados = consSearch.trim()
    ? productos.filter(p => (p.p + ' ' + (p.m || '') + ' ' + (p.c || '')).toLowerCase().includes(consSearch.toLowerCase()))
    : productos

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const isInput = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA'
      if (consultarOpen) return

      switch (e.key) {
        case 'F1': e.preventDefault(); setHelpOpen(true); break
        case 'F2': e.preventDefault(); clienteRef.current?.focus(); break
        case 'F3': e.preventDefault(); searchRef.current?.focus(); searchRef.current?.select(); break
        case 'F4': e.preventDefault(); monedaRef.current?.focus(); break
        case 'F5': e.preventDefault(); descuentoRef.current?.focus(); descuentoRef.current?.select(); break
        case 'F6': e.preventDefault(); nuevaFactura(); break
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); generarFactura() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); nuevaFactura() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [detalles, moneda, descuento, metodoPago, clienteId, nuevoClienteNombre, nuevoClienteTel, consultarOpen, helpOpen])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ flex: 1, overflowY: 'auto', maxWidth: '64rem', margin: '0 auto', padding: '0 .75rem 4rem', width: '100%' }}>
        {/* Cliente */}
        <div className="card card-cliente" style={{ borderLeft: '3px solid #06b6d4' }}>
          <div className="card-head"><h2>Cliente</h2></div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <select ref={clienteRef} className="sel" value={clienteId} onChange={e => setClienteId(e.target.value)} style={{ flex: 1 }}>
                <option value="">Seleccionar cliente...</option>
                {clientesList.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.documento ? ' (' + c.documento + ')' : ''}</option>)}
              </select>
              <button className="btn btn-outline btn-sm" onClick={() => setModalCliente(true)}>+ Nuevo</button>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="card" style={{ borderLeft: '3px solid #22c55e' }}>
          <div className="card-head"><h2>Productos</h2></div>
          <div className="card-body">
            <div className="search-row">
              <div className="search-wrap">
                <input ref={searchRef} type="text" className="inp" placeholder="Buscar producto..." value={search}
                  onChange={e => { setSearch(e.target.value); setSuggestIdx(-1) }}
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestIdx(i => Math.min(i + 1, searchResults.length - 1)) }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setSuggestIdx(i => Math.max(i - 1, -1)) }
                    else if (e.key === 'Enter') {
                      if (suggestIdx >= 0 && searchResults[suggestIdx]) { agregarProducto(searchResults[suggestIdx]) }
                      else if (selectedProd) { agregarProducto() }
                    }
                    else if (e.key === 'Escape') { setSearch(''); setSelectedProd(null) }
                  }} />
                {searchResults.length > 0 && search && (
                  <div className="suggest">
                    {searchResults.map((p, i) => (
                      <div key={p.id} className={'suggest-item' + (i === suggestIdx ? ' hover' : '')}
                        style={i === suggestIdx ? { background: '#1e293b' } : {}}
                        onMouseDown={() => { setSelectedProd(p); setSearch(p.p); setSearchResults([]) }}>
                        {p.p} {p.m ? <span className="suggest-marca">{p.m}</span> : ''}
                        <span className="suggest-precio">${fmt(p.v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center' }}>
                <button className="btn btn-icon" onClick={() => setCantidad(c => Math.max(1, c - 1))} style={{ width: '2.2rem', height: '2.2rem', background: '#0b1120', color: '#94a3b8', border: '1px solid #1e293b', borderRadius: '.4rem', cursor: 'pointer' }}>−</button>
                <input type="number" className="inp" value={cantidad} onChange={e => setCantidad(Math.max(1, +e.target.value || 1))} min={1} style={{ width: '3.5rem', textAlign: 'center' }} />
                <button className="btn btn-icon" onClick={() => setCantidad(c => c + 1)} style={{ width: '2.2rem', height: '2.2rem', background: '#0b1120', color: '#94a3b8', border: '1px solid #1e293b', borderRadius: '.4rem', cursor: 'pointer' }}>+</button>
              </div>
              <button className="btn btn-primary" onClick={() => agregarProducto()}>Agregar</button>
              <button className="btn btn-outline" onClick={() => setConsultarOpen(true)}>Consultar</button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Producto</th><th className="col-qty">Cant</th><th className="col-price">Precio</th><th className="col-price">Subtotal</th><th className="col-del"></th></tr>
                </thead>
                <tbody>
                  {detalles.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#475569', padding: '1rem', fontSize: '.8125rem' }}>Sin productos — busca y agrega con Enter</td></tr>
                  ) : detalles.map((d, i) => (
                    <tr key={d._tempId} style={i === selectedRow ? { background: '#06b6d410' } : {}} onClick={() => setSelectedRow(i)}>
                      <td>{d.producto_nombre}</td>
                      <td className="col-qty">{d.cantidad}</td>
                      <td className="col-price">${fmt(d.precio_unitario)}</td>
                      <td className="col-price">${fmt(d.subtotal)}</td>
                      <td className="col-del"><button className="btn-del" onClick={() => quitarDetalle(d._tempId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✖</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="card" style={{ borderLeft: '3px solid #f59e0b' }}>
          <div className="card-body">
            <div className="factura-resumen">
              <div className="factura-field">
                <label>Moneda</label>
                <select ref={monedaRef} className="sel" value={moneda} onChange={e => setMoneda(e.target.value)}>
                  <option value="COP">COP $</option>
                  <option value="USD">USD $</option>
                  <option value="VES">VES Bs</option>
                </select>
              </div>
              <div className="factura-field">
                <label>Descuento</label>
                <input ref={descuentoRef} type="number" value={descuento} onChange={e => setDescuento(+e.target.value || 0)} min={0} step={100} />
              </div>
              <div className="factura-field">
                <label>Método de Pago</label>
                <select className="sel" value={metodoPago} onChange={e => { setMetodoPago(e.target.value); setNuevoClienteNombre(''); setNuevoClienteTel('') }}>
                  <option value="">Seleccionar...</option>
                  {metodosPago.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                </select>
              </div>
              {(metodoPago === 'Pago Móvil' || metodoPago === 'Bancolombia') && (
                <>
                  <div className="factura-field">
                    <label>Nombre <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" value={nuevoClienteNombre} onChange={e => setNuevoClienteNombre(e.target.value)} placeholder="Nombre del cliente" />
                  </div>
                  <div className="factura-field">
                    <label>Teléfono <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" value={nuevoClienteTel} onChange={e => setNuevoClienteTel(e.target.value)} placeholder="Número de teléfono" />
                  </div>
                </>
              )}
              <div className="total-box">
                <span className="total-label">TOTAL</span>
                <span className="total-valor">{sim}{fmt(total)}</span>
              </div>
            </div>
            <div className="action-row">
              <button className="btn btn-cancel btn-lg" onClick={nuevaFactura}>Nueva</button>
              <button className="btn btn-primary btn-lg" onClick={generarFactura} disabled={generando}>
                {generando ? 'Generando...' : 'Generar Factura'}
              </button>
            </div>
          </div>
        </div>

        {/* Historial */}
        <div className="card" style={{ borderLeft: '3px solid #6366f1' }}>
          <div className="card-head"><h2>Últimas Facturas</h2></div>
          <div className="card-body">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Cliente</th><th>Fecha</th><th className="col-price">Total</th><th>Moneda</th><th>Status</th><th>Pago</th><th className="col-del"></th></tr>
                </thead>
                <tbody>
                  {facturas.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: '#475569', padding: '.75rem', fontSize: '.8125rem' }}>Sin facturas aún</td></tr>
                  ) : facturas.slice(0, 20).map(f => (
                    <tr key={f.id}>
                      <td>{f.id}</td><td>{f.cliente_nombre}</td><td>{f.fecha.slice(0, 10)}</td>
                      <td className="col-price">{f.moneda === 'VES' ? 'Bs ' : '$'}{fmt(f.total)}</td>
                      <td>{f.moneda}</td>
                      <td>{badge(f.status || 'en espera')}</td>
                      <td>{f.metodo_pago || '—'}</td>
                      <td className="col-del"><button className="btn-act" onClick={() => verFactura(f.id)} style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer' }}>Ver</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="shortcuts-bar">
        <span><kbd>F1</kbd> Ayuda</span>
        <span><kbd>F3</kbd> Buscar</span>
        <span><kbd>Ctrl+N</kbd> Nueva</span>
        <span><kbd>Ctrl+Enter</kbd> Generar</span>
        <span><kbd>Esc</kbd> Cerrar</span>
      </div>

      {/* Modal Cliente */}
      {modalCliente && (
        <div className="modal-overlay abierto" onClick={e => { if (e.target === e.currentTarget) setModalCliente(false) }}>
          <div className="modal">
            <h2>Nuevo Cliente</h2>
            <div className="campo"><label>Nombre</label><input type="text" id="frmClienteNombre" className="inp" /></div>
            <div className="campo"><label>Documento</label><input type="text" id="frmClienteDoc" className="inp" /></div>
            <div className="campo"><label>Teléfono</label><input type="text" id="frmClienteTel" className="inp" /></div>
            <div className="campo"><label>Dirección</label><input type="text" id="frmClienteDir" className="inp" /></div>
            <div className="modal-btns">
              <button className="btn btn-cancel" onClick={() => setModalCliente(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => {
                const nombre = (document.getElementById('frmClienteNombre') as HTMLInputElement).value.trim()
                if (!nombre) { setToast({ msg: 'Nombre obligatorio', err: true }); return }
                crearCliente({
                  nombre,
                  documento: (document.getElementById('frmClienteDoc') as HTMLInputElement).value.trim(),
                  telefono: (document.getElementById('frmClienteTel') as HTMLInputElement).value.trim(),
                  direccion: (document.getElementById('frmClienteDir') as HTMLInputElement).value.trim(),
                }).then(c => {
                  setToast({ msg: 'Cliente creado' })
                  setModalCliente(false)
                  cargarDatos()
                  setClienteId(String(c.id))
                }).catch(err => setToast({ msg: err.message, err: true }))
              }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Factura */}
      {modalFactura && (
        <div className="modal-overlay abierto" onClick={e => { if (e.target === e.currentTarget) setModalFactura(null) }}>
          <div className="modal" style={{ maxWidth: '40rem' }}>
            <h2>Factura #{modalFactura.id}</h2>
            <div className="factura-meta">
              <div className="factura-meta-row">
                <span className="meta-item"><strong>Cliente:</strong> {modalFactura.cliente_nombre}</span>
                <span className="meta-item"><strong>Fecha:</strong> {modalFactura.fecha}</span>
                <span className="meta-item"><strong>Moneda:</strong> {modalFactura.moneda}</span>
                <span className="meta-item"><strong>Status:</strong> {badge(modalFactura.status || 'en espera')}</span>
                <span className="meta-item"><strong>Pago:</strong> {modalFactura.metodo_pago || '—'}</span>
              </div>
            </div>
            <table>
              <thead><tr><th>Producto</th><th className="col-qty">Cant</th><th className="col-price">Precio</th><th className="col-price">Subtotal</th></tr></thead>
              <tbody>
                {(modalFactura.detalles || []).map((d, i) => (
                  <tr key={i}><td>{d.producto_nombre}</td><td className="col-qty">{d.cantidad}</td><td className="col-price">${fmt(d.precio_unitario)}</td><td className="col-price">${fmt(d.subtotal)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="factura-totales">
              <p>Subtotal: {modalFactura.moneda === 'VES' ? 'Bs ' : '$'}{fmt(modalFactura.subtotal)}</p>
              {modalFactura.descuento > 0 && <p>Descuento: -{modalFactura.moneda === 'VES' ? 'Bs ' : '$'}{fmt(modalFactura.descuento)}</p>}
              <p className="grande">{modalFactura.moneda === 'VES' ? 'Bs ' : '$'}{fmt(modalFactura.total)}</p>
              {modalFactura.total_usd !== undefined && <p className="equiv">USD: ${fmt(modalFactura.total_usd, 2)}</p>}
              {modalFactura.total_ves !== undefined && <p className="equiv">VES: Bs {fmt(modalFactura.total_ves, 2)}</p>}
            </div>
            {modalFactura.status === 'en espera' && (
              <div className="card" style={{ marginTop: '.75rem', background: '#0b1120' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="factura-field">
                      <label>Status</label>
                      <select className="sel" value={modalFactura.status} onChange={e => setModalFactura({ ...modalFactura, status: e.target.value })}>
                        <option value="en espera">En espera</option>
                        <option value="pagada">Pagada</option>
                      </select>
                    </div>
                    <div className="factura-field">
                      <label>Método de Pago</label>
                      <select className="sel" value={modalFactura.metodo_pago} onChange={e => setModalFactura({ ...modalFactura, metodo_pago: e.target.value })}>
                        <option value="">—</option>
                        {metodosPago.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                      </select>
                    </div>
                    <button className="btn btn-primary" onClick={guardarCambiosFactura}>Guardar Cambios</button>
                  </div>
                </div>
              </div>
            )}
            <div className="modal-btns">
              <button className="btn btn-cancel" onClick={() => setModalFactura(null)}>Cerrar</button>
              <button className="btn btn-primary" onClick={() => window.print()}>Imprimir</button>
            </div>
          </div>
        </div>
      )}

      {/* Consultar productos modal */}
      {consultarOpen && (
        <div className="modal-overlay abierto" onClick={e => { if (e.target === e.currentTarget) { setConsultarOpen(false); setConsSearch('') } }}>
          <div className="modal" style={{ maxWidth: '44rem', padding: '.75rem .875rem .875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
              <h2 style={{ color: '#06b6d4', fontSize: '1rem', margin: 0 }}>Consultar Productos</h2>
              <button onClick={() => { setConsultarOpen(false); setConsSearch('') }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.1rem', cursor: 'pointer', padding: '.2rem' }}>✖</button>
            </div>
            <input type="text" className="inp" placeholder="Escribe para buscar..." value={consSearch} onChange={e => setConsSearch(e.target.value)}
              autoFocus style={{ marginBottom: '.5rem' }} />
            <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr><th>Producto</th><th>Marca</th><th className="col-price">COP</th><th className="col-price">USD</th><th className="col-price">VES</th></tr>
                </thead>
                <tbody>
                  {consFiltrados.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#475569', padding: '1rem' }}>Sin resultados</td></tr>
                  ) : consFiltrados.map(p => (
                    <tr key={p.id} style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedProd(p)
                        setSearch(p.p)
                        setConsultarOpen(false)
                        setConsSearch('')
                        searchRef.current?.focus()
                      }}>
                      <td>{p.p}</td>
                      <td style={{ color: '#64748b', fontSize: '.8125rem' }}>{p.m || ''}</td>
                      <td className="col-price" style={{ color: '#fbbf24' }}>${fmt(p.v)}</td>
                      <td className="col-price" style={{ color: '#34d399' }}>${Number(tasas && tasas.usd > 0 ? p.v / tasas.usd : 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="col-price" style={{ color: '#f472b6' }}>Bs {fmt(tasas && tasas.ves > 0 ? p.v / tasas.ves : 0, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Ayuda modal */}
      {helpOpen && (
        <div className="modal-overlay abierto" onClick={e => { if (e.target === e.currentTarget) setHelpOpen(false) }}>
          <div className="modal" style={{ maxWidth: '26rem' }}>
            <h2>Atajos de Teclado</h2>
            <table style={{ width: '100%', fontSize: '.8125rem', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['F1', 'Mostrar esta ayuda'],
                  ['F2', 'Enfocar cliente'],
                  ['F3', 'Enfocar búsqueda de productos'],
                  ['F4', 'Enfocar selector de moneda'],
                  ['F5', 'Enfocar descuento'],
                  ['F6', 'Nueva factura (limpiar)'],
                  ['↑ ↓', 'Navegar sugerencias'],
                  ['Enter', 'Agregar producto seleccionado'],
                  ['Ctrl+Enter', 'Generar factura'],
                  ['Ctrl+N', 'Nueva factura'],
                  ['Esc', 'Cerrar modal / limpiar búsqueda'],
                ].map(([key, desc]) => (
                  <tr key={key}>
                    <td style={{ padding: '.3rem .5rem', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap', width: '7rem' }}>
                      <kbd style={{ background: '#1e293b', color: '#94a3b8', padding: '.1rem .4rem', borderRadius: '.2rem', border: '1px solid #334155', fontSize: '.6875rem', fontFamily: 'inherit' }}>{key}</kbd>
                    </td>
                    <td style={{ padding: '.3rem .5rem', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="modal-btns">
              <button className="btn btn-primary" onClick={() => setHelpOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} error={toast.err} onClose={() => setToast(null)} />}
    </div>
  )
}
