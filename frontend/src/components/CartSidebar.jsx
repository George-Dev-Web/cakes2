// frontend/src/components/CartSidebar.jsx (Example)
import React from "react";
import { useCart } from "../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../utils/formatting";

const CartSidebar = ({ isOpen, onClose }) => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getGrandTotal,
    calculateItemPrice,
  } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckout = () => {
    onClose();
    navigate("/checkout"); // Navigate to the new Checkout page
  };

  return (
    <div className="cart-sidebar">
      <div className="cart-header">
        <h2>Your Cake Basket ({cartItems.length} items)</h2>
        <button onClick={onClose}>&times;</button>
      </div>

      <div className="cart-items-list">
        {cartItems.length === 0 ? (
          <p>Your basket is empty. Add a custom cake!</p>
        ) : (
          cartItems.map((item) => (
            <div key={item.cart_item_id} className="cart-item">
              <h4>{item.name}</h4>
              <p>Base Price: {formatPrice(item.base_price)}</p>
              {/* Note: You'll need to display customization details here */}

              <div className="item-controls">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.cart_item_id, parseInt(e.target.value))
                  }
                />
                <button onClick={() => removeFromCart(item.cart_item_id)}>
                  Remove
                </button>
                <span className="item-total">
                  Total: {formatPrice(calculateItemPrice(item))}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-footer">
        <h3>Grand Total: {formatPrice(getGrandTotal())}</h3>
        <button
          onClick={handleCheckout}
          disabled={cartItems.length === 0}
          className="btn btn-primary"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default CartSidebar;
