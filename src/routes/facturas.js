const { Router } = require('express');
const { consultar, primero, ejecutar } = require('../database/connection');

const router = Router();

function formatear(f) {
  const tasas = primero('SELECT usd, ves FROM tasas WHERE id = 1');
  return {
    ...f,
    detalles: consultar('SELECT * FROM factura_detalles WHERE factura_id = ?', [f.id]),
    total_usd: tasas && tasas.usd > 0 ? f.total / tasas.usd : 0,
    total_ves: tasas && tasas.ves > 0 ? f.total / tasas.ves : 0
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
  const { cliente_id, moneda, descuento, metodo_pago, detalles, cliente_nombre, cliente_telefono } = req.body;
  if (!detalles || detalles.length === 0) {
    return res.status(400).json({ error: 'Faltan datos: detalles' });
  }

  // Cliente: si se envía nombre, crear cliente nuevo; si no, usar Mostrador
  var cid = cliente_id;
  if (cliente_nombre) {
    ejecutar(
      'INSERT INTO clientes (nombre, telefono) VALUES (?, ?)',
      [cliente_nombre, cliente_telefono || '']
    );
    cid = primero('SELECT MAX(id) AS id FROM clientes').id;
  } else if (!cid) {
    const def = primero("SELECT id FROM clientes WHERE nombre = 'Mostrador'");
    cid = def ? def.id : 1;
  }

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
  const mp = metodo_pago || '';

  ejecutar(
    'INSERT INTO facturas (cliente_id, fecha, moneda, tasa_usd, tasa_ves, subtotal, descuento, total, status, metodo_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [cid, fecha, m, tasas.usd, tasas.ves, subtotal, desc, total, 'en espera', mp]
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

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existe = primero('SELECT id, status FROM facturas WHERE id = ?', [id]);
  if (!existe) return res.status(404).json({ error: 'Factura no encontrada' });

  const { status, metodo_pago, detalles } = req.body;

  // Actualizar campos simples
  const campos = [];
  const valores = [];
  if (status !== undefined) { campos.push('status = ?'); valores.push(status); }
  if (metodo_pago !== undefined) { campos.push('metodo_pago = ?'); valores.push(metodo_pago); }

  // Si se enviaron detalles, recalcular todo
  if (detalles && Array.isArray(detalles) && detalles.length > 0) {
    const tasas = primero('SELECT usd, ves FROM tasas WHERE id = 1');
    const factura = primero('SELECT * FROM facturas WHERE id = ?', [id]);
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
    const desc = factura.descuento || 0;
    const total = subtotal - desc;
    campos.push('subtotal = ?'); valores.push(subtotal);
    campos.push('total = ?'); valores.push(total);

    // Reemplazar detalles
    ejecutar('DELETE FROM factura_detalles WHERE factura_id = ?', [id]);
    for (const d of detalles) {
      const prod = primero('SELECT id, nombre, precio_cop FROM productos WHERE id = ?', [d.producto_id]);
      const pu = d.precio_unitario || prod.precio_cop;
      const st = d.cantidad * pu;
      ejecutar(
        'INSERT INTO factura_detalles (factura_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [id, d.producto_id, prod.nombre, d.cantidad, pu, st]
      );
    }
  }

  if (campos.length > 0) {
    valores.push(id);
    ejecutar(`UPDATE facturas SET ${campos.join(', ')} WHERE id = ?`, valores);
  }

  const actualizada = primero(
    'SELECT f.*, c.nombre AS cliente_nombre FROM facturas f JOIN clientes c ON c.id = f.cliente_id WHERE f.id = ?',
    [id]
  );
  res.json(formatear(actualizada));
});

router.delete('/:id', (req, res) => {
  ejecutar('DELETE FROM facturas WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
