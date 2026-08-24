-- ============================================================
-- PetSitterHub - Dati di prova (seed) - Versione 2
-- Da eseguire DOPO schema.sql
-- Le password_hash sono finte, solo per i test.
-- ============================================================

-- Utenti: 2 proprietari, 3 sitter, 1 admin
INSERT INTO users (email, password_hash, full_name, role, city, phone) VALUES
('mario.rossi@example.com',  'hash_finto_1', 'Mario Rossi',    'owner',  'Milano', '3331112221'),
('laura.bianchi@example.com','hash_finto_2', 'Laura Bianchi',  'owner',  'Milano', '3331112222'),
('giulia.verdi@example.com', 'hash_finto_3', 'Giulia Verdi',   'sitter', 'Milano', '3331112223'),
('luca.neri@example.com',    'hash_finto_4', 'Luca Neri',      'sitter', 'Torino', '3331112224'),
('sara.gallo@example.com',   'hash_finto_5', 'Sara Gallo',     'sitter', 'Milano', '3331112225'),
('admin@petsitterhub.com',   'hash_finto_6', 'Amministratore', 'admin',  NULL,     NULL);

-- Animali dei proprietari (owner_id 1 = Mario, 2 = Laura)
INSERT INTO pets (owner_id, name, species, size, notes) VALUES
(1, 'Fido',  'cane',  'media',   'Socievole, va d''accordo con altri cani.'),
(1, 'Milo',  'gatto', 'piccola', 'Timido con gli estranei.'),
(2, 'Rex',   'cane',  'grande',  'Ha bisogno di lunghe passeggiate.');

-- Profili sitter (user_id 3, 4, 5)
INSERT INTO sitter_profiles (user_id, bio, accepted_pets, verification_status) VALUES
(3, 'Amo gli animali, esperienza con cani di ogni taglia.', 'cani, gatti', 'approvato'),
(4, 'Studente disponibile per passeggiate e pet-sitting.',   'cani',        'in_attesa'),
(5, 'Toelettatrice con pensione a domicilio.',               'cani, gatti', 'approvato');

-- Servizi (sitter_id fa riferimento a sitter_profiles.id: 1, 2, 3)
INSERT INTO services (sitter_id, type, price, unit) VALUES
(1, 'passeggiata',  12.00, 'ora'),
(1, 'pet-sitting',  25.00, 'giorno'),
(1, 'pensione',     30.00, 'notte'),
(2, 'passeggiata',  10.00, 'ora'),
(3, 'toelettatura', 20.00, 'servizio'),
(3, 'pensione',     35.00, 'notte');

-- Disponibilita' del sitter 1
INSERT INTO availability (sitter_id, day, start_time, end_time) VALUES
(1, '2026-09-01', '09:00', '12:00'),
(1, '2026-09-01', '15:00', '18:00'),
(1, '2026-09-02', '09:00', '12:00');

-- Prenotazione: Mario prenota una passeggiata per Fido da Giulia
INSERT INTO bookings (owner_id, sitter_id, service_id, pet_id, start_date, end_date, status, total_price, accepted_at) VALUES
(1, 1, 1, 1, '2026-09-01', '2026-09-01', 'confermata', 12.00, NOW());

-- Pagamento collegato alla prenotazione 1
INSERT INTO payments (booking_id, amount, status, provider_ref, paid_at) VALUES
(1, 12.00, 'pagato', 'test_stripe_0001', NOW());

-- Messaggio di esempio
INSERT INTO messages (booking_id, sender_id, content) VALUES
(1, 1, 'Ciao Giulia, a che ora passi a prendere Fido?');

-- Recensione di esempio
INSERT INTO reviews (booking_id, owner_id, sitter_id, rating, comment) VALUES
(1, 1, 1, 5, 'Puntuale e gentilissima, Fido era felicissimo!');

-- Notifiche di esempio
INSERT INTO notifications (user_id, type, content) VALUES
(3, 'nuova_richiesta',  'Hai una nuova richiesta di prenotazione da Mario Rossi.'),
(1, 'accettata',        'Giulia Verdi ha accettato la tua prenotazione.');

-- Dispute di esempio (aperta da Laura su una futura prenotazione ipotetica)
-- Nota: qui la colleghiamo alla prenotazione 1 solo a scopo dimostrativo
INSERT INTO disputes (booking_id, opened_by, reason, status) VALUES
(1, 1, 'Il servizio e'' terminato prima del previsto.', 'aperta');
