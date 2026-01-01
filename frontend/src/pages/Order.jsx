import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Order.css';

const Order = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customizationOptions, setCustomizationOptions] = useState({});
  const [uploadedImages, setUploadedImages] = useState([]);
  
  const [formData, setFormData] = useState({
    cake_shape: 'Round',
    cake_size: 'Medium',
    cake_layers: 2,
    flavor: '',
    filling: '',
    frosting: '',
    is_gluten_free: false,
    is_vegan: false,
    is_sugar_free: false,
    is_dairy_free: false,
    toppings: [],
    message_on_cake: '',
    notes: '',
    quantity: 1
  });

  useEffect(() => {
    fetchCustomizationOptions();
  }, []);

  const fetchCustomizationOptions = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/customization/options`);
      setCustomizationOptions(response.data);
    } catch (error) {
      console.error('Error fetching options:', error);
      toast.error('Failed to load customization options');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleToppingToggle = (toppingId) => {
    setFormData(prev => ({
      ...prev,
      toppings: prev.toppings.includes(toppingId)
        ? prev.toppings.filter(id => id !== toppingId)
        : [...prev.toppings, toppingId]
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files[]', file);
    });
    formData.append('folder', 'cake-references');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/upload/multiple`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setUploadedImages(prev => [...prev, ...response.data.results]);
      toast.success(`Uploaded ${response.data.results.length} image(s)`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const calculatePrice = () => {
    const sizePrices = {
      'Small': 20,
      'Medium': 35,
      'Large': 50,
      'XL': 75
    };
    
    let total = sizePrices[formData.cake_size] || 35;
    
    // Add topping costs
    if (customizationOptions.topping) {
      formData.toppings.forEach(toppingId => {
        const topping = customizationOptions.topping.find(t => t.id === toppingId);
        if (topping) total += topping.price;
      });
    }
    
    // Dietary restrictions
    if (formData.is_gluten_free) total += 5;
    if (formData.is_vegan) total += 5;
    if (formData.is_sugar_free) total += 3;
    if (formData.is_dairy_free) total += 3;
    
    return total * formData.quantity;
  };

  const handleAddToCart = async () => {
    // Validation
    if (!formData.cake_size) {
      toast.error('Please select a cake size');
      return;
    }

    setLoading(true);

    try {
      const cartData = {
        ...formData,
        base_price: calculatePrice() / formData.quantity,
        customization_price: 0 // Already included in base_price
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/cart/items`,
        cartData
      );

      // Upload reference images if any
      if (uploadedImages.length > 0) {
        // Images are already uploaded, just link them
        // This would require getting the cart item ID from response
      }

      toast.success('Added to cart!');
      navigate('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-page">
      <div className="order-container">
        <h1>Customize Your Cake 🎂</h1>
        <p className="order-subtitle">Create your perfect cake with our easy customization options</p>

        <div className="order-content">
          {/* Left Column - Customization Form */}
          <div className="customization-form">
            
            {/* Cake Shape */}
            <div className="form-section">
              <h3>Cake Shape</h3>
              <div className="option-grid">
                {['Round', 'Square', 'Rectangle', 'Heart', 'Custom'].map(shape => (
                  <button
                    key={shape}
                    type="button"
                    className={`option-btn ${formData.cake_shape === shape ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, cake_shape: shape }))}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>

            {/* Cake Size */}
            <div className="form-section">
              <h3>Cake Size *</h3>
              <div className="option-grid">
                {['Small', 'Medium', 'Large', 'XL'].map(size => (
                  <button
                    key={size}
                    type="button"
                    className={`option-btn ${formData.cake_size === size ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, cake_size: size }))}
                  >
                    {size}
                    <span className="size-info">
                      {size === 'Small' && '6" (Serves 6-8)'}
                      {size === 'Medium' && '8" (Serves 12-16)'}
                      {size === 'Large' && '10" (Serves 20-24)'}
                      {size === 'XL' && '12" (Serves 30-35)'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Layers */}
            <div className="form-section">
              <label htmlFor="cake_layers">
                <h3>Number of Layers</h3>
              </label>
              <input
                type="number"
                id="cake_layers"
                name="cake_layers"
                min="1"
                max="10"
                value={formData.cake_layers}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            {/* Flavor */}
            <div className="form-section">
              <label htmlFor="flavor">
                <h3>Cake Flavor</h3>
              </label>
              {customizationOptions.flavor && customizationOptions.flavor.length > 0 ? (
                <select
                  id="flavor"
                  name="flavor"
                  value={formData.flavor}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select flavor...</option>
                  {customizationOptions.flavor.map(option => (
                    <option key={option.id} value={option.name}>
                      {option.name} {option.price > 0 && `(+$${option.price})`}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  id="flavor"
                  name="flavor"
                  value={formData.flavor}
                  onChange={handleInputChange}
                  placeholder="e.g., Chocolate, Vanilla, Red Velvet"
                  className="form-input"
                />
              )}
            </div>

            {/* Filling */}
            <div className="form-section">
              <label htmlFor="filling">
                <h3>Filling</h3>
              </label>
              {customizationOptions.filling && customizationOptions.filling.length > 0 ? (
                <select
                  id="filling"
                  name="filling"
                  value={formData.filling}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select filling...</option>
                  {customizationOptions.filling.map(option => (
                    <option key={option.id} value={option.name}>
                      {option.name} {option.price > 0 && `(+$${option.price})`}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  id="filling"
                  name="filling"
                  value={formData.filling}
                  onChange={handleInputChange}
                  placeholder="e.g., Vanilla Cream, Chocolate Mousse"
                  className="form-input"
                />
              )}
            </div>

            {/* Frosting */}
            <div className="form-section">
              <label htmlFor="frosting">
                <h3>Frosting</h3>
              </label>
              {customizationOptions.frosting && customizationOptions.frosting.length > 0 ? (
                <select
                  id="frosting"
                  name="frosting"
                  value={formData.frosting}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select frosting...</option>
                  {customizationOptions.frosting.map(option => (
                    <option key={option.id} value={option.name}>
                      {option.name} {option.price > 0 && `(+$${option.price})`}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  id="frosting"
                  name="frosting"
                  value={formData.frosting}
                  onChange={handleInputChange}
                  placeholder="e.g., Buttercream, Fondant"
                  className="form-input"
                />
              )}
            </div>

            {/* Dietary Restrictions */}
            <div className="form-section">
              <h3>Dietary Restrictions</h3>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_gluten_free"
                    checked={formData.is_gluten_free}
                    onChange={handleInputChange}
                  />
                  <span>Gluten Free (+$5)</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_vegan"
                    checked={formData.is_vegan}
                    onChange={handleInputChange}
                  />
                  <span>Vegan (+$5)</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_sugar_free"
                    checked={formData.is_sugar_free}
                    onChange={handleInputChange}
                  />
                  <span>Sugar Free (+$3)</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_dairy_free"
                    checked={formData.is_dairy_free}
                    onChange={handleInputChange}
                  />
                  <span>Dairy Free (+$3)</span>
                </label>
              </div>
            </div>

            {/* Toppings */}
            {customizationOptions.topping && customizationOptions.topping.length > 0 && (
              <div className="form-section">
                <h3>Toppings</h3>
                <div className="topping-grid">
                  {customizationOptions.topping.map(topping => (
                    <button
                      key={topping.id}
                      type="button"
                      className={`topping-btn ${formData.toppings.includes(topping.id) ? 'selected' : ''}`}
                      onClick={() => handleToppingToggle(topping.id)}
                    >
                      {topping.name}
                      {topping.price > 0 && <span className="price">+${topping.price}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message on Cake */}
            <div className="form-section">
              <label htmlFor="message_on_cake">
                <h3>Message on Cake (Optional)</h3>
              </label>
              <input
                type="text"
                id="message_on_cake"
                name="message_on_cake"
                value={formData.message_on_cake}
                onChange={handleInputChange}
                placeholder="e.g., Happy Birthday John!"
                maxLength="200"
                className="form-input"
              />
              <small>{formData.message_on_cake.length}/200 characters</small>
            </div>

            {/* Reference Images */}
            <div className="form-section">
              <h3>Upload Reference Images (Optional)</h3>
              <p className="help-text">Upload pictures of cakes you like for reference</p>
              
              <div className="upload-area">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-input"
                />
                <label htmlFor="images" className="upload-label">
                  📷 Choose Images
                </label>
              </div>

              {uploadedImages.length > 0 && (
                <div className="uploaded-images">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="image-preview">
                      <img src={img.url} alt={`Reference ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-img-btn"
                        onClick={() => removeImage(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Special Notes */}
            <div className="form-section">
              <label htmlFor="notes">
                <h3>Special Instructions (Optional)</h3>
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any special requests or instructions?"
                rows="4"
                maxLength="1000"
                className="form-textarea"
              />
              <small>{formData.notes.length}/1000 characters</small>
            </div>

            {/* Quantity */}
            <div className="form-section">
              <label htmlFor="quantity">
                <h3>Quantity</h3>
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                max="50"
                value={formData.quantity}
                onChange={handleInputChange}
                className="form-input quantity-input"
              />
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="order-summary">
            <div className="summary-card">
              <h3>Order Summary</h3>
              
              <div className="summary-item">
                <span>Shape:</span>
                <strong>{formData.cake_shape}</strong>
              </div>
              
              <div className="summary-item">
                <span>Size:</span>
                <strong>{formData.cake_size}</strong>
              </div>
              
              <div className="summary-item">
                <span>Layers:</span>
                <strong>{formData.cake_layers}</strong>
              </div>
              
              {formData.flavor && (
                <div className="summary-item">
                  <span>Flavor:</span>
                  <strong>{formData.flavor}</strong>
                </div>
              )}
              
              {formData.toppings.length > 0 && (
                <div className="summary-item">
                  <span>Toppings:</span>
                  <strong>{formData.toppings.length} selected</strong>
                </div>
              )}
              
              <div className="summary-item">
                <span>Quantity:</span>
                <strong>{formData.quantity}</strong>
              </div>
              
              <div className="summary-divider" />
              
              <div className="summary-total">
                <span>Total Price:</span>
                <strong className="price">KSh {calculatePrice().toFixed(2)}</strong>
              </div>
              
              <button
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add to Cart'}
              </button>
              
              <p className="help-text">Minimum 48 hours notice required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;
