const { Router } = require('express');
const { consultar, primero, ejecutar } = require('../database/connection');

const router = Router();

router.get('/', (req, res) => {
  const rows = consultar('SELECT * FROM clientes ORDER BY nombre');
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = primero('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { nombre, documento, telefono, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  ejecutar(
    'INSERT INTO clientes (nombre, documento, telefono, direccion) VALUES (?, ?, ?, ?)',
    [nombre, documento || '', telefono || '', direccion || '']
  );
  const row = primero('SELECT MAX(id) AS id FROM clientes');
  res.status(201).json({ id: row.id, nombre, documento: documento || '', telefono: telefono || '', direccion: direccion || '' });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existe = primero('SELECT id FROM clientes WHERE id = ?', [id]);
  if (!existe) return res.status(404).json({ error: 'Cliente no encontrado' });

  const campos = [];
  const valores = [];
  const { nombre, documento, telefono, direccion } = req.body;
  if (nombre !== undefined) { campos.push('nombre = ?'); valores.push(nombre); }
  if (documento !== undefined) { campos.push('documento = ?'); valores.push(documento); }
  if (telefono !== undefined) { campos.push('telefono = ?'); valores.push(telefono); }
  if (direccion !== undefined) { campos.push('direccion = ?'); valores.push(direccion); }
  if (campos.length === 0) return res.status(400).json({ error: 'Sin campos' });
  valores.push(id);
  ejecutar(`UPDATE clientes SET ${campos.join(', ')} WHERE id = ?`, valores);
  res.json(primero('SELECT * FROM clientes WHERE id = ?', [id]));
});

router.delete('/:id', (req, res) => {
  ejecutar('DELETE FROM clientes WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
