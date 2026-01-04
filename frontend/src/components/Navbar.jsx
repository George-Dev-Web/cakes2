import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useCart } from "../contexts/CartContext";
import CartSidebar from "./CartSidebar";
import {
  FaShoppingCart,
  FaUser,
  FaSearch,
  FaBars,
  FaTimes,
} from "react-icons/fa"; // Added Bars/Times icons

import "./Navbar.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { cartItemCount } = useCart();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar-new">
        <div className="nav-logo-area">
          {/* Mobile Menu Toggle - Uses toggleMenu now! */}
          <button
            className="mobile-menu-btn"
            onClick={toggleMenu}
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <Link to="/" className="nav-logo">
            <span className="logo-icon">🍰</span> Velvet Bloom
          </Link>

          <div
            className={`nav-main-links ${
              isMenuOpen ? "mobile-active" : "desktop-only"
            }`}
          >
            <Link
              to="/"
              className="nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/order"
              className="nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Order
            </Link>
            <Link
              to="/cakes"
              className="nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Cakes
            </Link>
          </div>
        </div>

        <div className="nav-search-bar">
          <input
            type="text"
            placeholder="Search cakes..."
            className="search-input"
          />
          <button className="search-button" aria-label="Search">
            <FaSearch />
          </button>
        </div>

        <div className="nav-utility-area">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>

          <div
            className="utility-icon cart-icon-wrapper"
            onClick={() => setIsCartOpen(true)}
            style={{ cursor: "pointer" }}
          >
            <FaShoppingCart />
            {cartItemCount > 0 && (
              <span className="cart-count">{cartItemCount}</span>
            )}
          </div>

          {currentUser ? (
            <div className="auth-menu">
              <Link
                to={currentUser.is_admin ? "/admin" : "/dashboard"}
                className="utility-icon"
              >
                <FaUser />
              </Link>
              <button className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-login">
              <FaUser /> Login
            </Link>
          )}
        </div>
      </nav>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar;
