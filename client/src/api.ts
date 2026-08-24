import type { Producto, Tasas, Cliente, Factura, MetodoPago, CierreCaja, ResumenCierreResponse } from './types'

const BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('token')
}

function headers(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...extra }
  const token = getToken()
  if (token) h['Authorization'] = 'Bearer ' + token
  return h
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { ...headers(opts?.headers as Record<string, string>), 'Content-Type': 'application/json' },
  })
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    window.location.reload()
    throw new Error('Sesión expirada')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export function login(username: string, password: string): Promise<{ token: string; usuario: { username: string; rol: string } }> {
  return fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }).then(r => {
    if (!r.ok) return r.json().then(e => { throw new Error(e.error) })
    return r.json()
  })
}

export function verificarToken(): Promise<{ valido: boolean; usuario: { username: string; rol: string } }> {
  return request('/auth/verificar')
}

export function getProductos(): Promise<Producto[]> {
  return request('/productos')
}

export function getProductoByBarcode(codigo: string): Promise<Producto | null> {
  return request('/productos/codigo/' + encodeURIComponent(codigo))
}

export function crearProducto(data: Partial<Producto>): Promise<Producto> {
  return request('/productos', {
    method: 'POST',
    body: JSON.stringify({
      nombre: data.p,
      codigo_barras: data.b || '',
      precio_cop: data.v,
      marca: data.m || '',
      categoria: data.c || '',
    }),
  })
}

export function actualizarProducto(id: number, data: Partial<Producto> | Record<string, string | number | undefined>): Promise<Producto> {
  return request('/productos/' + id, {
    method: 'PUT',
    body: JSON.stringify({
      nombre: (data as any).p ?? (data as any).nombre,
      codigo_barras: (data as any).b ?? (data as any).codigo_barras,
      precio_cop: (data as any).v ?? (data as any).precio_cop,
      marca: (data as any).m ?? (data as any).marca,
      categoria: (data as any).c ?? (data as any).categoria,
    }),
  })
}

export function eliminarProducto(id: number): Promise<void> {
  return request('/productos/' + id, { method: 'DELETE' })
}

export function exportarProductos(): Promise<Producto[]> {
  return request('/productos/exportar')
}

export function analizarFacturaOCR(imagenBase64: string): Promise<{ ok: boolean; items: any[]; texto_extraido: string }> {
  return request('/ocr', {
    method: 'POST',
    body: JSON.stringify({ imagen: imagenBase64 }),
  })
}

export function actualizarProductoMasivo(items: { nombre?: string; marca?: string; precio_cop?: number; codigo_barras?: string; categoria?: string }[]): Promise<{ ok: boolean; resultados: any[] }> {
  return request('/productos/actualizar-masivo', {
    method: 'POST',
    body: JSON.stringify(items),
  })
}

export function getTasas(): Promise<Tasas> {
  return request('/tasas')
}

export function actualizarTasas(usd: number, ves: number): Promise<Tasas> {
  return request('/tasas', {
    method: 'PUT',
    body: JSON.stringify({ usd, ves }),
  })
}

// Clientes
export function getClientes(): Promise<Cliente[]> {
  return request('/clientes')
}

export function crearCliente(data: Partial<Cliente>): Promise<Cliente> {
  return request('/clientes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Facturas
export function getFacturas(): Promise<Factura[]> {
  return request('/facturas')
}

export function getFacturasTurnoActual(): Promise<Factura[]> {
  return request('/facturas/turno-actual')
}

export function getFactura(id: number): Promise<Factura> {
  return request('/facturas/' + id)
}

export function crearFactura(data: {
  cliente_id?: number
  cliente_nombre?: string
  cliente_telefono?: string
  moneda: string
  descuento: number
  metodo_pago: string
  detalles: { producto_id: number; cantidad: number; precio_unitario?: number }[]
}): Promise<Factura> {
  return request('/facturas', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function actualizarFactura(id: number, data: { status?: string; metodo_pago?: string }): Promise<Factura> {
  return request('/facturas/' + id, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Métodos de pago
export function getMetodosPago(): Promise<MetodoPago[]> {
  return request('/metodos-pago')
}

export function crearMetodoPago(nombre: string): Promise<MetodoPago> {
  return request('/metodos-pago', {
    method: 'POST',
    body: JSON.stringify({ nombre }),
  })
}

export function actualizarMetodoPago(id: number, nombre: string): Promise<MetodoPago> {
  return request('/metodos-pago/' + id, {
    method: 'PUT',
    body: JSON.stringify({ nombre }),
  })
}

export function eliminarMetodoPago(id: number): Promise<void> {
  return request('/metodos-pago/' + id, { method: 'DELETE' })
}

// Cierres de Caja
export function getUltimoCierre(): Promise<CierreCaja | null> {
  return request('/cierres-caja/ultimo')
}

export function getResumenCierre(): Promise<ResumenCierreResponse> {
  return request('/cierres-caja/resumen')
}

export function crearCierre(): Promise<CierreCaja> {
  return request('/cierres-caja', { method: 'POST' })
}
