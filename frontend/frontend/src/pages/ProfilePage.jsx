import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  owner: 'Proprietario',
  sitter: 'Pet-sitter',
  admin: 'Amministratore',
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    </div>
  );
}
