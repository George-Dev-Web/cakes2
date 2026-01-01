import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchOrderDetails } from '../utils/api';
import { toast } from 'react-toastify';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      loadOrderDetails();
    }
  }, [orderNumber]);

  const loadOrderDetails = async () => {
    try {
      const orderData = await fetchOrderDetails(orderNumber);
      setOrder(orderData);
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Failed to load order details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => `KSh ${parseFloat(price).toLocaleString('en-KE')}`;
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { icon: '⏳', text: 'Pending', color: '#ffc107' },
      confirmed: { icon: '✅', text: 'Confirmed', color: '#28a745' },
      preparing: { icon: '👨‍🍳', text: 'Preparing', color: '#17a2b8' },
      ready: { icon: '📦', text: 'Ready', color: '#007bff' },
      delivered: { icon: '🎉', text: 'Delivered', color: '#28a745' },
      cancelled: { icon: '❌', text: 'Cancelled', color: '#dc3545' },
    };
    return statusMap[status] || statusMap.pending;
  };

  if (loading) {
    return (
      <div className="order-confirmation-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your order...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="order-confirmation-page">
      <div className="container">
        <div className="success-header">
          <div className="success-icon">🎂</div>
          <h1>Order Placed Successfully!</h1>
          <p className="order-number">Order #{order.order_number}</p>
        </div>

        <div className="confirmation-content">
          {/* Order Status */}
          <div className="status-card">
            <div 
              className="status-badge"
              style={{ backgroundColor: statusInfo.color }}
            >
              <span className="status-icon">{statusInfo.icon}</span>
              <span className="status-text">{statusInfo.text}</span>
            </div>
            <p className="status-message">
              Thank you for your order! We've sent a confirmation email to{' '}
              <strong>{order.customer_email}</strong>
            </p>
          </div>

          {/* Customer Information */}
          <div className="info-section">
            <h2>Customer Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <strong>Name:</strong>
                <span>{order.customer_name}</span>
              </div>
              <div className="info-item">
                <strong>Email:</strong>
                <span>{order.customer_email}</span>
              </div>
              <div className="info-item">
                <strong>Phone:</strong>
                <span>{order.customer_phone}</span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="info-section">
            <h2>Delivery Information</h2>
            <div className="info-grid">
              <div className="info-item full-width">
                <strong>Delivery Address:</strong>
                <span>{order.delivery_address}</span>
              </div>
              <div className="info-item">
                <strong>Delivery Date:</strong>
                <span>{formatDate(order.delivery_date)}</span>
              </div>
              <div className="info-item">
                <strong>Delivery Time:</strong>
                <span>{order.delivery_time || 'As scheduled'}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="info-section">
            <h2>Order Items</h2>
            <div className="order-items">
              {order.items && order.items.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-header">
                    <h4>{item.cake?.name || 'Custom Cake'}</h4>
                    <span className="item-price">{formatPrice(item.subtotal)}</span>
                  </div>
                  
                  <div className="item-details">
                    <p><strong>Size:</strong> {item.cake_size}</p>
                    <p><strong>Quantity:</strong> {item.quantity}</p>
                    
                    {item.flavor && <p><strong>Flavor:</strong> {item.flavor}</p>}
                    {item.frosting && <p><strong>Frosting:</strong> {item.frosting}</p>}
                    
                    {item.message_on_cake && (
                      <p className="cake-message">
                        <strong>Message:</strong> &quot;{item.message_on_cake}&quot;
                      </p>
                    )}
                    
                    {item.is_vegan && <span className="badge">🌱 Vegan</span>}
                    {item.is_gluten_free && <span className="badge">🌾 Gluten-Free</span>}
                    
                    {item.notes && (
                      <p className="item-notes">
                        <strong>Notes:</strong> {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="info-section order-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee:</span>
              <span>{formatPrice(order.delivery_fee)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (16%):</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <div className="summary-row total">
              <strong>Total:</strong>
              <strong>{formatPrice(order.total_price)}</strong>
            </div>
            <div className="summary-row">
              <span>Payment Method:</span>
              <span>{order.payment_method}</span>
            </div>
          </div>

          {/* Special Instructions */}
          {order.special_instructions && (
            <div className="info-section special-instructions">
              <h2>Special Instructions</h2>
              <p>{order.special_instructions}</p>
            </div>
          )}

          {/* Actions */}
          <div className="confirmation-actions">
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              Return Home
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/order')}
            >
              Order Another Cake
            </button>
          </div>

          {/* Track Order Info */}
          <div className="track-order-info">
            <p>
              📧 A confirmation email with tracking information has been sent to{' '}
              <strong>{order.customer_email}</strong>
            </p>
            <p>
              You can track your order status by saving this order number:{' '}
              <strong>{order.order_number}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
