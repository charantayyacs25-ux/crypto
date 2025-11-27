import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Navbar from "./components/Navbar";
import Crypto from "./pages/Crypto";

const App = () => {
  const user = JSON.parse(localStorage.getItem("user"))?.username; // Get username correctly


  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protect the Crypto route */}
        <Route
          path="/crypto"
          element={user ? <Crypto /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
};

export default App;
