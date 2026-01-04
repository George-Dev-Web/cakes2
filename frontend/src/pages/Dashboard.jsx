// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { formatPrice } from "../utils/formatting";
import { fetchUserOrders, cancelOrder, updateUserProfile } from "../utils/api";
import "./Dashboard.css";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [preferencesData, setPreferencesData] = useState({});
  const { currentUser, updateUser } = useAuth();
  const _navigate = useNavigate();



  useEffect(() => {
    const getUserOrders = async () => {
      try {
        const userOrders = await fetchUserOrders();
        setOrders(userOrders);
      } catch (err) {
        setError("Failed to load your orders. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getUserOrders();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
      });

      setPreferencesData(
        currentUser.preferences || {
          favoriteCakeType: "",
          dietaryRestrictions: "",
          specialOccasions: "",
        }
      );
    }
  }, [currentUser]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: "status-pending", text: "Pending" },
      confirmed: { class: "status-confirmed", text: "Confirmed" },
      completed: { class: "status-completed", text: "Completed" },
      cancelled: { class: "status-cancelled", text: "Cancelled" },
    };

    const config = statusConfig[status] || {
      class: "status-pending",
      text: status,
    };
    return (
      <span className={`status-badge ${config.class}`}>{config.text}</span>
    );
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      await cancelOrder(orderId);
      setSuccessMessage("Order cancelled successfully!");

      // Refresh orders list
      const updatedOrders = await fetchUserOrders();
      setOrders(updatedOrders);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to cancel order. Please try again.");
      console.error(err);
    }
  };

  const handleProfileEdit = () => {
    setIsEditingProfile(true);
  };

  const handleProfileSave = async () => {
    try {
      const updatedUser = await updateUserProfile(profileData);
      updateUser(updatedUser);
      setSuccessMessage("Profile updated successfully!");
      setIsEditingProfile(false);

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      console.error(err);
    }
  };

  const handleProfileCancel = () => {
    setProfileData({
      name: currentUser.name || "",
      phone: currentUser.phone || "",
      address: currentUser.address || "",
    });
    setIsEditingProfile(false);
  };

  const handlePreferencesEdit = () => {
    setIsEditingPreferences(true);
  };

  const handlePreferencesSave = async () => {
    try {
      const updatedUser = await updateUserProfile({
        preferences: preferencesData,
      });
      updateUser(updatedUser);
      setSuccessMessage("Preferences updated successfully!");
      setIsEditingPreferences(false);

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to update preferences. Please try again.");
      console.error(err);
    }
  };

  const handlePreferencesCancel = () => {
    setPreferencesData(
      currentUser.preferences || {
        favoriteCakeType: "",
        dietaryRestrictions: "",
        specialOccasions: "",
      }
    );
    setIsEditingPreferences(false);
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePreferencesChange = (e) => {
    setPreferencesData({
      ...preferencesData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDietaryRestrictionChange = (e) => {
    const { value, checked } = e.target;
    const currentRestrictions =
      preferencesData.dietaryRestrictions?.split(",") || [];

    let newRestrictions;
    if (checked) {
      newRestrictions = [...currentRestrictions, value].filter(Boolean);
    } else {
      newRestrictions = currentRestrictions.filter((item) => item !== value);
    }

    setPreferencesData({
      ...preferencesData,
      dietaryRestrictions: newRestrictions.join(","),
    });
  };

  if (loading)
    return <div className="dashboard-loading">Loading your dashboard...</div>;
  if (error) return <div className="dashboard-error">{error}</div>;

  return (
    <div className="dashboard">
      <div className="container">
        {/* Welcome Header */}
        <div className="dashboard-header">
          <h1>Welcome back, {currentUser.name}!</h1>
          <p>
            Here's your personalized dashboard with all your cake ordering
            details.
          </p>
        </div>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        <div className="dashboard-grid">
          {/* Profile Card */}
          <div className="dashboard-card profile-card">
            <div className="card-header">
              <h2>Your Profile</h2>
              <span className="card-icon">👤</span>
            </div>
            <div className="profile-info">
              {isEditingProfile ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Full Name:</label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone:</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      placeholder="Your phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address:</label>
                    <textarea
                      name="address"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      placeholder="Your delivery address"
                      rows="3"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="info-item">
                    <label>Full Name:</label>
                    <span>{currentUser.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{currentUser.email}</span>
                  </div>
                  {currentUser.phone && (
                    <div className="info-item">
                      <label>Phone:</label>
                      <span>{currentUser.phone}</span>
                    </div>
                  )}
                  {currentUser.address && (
                    <div className="info-item">
                      <label>Address:</label>
                      <span>{currentUser.address}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="card-actions">
              {isEditingProfile ? (
                <>
                  <button className="btn-primary" onClick={handleProfileSave}>
                    Save Changes
                  </button>
                  <button className="btn-outline" onClick={handleProfileCancel}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="btn-outline" onClick={handleProfileEdit}>
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Preferences Card */}
          <div className="dashboard-card preferences-card">
            <div className="card-header">
              <h2>Your Preferences</h2>
              <span className="card-icon">⭐</span>
            </div>
            <div className="preferences-info">
              {isEditingPreferences ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Favorite Cake Type:</label>
                    <select
                      name="favoriteCakeType"
                      value={preferencesData.favoriteCakeType || ""}
                      onChange={handlePreferencesChange}
                    >
                      <option value="">Select your favorite</option>
                      <option value="chocolate">Chocolate</option>
                      <option value="vanilla">Vanilla</option>
                      <option value="red-velvet">Red Velvet</option>
                      <option value="lemon">Lemon</option>
                      <option value="carrot">Carrot</option>
                      <option value="cheesecake">Cheesecake</option>
                      <option value="fruit">Fruit Cake</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Dietary Restrictions:</label>
                    <div className="checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          value="gluten-free"
                          checked={(
                            preferencesData.dietaryRestrictions || ""
                          ).includes("gluten-free")}
                          onChange={handleDietaryRestrictionChange}
                        />
                        Gluten Free
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          value="dairy-free"
                          checked={(
                            preferencesData.dietaryRestrictions || ""
                          ).includes("dairy-free")}
                          onChange={handleDietaryRestrictionChange}
                        />
                        Dairy Free
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          value="nut-free"
                          checked={(
                            preferencesData.dietaryRestrictions || ""
                          ).includes("nut-free")}
                          onChange={handleDietaryRestrictionChange}
                        />
                        Nut Free
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          value="vegan"
                          checked={(
                            preferencesData.dietaryRestrictions || ""
                          ).includes("vegan")}
                          onChange={handleDietaryRestrictionChange}
                        />
                        Vegan
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Special Occasions:</label>
                    <input
                      type="text"
                      name="specialOccasions"
                      value={preferencesData.specialOccasions || ""}
                      onChange={handlePreferencesChange}
                      placeholder="e.g., Birthday, Anniversary, Wedding"
                    />
                  </div>
                </div>
              ) : currentUser.preferences &&
                Object.keys(currentUser.preferences).length > 0 ? (
                <>
                  {currentUser.preferences.favoriteCakeType && (
                    <div className="preference-item">
                      <label>Favorite Cake:</label>
                      <span className="preference-value">
                        {currentUser.preferences.favoriteCakeType
                          .split("-")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </span>
                    </div>
                  )}
                  {currentUser.preferences.dietaryRestrictions && (
                    <div className="preference-item">
                      <label>Dietary Needs:</label>
                      <span className="preference-value">
                        {currentUser.preferences.dietaryRestrictions
                          .split(",")
                          .filter(Boolean)
                          .map((restriction) =>
                            restriction
                              .split("-")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")
                          )
                          .join(", ")}
                      </span>
                    </div>
                  )}
                  {currentUser.preferences.specialOccasions && (
                    <div className="preference-item">
                      <label>Special Occasions:</label>
                      <span className="preference-value">
                        {currentUser.preferences.specialOccasions}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-preferences">
                  <p>You haven't set any preferences yet.</p>
                  <p>
                    Set your preferences to get personalized cake
                    recommendations!
                  </p>
                </div>
              )}
            </div>
            <div className="card-actions">
              {isEditingPreferences ? (
                <>
                  <button
                    className="btn-primary"
                    onClick={handlePreferencesSave}
                  >
                    Save Preferences
                  </button>
                  <button
                    className="btn-outline"
                    onClick={handlePreferencesCancel}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button className="btn-outline" onClick={handlePreferencesEdit}>
                  Update Preferences
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="dashboard-card actions-card">
            <div className="card-header">
              <h2>Quick Actions</h2>
              <span className="card-icon">⚡</span>
            </div>
            <div className="quick-actions">
              <Link to="/Order" className="action-btn primary">
                <span className="action-icon">🎂</span>
                <span className="action-text">Order New Cake</span>
              </Link>
              <Link to="/" className="action-btn secondary">
                <span className="action-icon">👀</span>
                <span className="action-text">Browse Cakes</span>
              </Link>
              <Link to="#contact" className="action-btn secondary">
                <span className="action-icon">📞</span>
                <span className="action-text">Contact Us</span>
              </Link>
            </div>
          </div>

          {/* Orders Card */}
          <div className="dashboard-card orders-card">
            <div className="card-header">
              <h2>Your Orders</h2>
              <span className="card-icon">📦</span>
            </div>

            {orders.length === 0 ? (
              <div className="no-orders">
                <div className="no-orders-icon">🍰</div>
                <h3>No orders yet</h3>
                <p>You haven't placed any orders with us yet.</p>
                <Link to="/order" className="btn btn-primary">
                  Place Your First Order
                </Link>
              </div>
            ) : (
              <>
                <div className="orders-summary">
                  <div className="summary-item">
                    <span className="summary-number">{orders.length}</span>
                    <span className="summary-label">Total Orders</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-number">
                      {
                        orders.filter((order) => order.status === "completed")
                          .length
                      }
                    </span>
                    <span className="summary-label">Completed</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-number">
                      {
                        orders.filter(
                          (order) =>
                            order.status === "pending" ||
                            order.status === "confirmed"
                        ).length
                      }
                    </span>
                    <span className="summary-label">Active</span>
                  </div>
                </div>

                <div className="recent-orders">
                  <h4>Recent Orders</h4>
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="order-item">
                      <div className="order-info">
                        <div className="order-main">
                          <span className="order-cake">{order.cake_name}</span>
                          <span className="order-date">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="order-details">
                          <span className="order-quantity">
                            Qty: {order.quantity}
                          </span>
                          <span className="order-price">
                            {formatPrice(order.total_price)}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                      <div className="order-actions">
                        {(order.status === "pending" ||
                          order.status === "confirmed") && (
                          <button
                            className="btn-cancel"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {orders.length > 3 && (
                  <div className="view-all-orders">
                    <Link to="/orders" className="btn-link">
                      View all orders ({orders.length})
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
