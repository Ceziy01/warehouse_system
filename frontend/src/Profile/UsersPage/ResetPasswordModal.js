import { useState } from "react";
import toast from "react-hot-toast";

import "./ResetPasswordModal.css";

function ResetPasswordModal({ isOpen, onClose, onConfirm, username }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (newPassword.length < 8) {
      toast.error("Пароль должен быть не менее 8 символов");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }
    onConfirm(newPassword);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Сброс пароля для {username}</h3>
        
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
          <button className="modal-btn secondary" onClick={onClose}>
            Отмена
          </button>
          <button className="modal-btn primary" onClick={handleSubmit}>
            Сбросить пароль
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordModal;