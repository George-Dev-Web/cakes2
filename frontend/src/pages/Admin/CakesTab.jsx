import { useState } from "react";
import { createCake, updateCake, deleteCake } from "../../utils/api";
import { formatPrice } from "../../utils/formatting";

const CakesTab = ({ cakes, onRefresh }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCake, setEditingCake] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCake) {
        await updateCake(editingCake.id, formData);
      } else {
        await createCake(formData);
      }
      setFormData({ name: "", description: "", price: "", image_url: "" });
      setEditingCake(null);
      setIsAdding(false);
      onRefresh();
    } catch (err) {
      console.error("Error saving cake:", err);
    }
  };

  const handleEdit = (cake) => {
    setEditingCake(cake);
    setFormData({
      name: cake.name,
      description: cake.description,
      price: cake.price,
      image_url: cake.image_url,
    });
    setIsAdding(true);
  };

  const handleDelete = async (cakeId) => {
    if (window.confirm("Are you sure you want to delete this cake?")) {
      try {
        await deleteCake(cakeId);
        onRefresh();
      } catch (err) {
        console.error("Error deleting cake:", err);
      }
    }
  };

  return (
    <div className="cakes-management">
      <div className="cakes-header">
        <h3>Cake Inventory</h3>
        <button onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? "Cancel" : "Add New Cake"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="cake-form">
          <h4>{editingCake ? "Edit Cake" : "Add New Cake"}</h4>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Price (KSh):</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Image URL:</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
              }
              required
            />
          </div>
          <button type="submit">
            {editingCake ? "Update Cake" : "Add Cake"}
          </button>
        </form>
      )}

      <div className="cakes-grid">
        {cakes.map((cake) => (
          <div key={cake.id} className="cake-card">
            <img src={cake.image_url} alt={cake.name} />
            <div className="cake-info">
              <h4>{cake.name}</h4>
              <p>{cake.description}</p>
              <div className="cake-price">{formatPrice(cake.price)}</div>
              <div className="cake-actions">
                <button onClick={() => handleEdit(cake)}>Edit</button>
                <button onClick={() => handleDelete(cake.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CakesTab;
