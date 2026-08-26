const jwt = require('jsonwebtoken');

/**
 * Middleware che verifica il token JWT nell'header Authorization.
 * Formato atteso: "Authorization: Bearer <token>"
 *
 * Se il token è valido, aggiunge req.user = { id, email, role }
 * e passa alla rotta successiva. Altrimenti risponde con 401.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token di autenticazione mancante.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token non valido o scaduto.' });
  }
}

/**
 * Middleware opzionale per limitare l'accesso a certi ruoli.
 * Uso: authenticate + requireRole('admin')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Non hai i permessi per questa azione.' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
