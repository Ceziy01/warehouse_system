import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

import PageHeader from "../../components/PageHeader/PageHeader";
import { useAuth } from "../../Auth/AuthContext";
import { fetchWithAuth } from "../../utils/api";
import ActionButton from "../../components/ActionButton/ActionButton";
import { exportTableToExcel } from "../../utils/export";
import "../../styles/shared.css";

function SuppliersPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "purchase_manager";

  const [suppliers, setSuppliers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", address: "" });

  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const tableRef = useRef(null);

  const handleExport = () => {
    if (tableRef.current) {
      exportTableToExcel(tableRef.current, `поставщики_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}`);
    }
  };

  const loadSuppliers = async () => {
    const res = await fetchWithAuth("/suppliers");
    if (!res.ok) return toast.error("Не удалось загрузить поставщиков");
    setSuppliers(await res.json());
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter(sup => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      sup.name.toLowerCase().includes(query) ||
      sup.address.toLowerCase().includes(query)
    );
  });

  const createSupplier = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newAddress.trim()) {
      toast.error("Заполните все поля");
      return;
    }
    const res = await fetchWithAuth("/suppliers", {
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
    loadSuppliers();
  };

  const deleteSupplier = async (id) => {
    if (!window.confirm("Удалить поставщика?")) return;
    const res = await fetchWithAuth(`/suppliers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json();
      toast.error(error.detail || "Ошибка удаления");
      return;
    }
    loadSuppliers();
  };

  const startEdit = (sup) => {
    setEditingId(sup.id);
    setEditForm({ name: sup.name, address: sup.address });
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
    const res = await fetchWithAuth(`/suppliers/${editingId}`, {
      method: "PATCH",
      body: JSON.stringify(editForm)
    });
    if (!res.ok) {
      const error = await res.json();
      toast.error(error.detail || "Ошибка обновления");
      return;
    }
    cancelEdit();
    loadSuppliers();
  };

  return (
    <div className="container">
      <div className="page-header">
        <PageHeader icon="local_shipping" title="Поставщики"/>
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
          {filteredSuppliers.map(sup => (
            sup.id === editingId ? (
              <tr key={sup.id}>
                <td>{sup.id}</td>
                <td><input name="name" value={editForm.name} onChange={handleEditChange} placeholder="Название" /></td>
                <td><input name="address" value={editForm.address} onChange={handleEditChange} placeholder="Адрес" /></td>
                {canEdit && (
                  <td>
                    <div className="edit-actions">
                      <ActionButton type="apply" onClick={saveEdit} tip="Сохранить"><span className="material-symbols-outlined">check</span></ActionButton>
                      <ActionButton type="danger" onClick={cancelEdit} tip="Отменить"><span className="material-symbols-outlined">close</span></ActionButton>
                    </div>
                  </td>
                )}
              </tr>
            ) : (
              <tr key={sup.id}>
                <td>{sup.id}</td>
                <td>{sup.name}</td>
                <td>{sup.address}</td>
                {canEdit && (
                  <td>
                    <div className="actions-container">
                      <ActionButton type="neutral" onClick={() => startEdit(sup)} tip="Редактировать"><span className="material-symbols-outlined">edit</span></ActionButton>
                      <ActionButton type="danger" onClick={() => deleteSupplier(sup.id)} tip="Удалить"><span className="material-symbols-outlined">delete</span></ActionButton>
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
                <button type="button" className="primary-btn" onClick={createSupplier}>Добавить</button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SuppliersPage;