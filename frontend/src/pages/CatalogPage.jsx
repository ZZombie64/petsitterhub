import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSitters } from '../api/sitters';
import StarRating from '../components/StarRating';

const SERVICE_TABS = [
  { value: '', label: 'Tutti' },
  { value: 'passeggiata', label: 'Passeggiata' },
  { value: 'pet-sitting', label: 'Pet-sitting' },
  { value: 'pensione', label: 'Pensione' },
  { value: 'toelettatura', label: 'Toelettatura' },
];

const initialFilters = { citta: '', animale: '', servizio: '', data: '' };

export default function CatalogPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [sitters, setSitters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadSitters(activeFilters) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSitters(activeFilters);
      setSitters(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Carica il catalogo completo (nessun filtro) al primo accesso alla pagina
  useEffect(() => {
    loadSitters(initialFilters);
  }, []);

  function handleChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  function handleServiceTabClick(value) {
    const nextFilters = { ...filters, servizio: value };
    setFilters(nextFilters);
    loadSitters(nextFilters);
  }

  function handleSubmit(e) {
    e.preventDefault();
    loadSitters(filters);
  }

  function handleReset() {
    setFilters(initialFilters);
    loadSitters(initialFilters);
  }

  return (
    <div className="catalog-page">
      <h1>Trova un pet-sitter</h1>

      <div className="service-tabs" role="tablist" aria-label="Filtra per tipo di servizio">
        {SERVICE_TABS.map((tab) => (
          <button
            key={tab.value || 'tutti'}
            type="button"
            role="tab"
            aria-selected={filters.servizio === tab.value}
            className={`service-tab ${filters.servizio === tab.value ? 'active' : ''}`}
            onClick={() => handleServiceTabClick(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="catalog-filters">
        <label>
          Città
          <input
            type="text"
            name="citta"
            placeholder="es. Milano"
            value={filters.citta}
            onChange={handleChange}
          />
        </label>

        <label>
          Tipo di animale
          <input
            type="text"
            name="animale"
            placeholder="es. cane"
            value={filters.animale}
            onChange={handleChange}
          />
        </label>

        <label>
          Disponibile il
          <input
            type="date"
            name="data"
            value={filters.data}
            onChange={handleChange}
          />
        </label>

        <div className="catalog-filters-actions">
          <button type="submit">Cerca</button>
          <button type="button" className="secondary" onClick={handleReset}>
            Azzera filtri
          </button>
        </div>
      </form>

      {loading && <p className="page-loading">Caricamento sitter…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && sitters.length === 0 && (
        <p className="catalog-empty">
          Nessun sitter trovato con questi filtri. Prova ad allargare la ricerca.
        </p>
      )}

      <ul className="sitter-list">
        {sitters.map((sitter) => (
          <li key={sitter.sitter_id} className="sitter-card">
            <div className="sitter-card-header">
              <h2><Link to={`/sitter/${sitter.sitter_id}`}>{sitter.full_name}</Link></h2>
              <span className="sitter-city">{sitter.city || 'Città non indicata'}</span>
            </div>

            <StarRating media={sitter.media_voti} numero={Number(sitter.numero_recensioni)} />

            {sitter.bio && <p className="sitter-bio">{sitter.bio}</p>}

            {sitter.accepted_pets && (
              <p className="sitter-pets">
                <strong>Animali accettati:</strong> {sitter.accepted_pets}
              </p>
            )}

            {sitter.services.length > 0 && (
              <ul className="sitter-services">
                {sitter.services.map((s) => (
                  <li key={s.id}>
                    {s.type} — {Number(s.price).toFixed(2)} € / {s.unit}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
