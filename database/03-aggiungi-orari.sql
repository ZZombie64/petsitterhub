-- ============================================================
-- Aggiunge l'ora di inizio e fine alle prenotazioni.
-- Da eseguire sul database esistente (NON cancella i dati).
-- ============================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time   TIME;
