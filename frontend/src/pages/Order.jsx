import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { formatPrice } from "../utils/formatting";
import { fetchCakes, fetchCustomizations } from "../utils/api";
import { toast } from "react-toastify";
import { DEFAULT_SMALL_PLACEHOLDER_IMAGE_URL } from "../utils/constants";
import "./Order.css";

const MULTI_SELECT_CATEGORIES = ["Topping", "Art"];

const Order = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [cakes, setCakes] = useState([]);
  const [customizations, setCustomizations] = useState([]);
  const [selectedCustomizations, setSelectedCustomizations] = useState({});
  const [orderData, setOrderData] = useState({
    cake_id: "",
    quantity: 1,
    delivery_date: "",
    special_requests: "",
    allergies: "",
    reference_image: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cakesData, customData] = await Promise.all([
          fetchCakes(),
          fetchCustomizations(),
        ]);
        setCakes(cakesData);

        let grouped = [];
        if (Array.isArray(customData)) {
          const groups = {};
          customData.forEach((item) => {
            if (!item || !(item.id || item._id) || !item.name) return;
            if (item.active === false || item.is_active === false) return;
            const cat = item.category || "Other";
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
          });
          grouped = Object.entries(groups).map(([category, options]) => ({
            category,
            options,
          }));
        }
        setCustomizations(grouped);

        if (user?.preferences) {
          const prefs =
            typeof user.preferences === "string"
              ? JSON.parse(user.preferences)
              : user.preferences;
          if (prefs.allergies)
            setOrderData((prev) => ({ ...prev, allergies: prefs.allergies }));
        }
      } catch (err) {
        toast.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const progressPercentage = (step / 3) * 100;

  const handleCustomizationSelect = (category, option) => {
    const isMulti = MULTI_SELECT_CATEGORIES.includes(category);
    setSelectedCustomizations((prev) => {
      if (isMulti) {
        const current = Array.isArray(prev[category]) ? prev[category] : [];
        const exists = current.find(
          (o) => (o.id || o._id) === (option.id || option._id)
        );
        return {
          ...prev,
          [category]: exists
            ? current.filter(
                (o) => (o.id || o._id) !== (option.id || option._id)
              )
            : [...current, option],
        };
      }
      return {
        ...prev,
        [category]:
          (prev[category]?.id || prev[category]?._id) ===
          (option.id || option._id)
            ? null
            : option,
      };
    });
  };

  const calculateTotal = () => {
    let total = 0;
    const baseCake = cakes.find(
      (c) => (c.id || c._id) === Number(orderData.cake_id)
    );
    if (baseCake) total += baseCake.price;
    Object.values(selectedCustomizations)
      .flat()
      .forEach((opt) => {
        if (opt?.price) total += opt.price;
      });
    return total * (orderData.quantity || 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const baseCake = cakes.find(
      (c) => (c.id || c._id) === Number(orderData.cake_id)
    );
    const allCustoms = [];
    Object.entries(selectedCustomizations).forEach(([cat, val]) => {
      const items = Array.isArray(val) ? val : [val];
      items.forEach(
        (i) => i && allCustoms.push({ type: cat, name: i.name, price: i.price })
      );
    });

    addToCart({
      ...orderData,
      name: `${baseCake.name} (Custom)`,
      base_price: baseCake.price,
      customizations: allCustoms,
      total_price: calculateTotal(),
    });
    toast.success("Added to basket!");
    navigate("/checkout");
  };

  if (loading) return <div className="loader">Heating up the oven...</div>;

  return (
    <div className="order-wizard">
      <div className="progress-container">
        <div className="progress-label">
          <span>Step {step} of 3</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="wizard-form">
        {step === 1 && (
          <div className="step-fade-in">
            <h2>Select Your Cake</h2>
            <div className="cake-selection-grid">
              {cakes.map((cake) => (
                <div
                  key={cake.id || cake._id}
                  className={`cake-card-visual ${
                    orderData.cake_id === cake.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setOrderData({ ...orderData, cake_id: cake.id });
                    setTimeout(() => setStep(2), 400);
                  }}
                >
                  <div className="card-image-wrapper">
                    <img
                      src={
                        cake.image_url || DEFAULT_SMALL_PLACEHOLDER_IMAGE_URL
                      }
                      alt=""
                    />
                  </div>
                  <div className="card-meta">
                    <h4>{cake.name}</h4>
                    <p className="price-tag">{formatPrice(cake.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-fade-in">
            <h2>Choose Flavors</h2>
            {customizations.map((group) => (
              <div key={group.category} className="custom-group-section">
                <h3>{group.category.replace(/_/g, " ")}</h3>
                <div className="options-pill-container">
                  {group.options.map((opt) => {
                    const active = MULTI_SELECT_CATEGORIES.includes(
                      group.category
                    )
                      ? selectedCustomizations[group.category]?.some(
                          (o) => (o.id || o._id) === (opt.id || opt._id)
                        )
                      : (selectedCustomizations[group.category]?.id ||
                          selectedCustomizations[group.category]?._id) ===
                        (opt.id || opt._id);
                    return (
                      <button
                        key={opt.id || opt._id}
                        type="button"
                        className={`pill-option ${active ? "active" : ""}`}
                        onClick={() =>
                          handleCustomizationSelect(group.category, opt)
                        }
                      >
                        {opt.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="step-footer">
              <button
                type="button"
                className="btn-back"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-next"
                onClick={() => setStep(3)}
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-fade-in">
            <h2>Final Details</h2>
            <input
              type="date"
              required
              value={orderData.delivery_date}
              onChange={(e) =>
                setOrderData({ ...orderData, delivery_date: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Allergies"
              value={orderData.allergies}
              onChange={(e) =>
                setOrderData({ ...orderData, allergies: e.target.value })
              }
            />
            <textarea
              placeholder="Special Requests"
              value={orderData.special_requests}
              onChange={(e) =>
                setOrderData({ ...orderData, special_requests: e.target.value })
              }
            />
            <div className="sticky-price-bar">
              <div className="price-info">
                <span>Total:</span>
                <span className="total-amount">
                  {formatPrice(calculateTotal())}
                </span>
              </div>
              <div className="action-btns">
                <button
                  type="button"
                  className="btn-back"
                  onClick={() => setStep(2)}
                >
                  Back
                </button>
                <button type="submit" className="btn-submit">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default Order;
