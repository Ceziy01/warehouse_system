import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

import PageHeader from "../../components/PageHeader/PageHeader";
import { fetchWithAuth } from "../../utils/api";
import { exportTableToExcel } from "../../utils/export";
import ActionButton from "../../components/ActionButton/ActionButton";
import "../../styles/shared.css";

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const tableRef = useRef(null);

  const loadClients = async () => {
    const res = await fetchWithAuth("/users/customers");
    if (res.ok) {
      const data = await res.json();
      setClients(data);
    } else {
      toast.error("Не удалось загрузить список клиентов");
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (client.username && client.username.toLowerCase().includes(query)) ||
      (client.first_name && client.first_name.toLowerCase().includes(query)) ||
      (client.last_name && client.last_name.toLowerCase().includes(query)) ||
      (client.email && client.email.toLowerCase().includes(query))
    );
  });

  const handleExport = () => {
    if (tableRef.current) {
      exportTableToExcel(tableRef.current, `клиенты_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}`);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <PageHeader icon="people" title="Клиенты"/>
        <ActionButton type="excel" tip="Экспорт в Excel" onClick={handleExport}>
          <span className="material-symbols-outlined">table_view</span>
        </ActionButton>
      </div>

      <div className="search-section" style={{ marginBottom: '16px' }}>
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="search-clear">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          )}
        </div>
      </div>

      <table ref={tableRef} className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Логин</th>
            <th>Имя</th>
            <th>Фамилия</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.map((client, index) => (
            <tr key={index}>
              <td>{client.id}</td>
              <td>{client.username}</td>
              <td>{client.first_name || "—"}</td>
              <td>{client.last_name || "—"}</td>
              <td>{client.email || "—"}</td>
            </tr>
          ))}
          {filteredClients.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "30px" }}>
                Ничего не найдено
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ClientsPage;