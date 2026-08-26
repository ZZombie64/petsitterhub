import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './context/ProtectedRoute';
import NavBar from './context/NavBar';
import CatalogPage from './pages/CatalogPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SitterDashboardPage from './pages/SitterDashboardPage';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <NavBar />

        <main>
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/accedi" element={<LoginPage />} />
            <Route path="/registrati" element={<RegisterPage />} />
            <Route
              path="/profilo"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pannello-sitter"
              element={
                <ProtectedRoute role="sitter">
                  <SitterDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<p>Pagina non trovata.</p>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
