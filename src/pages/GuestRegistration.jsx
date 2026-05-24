import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaIdBadge } from 'react-icons/fa';

const GuestRegistration = ({ setGuestData }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', userType: 'observer' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.userType) {
      setError('Please fill in all required fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.lasaco.apel.com.ng/api/register-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setGuestData(data.guest);
        navigate('/guest/success', { state: { guestData: data.guest } });
      }
    } catch {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'name',  label: 'Full Name',     type: 'text',  icon: <FaUser />,    placeholder: 'Enter your full name' },
    { name: 'email', label: 'Email Address', type: 'email', icon: <FaEnvelope />, placeholder: 'Enter your email address' },
    { name: 'phone', label: 'Phone Number',  type: 'tel',   icon: <FaPhone />,   placeholder: 'e.g. 08012345678' },
  ];

  return (
    <motion.div
      className="guest-registration-container"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="guest-registration-card">
        <p className="page-title">Guest Registration</p>
        <p className="page-subtitle">Fill in your details to register for the AGM</p>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          {fields.map(({ name, label, type, icon, placeholder }) => (
            <div className="form-group" key={name}>
              <label className="label-text">{label} *</label>
              <div className="input-wrap">
                <span className="input-icon">{icon}</span>
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  required
                />
              </div>
            </div>
          ))}

          <div className="form-group">
            <label className="label-text">Attending As</label>
            <div className="input-wrap">
              <span className="input-icon"><FaIdBadge /></span>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                style={{ paddingLeft: '2.6rem' }}
              >
                <option value="guest">Guest</option>
                <option value="regulator">Regulator</option>
                <option value="external-auditor">External Auditor</option>
              </select>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Complete Registration'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default GuestRegistration;
