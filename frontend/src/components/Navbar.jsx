import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => (
  <div className="card">
    <Link to="/">Home</Link> |{" "}
    <Link to="/upload">Upload Meeting</Link> |{" "}
    <Link to="/live">Live Meeting Bot</Link>
  </div>
);

export default Navbar;
