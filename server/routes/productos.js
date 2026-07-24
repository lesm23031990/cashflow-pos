const { Router } = require('express');
const { consultar, primero, ejecutar } = require('../database/connection');

const router = Router();

router.get('/', (req, res) => {
  const rows = consultar(
    'SELECT id, nombre, codigo_barras, precio_cop, marca, categoria, stock, estado FROM productos ORDER BY nombre'
  );
  res.json(rows.map(r => ({
    id: r.id,
    p: r.nombre,
    b: r.codigo_barras || '',
    v: r.precio_cop,
    m: r.marca || '',
    c: r.categoria || '',
    s: r.stock || 0,
    st: r.estado || 'disponible'
  })));
});

router.get('/codigo/:codigo', (req, res) => {
  const row = primero(
    'SELECT id, nombre, codigo_barras, precio_cop, marca, categoria, stock, estado FROM productos WHERE codigo_barras = ?',
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
    s: row.stock || 0,
    st: row.estado || 'disponible'
  });
});

router.post('/', (req, res) => {
  const { nombre, codigo_barras, precio_cop, marca, categoria, stock, estado } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'Falta el campo: nombre' });
  }
  ejecutar(
    'INSERT INTO productos (nombre, codigo_barras, precio_cop, marca, categoria, stock, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nombre, codigo_barras || '', precio_cop ?? 0, marca || '', categoria || '', stock ?? 0, estado || 'disponible']
  );
  const row = primero('SELECT MAX(id) AS id FROM productos');
  res.status(201).json({
    id: row.id, p: nombre, b: codigo_barras || '', v: precio_cop ?? 0, m: marca || '', c: categoria || '', s: stock ?? 0, st: estado || 'disponible'
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
  const { nombre, codigo_barras, precio_cop, marca, categoria, stock, estado } = req.body;

  if (nombre !== undefined) { campos.push('nombre = ?'); valores.push(nombre); }
  if (codigo_barras !== undefined) { campos.push('codigo_barras = ?'); valores.push(codigo_barras); }
  if (precio_cop !== undefined) { campos.push('precio_cop = ?'); valores.push(precio_cop); }
  if (marca !== undefined) { campos.push('marca = ?'); valores.push(marca); }
  if (categoria !== undefined) { campos.push('categoria = ?'); valores.push(categoria); }
  if (stock !== undefined) { campos.push('stock = ?'); valores.push(stock); }
  if (estado !== undefined) { campos.push('estado = ?'); valores.push(estado); }

  if (campos.length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }

  valores.push(id);
  ejecutar(`UPDATE productos SET ${campos.join(', ')} WHERE id = ?`, valores);

  const updated = primero(
    'SELECT id, nombre, codigo_barras, precio_cop, marca, categoria, stock, estado FROM productos WHERE id = ?', [id]
  );
  if (!updated) {
    return res.status(500).json({ error: 'Error al recuperar el producto actualizado' });
  }
  res.json({
    id: updated.id, p: updated.nombre, b: updated.codigo_barras || '', v: updated.precio_cop,
    m: updated.marca || '', c: updated.categoria || '', s: updated.stock || 0, st: updated.estado || 'disponible'
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  ejecutar('DELETE FROM productos WHERE id = ?', [id]);
  res.json({ ok: true });
});

router.get('/exportar', (req, res) => {
  const rows = consultar(
    'SELECT id, nombre, codigo_barras, precio_cop, marca, categoria, stock, estado FROM productos ORDER BY nombre'
  );
  res.json(rows.map(r => ({
    id: r.id, p: r.nombre, b: r.codigo_barras || '', v: r.precio_cop,
    m: r.marca || '', c: r.categoria || '', s: r.stock || 0, st: r.estado || 'disponible'
  })));
});

router.post('/actualizar-masivo', (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Se espera un array de productos' });
  }
  const resultados = [];
  for (const item of items) {
    const nombre = item.nombre || item.p || '';
    const marca = item.marca || item.m || '';
    const precio = item.precio_cop ?? item.v ?? 0;
    const codigo = item.codigo_barras || item.b || '';
    const categoria = item.categoria || item.c || '';

    if (!nombre) { resultados.push({ error: 'Nombre requerido' }); continue; }

    if (item.id) {
      const existe = primero('SELECT id FROM productos WHERE id = ?', [item.id]);
      if (existe) {
        ejecutar('UPDATE productos SET nombre = ?, precio_cop = ?, marca = ?, categoria = ?, codigo_barras = ? WHERE id = ?',
          [nombre, precio, marca, categoria, codigo, item.id]);
        resultados.push({ id: item.id, actualizado: true });
      } else {
        resultados.push({ error: `Producto id ${item.id} no encontrado` });
      }
    } else {
      const existente = primero('SELECT id FROM productos WHERE nombre = ? AND marca = ?', [nombre, marca]);
      if (existente) {
        ejecutar('UPDATE productos SET precio_cop = ?, codigo_barras = ?, categoria = ? WHERE id = ?',
          [precio, codigo, categoria, existente.id]);
        resultados.push({ id: existente.id, actualizado: true });
      } else {
        ejecutar('INSERT INTO productos (nombre, codigo_barras, precio_cop, marca, categoria) VALUES (?, ?, ?, ?, ?)',
          [nombre, codigo, precio, marca, categoria]);
        const row = primero('SELECT MAX(id) AS id FROM productos');
        resultados.push({ id: row.id, creado: true });
      }
    }
  }
  res.json({ ok: true, resultados });
});

router.post('/importar', (req, res) => {
  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'Se espera un array' });
  }
  ejecutar('DELETE FROM productos');
  for (const item of data) {
    ejecutar(
      'INSERT INTO productos (nombre, codigo_barras, precio_cop, marca, categoria, stock, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        item.p || item.nombre || '',
        item.b || item.codigo_barras || '',
        item.v || item.precio_cop || 0,
        item.m || item.marca || '',
        item.c || item.categoria || '',
        item.s || item.stock || 0,
        item.st || item.estado || 'disponible'
      ]
    );
  }
  res.json({ ok: true, cantidad: data.length });
});

module.exports = router;
