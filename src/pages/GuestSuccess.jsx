import { motion } from 'framer-motion';
import { FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';

const fade    = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: .1 } } };

const GuestSuccess = ({ guestData: propGuestData }) => {
  const { state } = useLocation();
  const guestData = propGuestData || state?.guestData;
  const navigate  = useNavigate();
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
        <motion.div className="success-icon" variants={fade}>
          <FaCheckCircle />
        </motion.div>

        <motion.h2 variants={fade}>Registration Successful!</motion.h2>

        <motion.div className="confirmation-message" variants={fade}>
          <p>Thank you for registering for the <strong>{company?.name} {company?.meeting_type}</strong>.</p>
          {guestData?.userType && (
            <p>Registered as: <strong style={{ textTransform: 'capitalize' }}>{guestData.userType}</strong></p>
          )}
        </motion.div>

        <motion.div className="next-steps" variants={fade}>
          <h4>What's Next?</h4>
          <p>You will receive a streaming link to watch and attend the {company?.meeting_type}.</p>
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

export default GuestSuccess;
