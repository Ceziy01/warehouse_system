import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

import PageHeader from "../../components/PageHeader/PageHeader";
import { fetchWithAuth } from "../../utils/api";
import { useAuth } from "../../Auth/AuthContext";
import ActionButton from "../../components/ActionButton/ActionButton";
import PurchaseCreateModal from "./PurchaseCreateModal";
import CompletePurchaseModal from "./CompletePurchaseModal";
import { exportTableToExcel } from "../../utils/export";
import "../../styles/shared.css";

function PurchasesPage() {
  const { user } = useAuth();
  const [allPurchases, setAllPurchases] = useState([]); // все закупки
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Состояние фильтров
  const [filters, setFilters] = useState({
    supplier_id: "",
    warehouse_id: "",
    status: "",
    date_from: "",
    date_to: "",
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [updating, setUpdating] = useState({});

  const canEdit =
    user?.role === "admin" || user?.role === "purchase_manager";
  const canComplete =
    user?.role === "admin" ||
    user?.role === "purchase_manager" ||
    user?.role === "warehouse_keeper";

  const tableRef = useRef(null);

  // Загрузка всех закупок, поставщиков и складов
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [purRes, supRes, whRes] = await Promise.all([
          fetchWithAuth("/purchases"),
          fetchWithAuth("/suppliers"),
          fetchWithAuth("/warehouses"),
        ]);
        if (purRes.ok) {
          const data = await purRes.json();
          setAllPurchases(data);
        } else {
          toast.error("Ошибка загрузки закупок");
        }
        if (supRes.ok) setSuppliers(await supRes.json());
        if (whRes.ok) setWarehouses(await whRes.json());
      } catch (error) {
        toast.error("Ошибка загрузки данных");
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredPurchases = allPurchases.filter((p) => {
    if (filters.supplier_id && String(p.supplier_id) !== filters.supplier_id) return false;

    if (filters.warehouse_id && String(p.warehouse_id) !== filters.warehouse_id) return false;

    if (filters.status && p.status !== filters.status) return false;

    if (filters.date_from && new Date(p.created_at) < new Date(filters.date_from)) return false;

    if (filters.date_to && new Date(p.created_at) > new Date(filters.date_to)) return false;
    return true;
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      supplier_id: "",
      warehouse_id: "",
      status: "",
      date_from: "",
      date_to: "",
    });
  };

  const hasFilters = Object.values(filters).some((v) => v !== "");

  const loadAllPurchases = async () => {
    const res = await fetchWithAuth("/purchases");
    if (res.ok) {
      setAllPurchases(await res.json());
    } else {
      toast.error("Ошибка загрузки закупок");
    }
  };

  const handleCreate = () => setCreateModalOpen(true);

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить закупку?")) return;
    setUpdating((prev) => ({ ...prev, [id]: true }));
    const res = await fetchWithAuth(`/purchases/${id}`, { method: "DELETE" });
    setUpdating((prev) => ({ ...prev, [id]: false }));
    if (res.ok) {
      loadAllPurchases();
    } else {
      const err = await res.json();
      toast.error(err.detail || "Ошибка удаления");
    }
  };

  const handleInitiate = async (id) => {
    if (!window.confirm("Инициировать закупку?")) return;
    setUpdating((prev) => ({ ...prev, [id]: true }));
    const res = await fetchWithAuth(`/purchases/${id}/status?status=initiated`, {
      method: "PATCH",
    });
    setUpdating((prev) => ({ ...prev, [id]: false }));
    if (res.ok) {
      loadAllPurchases();
    } else {
      const err = await res.json();
      toast.error(err.detail || "Ошибка изменения статуса");
    }
  };

  const handleCancelClick = async (id) => {
    if (!window.confirm("Вы точно хотите отменить закупку?")) return;
    setUpdating((prev) => ({ ...prev, [id]: true }));
    const res = await fetchWithAuth(
      `/purchases/${id}/status?status=cancelled`,
      { method: "PATCH" }
    );
    setUpdating((prev) => ({ ...prev, [id]: false }));
    if (res.ok) {
      loadAllPurchases();
    } else {
      toast.error("Ошибка изменения статуса");
    }
  };

  const handleCompleteClick = (purchase) => {
    setSelectedPurchase(purchase);
    setCompleteModalOpen(true);
  };

  const handleSave = () => {
    setCreateModalOpen(false);
    setCompleteModalOpen(false);
    loadAllPurchases();
  };

  const handleExport = () => {
    const table = document.querySelector(".purchases-table");
    if (table) {
      exportTableToExcel(
        table,
        `закупки_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}`
      );
    }
  };

  const statusColors = {
    created: "var(--text-secondary)",
    initiated: "#fd7e14",
    completed: "#28a745",
    cancelled: "red",
  };

  const statusLabels = {
    created: "Создана",
    initiated: "Инициирована",
    completed: "Завершена",
    cancelled: "Отменена",
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <PageHeader icon="shopping_bag" title="Управление закупками" />
        <div style={{ display: "flex", gap: "10px" }}>
          {canEdit && (
            <button className="primary-btn" onClick={handleCreate}>
              Создать закупку
            </button>
          )}
          <ActionButton type="excel" tip="Экспорт в Excel" onClick={handleExport}>
            <span className="material-symbols-outlined">table_view</span>
          </ActionButton>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="filters-panel">
        <div className="filters-row">
          <div className="filter-group">
            <label>Поставщик</label>
            <select
              value={filters.supplier_id}
              onChange={(e) => handleFilterChange("supplier_id", e.target.value)}
            >
              <option value="">Все</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Склад</label>
            <select
              value={filters.warehouse_id}
              onChange={(e) => handleFilterChange("warehouse_id", e.target.value)}
            >
              <option value="">Все</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Статус</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">Все</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>С даты</label>
            <input
              type="datetime-local"
              value={filters.date_from}
              onChange={(e) => handleFilterChange("date_from", e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>По дату</label>
            <input
              type="datetime-local"
              value={filters.date_to}
              onChange={(e) => handleFilterChange("date_to", e.target.value)}
            />
          </div>
        </div>

        {hasFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            <span className="material-symbols-outlined">filter_alt_off</span>
            Сбросить фильтры
          </button>
        )}
      </div>

      <table className="table purchases-table" ref={tableRef}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Товар</th>
            <th>Кол-во</th>
            <th>Закуп. цена (₽)</th>
            <th>Поставщик</th>
            <th>Склад</th>
            <th>Статус</th>
            <th>Дата</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {filteredPurchases.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.product_name}</td>
              <td>{p.quantity}</td>
              <td>{p.purchase_price.toFixed(2)}</td>
              <td>{p.supplier_name || p.supplier_id}</td>
              <td>{p.warehouse_name || p.warehouse_id}</td>
              <td style={{ color: statusColors[p.status] }}>
                {statusLabels[p.status]}
              </td>
              <td>{new Date(p.created_at).toLocaleString()}</td>
              <td>
                <div className="actions-container">
                  {canEdit && p.status === "created" && (
                    <ActionButton
                      type="neutral"
                      onClick={() => handleInitiate(p.id)}
                      tip="Инициировать"
                      disabled={updating[p.id]}
                    >
                      <span className="material-symbols-outlined">
                        play_arrow
                      </span>
                    </ActionButton>
                  )}
                  {canEdit && p.status === "created" && (
                    <ActionButton
                      type="danger"
                      onClick={() => handleDelete(p.id)}
                      tip="Удалить"
                      disabled={updating[p.id]}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </ActionButton>
                  )}
                  {canComplete && p.status === "initiated" && (
                    <ActionButton
                      type="apply"
                      onClick={() => handleCompleteClick(p)}
                      tip="Завершить"
                      disabled={updating[p.id]}
                    >
                      <span className="material-symbols-outlined">check</span>
                    </ActionButton>
                  )}
                  {canComplete && p.status === "initiated" && (
                    <ActionButton
                      type="danger"
                      onClick={() => handleCancelClick(p.id)}
                      tip="Отменить"
                      disabled={updating[p.id]}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </ActionButton>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {filteredPurchases.length === 0 && (
            <tr>
              <td colSpan="9" style={{ textAlign: "center", padding: "30px" }}>
                Нет закупок, соответствующих фильтрам
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {createModalOpen && (
        <PurchaseCreateModal
          onClose={() => setCreateModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {completeModalOpen && selectedPurchase && (
        <CompletePurchaseModal
          purchase={selectedPurchase}
          onClose={() => setCompleteModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default PurchasesPage;