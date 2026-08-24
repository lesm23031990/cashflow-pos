import { useState, useEffect, useCallback, useRef } from 'react'
import type { Producto, MetodoPago, Factura, FacturaDetalle, ResumenCierreResponse, CierreCaja } from '../types'
import {
  getProductos, getFacturas, getFactura, getMetodosPago,
  crearFactura, actualizarFactura, getProductoByBarcode,
  getResumenCierre, crearCierre,
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
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const { tasas } = useTasas()

  const [detalles, setDetalles] = useState<(FacturaDetalle & { _tempId: number })[]>([])
  const [nextTempId, setNextTempId] = useState(1)

  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Producto[]>([])
  const [suggestIdx, setSuggestIdx] = useState(-1)
  const [selectedRow, setSelectedRow] = useState(-1)

  const [metodoPago, setMetodoPago] = useState('')
  const [recibidoCOP, setRecibidoCOP] = useState(0)
  const [recibidoUSD, setRecibidoUSD] = useState(0)
  const [recibidoVES, setRecibidoVES] = useState(0)
  const [nombreExtra, setNombreExtra] = useState('')
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('')
  const [nuevoClienteTel, setNuevoClienteTel] = useState('')

  const [modalFactura, setModalFactura] = useState<Factura | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [consultarOpen, setConsultarOpen] = useState(false)
  const [consSearch, setConsSearch] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)
  const [calcCOP, setCalcCOP] = useState('')
  const [calcUSD, setCalcUSD] = useState('')
  const [calcVES, setCalcVES] = useState('')
  const [generando, setGenerando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null)

  const [resumenCierre, setResumenCierre] = useState<ResumenCierreResponse | null>(null)
  const [cerrando, setCerrando] = useState(false)
  const [modalCierre, setModalCierre] = useState(false)
  const [cierreResultado, setCierreResultado] = useState<CierreCaja | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)
  const recibidoRef = useRef<HTMLInputElement>(null)

  const lastScan = useRef(0)
  const scanBuf = useRef('')

  const totalCOP = detalles.reduce((s, d) => s + d.subtotal, 0)
  const totalUSD = tasas && tasas.usd > 0 ? totalCOP / tasas.usd : 0
  const totalVES = tasas && tasas.ves > 0 ? totalCOP / tasas.ves : 0
  const totalRecibidoCOP = recibidoCOP + (recibidoUSD * (tasas?.usd || 0)) + (recibidoVES * (tasas?.ves || 0))
  const cambioCOP = totalRecibidoCOP > totalCOP ? totalRecibidoCOP - totalCOP : 0
  const cambioUSD = cambioCOP > 0 && tasas?.usd > 0 ? cambioCOP / tasas.usd : 0
  const cambioVES = cambioCOP > 0 && tasas?.ves > 0 ? cambioCOP / tasas.ves : 0

  function cargarDatos() {
    getProductos().then(setProductos)
    getMetodosPago().then(setMetodosPago)
    getFacturas().then(() => {})
    getResumenCierre().then(setResumenCierre).catch(() => {})
  }

  useEffect(() => { cargarDatos() }, [])

  const prodFiltrados = search.trim()
    ? productos.filter(p => (p.p + ' ' + (p.m || '')).toLowerCase().includes(search.toLowerCase())).slice(0, 10)
    : []

  useEffect(() => {
    setSearchResults(prodFiltrados)
    setSuggestIdx(-1)
  }, [search])

  function agregarProducto(prod?: Producto | null, qty?: number) {
    const p = prod || null
    if (!p) return
    const q = qty ?? 1
    const existente = detalles.find(d => d.producto_id === p.id)
    if (existente) {
      setDetalles(detalles.map(d =>
        d._tempId === existente._tempId
          ? { ...d, cantidad: d.cantidad + q, subtotal: (d.cantidad + q) * d.precio_unitario }
          : d
      ))
    } else {
      const nd = { _tempId: nextTempId, producto_id: p.id, producto_nombre: p.p, cantidad: q, precio_unitario: p.v, subtotal: q * p.v }
      setNextTempId(nextTempId + 1)
      setDetalles([...detalles, nd])
    }
    setSearch('')
    setCantidad(1)
    setSearchResults([])
    searchRef.current?.focus()
  }
  const [cantidad, setCantidad] = useState(1)

  function actualizarCantidad(tempId: number, nuevaCant: number) {
    const c = Math.max(1, nuevaCant)
    setDetalles(detalles.map(d =>
      d._tempId === tempId
        ? { ...d, cantidad: c, subtotal: c * d.precio_unitario }
        : d
    ))
  }

  function quitarDetalle(tempId: number) {
    setDetalles(detalles.filter(d => d._tempId !== tempId))
  }

  function nuevaFactura() {
    if (detalles.length > 0 && !confirm('¿Limpiar factura actual?')) return
    setDetalles([])
    setSelectedRow(-1)
    setMetodoPago('')
    setRecibidoCOP(0)
    setRecibidoUSD(0)
    setRecibidoVES(0)
    setNombreExtra('')
    setNuevoClienteNombre('')
    setNuevoClienteTel('')
    setSearch('')
    searchRef.current?.focus()
  }

  function buscarBarcode(codigo: string) {
    getProductoByBarcode(codigo).then(p => {
      if (p) {
        agregarProducto(p, 1)
      } else {
        setToast({ msg: 'Producto no encontrado: ' + codigo, err: true })
      }
    }).catch(() => {
      setToast({ msg: 'Error al buscar código', err: true })
    })
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    const now = Date.now()
    scanBuf.current = val
    lastScan.current = now
    setSearch(val)
    setSuggestIdx(-1)
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestIdx(i => Math.min(i + 1, searchResults.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSuggestIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') {
      const val = search.trim()
      if (!val) return
      if (suggestIdx >= 0 && searchResults[suggestIdx]) {
        agregarProducto(searchResults[suggestIdx], 1)
      } else if (searchResults.length === 1) {
        agregarProducto(searchResults[0], 1)
      } else {
        const prod = productos.find(p => p.b === val)
        if (prod) {
          agregarProducto(prod, 1)
        } else {
          buscarBarcode(val)
        }
      }
      setSearch('')
    }
    else if (e.key === 'Escape') { setSearch(''); setSearchResults([]) }
  }

  function handleCerrarCaja() {
    if (!resumen || resumen.cantidad_facturas === 0) {
      setToast({ msg: 'No hay facturas para cerrar', err: true }); return
    }
    if (!confirm(`¿Cerrar caja? ${resumen.cantidad_facturas} facturas, total $${fmt(resumen.total_ventas)}`)) return
    cerrarCaja()
  }

  function generarFactura() {
    if (detalles.length === 0) { setToast({ msg: 'Agrega al menos un producto', err: true }); return }
    if (!metodoPago) { setToast({ msg: 'Selecciona un método de pago', err: true }); return }

    if ((metodoPago === 'Pago Móvil' || metodoPago === 'Bancolombia') && (!nuevoClienteNombre || !nuevoClienteTel)) {
      setToast({ msg: 'Nombre y teléfono del cliente obligatorios', err: true }); return
    }

    setGenerando(true)
    const body: any = {
      moneda: 'COP',
      descuento: 0,
      metodo_pago: metodoPago,
      detalles: detalles.map(d => ({ producto_id: d.producto_id, cantidad: d.cantidad, precio_unitario: d.precio_unitario })),
      nombre_extra: nombreExtra,
    }
    if (nuevoClienteNombre) { body.cliente_nombre = nuevoClienteNombre; body.cliente_telefono = nuevoClienteTel }

    crearFactura(body)
      .then(f => {
        setToast({ msg: 'Factura #' + f.id + ' generada' })
        setDetalles([])
        setSelectedRow(-1)
        setMetodoPago('')
        setRecibidoCOP(0)
        setRecibidoUSD(0)
        setRecibidoVES(0)
        setNombreExtra('')
        setNuevoClienteNombre('')
        setNuevoClienteTel('')
        cargarDatos()
        setModalFactura(f)
      })
      .catch(err => setToast({ msg: err.message, err: true }))
      .finally(() => setGenerando(false))
  }

  function verFactura(id: number) {
    getFactura(id).then(f => { setModalFactura(f); setEditMode(false) }).catch(err => setToast({ msg: err.message, err: true }))
  }

  function activarEdicionFactura() {
    setEditMode(true)
  }

  function guardarCambiosFactura() {
    if (!modalFactura) return
    actualizarFactura(modalFactura.id, { status: modalFactura.status, metodo_pago: modalFactura.metodo_pago })
      .then(f => { setModalFactura(f); setEditMode(false); cargarDatos(); setToast({ msg: 'Factura actualizada' }) })
      .catch(err => setToast({ msg: err.message, err: true }))
  }

  function cerrarCaja() {
    setCerrando(true)
    crearCierre()
      .then(c => {
        setCierreResultado(c)
        setModalCierre(true)
        cargarDatos()
        setToast({ msg: 'Cierre de caja realizado' })
      })
      .catch(err => setToast({ msg: err.message, err: true }))
      .finally(() => setCerrando(false))
  }

  const consFiltrados = consSearch.trim()
    ? productos.filter(p => (p.p + ' ' + (p.m || '') + ' ' + (p.c || '')).toLowerCase().includes(consSearch.toLowerCase()))
    : productos

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (consultarOpen) return

      switch (e.key) {
        case 'F1': e.preventDefault(); setHelpOpen(true); break
        case 'F3': e.preventDefault(); searchRef.current?.focus(); searchRef.current?.select(); break
        case 'F6': e.preventDefault(); nuevaFactura(); break
        case 'F7': e.preventDefault(); handleCerrarCaja(); break
        case 'F8': e.preventDefault(); setCalcOpen(o => !o); break
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); generarFactura() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); nuevaFactura() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [detalles, metodoPago, nuevoClienteNombre, nuevoClienteTel, consultarOpen, helpOpen, recibidoCOP, recibidoUSD, recibidoVES])

  const ultimoCierre = resumenCierre?.ultimo_cierre
  const resumen = resumenCierre?.resumen
  const facturasCierre = resumenCierre?.facturas || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 56px)' }}>
      <div className="split-layout">
        {/* ── LEFT: Facturación ── */}
        <div className="split-left">
          <div className="split-left-inner">
            {/* Productos */}
            <div className="card" style={{ borderLeft: '3px solid #22c55e' }}>
              <div className="card-head"><h2>Productos</h2></div>
              <div className="card-body">
                <div className="search-row">
                  <div className="search-wrap">
                    <input ref={searchRef} type="text" className="inp prod-inp scan-input" placeholder="Buscar producto o escanear código..." value={search}
                      onChange={handleSearchChange}
                      onKeyDown={handleSearchKeyDown} />
                    {searchResults.length > 0 && search && (
                      <div className="suggest">
                        {searchResults.map((p, i) => (
                          <div key={p.id} className={'suggest-item' + (i === suggestIdx ? ' hover' : '')}
                            style={i === suggestIdx ? { background: '#1e293b' } : {}}
                            onMouseDown={() => { agregarProducto(p, 1) }}>
                            <span className="suggest-nombre">{p.p}</span>
                            {p.m ? <span className="suggest-marca">{p.m}</span> : ''}
                            <span className="suggest-precio">${fmt(p.v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="btn btn-outline" onClick={() => setConsultarOpen(true)}>Consultar</button>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Producto</th><th className="col-qty">Cant</th><th className="col-price">Precio</th><th className="col-price">Subtotal</th><th className="col-del"></th></tr>
                    </thead>
                    <tbody>
                      {detalles.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', color: '#475569', padding: '1rem', fontSize: '.8125rem' }}>Sin productos — escanea o busca con Enter</td></tr>
                      ) : detalles.map((d, i) => (
                        <tr key={d._tempId} className={i === selectedRow ? 'row-selected' : ''} onClick={() => setSelectedRow(i)}>
                          <td style={{ fontSize: '.8125rem' }}>{d.producto_nombre}</td>
                          <td className="col-qty">
                            <input type="number" className="qty-inp" value={d.cantidad}
                              min={1} step={1}
                              onChange={e => actualizarCantidad(d._tempId, Math.max(1, Math.floor(+e.target.value || 1)))}
                              onClick={e => e.stopPropagation()} />
                          </td>
                          <td className="col-price">${fmt(d.precio_unitario)}</td>
                          <td className="col-price">${fmt(d.subtotal)}</td>
                          <td className="col-del">
                            <button className="btn-del" onClick={() => quitarDetalle(d._tempId)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '.85rem' }}>✖</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Resumen y Pago */}
            <div className="card" style={{ borderLeft: '3px solid #f59e0b' }}>
              <div className="card-body">
                <div className="factura-resumen">
                  <div className="factura-field" style={{ minWidth: '10rem', flex: 1.5 }}>
                    <label>Nombre (opcional)</label>
                    <input type="text" className="inp" value={nombreExtra} onChange={e => setNombreExtra(e.target.value)} placeholder="Para facturas en espera" />
                  </div>
                  <div className="factura-field">
                    <label>Método de Pago</label>
                    <select className="sel" value={metodoPago} onChange={e => { setMetodoPago(e.target.value); setRecibidoCOP(0); setRecibidoUSD(0); setRecibidoVES(0); setNuevoClienteNombre(''); setNuevoClienteTel('') }}>
                      <option value="">Seleccionar...</option>
                      {metodosPago.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                    </select>
                  </div>
                  {metodoPago && ['Efectivo', 'Bancolombia', 'Pago Móvil', 'Punto de Venta'].includes(metodoPago) && (
                    <>
                      <div className="efectivo-inputs">
                        {['Efectivo', 'Bancolombia'].includes(metodoPago) && (
                          <div className="efectivo-row">
                            <span className="efectivo-m label">COP</span>
                            <input type="number" className="inp efectivo-inp" value={recibidoCOP || ''}
                              placeholder="$0" onChange={e => setRecibidoCOP(+e.target.value || 0)} min={0} />
                          </div>
                        )}
                        {metodoPago === 'Efectivo' && (
                          <div className="efectivo-row">
                            <span className="efectivo-m label" style={{ color: '#34d399' }}>USD</span>
                            <input type="number" className="inp efectivo-inp" value={recibidoUSD || ''}
                              placeholder="$0" onChange={e => setRecibidoUSD(Math.max(0, +e.target.value || 0))} min={0} step={0.01} />
                            {recibidoUSD > 0 && <span className="efectivo-equiv">≈ ${fmt(recibidoUSD * (tasas?.usd || 0))}</span>}
                          </div>
                        )}
                        {(metodoPago === 'Pago Móvil' || metodoPago === 'Punto de Venta') && (
                          <div className="efectivo-row">
                            <span className="efectivo-m label" style={{ color: '#f472b6' }}>VES</span>
                            <input type="number" className="inp efectivo-inp" value={recibidoVES || ''}
                              placeholder="Bs 0" onChange={e => setRecibidoVES(Math.max(0, +e.target.value || 0))} min={0} step={0.01} />
                            {recibidoVES > 0 && <span className="efectivo-equiv">≈ ${fmt(recibidoVES * (tasas?.ves || 0))}</span>}
                          </div>
                        )}
                      </div>
                      {totalRecibidoCOP > 0 && (
                        <div className="efectivo-total">Recibido: ${fmt(totalRecibidoCOP)}</div>
                      )}
                      {cambioCOP > 0 && (
                        <div className="cambio-box">
                          <div>
                            <span className="cambio-label">Cambio</span>
                            <span className="cambio-valor">${fmt(cambioCOP)}</span>
                          </div>
                          {cambioUSD > 0 && <span className="cambio-usd">≈ USD ${fmt(cambioUSD, 2)}</span>}
                          {cambioVES > 0 && <span className="cambio-ves">≈ VES Bs {fmt(cambioVES, 2)}</span>}
                        </div>
                      )}
                    </>
                  )}
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
                </div>

                <div className="total-box">
                  <span className="total-label">TOTAL</span>
                  <span className="total-valor">${fmt(totalCOP)}</span>
                  <div className="total-equiv">
                    {totalUSD > 0 && <span className="equiv-item">USD ${fmt(totalUSD, 2)}</span>}
                    {totalVES > 0 && <span className="equiv-item">Bs {fmt(totalVES, 2)}</span>}
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
          </div>
        </div>

        {/* ── RIGHT: Cierre + Listado ── */}
        <div className="split-right">
          <div className="card" style={{ borderLeft: '3px solid #a855f7' }}>
            <div className="card-head">
              <h2>Cierre de Caja</h2>
              {ultimoCierre && (
                <span style={{ fontSize: '.6875rem', color: '#64748b' }}>
                  {ultimoCierre.fecha_fin.slice(0, 16)}
                </span>
              )}
            </div>
            <div className="card-body">
              {resumen ? (
                <div className="cierre-resumen">
                  <div className="cierre-kpis">
                    <div className="cierre-kpi">
                      <span className="cierre-kpi-val">{resumen.cantidad_facturas}</span>
                      <span className="cierre-kpi-label">Facturas</span>
                    </div>
                    <div className="cierre-kpi">
                      <span className="cierre-kpi-val" style={{ color: '#34d399' }}>${fmt(resumen.total_ventas)}</span>
                      <span className="cierre-kpi-label">Ventas</span>
                    </div>
                  </div>
                  {Object.keys(resumen.resumen_metodos_pago).length > 0 && (
                    <div className="cierre-metodos">
                      {Object.entries(resumen.resumen_metodos_pago).map(([mp, data]) => (
                        <div key={mp} className="cierre-metodo">
                          <span className="cierre-metodo-nombre">{mp}</span>
                          <span className="cierre-metodo-cant">{data.cantidad}</span>
                          <span className="cierre-metodo-total">${fmt(data.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="btn btn-primary btn-lg" onClick={cerrarCaja} disabled={cerrando} style={{ marginTop: '.5rem', width: '100%' }}>
                    {cerrando ? 'Cerrando...' : 'Cerrar Caja'}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#475569', fontSize: '.8125rem' }}>Cargando...</div>
              )}
            </div>
          </div>

          <div className="card" style={{ borderLeft: '3px solid #6366f1', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="card-head"><h2>Facturas ({facturasCierre.length})</h2></div>
            <div className="card-body" style={{ flex: 1, overflow: 'auto', paddingBottom: '.5rem' }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Nombre</th><th className="col-price">Total</th><th>Pago</th><th style={{ width: '4rem' }}></th></tr>
                  </thead>
                  <tbody>
                    {facturasCierre.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: '#475569', padding: '.75rem', fontSize: '.8125rem' }}>Sin facturas en este turno</td></tr>
                    ) : facturasCierre.map(f => (
                      <tr key={f.id} className={f.status === 'en espera' ? 'row-espera' : ''}>
                        <td style={{ fontWeight: 600 }}>{f.id}</td>
                        <td style={{ fontSize: '.8125rem' }}>{f.nombre_extra || '—'}</td>
                        <td className="col-price" style={{ fontSize: '.8125rem' }}>
                          {badge(f.status || 'en espera')}
                          <span style={{ marginLeft: '.4rem' }}>${fmt(f.total)}</span>
                        </td>
                        <td style={{ fontSize: '.8125rem', color: '#94a3b8' }}>{f.metodo_pago || '—'}</td>
                        <td><button className="btn btn-sm btn-outline" onClick={() => verFactura(f.id)}>Ver</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shortcuts-bar">
        <span><kbd>F1</kbd> Ayuda</span>
        <span><kbd>F3</kbd> Buscar</span>
        <span><kbd>F6</kbd> Nueva</span>
        <span><kbd>F7</kbd> Cerrar Caja</span>
        <span><kbd>Ctrl+N</kbd> Nueva</span>
        <span><kbd>Ctrl+Enter</kbd> Generar</span>
        <span><kbd>Esc</kbd> Cerrar</span>
        <button className="btn btn-sm btn-primary" onClick={handleCerrarCaja}
          style={{ marginLeft: 'auto', fontSize: '.6875rem', padding: '.2rem .6rem' }}>
          Cerrar Caja
        </button>
      </div>

      {modalFactura && (
        <div className="modal-overlay abierto" onClick={e => { if (e.target === e.currentTarget) { setModalFactura(null); setEditMode(false) } }}>
          <div className="modal factura-modal" style={{ maxWidth: '52rem' }}>
            <h2>Factura #{modalFactura.id}</h2>
            <div className="factura-meta">
              <div className="factura-meta-row">
                <span className="meta-item"><strong>Nombre:</strong> {modalFactura.nombre_extra || '—'}</span>
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
              <p className="grande">${fmt(modalFactura.total)}</p>
              {modalFactura.total_usd !== undefined && <p className="equiv">USD: ${fmt(modalFactura.total_usd, 2)}</p>}
              {modalFactura.total_ves !== undefined && <p className="equiv">VES: Bs {fmt(modalFactura.total_ves, 2)}</p>}
            </div>

            {editMode && (
              <div className="card" style={{ marginTop: '.75rem', background: '#0b1120' }}>
                <div className="card-body">
                  <h3 style={{ margin: '0 0 .5rem', fontSize: '.875rem', color: '#94a3b8' }}>Editar Factura</h3>
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
                      <select className="sel" value={modalFactura.metodo_pago || ''} onChange={e => setModalFactura({ ...modalFactura, metodo_pago: e.target.value })}>
                        <option value="">—</option>
                        {metodosPago.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                      </select>
                    </div>
                    <button className="btn btn-primary" onClick={guardarCambiosFactura}>Guardar Cambios</button>
                    <button className="btn btn-cancel" onClick={() => setEditMode(false)}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-btns">
              {modalFactura.status === 'en espera' && !editMode && (
                <button className="btn btn-primary" onClick={activarEdicionFactura}>Editar Status / Pago</button>
              )}
              <button className="btn btn-primary" onClick={() => window.print()}>Imprimir</button>
              <button className="btn btn-cancel" onClick={() => { setModalFactura(null); setEditMode(false) }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {modalCierre && cierreResultado && (
        <div className="modal-overlay abierto" onClick={e => { if (e.target === e.currentTarget) { setModalCierre(false); setCierreResultado(null) } }}>
          <div className="modal" style={{ maxWidth: '32rem' }}>
            <h2>Cierre de Caja #{cierreResultado.id}</h2>
            <div style={{ fontSize: '.8125rem', color: '#94a3b8', marginBottom: '.75rem' }}>
              <p>Desde: {cierreResultado.fecha_inicio}</p>
              <p>Hasta: {cierreResultado.fecha_fin}</p>
            </div>
            <div className="cierre-kpis" style={{ marginBottom: '.75rem' }}>
              <div className="cierre-kpi">
                <span className="cierre-kpi-val">{cierreResultado.cantidad_facturas}</span>
                <span className="cierre-kpi-label">Facturas</span>
              </div>
              <div className="cierre-kpi">
                <span className="cierre-kpi-val" style={{ color: '#34d399' }}>${fmt(cierreResultado.total_ventas)}</span>
                <span className="cierre-kpi-label">Total</span>
              </div>
            </div>
            <div className="modal-btns">
              <button className="btn btn-primary" onClick={() => { setModalCierre(false); setCierreResultado(null) }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

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
                        agregarProducto(p, 1)
                        setConsultarOpen(false)
                        setConsSearch('')
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

      {helpOpen && (
        <div className="modal-overlay abierto" onClick={e => { if (e.target === e.currentTarget) setHelpOpen(false) }}>
          <div className="modal" style={{ maxWidth: '26rem' }}>
            <h2>Atajos de Teclado</h2>
            <table style={{ width: '100%', fontSize: '.8125rem', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['F1', 'Mostrar esta ayuda'],
                  ['F3', 'Enfocar búsqueda / escáner'],
                  ['F6', 'Nueva factura (limpiar)'],
                  ['F7', 'Cerrar caja'],
                  ['↑ ↓', 'Navegar sugerencias'],
                  ['Enter', 'Agregar producto'],
                  ['Ctrl+Enter', 'Generar factura'],
                  ['Ctrl+N', 'Nueva factura'],
                  ['Esc', 'Cerrar modal / limpiar búsqueda'],
                ].map(([key, desc]) => (
                  <tr key={key as string}>
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
