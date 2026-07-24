import { useState, useRef } from 'react'
import type { Producto } from '../types'
import { actualizarProductoMasivo, getProductos } from '../api'

interface Props {
  onClose: () => void
  onToast: (msg: string, err?: boolean) => void
}

interface Fila {
  id: number
  nombre: string
  marca: string
  precio: string
  sugerido: Producto | null
  verificado: boolean
}

let nextFilaId = 1

export default function BulkPriceUpdate({ onClose, onToast }: Props) {
  const [imagen, setImagen] = useState<string | null>(null)
  const [rawText, setRawText] = useState('')
  const [filas, setFilas] = useState<Fila[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [guardando, setGuardando] = useState(false)
  const [suggestIdx, setSuggestIdx] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImagen(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function parsearTexto() {
    const lineas = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lineas.length === 0) { onToast('Pega el texto de los productos primero', true); return }

    if (productos.length === 0) {
      try { const p = await getProductos(); setProductos(p) } catch {}
    }

    const items: Fila[] = []
    for (const linea of lineas) {
      const match = linea.match(/^(.*?)\s+(\d[\d.,]*)$/)
      if (!match) {
        items.push({ id: nextFilaId++, nombre: linea, marca: '', precio: '', sugerido: null, verificado: false })
        continue
      }

      let nombre = match[1].trim()
      const precioStr = match[2].replace(/[.,\s]/g, '')
      const precio = parseInt(precioStr, 10)
      if (!nombre || isNaN(precio)) continue

      const nombreLower = nombre.toLowerCase()
      const sugerido = productos.find(p =>
        p.nombre.toLowerCase().includes(nombreLower) || nombreLower.includes(p.nombre.toLowerCase())
      ) || productos.find(p =>
        nombreLower.split(/\s+/).some((pal: string) => pal.length > 2 && p.nombre.toLowerCase().includes(pal))
      )

      items.push({
        id: nextFilaId++, nombre, marca: sugerido?.m || '', precio: String(precio),
        sugerido, verificado: false,
      })
    }

    if (items.length === 0) { onToast('No se pudo parsear ningún producto. Revisa el formato.', true); return }
    setFilas(items)
    onToast(`Se detectaron ${items.length} producto(s). Verifica antes de guardar.`)
  }

  function agregarFila() {
    setFilas(prev => [...prev, { id: nextFilaId++, nombre: '', marca: '', precio: '', sugerido: null, verificado: false }])
  }

  function actualizarFila(id: number, cambios: Partial<Fila>) {
    setFilas(prev => prev.map(f => f.id === id ? { ...f, ...cambios } : f))
  }

  function buscarSugerencia(nombre: string, marca: string) {
    const txt = (nombre + ' ' + marca).toLowerCase()
    return productos.filter(p => {
      const pt = (p.p + ' ' + (p.m || '')).toLowerCase()
      return pt.includes(txt)
    }).slice(0, 6)
  }

  function seleccionarSugerencia(filaId: number, producto: Producto) {
    actualizarFila(filaId, { nombre: producto.p, marca: producto.m || '', sugerido: producto, verificado: false })
    setSuggestIdx(null)
  }

  async function guardar() {
    const verificadas = filas.filter(f => f.verificado)
    if (verificadas.length === 0) { onToast('Verifica al menos un producto antes de guardar', true); return }
    setGuardando(true)
    try {
      const items = verificadas.map(f => ({
        nombre: f.nombre,
        marca: f.marca || 'Genérico',
        precio_cop: parseFloat(f.precio),
        codigo_barras: f.sugerido?.b || '',
        categoria: f.sugerido?.c || 'Otra',
      }))
      await actualizarProductoMasivo(items)
      onToast(`${items.length} producto(s) actualizado(s)`)
      onClose()
    } catch (err: any) {
      onToast(err.message, true)
    } finally { setGuardando(false) }
  }

  const filasVerificadas = filas.filter(f => f.verificado).length

  return (
    <div className="modal-overlay abierto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal bulk-modal">
        <div className="bulk-header">
          <h2>Actualizar precios desde factura</h2>
          <button className="btn btn-cancel btn-sm" onClick={onClose}>✖</button>
        </div>

        <div className="bulk-body">
          <div className="bulk-left">
            {imagen ? (
              <div className="bulk-img-wrap">
                <img src={imagen} alt="Factura" className="bulk-img" />
                <button className="btn btn-sm btn-outline" onClick={() => { setImagen(null); if (fileRef.current) fileRef.current.value = '' }}>
                  Cambiar foto
                </button>
              </div>
            ) : (
              <div className="bulk-img-placeholder" onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} hidden />
                <div className="bulk-upload-icon">📷</div>
                <div>Subir foto de la factura</div>
                <div className="bulk-upload-hint">Solo como referencia visual</div>
              </div>
            )}
          </div>

          <div className="bulk-right">
            {filas.length === 0 ? (
              <>
                <div className="bulk-paste-area">
                  <label>Pega los productos desde WhatsApp:</label>
                  <textarea
                    className="bulk-textarea"
                    placeholder={`Ej:\nLata Grande 3700\nCoca Cola 2L 6500\nLeche 10000`}
                    rows={8}
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                  />
                  <div className="bulk-paste-actions">
                    <button className="btn btn-primary" onClick={parsearTexto}>Parsear productos</button>
                    <button className="btn btn-outline btn-sm" onClick={agregarFila}>O agregar manualmente</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bulk-filas">
                  {filas.map((fila, i) => {
                    const sugerencias = fila.nombre ? buscarSugerencia(fila.nombre, fila.marca) : []
                    return (
                      <div key={fila.id} className={`bulk-fila${fila.verificado ? ' verified' : ''}`}>
                        <div className="bulk-fila-row">
                          <div className="bulk-fila-nombre">
                            <input type="text" placeholder="Nombre" value={fila.nombre}
                              onChange={e => { actualizarFila(fila.id, { nombre: e.target.value, sugerido: null, verificado: false }); setSuggestIdx(i) }}
                              onFocus={() => setSuggestIdx(i)}
                              onBlur={() => setTimeout(() => setSuggestIdx(null), 200)} />
                            {suggestIdx === i && sugerencias.length > 0 && (
                              <div className="bulk-suggest">
                                {sugerencias.map(s => (
                                  <div key={s.id} className="bulk-suggest-item" onMouseDown={() => seleccionarSugerencia(fila.id, s)}>
                                    <span className="bulk-suggest-name">{s.p}</span>
                                    <span className="bulk-suggest-marca">{s.m || '—'}</span>
                                    <span className="bulk-suggest-precio">${s.v.toLocaleString('es-CO')}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="bulk-fila-marca">
                            <input type="text" placeholder="Marca" value={fila.marca}
                              onChange={e => actualizarFila(fila.id, { marca: e.target.value, verificado: false })} />
                          </div>
                          <div className="bulk-fila-precio">
                            <input type="number" step="1" min="0" placeholder="COP" value={fila.precio}
                              onChange={e => actualizarFila(fila.id, { precio: e.target.value })} />
                          </div>
                          <div className="bulk-fila-check">
                            <label className="check-label" title="Verificar">
                              <input type="checkbox" checked={fila.verificado}
                                onChange={e => actualizarFila(fila.id, { verificado: e.target.checked })} />
                              <span>✓</span>
                            </label>
                          </div>
                          <div className="bulk-fila-del">
                            <button className="btn-del-sm" onClick={() => setFilas(prev => prev.filter(f => f.id !== fila.id))}>✖</button>
                          </div>
                        </div>
                        {fila.sugerido && (
                          <div className="bulk-match-info">
                            Coincide con: <strong>{fila.sugerido.p}</strong>
                            {fila.sugerido.m ? ` (${fila.sugerido.m})` : ''}
                            {!fila.sugerido.b ? ' — sin código de barras' : ''}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="bulk-actions">
                  <button className="btn btn-outline btn-sm" onClick={agregarFila}>+ Agregar producto</button>
                  <button className="btn btn-sm btn-outline" onClick={() => setFilas([])}>Volver al inicio</button>
                  <div className="bulk-summary">
                    {filas.length > 0 && <span>{filasVerificadas} de {filas.length} verificados</span>}
                  </div>
                  <button className="btn btn-primary" onClick={guardar} disabled={guardando || filasVerificadas === 0}>
                    {guardando ? 'Guardando...' : `Guardar (${filasVerificadas})`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}