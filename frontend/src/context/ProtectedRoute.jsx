import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading, token } = useAuth();

  if (loading) {
    return <p className="page-loading">Caricamento…</p>;
  }

  if (!token || !user) {
    return <Navigate to="/accedi" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/profilo" replace />;
  }

  return children;
}
