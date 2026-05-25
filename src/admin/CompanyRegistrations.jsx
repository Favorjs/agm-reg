import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaCheck, FaUsers, FaUserCheck, FaUserTie, FaChartPie } from 'react-icons/fa';
import { API } from '../context/CompanyContext';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('admin_token')}` };
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '1.25rem 1.5rem',
      boxShadow: '0 0 0 1px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 160,
    }}>
      <div style={{ background: color + '18', borderRadius: 10, padding: '.75rem', color, fontSize: '1.3rem' }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1a202c', lineHeight: 1 }}>{value}</p>
        <p style={{ margin: '4px 0 0', fontSize: '.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</p>
      </div>
    </div>
  );
}

export default function CompanyRegistrations() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]           = useState({ shareholders: [], guests: [] });
  const [totalInDb, setTotalInDb] = useState(0);
  const [tab, setTab]             = useState('shareholders');
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/admin/companies/${id}/registrations`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/api/admin/companies/${id}/shareholders?pageSize=1`, { headers: authHeaders() }).then(r => r.json()),
    ]).then(([regData, shData]) => {
      setData(regData);
      setTotalInDb(shData?.pagination?.totalItems ?? 0);
    }).finally(() => setLoading(false));
  }, [id]);

  const exportCsv = (rows, filename) => {
    if (!rows.length) { showToast('No records to export', 'error'); return; }
    const keys = Object.keys(rows[0]);
    const csv  = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = filename;
    a.click();
    showToast(`${rows.length} record${rows.length !== 1 ? 's' : ''} exported to CSV`);
  };

  const rows = tab === 'shareholders' ? data.shareholders : data.guests;
  const cols = tab === 'shareholders'
    ? ['name', 'acno', 'email', 'phone_number', 'holdings', 'chn', 'registered_at']
    : ['name', 'email', 'phone', 'user_type', 'created_at'];

  const regCount  = data.shareholders.length;
  const guestCount = data.guests.length;
  const regRate   = totalInDb > 0 ? Math.round((regCount / totalInDb) * 100) : 0;

  const tabStyle = (t) => ({
    padding: '.55rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '.875rem',
    background: tab === t ? '#0f3d2e' : '#f1f5f9', color: tab === t ? '#fff' : '#1a202c',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <button onClick={() => navigate('/admin/companies')} className="secondary-btn"><FaArrowLeft /> Back</button>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button style={tabStyle('shareholders')} onClick={() => setTab('shareholders')}>
              Shareholders ({regCount})
            </button>
            <button style={tabStyle('guests')} onClick={() => setTab('guests')}>
              Guests ({guestCount})
            </button>
          </div>
          <button onClick={() => exportCsv(rows, `${tab}-${id}.csv`)} className="secondary-btn">
            <FaDownload /> Export CSV
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <StatCard icon={<FaUsers />}     label="Total Shareholders (DB)" value={totalInDb} color="#3b82f6" />
          <StatCard icon={<FaUserCheck />} label="Registered Shareholders" value={regCount}  color="#16a34a" />
          <StatCard icon={<FaUserTie />}   label="Guests / Observers"      value={guestCount} color="#f59e0b" />
          <StatCard icon={<FaChartPie />}  label="Registration Rate"        value={`${regRate}%`} color="#8b5cf6" />
        </div>

        {loading ? <p style={{ color: '#64748b' }}>Loading…</p> : (
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.875rem' }}>
              <thead>
                <tr>
                  {cols.map(c => (
                    <th key={c} style={{ background: '#0f3d2e', color: '#fff', padding: '.75rem 1rem', textAlign: 'left', fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      {c.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {cols.map(c => (
                      <td key={c} style={{ padding: '.75rem 1rem', color: '#1a202c' }}>
                        {c.includes('at') && r[c] ? new Date(r[c]).toLocaleString() : (r[c] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={cols.length} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>No registrations yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          background: toast.type === 'error' ? '#dc2626' : '#16a34a',
          color: '#fff', padding: '1rem 1.5rem', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,.2)',
          display: 'flex', alignItems: 'center', gap: '.75rem',
          fontSize: '.9rem', fontWeight: 600, minWidth: 240,
          animation: 'toastSlideUp .3s ease',
        }}>
          <FaCheck /> {toast.msg}
        </div>
      )}
    </div>
  );
}
