import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import PageHeader from "../../components/PageHeader/PageHeader";
import { useAuth } from "../../Auth/AuthContext";
import { fetchWithAuth } from "../../utils/api";
import { getRoleLabel } from "../../utils/utils";
import ChangePasswordModal from "./ChangePasswordModal";
import "./ProfileInfo.css";

function ProfileInfo() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(authUser);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      fetchWithAuth("/auth/users/me")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load profile");
          return res.json();
        })
        .then(setUser)
        .catch(() => toast.error("Не удалось загрузить профиль"));
    }
  }, [user]);

  const handleChangePassword = async (oldPassword, newPassword) => {
    const res = await fetchWithAuth("/auth/users/me/change-password", {
      method: "PATCH",
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });

    if (!res.ok) {
      const error = await res.json();
      toast.error("Ошибка смены пароля");
      return;
    }

    toast.success("Пароль успешно изменён");
    setModalOpen(false);
  };

  return (
    <div>
      <div className="page-header">
        <PageHeader icon="account_circle" title="Информация об аккаунте"/>
        <button className="primary-btn" onClick={() => setModalOpen(true)}>Сменить пароль</button>
      </div>

      <div className="profile-info-container">
        <div className="profile-info-card">
          <div className="profile-info-row">
            <span className="profile-info-label">Логин</span>
            <span className="profile-info-value">{user.username}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Имя</span>
            <span className="profile-info-value">{user.first_name || "—"}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Фамилия</span>
            <span className="profile-info-value">{user.last_name || "—"}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Email</span>
            <span className="profile-info-value">{user.email || "—"}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Тип аккаунта</span>
            <span className="profile-info-value role-badge">{getRoleLabel(user.role)}</span>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleChangePassword}
      />
    </div>
  );
}

export default ProfileInfo;