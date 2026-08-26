import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'owner',
  city: '',
  phone: '',
};

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const data = await registerUser(form);
      login(data.token, data.user);
      navigate('/profilo');
    } catch (err) {
      setError(err.message);
      if (err.details) {
        const mapped = {};
        err.details.forEach((d) => {
          mapped[d.field] = d.message;
        });
        setFieldErrors(mapped);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Crea un account</h1>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Nome e cognome
          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            required
          />
          {fieldErrors.full_name && <span className="field-error">{fieldErrors.full_name}</span>}
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
          />
          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
        </label>

        <fieldset className="role-choice">
          <legend>Ti registri come:</legend>
          <label className="radio-option">
            <input
              type="radio"
              name="role"
              value="owner"
              checked={form.role === 'owner'}
              onChange={handleChange}
            />
            Proprietario di animali
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="role"
              value="sitter"
              checked={form.role === 'sitter'}
              onChange={handleChange}
            />
            Pet-sitter / dog-walker
          </label>
        </fieldset>

        <label>
          Città (opzionale)
          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
          />
        </label>

        <label>
          Telefono (opzionale)
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />
          {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creazione account…' : 'Crea account'}
        </button>
      </form>

      <p className="auth-switch">
        Hai già un account? <Link to="/accedi">Accedi</Link>
      </p>
    </div>
  );
}
