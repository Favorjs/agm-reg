import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaArrowRight } from 'react-icons/fa';
import { API } from '../context/CompanyContext';

export default function CompanySelector() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'AGM/EGM Registration – Apel Capital Registrars';
    fetch(`${API}/api/company/list`)
      .then(r => r.json())
      .then(setCompanies)
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ color: '#0f3d2e', margin: 0, fontSize: '1.75rem' }}>Meeting Registration Portal</h1>
          <p style={{ color: '#64748b', marginTop: '.5rem', fontSize: '.95rem' }}>
            Select your company below to register for an upcoming AGM or EGM.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ borderTopColor: '#107b5f', borderColor: 'rgba(0,0,0,.1)', width: 36, height: 36, borderWidth: 3, margin: '0 auto' }} />
          </div>
        ) : companies.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 0', fontSize: '1rem' }}>
            No meetings are currently open for registration. Please check back later.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {companies.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => c.is_registration_open && navigate(`/${c.slug}`)}
                style={{
                  background: '#fff', borderRadius: 14, padding: '1.4rem 1.6rem',
                  cursor: c.is_registration_open ? 'pointer' : 'default',
                  boxShadow: '0 0 0 1px rgba(0,0,0,.07)',
                  display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
                  transition: 'box-shadow .2s, transform .2s',
                  opacity: c.is_registration_open ? 1 : 0.65,
                }}
                whileHover={c.is_registration_open ? { scale: 1.01, boxShadow: '0 6px 28px rgba(0,0,0,.12)' } : {}}
                whileTap={c.is_registration_open ? { scale: .99 } : {}}
              >
                {c.logo_url && (
                  <img src={c.logo_url} alt={c.name} style={{ height: 52, width: 80, objectFit: 'contain', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, margin: 0, color: '#1a202c', fontSize: '1.05rem', lineHeight: 1.3 }}>{c.name}</p>
                  <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '.83rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: c.primary_color || '#107b5f' }}>{c.meeting_type}</span>
                    {c.meeting_date && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                        <FaCalendarAlt style={{ opacity: .6 }} /> {c.meeting_date}
                      </span>
                    )}
                    {c.meeting_time && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                        <FaClock style={{ opacity: .6 }} /> {c.meeting_time}
                      </span>
                    )}
                  </p>
                </div>
                {c.is_registration_open ? (
                  <span style={{
                    background: c.primary_color || '#107b5f', color: '#fff',
                    borderRadius: 8, padding: '.4rem .9rem',
                    fontSize: '.8rem', fontWeight: 700, flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: '.4rem',
                  }}>
                    Register <FaArrowRight />
                  </span>
                ) : (
                  <span style={{
                    background: '#f1f5f9', color: '#94a3b8',
                    borderRadius: 8, padding: '.4rem .9rem',
                    fontSize: '.8rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    Closed
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '.8rem', marginTop: '3rem' }}>
          Powered by Apel Capital Registrars Limited
        </p>
      </div>
    </div>
  );
}
