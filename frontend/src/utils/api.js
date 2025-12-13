// frontend/src/utils/api.js (COMPLETE REVISION)
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // CRITICAL: Must be true to send and receive HTTP-only cookies
  withCredentials: true,
});

// --- REMOVED REQUEST INTERCEPTOR (No more localStorage token) ---

// Handle authentication errors (FIXED: Removes Redirect Loop)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 🔑 CRITICAL FIX: DO NOT REDIRECT OR TOUCH WINDOW.
      // Simply reject the promise. This allows AuthContext's useEffect to
      // catch the error and set currentUser to null, stopping the loop.
      console.warn("API 401 Unauthorized: Session check failed.");

      // We explicitly reject the promise for the caller to catch.
      return Promise.reject(error);
    }

    // For other errors (500, 404, etc.), reject as usual.
    return Promise.reject(error);
  }
);

// Auth API calls
export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  // Token is set in cookie. Return user data from response body.
  return {
    user: response.data.user,
    message: response.data.message || "Login successful",
  };
};

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);
  // Token is set in cookie. Return user data from response body.
  return {
    user: response.data.user,
    message: response.data.message || "Registration successful",
  };
};

// NEW: Logout utility function
export const logoutUser = async () => {
  // This call tells the Flask backend to unset the HTTP-only cookie.
  await api.post("/auth/logout");
  return { success: true };
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    // If the error is a 401, the interceptor rejects it, and AuthContext catches it.
    console.error("Error fetching current user:", error.response?.data);
    throw error;
  }
};

// --- All other API calls remain the same ---

export const fetchCakes = async () => {
  const response = await api.get("/cakes");
  return response.data;
};

export const submitOrder = async (orderData) => {
  try {
    const formattedData = {
      ...orderData,
      delivery_date: orderData.deliveryDate || orderData.delivery_date,
    };

    const response = await api.post("/orders", formattedData);
    return response.data;
  } catch (error) {
    console.error("Order submission error:", error.response?.data);
    throw error;
  }
};

export const fetchUserOrders = async () => {
  try {
    const response = await api.get("/orders/my-orders");
    return response.data;
  } catch (error) {
    console.error("Error fetching user orders:", error.response?.data);
    if (error.response?.status === 422) {
      throw new Error("Unable to fetch orders. Please try logging in again.");
    } else if (error.response?.status === 401) {
      // No localStorage removal needed now
      throw new Error("Session expired. Please log in again.");
    } else {
      throw new Error("Failed to load orders. Please try again later.");
    }
  }
};

export const cancelOrder = async (orderId) => {
  try {
    const response = await api.delete(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error("Error cancelling order:", error.response?.data);
    throw error;
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put("/auth/profile", profileData);
    return response.data;
  } catch (error) {
    console.error("Error updating profile:", error.response?.data);
    throw error;
  }
};

export const submitContactForm = async (formData) => {
  const response = await api.post("/contact", formData);
  return response.data;
};

export const fetchAdminStats = async () => {
  try {
    const response = await api.get("/admin/dashboard/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching admin stats:", error.response?.data);
    throw error;
  }
};

export const fetchAdminOrders = async (params = {}) => {
  try {
    const response = await api.get("/admin/orders", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching admin orders:", error.response?.data);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.put(`/admin/orders/${orderId}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating order status:", error.response?.data);
    throw error;
  }
};

export const fetchAdminCakes = async () => {
  try {
    const response = await api.get("/admin/cakes");
    return response.data;
  } catch (error) {
    console.error("Error fetching admin cakes:", error.response?.data);
    throw error;
  }
};

export const createCake = async (cakeData) => {
  try {
    const response = await api.post("/admin/cakes", cakeData);
    return response.data;
  } catch (error) {
    console.error("Error creating cake:", error.response?.data);
    throw error;
  }
};

export const updateCake = async (cakeId, cakeData) => {
  try {
    const response = await api.put(`/admin/cakes/${cakeId}`, cakeData);
    return response.data;
  } catch (error) {
    console.error("Error updating cake:", error.response?.data);
    throw error;
  }
};

export const deleteCake = async (cakeId) => {
  try {
    const response = await api.delete(`/admin/cakes/${cakeId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting cake:", error.response?.data);
    throw error;
  }
};

export const fetchAdminUsers = async (params = {}) => {
  try {
    const response = await api.get("/admin/users", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching admin users:", error.response?.data);
    throw error;
  }
};

export const fetchCustomizations = async () => {
  try {
    const response = await api.get("/customizations");
    return response.data;
  } catch (error) {
    console.error("Error fetching customizations:", error.response?.data);
    throw error;
  }
};

export default api;
