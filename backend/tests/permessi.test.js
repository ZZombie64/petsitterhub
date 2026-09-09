// ============================================================
// Test dei permessi per ruolo (owner / sitter / admin)
// Verifica che ogni ruolo possa accedere solo a cio che gli spetta.
// ============================================================

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

let tokenOwner;

beforeAll(async () => {
  const email = `ruolo.test.${Date.now()}@example.com`;
  const reg = await request(app).post('/api/auth/register').send({
    email, password: 'password123', full_name: 'Ruolo Test', role: 'owner',
  });
  tokenOwner = reg.body.token;
});

afterAll(async () => {
  await pool.end();
});

describe('Permessi per ruolo', () => {
  test('un proprietario NON puo accedere alle richieste da sitter', async () => {
    const res = await request(app)
      .get('/api/bookings/ricevute')
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(res.statusCode).toBe(403);  // vietato: e una rotta da sitter
  });

  test('un proprietario NON puo accedere all area admin', async () => {
    const res = await request(app)
      .get('/api/admin/sitters')
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(res.statusCode).toBe(403);  // vietato: e una rotta da admin
  });

  test('il catalogo sitter e pubblico (accessibile senza login)', async () => {
    const res = await request(app).get('/api/sitters');
    expect(res.statusCode).toBe(200);
  });
});
