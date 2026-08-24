-- ============================================================
-- PetSitterHub - Schema del database (PostgreSQL)
-- Versione 2 - allineata alla consegna
-- ============================================================

DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS sitter_profiles CASCADE;
DROP TABLE IF EXISTS pets CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- ------------------------------------------------------------
-- UTENTI (proprietari, sitter e amministratori)
-- ------------------------------------------------------------
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'owner'
                  CHECK (role IN ('owner', 'sitter', 'admin')),
    city          VARCHAR(100),
    phone         VARCHAR(30),
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- ANIMALI dei proprietari
-- ------------------------------------------------------------
CREATE TABLE pets (
    id        SERIAL PRIMARY KEY,
    owner_id  INTEGER NOT NULL
              REFERENCES users(id) ON DELETE CASCADE,
    name      VARCHAR(100) NOT NULL,
    species   VARCHAR(50)  NOT NULL,      -- cane, gatto, ecc.
    size      VARCHAR(20),                -- piccola, media, grande
    notes     TEXT
);


-- ------------------------------------------------------------
-- PROFILI SITTER
-- ------------------------------------------------------------
CREATE TABLE sitter_profiles (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL UNIQUE
                        REFERENCES users(id) ON DELETE CASCADE,
    bio                 TEXT,
    accepted_pets       VARCHAR(255),      -- es. "cani, gatti"
    verification_status VARCHAR(20) NOT NULL DEFAULT 'in_attesa'
                        CHECK (verification_status IN ('in_attesa', 'approvato', 'rifiutato')),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- SERVIZI offerti da ogni sitter
-- ------------------------------------------------------------
CREATE TABLE services (
    id         SERIAL PRIMARY KEY,
    sitter_id  INTEGER NOT NULL
               REFERENCES sitter_profiles(id) ON DELETE CASCADE,
    type       VARCHAR(50) NOT NULL,       -- passeggiata, pensione, ecc.
    price      DECIMAL(10,2) NOT NULL,
    unit       VARCHAR(20) NOT NULL DEFAULT 'ora'
);


-- ------------------------------------------------------------
-- DISPONIBILITA' (calendario dei sitter)
-- ------------------------------------------------------------
CREATE TABLE availability (
    id         SERIAL PRIMARY KEY,
    sitter_id  INTEGER NOT NULL
               REFERENCES sitter_profiles(id) ON DELETE CASCADE,
    day        DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time   TIME NOT NULL,
    is_booked  BOOLEAN NOT NULL DEFAULT FALSE
);


-- ------------------------------------------------------------
-- PRENOTAZIONI
-- ------------------------------------------------------------
CREATE TABLE bookings (
    id          SERIAL PRIMARY KEY,
    owner_id    INTEGER NOT NULL
                REFERENCES users(id) ON DELETE CASCADE,
    sitter_id   INTEGER NOT NULL
                REFERENCES sitter_profiles(id) ON DELETE CASCADE,
    service_id  INTEGER NOT NULL
                REFERENCES services(id) ON DELETE RESTRICT,
    pet_id      INTEGER NOT NULL
                REFERENCES pets(id) ON DELETE RESTRICT,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'richiesta'
                CHECK (status IN ('richiesta', 'accettata', 'confermata', 'completata', 'annullata')),
    total_price DECIMAL(10,2),
    accepted_at TIMESTAMP,                 -- quando il sitter accetta (via libera al pagamento)
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- PAGAMENTI (uno per prenotazione)
-- ------------------------------------------------------------
CREATE TABLE payments (
    id           SERIAL PRIMARY KEY,
    booking_id   INTEGER NOT NULL UNIQUE
                 REFERENCES bookings(id) ON DELETE CASCADE,
    amount       DECIMAL(10,2) NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'in_attesa'
                 CHECK (status IN ('in_attesa', 'pagato', 'rimborsato', 'fallito')),
    provider_ref VARCHAR(255),             -- riferimento Stripe (modalita' test)
    paid_at      TIMESTAMP
);


-- ------------------------------------------------------------
-- MESSAGGI (chat tra proprietario e sitter, legata a una prenotazione)
-- ------------------------------------------------------------
CREATE TABLE messages (
    id         SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL
               REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id  INTEGER NOT NULL
               REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at    TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- RECENSIONI (una per prenotazione completata)
-- ------------------------------------------------------------
CREATE TABLE reviews (
    id         SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL UNIQUE
               REFERENCES bookings(id) ON DELETE CASCADE,
    owner_id   INTEGER NOT NULL
               REFERENCES users(id) ON DELETE CASCADE,
    sitter_id  INTEGER NOT NULL
               REFERENCES sitter_profiles(id) ON DELETE CASCADE,
    rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- NOTIFICHE automatiche per gli utenti
-- ------------------------------------------------------------
CREATE TABLE notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL
               REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(50) NOT NULL,       -- nuova_richiesta, accettata, nuovo_messaggio, ecc.
    content    TEXT NOT NULL,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- DISPUTE (gestite dagli amministratori)
-- ------------------------------------------------------------
CREATE TABLE disputes (
    id         SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL
               REFERENCES bookings(id) ON DELETE CASCADE,
    opened_by  INTEGER NOT NULL
               REFERENCES users(id) ON DELETE CASCADE,
    reason     TEXT NOT NULL,
    status     VARCHAR(20) NOT NULL DEFAULT 'aperta'
               CHECK (status IN ('aperta', 'in_esame', 'risolta', 'respinta')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- INDICI per velocizzare le ricerche piu' frequenti
-- ------------------------------------------------------------
CREATE INDEX idx_users_city         ON users(city);
CREATE INDEX idx_users_role         ON users(role);
CREATE INDEX idx_pets_owner         ON pets(owner_id);
CREATE INDEX idx_services_sitter    ON services(sitter_id);
CREATE INDEX idx_services_type      ON services(type);
CREATE INDEX idx_availability_day   ON availability(sitter_id, day);
CREATE INDEX idx_bookings_owner     ON bookings(owner_id);
CREATE INDEX idx_bookings_sitter    ON bookings(sitter_id);
CREATE INDEX idx_bookings_status    ON bookings(status);
CREATE INDEX idx_messages_booking   ON messages(booking_id);
CREATE INDEX idx_reviews_sitter     ON reviews(sitter_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_disputes_booking   ON disputes(booking_id);
