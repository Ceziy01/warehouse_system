import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useCart } from "../../hooks/useCart";
import { fetchWithAuth } from "../../utils/api";
import "./CartPage.css";
import PageHeader from "../../components/PageHeader/PageHeader";

function CartPage() {
  const { cart, loading, updating, updateQuantity, removeItem, loadCart } = useCart();
  const navigate = useNavigate();

  const checkout = async () => {
    if (!window.confirm("Оформить заказ? Корзина будет очищена.")) return;
    const res = await fetchWithAuth("/cart/checkout", { method: "POST" });
    if (res.ok) {
      toast.success("Заказ оформлен!");
      loadCart();
      navigate("/orders");
    } else {
      const error = await res.json();
      toast.error(error.detail || "Ошибка оформления");
    }
  };

  const total = cart.reduce((sum, item) => sum + item.total_price, 0);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="cart-container">
      <PageHeader icon="shopping_cart" title="Корзина" />
      {cart.length === 0 ? (
        <p>Корзина пуста</p>
      ) : (
        <>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Товар</th>
                <th>Цена</th>
                <th>Количество</th>
                <th>Сумма</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.item_id}>
                  <td>{item.name}</td>
                  <td>{item.price} ₽</td>
                  <td>
                    <button
                      onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                      disabled={updating[item.item_id]}
                    >-</button>
                    {item.quantity}
                    <button
                      onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                      disabled={updating[item.item_id]}
                    >+</button>
                  </td>
                  <td>{item.total_price} ₽</td>
                  <td>
                    <button
                      type="button"
                      className="action-btn delete-btn"
                      onClick={() => removeItem(item.item_id)}
                      disabled={updating[item.item_id]}
                      title="Удалить"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cart-total">
            Итого: {total} ₽
          </div>
          <button onClick={checkout} className="checkout-btn">
            Оформить заказ
          </button>
        </>
      )}
    </div>
  );
}

export default CartPage;