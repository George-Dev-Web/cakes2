import React from "react";
// 🔑 Import Outlet for nested routes, Navigate for redirection
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * The single Protected Route component used for both general and admin protection.
 * It uses the <Outlet /> pattern for nested routing (React Router v6 standard).
 * * @param {boolean} adminOnly - If true, restricts access to only admin users.
 */
const ProtectedRoute = ({ adminOnly = false }) => {
  const { currentUser, loading, isAdmin } = useAuth();

  // 1. Loading State: Important! We must wait for the session check to finish.
  if (loading) {
    // Return null or a simple loading spinner/skeleton to prevent flashing
    return <div>Loading...</div>;
  }

  // 2. Authentication Check (Applies to all protected routes)
  if (!currentUser) {
    // If NOT logged in, redirect to the login page.
    return <Navigate to="/login" replace />;
  }

  // 3. Admin Check (Only runs if adminOnly=true is passed to the Route element)
  if (adminOnly && !isAdmin()) {
    // If logged in, but not an admin, redirect them away from the admin area.
    console.warn("Access attempt by non-admin user blocked.");
    // Redirect to the general user dashboard, or home page, as appropriate.
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Authorized Access
  // If all checks pass, render the child component via Outlet
  // (e.g., Dashboard or AdminDashboard).
  return <Outlet />;
};

export default ProtectedRoute;
