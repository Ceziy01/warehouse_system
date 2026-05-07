import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../Auth/AuthContext";
import { useTheme } from "../hooks/useTheme";
import "./Sidebar.css";
import { API_BASE_URL } from "../config";

function Sidebar() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const canViewInventory = user && !["customer"].includes(user.role);
  const canViewPurchase = canViewInventory && !["sales_manager"].includes(user.role);
  const isCustomer = user?.role === "customer";
  const canManageOrders = user && ["admin", "sales_manager"].includes(user.role);
  const canViewOrders = user && ["management", "accountant"].includes(user.role);

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/auth/admin/backup`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        let msg = "Ошибка создания бэкапа";
        try {
          const err = await res.json();
          if (err.detail) msg = err.detail;
        } catch { }
        toast.error(msg);
        return;
      }

      const data = await res.json();
      toast.success(data.message || "Бэкап успешно создан");
    } catch (error) {
      toast.error("Ошибка сети при создании бэкапа");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="profile-sidebar">
      <h2>Профиль</h2>

      <nav className="profile-nav">
        <NavLink
          to="/info"
          className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
        >
          <span className="material-symbols-outlined">account_circle</span>
          Информация
        </NavLink>

        {isAdmin && (
          <>
            <NavLink
              to="/users"
              className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="material-symbols-outlined">group</span>
              Пользователи
            </NavLink>

            <NavLink
              to="/activity-log"
              className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="material-symbols-outlined">history</span>
              Журнал действий
            </NavLink>

            <NavLink
              to="/backup"
              className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="material-symbols-outlined">database</span>
              Бэкап БД
            </NavLink>
          </>
        )}

        {isCustomer && (
          <>
            <NavLink
              to="/catalog"
              className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="material-symbols-outlined">storefront</span>
              Каталог
            </NavLink>
            <NavLink
              to="/cart"
              className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              Корзина
            </NavLink>
            <NavLink
              to="/orders"
              className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="material-symbols-outlined">receipt_long</span>
              Мои заказы
            </NavLink>
          </>
        )}

        {canViewInventory && (
          <>
            <NavLink
              to="/items"
              className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="material-symbols-outlined">inventory_2</span>
              Товары
            </NavLink>
            <NavLink
              to="/warehouses"
              className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="material-symbols-outlined">warehouse</span>
              Склады
            </NavLink>
            <NavLink
              to="/categories"
              className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="material-symbols-outlined">category</span>
              Категории
            </NavLink>
            <NavLink
              to="/suppliers"
              className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="material-symbols-outlined">local_shipping</span>
              Поставщики
            </NavLink>
            <NavLink
              to="/clients"
              className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="material-symbols-outlined">people</span>
              Клиенты
            </NavLink>
          </>
        )}

        {canViewPurchase && (
          <NavLink
            to="/purchases"
            className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
          >
            <span className="material-symbols-outlined">shopping_bag</span>
            Закупки
          </NavLink>
        )}

        {canManageOrders && (
          <NavLink
            to="/admin/orders"
            className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
          >
            <span className="material-symbols-outlined">assignment</span>
            Заказы
          </NavLink>
        )}

        {canViewOrders && (
          <NavLink
            to="/admin/orders"
            className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}
          >
            <span className="material-symbols-outlined">assignment</span>
            Заказы
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          <span className="material-symbols-outlined">
            {theme === "light" ? "light_mode" : "dark_mode"}
          </span>
          {theme === "light" ? "Светлая тема" : "Тёмная тема"}
        </button>
        <button onClick={handleLogout} className="logout-sidebar-btn">
          <span className="material-symbols-outlined">logout</span>
          Выйти
        </button>
      </div>
    </div>
  );
}

export default Sidebar;