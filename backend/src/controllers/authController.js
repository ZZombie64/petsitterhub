const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const SALT_ROUNDS = 10;

/**
 * Crea un token JWT contenente id, email e ruolo dell'utente.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Rimuove il campo password_hash prima di rimandare l'utente al client.
 */
function toPublicUser(user) {
  const { password_hash, ...publicUser } = user;
  return publicUser;
}

/**
 * POST /api/auth/register
 * Crea un nuovo utente (proprietario o sitter) e restituisce un token.
 */
async function register(req, res) {
  const { email, password, full_name, role, city, phone } = req.body;

  try {
    // Verifica che l'email non sia già registrata
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Esiste già un account con questa email.',
      });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, city, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role, city, phone, created_at`,
      [
        email.toLowerCase(),
        password_hash,
        full_name,
        role || 'owner',
        city || null,
        phone || null,
      ]
    );

    const newUser = result.rows[0];
    const token = generateToken(newUser);

    return res.status(201).json({
      user: newUser,
      token,
    });
  } catch (err) {
    console.error('Errore durante la registrazione:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * POST /api/auth/login
 * Verifica le credenziali e restituisce un token se corrette.
 */
async function login(req, res) {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    // Messaggio volutamente generico: non riveliamo se è l'email
    // o la password ad essere sbagliata (per sicurezza).
    if (!user) {
      return res.status(401).json({ error: 'Email o password non corretti.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Email o password non corretti.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      user: toPublicUser(user),
      token,
    });
  } catch (err) {
    console.error('Errore durante il login:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * GET /api/auth/me
 * Restituisce i dati dell'utente autenticato (richiede il middleware authenticate).
 */
async function me(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, role, city, phone, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato.' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('Errore nel recupero utente:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

module.exports = { register, login, me };
