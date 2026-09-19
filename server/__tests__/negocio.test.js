const request = require('supertest');
const { app, inicializar } = require('../app');
const { generarToken } = require('../middleware/auth');
const { ejecutar, consultar } = require('../database/connection');

/**
 * Business logic tests for the money paths: invoice totals and cash closure.
 * These protect the most sensitive flows (facturas.js + cierres_caja.js)
 * against arithmetic regressions.
 */
describe('Facturas — business logic (dinero)', () => {
  let auth;
  let productoA;
  let productoB;

  beforeAll(async () => {
    await inicializar();

    // Deterministic rate so total_usd/total_ves are predictable
    ejecutar('DELETE FROM tasas');
    ejecutar('INSERT INTO tasas (id, usd, ves) VALUES (1, 4000, 5)');

    // Clean slate for the entities we assert on
    ejecutar('DELETE FROM factura_detalles');
    ejecutar('DELETE FROM facturas');
    ejecutar('DELETE FROM clientes');
    ejecutar('DELETE FROM productos');

    ejecutar('INSERT INTO clientes (id, nombre, documento, telefono, direccion) VALUES (1, ? , ?, ?, ?)', ['Test', 'DNI1', '123', 'dir']);
    ejecutar('INSERT INTO productos (id, nombre, codigo_barras, precio_cop, marca, categoria) VALUES (1, ?, ?, ?, ?, ?)', ['A', '', 4000, 'M', 'C']);
    ejecutar('INSERT INTO productos (id, nombre, codigo_barras, precio_cop, marca, categoria) VALUES (2, ?, ?, ?, ?, ?)', ['B', '', 5000, 'M', 'C']);

    auth = 'Bearer ' + generarToken({ id: 1, username: 'admin', rol: 'admin' });
    productoA = { producto_id: 1, cantidad: 2, precio_unitario: 4000 }; // 8000
    productoB = { producto_id: 2, cantidad: 1, precio_unitario: 5000 }; // 5000
  });

  it('computes subtotal and total (subtotal - descuento) server-side', async () => {
    const res = await request(app)
      .post('/api/facturas')
      .set('Authorization', auth)
      .send({
        cliente_id: 1,
        moneda: 'COP',
        descuento: 3000,
        metodo_pago: 'Efectivo',
        detalles: [productoA, productoB],
      });

    expect(res.status).toBe(201);
    expect(res.body.subtotal).toBe(13000);
    expect(res.body.total).toBe(10000); // 13000 - 3000
    expect(res.body.status).toBe('en espera');
  });

  it('derives currency conversions from the current tasas', async () => {
    const res = await request(app)
      .post('/api/facturas')
      .set('Authorization', auth)
      .send({
        cliente_id: 1,
        moneda: 'COP',
        descuento: 0,
        metodo_pago: 'Efectivo',
        detalles: [productoA, productoB],
      });

    // total 13000 / usd 4000 = 3.25 ; / ves 5 = 2600
    expect(res.body.total).toBe(13000);
    expect(res.body.total_usd).toBeCloseTo(3.25, 5);
    expect(res.body.total_ves).toBeCloseTo(2600, 5);
  });

  it('rejects an invoice with no line items', async () => {
    const res = await request(app)
      .post('/api/facturas')
      .set('Authorization', auth)
      .send({ cliente_id: 1, moneda: 'COP', descuento: 0, detalles: [] });
    expect(res.status).toBe(400);
  });

  it('rejects an invoice with an invalid line (quantity <= 0)', async () => {
    const res = await request(app)
      .post('/api/facturas')
      .set('Authorization', auth)
      .send({
        cliente_id: 1,
        moneda: 'COP',
        detalles: [{ producto_id: 1, cantidad: 0, precio_unitario: 4000 }],
      });
    expect(res.status).toBe(400);
  });
});

describe('Cierres de caja — business logic (dinero)', () => {
  let auth;

  beforeAll(async () => {
    await inicializar();
    auth = 'Bearer ' + generarToken({ id: 1, username: 'admin', rol: 'admin' });

    // Reset and create 3 known invoices in the current turn (cierre_id NULL)
    ejecutar('DELETE FROM factura_detalles');
    ejecutar('DELETE FROM facturas');
    ejecutar('DELETE FROM cierres_caja');
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const rows = [
      [1, 'Efectivo', 10000],
      [1, 'Efectivo', 5000],
      [1, 'Pago Móvil', 7000],
    ];
    for (const [cliente_id, mp, total] of rows) {
      ejecutar(
        'INSERT INTO facturas (cliente_id, fecha, moneda, tasa_usd, tasa_ves, subtotal, descuento, total, status, metodo_pago, cierre_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)',
        [cliente_id, now, 'COP', 4000, 5, total, 0, total, 'pagada', mp]
      );
    }
  });

  it('summarizes the current turn totals and per-method breakdown', async () => {
    const res = await request(app)
      .get('/api/cierres-caja/resumen')
      .set('Authorization', auth);
    expect(res.status).toBe(200);
    expect(res.body.resumen.cantidad_facturas).toBe(3);
    expect(res.body.resumen.total_ventas).toBe(22000); // 10000+5000+7000
    expect(res.body.resumen.resumen_metodos_pago['Efectivo']).toEqual({ cantidad: 2, total: 15000 });
    expect(res.body.resumen.resumen_metodos_pago['Pago Móvil']).toEqual({ cantidad: 1, total: 7000 });
  });

  it('closes the turn and detaches invoices from the current turn', async () => {
    const res = await request(app)
      .post('/api/cierres-caja')
      .set('Authorization', auth);
    expect(res.status).toBe(201);
    expect(res.body.total_ventas).toBe(22000);
    expect(res.body.cantidad_facturas).toBe(3);

    // After closing, the current-turn summary must be empty
    const still = await request(app)
      .get('/api/cierres-caja/resumen')
      .set('Authorization', auth);
    expect(still.body.resumen.cantidad_facturas).toBe(0);
    const unclosed = consultar('SELECT COUNT(*) AS n FROM facturas WHERE cierre_id IS NULL')[0];
    expect(unclosed.n).toBe(0);
  });
});
