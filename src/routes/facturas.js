const { Router } = require('express');
const { consultar, primero, ejecutar } = require('../database/connection');

const router = Router();

function formatear(f) {
  return {
    ...f,
    detalles: consultar('SELECT * FROM factura_detalles WHERE factura_id = ?', [f.id])
  };
}

router.get('/', (req, res) => {
  const rows = consultar(
    'SELECT f.*, c.nombre AS cliente_nombre FROM facturas f JOIN clientes c ON c.id = f.cliente_id ORDER BY f.id DESC'
  );
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const f = primero(
    'SELECT f.*, c.nombre AS cliente_nombre FROM facturas f JOIN clientes c ON c.id = f.cliente_id WHERE f.id = ?',
    [req.params.id]
  );
  if (!f) return res.status(404).json({ error: 'Factura no encontrada' });
  res.json(formatear(f));
});

router.post('/', (req, res) => {
  const { cliente_id, moneda, descuento, detalles } = req.body;
  if (!cliente_id || !detalles || detalles.length === 0) {
    return res.status(400).json({ error: 'Faltan datos: cliente_id, detalles' });
  }

  const cliente = primero('SELECT id FROM clientes WHERE id = ?', [cliente_id]);
  if (!cliente) return res.status(400).json({ error: 'Cliente no existe' });

  const tasas = primero('SELECT usd, ves FROM tasas WHERE id = 1');
  const m = moneda || 'COP';
  let subtotal = 0;

  for (const d of detalles) {
    if (!d.producto_id || !d.cantidad || d.cantidad <= 0) {
      return res.status(400).json({ error: 'Detalle inv\u00e1lido' });
    }
    const prod = primero('SELECT id, nombre, precio_cop FROM productos WHERE id = ?', [d.producto_id]);
    if (!prod) return res.status(400).json({ error: 'Producto no encontrado: ' + d.producto_id });
    const pu = d.precio_unitario || prod.precio_cop;
    subtotal += d.cantidad * pu;
  }

  const desc = descuento || 0;
  const total = subtotal - desc;
  const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');

  ejecutar(
    'INSERT INTO facturas (cliente_id, fecha, moneda, tasa_usd, tasa_ves, subtotal, descuento, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [cliente_id, fecha, m, tasas.usd, tasas.ves, subtotal, desc, total]
  );

  const factura = primero('SELECT MAX(id) AS id FROM facturas');

  for (const d of detalles) {
    const prod = primero('SELECT id, nombre, precio_cop FROM productos WHERE id = ?', [d.producto_id]);
    const pu = d.precio_unitario || prod.precio_cop;
    const st = d.cantidad * pu;
    ejecutar(
      'INSERT INTO factura_detalles (factura_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
      [factura.id, d.producto_id, prod.nombre, d.cantidad, pu, st]
    );
  }

  const creada = primero(
    'SELECT f.*, c.nombre AS cliente_nombre FROM facturas f JOIN clientes c ON c.id = f.cliente_id WHERE f.id = ?',
    [factura.id]
  );
  res.status(201).json(formatear(creada));
});

router.delete('/:id', (req, res) => {
  ejecutar('DELETE FROM facturas WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
