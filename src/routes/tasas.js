const { Router } = require('express');
const { consultar, ejecutar } = require('../database/connection');

const router = Router();

function obtenerConfig() {
  const rows = consultar('SELECT clave, valor FROM configuracion');
  const cfg = {};
  for (const r of rows) cfg[r.clave] = parseFloat(r.valor);
  return cfg;
}

router.get('/', (req, res) => {
  const cfg = obtenerConfig();
  res.json({ usd: cfg.tasa_usd || 3500, ves: cfg.tasa_ves || 4.7 });
});

router.put('/', (req, res) => {
  const { usd, ves } = req.body;
  if (usd == null || ves == null) {
    return res.status(400).json({ error: 'Faltan usd y ves' });
  }
  ejecutar("UPDATE configuracion SET valor = ? WHERE clave = 'tasa_usd'", [String(usd)]);
  ejecutar("UPDATE configuracion SET valor = ? WHERE clave = 'tasa_ves'", [String(ves)]);
  res.json({ usd, ves });
});

module.exports = router;
