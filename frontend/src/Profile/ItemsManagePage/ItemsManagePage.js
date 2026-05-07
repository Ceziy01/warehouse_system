import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "../../Auth/AuthContext";
import PageHeader from "../../components/PageHeader/PageHeader";
import { fetchWithAuth } from "../../utils/api";
import { API_BASE_URL } from "../../config";
import ItemModal from "./ItemModal";
import ActionButton from "../../components/ActionButton/ActionButton";
import "./ItemsManagePage.css";
import { exportTableToExcel } from "../../utils/export";

function ItemsManagePage() {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "warehouse_keeper";

  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const tableRef = useRef(null);

  const handleExport = () => {
    if (tableRef.current) {
      exportTableToExcel(tableRef.current, `товары_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}`);
    }
  };

  const loadItems = async () => {
    const res = await fetchWithAuth("/items");
    if (!res.ok) return toast.error("Не удалось загрузить товары");
    setItems(await res.json());
  };

  const searchItems = async () => {
    if (!searchQuery.trim()) {
      loadItems();
      return;
    }
    const res = await fetchWithAuth(`/items/search/${encodeURIComponent(searchQuery)}`);
    if (!res.ok) {
      toast.error("Ошибка поиска");
      return;
    }
    const data = await res.json();
    setItems(data);
  };

  const resetSearch = () => {
    setSearchQuery("");
    loadItems();
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить товар?")) return;

    const res = await fetchWithAuth(`/items/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const error = await res.json();
      toast.error(error.detail || "Ошибка удаления");
      return;
    }

    loadItems();
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    closeModal();
    loadItems();
  };

  const formatShelfLife = (days) => {
    if (days === null || days === undefined) return "бессрочно";
    return `${days} дн.`;
  };

  return (
    <div className="container">
      <div className="items-header">
        <PageHeader icon="inventory_2" title="Товары" />
        <div className="search-section">
          <ActionButton type="excel" tip="Экспорт в Excel" onClick={handleExport}>
            <span className="material-symbols-outlined">table_view</span>
          </ActionButton>
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Поиск"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchItems()}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={resetSearch} className="search-clear">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            )}
          </div>
          <button className="primary-btn" onClick={searchItems}>Найти</button>
          {canEdit && (
            <button className="primary-btn" onClick={openCreateModal}>Добавить товар</button>
          )}
        </div>
      </div>

      <table ref={tableRef} className="table items-table">
        <thead>
          <tr>
            <th style={{ width: '50px' }}>ID</th>
            <th style={{ width: '120px' }}>Артикул</th>
            <th>Название</th>
            <th style={{ width: '140px' }}>Категория</th>
            <th style={{ width: '80px' }}>Кол-во</th>
            <th style={{ width: '60px' }}>Ед.</th>
            <th style={{ width: '100px' }}>Цена</th>
            <th style={{ width: '140px' }}>Склад</th>
            <th style={{ width: '100px' }}>Срок</th>
            {canEdit && <th style={{ width: '140px' }}>Действия</th>}
          </tr>
        </thead>

        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.article}</td>
              <td>{item.name}</td>
              <td>{item.category_name || "—"}</td>
              <td>{item.quantity}</td>
              <td>{item.unit}</td>
              <td>{item.price} ₽</td>
              <td>{item.warehouse_name || "—"}</td>
              <td>{formatShelfLife(item.shelf_life_days)}</td>

              {canEdit && (
                <td>
                  <div className="actions-container">
                    <ActionButton type="extra" onClick={() => { setSelectedImage(item.image_url); setImageModalOpen(true); }} tip="Предпросмотр"><span className="material-symbols-outlined">visibility</span></ActionButton> 
                    <ActionButton type="danger" onClick={() => handleDelete(item.id)} tip="Удалить"><span className="material-symbols-outlined">delete</span></ActionButton>
                    <ActionButton type="neutral" onClick={() => openEditModal(item)} tip="Редактировать"><span className="material-symbols-outlined">edit</span></ActionButton>
                  </div>
                </td>
              )}
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan={canEdit ? 10 : 9} style={{ textAlign: "center", padding: "30px" }}>
                Ничего не найдено
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {modalOpen && (
        <ItemModal
          item={editingItem}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {imageModalOpen && (
        <div
          className="image-modal-overlay"
          onClick={() => setImageModalOpen(false)}
        >
          <div
            className="image-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`${API_BASE_URL}${selectedImage}`}
              alt=""
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemsManagePage;