import { Link } from "react-router-dom";
import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="footer-logo-icon">AI</span>

            <div>
              <strong>InterviewPro</strong>
              <small>AI Interview Platform</small>
            </div>
          </Link>

          <p>
            Prepare for technical and HR interviews with AI-powered practice,
            instant feedback, resume analysis, and performance tracking.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <h3>Platform</h3>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/history">Interview History</Link>
            <Link to="/analytics">Analytics</Link>
          </div>

          <div>
            <h3>Account</h3>
            <Link to="/profile">Profile</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 InterviewPro. All rights reserved.</p>

        <p>Built for smarter interview preparation.</p>
      </div>
    </footer>
  );
}

export default Footer;