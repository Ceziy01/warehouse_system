import { useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useTheme } from "../hooks/useTheme";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Заполните все поля');
      return;
    }

    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      });

      if (!res.ok) {
        if (res.status === 429) {
          return toast.error('Слишком много запросов. Попробуйте позже.');
        }

        if (res.status === 401 || res.status === 400) {
          return toast.error('Неверный логин или пароль');
        }

        let errorMessage = `Ошибка входа. Код: ${res.status}`;
        try {
          const err = await res.json();
          if (err.detail) errorMessage = err.detail;
        } catch { }
        return toast.error(errorMessage);
      }

      const data = await res.json();
      const userRes = await fetch(`${API_BASE_URL}/auth/users/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        login(data.access_token, data.refresh_token, userData);
        navigate("/info");
      } else {
        toast.error('Не удалось загрузить профиль пользователя');
      }
    } catch (error) {
      toast.error('Не удалось подключиться к серверу. Проверьте соединение.');
    }
  };

  return (
    <div className="login-page">
      <button className="theme-toggle-btnn" onClick={toggleTheme}>
        <span className="material-symbols-outlined">
          {theme === "light" ? "light_mode" : "dark_mode"}
        </span>
      </button>
      <div className="login-card">
        <h2 className="title">Вход в систему</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-field">
            <label>Имя пользователя</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined">person</span>
              <input
                type="text"
                placeholder="логин"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="input-field">
            <label>Пароль</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined">lock</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="login-actions">
            <button type="submit" className="btn-primary">
              <span className="material-symbols-outlined">login</span>
              Войти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;