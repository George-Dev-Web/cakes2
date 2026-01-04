// frontend/src/pages/Admin/CustomizationOptions.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import "./CustomizationOptions.css";

const normalizeCategory = (raw) =>
  raw ? raw.toString().trim().toLowerCase() : "";

export default function CustomizationOptions() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]); // New state for dynamic categories

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null => create, object => edit

  const [form, setForm] = useState({
    name: "",
    category: "", // Initialize with empty string or default
    price: "",
    description: "",
    image_url: "",
    is_active: true,
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/customizations/categories");
        setCategories(response.data.categories);
        // Set a default category if none is selected for new forms
        if (!form.category && response.data.categories.length > 0) {
          setForm((prevForm) => ({
            ...prevForm,
            category: response.data.categories[0],
          }));
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories.");
      }
    };
    fetchCategories();
  }, []); // Empty dependency array to run only once on mount

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // prefer admin list endpoint if present
      let resp;
      try {
        resp = await api.get("/admin/customizations");
      } catch {
        // fallback to public endpoint if admin endpoint doesn't exist
        resp = await api.get("/customizations");
      }

      // Backend may return grouped categories or flat list.
      // Normalize to flat array of options.
      const data = resp.data;
      let flat = [];

      // If backend returns grouped array of categories (frontend earlier expects array of {name, displayName, options})
      if (Array.isArray(data)) {
        // check if first element has options
        if (data.length && data[0].options) {
          data.forEach((cat) => {
            cat.options.forEach((opt) =>
              flat.push({ ...opt, category: normalizeCategory(cat.name) })
            );
          });
        } else {
          // maybe it's already a flat array
          flat = data;
        }
      } else if (typeof data === "object") {
        // could be grouped object { design: [...], topping: [...] }
        Object.entries(data).forEach(([cat, opts]) => {
          opts.forEach((opt) =>
            flat.push({ ...opt, category: normalizeCategory(cat) })
          );
        });
      } else {
        flat = [];
      }

      // normalize fields
      flat = flat.map((f) => ({
        id: f.id,
        name: f.name,
        category:
          f.category || normalizeCategory(f.category || f.type || "other"),
        price: Number(f.price ?? f.extra_price ?? 0),
        description: f.description ?? "",
        image_url: f.image_url ?? f.image ?? "",
        is_active: f.is_active ?? f.active ?? true,
        created_at: f.created_at ?? f.createdAt ?? null,
      }));

      // sort by category then name
      flat.sort((a, b) => {
        if (a.category === b.category) return a.name.localeCompare(b.name);
        return a.category.localeCompare(b.category);
      });

      setItems(flat);
    } catch (err) {
      console.error("Error loading customizations:", err);
      setError("Failed to load customization options.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser || !currentUser.is_admin) {
      navigate("/", { replace: true });
      return;
    }
    loadItems();
  }, [currentUser, navigate, loadItems]);

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      category: categories.length > 0 ? categories[0] : "", // Default to first fetched category
      price: "",
      description: "",
      image_url: "",
      is_active: true,
    });
    setIsModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name || "",
      category: item.category ? item.category : "", // Use item's category
      price: item.price ?? "",
      description: item.description ?? "",
      image_url: item.image_url ?? "",
      is_active: !!item.is_active,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function onFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // client-side validation
      if (!form.name || !form.category) {
        setError("Please provide at least a name and category.");
        setSaving(false);
        return;
      }

      const payload = {
        name: form.name,
        category: form.category.toString().toLowerCase(),
        price: Number(form.price || 0),
        description: form.description,
        image_url: form.image_url,
        is_active: !!form.is_active,
      };

      if (editing) {
        await api.put(`/admin/customizations/${editing.id}`, payload);
      } else {
        await api.post("/admin/customizations", payload);
      }

      await loadItems();
      closeModal();
    } catch (err) {
      console.error("Save error:", err);
      setError(
        (err.response && err.response.data && err.response.data.message) ||
          "Failed to save customization."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`))
      return;
    setSaving(true);
    setError("");
    try {
      await api.delete(`/admin/customizations/${item.id}`);
      await loadItems();
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete option.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item) {
    setSaving(true);
    setError("");
    try {
      await api.put(`/admin/customizations/${item.id}`, {
        is_active: !item.is_active,
      });
      await loadItems();
    } catch (err) {
      console.error("Toggle active error:", err);
      setError("Failed to update option.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-customizations-page">
      <div className="admin-header">
        <h2>Customization Manager</h2>
        <p className="sub">
          Create and manage cake customization options (designs, toppings,
          flavours, art, and more). Changes reflect on the Order page
          immediately.
        </p>
        <div className="actions">
          <button className="btn primary" onClick={openCreate}>
            + Add Option
          </button>
          <button className="btn" onClick={loadItems} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="customizations-list">
        {loading ? (
          <div className="placeholder">Loading options...</div>
        ) : items.length === 0 ? (
          <div className="placeholder">No customization options found.</div>
        ) : (
          // group by category for display
          Object.entries(
            items.reduce((acc, it) => {
              acc[it.category] = acc[it.category] || [];
              acc[it.category].push(it);
              return acc;
            }, {})
          ).map(([cat, opts]) => (
            <section key={cat} className="category-block">
              <h3 className="category-title">{cat.toUpperCase()}</h3>
              <div className="options-grid">
                {opts.map((opt) => (
                  <div className="option-card" key={opt.id}>
                    <div className="option-card-top">
                      {opt.image_url ? (
                        // image preview
                        <img
                          src={opt.image_url}
                          alt={opt.name}
                          className="option-image"
                          onError={(e) => {
                            e.currentTarget.style.opacity = 0.6;
                          }}
                        />
                      ) : (
                        <div className="option-image placeholder">No image</div>
                      )}
                      <div className="option-meta">
                        <h4 className="option-name">{opt.name}</h4>
                        <div className="option-price">{`KSh ${Number(
                          opt.price
                        ).toLocaleString("en-KE")}`}</div>
                      </div>
                    </div>

                    <div className="option-body">
                      <p className="option-desc">
                        {opt.description ? opt.description : "—"}
                      </p>
                    </div>

                    <div className="option-actions">
                      <button
                        className="btn small"
                        onClick={() => openEdit(opt)}
                        title="Edit"
                      >
                        Edit
                      </button>

                      <button
                        className={`btn small ${opt.is_active ? "" : "muted"}`}
                        onClick={() => toggleActive(opt)}
                        title={opt.is_active ? "Deactivate" : "Activate"}
                      >
                        {opt.is_active ? "Active" : "Inactive"}
                      </button>

                      <button
                        className="btn small danger"
                        onClick={() => handleDelete(opt)}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Modal for create/edit */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="modal"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <h3>{editing ? "Edit Option" : "Add Customization Option"}</h3>

            <form onSubmit={handleSave} className="modal-form">
              <label>
                Name<span className="req">*</span>
                <input name="name" value={form.name} onChange={onFormChange} />
              </label>

              <label>
                Category<span className="req">*</span>
                <select
                  name="category"
                  value={form.category}
                  onChange={onFormChange}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Price (KSh)
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={onFormChange}
                />
              </label>

              <label>
                Image URL
                <input
                  name="image_url"
                  value={form.image_url}
                  onChange={onFormChange}
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={onFormChange}
                />
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={!!form.is_active}
                  onChange={onFormChange}
                />
                <span>Active</span>
              </label>

              {error && <div className="form-error">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn" onClick={closeModal}>
                  Cancel
                </button>
                <button className="btn primary" type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Save Changes"
                    : "Create Option"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
