// frontend/src/contexts/CartContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  // Helper function to calculate the price of a single cart item
  const calculateItemPrice = (item) => {
    let price = item.base_price || 0;

    // Add customization costs (assuming customizations is an array of objects with a 'price' property)
    if (item.customizations && Array.isArray(item.customizations)) {
      price += item.customizations.reduce((sum, customization) => {
        // Assuming customization objects have a 'price' field
        return sum + (customization.price || 0);
      }, 0);
    }

    // Multiply by quantity
    return price * item.quantity;
  };

  // Initialize state from localStorage for persistence across refreshes
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem("cake_cart");
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      console.error("Could not load cart from localStorage", e);
      return [];
    }
  });

  // Effect to sync state to localStorage whenever cartItems changes
  useEffect(() => {
    localStorage.setItem("cake_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // --- Core Cart Functions ---

  const addToCart = (item) => {
    // 1. Check if an item with the same ID and customizations already exists
    // (This is tricky for custom items, so we'll treat every 'add' as a new line item for now)

    // Assign a unique ID to the cart item (e.g., timestamp + base_cake_id)
    const uniqueId = Date.now() + "-" + item.cake_id;

    setCartItems((prevItems) => [
      ...prevItems,
      {
        ...item,
        cart_item_id: uniqueId,
        quantity: item.quantity || 1, // Ensure quantity is set
      },
    ]);
  };

  const removeFromCart = (cart_item_id) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.cart_item_id !== cart_item_id)
    );
  };

  const updateQuantity = (cart_item_id, newQuantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cart_item_id === cart_item_id
          ? { ...item, quantity: Math.max(1, newQuantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // --- Calculation Functions ---

  // Calculates the price of every item and sums them up
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + calculateItemPrice(item);
    }, 0);
  };

  const getGrandTotal = () => {
    // In a real app, you would add tax and shipping here.
    // For now, Grand Total = Subtotal.
    return calculateSubtotal();
  };

  const cartItemCount = cartItems.reduce(
    (count, item) => count + item.quantity,
    0
  );

  const value = {
    cartItems,
    cartItemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    calculateSubtotal,
    getGrandTotal,
    calculateItemPrice, // Export the helper for component use
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
