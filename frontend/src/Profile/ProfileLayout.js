import { Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "../Auth/AuthContext";
import ProfileInfo from "./InfoPage/ProfileInfo";
import UsersPage from "./UsersPage/UsersPage";
import ItemsManagePage from "./ItemsManagePage/ItemsManagePage";
import WarehousesPage from "./WarehousesPage/WarehousesPage";
import CategoriesPage from "./CategoriesPage/CategoriesPage";
import MyOrdersPage from "./MyOrdersPage/MyOrdersPage";
import OrdersManagePage from "./OrdersManagePage/OrdersManagePage";
import SuppliersPage from "./SuppliersPage/SuppliersPage";
import CartPage from "./CartPage/CartPage";
import CatalogPage from "./CatalogPage/CatalogPage";
import ClientsPage from "./ClientsPage/ClientsPage";
import PurchasesPage from "./PurchasesPage/PurchasesPage";
import BackupPage from "./BackupPage/BackupPage";
import Sidebar from "./Sidebar";
import ActivityLogPage from "./ActivityLogPage/ActivityLogPage";
import "./ProfileLayout.css";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/info" replace />;
  }

  return children;
}

function ProfileLayout() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="profile-layout">
      <Sidebar />

      <div className="profile-content">
        <Routes>
          <Route path="/" element={<Navigate to="/info" replace />} />
          <Route path="/info" element={<ProfileInfo />} />

          {isAdmin && <Route path="/users" element={<UsersPage />}/>}
          {isAdmin && <Route path="/activity-log" element={<ActivityLogPage/>}/>}
          {isAdmin && <Route path="/backup" element={<BackupPage />} />}
          

          <Route
            path="/items"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "warehouse_keeper",
                  "management",
                  "sales_manager",
                  "purchase_manager",
                  "accountant"
                ]}
              >
                <ItemsManagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouses"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "warehouse_keeper",
                  "management",
                  "sales_manager",
                  "purchase_manager",
                  "accountant"
                ]}
              >
                <WarehousesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "warehouse_keeper",
                  "management",
                  "sales_manager",
                  "purchase_manager",
                  "accountant"
                ]}
              >
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalog"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CatalogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "management", "accountant", "sales_manager"]}
              >
                <OrdersManagePage
                  readOnly={user?.role === "management" || user?.role === "accountant"}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "purchase_manager",
                  "management",
                  "sales_manager",
                  "accountant",
                  "warehouse_keeper"
                ]}
              >
                <SuppliersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "sales_manager",
                  "management",
                  "accountant",
                  "warehouse_keeper",
                  "purchase_manager"
                ]}
              >
                <ClientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "purchase_manager",
                  "warehouse_keeper",
                  "management",
                  "accountant"
                ]}
              >
                <PurchasesPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/info" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default ProfileLayout;