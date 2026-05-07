import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { fetchWithAuth } from "../../utils/api";

function PurchaseCreateModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    product_name: "",
    quantity: 1,
    purchase_price: 0,
    supplier_id: "",
    warehouse_id: ""
  });
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [supRes, whRes] = await Promise.all([
        fetchWithAuth("/suppliers"),
        fetchWithAuth("/warehouses")
      ]);
      if (supRes.ok) setSuppliers(await supRes.json());
      if (whRes.ok) setWarehouses(await whRes.json());
    };
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_name.trim() || !form.supplier_id || !form.warehouse_id) {
      toast.error("Заполните все поля");
      return;
    }
    if (form.quantity < 1) {
      toast.error("Количество должно быть не менее 1");
      return;
    }
    if (form.purchase_price < 0) {
      toast.error("Цена не может быть отрицательной");
      return;
    }

    setLoading(true);
    const res = await fetchWithAuth("/purchases", {
      method: "POST",
      body: JSON.stringify(form)
    });
    setLoading(false);
    if (res.ok) {
      onSave();
    } else {
      const err = await res.json();
      toast.error(err.detail || "Ошибка создания закупки");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: "500px" }} onClick={e => e.stopPropagation()}>
        <h3>Новая закупка</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              className="modal-input"
              placeholder="Название товара *"
              value={form.product_name}
              onChange={e => setForm({ ...form, product_name: e.target.value })}
              required
            />
          </div>
          <div className="form-row" style={{ gap: "10px" }}>
            <input
              type="number"
              className="modal-input"
              placeholder="Количество *"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
              min="1"
              required
            />
            <input
              type="number"
              className="modal-input"
              placeholder="Закупочная цена (₽) *"
              value={form.purchase_price}
              onChange={e => setForm({ ...form, purchase_price: parseFloat(e.target.value) || 0 })}
              min="0"
              step="1"
              required
            />
          </div>
          <div className="form-row" style={{ gap: "10px" }}>
            <select
              className="modal-input"
              value={form.supplier_id}
              onChange={e => setForm({ ...form, supplier_id: e.target.value })}
              required
            >
              <option value="">Поставщик *</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select
              className="modal-input"
              value={form.warehouse_id}
              onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
              required
            >
              <option value="">Склад *</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="modal-btn primary" disabled={loading}>
              {loading ? "Создание..." : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PurchaseCreateModal;