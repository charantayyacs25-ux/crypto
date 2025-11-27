import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div style={{ textAlign: "center", padding: "50px", backgroundColor: "#f4f4f4", minHeight: "100vh" }}>
      <h1 style={{ color: "#333", fontSize: "2.5rem", marginBottom: "20px" }}>Welcome to Crypto Tracker</h1>
      <p style={{ fontSize: "1.2rem", color: "#555" }}>
        Track live cryptocurrency prices and stay updated with the latest trends.
      </p>

      <div style={{ marginTop: "30px" }}>
        <Link to="/crypto" style={buttonStyle}>View Live Prices</Link>
      </div>
    </div>
  );
};

const buttonStyle = {
  display: "inline-block",
  padding: "10px 20px",
  margin: "10px",
  backgroundColor: "#ff9800",
  color: "white",
  textDecoration: "none",
  borderRadius: "5px",
  fontSize: "1rem",
  fontWeight: "bold",
};

export default Home;
