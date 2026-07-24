const request = require('supertest');
const { crearDbTemp, limpiarDbTemp, iniciarApp } = require('./setup');

let app;
let tempDir;
let token;

beforeAll(async () => {
  tempDir = crearDbTemp();
  app = await iniciarApp();

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  token = res.body.token;
});

afterAll(() => {
  limpiarDbTemp(tempDir);
});

describe('GET /api/productos/buscar', () => {

  it('debe retornar productos que coincidan con el texto', async () => {
    // La semilla tiene productos con "Coca Cola" en el nombre
    const res = await request(app)
      .get('/api/productos/buscar?q=Coca')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every(p => p.p.includes('Coca'))).toBe(true);
  });

  it('debe buscar por marca', async () => {
    const res = await request(app)
      .get('/api/productos/buscar?q=Nevada')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every(p => p.m === 'Nevada')).toBe(true);
  });

  it('debe retornar array vacío si no hay coincidencias', async () => {
    const res = await request(app)
      .get('/api/productos/buscar?q=ZZZZNOEXISTE')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('debe retornar 400 si falta el query', async () => {
    const res = await request(app)
      .get('/api/productos/buscar')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('debe rechazar sin autenticación', async () => {
    const res = await request(app).get('/api/productos/buscar?q=Coca');
    expect(res.status).toBe(401);
  });

});
