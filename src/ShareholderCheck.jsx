import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaUser, FaIdCard, FaEnvelope, FaPhone, FaChevronRight, FaArrowLeft } from 'react-icons/fa';

const fade   = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: .35 } } };
const stagger = { visible: { transition: { staggerChildren: .07 } } };

const ShareholderCheck = ({ setShareholderData }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm]             = useState('');
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState('');
  const [results, setResults]                   = useState(null);
  const [selectedShareholder, setSelectedShareholder] = useState(null);
  const [editedEmail, setEditedEmail]           = useState('');
  const [editedPhone, setEditedPhone]           = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setError(''); setLoading(true); setResults(null); setSelectedShareholder(null);
    setEditedEmail(''); setEditedPhone('');

    try {
      const res  = await fetch('https://api.lasaco.apel.com.ng/api/check-shareholder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm }),
      });
      const data = await res.json();

      if (data.status === 'account_match' || data.status === 'chn_match') {
        setSelectedShareholder(data.shareholder);
        setEditedEmail(data.shareholder.email || '');
        setEditedPhone(data.shareholder.phone_number || '');
      } else if (data.status === 'name_matches') {
        setResults(data.shareholders);
      } else {
        setError(data.message || 'No matching shareholders found');
      }
    } catch {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedShareholder) return;
    if (!editedEmail && !editedPhone && !selectedShareholder.email && !selectedShareholder.phone_number) {
      setError('Please provide an email address or phone number'); return;
    }
    if (editedPhone && !/^(\+234|0)[789]\d{9}$/.test(editedPhone)) {
      setError('Please enter a valid Nigerian phone number (starting with 0 or +234)'); return;
    }
    if (editedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedEmail)) {
      setError('Please enter a valid email address'); return;
    }

    setLoading(true); setError('');
    const updated = {
      ...selectedShareholder,
      email:        editedEmail        || selectedShareholder.email,
      phone_number: editedPhone        || selectedShareholder.phone_number,
    };

    try {
      const res  = await fetch('https://api.lasaco.apel.com.ng/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acno: updated.acno, email: updated.email, phone_number: updated.phone_number, chn: updated.chn }),
      });
      const data = await res.json();
      if (res.ok) {
        setShareholderData(updated);
        navigate('/shareholder/presuccess');
      } else {
        setError(data.error || 'Registration failed or shareholder already registered');
      }
    } catch {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResults(null); setSelectedShareholder(null); setSearchTerm(''); setError(''); };

  const selectFromList = (sh) => {
    setSelectedShareholder(sh);
    setEditedEmail(sh.email || '');
    setEditedPhone(sh.phone_number || '');
    setResults(null);
  };

  return (
    <div className="verification-container">
      <div className="verification-form">
        <AnimatePresence mode="wait">

          {/* ── Search ── */}
          {!selectedShareholder && !results && (
            <motion.div key="search" variants={stagger} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
              <motion.p variants={fade} className="page-title">Skyway Aviation Handling Company PLC</motion.p>
              <motion.p variants={fade} style={{ textAlign:'left', fontWeight:600, color:'var(--brand)', marginBottom:'.25rem', fontSize:'.9rem' }}>
                AGM REGISTRATION
              </motion.p>
              <motion.p variants={fade} className="page-subtitle">
                Search by name, CHN or registrar account number
              </motion.p>

              <motion.div variants={fade} className="alert alert-warning" style={{ marginBottom:'1.25rem' }}>
                You must have a valid email or phone number on record to attend the AGM.
              </motion.div>

              <form onSubmit={handleSearch}>
                <motion.div variants={fade} className="form-group">
                  <label className="label-text">Search Shareholder</label>
                  <div className="input-wrap search-wrap">
                    <span className="input-icon"><FaSearch /></span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Name, CHN or Account Number"
                      required
                    />
                  </div>
                </motion.div>

                <motion.button
                  variants={fade}
                  type="submit"
                  className="submit-btn"
                  disabled={loading || !searchTerm.trim()}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: .98 }}
                >
                  {loading ? <span className="spinner" /> : <><FaSearch /> Search</>}
                </motion.button>
              </form>

              {error && (
                <motion.p className="error" initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}>
                  {error}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* ── Results list ── */}
          {results && !selectedShareholder && (
            <motion.div key="results" variants={stagger} initial="hidden" animate="visible" exit={{ opacity:0 }}>
              <motion.p variants={fade} className="page-title">Select Your Account</motion.p>
              <motion.p variants={fade} className="page-subtitle">
                {results.length} match{results.length !== 1 ? 'es' : ''} found — select the correct account
              </motion.p>

              <div className="results-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Account No</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((sh, i) => (
                      <motion.tr
                        key={sh.acno}
                        initial={{ opacity:0, y:6 }}
                        animate={{ opacity:1, y:0 }}
                        transition={{ delay: i * .04 }}
                      >
                        <td>{sh.name}</td>
                        <td>{sh.acno}</td>
                        <td>
                          <button className="select-btn" onClick={() => selectFromList(sh)}>
                            Select <FaChevronRight />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button className="secondary-btn" onClick={reset} style={{ marginTop:'.75rem' }}>
                <FaArrowLeft /> Back to Search
              </button>
            </motion.div>
          )}

          {/* ── Verify details ── */}
          {selectedShareholder && (
            <motion.div key="verify" variants={stagger} initial="hidden" animate="visible" exit={{ opacity:0 }}>
              <motion.p variants={fade} className="page-title">Verify Your Details</motion.p>
              <motion.p variants={fade} className="page-subtitle">
                Confirm the details below match your records. Add contact info if missing.
              </motion.p>

              <motion.div variants={fade} className="alert alert-info">
                Your email and phone number displayed are exactly what we have on file. Fill in any missing fields.
              </motion.div>

              <motion.div variants={fade} className="shareholder-details">
                <div className="detail-row">
                  <FaUser className="detail-icon" />
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{selectedShareholder.name}</span>
                </div>

                <div className="detail-row">
                  <FaIdCard className="detail-icon" />
                  <span className="detail-label">Account No</span>
                  <span className="detail-value">{selectedShareholder.acno}</span>
                </div>

                <div className="detail-row">
                  <FaEnvelope className="detail-icon" />
                  <span className="detail-label">Email</span>
                  {selectedShareholder.email
                    ? <span className="detail-value">{selectedShareholder.email}</span>
                    : <input
                        type="email"
                        className="inline-input"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        placeholder="Enter email address"
                      />
                  }
                </div>

                <div className="detail-row">
                  <FaPhone className="detail-icon" />
                  <span className="detail-label">Phone</span>
                  {selectedShareholder.phone_number
                    ? <span className="detail-value">{selectedShareholder.phone_number}</span>
                    : <input
                        type="tel"
                        className="inline-input"
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        placeholder="e.g. 08012345678"
                      />
                  }
                </div>
              </motion.div>

              {error && (
                <motion.p className="error" initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}>
                  {error}
                </motion.p>
              )}

              <motion.div variants={fade} className="action-buttons">
                <button className="secondary-btn" onClick={reset}>
                  <FaArrowLeft /> Back
                </button>
                <motion.button
                  className="submit-btn"
                  style={{ flex:1, margin:0 }}
                  onClick={handleRegister}
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: .98 }}
                >
                  {loading ? <span className="spinner" /> : 'Confirm Registration'}
                </motion.button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default ShareholderCheck;
