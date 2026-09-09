// Configurazione eseguita prima di tutti i test.
// Fa puntare i test al database LOCALE di sviluppo (quello di Docker)
// e usa chiavi finte: i test non toccano i servizi esterni reali.

process.env.DATABASE_URL = 'postgresql://petsitter:petsitter@localhost:5432/petsitterhub';
process.env.JWT_SECRET = 'test-secret-per-i-test';
process.env.JWT_EXPIRES_IN = '7d';
process.env.STRIPE_SECRET_KEY = 'sk_test_finta';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
