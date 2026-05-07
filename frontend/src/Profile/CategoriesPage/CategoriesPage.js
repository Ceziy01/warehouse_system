import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

import PageHeader from "../../components/PageHeader/PageHeader";
import { useAuth } from "../../Auth/AuthContext";
import { fetchWithAuth } from "../../utils/api";
import ActionButton from "../../components/ActionButton/ActionButton";
import { exportTableToExcel } from "../../utils/export";
import "../../styles/shared.css"

function CategoriesPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "warehouse_keeper";

  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const tableRef = useRef(null);
  
  const handleExport = () => {
    if (tableRef.current) {
      exportTableToExcel(tableRef.current, `категории_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}`);
    }
  };

  const loadCategories = async () => {
    const res = await fetchWithAuth("/categories");
    if (!res.ok) return toast.error("Не удалось загрузить категории");
    setCategories(await res.json());
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = categories.filter(cat => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      cat.name.toLowerCase().includes(query) ||
      (cat.description && cat.description.toLowerCase().includes(query))
    );
  });

  const createCategory = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Название категории обязательно");
      return;
    }
    const res = await fetchWithAuth("/categories", {
      method: "POST",
      body: JSON.stringify({ name: newName, description: newDescription || null })
    });
    if (!res.ok) {
      const error = await res.json();
      toast.error(error.detail || "Ошибка создания");
      return;
    }
    setNewName("");
    setNewDescription("");
    loadCategories();
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Удалить категорию?")) return;
    const res = await fetchWithAuth(`/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json();
      toast.error(error.detail || "Ошибка удаления");
      return;
    }
    loadCategories();
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, description: cat.description || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error("Название обязательно");
      return;
    }
    const res = await fetchWithAuth(`/categories/${editingId}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: editForm.name,
        description: editForm.description || null
      })
    });
    if (!res.ok) {
      const error = await res.json();
      toast.error(error.detail || "Ошибка обновления");
      return;
    }
    cancelEdit();
    loadCategories();
  };

  return (
    <div className="container">
      <div className="page-header">
        <PageHeader icon="category" title="Категории" />
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
            <th>Описание</th>
            {canEdit && <th style={{ width: '120px' }}>Действия</th>}
          </tr>
        </thead>
        <tbody>
          {filteredCategories.map(cat => (
            cat.id === editingId ? (
              <tr key={cat.id}>
                <td>{cat.id}</td>
                <td><input name="name" value={editForm.name} onChange={handleEditChange} placeholder="Название" /></td>
                <td><input name="description" value={editForm.description} onChange={handleEditChange} placeholder="Описание" /></td>
                <td>
                  <div className="edit-actions">
                    <ActionButton type="apply" onClick={saveEdit} tip="Сохранить"><span className="material-symbols-outlined">check</span></ActionButton>
                    <ActionButton type="danger" onClick={cancelEdit} tip="Отменить"><span className="material-symbols-outlined">close</span></ActionButton>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={cat.id}>
                <td>{cat.id}</td>
                <td>{cat.name}</td>
                <td>{cat.description || "—"}</td>
                {canEdit && (
                  <td>
                    <div className="actions-container">
                      <ActionButton type="neutral" onClick={() => startEdit(cat)} tip="Редактировать"><span className="material-symbols-outlined">edit</span></ActionButton>
                      <ActionButton type="danger" onClick={() => deleteCategory(cat.id)} tip="Удалить"><span className="material-symbols-outlined">delete</span></ActionButton>
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
              <td><input placeholder="Описание" value={newDescription} onChange={e => setNewDescription(e.target.value)} /></td>
              <td>
                <button type="button" className="primary-btn" onClick={createCategory}>Добавить</button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CategoriesPage;