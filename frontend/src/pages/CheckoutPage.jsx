import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/formatting';
import { createOrder } from '../utils/api';
import { toast } from 'react-toastify';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart, removeFromCart, updateQuantity } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_address: '',
    delivery_date: '',
    delivery_time: 'Morning',
    special_instructions: '',
    payment_method: 'Cash on Delivery',
  });

  // Auto-fill user details if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setCustomerInfo(prev => ({
        ...prev,
        customer_name: user.name || '',
        customer_email: user.email || '',
        customer_phone: user.phone || '',
      }));
    }
  }, [isAuthenticated, user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart || cart.length === 0) {
      toast.info('Your cart is empty. Add some cakes first!');
      navigate('/order');
    }
  }, [cart, navigate]);

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const basePrice = item.base_price || 0;
      const customizationTotal = (item.customizations || []).reduce(
        (custSum, cust) => custSum + (cust.price || 0),
        0
      );
      return sum + (basePrice + customizationTotal) * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const deliveryFee = 500; // Fixed delivery fee (KSh)
  const taxRate = 0.16; // 16% VAT
  const tax = subtotal * taxRate;
  const total = subtotal + deliveryFee + tax;



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleQuantityChange = (itemIndex, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemIndex, newQuantity);
  };

  const handleRemoveItem = (itemIndex) => {
    removeFromCart(itemIndex);
    toast.success('Item removed from cart');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate delivery date (must be at least 48 hours from now)
      const deliveryDate = new Date(customerInfo.delivery_date);
      const minDate = new Date();
      minDate.setHours(minDate.getHours() + 48);

      if (deliveryDate < minDate) {
        toast.error('Delivery date must be at least 48 hours from now');
        setLoading(false);
        return;
      }

      // Prepare order data
      const orderData = {
        ...customerInfo,
        cart_items: cart.map(item => ({
          cake_id: item.cake_id,
          quantity: item.quantity,
          customizations: item.customizations || [],
          metadata: item.metadata || {},
        })),
        subtotal,
        delivery_fee: deliveryFee,
        tax,
        total_price: total,
      };

      const response = await createOrder(orderData);

      toast.success(
        `Order placed successfully! Order #${response.order_number}`,
        { autoClose: 5000 }
      );

      clearCart();
      
      // Redirect to order confirmation page
      navigate(`/order-confirmation/${response.order_number}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(
        error.response?.data?.error?.message || 'Failed to place order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Delivery date constraints
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 2); // At least 2 days ahead
  const maxDate = new Date(today);
  maxDate.setMonth(today.getMonth() + 3);
  const formatDate = (date) => date.toISOString().split('T')[0];

  if (!cart || cart.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>

        <div className="checkout-layout">
          {/* Left: Order Summary */}
          <div className="order-summary">
            <h2>Order Summary</h2>
            
            <div className="cart-items">
              {cart.map((item, index) => {
                const customizationTotal = (item.customizations || []).reduce(
                  (sum, cust) => sum + (cust.price || 0),
                  0
                );
                const itemTotal = (item.base_price + customizationTotal) * item.quantity;

                return (
                  <div key={index} className="cart-item">
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      <p className="base-price">Base: {formatPrice(item.base_price)}</p>
                      
                      {item.customizations && item.customizations.length > 0 && (
                        <div className="customizations">
                          <strong>Customizations:</strong>
                          <ul>
                            {item.customizations.map((cust, i) => (
                              <li key={i}>
                                {cust.name} {cust.price > 0 && `(+${formatPrice(cust.price)})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.metadata?.special_requests && (
                        <p className="special-requests">
                          <strong>Note:</strong> {item.metadata.special_requests}
                        </p>
                      )}
                    </div>

                    <div className="item-controls">
                      <div className="quantity-control">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(index, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <p className="item-total">{formatPrice(itemTotal)}</p>
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => handleRemoveItem(index)}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="total-row">
                <span>Delivery Fee:</span>
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

          {/* Right: Customer Info Form */}
          <div className="checkout-form">
            <h2>{isAuthenticated ? 'Confirm Details' : 'Your Information'}</h2>
            
            {!isAuthenticated && (
              <div className="guest-notice">
                <p>You can checkout as a guest or <a href="/login">login</a> to save your information.</p>
              </div>
            )}

            <form onSubmit={handleSubmitOrder}>
              <div className="form-section">
                <h3>Contact Information</h3>
                
                <div className="form-group">
                  <label htmlFor="customer_name">Full Name *</label>
                  <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    value={customerInfo.customer_name}
                    onChange={handleInputChange}
                    required
                    minLength={2}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="customer_email">Email *</label>
                    <input
                      type="email"
                      id="customer_email"
                      name="customer_email"
                      value={customerInfo.customer_email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="customer_phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="customer_phone"
                      name="customer_phone"
                      value={customerInfo.customer_phone}
                      onChange={handleInputChange}
                      required
                      pattern="[0-9+\-\s()]+"
                      placeholder="e.g., +254 712 345 678"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Delivery Information</h3>
                
                <div className="form-group">
                  <label htmlFor="delivery_address">Delivery Address *</label>
                  <textarea
                    id="delivery_address"
                    name="delivery_address"
                    value={customerInfo.delivery_address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    placeholder="Enter your full delivery address"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="delivery_date">Delivery Date *</label>
                    <input
                      type="date"
                      id="delivery_date"
                      name="delivery_date"
                      value={customerInfo.delivery_date}
                      onChange={handleInputChange}
                      min={formatDate(minDate)}
                      max={formatDate(maxDate)}
                      required
                    />
                    <small>Minimum 48 hours notice required</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="delivery_time">Preferred Time *</label>
                    <select
                      id="delivery_time"
                      name="delivery_time"
                      value={customerInfo.delivery_time}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Morning">Morning (8AM - 12PM)</option>
                      <option value="Afternoon">Afternoon (12PM - 4PM)</option>
                      <option value="Evening">Evening (4PM - 8PM)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Payment Method</h3>
                
                <div className="payment-options">
                  {['Cash on Delivery', 'M-Pesa', 'Card', 'Bank Transfer'].map(method => (
                    <label key={method} className="payment-option">
                      <input
                        type="radio"
                        name="payment_method"
                        value={method}
                        checked={customerInfo.payment_method === method}
                        onChange={handleInputChange}
                      />
                      <span>{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="special_instructions">Special Instructions</label>
                  <textarea
                    id="special_instructions"
                    name="special_instructions"
                    value={customerInfo.special_instructions}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Any additional instructions for your order"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/order')}
                >
                  ← Back to Customize
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : `Place Order - ${formatPrice(total)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
