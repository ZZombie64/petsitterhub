# PetSitterHub — Backend

API REST in Node.js + Express, con autenticazione JWT.

## Avvio in locale

Assicurati che il database sia già avviato (`docker compose up -d` dalla cartella principale).

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Il server parte su **http://localhost:3000**.
Verifica che sia attivo con: `GET http://localhost:3000/api/health` → `{ "status": "ok" }`

## Endpoint di autenticazione

### `POST /api/auth/register`
Crea un nuovo utente (proprietario o sitter).

Body JSON:
```json
{
  "email": "mario.rossi@example.com",
  "password": "unapasswordsicura",
  "full_name": "Mario Rossi",
  "role": "owner",
  "city": "Como",
  "phone": "3331234567"
}
```
- `role` è opzionale, default `owner`. Valori ammessi: `owner`, `sitter`.
- `city` e `phone` sono opzionali.
- Risposta `201`: `{ "user": {...}, "token": "..." }`
- Risposta `409` se l'email è già registrata.

### `POST /api/auth/login`
Verifica le credenziali e restituisce un token.

Body JSON:
```json
{
  "email": "mario.rossi@example.com",
  "password": "unapasswordsicura"
}
```
- Risposta `200`: `{ "user": {...}, "token": "..." }`
- Risposta `401` se email o password non sono corrette.

### `GET /api/auth/me`
Restituisce i dati dell'utente autenticato. Richiede il token ottenuto da login/register.

Header richiesto:
```
Authorization: Bearer <token>
```
- Risposta `200`: `{ "user": {...} }`
- Risposta `401` se il token manca o non è valido.

## Come proteggere altre rotte in futuro

```js
const { authenticate, requireRole } = require('../middleware/authenticate');

// Richiede solo di essere loggati
router.get('/qualcosa', authenticate, handler);

// Richiede di essere loggati E avere un ruolo specifico
router.get('/solo-admin', authenticate, requireRole('admin'), handler);
```

## Struttura

```
backend/
├── src/
│   ├── controllers/    # Logica delle rotte (query al DB, risposte)
│   ├── middleware/     # Autenticazione JWT, validazione input
│   ├── routes/         # Definizione degli endpoint
│   ├── db/             # Connessione a PostgreSQL
│   ├── app.js          # Configurazione Express (middleware, rotte)
│   └── server.js       # Avvio del server
├── .env.example
└── package.json
```
