import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./Auth/AuthContext";
import Login from "./Auth/Login";
import ProfileLayout from "./Profile/ProfileLayout";
import "./App.css";

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
          <span className="material-symbols-outlined spinning">autorenew</span>
          Загрузка...
        </div>
    );
  }

  return (
    <Routes>
      {!isAuthenticated ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <Route path="/*" element={<ProfileLayout />} />
      )}
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '16px',
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-light)',
              fontSize: '14px'
            },
            success: { iconTheme: { primary: '#2e7d32', secondary: '#e8f5e9' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#fee2e2' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;