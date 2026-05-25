import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../Auth/AuthContext";
import { useTheme } from "../hooks/useTheme";

import "./Sidebar.css";
import "../styles/shared.css";

function Sidebar() {
  const navigate = useNavigate();

  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);

  const canViewInventory = user && !["customer"].includes(user.role);

  const canViewPurchase =
    canViewInventory && !["sales_manager"].includes(user.role);

  const isCustomer = user?.role === "customer";

  const canManageOrders =
    user && ["admin", "sales_manager"].includes(user.role);

  const canViewOrders =
    user && ["management", "accountant"].includes(user.role);

  const closeSidebar = () => setIsOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navClass = ({ isActive }) =>
    `profile-nav-item shared-sidebar-item ${isActive ? "active" : ""
    }`;

  return (
    <>
      <button
        className="burger-btn shared-sidebar-burger"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Открыть меню"
      >
        <span className="material-symbols-outlined">
          {isOpen ? "close" : "menu"}
        </span>
      </button>

      <div
        className={`sidebar-overlay shared-sidebar-overlay ${isOpen ? "active" : ""
          }`}
        onClick={closeSidebar}
      />

      <aside
        className={`profile-sidebar shared-sidebar ${isOpen ? "open" : ""
          }`}
      >
        <h2 className="shared-sidebar-title">Профиль</h2>

        <nav className="profile-nav shared-sidebar-nav">
          <NavLink
            to="/info"
            className={navClass}
            onClick={closeSidebar}
          >
            <span className="material-symbols-outlined">
              account_circle
            </span>
            Информация
          </NavLink>

          {isAdmin && (
            <>
              <NavLink
                to="/users"
                className={navClass}
                onClick={closeSidebar}
              >
                <span className="material-symbols-outlined">
                  group
                </span>
                Пользовател
              </NavLink>

              <NavLink
                to="/backup"
                className={navClass}
                onClick={closeSidebar}
              >
                <span className="material-symbols-outlined">
                  database
                </span>
                Бэкапы
              </NavLink>

              <NavLink
                to="/activity-log"
                className={navClass}
                onClick={closeSidebar}
              >
                <span className="material-symbols-outlined">
                  history
                </span>
                Журнал действий
              </NavLink>
            </>
          )}

          {isCustomer && (
            <>
              <NavLink
                to="/catalog"
                className={navClass}
                onClick={closeSidebar}
              >
                <span className="material-symbols-outlined">
                  storefront
                </span>
                Каталог
              </NavLink>

              <NavLink
                to="/cart"
                className={navClass}
                onClick={closeSidebar}
              >
                <span className="material-symbols-outlined">
                  shopping_cart
                </span>
                Корзина
              </NavLink>

              <NavLink
                to="/orders"
                className={navClass}
                onClick={closeSidebar}
              >
                <span className="material-symbols-outlined">
                  receipt_long
                </span>
                Мои заказы
              </NavLink>
            </>
          )}

          {canViewInventory && (
            <>
              <NavLink
                to="/items"
                className={navClass}
                onClick={closeSidebar}
              >
                <span className="material-symbols-outlined">
                  inventory_2
                </span>
                Товары
              </NavLink>

              <NavLink
                to="/warehouses"
                className={navClass}
                onClick={closeSidebar}
              >
                <span className="material-symbols-outlined">
                  warehouse
                </span>
                Склады
              </NavLink>

              <NavLink
                to="/categories"
                className={navClass}
                onClick={closeSidebar}
              >
                <span className="material-symbols-outlined">
                  category
                </span>
                Категории
              </NavLink>

              <NavLink
                to="/suppliers"
                className={navClass}
                onClick={closeSidebar}
              >
                <span className="material-symbols-outlined">
                  local_shipping
                </span>
                Поставщики
              </NavLink>

              <NavLink
                to="/clients"
                className={navClass}
                onClick={closeSidebar}
              >
                <span className="material-symbols-outlined">
                  people
                </span>
                Клиенты
              </NavLink>
            </>
          )}

          {canViewPurchase && (
            <NavLink
              to="/purchases"
              className={navClass}
              onClick={closeSidebar}
            >
              <span className="material-symbols-outlined">
                shopping_bag
              </span>
              Закупки
            </NavLink>
          )}

          {(canManageOrders || canViewOrders) && (
            <NavLink
              to="/admin/orders"
              className={navClass}
              onClick={closeSidebar}
            >
              <span className="material-symbols-outlined">
                assignment
              </span>
              Заказы
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer shared-sidebar-footer">
          <button
            className="theme-toggle-btn shared-sidebar-btn"
            onClick={toggleTheme}
          >
            <span className="material-symbols-outlined">
              {theme === "light"
                ? "light_mode"
                : "dark_mode"}
            </span>

            {theme === "light"
              ? "Светлая тема"
              : "Тёмная тема"}
          </button>

          <button
            onClick={handleLogout}
            className="logout-sidebar-btn shared-sidebar-btn danger"
          >
            <span className="material-symbols-outlined">
              logout
            </span>
            Выйти
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;