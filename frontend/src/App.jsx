// // frontend/src/App.jsx
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { AuthProvider } from "./contexts/AuthContext";
// import { ThemeProvider } from "./contexts/ThemeContext";
// import Navbar from "./components/Navbar";
// import Home from "./pages/Home";
// import Order from "./pages/Order";
// import ContactPage from "./pages/ContactPage";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Dashboard from "./pages/Dashboard";
// import AdminDashboard from "./pages/Admin/AdminDashboard"; // Import AdminDashboard
// import ProtectedRoute from "./components/ProtectedRoute";
// import AdminProtectedRoute from "./components/AdminProtectedRoute"; // Import AdminProtectedRoute
// import "./App.css";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { MessageProvider } from "./contexts/MessageContext";
// import CakePortfolio from "./pages/CakePortfolio";

// function App() {
//   return (
//     <ThemeProvider>
//       <AuthProvider>
//         <MessageProvider>
//           <Router>
//             <div className="App">
//               <Navbar />
//               <Routes>
//                 <Route path="/" element={<Home />} />
//                 <Route path="/order" element={<Order />} />
//                 <Route path="/login" element={<Login />} />
//                 <Route path="/register" element={<Register />} />
//                 <Route path="/contact" element={<ContactPage />} />
//                 <Route path="/cakes" element={<CakePortfolio />} />

//                 <Route
//                   path="/dashboard"
//                   element={
//                     <ProtectedRoute>
//                       <Dashboard />
//                     </ProtectedRoute>
//                   }
//                 />
//                 {/* Add Admin Dashboard Route */}
//                 <Route
//                   path="/admin"
//                   element={
//                     <AdminProtectedRoute>
//                       <AdminDashboard />
//                     </AdminProtectedRoute>
//                   }
//                 />
//               </Routes>

//               {/* Toast Container */}
//               <ToastContainer
//                 position="top-right"
//                 autoClose={3000}
//                 hideProgressBar={false}
//                 newestOnTop={false}
//                 closeOnClick
//                 pauseOnHover
//                 draggable
//                 theme="colored"
//               />
//             </div>
//           </Router>
//         </MessageProvider>
//       </AuthProvider>
//     </ThemeProvider>
//   );
// }

// export default App;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MessageProvider } from "./contexts/MessageContext"; // Keep imports clean
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Order from "./pages/Order";
import ContactPage from "./pages/ContactPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard"; // User Profile/Account Dashboard
import AdminDashboard from "./pages/Admin/AdminDashboard"; // Admin Area
import ProtectedRoute from "./components/ProtectedRoute"; // 🔑 Use ONE ProtectedRoute component

import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CakePortfolio from "./pages/CakePortfolio";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MessageProvider>
          <Router>
            <div className="App">
              <Navbar />
              <Routes>
                {/* -------------------- 1. PUBLIC ROUTES -------------------- */}
                <Route path="/" element={<Home />} />
                <Route path="/order" element={<Order />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/cakes" element={<CakePortfolio />} />

                {/* -------------------- 2. PROTECTED ROUTES -------------------- */}
                {/* 🔑 User Dashboard/Profile Route */}
                {/* Define the wrapper component on the parent Route element */}
                <Route element={<ProtectedRoute />}>
                  {/* The Dashboard page is rendered by the <Outlet /> inside ProtectedRoute */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  {/* Add other user-only routes here (e.g., /profile, /orders) */}
                </Route>

                {/* 🔑 Admin Dashboard Route */}
                {/* Define the wrapper component on the parent Route element and pass the flag */}
                {/* This requires ProtectedRoute to accept the 'adminOnly' prop. */}
                <Route element={<ProtectedRoute adminOnly={true} />}>
                  {/* The AdminDashboard is rendered by the <Outlet /> inside ProtectedRoute */}
                  <Route path="/admin" element={<AdminDashboard />} />
                  {/* Add other admin sub-routes here (e.g., /admin/users, /admin/cakes) */}
                </Route>

                {/* -------------------- 3. FALLBACK ROUTE -------------------- */}
                <Route path="*" element={<div>404 Not Found</div>} />
              </Routes>

              {/* Toast Container - Consistent placement is good */}
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
        </MessageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
