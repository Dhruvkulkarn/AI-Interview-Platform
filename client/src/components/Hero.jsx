import { Link } from "react-router-dom";
import "../styles/Hero.css";

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <span className="hero-badge">
          🚀 AI Powered Interview Preparation
        </span>

        <h1>
          Ace Your <span>Technical Interviews</span> with AI
        </h1>

        <p>
          Practice real interview questions, receive instant AI feedback,
          analyze your performance, and improve your confidence before your
          dream job interview.
        </p>

        <div className="hero-buttons">
          <Link to="/dashboard">
            <button className="primary-btn">
              Start Interview
            </button>
          </Link>

          <Link to="/login">
            <button className="secondary-btn">
              Login
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;