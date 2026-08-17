# PetSitterHub

Piattaforma per la prenotazione di pet-sitter e dog-walker: mette in contatto
proprietari di animali con professionisti verificati nella loro zona.

Progetto realizzato da un team di 4 persone.

## Funzionalità principali

- Catalogo sitter con filtri (città/zona, tipo di animale, tipo di servizio, disponibilità)
- Registrazione e autenticazione per proprietari e sitter
- Prenotazione con calendario, messaggistica e pagamento (conferma solo a servizio accettato)
- Dashboard sitter (disponibilità, richieste, recensioni, guadagni)
- Deploy su cloud

## Stack tecnico

| Componente | Tecnologia |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Deploy | Render / Railway |
| Container | Docker |
| Pagamenti | Stripe (modalità test) |

## Struttura del progetto

```
petsitterhub/
├── frontend/     # Interfaccia utente (React)
├── backend/      # API REST (Node + Express)
├── database/     # Schema ER, script SQL
├── devops/       # Dockerfile, CI/CD
└── README.md
```

## Team e ruoli

| Persona | Ruolo |
|---|---|
| — | Frontend |
| — | Backend |
| — | Database (+ Backend) |
| — | DevOps (+ Frontend) |

## Come lavorare sul repository

Non si lavora mai direttamente su `main`. Ogni modifica passa da un branch e una Pull Request.

```bash
# 1. Allineati all'ultima versione
git checkout main
git pull

# 2. Crea un branch per ciò su cui lavori
git checkout -b feature/nome-della-cosa

# 3. Lavora, poi salva
git add .
git commit -m "Descrizione breve della modifica"
git push -u origin feature/nome-della-cosa

# 4. Apri una Pull Request su GitHub e fai revisionare prima del merge
```

## Avvio in locale

Istruzioni dettagliate nei README delle singole cartelle. In sintesi:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Documentazione

- Schema ER: `database/`
- Specifiche API (Swagger/OpenAPI): `backend/`
- Istruzioni di deploy: `devops/`
