-- ============================================================
-- Aggiunge le colonne per le foto (link delle immagini su Cloudinary).
-- Da eseguire sul database esistente (NON cancella i dati).
-- ============================================================

-- Foto del sitter: una di se stesso, una dell'ambiente dove tiene gli animali
ALTER TABLE sitter_profiles
  ADD COLUMN IF NOT EXISTS photo_url     TEXT,
  ADD COLUMN IF NOT EXISTS place_photo_url TEXT;

-- Foto dell'animale
ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS photo_url TEXT;
