// ============================================================
// Test dell'autenticazione (registrazione e login)
// ============================================================

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

// Chiude la connessione al database quando i test finiscono
afterAll(async () => {
  await pool.end();
});

describe('Autenticazione', () => {
  // Email casuale per non andare in conflitto con dati esistenti
  const emailTest = `mario.test.${Date.now()}@example.com`;

  test('registrazione di un nuovo proprietario riuscita', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: emailTest,
        password: 'password123',
        full_name: 'Mario Test',
        role: 'owner',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');       // deve restituire un token
    expect(res.body.user.email).toBe(emailTest);
    expect(res.body.user).not.toHaveProperty('password_hash'); // la password non torna mai
  });

  test('registrazione con email gia esistente viene rifiutata', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: emailTest,           // stessa email di prima
        password: 'password123',
        full_name: 'Mario Doppio',
        role: 'owner',
      });

    expect(res.statusCode).toBeGreaterThanOrEqual(400); // errore, non si registra due volte
  });

  test('login con credenziali corrette riuscito', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: emailTest, password: 'password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('login con password sbagliata viene rifiutato', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: emailTest, password: 'password_sbagliata' });

    expect(res.statusCode).toBe(401);   // non autorizzato
  });

  test('accesso a rotta protetta senza token viene rifiutato', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});
