import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { fetchCakes, fetchCustomizations } from "../utils/api";
import { toast } from "react-toastify";
import "./Order.css";

// Define which categories allow multiple selections (e.g., Topping, Art)
const MULTI_SELECT_CATEGORIES = ["Topping", "Art"];

const Order = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [orderData, setOrderData] = useState({
    cake_id: "",
    quantity: 1,
    delivery_date: "",
    special_requests: "",
  });

  const [cakes, setCakes] = useState([]);
  const [customizations, setCustomizations] = useState([]);
  const [selectedCustomizations, setSelectedCustomizations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatPrice = (price) =>
    `KSh ${parseFloat(price).toLocaleString("en-KE")}`;

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cakesData, customData] = await Promise.all([
          fetchCakes(),
          fetchCustomizations(),
        ]);

        setCakes(cakesData);

        // Handle Customizations (Group flat array if necessary)
        let grouped = [];
        if (Array.isArray(customData)) {
          // If already grouped (has 'options' array)
          if (customData.length > 0 && customData[0].options) {
            grouped = customData;
          } else {
            // Group flat array by category
            const groups = {};
            customData.forEach((item) => {
              // Skip inactive items
              if (item.is_active === false || item.active === false) return;

              const cat = item.category || "Other";
              if (!groups[cat]) groups[cat] = [];
              groups[cat].push(item);
            });
            grouped = Object.entries(groups).map(([category, options]) => ({
              category,
              options,
            }));
          }
        }
        setCustomizations(grouped);
      } catch (err) {
        setError("Failed to load data. Please try again later.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? Number(value) : value;
    setOrderData({ ...orderData, [name]: val });
  };

  // --- CORE CUSTOMIZATION LOGIC ---
  const handleCustomizationSelect = (category, option) => {
    const isMultiSelect = MULTI_SELECT_CATEGORIES.includes(category);

    setSelectedCustomizations((prev) => {
      if (isMultiSelect) {
        // Multi-Select Logic
        const currentOptions = Array.isArray(prev[category])
          ? prev[category]
          : [];
        const index = currentOptions.findIndex((o) => o.id === option.id);

        if (index > -1) {
          // Remove option
          return {
            ...prev,
            [category]: currentOptions.filter((_, i) => i !== index),
          };
        } else {
          // Add option
          return { ...prev, [category]: [...currentOptions, option] };
        }
      } else {
        // Single-Select Logic
        return {
          ...prev,
          [category]: prev[category]?.id === option.id ? null : option,
        };
      }
    });
  };

  const calculateTotal = () => {
    let total = 0;
    const quantity = orderData.quantity || 1;

    // 1. Base Cake Price
    const baseCake = cakes.find(
      (cake) => cake.id === Number(orderData.cake_id)
    );
    if (baseCake) total += baseCake.price * quantity;

    // 2. Customizations Price
    Object.values(selectedCustomizations).forEach((selection) => {
      if (Array.isArray(selection)) {
        selection.forEach((opt) => {
          if (opt && typeof opt.price === "number")
            total += opt.price * quantity;
        });
      } else if (selection && typeof selection.price === "number") {
        total += selection.price * quantity;
      }
    });

    return total;
  };

  const handleAddToCartAndCheckout = async (e) => {
    e.preventDefault();
    setError("");

    const baseCake = cakes.find(
      (cake) => cake.id === Number(orderData.cake_id)
    );
    if (!baseCake || orderData.quantity < 1) {
      setError("Please select a valid cake and quantity.");
      toast.error("Please select a valid cake and quantity.");
      return;
    }

    const allCustomizations = [];
    let totalPriceAdjustment = 0;

    Object.entries(selectedCustomizations).forEach(([category, selection]) => {
      if (Array.isArray(selection)) {
        selection.forEach((opt) => {
          if (opt) {
            allCustomizations.push({
              type: category,
              name: opt.name,
              price: opt.price || 0,
            });
            totalPriceAdjustment += opt.price || 0;
          }
        });
      } else if (selection) {
        allCustomizations.push({
          type: category,
          name: selection.name,
          price: selection.price || 0,
        });
        totalPriceAdjustment += selection.price || 0;
      }
    });

    const itemToAdd = {
      cake_id: baseCake.id,
      name: baseCake.name + " (Custom)",
      base_price: baseCake.price,
      quantity: orderData.quantity,
      customizations: allCustomizations,
      metadata: {
        delivery_date: orderData.delivery_date,
        special_requests: orderData.special_requests,
      },
    };

    addToCart(itemToAdd);

    const itemTotal = baseCake.price + totalPriceAdjustment;
    toast.success(
      `${baseCake.name} (Custom) added to basket! Total: ${formatPrice(
        itemTotal * orderData.quantity
      )}`
    );

    setOrderData({
      cake_id: "",
      quantity: 1,
      delivery_date: "",
      special_requests: "",
    });
    setSelectedCustomizations({});

    navigate("/checkout");
  };

  // Delivery date constraints
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 1);
  const maxDate = new Date(today);
  maxDate.setMonth(today.getMonth() + 3);
  const formatDate = (date) => date.toISOString().split("T")[0];

  return (
    <div className="order-page">
      <div className="container">
        <h1>Place Your Custom Cake Order</h1>
        {error && <div className="error-message">{error}</div>}

        <form className="order-form" onSubmit={handleAddToCartAndCheckout}>
          {/* Cake Selection */}
          <div className="form-section">
            <h3>🎂 Base Cake Selection</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cake_id">Select Cake *</label>
                <select
                  id="cake_id"
                  name="cake_id"
                  value={orderData.cake_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose a cake</option>
                  {cakes.map((cake) => (
                    <option key={cake.id} value={cake.id}>
                      {cake.name} - {formatPrice(cake.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  max="10"
                  value={orderData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="delivery_date">Preferred Delivery Date *</label>
              <input
                type="date"
                id="delivery_date"
                name="delivery_date"
                value={orderData.delivery_date}
                onChange={handleChange}
                min={formatDate(minDate)}
                max={formatDate(maxDate)}
                required
              />
            </div>
          </div>

          {/* Customizations */}
          <div className="form-section customization-area">
            <h3>🎨 Customization Options</h3>
            {loading ? (
              <p>Loading customization options...</p>
            ) : customizations.length > 0 ? (
              customizations.map((group) => {
                const isMulti = MULTI_SELECT_CATEGORIES.includes(
                  group.category
                );
                const isSelected = (optionId) => {
                  const selection = selectedCustomizations[group.category];
                  if (isMulti && Array.isArray(selection)) {
                    return selection.some((opt) => opt.id === optionId);
                  }
                  return selection?.id === optionId;
                };

                return (
                  <div key={group.category} className="customization-group">
                    <h4>
                      {group.category}{" "}
                      {isMulti ? "(Multi-Select)" : "(Single-Select)"}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {group.category === "Art"
                        ? "E.g., Special lettering or complex frosting."
                        : ""}
                    </p>

                    <div className="customization-options">
                      {group.options.map((option) => (
                        <div
                          key={option.id}
                          className={`customization-option ${
                            isSelected(option.id) ? "selected" : ""
                          }`}
                          onClick={() =>
                            handleCustomizationSelect(group.category, option)
                          }
                        >
                          {option.image_url && (
                            <img
                              src={option.image_url}
                              alt={option.name}
                              className="customization-img"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://placehold.co/64x64/CCCCCC/333333?text=IMG";
                              }}
                            />
                          )}
                          <div className="option-details">
                            <span>{option.name}</span>
                            {option.price > 0 && (
                              <span className="customization-price">
                                +{formatPrice(option.price)}
                              </span>
                            )}
                          </div>
                          {option.description && (
                            <p className="description">{option.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <p>No customization options available.</p>
            )}
            <div className="total-section mt-8 pt-4 border-t border-gray-300">
              <strong>Order Total: {formatPrice(calculateTotal())}</strong>
            </div>
          </div>

          <div className="form-section">
            <h3>📝 Final Details & Delivery</h3>
            <div className="form-group">
              <label htmlFor="special_requests">
                Special Requests (e.g., specific placement for art)
              </label>
              <textarea
                id="special_requests"
                name="special_requests"
                value={orderData.special_requests}
                onChange={handleChange}
                placeholder="Any special instructions or notes"
                rows="4"
              ></textarea>
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            Add Cake to Basket & Go to Checkout
          </button>
        </form>
      </div>
    </div>
  );
};

export default Order;
