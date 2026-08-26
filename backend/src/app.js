const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const sitterRoutes = require('./routes/sitterRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Rotta di controllo rapido per verificare che il server risponda
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/sitters', sitterRoutes);

// Gestione centralizzata delle rotte non trovate
app.use((req, res) => {
  res.status(404).json({ error: 'Rotta non trovata.' });
});

module.exports = app;
