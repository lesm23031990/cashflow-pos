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

describe('Productos API', () => {

  describe('GET /api/productos', () => {

    it('debe retornar lista de productos', async () => {
      const res = await request(app)
        .get('/api/productos')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('p');
      expect(res.body[0]).toHaveProperty('v');
    });

    it('debe rechazar sin autenticación', async () => {
      const res = await request(app).get('/api/productos');
      expect(res.status).toBe(401);
    });

  });

  describe('POST /api/productos', () => {

    it('debe crear un producto nuevo', async () => {
      const nuevo = { nombre: 'Test Producto', precio_cop: 10000, marca: 'Test', categoria: 'Test' };

      const res = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${token}`)
        .send(nuevo);

      expect(res.status).toBe(201);
      expect(res.body.p).toBe('Test Producto');
      expect(res.body.v).toBe(10000);
      expect(res.body.id).toBeDefined();
    });

    it('debe rechazar si falta el nombre', async () => {
      const res = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${token}`)
        .send({ precio_cop: 5000 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('nombre');
    });

  });

  describe('PUT /api/productos/:id', () => {

    it('debe actualizar un producto existente', async () => {
      const res = await request(app)
        .put('/api/productos/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ precio_cop: 9999 });

      expect(res.status).toBe(200);
      expect(res.body.v).toBe(9999);
    });

    it('debe retornar 404 si el producto no existe', async () => {
      const res = await request(app)
        .put('/api/productos/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({ precio_cop: 5000 });

      expect(res.status).toBe(404);
    });

  });

  describe('DELETE /api/productos/:id', () => {

    it('debe eliminar un producto', async () => {
      const res = await request(app)
        .delete('/api/productos/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

  });

});
