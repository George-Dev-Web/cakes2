// frontend/src/contexts/AuthContext.jsx (COMPLETE REVISION)
import { createContext, useContext, useState, useEffect } from "react";
// Import the new 'logoutUser' function
import {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
} from "../utils/api";
import { toast } from "react-toastify";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- REVISED PERSISTENT LOGIN (Breaks Reload Loop) ---
  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        // Session valid
        setCurrentUser(user);
      })
      .catch((error) => {
        // 🔑 FIX: Catch the error and set currentUser to null gracefully.
        // The API call failed (likely 401), meaning the session is dead.
        console.warn("Auth context session check failed. Logging user out.");
        setCurrentUser(null);
        // The reload loop is broken because we don't throw/redirect here.
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // --- REVISED LOGIN FUNCTION ---
  const login = async (email, password) => {
    const response = await loginUser(email, password);

    // Success is based on receiving user data, as the token is in the cookie.
    if (response.user) {
      setCurrentUser(response.user);
      toast.success("Login successful! 🎉");
      return { success: true };
    }

    toast.error(response.message || "Login failed ❌");
    return { success: false, message: response.message };
  };

  // --- REVISED REGISTER FUNCTION ---
  const register = async (userData) => {
    const response = await registerUser(userData);

    if (response.user) {
      setCurrentUser(response.user);
      toast.success("Registration successful! 🎉");
      return { success: true };
    }

    toast.error(response.message || "Registration failed ❌");
    return { success: false, message: response.message };
  };

  // --- REVISED LOGOUT FUNCTION ---
  const logout = async () => {
    await logoutUser(); // Tells Flask to destroy the cookie
    setCurrentUser(null);
    toast.info("Logged out successfully 👋");
  };

  const updateUser = (userData) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...userData,
    }));
  };

  const isAdmin = () => {
    return currentUser && currentUser.is_admin === true;
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    updateUser,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
