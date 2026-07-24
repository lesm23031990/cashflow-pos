const { Router } = require('express');
const { consultar, primero, ejecutar } = require('../database/connection');

const router = Router();

router.get('/', (req, res) => {
  const rows = consultar('SELECT * FROM metodos_pago ORDER BY id');
  res.json(rows);
});

router.post('/', (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre obligatorio' });
  ejecutar('INSERT INTO metodos_pago (nombre) VALUES (?)', [nombre]);
  const row = primero('SELECT MAX(id) AS id FROM metodos_pago');
  res.status(201).json({ id: row.id, nombre: nombre });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre obligatorio' });
  const existe = primero('SELECT id FROM metodos_pago WHERE id = ?', [id]);
  if (!existe) return res.status(404).json({ error: 'No encontrado' });
  ejecutar('UPDATE metodos_pago SET nombre = ? WHERE id = ?', [nombre, id]);
  res.json({ id: parseInt(id), nombre });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  ejecutar('DELETE FROM metodos_pago WHERE id = ?', [id]);
  res.json({ ok: true });
});

module.exports = router;
