import { useState } from "react";
import "../UsersPage/ResetPasswordModal.css";
import toast from "react-hot-toast";

function ChangePasswordModal({ isOpen, onClose, onConfirm }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (newPassword.length < 8) {
      toast.error("Новый пароль должен быть не менее 8 символов");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }
    onConfirm(oldPassword, newPassword);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Смена пароля</h3>
        
        <input
          type="password"
          className="modal-input"
          placeholder="Старый пароль"
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value)}
        />
        
        <input
          type="password"
          className="modal-input"
          placeholder="Новый пароль (мин. 8 символов)"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />
        
        <input
          type="password"
          className="modal-input"
          placeholder="Подтвердите пароль"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />

        <div className="modal-actions">
          <button className="modal-btn secondary" onClick={onClose}>Отмена</button>
          <button className="modal-btn primary" onClick={handleSubmit}>Сменить пароль</button>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordModal;