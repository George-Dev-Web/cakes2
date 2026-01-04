import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchAdminStats,
  fetchAdminOrders,
  updateOrderStatus,
  fetchAdminCakes,
  fetchAdminUsers,
} from "../../utils/api";

import OverviewTab from "./OverviewTab";
import OrdersTab from "./OrdersTab";
import CakesTab from "./CakesTab";
import UsersTab from "./UsersTab";
import CustomizationsTab from "./CustomizationsTab";

import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [cakes, setCakes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      switch (activeTab) {
        case "overview": {
          const statsData = await fetchAdminStats();
          setStats(statsData);
          break;
        }
        case "orders": {
          const ordersData = await fetchAdminOrders();
          setOrders(ordersData.orders || []);
          break;
        }
        case "cakes": {
          const cakesData = await fetchAdminCakes();
          setCakes(cakesData);
          break;
        }
        case "users": {
          const usersData = await fetchAdminUsers();
          setUsers(usersData.users || []);
          break;
        }
        default:
          break;
      }
    } catch (err) {
      setError("Failed to load data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (currentUser && currentUser.is_admin) {
      loadData();
    }
  }, [currentUser, activeTab, loadData]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      const ordersData = await fetchAdminOrders();
      setOrders(ordersData.orders || []);
    } catch (err) {
      setError("Failed to update order status.");
      console.error(err);
    }
  };

  if (!currentUser || !currentUser.is_admin) {
    return (
      <div className="admin-denied">
        <div className="container">
          <h2>Access Denied</h2>
          <p>You do not have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Manage orders, users, and cake inventory</p>
        </div>

        <div className="admin-tabs">
          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </button>
          <button
            className={activeTab === "cakes" ? "active" : ""}
            onClick={() => setActiveTab("cakes")}
          >
            Cakes
          </button>
          <button
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>

          <button
            className={activeTab === "customizations" ? "active" : ""}
            onClick={() => setActiveTab("customizations")}
          >
            Customizations
          </button>
        </div>

        <div className="admin-content">
          {loading && <div className="loading">Loading...</div>}
          {error && <div className="error">{error}</div>}

          {activeTab === "overview" && stats && <OverviewTab stats={stats} />}

          {activeTab === "orders" && (
            <OrdersTab orders={orders} onStatusUpdate={handleStatusUpdate} />
          )}

          {activeTab === "cakes" && (
            <CakesTab cakes={cakes} onRefresh={loadData} />
          )}

          {activeTab === "users" && <UsersTab users={users} />}

          {activeTab === "customizations" && <CustomizationsTab />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
