import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { API } from '../context/CompanyContext';

export default function AdminLogin() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_role',  data.role);
      navigate('/admin/companies');
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 400, boxShadow: '0 0 0 1px rgba(0,0,0,.06)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '.25rem', color: '#0f3d2e' }}>Admin Portal</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '.9rem', marginBottom: '1.75rem' }}>Apel Capital Registrars</p>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          {[
            { key: 'email',    type: 'email',    icon: <FaEnvelope />, placeholder: 'admin@apel.com.ng' },
            { key: 'password', type: 'password', icon: <FaLock />,     placeholder: 'Password' },
          ].map(({ key, type, icon, placeholder }) => (
            <div className="form-group" key={key}>
              <div className="input-wrap">
                <span className="input-icon">{icon}</span>
                <input type={type} value={form[key]} placeholder={placeholder}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} required />
              </div>
            </div>
          ))}
          <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: '.75rem' }}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
