import { useState, useEffect } from "react";
import api from "../../utils/api";
import "./CustomizationsTab.css";
import { formatPrice } from "../../utils/formatting";

const CustomizationsTab = () => {
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

  const loadCustomizations = async () => {
    try {
      const res = await api.get("/customizations");
      const flatCustomizations = res.data;

      const groupedObject = flatCustomizations.reduce((acc, item) => {
        item.price = parseFloat(item.price || 0);
        acc[item.category] = acc[item.category] || [];
        acc[item.category].push(item);
        return acc;
      }, {});

      const groupedArray = Object.entries(groupedObject).map(
        ([category, options]) => ({
          category,
          options,
        })
      );

      setCustomizations(groupedArray);
    } catch (err) {
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
      const submissionData = { ...form, price: parseFloat(form.price) };
      if (editingId) {
        await api.put(`/admin/customizations/${editingId}`, submissionData);
      } else {
        await api.post("/admin/customizations", submissionData);
      }
      // Resetting to empty strings instead of nulls keeps the inputs "controlled"
      setForm({ category: "", name: "", price: 0, active: true });
      setEditingId(null);
      loadCustomizations();
    } catch (err) {
      setError("Failed to save customization.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (option) => {
    setForm({
      category: option.category || "",
      name: option.name || "",
      price: option.price ?? 0,
      active: option.active ?? true,
    });
    setEditingId(option.id || option._id);
  };

  const handleDelete = async (targetId) => {
    if (!targetId) {
      setError("Missing ID for deletion");
      return;
    }
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/admin/customizations/${targetId}`);
      loadCustomizations();
    } catch (err) {
      setError("Failed to delete.");
    }
  };

  return (
    <div className="customizations-tab">
      <h2>Manage Options</h2>
      <form className="customization-form" onSubmit={handleSubmit}>
        <input
          name="category"
          placeholder="Category"
          /* FIX: Fallback to "" prevents 'controlled to uncontrolled' error */
          value={form.category || ""}
          onChange={handleChange}
          required
        />
        <input
          name="name"
          placeholder="Name"
          /* FIX: Fallback to "" */
          value={form.name || ""}
          onChange={handleChange}
          required
        />
        <input
          name="price"
          type="number"
          /* FIX: Fallback to 0 */
          value={form.price ?? 0}
          onChange={handleChange}
        />
        <label>
          <input
            type="checkbox"
            name="active"
            checked={form.active}
            onChange={handleChange}
          />{" "}
          Active
        </label>
        <button type="submit" disabled={loading}>
          {editingId ? "Update" : "Add"}
        </button>
      </form>

      {error && (
        <p className="error-message" style={{ color: "red" }}>
          {error}
        </p>
      )}

      <div className="customizations-list">
        {customizations.map((group) => (
          <div key={group.category} className="customization-group">
            <h3>{group.category.replace(/_/g, " ")}</h3>
            {group.options?.map((option, index) => (
              /* FIX: Added index as a final fallback for the key warning */
              <div
                key={option.id || option._id || `opt-${index}`}
                className="customization-item"
              >
                <span>
                  {option.name} — {formatPrice(option.price)}
                </span>
                <div className="actions">
                  <button onClick={() => handleEdit(option)}>Edit</button>
                  <button onClick={() => handleDelete(option.id || option._id)}>
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
