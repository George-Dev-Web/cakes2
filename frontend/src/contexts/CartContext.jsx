import { createContext, useContext, useState, useEffect, useMemo } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // 1. Load Initial State
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem("cake_cart");
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      console.error("Cart recovery failed", e);
      return [];
    }
  });

  // 2. Persist to LocalStorage
  useEffect(() => {
    localStorage.setItem("cake_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // 3. Helper: Calculate price for a single row
  const calculateItemPrice = (item) => {
    // If the item already has a pre-calculated total from the Order wizard, use it.
    // Otherwise, calculate manually from base + customizations.
    if (
      item.total_price &&
      (!item.customizations || item.customizations.length === 0)
    ) {
      return item.total_price * (item.quantity || 1);
    }

    const base = parseFloat(item.base_price || 0);
    const addons = Array.isArray(item.customizations)
      ? item.customizations.reduce(
          (sum, c) => sum + parseFloat(c.price || 0),
          0
        )
      : 0;

    return (base + addons) * (item.quantity || 1);
  };

  // 4. Core Actions
  const addToCart = (newItem) => {
    setCartItems((prev) => {
      // Check if exact same cake with exact same customizations exists
      // For bespoke cakes, we usually just add a new line item.
      const uniqueId = `${Date.now()}-${newItem.cake_id || "custom"}`;

      return [
        ...prev,
        {
          ...newItem,
          cart_item_id: uniqueId,
          quantity: newItem.quantity || 1,
        },
      ];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.cart_item_id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.cart_item_id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  // 5. Aggregate Totals (Memoized for performance)
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + calculateItemPrice(item), 0);
  }, [cartItems]);

  const cartItemCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
  }, [cartItems]);

  const value = {
    cartItems,
    cartItemCount,
    subtotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    calculateItemPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
