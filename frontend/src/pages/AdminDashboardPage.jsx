import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminSitters,
  updateSitterVerification,
  fetchAdminDisputes,
  updateDisputeStatus,
} from '../api/admin';

const SITTER_STATUS_LABELS = {
  in_attesa: 'In attesa',
  approvato: 'Approvato',
  rifiutato: 'Rifiutato',
};

const DISPUTE_STATUS_LABELS = {
  aperta: 'Aperta',
  in_esame: 'In esame',
  risolta: 'Risolta',
  respinta: 'Respinta',
};

export default function AdminDashboardPage() {
  const { token } = useAuth();

  const [sitters, setSitters] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [sittersData, disputesData] = await Promise.all([
        fetchAdminSitters(token),
        fetchAdminDisputes(token),
      ]);
      setSitters(sittersData.sitters);
      setDisputes(disputesData.disputes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSitterDecision(sitterId, decision) {
    try {
      await updateSitterVerification(token, sitterId, decision);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDisputeStatus(disputeId, status) {
    try {
      await updateDisputeStatus(token, disputeId, status);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="page-loading">Caricamento…</p>;

  const pendingSitters = sitters.filter((s) => s.verification_status === 'in_attesa');
  const otherSitters = sitters.filter((s) => s.verification_status !== 'in_attesa');

  return (
    <div className="sitter-dashboard">
      <h1>Pannello amministratore</h1>

      {error && <p className="form-error">{error}</p>}

      {/* --- Sitter da verificare --- */}
      <section className="dashboard-section">
        <h2>Sitter da verificare ({pendingSitters.length})</h2>

        <ul className="dashboard-list">
          {pendingSitters.length === 0 && (
            <li className="dashboard-empty">Nessun sitter in attesa di verifica.</li>
          )}
          {pendingSitters.map((s) => (
            <li key={s.sitter_id} className="dashboard-list-item">
              <span>
                <strong>{s.full_name}</strong> — {s.email}
                {s.city && ` · ${s.city}`}
                {s.bio && <><br /><em>{s.bio}</em></>}
              </span>
              <span>
                <button onClick={() => handleSitterDecision(s.sitter_id, 'approvato')}>
                  Approva
                </button>{' '}
                <button
                  className="link-danger"
                  onClick={() => handleSitterDecision(s.sitter_id, 'rifiutato')}
                >
                  Rifiuta
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* --- Storico sitter già verificati --- */}
      <section className="dashboard-section">
        <h2>Sitter già verificati</h2>

        <ul className="dashboard-list">
          {otherSitters.length === 0 && (
            <li className="dashboard-empty">Nessun sitter verificato finora.</li>
          )}
          {otherSitters.map((s) => (
            <li key={s.sitter_id} className="dashboard-list-item">
              <span>{s.full_name} — {s.email}</span>
              <span>
                <span className={`status-badge status-${s.verification_status}`}>
                  {SITTER_STATUS_LABELS[s.verification_status]}
                </span>
                {s.verification_status === 'approvato' && (
                  <>
                    {' '}
                    <button
                      className="link-danger"
                      onClick={() => handleSitterDecision(s.sitter_id, 'rifiutato')}
                    >
                      Rifiuta
                    </button>
                  </>
                )}
                {s.verification_status === 'rifiutato' && (
                  <>
                    {' '}
                    <button onClick={() => handleSitterDecision(s.sitter_id, 'approvato')}>
                      Approva
                    </button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* --- Dispute --- */}
      <section className="dashboard-section">
        <h2>Dispute ({disputes.length})</h2>

        <ul className="dashboard-list">
          {disputes.length === 0 && (
            <li className="dashboard-empty">Nessuna disputa aperta.</li>
          )}
          {disputes.map((d) => (
            <li key={d.id} className="dashboard-list-item">
              <span>
                Prenotazione #{d.booking_id} — aperta da {d.opened_by_name}
                <br />
                <em>{d.reason}</em>
              </span>
              <span>
                <span className={`status-badge status-${d.status}`}>
                  {DISPUTE_STATUS_LABELS[d.status]}
                </span>
                {d.status === 'aperta' && (
                  <>
                    {' '}
                    <button onClick={() => handleDisputeStatus(d.id, 'in_esame')}>
                      Prendi in esame
                    </button>
                  </>
                )}
                {d.status === 'in_esame' && (
                  <>
                    {' '}
                    <button onClick={() => handleDisputeStatus(d.id, 'risolta')}>
                      Segna risolta
                    </button>{' '}
                    <button
                      className="link-danger"
                      onClick={() => handleDisputeStatus(d.id, 'respinta')}
                    >
                      Respingi
                    </button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
