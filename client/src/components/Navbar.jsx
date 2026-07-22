import { Link, NavLink, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const username =
    localStorage.getItem("username") || "Candidate";

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    navigate("/login");
  }

  return (
    <nav className="main-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-icon">AI</span>

          <div>
            <strong>InterviewPro</strong>
            <small>AI Interview Platform</small>
          </div>
        </Link>

        <div className="navbar-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/history">History</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </div>

        <div className="navbar-user-section">
          <div className="navbar-user">
            <span className="user-avatar">
              {username.charAt(0).toUpperCase()}
            </span>

            <div>
              <strong>{username}</strong>
              <small>Candidate</small>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;