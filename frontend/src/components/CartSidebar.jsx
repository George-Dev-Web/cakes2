import { useCart } from "../contexts/CartContext";
import { formatPrice } from "../utils/formatting";
import { useNavigate } from "react-router-dom";
import "./CartSidebar.css";

const CartSidebar = ({ isOpen, onClose }) => {
  // We only pull exactly what exists in your CartContext.jsx
  const {
    cartItems,
    subtotal,
    removeFromCart,
    updateQuantity,
    calculateItemPrice,
  } = useCart();

  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Your Cart ({cartItems?.length || 0})</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="cart-content">
          {!cartItems || cartItems.length === 0 ? (
            <p className="empty-msg">Your cart is empty</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.cart_item_id} className="sidebar-item">
                <div className="item-details">
                  <h4>{item.name}</h4>
                  {/* Using the helper function we verified in CartContext */}
                  <p>{formatPrice(calculateItemPrice(item))}</p>
                  <small>
                    {item.customizations?.map((c) => c.name).join(", ")}
                  </small>
                </div>
                <div className="item-actions">
                  <div className="qty-btns">
                    <button
                      onClick={() => updateQuantity(item.cart_item_id, -1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.cart_item_id, 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="remove-link"
                    onClick={() => removeFromCart(item.cart_item_id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems?.length > 0 && (
          <div className="cart-footer">
            <div className="subtotal">
              <span>Subtotal</span>
              {/* Note: subtotal is a NUMBER, not a function. No parentheses! */}
              <span>{formatPrice(subtotal)}</span>
            </div>
            <button
              className="checkout-btn"
              onClick={() => {
                navigate("/checkout");
                onClose();
              }}
            >
              Go to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;
