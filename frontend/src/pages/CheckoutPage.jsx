import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { formatPrice } from "../utils/formatting";
import { createOrder } from "../utils/api";
import { toast } from "react-toastify";
import "./CheckoutPage.css";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    subtotal,
    clearCart,
    removeFromCart,
    updateQuantity,
    calculateItemPrice,
  } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    delivery_address: "",
    delivery_date: "",
    delivery_time: "Morning",
    special_instructions: "",
    payment_method: "Cash on Delivery",
  });

  // Auto-fill user details if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setCustomerInfo((prev) => ({
        ...prev,
        customer_name: user.name || "",
        customer_email: user.email || "",
        customer_phone: user.phone || "",
      }));
    }
  }, [isAuthenticated, user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems && cartItems.length === 0) {
      toast.info("Your cart is empty. Add some cakes first!");
      navigate("/order");
    }
  }, [cartItems, navigate]);

  // Financial calculations
  const deliveryFee = 500;
  const taxRate = 0.16;
  const tax = subtotal * taxRate;
  const total = subtotal + deliveryFee + tax;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuantityChange = (itemId, currentQty, delta) => {
    const newQuantity = currentQty + delta;
    if (newQuantity < 1) return;
    updateQuantity(itemId, delta);
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
    toast.success("Item removed from cart");
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const deliveryDate = new Date(customerInfo.delivery_date);
      const minDate = new Date();
      minDate.setHours(minDate.getHours() + 48);

      if (deliveryDate < minDate) {
        toast.error("Delivery date must be at least 48 hours from now");
        setLoading(false);
        return;
      }

      // 🔑 THE TWEAKED PAYLOAD: Clean mapping for the backend
      const orderData = {
        ...customerInfo,
        cart_items: cartItems.map((item) => ({
          cake_id: item.cake_id,
          quantity: item.quantity,
          // Convert array of objects into a single readable string for the 'notes' field
          customizations:
            item.customizations?.map((c) => `${c.name}`).join(", ") || "",
          special_requests: item.special_requests || "",
          reference_image: item.reference_image || "",
          item_subtotal: calculateItemPrice(item), // Helpful for backend logging
        })),
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        tax: tax,
        total_price: total,
      };

      const response = await createOrder(orderData);

      toast.success(
        `Order placed successfully! Order #${
          response.order_number || response.id
        }`,
        { autoClose: 5000 }
      );

      clearCart();
      navigate(`/order-confirmation/${response.order_number || response.id}`);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to place order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => date.toISOString().split("T")[0];
  const minDateLimit = new Date();
  minDateLimit.setDate(minDateLimit.getDate() + 2);

  if (!cartItems || cartItems.length === 0) return null;

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Finalize Your Order</h1>

        <div className="checkout-layout">
          {/* Order Summary Section */}
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.cart_item_id} className="cart-item">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p className="base-price">
                      Base: {formatPrice(item.base_price)}
                    </p>
                    {item.customizations?.length > 0 && (
                      <div className="customizations">
                        <small>
                          Custom:{" "}
                          {item.customizations.map((c) => c.name).join(", ")}
                        </small>
                      </div>
                    )}
                  </div>

                  <div className="item-controls">
                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={() =>
                          handleQuantityChange(
                            item.cart_item_id,
                            item.quantity,
                            -1
                          )
                        }
                        disabled={item.quantity <= 1}
                      >
                        {" "}
                        -{" "}
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleQuantityChange(
                            item.cart_item_id,
                            item.quantity,
                            1
                          )
                        }
                      >
                        {" "}
                        +{" "}
                      </button>
                    </div>
                    <p className="item-total">
                      {formatPrice(calculateItemPrice(item))}
                    </p>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => handleRemoveItem(item.cart_item_id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="total-row">
                <span>Delivery:</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
              <div className="total-row">
                <span>Tax (16%):</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="total-row grand-total">
                <strong>Total:</strong>
                <strong>{formatPrice(total)}</strong>
              </div>
            </div>
          </div>

          {/* Checkout Form Section */}
          <div className="checkout-form">
            <form onSubmit={handleSubmitOrder}>
              <div className="form-section">
                <h3>Contact & Delivery</h3>
                <input
                  type="text"
                  name="customer_name"
                  placeholder="Full Name"
                  value={customerInfo.customer_name}
                  onChange={handleInputChange}
                  required
                />
                <div className="form-row">
                  <input
                    type="email"
                    name="customer_email"
                    placeholder="Email"
                    value={customerInfo.customer_email}
                    onChange={handleInputChange}
                    required
                  />
                  <input
                    type="tel"
                    name="customer_phone"
                    placeholder="Phone"
                    value={customerInfo.customer_phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <textarea
                  name="delivery_address"
                  placeholder="Complete Delivery Address"
                  value={customerInfo.delivery_address}
                  onChange={handleInputChange}
                  required
                  rows={2}
                />
                <div className="form-row">
                  <input
                    type="date"
                    name="delivery_date"
                    value={customerInfo.delivery_date}
                    onChange={handleInputChange}
                    min={formatDate(minDateLimit)}
                    required
                  />
                  <select
                    name="delivery_time"
                    value={customerInfo.delivery_time}
                    onChange={handleInputChange}
                  >
                    <option value="Morning">Morning (8AM-12PM)</option>
                    <option value="Afternoon">Afternoon (12PM-4PM)</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3>Payment Method</h3>
                <div className="payment-options">
                  {["Cash on Delivery", "M-Pesa"].map((method) => (
                    <label key={method} className="radio-label">
                      <input
                        type="radio"
                        name="payment_method"
                        value={method}
                        checked={customerInfo.payment_method === method}
                        onChange={handleInputChange}
                      />
                      {method}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading
                  ? "Placing Order..."
                  : `Confirm Order - ${formatPrice(total)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
