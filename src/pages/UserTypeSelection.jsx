import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBuilding, FaUserTie, FaCheck } from 'react-icons/fa';

const options = [
  {
    value: 'shareholder',
    icon: <FaBuilding />,
    label: 'Shareholder',
    desc: 'I own shares in Skyway Aviation Handling Company PLC',
  },
  {
    value: 'guest',
    icon: <FaUserTie />,
    label: 'Guest / Regulator / Observer',
    desc: 'Attending as a Guest, Regulator, or External Auditor',
  },
];

const UserTypeSelection = () => {
  const [userType, setUserType] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userType) { setError('Please select a registration type to continue'); return; }
    navigate(userType === 'shareholder' ? '/shareholder' : '/guest');
  };

  return (
    <motion.div
      className="user-type-container"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="user-type-card">
        <p className="page-title">Skyway Aviation Handling Company PLC</p>
        <p style={{ textAlign: 'center', fontWeight: 600, color: 'var(--brand)', marginBottom: '.25rem', fontSize: '.9rem' }}>
          AGM REGISTRATION
        </p>
        <p className="page-subtitle">Select your registration type to continue</p>

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
      </div>
    </motion.div>
  );
};

export default UserTypeSelection;
