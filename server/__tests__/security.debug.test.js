const request = require('supertest');
const { app, inicializar } = require('../app');
const { generarToken } = require('../middleware/auth');

describe('SEC-005 — /debug gated by environment', () => {
  let authHeader;
  const originalEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    await inicializar();
    authHeader = 'Bearer ' + generarToken({ id: 1, username: 'admin', rol: 'admin' });
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('returns 404 for /debug when NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(app)
      .get('/api/facturas/debug')
      .set('Authorization', authHeader);
    expect(res.status).toBe(404);
  });

  it('exposes /debug when NOT production', async () => {
    process.env.NODE_ENV = 'development';
    const res = await request(app)
      .get('/api/facturas/debug')
      .set('Authorization', authHeader);
    expect(res.status).toBe(200);
  });
});
