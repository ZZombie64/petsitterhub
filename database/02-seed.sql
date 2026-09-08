-- ============================================================
-- PetSitterHub - Dati di prova (seed) - versione DEMO ricca
-- Da eseguire DOPO 01-schema.sql
--
-- LOGIN DI PROVA (password uguale per tutti): password123
--   Proprietari: mario@test.it / laura@test.it
--   Sitter:      giulia@test.it / luca@test.it / sara@test.it
--   Admin:       admin@test.it
-- ============================================================

-- ---- UTENTI ----
-- La password (cifrata) e' la stessa per tutti: password123
INSERT INTO users (email, password_hash, full_name, role, city, phone) VALUES
('mario@test.it',  '$2b$10$r1ELQPDK3LhEfolZakE1heTJoib2i75Aut5VjL6j5INIfHEa2e.jq', 'Mario Rossi',    'owner',  'Milano',  '3331112221'),
('laura@test.it',  '$2b$10$r1ELQPDK3LhEfolZakE1heTJoib2i75Aut5VjL6j5INIfHEa2e.jq', 'Laura Bianchi',  'owner',  'Torino',  '3331112222'),
('giulia@test.it', '$2b$10$r1ELQPDK3LhEfolZakE1heTJoib2i75Aut5VjL6j5INIfHEa2e.jq', 'Giulia Verdi',   'sitter', 'Milano',  '3331112223'),
('luca@test.it',   '$2b$10$r1ELQPDK3LhEfolZakE1heTJoib2i75Aut5VjL6j5INIfHEa2e.jq', 'Luca Neri',      'sitter', 'Milano',  '3331112224'),
('sara@test.it',   '$2b$10$r1ELQPDK3LhEfolZakE1heTJoib2i75Aut5VjL6j5INIfHEa2e.jq', 'Sara Gallo',     'sitter', 'Torino',  '3331112225'),
('admin@test.it',  '$2b$10$r1ELQPDK3LhEfolZakE1heTJoib2i75Aut5VjL6j5INIfHEa2e.jq', 'Amministratore', 'admin',  NULL,      NULL);

-- ---- ANIMALI (dei proprietari) ----
INSERT INTO pets (owner_id, name, species, size, notes) VALUES
(1, 'Fido',  'cane',  'media',   'Socievole, va d''accordo con altri cani.'),
(1, 'Milo',  'gatto', 'piccola', 'Timido con gli estranei.'),
(2, 'Rex',   'cane',  'grande',  'Ha bisogno di lunghe passeggiate.'),
(2, 'Luna',  'gatto', 'piccola', 'Molto affettuosa.');

-- ---- PROFILI SITTER ----
-- Giulia e Sara approvate, Luca in attesa (per testare la verifica admin)
INSERT INTO sitter_profiles (user_id, bio, accepted_pets, verification_status) VALUES
(3, 'Amo gli animali da sempre, esperienza con cani di ogni taglia. Ho un giardino recintato.', 'cani, gatti', 'approvato'),
(4, 'Studente universitario disponibile per passeggiate e visite a domicilio.', 'cani', 'in_attesa'),
(5, 'Toelettatrice professionista, offro anche pensione a domicilio in casa con giardino.', 'cani, gatti', 'approvato');

-- ---- SERVIZI ----
INSERT INTO services (sitter_id, type, price, unit) VALUES
(1, 'passeggiata',  12.00, 'ora'),
(1, 'pet-sitting',  25.00, 'giorno'),
(1, 'pensione',     30.00, 'notte'),
(2, 'passeggiata',  10.00, 'ora'),
(3, 'toelettatura', 20.00, 'servizio'),
(3, 'pensione',     35.00, 'notte'),
(3, 'passeggiata',  14.00, 'ora');

-- ---- DISPONIBILITA' ----
INSERT INTO availability (sitter_id, day, start_time, end_time) VALUES
(1, '2026-09-15', '09:00', '12:00'),
(1, '2026-09-15', '15:00', '18:00'),
(1, '2026-09-16', '09:00', '13:00'),
(3, '2026-09-15', '10:00', '16:00'),
(3, '2026-09-17', '09:00', '12:00');

-- ---- PRENOTAZIONI (in vari stati per testare tutto) ----
-- 1: completata (recensibile/recensita)  2: confermata (pagata)
-- 3: richiesta (in attesa)               4: accettata (da pagare)
INSERT INTO bookings (owner_id, sitter_id, service_id, pet_id, start_date, end_date, start_time, end_time, status, total_price, accepted_at) VALUES
(1, 1, 1, 1, '2026-09-01', '2026-09-01', '14:00', '16:00', 'completata', 24.00, NOW()),
(2, 1, 3, 3, '2026-09-20', '2026-09-22', NULL,    NULL,    'confermata', 90.00, NOW()),
(1, 3, 5, 2, '2026-09-25', '2026-09-25', NULL,    NULL,    'richiesta',  20.00, NULL),
(2, 3, 6, 4, '2026-09-18', '2026-09-19', NULL,    NULL,    'accettata',  35.00, NOW());

-- ---- PAGAMENTI (per le prenotazioni gia' pagate) ----
INSERT INTO payments (booking_id, amount, status, provider_ref, paid_at) VALUES
(1, 24.00, 'pagato', 'demo_0001', NOW()),
(2, 90.00, 'pagato', 'demo_0002', NOW());

-- ---- MESSAGGI ----
INSERT INTO messages (booking_id, sender_id, content) VALUES
(1, 1, 'Ciao Giulia, a che ora passi a prendere Fido?'),
(1, 3, 'Ciao Mario! Passo verso le 14, va bene?'),
(2, 2, 'Buongiorno, Rex ha bisogno di due passeggiate al giorno.');

-- ---- RECENSIONI (per la prenotazione completata) ----
INSERT INTO reviews (booking_id, owner_id, sitter_id, rating, comment) VALUES
(1, 1, 1, 5, 'Puntuale e gentilissima, Fido era felicissimo! Consigliata.');

-- ---- NOTIFICHE ----
INSERT INTO notifications (user_id, type, content) VALUES
(3, 'nuova_richiesta', 'Hai una nuova richiesta di prenotazione da Laura Bianchi.'),
(1, 'accettata',       'Sara Gallo ha accettato la tua prenotazione.');
