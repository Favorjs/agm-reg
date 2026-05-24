import { motion } from 'framer-motion';
import { FaCheckCircle, FaEnvelope, FaClock, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Presuccess.css';

const fade    = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: .1 } } };

const PreRegistrationSuccess = () => (
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
        <p>After confirming via email or SMS, you'll be fully registered and will receive your Zoom meeting link.</p>
      </motion.div>

      <motion.div variants={fade}>
        <Link to="https://lasaco.apel.com.ng/" className="back-home-btn">
          Back to Home <FaArrowRight />
        </Link>
      </motion.div>
    </motion.div>
  </div>
);

export default PreRegistrationSuccess;
