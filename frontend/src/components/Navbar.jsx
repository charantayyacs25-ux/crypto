import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")); // Get user from local storage

  const handleLogout = () => {
    localStorage.removeItem("user"); // Remove user from local storage
    navigate("/login"); // Redirect to login page
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div className="container">
        {/* Brand / Home Link */}
        <Link className="navbar-brand" to="/">Crypto App</Link>

        {/* Navbar Toggler (for mobile) */}
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">🏠 Home</Link>
            </li>
            {user && (
              <li className="nav-item">
                <Link className="nav-link" to="/crypto">📈 Crypto</Link>
              </li>
            )}
          </ul>

          {/* Right Side (Login / Logout) */}
          <ul className="navbar-nav">
            {user ? (
              <>
                <li className="nav-item">
                  <span className="nav-link fw-bold text-light">👤 {user.username}</span>
                </li>
                <li className="nav-item">
                  <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">🔑 Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/signup">✍️ Signup</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
