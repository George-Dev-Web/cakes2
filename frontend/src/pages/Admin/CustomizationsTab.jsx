// frontend/src/pages/Admin/CustomizationsTab.jsx
import { useState, useEffect } from "react";
import api from "../../utils/api";
import "./CustomizationsTab.css";
import { formatPrice } from "../../utils/formatting";

const CustomizationsTab = () => {
  // customizations state still holds the GROUPED array structure for rendering
  const [customizations, setCustomizations] = useState([]);
  const [form, setForm] = useState({
    category: "",
    name: "",
    price: 0,
    active: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * REWRITTEN: Fetches the flat array and groups it by category.
   */
  const loadCustomizations = async () => {
    try {
      const res = await api.get('/customizations');
      const flatCustomizations = res.data; // This is now a flat array

      // 1. Group the flat array into an object: { category: [options] }
      const groupedObject = flatCustomizations.reduce((acc, item) => {
        // Ensure item.price is treated as a number
        item.price = parseFloat(item.price || 0);

        // Initialize the array for the category if it doesn't exist
        acc[item.category] = acc[item.category] || [];

        // Add the current item to its category array
        acc[item.category].push(item);
        return acc;
      }, {});

      // 2. Convert the grouped object into the final array state:
      // [{ category: "Flavor", options: [...] }, ...]
      const groupedArray = Object.entries(groupedObject).map(
        ([category, options]) => ({
          category,
          options,
        })
      );

      setCustomizations(groupedArray);
    } catch (err) {
      console.error(err);
      setError("Failed to load customizations.");
    }
  };

  useEffect(() => {
    loadCustomizations();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!form.category || !form.name) {
        setError("Category and Name are required");
        setLoading(false);
        return;
      }

      // Prepare data for the backend, ensuring price is a number
      const submissionData = {
        ...form,
        price: parseFloat(form.price),
      };

      if (editingId) {
        await api.put(`/admin/customizations/${editingId}`, submissionData);
      } else {
        await api.post('/admin/customizations', submissionData);
      }
      setForm({ category: "", name: "", price: 0, active: true });
      setEditingId(null);
      // Reload customizations to show the update
      loadCustomizations();
    } catch (err) {
      console.error(err);
      setError("Failed to save customization.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (option) => {
    setForm({
      category: option.category,
      name: option.name,
      price: option.price,
      // Check for 'active' property, defaulting to true if not present
      active: option.active ?? true,
    });
    setEditingId(option.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customization?"))
      return;
    try {
      await api.delete(`/admin/customizations/${id}`);
      loadCustomizations();
    } catch (err) {
      console.error(err);
      setError("Failed to delete customization.");
    }
  };

  // The rendering part remains the same since the state structure is preserved

  return (
    <div className="customizations-tab">
      <h2>Cake Customization Options</h2>

      <form className="customization-form" onSubmit={handleSubmit}>
        <input
          name="category"
          placeholder="Category (e.g., Flavor, Shape, Frosting)"
          value={form.category}
          onChange={handleChange}
          required
        />
        <input
          name="name"
          placeholder="Option name (e.g., Chocolate, Round, Vanilla)"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="price"
          type="number"
          placeholder="Extra price"
          value={form.price}
          onChange={handleChange}
        />
        <label>
          <input
            type="checkbox"
            name="active"
            checked={form.active}
            onChange={handleChange}
          />
          Active
        </label>
        <button type="submit" disabled={loading}>
          {editingId ? "Update" : "Add"} Option
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="customizations-list">
        {customizations.length === 0 && (
          <p>No customization options available.</p>
        )}

        {customizations.map((group) => (
          <div key={group.category} className="customization-group">
            <h3>{group.category}</h3>
            {/* Added optional chaining (?) just in case, though data is grouped */}
            {group.options?.map((option) => (
              <div key={option.id} className="customization-item">
                <span>
                  {option.name} — {formatPrice(option.price)}{" "}
                  {!option.active && "(Inactive)"}
                </span>
                <div className="actions">
                  <button onClick={() => handleEdit(option)}>Edit</button>
                  <button onClick={() => handleDelete(option.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomizationsTab;
