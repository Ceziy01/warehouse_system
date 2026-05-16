import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { fetchWithAuth } from "../../utils/api";
import ActionButton from "../../components/ActionButton/ActionButton";
import PageHeader from "../../components/PageHeader/PageHeader";

export default function BackupPage() {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState({});
    const fileInputRef = useRef(null);

    const loadBackups = async () => {
        setLoading(true);
        const res = await fetchWithAuth("/auth/admin/backup/list");
        if (res.ok) {
            const data = await res.json();
            setBackups(data);
        } else {
            toast.error("Не удалось загрузить список бэкапов");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadBackups();
    }, []);

    const handleCreateBackup = async () => {
        setCreating(true);
        const res = await fetchWithAuth("/auth/admin/backup", { method: "POST" });
        if (res.ok) {
            toast.success("Бэкап создан");
            loadBackups();
        } else {
            const err = await res.json();
            toast.error(err.detail || "Ошибка создания бэкапа");
        }
        setCreating(false);
    };

    const handleRestoreFromServer = async (filename) => {
        if (!window.confirm(`ВНИМАНИЕ! Восстановление базы данных из "${filename}" заменит все текущие данные. Продолжить?`)) {
            return;
        }
        
        setRestoring(prev => ({ ...prev, [filename]: true }));
        const res = await fetchWithAuth(`/auth/admin/backup/restore/${filename}`, { method: "POST" });
        
        if (res.ok) {
            toast.success("База данных успешно восстановлена");
            loadBackups();
        } else {
            const err = await res.json();
            toast.error(err.detail || "Ошибка восстановления базы данных");
        }
        setRestoring(prev => ({ ...prev, [filename]: false }));
    };

    const handleRestoreFromFile = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.sql')) {
            toast.error("Выберите файл с расширением .sql");
            return;
        }

        if (!window.confirm(`ВНИМАНИЕ! Восстановление базы данных из файла "${file.name}" заменит все текущие данные. Продолжить?`)) {
            event.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/admin/backup/restore/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                toast.success("База данных успешно восстановлена из файла");
                loadBackups();
            } else {
                const err = await res.json();
                toast.error(err.detail || "Ошибка восстановления базы данных");
            }
        } catch (error) {
            toast.error("Ошибка сети при восстановлении");
        }

        event.target.value = '';
    };

    const handleDelete = async (filename) => {
        if (!window.confirm(`Удалить ${filename}?`)) return;
        const res = await fetchWithAuth(`/auth/admin/backup/${filename}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Бэкап удалён");
            loadBackups();
        } else {
            toast.error("Ошибка удаления");
        }
    };

    const handleDownload = async (filename) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/admin/backup/download/${filename}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Ошибка скачивания');

            const blob = await res.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            toast.error("Не удалось скачать файл");
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="container">
            <div className="page-header">
                <PageHeader icon="database" title="Бэкапы базы данных" />
                <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                        className="primary-btn" 
                        onClick={handleCreateBackup} 
                        disabled={creating}
                    >
                        <span className="material-symbols-outlined" style={{ marginRight: '8px', fontSize: '18px', verticalAlign: 'middle' }}>
                            add
                        </span>
                        {creating ? "Создание..." : "Создать бэкап"}
                    </button>
                    <button 
                        className="primary-btn" 
                        onClick={() => fileInputRef.current.click()}
                        title="Восстановить из файла"
                    >
                        <span className="material-symbols-outlined" style={{ marginRight: '8px', fontSize: '18px', verticalAlign: 'middle' }}>
                            upload_file
                        </span>
                        Восстановить из файла
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".sql"
                        style={{ display: 'none' }}
                        onChange={handleRestoreFromFile}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading">Загрузка...</div>
            ) : backups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <p>Нет бэкапов</p>
                    <p style={{ marginTop: '10px', fontSize: '14px' }}>
                        Вы можете создать бэкап или восстановить базу данных из файла .sql
                    </p>
                </div>
            ) : (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Файл</th>
                            <th>Размер</th>
                            <th>Дата создания</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {backups.map((b) => (
                            <tr key={b.filename}>
                                <td>{b.filename}</td>
                                <td>{formatSize(b.size)}</td>
                                <td>{new Date(b.created_at).toLocaleString()}</td>
                                <td>
                                    <div className="actions-container">
                                        <ActionButton 
                                            type="extra" 
                                            onClick={() => handleDownload(b.filename)} 
                                            tip="Скачать"
                                        >
                                            <span className="material-symbols-outlined">download</span>
                                        </ActionButton>
                                        <ActionButton 
                                            type="neutral" 
                                            onClick={() => handleRestoreFromServer(b.filename)} 
                                            tip="Восстановить из бэкапа"
                                            disabled={restoring[b.filename]}
                                        >
                                            <span className="material-symbols-outlined">
                                                {restoring[b.filename] ? "hourglass_top" : "restore_page"}
                                            </span>
                                        </ActionButton>
                                        <ActionButton 
                                            type="danger" 
                                            onClick={() => handleDelete(b.filename)} 
                                            tip="Удалить бэкап"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </ActionButton>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}