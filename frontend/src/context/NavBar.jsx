import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import NotificationBell from '../components/NotificationBell';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🐾 PetSitterHub</Link>

      <div className="navbar-links">
        <Link to="/">Catalogo</Link>
        {user ? (
          <>
            {user.role === 'sitter' && <Link to="/pannello-sitter">Il mio pannello</Link>}
            {user.role === 'admin' && <Link to="/admin">Pannello admin</Link>}
            {user.role === 'owner' && <Link to="/le-mie-prenotazioni">Le mie prenotazioni</Link>}
            <Link to="/profilo">Il mio profilo</Link>
            <NotificationBell />
            <button className="navbar-logout" onClick={handleLogout}>Esci</button>
          </>
        ) : (
          <>
            <Link to="/accedi">Accedi</Link>
            <Link to="/registrati">Registrati</Link>
          </>
        )}
      </div>
    </nav>
  );
}
