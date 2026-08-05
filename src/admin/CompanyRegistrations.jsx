import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaCheck, FaUsers, FaUserCheck, FaUserTie, FaChartPie, FaEnvelope, FaSearch } from 'react-icons/fa';
import { API } from '../context/CompanyContext';

const thStyle = {
  background: '#0f3d2e', color: '#fff', padding: '.75rem 1rem', textAlign: 'left',
  fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.04em',
};

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
  const [broadcasting, setBroadcasting] = useState(false);
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);

  // Search & select individual recipients
  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState([]);
  const [searching, setSearching]       = useState(false);
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [sendingSelected, setSendingSelected] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);

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

  const sendBroadcast = async () => {
    setShowBroadcastConfirm(false);
    setBroadcasting(true);
    try {
      const res  = await fetch(`${API}/api/admin/companies/${id}/broadcast-email`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Broadcast failed', 'error'); return; }
      showToast(`✅ Sent to ${data.sent} recipient${data.sent !== 1 ? 's' : ''}${data.failed ? ` · ${data.failed} failed` : ''}`);
    } catch {
      showToast('Network error — broadcast failed', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  // Debounced fuzzy search against the full shareholder DB
  useEffect(() => {
    if (tab !== 'search') return;
    if (!query.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/api/admin/companies/${id}/shareholders/search?q=${encodeURIComponent(query.trim())}`, { headers: authHeaders() });
        const data = await res.json();
        setResults(res.ok ? (data.data || []) : []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query, tab, id]);

  const toggleSelect = (shId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(shId) ? next.delete(shId) : next.add(shId);
      return next;
    });
  };

  const toggleSelectAllResults = (checked) => {
    const withEmail = results.filter(r => r.email).map(r => r.id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      withEmail.forEach(idv => checked ? next.add(idv) : next.delete(idv));
      return next;
    });
  };

  const sendToSelected = async () => {
    setShowSendConfirm(false);
    setSendingSelected(true);
    try {
      const res  = await fetch(`${API}/api/admin/companies/${id}/shareholders/send-email`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Send failed', 'error'); return; }
      showToast(
        `✅ Sent to ${data.sent} recipient${data.sent !== 1 ? 's' : ''}` +
        `${data.failed ? ` · ${data.failed} failed` : ''}` +
        `${data.skippedNoEmail ? ` · ${data.skippedNoEmail} skipped (no email)` : ''}`
      );
      setSelectedIds(new Set());
    } catch {
      showToast('Network error — send failed', 'error');
    } finally {
      setSendingSelected(false);
    }
  };

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
            <button style={tabStyle('search')} onClick={() => setTab('search')}>
              <FaSearch size={11} style={{ marginRight: '.35rem' }} /> Search & Send
            </button>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            {tab === 'search' ? (
              <button
                onClick={() => setShowSendConfirm(true)}
                disabled={sendingSelected || selectedIds.size === 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.4rem',
                  background: '#0f3d2e', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '.5rem 1rem', fontSize: '.875rem',
                  fontWeight: 600, cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedIds.size === 0 ? 0.45 : 1, fontFamily: 'inherit',
                }}
              >
                {sendingSelected ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <FaEnvelope size={13} />}
                {sendingSelected ? 'Sending…' : `Send to Selected${selectedIds.size ? ` (${selectedIds.size})` : ''}`}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowBroadcastConfirm(true)}
                  disabled={broadcasting || (regCount + guestCount === 0)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '.4rem',
                    background: '#0f3d2e', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '.5rem 1rem', fontSize: '.875rem',
                    fontWeight: 600, cursor: (regCount + guestCount === 0) ? 'not-allowed' : 'pointer',
                    opacity: (regCount + guestCount === 0) ? 0.45 : 1, fontFamily: 'inherit',
                  }}
                >
                  {broadcasting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <FaEnvelope size={13} />}
                  {broadcasting ? 'Sending…' : 'Send Meeting Links'}
                </button>
                <button onClick={() => exportCsv(rows, `${tab}-${id}.csv`)} className="secondary-btn">
                  <FaDownload /> Export CSV
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <StatCard icon={<FaUsers />}     label="Total Shareholders (DB)" value={totalInDb} color="#3b82f6" />
          <StatCard icon={<FaUserCheck />} label="Registered Shareholders" value={regCount}  color="#16a34a" />
          <StatCard icon={<FaUserTie />}   label="Guests / Observers"      value={guestCount} color="#f59e0b" />
          <StatCard icon={<FaChartPie />}  label="Registration Rate"        value={`${regRate}%`} color="#8b5cf6" />
        </div>

        {tab === 'search' ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 0 0 1px rgba(0,0,0,.06)' }}>
            <p style={{ fontSize: '.8rem', color: '#64748b', marginTop: 0, marginBottom: '1rem' }}>
              Fuzzy, typo-tolerant search across every shareholder in the database (not just registered ones).
              Pick individuals below and send them the meeting links directly.
            </p>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <FaSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '.85rem' }} />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, account no, or email…"
                style={{
                  width: '100%', padding: '.7rem .8rem .7rem 2.4rem', borderRadius: 8,
                  border: '1px solid #e2e8f0', fontSize: '.9rem', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>

            {searching && <p style={{ color: '#64748b', fontSize: '.85rem' }}>Searching…</p>}
            {!searching && query.trim() && results.length === 0 && (
              <p style={{ color: '#64748b', fontSize: '.85rem' }}>No shareholders match "{query.trim()}"</p>
            )}
            {!query.trim() && (
              <p style={{ color: '#94a3b8', fontSize: '.85rem', textAlign: 'center', padding: '2rem 0' }}>
                Start typing a shareholder name, account number, or email to search.
              </p>
            )}

            {results.length > 0 && (
              <div style={{ overflow: 'hidden', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.875rem' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: 36 }}>
                        <input
                          type="checkbox"
                          checked={results.some(r => r.email) && results.filter(r => r.email).every(r => selectedIds.has(r.id))}
                          onChange={e => toggleSelectAllResults(e.target.checked)}
                        />
                      </th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Account No</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Holdings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: r.email ? 1 : .5 }}>
                        <td style={{ padding: '.6rem 1rem' }}>
                          <input type="checkbox" disabled={!r.email} checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} />
                        </td>
                        <td style={{ padding: '.6rem 1rem', color: '#1a202c' }}>{r.name}</td>
                        <td style={{ padding: '.6rem 1rem', color: '#1a202c' }}>{r.acno}</td>
                        <td style={{ padding: '.6rem 1rem', color: '#1a202c' }}>
                          {r.email || <em style={{ color: '#cbd5e1' }}>no email on file</em>}
                        </td>
                        <td style={{ padding: '.6rem 1rem', color: '#1a202c' }}>{r.holdings ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : loading ? <p style={{ color: '#64748b' }}>Loading…</p> : (
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

      {showBroadcastConfirm && (
        <div onClick={() => setShowBroadcastConfirm(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 16, padding: '2rem',
            maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.22)',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0fdf4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem', fontSize: '1.4rem' }}>
              <FaEnvelope style={{ color: '#0f3d2e' }} />
            </div>
            <h3 style={{ color: '#0f3d2e', marginBottom: '.5rem', fontSize: '1.05rem' }}>Send Meeting Links</h3>
            <p style={{ color: '#64748b', fontSize: '.875rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              This will send the Zoom and YouTube links to all <strong>{regCount + guestCount}</strong> registered
              participants ({regCount} shareholder{regCount !== 1 ? 's' : ''} + {guestCount} guest{guestCount !== 1 ? 's' : ''}).
              Duplicate emails across both lists are automatically deduplicated.
            </p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowBroadcastConfirm(false)} className="secondary-btn">
                Cancel
              </button>
              <button type="button" onClick={sendBroadcast}
                style={{ background: '#0f3d2e', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '.7rem 1.5rem', fontWeight: 700,
                  fontSize: '.9rem', fontFamily: 'inherit', cursor: 'pointer' }}>
                Yes, Send Emails
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendConfirm && (
        <div onClick={() => setShowSendConfirm(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 16, padding: '2rem',
            maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.22)',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0fdf4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem', fontSize: '1.4rem' }}>
              <FaEnvelope style={{ color: '#0f3d2e' }} />
            </div>
            <h3 style={{ color: '#0f3d2e', marginBottom: '.5rem', fontSize: '1.05rem' }}>Send to Selected</h3>
            <p style={{ color: '#64748b', fontSize: '.875rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              This will send the Zoom and YouTube links to the <strong>{selectedIds.size}</strong> shareholder{selectedIds.size !== 1 ? 's' : ''} you selected.
            </p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowSendConfirm(false)} className="secondary-btn">
                Cancel
              </button>
              <button type="button" onClick={sendToSelected}
                style={{ background: '#0f3d2e', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '.7rem 1.5rem', fontWeight: 700,
                  fontSize: '.9rem', fontFamily: 'inherit', cursor: 'pointer' }}>
                Yes, Send Emails
              </button>
            </div>
          </div>
        </div>
      )}

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
