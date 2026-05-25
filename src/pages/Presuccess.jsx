import { motion } from 'framer-motion';
import { FaCheckCircle, FaEnvelope, FaClock, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import './Presuccess.css';

const fade    = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: .1 } } };

const PreRegistrationSuccess = () => {
  const navigate = useNavigate();
  const { company } = useCompany();
  const slug = company?.slug || '';

  return (
    <div className="success-container">
      <motion.div
        className="success-card motion-card"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="success-icon" variants={fade} style={{ color: 'var(--brand)' }}>
          <FaCheckCircle />
        </motion.div>

        <motion.h2 variants={fade}>Pre-Registration Complete!</motion.h2>

        <motion.div className="confirmation-message" variants={fade}>
          <p>Thank you for starting your registration process.</p>
          <p>
            <FaEnvelope style={{ marginRight: '.4rem', color: 'var(--brand)' }} />
            Check your email or SMS for a confirmation link to complete your registration.
          </p>
          <p>
            <FaClock style={{ marginRight: '.4rem', color: 'var(--accent)' }} />
            The confirmation link expires in <strong>15 minutes</strong>.
          </p>
        </motion.div>

        <motion.div className="next-steps" variants={fade}>
          <h4>What's Next?</h4>
          <p>After confirming via email or SMS, you'll be fully registered and will receive your meeting link.</p>
        </motion.div>

        <motion.button
          className="back-home-btn"
          onClick={() => navigate(slug ? `/${slug}` : '/')}
          variants={fade}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: .97 }}
        >
          Back to Home <FaArrowRight />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default PreRegistrationSuccess;
