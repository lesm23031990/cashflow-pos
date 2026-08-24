const { Router } = require('express');
const { consultar, primero, ejecutar } = require('../database/connection');

const router = Router();

function obtenerFechaInicio() {
  const ultimo = primero('SELECT * FROM cierres_caja ORDER BY id DESC LIMIT 1');
  if (ultimo) return ultimo.fecha_fin;

  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 8, 0, 0);
  return inicio.toISOString().slice(0, 19).replace('T', ' ');
}

router.get('/ultimo', (req, res) => {
  const c = primero('SELECT * FROM cierres_caja ORDER BY id DESC LIMIT 1');
  res.json(c || null);
});

router.get('/resumen', (req, res) => {
  const facturas = consultar(
    'SELECT f.*, c.nombre AS cliente_nombre FROM facturas f JOIN clientes c ON c.id = f.cliente_id WHERE f.cierre_id IS NULL ORDER BY f.id DESC'
  );

  let totalVentas = 0;
  let totalDescuentos = 0;
  const resumen = {};

  for (const f of facturas) {
    totalVentas += f.total;
    totalDescuentos += f.descuento;
    const mp = f.metodo_pago || 'Sin Asignar';
    if (!resumen[mp]) resumen[mp] = { cantidad: 0, total: 0 };
    resumen[mp].cantidad++;
    resumen[mp].total += f.total;
  }

  const ultimo = primero('SELECT * FROM cierres_caja ORDER BY id DESC LIMIT 1');

  res.json({
    facturas,
    resumen: {
      total_ventas: totalVentas,
      total_descuentos: totalDescuentos,
      cantidad_facturas: facturas.length,
      resumen_metodos_pago: resumen,
    },
    fecha_inicio: fechaInicio,
    ultimo_cierre: ultimo,
  });
});

router.post('/', (req, res) => {
  const fechaInicio = obtenerFechaInicio();
  const fechaFin = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const facturas = consultar(
    'SELECT f.* FROM facturas f WHERE f.cierre_id IS NULL'
  );

  let totalVentas = 0;
  let totalDescuentos = 0;
  const resumen = {};

  for (const f of facturas) {
    totalVentas += f.total;
    totalDescuentos += f.descuento;
    const mp = f.metodo_pago || 'Sin Asignar';
    if (!resumen[mp]) resumen[mp] = { cantidad: 0, total: 0 };
    resumen[mp].cantidad++;
    resumen[mp].total += f.total;
  }

  ejecutar(
    'INSERT INTO cierres_caja (fecha_inicio, fecha_fin, total_ventas, total_descuentos, cantidad_facturas, resumen_metodos_pago, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [fechaInicio, fechaFin, totalVentas, totalDescuentos, facturas.length, JSON.stringify(resumen), fechaFin]
  );

  const cierre = primero('SELECT MAX(id) AS id FROM cierres_caja');

  for (const f of facturas) {
    ejecutar('UPDATE facturas SET cierre_id = ? WHERE id = ?', [cierre.id, f.id]);
  }

  const creado = primero('SELECT * FROM cierres_caja WHERE id = ?', [cierre.id]);
  res.status(201).json(creado);
});

module.exports = router;
