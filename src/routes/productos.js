const { Router } = require('express');
const { consultar, primero, ejecutar } = require('../database/connection');

const router = Router();

router.get('/', (req, res) => {
  const rows = consultar(
    'SELECT id, nombre, codigo_barras, precio_cop, marca, categoria, stock FROM productos ORDER BY nombre'
  );
  res.json(rows.map(r => ({
    id: r.id,
    p: r.nombre,
    b: r.codigo_barras || '',
    v: r.precio_cop,
    m: r.marca || '',
    c: r.categoria || '',
    s: r.stock || 0
  })));
});

router.get('/codigo/:codigo', (req, res) => {
  const row = primero(
    'SELECT id, nombre, codigo_barras, precio_cop, marca, categoria, stock FROM productos WHERE codigo_barras = ?',
    [req.params.codigo]
  );
  if (!row) return res.json(null);
  res.json({
    id: row.id,
    p: row.nombre,
    b: row.codigo_barras || '',
    v: row.precio_cop,
    m: row.marca || '',
    c: row.categoria || '',
    s: row.stock || 0
  });
});

router.post('/', (req, res) => {
  const { nombre, codigo_barras, precio_cop, marca, categoria, stock } = req.body;
  if (!nombre || precio_cop == null) {
    return res.status(400).json({ error: 'Faltan campos: nombre, precio_cop' });
  }
  ejecutar(
    'INSERT INTO productos (nombre, codigo_barras, precio_cop, marca, categoria, stock) VALUES (?, ?, ?, ?, ?, ?)',
    [nombre, codigo_barras || '', precio_cop, marca || '', categoria || '', stock ?? 0]
  );
  const row = primero('SELECT MAX(id) AS id FROM productos');
  res.status(201).json({
    id: row.id, p: nombre, b: codigo_barras || '', v: precio_cop, m: marca || '', c: categoria || '', s: stock ?? 0
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existe = primero('SELECT id FROM productos WHERE id = ?', [id]);
  if (!existe) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const campos = [];
  const valores = [];
  const { nombre, codigo_barras, precio_cop, marca, categoria, stock } = req.body;

  if (nombre !== undefined) { campos.push('nombre = ?'); valores.push(nombre); }
  if (codigo_barras !== undefined) { campos.push('codigo_barras = ?'); valores.push(codigo_barras); }
  if (precio_cop !== undefined) { campos.push('precio_cop = ?'); valores.push(precio_cop); }
  if (marca !== undefined) { campos.push('marca = ?'); valores.push(marca); }
  if (categoria !== undefined) { campos.push('categoria = ?'); valores.push(categoria); }
  if (stock !== undefined) { campos.push('stock = ?'); valores.push(stock); }

  if (campos.length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }

  valores.push(id);
  ejecutar(`UPDATE productos SET ${campos.join(', ')} WHERE id = ?`, valores);

  const updated = primero(
    'SELECT id, nombre, codigo_barras, precio_cop, marca, categoria, stock FROM productos WHERE id = ?', [id]
  );
  res.json({
    id: updated.id, p: updated.nombre, b: updated.codigo_barras || '', v: updated.precio_cop,
    m: updated.marca || '', c: updated.categoria || '', s: updated.stock || 0
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  ejecutar('DELETE FROM productos WHERE id = ?', [id]);
  res.json({ ok: true });
});

router.get('/exportar', (req, res) => {
  const rows = consultar(
    'SELECT id, nombre, codigo_barras, precio_cop, marca, categoria, stock FROM productos ORDER BY nombre'
  );
  res.json(rows.map(r => ({
    id: r.id, p: r.nombre, b: r.codigo_barras || '', v: r.precio_cop,
    m: r.marca || '', c: r.categoria || '', s: r.stock || 0
  })));
});

router.post('/importar', (req, res) => {
  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'Se espera un array' });
  }
  ejecutar('DELETE FROM productos');
  for (const item of data) {
    ejecutar(
      'INSERT INTO productos (nombre, codigo_barras, precio_cop, marca, categoria, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [
        item.p || item.nombre || '',
        item.b || item.codigo_barras || '',
        item.v || item.precio_cop || 0,
        item.m || item.marca || '',
        item.c || item.categoria || '',
        item.s || item.stock || 0
      ]
    );
  }
  res.json({ ok: true, cantidad: data.length });
});

module.exports = router;
