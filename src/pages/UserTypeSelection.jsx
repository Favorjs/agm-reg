import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBuilding, FaUserTie, FaCheck, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { useCompany } from '../context/CompanyContext';

const fade   = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: .09 } } };

const UserTypeSelection = () => {
  const [userType, setUserType] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { company } = useCompany();
  const slug = company?.slug || 'dev';

  const options = [
    {
      value: 'shareholder',
      icon: <FaBuilding />,
      label: 'Shareholder',
      desc: `I own shares in ${company?.name || 'this company'}`,
    },
    {
      value: 'guest',
      icon: <FaUserTie />,
      label: 'Regulator / External Auditor',
      desc: 'Attending as a Regulator or External Auditor',
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userType) { setError('Please select a registration type to continue'); return; }
    navigate(userType === 'shareholder' ? `/${slug}/shareholder` : `/${slug}/guest`);
  };

  return (
    <motion.div
      className="user-type-container"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* ── Company branding hero ─────────────────────────── */}
      <motion.div variants={fade} style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 2px 20px rgba(0,0,0,.07)',
        maxWidth: 520,
        width: '100%',
        marginBottom: '1.5rem',
        borderLeft: '4px solid var(--primary)',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 2.5rem 1.5rem' }}>
          {company?.logo2_url
            ? <img src={company.logo2_url} alt="Partner" style={{ height: 72, maxWidth: 220, objectFit: 'contain' }} />
            : <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-.02em' }}>{company?.name}</div>
          }
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#f1f5f9', margin: '0 1.75rem' }} />

        {/* Company name + meeting info */}
        <div style={{ padding: '1rem 1.75rem 1.25rem', textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: '.95rem', color: '#1a202c', margin: '0 0 .65rem' }}>
            {company?.name}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '.65rem', flexWrap: 'wrap' }}>
            <span style={{
              background: '#f0fdf4', color: 'var(--primary)',
              border: '1px solid #bbf7d0',
              borderRadius: 20, padding: '.2rem .75rem',
              fontSize: '.72rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
            }}>
              {company?.meeting_type}
            </span>
            {company?.meeting_date && (
              <span style={{ color: '#64748b', fontSize: '.8rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                <FaCalendarAlt style={{ color: 'var(--primary)', opacity: .8, flexShrink: 0 }} />
                {company.meeting_date}
              </span>
            )}
            {company?.meeting_time && (
              <span style={{ color: '#64748b', fontSize: '.8rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                <FaClock style={{ color: 'var(--primary)', opacity: .8, flexShrink: 0 }} />
                {company.meeting_time}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Registration type selection card ─────────────── */}
      <motion.div variants={fade} className="user-type-card">
        <p className="page-subtitle" style={{ marginBottom: '1.25rem' }}>
          Select your registration type to continue
        </p>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="option-cards">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`option-card${userType === opt.value ? ' selected' : ''}`}
                onClick={() => { setUserType(opt.value); setError(''); }}
              >
                <span className="option-card-icon">{opt.icon}</span>
                <span className="option-card-text">
                  <span className="option-card-label">{opt.label}</span>
                  <span className="option-card-desc">{opt.desc}</span>
                </span>
                <span className="option-card-check">
                  {userType === opt.value && <FaCheck />}
                </span>
              </button>
            ))}
          </div>

          <button type="submit" className="submit-btn">
            Continue
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UserTypeSelection;
