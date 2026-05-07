import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import PageHeader from "../../components/PageHeader/PageHeader";
import { fetchWithAuth } from "../../utils/api";
import { exportOrdersToExcel } from "../../utils/export";
import ActionButton from "../../components/ActionButton/ActionButton";
import "../../styles/shared.css";

const statusMap = {
  created: "Создан",
  confirmed: "Подтверждён",
  cancelled: "Отменён",
  on_the_way: "В пути",
  delivered: "Доставлен"
};

function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const res = await fetchWithAuth("/orders/my");
    if (res.ok) {
      const data = await res.json();
      setOrders(data);
    } else {
      toast.error("Ошибка загрузки заказов");
    }
    setLoading(false);
  };

  const handleExport = () => {
    if (orders.length === 0) {
      toast.error("Нет заказов для экспорта");
      return;
    }
    exportOrdersToExcel(orders, "мои_заказы");
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <PageHeader icon="receipt_long" title="Мои заказы"/>
        <ActionButton type="excel" tip="Экспорт в Excel" onClick={handleExport}>
          <span className="material-symbols-outlined">table_view</span>
        </ActionButton>
      </div>

      {orders.length === 0 ? (
        <p>У вас пока нет заказов</p>
      ) : (
        orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <strong>Заказ #{order.id}</strong>
              <span>Статус: {statusMap[order.status] || order.status}</span>
              <span>Дата: {new Date(order.created_at).toLocaleString()}</span>
              <strong>Сумма: {order.total_price} ₽</strong>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Кол-во</th>
                  <th>Цена</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.price_at_time} ₽</td>
                    <td>{item.price_at_time * item.quantity} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

export default MyOrdersPage;