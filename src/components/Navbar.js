import React from 'react'; 
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const Navbar = () => {
  const [showNavbar, setShowNavbar] = useState(false)

  const handleShowNavbar = () => {
    setShowNavbar(!showNavbar)
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo">
          {/* Replace with placeholder text */}
          <span>Logo</span>
        </div>
        <div className="menu-icon" onClick={handleShowNavbar}>
        </div>
        <div className={`nav-elements ${showNavbar && 'active'}`}>
          <ul>
            <li>
              <NavLink to="/AddProducts">Sell Products</NavLink>
            </li>
            <li>
              <NavLink to="/BuyProducts">Buy Products</NavLink>
            </li>
            <li>
              <NavLink to="/projects">Recent Transactions</NavLink>
            </li>
            <li>
              <NavLink to="/Accounts">Account</NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar