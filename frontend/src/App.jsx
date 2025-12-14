// frontend/src/App.jsx (REVISED)

// frontend/src/App.jsx
import { useState } from "react"; // 🔑 Import useState for cart state
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MessageProvider } from "./contexts/MessageContext";
import { CartProvider } from "./contexts/CartContext";

import Navbar from "./components/Navbar";
// 🔑 Import the CartSidebar component
import CartSidebar from "./components/CartSidebar";
import Home from "./pages/Home";
import Order from "./pages/Order";
import ContactPage from "./pages/ContactPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import CakePortfolio from "./pages/CakePortfolio";
import CheckoutPage from "./pages/CheckoutPage";

import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  // 🔑 STEP 1: State to control the visibility of the cart sidebar
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 🔑 STEP 2: Function to toggle the cart
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  // A flowchart showing the data flow for the Cart Sidebar:

  return (
    <ThemeProvider>
      <AuthProvider>
        <MessageProvider>
          <CartProvider>
            <Router>
              <div className="App">
                {/* 🔑 STEP 3: Pass the toggle function to the Navbar */}
                <Navbar onCartClick={toggleCart} />

                {/* 🔑 STEP 4: Render the CartSidebar component */}
                <CartSidebar
                  isOpen={isCartOpen}
                  onClose={() => setIsCartOpen(false)} // Pass a function to close it from within the sidebar
                />

                <Routes>
                  {/* -------------------- 1. PUBLIC ROUTES -------------------- */}
                  <Route path="/" element={<Home />} />
                  <Route path="/order" element={<Order />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/cakes" element={<CakePortfolio />} />
                  <Route path="/checkout" element={<CheckoutPage />} />

                  {/* -------------------- 2. PROTECTED ROUTES -------------------- */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                  </Route>

                  {/* 🔑 Admin Dashboard Route */}
                  <Route element={<ProtectedRoute adminOnly={true} />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                  </Route>

                  {/* -------------------- 3. FALLBACK ROUTE -------------------- */}
                  <Route path="*" element={<div>404 Not Found</div>} />
                </Routes>

                <ToastContainer
                  position="top-right"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  pauseOnHover
                  draggable
                  theme="colored"
                />
              </div>
            </Router>
          </CartProvider>
        </MessageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
