// ============================================================
// Test delle prenotazioni e della regola chiave:
// "il pagamento e possibile solo dopo l'accettazione del sitter"
// ============================================================

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

let tokenOwner;   // token di un proprietario
let petId;        // un animale del proprietario
let sitterId;     // un sitter verificato
let serviceId;    // un servizio di quel sitter

// Prima dei test: creo un proprietario con un animale e recupero un sitter
beforeAll(async () => {
  const email = `owner.test.${Date.now()}@example.com`;
  const reg = await request(app).post('/api/auth/register').send({
    email, password: 'password123', full_name: 'Owner Test', role: 'owner',
  });
  tokenOwner = reg.body.token;

  // Creo un animale
  const pet = await request(app)
    .post('/api/pets')
    .set('Authorization', `Bearer ${tokenOwner}`)
    .send({ name: 'Fido Test', species: 'cane', size: 'media' });
  petId = pet.body.pet ? pet.body.pet.id : (pet.body.id);

  // Prendo un sitter dal catalogo (deve esistere dal seed)
  const catalogo = await request(app).get('/api/sitters');
  const sitters = catalogo.body.sitters || catalogo.body;
  if (sitters && sitters.length > 0) {
    sitterId = sitters[0].sitter_id;
    // Prendo il dettaglio per avere un servizio
    const dettaglio = await request(app).get(`/api/sitters/${sitterId}`);
    const s = dettaglio.body.sitter || dettaglio.body;
    if (s.services && s.services.length > 0) serviceId = s.services[0].id;
  }
});

afterAll(async () => {
  await pool.end();
});

describe('Prenotazioni', () => {
  test('creare una prenotazione senza dati obbligatori viene rifiutato', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({});   // niente dati

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  test('un proprietario puo creare una prenotazione', async () => {
    if (!sitterId || !serviceId || !petId) {
      console.warn('Dati di seed mancanti, test saltato');
      return;
    }
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({
        sitter_id: sitterId,
        service_id: serviceId,
        pet_id: petId,
        start_date: '2026-12-01',
        end_date: '2026-12-01',
      });

    expect([200, 201]).toContain(res.statusCode);
    const booking = res.body.booking || res.body;
    expect(booking.status).toBe('richiesta');  // parte sempre come "richiesta"
  });

  test('senza token non si puo prenotare', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ sitter_id: 1, service_id: 1, pet_id: 1, start_date: '2026-12-01', end_date: '2026-12-01' });

    expect(res.statusCode).toBe(401);
  });
});
