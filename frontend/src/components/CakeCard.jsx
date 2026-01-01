// frontend/src/components/CakeCard.jsx (REVISED)

import React from "react";
import { Link } from "react-router-dom"; // 🔑 Import Link for "Customize" button
import { FaShoppingCart } from "react-icons/fa"; // 🔑 Import icon for Quick Add
import "./CakeCard.css";

const CakeCard = ({ cake, onClick, isDarkMode, onQuickAdd }) => {
  // Note: The main card onClick is retained, but users expect a button for purchase actions.
  // We'll rename the original onClick to "onCustomizeClick" to clarify its purpose
  // (e.g., viewing details or navigating to the customization page).

  return (
    <div className={`cake-card ${isDarkMode ? "dark" : ""}`}>
      <img src={cake.image} alt={cake.name} />
      <div className="cake-info">
        <h3>{cake.name}</h3>
        <p>{cake.description}</p>
        <strong>KSh {parseFloat(cake.price).toLocaleString("en-KE")}</strong>
      </div>

      <div className="card-actions">
        {/* 1. Customize/View Details Button (uses the original onClick/navigation) */}
        {/* We use Link here to be robust, assuming '/order/:id' is your customization route */}
        <Link
          to={`/order/${cake.id}`}
          className="btn-customize"
          // If you still need the original click alert/modal, you can call it here:
          onClick={() => onClick && onClick(cake)}
        >
          Customize
        </Link>

        {/* 2. Quick Add Button (uses the new onQuickAdd prop) */}
        {onQuickAdd && (
          <button
            className="btn-quick-add"
            onClick={(e) => {
              e.stopPropagation(); // 🔑 CRITICAL: Prevents the parent Link/onClick from firing
              onQuickAdd(cake); // Calls the handler from CakePortfolio
            }}
            aria-label={`Quick add ${cake.name} to cart`}
          >
            <FaShoppingCart /> Add
          </button>
        )}
      </div>
    </div>
  );
};

export default CakeCard;
