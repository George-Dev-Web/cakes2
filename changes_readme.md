# Project Change Log

This document details the recent changes made to the project.

## Currency Change: USD to KSH

The currency has been updated from USD to KSH across the frontend. This ensures all prices are displayed in Kenyan Shillings.

### Files Changed

- **`frontend/src/utils/formatting.js`**:

  - Created a new utility file to centralize the price formatting logic.
  - The `formatPrice` function now formats numbers into KSH currency.

- **`frontend/src/components/CartSidebar.jsx`**:

  - Replaced hardcoded `$` symbols with the `formatPrice` utility.

- **`frontend/src/pages/Admin/CustomizationsTab.jsx`**:

  - Replaced hardcoded `$` symbols with the `formatPrice` utility.

- **The following files were updated to remove redundant `formatPrice` functions and use the new centralized utility:**
  - `frontend/src/pages/CheckoutPage.jsx`
  - `frontend/src/components/ProductCard.jsx`
  - `frontend/src/pages/Dashboard.jsx`
  - `frontend/src/pages/CakePortfolio.jsx`
  - `frontend/src/pages/Order.jsx`
  - `frontend/src/pages/Admin/OrdersTab.jsx`
  - `frontend/src/pages/Admin/CakesTab.jsx`
  - `frontend/src/pages/OrderConfirmation.jsx`

## Removal of Hardcoded Values

Several hardcoded values have been removed and replaced with dynamic, configurable alternatives.

### Backend Changes

- **`backend/controllers/cart_controller.py`**:

  - Cake size prices (e.g., 'Small', 'Medium') are now fetched dynamically from the `CustomizationOption` model in the database instead of being hardcoded.
  - Dietary restriction price adjustments (e.g., for 'Gluten-Free' or 'Vegan') are also fetched dynamically from the `CustomizationOption` model.

- **`backend/seed.py`**:

  - Updated the seed script to populate the `CustomizationOption` table with entries for cake sizes and dietary restrictions, providing a source for the dynamic pricing.
  - Corrected the `Order` and `OrderItem` creation logic to align with the database schema.

- **`backend/controllers/customization_controller.py`**:
  - Added a new endpoint `GET /customizations/categories` to provide a list of unique customization categories from the database.

### Frontend Changes

- **`frontend/src/pages/Admin/CustomizationsTab.jsx`**:

  - Removed hardcoded API URLs and now uses the centralized `api` instance for all API calls.

- **`frontend/src/pages/Admin/CustomizationOptions.jsx`**:

  - Removed the hardcoded `CATEGORY_OPTIONS` array.
  - The component now fetches the available categories dynamically from the new `/api/customizations/categories` backend endpoint.

- **`frontend/src/utils/constants.js`**:

  - Created a new file to store constant values.
  - Defined `DEFAULT_PLACEHOLDER_IMAGE_URL` and `DEFAULT_SMALL_PLACEHOLDER_IMAGE_URL` for consistent placeholder images.

- **`frontend/src/pages/CakePortfolio.jsx`**:

  - Updated to use the `DEFAULT_PLACEHOLDER_IMAGE_URL` constant instead of a hardcoded URL.

- **`frontend/src/pages/Order.jsx`**:

  - Updated to use the `DEFAULT_SMALL_PLACEHOLDER_IMAGE_URL` constant instead of a hardcoded URL.

- **Linting and Code Quality**:
  - Fixed various linting errors across the frontend codebase, improving code quality and maintainability.
