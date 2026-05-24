import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaVoteYea, FaThumbsUp, FaThumbsDown, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Success.css';

const fade   = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: .1 } } };

const Success = ({ shareholderData, onBackToHome }) => {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

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
          <p>Thank you for registering for the <strong>Skyway Aviation Handling Company PLC AGM</strong>.</p>
          {shareholderData?.email && (
            <p>A confirmation email has been sent to <strong>{shareholderData.email}</strong>.</p>
          )}
        </motion.div>

        <motion.div className="voting-instructions" variants={fade}>
          <h3><FaVoteYea /> Voting Instructions</h3>
          <ol>
            <li>Ensure you have the latest version of <strong>Zoom</strong> installed before the meeting.</li>
            <li>Join the Zoom meeting using the link provided in your invitation email.</li>
            <li>During the voting session, the host will launch the polling feature.</li>
            <li>
              When prompted, cast your vote:
              <div className="voting-options">
                <div className="option">
                  <FaThumbsUp className="option-icon" style={{ color: '#10b981' }} />
                  <span>Vote FOR the resolution</span>
                </div>
                <span className="option-or">OR</span>
                <div className="option">
                  <FaThumbsDown className="option-icon" style={{ color: '#ef4444' }} />
                  <span>Vote AGAINST the resolution</span>
                </div>
              </div>
            </li>
            <li>Select your vote from the options presented.</li>
            <li>Submit your vote before the time limit expires.</li>
          </ol>
        </motion.div>

        <motion.div className="next-steps" variants={fade}>
          <h4>What's Next?</h4>
          <p>You will receive a Zoom meeting link via email to join the AGM as a shareholder.</p>
        </motion.div>

        <motion.button
          className="back-home-btn"
          onClick={() => onBackToHome()}
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

export default Success;
