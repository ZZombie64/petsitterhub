import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, token } = useAuth();

  if (loading) {
    return <p className="page-loading">Caricamento…</p>;
  }

  if (!token || !user) {
    return <Navigate to="/accedi" replace />;
  }

  return children;
}
