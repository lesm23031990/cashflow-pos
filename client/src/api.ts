import type { Producto, Tasas } from './types'

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

export function actualizarProducto(id: number, data: Partial<Producto>): Promise<Producto> {
  return request('/productos/' + id, {
    method: 'PUT',
    body: JSON.stringify({
      nombre: data.p,
      codigo_barras: data.b,
      precio_cop: data.v,
      marca: data.m,
      categoria: data.c,
    }),
  })
}

export function eliminarProducto(id: number): Promise<void> {
  return request('/productos/' + id, { method: 'DELETE' })
}

export function exportarProductos(): Promise<Producto[]> {
  return request('/productos/exportar')
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
