import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaUpload, FaFileExcel, FaTrash, FaCheck, FaUsers, FaCopy, FaExternalLinkAlt } from 'react-icons/fa';
import { API } from '../context/CompanyContext';

function authHeaders(json = true) {
  const h = { Authorization: `Bearer ${localStorage.getItem('admin_token')}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

const EMPTY = {
  slug: '', subdomain: '', name: '', meeting_type: 'EGM', meeting_date: '',
  meeting_time: '', zoom_link: '', youtube_link: '', primary_color: '#107b5f',
  is_registration_open: false, is_active: true,
};

function parseDateForInput(d) {
  if (!d) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return '';
}

function parseTimeForInput(t) {
  if (!t) return '';
  if (/^\d{2}:\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return '';
  let h = parseInt(m[1]);
  if (/pm/i.test(m[3]) && h !== 12) h += 12;
  if (/am/i.test(m[3]) && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

const card = {
  background: '#fff', borderRadius: 12, padding: '1.5rem',
  border: '1px solid #e2e8f0', marginBottom: '1.5rem',
};

const dangerBtn = {
  background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
  borderRadius: 8, padding: '.4rem .85rem', fontSize: '.8rem', fontWeight: 600,
  fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex',
  alignItems: 'center', gap: '.35rem',
};

function EmailBadge() {
  return (
    <span style={{
      background: '#ecfdf5', color: '#107b5f', border: '1px solid #6ee7b7',
      borderRadius: 4, fontSize: '.65rem', fontWeight: 700, padding: '.1rem .35rem',
      verticalAlign: 'middle', marginLeft: '.35rem', letterSpacing: '.03em',
    }}>✉ IN EMAIL</span>
  );
}

// ── Defined OUTSIDE the main component so React never remounts it on re-render ──
function LogoSlot({ label, url, which, inputRef, fallback, onDelete, preview, onFileChange }) {
  // Priority: local file preview > saved URL > fallback default
  const displaySrc = preview || url || fallback;
  const isPreview  = !!preview;
  const hasCustom  = !!url && !isPreview;
  const isDefault  = !url && !isPreview && !!fallback;

  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1.25rem', border: `1px solid ${isPreview ? '#86efac' : '#e2e8f0'}`, transition: 'border-color .2s' }}>
      <p className="label-text" style={{ marginBottom: '.75rem', textAlign: 'center' }}>{label}</p>

      {/* Preview box */}
      <div style={{
        height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '.5rem', background: '#fff', borderRadius: 8,
        border: isPreview ? '2px dashed #107b5f' : '1px dashed #cbd5e1',
        transition: 'border .2s',
      }}>
        {displaySrc
          ? <img key={displaySrc} src={displaySrc} alt={label}
              style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain', padding: 4 }} />
          : <span style={{ color: '#94a3b8', fontSize: '.8rem' }}>No logo uploaded</span>
        }
      </div>

      {/* Status label */}
      <p style={{ fontSize: '.72rem', textAlign: 'center', marginBottom: '.6rem', fontWeight: 600,
        color: isPreview ? '#107b5f' : hasCustom ? '#107b5f' : '#94a3b8' }}>
        {isPreview  ? '⬆ Selected — click Upload to save'
         : hasCustom ? '✓ Custom logo active'
         : isDefault ? 'Using default logo'
         : 'No logo set'}
      </p>

      {/* File picker */}
      <input type="file" ref={inputRef} accept="image/*" onChange={onFileChange}
        style={{ fontSize: '.78rem', width: '100%', marginBottom: '.5rem' }} />

      {/* Delete — only when a saved custom logo exists and no new file is staged */}
      {hasCustom && (
        <button type="button" onClick={() => onDelete(which)}
          style={{ ...dangerBtn, width: '100%', justifyContent: 'center', marginTop: '.35rem' }}>
          <FaTrash size={11} /> {fallback ? 'Remove custom, use default' : 'Delete Logo'}
        </button>
      )}
    </div>
  );
}

export default function CompanyEdit() {
  const { id }         = useParams();
  const isNew          = id === 'new';
  const navigate       = useNavigate();
  const { state: nav } = useLocation();
  const csvRef         = useRef();
  const logoRef        = useRef();
  const logo2Ref       = useRef();

  const [form, setForm]           = useState(EMPTY);
  const [originalForm, setOriginalForm] = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview]   = useState(null);
  const [logo2Preview, setLogo2Preview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [shareholderCount, setShareholderCount] = useState(null); // null = loading
  const [error, setError]         = useState('');
  const [toast, setToast]         = useState(null);
  const [confirm, setConfirm]     = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // isDirty: form differs from what was last saved (ignored for new companies)
  const isDirty = !isNew && JSON.stringify(form) !== JSON.stringify(originalForm);

  const showConfirm = (title, body, onConfirm, danger = false, opts = {}) =>
    setConfirm({ title, body, onConfirm, danger, ...opts });

  const loadShareholderCount = async () => {
    try {
      const res  = await fetch(`${API}/api/admin/companies/${id}/shareholders?pageSize=1`, { headers: authHeaders() });
      const data = await res.json();
      setShareholderCount(data.pagination?.totalItems ?? 0);
    } catch { setShareholderCount(0); }
  };

  // Show "created" toast when redirected here after new company creation
  useEffect(() => {
    if (nav?.created) showToast('Company created successfully!');
  }, []);

  useEffect(() => {
    if (isNew) return;
    fetch(`${API}/api/admin/companies/${id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        const loaded = {
          ...data,
          meeting_date: parseDateForInput(data.meeting_date),
          meeting_time: parseTimeForInput(data.meeting_time),
        };
        setForm(loaded);
        setOriginalForm(loaded);
      });
    loadShareholderCount();
  }, [id]);

  // Warn browser on tab close / refresh when dirty
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/api/admin/companies${isNew ? '' : `/${id}`}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed'); return; }
      if (isNew) {
        navigate(`/admin/companies/${data.id}`, { state: { created: true } });
      } else {
        setOriginalForm(form); // mark clean
        showToast('Changes saved successfully!');
      }
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  // Ask before saving (shown when user clicks Save Changes)
  const handleSaveClick = () => {
    if (isNew) { save(); return; }
    if (!isDirty) return;
    showConfirm(
      'Save Changes',
      'Save your changes to this company?',
      () => save(),
      false,
      { confirmLabel: 'Yes, Save' },
    );
  };

  // Ask before navigating away with unsaved changes
  const handleBack = () => {
    if (!isDirty) { navigate('/admin/companies'); return; }
    setConfirm({
      title: 'Unsaved Changes',
      body: 'You have unsaved changes. What would you like to do?',
      icon: '💾',
      danger: false,
      confirmLabel: 'Save & Exit',
      onConfirm: async () => { await save(); navigate('/admin/companies'); },
      secondaryLabel: 'Exit Without Saving',
      onSecondary: () => navigate('/admin/companies'),
      cancelLabel: 'Stay on Page',
    });
  };

  const uploadLogo = async () => {
    const fd = new FormData();
    if (logoRef.current.files[0])  fd.append('logo',  logoRef.current.files[0]);
    if (logo2Ref.current.files[0]) fd.append('logo2', logo2Ref.current.files[0]);
    if (!fd.has('logo') && !fd.has('logo2')) { showToast('Select at least one file first', 'error'); return; }
    setLogoUploading(true);
    try {
      await fetch(`${API}/api/admin/companies/${id}/logo`, { method: 'POST', headers: authHeaders(false), body: fd });
      const updated = await (await fetch(`${API}/api/admin/companies/${id}`, { headers: authHeaders() })).json();
      // Append cache-buster so the browser doesn't show the old image
      const bust = `?t=${Date.now()}`;
      const logoPatch = {
        logo_url:  updated.logo_url  ? updated.logo_url  + bust : undefined,
        logo2_url: updated.logo2_url ? updated.logo2_url + bust : undefined,
      };
      setForm(p => ({ ...p, ...Object.fromEntries(Object.entries(logoPatch).filter(([,v]) => v)) }));
      setOriginalForm(p => ({ ...p, ...Object.fromEntries(Object.entries(logoPatch).filter(([,v]) => v)) }));
      logoRef.current.value  = '';
      logo2Ref.current.value = '';
      setLogoPreview(null);
      setLogo2Preview(null);
      showToast('Logos updated successfully!');
    } catch { showToast('Upload failed', 'error'); }
    finally { setLogoUploading(false); }
  };

  const deleteLogo = (which) => {
    const isPrimary = which === 'logo';
    showConfirm(
      'Delete Logo',
      isPrimary
        ? 'Remove the custom logo? The default logo.png will be used instead.'
        : 'Remove the secondary logo? This cannot be undone.',
      async () => {
        try {
          const res = await fetch(`${API}/api/admin/companies/${id}/logo/${which}`, { method: 'DELETE', headers: authHeaders(false) });
          if (!res.ok) { showToast('Failed to delete logo', 'error'); return; }
          const field = isPrimary ? 'logo_url' : 'logo2_url';
          setForm(p => ({ ...p, [field]: null }));
          setOriginalForm(p => ({ ...p, [field]: null }));
          showToast(isPrimary ? 'Custom logo removed — using default' : 'Logo deleted');
        } catch { showToast('Network error — could not delete logo', 'error'); }
      },
      true,
    );
  };

  const importCsv = async () => {
    if (!csvRef.current.files[0]) return;
    setImporting(true); setImportMsg('');
    const fd = new FormData();
    fd.append('file', csvRef.current.files[0]);
    try {
      const res  = await fetch(`${API}/api/admin/companies/${id}/import-shareholders`, { method: 'POST', headers: authHeaders(false), body: fd });
      const data = await res.json();
      setImportMsg(`${data.created} created · ${data.updated} updated${data.errors?.length ? ` · ${data.errors.length} skipped` : ''}`);
      showToast(`Import complete — ${data.created + data.updated} shareholders processed`);
      await loadShareholderCount(); // refresh count
    } catch { showToast('Import failed', 'error'); }
    finally { setImporting(false); }
  };

  const clearShareholders = () => {
    showConfirm(
      'Clear All Shareholder Records',
      'This will permanently delete every shareholder record for this company from the database. This action cannot be undone.',
      async () => {
        try {
          const res  = await fetch(`${API}/api/admin/companies/${id}/shareholders`, { method: 'DELETE', headers: authHeaders(false) });
          const data = await res.json();
          if (!res.ok) { showToast(data.error || 'Delete failed', 'error'); return; }
          setImportMsg('');
          setShareholderCount(0);
          showToast(`${data.deleted} shareholder record${data.deleted !== 1 ? 's' : ''} deleted`);
        } catch { showToast('Network error — could not delete records', 'error'); }
      },
      true,
    );
  };

  const field = (label, key, type = 'text', extra = {}) => (
    <div className="form-group" key={key}>
      <label className="label-text">{label}</label>
      <input type={type} value={form[key] || ''} onChange={e => set(key, e.target.value)}
        className="input" style={{ paddingLeft: '1rem' }} {...extra} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
          <button onClick={handleBack} className="secondary-btn">
            <FaArrowLeft /> Back
          </button>
          <h2 style={{ color: '#0f3d2e', margin: 0 }}>{isNew ? 'Add Company' : 'Edit Company'}</h2>
        </div>

        {error && <p className="error-message">{error}</p>}

        {/* ── Registration URL (edit only) ───────────────── */}
        {!isNew && form.slug && (
          <div style={{ ...card, background: '#f0fdf4', border: '1px solid #86efac', marginBottom: '1.25rem' }}>
            <p style={{ margin: '0 0 .5rem', fontSize: '.78rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '.05em' }}>Registration Link</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
              <code style={{ flex: 1, minWidth: 0, fontSize: '.875rem', color: '#0f3d2e', background: '#fff', padding: '.45rem .8rem', borderRadius: 7, border: '1px solid #bbf7d0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {window.location.origin}/{form.slug}
              </code>
              <button type="button" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${form.slug}`).then(() => showToast('Link copied!'))}
                style={{ background: '#fff', border: '1px solid #86efac', borderRadius: 7, padding: '.45rem .9rem', cursor: 'pointer', color: '#15803d', display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                <FaCopy size={12} /> Copy
              </button>
              <a href={`${window.location.origin}/${form.slug}`} target="_blank" rel="noreferrer"
                style={{ background: '#107b5f', border: 'none', borderRadius: 7, padding: '.45rem .9rem', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.82rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                <FaExternalLinkAlt size={11} /> Open
              </a>
            </div>
          </div>
        )}

        {/* ── Company Details ────────────────────────────── */}
        <div style={card}>
          <h4 style={{ color: '#0f3d2e', marginBottom: '1.25rem' }}>Company Details</h4>
          <form id="company-form" onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              {field('Company Name', 'name', 'text', { required: true })}
              {field('Slug (sahco)', 'slug', 'text', { required: true })}
              {field('Subdomain (sahco.apel.com.ng)', 'subdomain', 'text', { required: true })}

              <div className="form-group">
                <label className="label-text">Meeting Type</label>
                <select value={form.meeting_type || 'AGM'} onChange={e => set('meeting_type', e.target.value)}
                  className="input" style={{ paddingLeft: '1rem', appearance: 'auto' }}>
                  <option value="AGM">AGM – Annual General Meeting</option>
                  <option value="EGM">EGM – Extraordinary General Meeting</option>
                  <option value="Hybrid">Hybrid Meeting</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label-text">Meeting Date <EmailBadge /></label>
                <input type="date" value={form.meeting_date || ''} onChange={e => set('meeting_date', e.target.value)}
                  className="input" style={{ paddingLeft: '1rem' }} />
              </div>

              <div className="form-group">
                <label className="label-text">Meeting Time <EmailBadge /></label>
                <input type="time" value={form.meeting_time || ''} onChange={e => set('meeting_time', e.target.value)}
                  className="input" style={{ paddingLeft: '1rem' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="label-text">Zoom Link <EmailBadge /></label>
              <input type="url" value={form.zoom_link || ''} onChange={e => set('zoom_link', e.target.value)}
                className="input" style={{ paddingLeft: '1rem' }} placeholder="https://zoom.us/j/..." />
            </div>
            <div className="form-group">
              <label className="label-text">YouTube Link <EmailBadge /></label>
              <input type="url" value={form.youtube_link || ''} onChange={e => set('youtube_link', e.target.value)}
                className="input" style={{ paddingLeft: '1rem' }} placeholder="https://youtube.com/live/..." />
            </div>
            <p style={{ fontSize: '.77rem', color: '#94a3b8', gridColumn: '1 / -1', margin: '-.5rem 0 .5rem' }}>
              ✉️ Fields marked <strong style={{ color: '#107b5f' }}>In Email</strong> are included in confirmation emails sent to registered shareholders and guests.
            </p>

            <div className="form-group">
              <label className="label-text">Brand Colour</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <input type="color" value={form.primary_color || '#107b5f'}
                  onChange={e => set('primary_color', e.target.value)}
                  style={{ width: 44, height: 44, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0 }} />
                <span style={{ fontSize: '.9rem', color: '#64748b' }}>{form.primary_color}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="label-text">Registration Status</label>
              <button type="button" onClick={() => set('is_registration_open', !form.is_registration_open)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  background: form.is_registration_open ? '#f0fdf4' : '#f8fafc',
                  border: `2px solid ${form.is_registration_open ? '#86efac' : '#e2e8f0'}`,
                  borderRadius: 12, padding: '1rem 1.25rem', cursor: 'pointer',
                  width: '100%', textAlign: 'left', transition: 'all .2s', fontFamily: 'inherit',
                }}>
                <div style={{ width: 52, height: 28, borderRadius: 14, flexShrink: 0,
                  background: form.is_registration_open ? '#16a34a' : '#cbd5e1', position: 'relative', transition: 'background .2s' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute',
                    top: 3, left: form.is_registration_open ? 27 : 3, transition: 'left .2s ease', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', color: form.is_registration_open ? '#15803d' : '#64748b' }}>
                    {form.is_registration_open ? 'Registration OPEN' : 'Registration CLOSED'}
                  </div>
                  <div style={{ fontSize: '.8rem', color: '#94a3b8', marginTop: '.2rem' }}>
                    {form.is_registration_open ? 'Shareholders and guests can now register' : 'The registration page is locked for users'}
                  </div>
                </div>
              </button>
            </div>
          </form>
        </div>

        {/* ── Logos + Shareholders (edit only) ──────────── */}
        {!isNew && (
          <>
            {/* Logos */}
            <div style={card}>
              <h4 style={{ color: '#0f3d2e', marginBottom: '.5rem' }}>Header Logos</h4>
              <p style={{ fontSize: '.8rem', color: '#64748b', marginBottom: '1rem' }}>
                These logos appear in the registration page header. Upload both to brand the page for your company and its registrar.
              </p>

              {/* Mini header preview */}
              <div style={{
                background: '#0f3d2e', borderRadius: 8, padding: '.6rem 1.25rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  {(logoPreview || form.logo_url)
                    ? <img src={logoPreview || form.logo_url} alt="left logo" style={{ height: 32, objectFit: 'contain', background: '#fff', borderRadius: 4, padding: 2 }} />
                    : <div style={{ height: 32, width: 60, borderRadius: 4, border: '1px dashed rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.65rem' }}>LEFT</span>
                      </div>
                  }
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  {(logo2Preview || form.logo2_url)
                    ? <img src={logo2Preview || form.logo2_url} alt="right logo" style={{ height: 32, objectFit: 'contain', background: '#fff', borderRadius: 4, padding: 2 }} />
                    : <div style={{ height: 32, width: 60, borderRadius: 4, border: '1px dashed rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.65rem' }}>RIGHT</span>
                      </div>
                  }
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <LogoSlot label="← Left Logo (your company)" url={form.logo_url}  which="logo"  inputRef={logoRef}  fallback="/logo.png" onDelete={deleteLogo}
                  preview={logoPreview}
                  onFileChange={e => setLogoPreview(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null)} />
                <LogoSlot label="→ Right Logo (partner)" url={form.logo2_url} which="logo2" inputRef={logo2Ref} onDelete={deleteLogo}
                  preview={logo2Preview}
                  onFileChange={e => setLogo2Preview(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null)} />
              </div>
              <button type="button" onClick={uploadLogo} className="submit-btn" disabled={logoUploading}>
                {logoUploading ? <span className="spinner" /> : <><FaUpload /> Upload / Replace Logos</>}
              </button>
            </div>

            {/* Shareholders */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '.75rem' }}>
                <div>
                  <h4 style={{ color: '#0f3d2e', margin: '0 0 .4rem' }}>Shareholders</h4>

                  {/* Record count badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <FaUsers size={13} style={{ color: shareholderCount > 0 ? '#107b5f' : '#94a3b8' }} />
                    <span style={{ fontSize: '.82rem', fontWeight: 600,
                      color: shareholderCount > 0 ? '#107b5f' : '#94a3b8' }}>
                      {shareholderCount === null
                        ? 'Loading…'
                        : shareholderCount === 0
                          ? 'No records in database — import a file to get started'
                          : `${shareholderCount.toLocaleString()} records currently in database`}
                    </span>
                  </div>

                  <p style={{ fontSize: '.78rem', color: '#94a3b8', margin: '.5rem 0 0' }}>
                    Columns: <code>Account No, Name, Email, Phone, Holdings, CHN, RIN, Address</code>
                  </p>
                </div>

                {shareholderCount > 0 && (
                  <button type="button" onClick={clearShareholders} style={{ ...dangerBtn, padding: '.55rem 1rem' }}>
                    <FaTrash size={12} /> Clear All Records
                  </button>
                )}
              </div>

              <input type="file" ref={csvRef} accept=".csv,.xlsx,.xls"
                style={{ fontSize: '.85rem', marginBottom: '.75rem', display: 'block', width: '100%' }} />
              <button type="button" onClick={importCsv} className="submit-btn" style={{ background: '#0f3d2e' }} disabled={importing}>
                {importing ? <span className="spinner" /> : <><FaFileExcel /> {shareholderCount > 0 ? 'Replace / Add Shareholders' : 'Import Shareholders'}</>}
              </button>
              {importMsg && (
                <p style={{ marginTop: '.75rem', fontSize: '.875rem', color: '#107b5f', fontWeight: 600 }}>
                  {importMsg}
                </p>
              )}
            </div>
          </>
        )}

        {/* ── Save / Create — always at the bottom ──── */}
        {!isNew && isDirty && (
          <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '.65rem 1rem', marginBottom: '1rem', fontSize: '.82rem', color: '#92400e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            ⚠️ You have unsaved changes
          </div>
        )}
        <button
          type="button"
          onClick={handleSaveClick}
          className="submit-btn"
          disabled={saving || (!isNew && !isDirty)}
          style={{
            marginBottom: '3rem',
            opacity: !isNew && !isDirty ? 0.4 : 1,
            cursor: !isNew && !isDirty ? 'not-allowed' : 'pointer',
            transition: 'opacity .2s',
          }}
        >
          {saving ? <span className="spinner" /> : isNew ? 'Create Company' : 'Save Changes'}
        </button>
      </div>

      {/* Toast */}
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
          {toast.type === 'error' ? '❌' : <FaCheck />} {toast.msg}
        </div>
      )}

      {/* Confirm dialog — supports 2-button (delete/confirm) and 3-button (unsaved changes) layouts */}
      {confirm && (
        <div onClick={() => setConfirm(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          animation: 'toastSlideUp .2s ease',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 16, padding: '2rem',
            maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.22)',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%',
              background: confirm.danger ? '#fef2f2' : confirm.icon ? '#fffbeb' : '#f0fdf4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem', fontSize: '1.25rem' }}>
              {confirm.icon ?? (confirm.danger ? '🗑️' : '❓')}
            </div>
            <h3 style={{ color: '#0f3d2e', marginBottom: '.5rem', fontSize: '1.05rem' }}>{confirm.title}</h3>
            <p style={{ color: '#64748b', fontSize: '.875rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>{confirm.body}</p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {/* Cancel — always leftmost */}
              <button type="button" onClick={() => setConfirm(null)} className="secondary-btn">
                {confirm.cancelLabel || 'Cancel'}
              </button>
              {/* Secondary action (e.g. "Exit Without Saving") */}
              {confirm.onSecondary && (
                <button type="button"
                  onClick={async () => { setConfirm(null); await confirm.onSecondary(); }}
                  style={{ background: '#f1f5f9', color: '#dc2626', border: '1px solid #fecaca',
                    borderRadius: 8, padding: '.7rem 1.25rem', fontWeight: 700, fontSize: '.9rem',
                    fontFamily: 'inherit', cursor: 'pointer' }}>
                  {confirm.secondaryLabel}
                </button>
              )}
              {/* Primary action */}
              <button type="button"
                onClick={async () => { setConfirm(null); await confirm.onConfirm(); }}
                style={{ background: confirm.danger ? '#dc2626' : '#107b5f', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '.7rem 1.5rem', fontWeight: 700, fontSize: '.9rem',
                  fontFamily: 'inherit', cursor: 'pointer' }}>
                {confirm.confirmLabel ?? (confirm.danger ? 'Yes, Delete' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
