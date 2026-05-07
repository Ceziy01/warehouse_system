import { useState, useEffect, useCallback, useRef } from "react";
import { fetchWithAuth } from "../../utils/api";
import { exportTableToExcel } from "../../utils/export";
import ActionButton from "../../components/ActionButton/ActionButton";
import PageHeader from "../../components/PageHeader/PageHeader";
import "./ActivityLogPage.css";

const ACTION_LABELS = {
  user_created: "Создание пользователя",
  user_updated: "Редактирование пользователя",
  user_deleted: "Удаление пользователя",
  user_password_reset: "Сброс пароля",
  user_impersonated: "Вход от имени пользователя",
  user_login: "Вход в систему",
  user_logout: "Выход из системы",
  user_password_changed: "Смена пароля",
  item_created: "Создание товара",
  item_updated: "Редактирование товара",
  item_deleted: "Удаление товара",
  warehouse_created: "Создание склада",
  warehouse_updated: "Редактирование склада",
  warehouse_deleted: "Удаление склада",
  category_created: "Создание категории",
  category_updated: "Редактирование категории",
  category_deleted: "Удаление категории",
  order_created: "Создание заказа",
  order_status_changed: "Изменение статуса заказа",
  order_deleted: "Удаление заказа",
  purchase_created: "Создание закупки",
  purchase_status_changed: "Изменение статуса закупки",
  purchase_completed: "Завершение закупки",
  purchase_deleted: "Удаление закупки",
  supplier_created: "Создание поставщика",
  supplier_updated: "Редактирование поставщика",
  supplier_deleted: "Удаление поставщика",
};

const ENTITY_LABELS = {
  user: "Пользователь",
  item: "Товар",
  warehouse: "Склад",
  category: "Категория",
  order: "Заказ",
  purchase: "Закупка",
  supplier: "Поставщик",
};

const ROLE_LABELS = {
  admin: "Администратор",
  warehouse_keeper: "Кладовщик",
  customer: "Покупатель",
  management: "Руководство",
  purchase_manager: "Менеджер по закупкам",
  sales_manager: "Менеджер по продажам",
  accountant: "Бухгалтер",
};

const ACTION_COLORS = {
  user_created: "green",
  item_created: "green",
  warehouse_created: "green",
  category_created: "green",
  order_created: "green",
  purchase_created: "green",
  supplier_created: "green",
  purchase_completed: "green",
  user_updated: "blue",
  item_updated: "blue",
  warehouse_updated: "blue",
  category_updated: "blue",
  order_status_changed: "blue",
  purchase_status_changed: "blue",
  supplier_updated: "blue",
  user_password_reset: "orange",
  user_impersonated: "orange",
  user_password_changed: "orange",
  user_login: "gray",
  user_logout: "gray",
  user_deleted: "red",
  item_deleted: "red",
  warehouse_deleted: "red",
  category_deleted: "red",
  order_deleted: "red",
  purchase_deleted: "red",
  supplier_deleted: "red",
};

function ActionBadge({ action }) {
  const color = ACTION_COLORS[action] || "gray";
  return (
    <span className={`action-badge action-badge--${color}`}>
      {ACTION_LABELS[action] || action}
    </span>
  );
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_id: "",
    user_role: "",
    action: "",
    entity_type: "",
    date_from: "",
    date_to: "",
  });

  const tableRef = useRef(null);

  const loadUsers = useCallback(async () => {
    const res = await fetchWithAuth("/auth/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });
    params.append("limit", "200");
    const res = await fetchWithAuth(`/auth/admin/activity-logs/?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ user_id: "", user_role: "", action: "", entity_type: "", date_from: "", date_to: "" });
  };

  const hasFilters = Object.values(filters).some((v) => v !== "");

  const handleExport = () => {
    if (tableRef.current) {
      exportTableToExcel(
        tableRef.current,
        `журнал_действий_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`,
        false
      );
    }
  };

  return (
    <div className="activity-log-page">
      <div className="page-header">
        <PageHeader icon="history" title="Журнал действий" />
        <div className="header-actions">
          <ActionButton type="excel" tip="Экспорт в Excel" onClick={handleExport}>
            <span className="material-symbols-outlined">table_view</span>
          </ActionButton>
          <div className="log-count-badge">{logs.length} записей</div>
        </div>
      </div>

      <div className="filters-panel">
        <div className="filters-row">
          <div className="filter-group">
            <label>Пользователь</label>
            <select
              value={filters.user_id}
              onChange={(e) => handleFilterChange("user_id", e.target.value)}
            >
              <option value="">Все</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.username})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Роль</label>
            <select
              value={filters.user_role}
              onChange={(e) => handleFilterChange("user_role", e.target.value)}
            >
              <option value="">Все роли</option>
              {Object.entries(ROLE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Тип действия</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
            >
              <option value="">Все действия</option>
              {Object.entries(ACTION_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Объект</label>
            <select
              value={filters.entity_type}
              onChange={(e) => handleFilterChange("entity_type", e.target.value)}
            >
              <option value="">Все объекты</option>
              {Object.entries(ENTITY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
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

      {loading ? (
        <></>
      ) : logs.length === 0 ? (
        <div className="log-empty">
          <span className="material-symbols-outlined">inbox</span>
          <p>Записей не найдено</p>
        </div>
      ) : (
        <div className="log-table-wrap">
          <table className="log-table" ref={tableRef}>
            <thead>
              <tr>
                <th>Дата и время</th>
                <th>Пользователь</th>
                <th>Роль</th>
                <th>Действие</th>
                <th>Объект</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="log-date">
                    {new Date(log.created_at).toLocaleString("ru-RU", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit", second: "2-digit"
                    })}
                  </td>
                  <td>
                    <div className="log-user">
                      <span className="material-symbols-outlined user-icon">account_circle</span>
                      <span>{log.user_username || <em className="deleted-user">удалён</em>}</span>
                    </div>
                  </td>
                  <td>
                    {log.user_role ? (
                      <span className="role-tag">{ROLE_LABELS[log.user_role] || log.user_role}</span>
                    ) : "—"}
                  </td>
                  <td>
                    <ActionBadge action={log.action} />
                  </td>
                  <td>
                    <div className="log-entity">
                      {log.entity_type && (
                        <span className="entity-type">{ENTITY_LABELS[log.entity_type] || log.entity_type}</span>
                      )}
                      {log.entity_name && (
                        <span className="entity-name">{log.entity_name}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}