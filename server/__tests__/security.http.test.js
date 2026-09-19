const request = require('supertest');
const { app, inicializar } = require('../app');

describe('SEC-003/004 — HTTP hardening', () => {
  beforeAll(async () => {
    await inicializar();
  });

  it('does NOT expose project source files (SEC-003)', async () => {
    for (const p of ['/package.json', '/server.js', '/server/app.js']) {
      const res = await request(app).get(p);
      expect(res.status).not.toBe(200);
    }
  });

  it('still serves the admin SPA (SEC-003 regression)', async () => {
    const res = await request(app).get('/admin/');
    expect(res.status).toBe(200);
  });

  it('sets security headers via helmet (SEC-004)', async () => {
    const res = await request(app).get('/admin/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('rejects a bad login with 401 (SEC-002 e2e)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'definitely-wrong' });
    expect(res.status).toBe(401);
  });

  it('throttles repeated login attempts with 429 (SEC-004)', async () => {
    let last;
    for (let i = 0; i < 11; i++) {
      last = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'nope' });
    }
    expect(last.status).toBe(429);
  });
});
