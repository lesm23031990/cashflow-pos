const request = require('supertest');
const { crearDbTemp, limpiarDbTemp, iniciarApp } = require('./setup');

let app;
let tempDir;

beforeAll(async () => {
  tempDir = crearDbTemp();
  app = await iniciarApp();
});

afterAll(() => {
  limpiarDbTemp(tempDir);
});

describe('Auth API', () => {

  describe('POST /api/auth/login', () => {

    it('debe autenticar con credenciales correctas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.usuario).toEqual({
        username: 'admin',
        rol: 'admin'
      });
    });

    it('debe rechazar credenciales incorrectas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('debe rechazar si falta usuario o contraseña', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('requeridos');
    });

  });

  describe('GET /api/auth/verificar', () => {

    it('debe verificar un token válido', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });

      const token = loginRes.body.token;

      const res = await request(app)
        .get('/api/auth/verificar')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.valido).toBe(true);
    });

    it('debe rechazar sin token', async () => {
      const res = await request(app)
        .get('/api/auth/verificar');

      expect(res.status).toBe(401);
    });

  });

});
