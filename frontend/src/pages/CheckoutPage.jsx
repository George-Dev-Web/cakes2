// frontend/src/pages/CheckoutPage.jsx
import React from "react";

const CheckoutPage = () => {
  return (
    <div className="container py-5">
      <h2>Checkout & Payment</h2>
      <p>
        This is where the user will confirm their order details, shipping, and
        payment.
      </p>
      {/* The cart items and total will be pulled using useCart() here */}
    </div>
  );
};

export default CheckoutPage;
