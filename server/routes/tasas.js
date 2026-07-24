const { Router } = require('express');
const { primero, ejecutar } = require('../database/connection');

const router = Router();

router.get('/', (req, res) => {
  const row = primero('SELECT usd, ves FROM tasas WHERE id = 1');
  res.json({ usd: row.usd, ves: row.ves });
});

router.put('/', (req, res) => {
  const { usd, ves } = req.body;
  if (usd == null || ves == null) {
    return res.status(400).json({ error: 'Faltan usd y ves' });
  }
  ejecutar('UPDATE tasas SET usd = ?, ves = ? WHERE id = 1', [usd, ves]);
  res.json({ usd, ves });
});

module.exports = router;
