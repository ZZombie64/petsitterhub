import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyPets, addPet, deletePet } from '../api/pets';

const ROLE_LABELS = {
  owner: 'Proprietario',
  sitter: 'Pet-sitter',
  admin: 'Amministratore',
};

const initialPetForm = { name: '', species: '', size: '', notes: '' };

export default function ProfilePage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petForm, setPetForm] = useState(initialPetForm);
  const [petError, setPetError] = useState(null);

  async function loadPets() {
    setPetsLoading(true);
    try {
      const data = await fetchMyPets(token);
      setPets(data.pets);
    } catch (err) {
      setPetError(err.message);
    } finally {
      setPetsLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === 'owner') {
      loadPets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleAddPet(e) {
    e.preventDefault();
    setPetError(null);
    try {
      await addPet(token, petForm);
      setPetForm(initialPetForm);
      loadPets();
    } catch (err) {
      setPetError(err.message);
    }
  }

  async function handleDeletePet(id) {
    setPetError(null);
    try {
      await deletePet(token, id);
      loadPets();
    } catch (err) {
      setPetError(err.message);
    }
  }

  function handleLogout() {
    logout();
    navigate('/accedi');
  }

  if (!user) {
    return null; // ProtectedRoute reindirizza già al login in questo caso
  }

  return (
    <div className="profile-page">
      <h1>Il tuo profilo</h1>

      <dl className="profile-details">
        <dt>Nome</dt>
        <dd>{user.full_name}</dd>

        <dt>Email</dt>
        <dd>{user.email}</dd>

        <dt>Ruolo</dt>
        <dd>{ROLE_LABELS[user.role] || user.role}</dd>

        <dt>Città</dt>
        <dd>{user.city || '—'}</dd>

        <dt>Telefono</dt>
        <dd>{user.phone || '—'}</dd>
      </dl>

      <button onClick={handleLogout}>Esci</button>

      {user.role === 'owner' && (
        <section className="dashboard-section">
          <h2>I miei animali</h2>

          {petsLoading && <p className="page-loading">Caricamento…</p>}

          <ul className="dashboard-list">
            {!petsLoading && pets.length === 0 && (
              <li className="dashboard-empty">Nessun animale ancora aggiunto.</li>
            )}
            {pets.map((pet) => (
              <li key={pet.id} className="dashboard-list-item">
                <span>
                  <strong>{pet.name}</strong> — {pet.species}
                  {pet.size && ` (${pet.size})`}
                  {pet.notes && <><br /><em>{pet.notes}</em></>}
                </span>
                <button className="link-danger" onClick={() => handleDeletePet(pet.id)}>
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddPet} className="dashboard-form inline-form">
            <input
              type="text"
              placeholder="Nome (es. Fido)"
              value={petForm.name}
              onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Specie (es. cane)"
              value={petForm.species}
              onChange={(e) => setPetForm({ ...petForm, species: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Taglia (opzionale)"
              value={petForm.size}
              onChange={(e) => setPetForm({ ...petForm, size: e.target.value })}
            />
            <input
              type="text"
              placeholder="Note (opzionale)"
              value={petForm.notes}
              onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })}
            />
            <button type="submit">Aggiungi animale</button>
          </form>
          {petError && <p className="form-error">{petError}</p>}
        </section>
      )}
    </div>
  );
}
