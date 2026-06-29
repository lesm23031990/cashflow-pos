export interface Producto {
  id: number
  p: string
  b: string
  v: number
  m: string
  c: string
}

export interface Tasas {
  usd: number
  ves: number
}

export interface Cliente {
  id: number
  nombre: string
  documento: string
  telefono: string
  direccion: string
}

export interface FacturaDetalle {
  id?: number
  factura_id?: number
  producto_id: number
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface Factura {
  id: number
  cliente_id: number
  cliente_nombre: string
  fecha: string
  moneda: string
  tasa_usd: number
  tasa_ves: number
  subtotal: number
  descuento: number
  total: number
  status: string
  metodo_pago: string
  detalles: FacturaDetalle[]
  total_usd: number
  total_ves: number
}

export interface MetodoPago {
  id: number
  nombre: string
}
