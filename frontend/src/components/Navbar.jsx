// // frontend/src/components/Navbar.jsx
// import { useState } from "react";
// import { Link } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import { useTheme } from "../contexts/ThemeContext";
// import "./Navbar.css";

// const Navbar = () => {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const { currentUser, logout } = useAuth();
//   const { isDarkMode, toggleTheme } = useTheme();

//   const toggleMenu = () => {
//     setIsMenuOpen(!isMenuOpen);
//   };

//   const handleLogout = () => {
//     logout();
//     setIsMenuOpen(false);
//   };

//   return (
//     <nav className="navbar">
//       <div className="nav-container">
//         <Link to="/" className="nav-logo">
//           Velvelt Bloom
//         </Link>

//         <div className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
//           <Link
//             to="/"
//             className="nav-link"
//             onClick={() => setIsMenuOpen(false)}
//           >
//             Home
//           </Link>
//           <Link
//             to="/order"
//             className="nav-link"
//             onClick={() => setIsMenuOpen(false)}
//           >
//             Order
//           </Link>

//           <li>
//             <Link to="/cakes">Cakes</Link>
//           </li>

//           <Link
//             to="/contact"
//             className="nav-link"
//             onClick={() => setIsMenuOpen(false)}
//           >
//             Contact
//           </Link>

//           {/* Theme Toggle */}
//           <button className="theme-toggle" onClick={toggleTheme}>
//             {isDarkMode ? "☀️" : "🌙"}
//           </button>

//           {currentUser ? (
//             <>
//               <Link
//                 to="/dashboard"
//                 className="nav-link"
//                 onClick={() => setIsMenuOpen(false)}
//               >
//                 Dashboard
//               </Link>
//               <button className="nav-link btn-logout" onClick={handleLogout}>
//                 Logout
//               </button>
//             </>
//           ) : (
//             <>
//               <Link
//                 to="/login"
//                 className="nav-link"
//                 onClick={() => setIsMenuOpen(false)}
//               >
//                 Login
//               </Link>
//               <Link
//                 to="/register"
//                 className="nav-link"
//                 onClick={() => setIsMenuOpen(false)}
//               >
//                 Register
//               </Link>
//             </>
//           )}
//         </div>

//         <div className="nav-right">
//           <button className="theme-toggle mobile-only" onClick={toggleTheme}>
//             {isDarkMode ? "☀️" : "🌙"}
//           </button>
//           <div className="nav-icon" onClick={toggleMenu}>
//             <span></span>
//             <span></span>
//             <span></span>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
// 🔑 Import the new cart hook
import { useCart } from "../contexts/CartContext";
import { FaShoppingCart, FaUser, FaSearch } from "react-icons/fa";

import "./Navbar.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  // 🔑 Get the cart item count from the context
  const { cartItemCount } = useCart();

  // ... (toggleMenu and handleLogout functions remain the same)
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar-new">
      {/* -------------------- Nav Logo Area -------------------- */}
      <div className="nav-logo-area">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🍰</span> Velvet Bloom
        </Link>

        <div className="nav-main-links desktop-only">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/order" className="nav-link">
            Order
          </Link>
          <Link to="/cakes" className="nav-link">
            Cakes
          </Link>
        </div>
      </div>

      {/* -------------------- Middle Section: Search Bar -------------------- */}
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

      {/* -------------------- Right Section: Icons and Auth -------------------- */}
      <div className="nav-utility-area">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>

        {/* 🔑 Cart Icon - Now dynamically displays the count */}
        {/* Note: I'm keeping the link to "/cart" for now, but you might change this
               to open a modal/sidebar instead of navigating to a dedicated page. */}
        <Link
          to="/checkout"
          className="utility-icon cart-icon-wrapper"
          aria-label="Shopping Cart"
        >
          <FaShoppingCart />
          {/* 🔑 Dynamic Cart Count */}
          {cartItemCount > 0 && (
            <span className="cart-count">{cartItemCount}</span>
          )}
        </Link>

        {/* User/Auth Icon */}
        {currentUser ? (
          <div className="auth-menu">
            {currentUser.is_admin && (
              <Link
                to="/admin"
                className="utility-icon user-dashboard"
                aria-label="Admin Dashboard"
              >
                <FaUser />
              </Link>
            )}
            <Link
              to="/dashboard"
              className="utility-icon user-dashboard"
              aria-label="Dashboard"
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

      {/* Mobile Menu (Keep your existing toggle logic for mobile responsiveness) */}
      <div className="mobile-menu-toggle" onClick={toggleMenu}>
        {/* Hamburger icon here */}
      </div>
    </nav>
  );
};

export default Navbar;
