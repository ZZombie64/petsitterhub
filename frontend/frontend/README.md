# PetSitterHub — Frontend

Interfaccia React (Vite) con login e registrazione, collegata al backend.

## Avvio in locale

Assicurati che il **backend** sia già avviato su `http://localhost:3000`.

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Apri **http://localhost:5173** nel browser.

## Cosa c'è

- **`/registrati`** — form di registrazione (scelta tra proprietario e sitter)
- **`/accedi`** — form di login
- **`/profilo`** — pagina protetta: se non sei loggato ti rimanda al login; altrimenti mostra i tuoi dati chiamando `GET /api/auth/me`

Il token ricevuto da login/registrazione viene salvato in `localStorage` e riutilizzato automaticamente ad ogni ricaricamento della pagina (finché resta valido).

## Struttura

```
frontend/
├── src/
│   ├── api/auth.js              # Chiamate HTTP verso il backend
│   ├── context/AuthContext.jsx  # Stato globale: utente loggato + token
│   ├── context/ProtectedRoute.jsx
│   ├── pages/LoginPage.jsx
│   ├── pages/RegisterPage.jsx
│   ├── pages/ProfilePage.jsx
│   ├── App.jsx                  # Routing
│   └── main.jsx                 # Entry point
├── .env.example
└── package.json
```
