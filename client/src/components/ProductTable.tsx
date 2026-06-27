import type { Producto } from '../types'

interface Props {
  productos: Producto[]
  tasas: { usd: number; ves: number }
  filtro: string
  onEdit: (idx: number) => void
  onDelete: (idx: number) => void
}

function esc(s: string) {
  const d = document.createElement('div')
  d.appendChild(document.createTextNode(s))
  return d.innerHTML
}

export default function ProductTable({ productos, tasas, filtro, onEdit, onDelete }: Props) {
  const { usd, ves } = tasas

  const lista = filtro
    ? productos.filter(item => {
        const txt = (item.p + ' ' + (item.m || '') + ' ' + (item.c || '') + ' ' + (item.b || '')).toLowerCase()
        return txt.includes(filtro.toLowerCase())
      })
    : productos

  if (lista.length === 0) {
    return (
      <>
        <table>
          <thead>
            <tr>
              <th>Producto</th><th>Código</th><th>Marca</th><th>Categoría</th>
              <th className="num">COP</th><th className="num">USD</th><th className="num">VES</th>
              <th className="acciones-th">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={8} className="vacio">No hay productos</td></tr>
          </tbody>
        </table>
        <p className="total"><span>{productos.length}</span> productos</p>
      </>
    )
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Producto</th><th>Código</th><th>Marca</th><th>Categoría</th>
            <th className="num">COP</th><th className="num">USD</th><th className="num">VES</th>
            <th className="acciones-th">Acción</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((item, i) => {
            const idx = productos.indexOf(item)
            const cop = item.v
            const usdVal = usd > 0 ? cop / usd : 0
            const vesVal = ves > 0 ? cop / ves : 0
            return (
              <tr key={item.id}>
                <td>{esc(item.p)}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: item.b ? '#fbbf24' : '#475569' }}>
                  {item.b || '—'}
                </td>
                <td>{esc(item.m || '')}</td>
                <td>{esc(item.c || '')}</td>
                <td className="num precio-cop">${Number(cop).toLocaleString('es-CO')}</td>
                <td className="num precio-usd">${usdVal.toFixed(4)}</td>
                <td className="num precio-ves">Bs {Number(vesVal).toLocaleString('es-CO', { maximumFractionDigits: 2 })}</td>
                <td className="acciones">
                  <button onClick={() => onEdit(idx)} title="Editar">✏️</button>
                  <button onClick={() => onDelete(idx)} title="Eliminar">❌</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="total"><span>{productos.length}</span> productos</p>
    </>
  )
}
