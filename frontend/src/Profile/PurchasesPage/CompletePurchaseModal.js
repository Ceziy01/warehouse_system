import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { fetchWithAuth } from "../../utils/api";
import { API_BASE_URL } from "../../config";

function CompletePurchaseModal({ purchase, onClose, onSave }) {
  const [form, setForm] = useState({
    article: "",
    description: "",
    unit: "шт",
    shelf_life_days: "",
    selling_price: 0,
    category_id: "",
    image_url: null
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      const res = await fetchWithAuth("/categories");
      if (res.ok) setCategories(await res.json());
    };
    loadCategories();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/items/upload-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: formData
    });

    if (!res.ok) {
      toast.error("Ошибка загрузки картинки");
      return;
    }

    const data = await res.json();
    setForm(prev => ({ ...prev, image_url: data.image_url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.article.trim() || !form.unit.trim()) {
      toast.error("Заполните обязательные поля (артикул, единица измерения)");
      return;
    }
    if (form.selling_price < 0) {
      toast.error("Цена продажи не может быть отрицательной");
      return;
    }

    setLoading(true);
    const payload = {
      article: form.article,
      description: form.description || null,
      unit: form.unit,
      shelf_life_days: form.shelf_life_days ? parseInt(form.shelf_life_days) : null,
      selling_price: form.selling_price,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      image_url: form.image_url
    };
    const res = await fetchWithAuth(`/purchases/${purchase.id}/complete`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setLoading(false);
    if (res.ok) {
      onSave();
    } else {
      const err = await res.json();
      toast.error(err.detail || "Ошибка завершения закупки");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: "600px" }} onClick={e => e.stopPropagation()}>
        <h3>Завершение закупки: {purchase.product_name}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              className="modal-input"
              placeholder="Артикул *"
              value={form.article}
              onChange={e => setForm({ ...form, article: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <textarea
              className="modal-input"
              placeholder="Описание"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows="3"
            />
          </div>
          <div className="form-row" style={{ gap: "10px" }}>
            <input
              type="text"
              className="modal-input"
              placeholder="Единица измерения *"
              value={form.unit}
              onChange={e => setForm({ ...form, unit: e.target.value })}
              required
            />
            <input
              type="number"
              className="modal-input"
              placeholder="Срок годности (дни)"
              value={form.shelf_life_days}
              onChange={e => setForm({ ...form, shelf_life_days: e.target.value })}
            />
          </div>
          <div className="form-row" style={{ gap: "10px" }}>
            <input
              type="number"
              className="modal-input"
              placeholder="Цена продажи (₽) *"
              value={form.selling_price}
              onChange={e => setForm({ ...form, selling_price: parseFloat(e.target.value) || 0 })}
              min="0"
              step="1"
              required
            />
            <select
              className="modal-input"
              value={form.category_id}
              onChange={e => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">Категория (необязательно)</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <input type="file" onChange={handleFileUpload} />
            {form.image_url && (
              <div style={{ marginTop: "10px" }}>
                <img src={`${API_BASE_URL}${form.image_url}`} alt="" style={{ maxWidth: "150px", borderRadius: "6px" }} />
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="modal-btn primary" disabled={loading}>
              {loading ? "Завершение..." : "Завершить закупку"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompletePurchaseModal;