import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

import PageHeader from "../../components/PageHeader/PageHeader";
import { useAuth } from "../../Auth/AuthContext";
import { fetchWithAuth } from "../../utils/api";
import ActionButton from "../../components/ActionButton/ActionButton";
import { exportTableToExcel } from "../../utils/export";
import "../../styles/shared.css"

function WarehousesPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "warehouse_keeper";

  const [warehouses, setWarehouses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", address: "" });

  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const tableRef = useRef(null);

  const handleExport = () => {
    if (tableRef.current) {
      exportTableToExcel(tableRef.current, `склады_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}`);
    }
  };

  const loadWarehouses = async () => {
    const res = await fetchWithAuth("/warehouses");
    if (!res.ok) return toast.error("Не удалось загрузить склады");
    setWarehouses(await res.json());
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const filteredWarehouses = warehouses.filter(wh => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      wh.name.toLowerCase().includes(query) ||
      wh.address.toLowerCase().includes(query)
    );
  });

  const createWarehouse = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newAddress.trim()) {
      toast.error("Заполните все поля");
      return;
    }
    const res = await fetchWithAuth("/warehouses", {
      method: "POST",
      body: JSON.stringify({ name: newName, address: newAddress })
    });
    if (!res.ok) {
      const error = await res.json();
      toast.error(error.detail || "Ошибка создания");
      return;
    }
    setNewName("");
    setNewAddress("");
    loadWarehouses();
  };

  const deleteWarehouse = async (id) => {
    if (!window.confirm("Удалить склад?")) return;
    const res = await fetchWithAuth(`/warehouses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json();
      toast.error(error.detail || "Ошибка удаления");
      return;
    }
    loadWarehouses();
  };

  const startEdit = (wh) => {
    setEditingId(wh.id);
    setEditForm({ name: wh.name, address: wh.address });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.address.trim()) {
      toast.error("Все поля обязательны");
      return;
    }
    const res = await fetchWithAuth(`/warehouses/${editingId}`, {
      method: "PATCH",
      body: JSON.stringify(editForm)
    });
    if (!res.ok) {
      const error = await res.json();
      toast.error(error.detail || "Ошибка обновления");
      return;
    }
    cancelEdit();
    loadWarehouses();
  };

  return (
    <div className="container warehouses-page">
      <div className="page-header">
        <PageHeader icon="warehouse" title="Склады"/>
        <ActionButton type="excel" tip="Экспорт в Excel" onClick={handleExport}>
          <span className="material-symbols-outlined">table_view</span>
        </ActionButton>
      </div>

      <div className="search-section" style={{ marginBottom: '16px' }}>
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="search-clear">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          )}
        </div>
      </div>

      <table ref={tableRef} className="table">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>ID</th>
            <th>Название</th>
            <th>Адрес</th>
            {canEdit && <th style={{ width: '120px' }}>Действия</th>}
          </tr>
        </thead>
        <tbody>
          {filteredWarehouses.map(wh => (
            wh.id === editingId ? (
              <tr key={wh.id}>
                <td>{wh.id}</td>
                <td><input name="name" value={editForm.name} onChange={handleEditChange} placeholder="Название" /></td>
                <td><input name="address" value={editForm.address} onChange={handleEditChange} placeholder="Адрес" /></td>
                <td>
                  <div className="edit-actions">
                    <ActionButton type="apply" onClick={saveEdit} tip="Сохранить"><span className="material-symbols-outlined">check</span></ActionButton>
                    <ActionButton type="danger" onClick={cancelEdit} tip="Отменить"><span className="material-symbols-outlined">close</span></ActionButton>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={wh.id}>
                <td>{wh.id}</td>
                <td>{wh.name}</td>
                <td>{wh.address}</td>
                {canEdit && (
                  <td>
                    <div className="actions-container">
                      <ActionButton type="neutral" onClick={() => startEdit(wh)} tip="Редактировать"><span className="material-symbols-outlined">edit</span></ActionButton>
                      <ActionButton type="danger" onClick={() => deleteWarehouse(wh.id)} tip="Удалить"><span className="material-symbols-outlined">delete</span></ActionButton>
                    </div>
                  </td>
                )}
              </tr>
            )
          ))}
          {canEdit && (
            <tr>
              <td></td>
              <td><input placeholder="Название" value={newName} onChange={e => setNewName(e.target.value)} /></td>
              <td><input placeholder="Адрес" value={newAddress} onChange={e => setNewAddress(e.target.value)} /></td>
              <td>
                <button type="button" className="primary-btn" onClick={createWarehouse}>Добавить</button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default WarehousesPage;