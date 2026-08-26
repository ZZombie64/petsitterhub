require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend PetSitterHub in ascolto su http://localhost:${PORT}`);
});
