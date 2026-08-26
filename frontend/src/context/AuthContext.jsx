import { createContext, useContext, useEffect, useState } from 'react';
import { fetchMe } from '../api/auth';

const AuthContext = createContext(null);

const TOKEN_STORAGE_KEY = 'petsitterhub_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  // Finché non abbiamo verificato un eventuale token salvato, mostriamo un loader
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchMe(token)
      .then((data) => setUser(data.user))
      .catch(() => {
        // Il token salvato non è più valido (scaduto o revocato): puliamo tutto
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      })
      .finally(() => setLoading(false));
  }, [token]);

  function login(newToken, newUser) {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth va usato dentro <AuthProvider>');
  }
  return ctx;
}
