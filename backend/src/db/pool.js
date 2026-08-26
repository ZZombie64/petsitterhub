const { Pool } = require('pg');

// Pool di connessioni riutilizzabili verso PostgreSQL.
// La stringa di connessione arriva dal file .env (vedi .env.example).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Errore inatteso sul pool di PostgreSQL:', err);
});

module.exports = pool;
