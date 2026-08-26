import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

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
            <Link to="/profilo">Il mio profilo</Link>
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
