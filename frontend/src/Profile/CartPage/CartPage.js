import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useCart } from "../../hooks/useCart";
import { fetchWithAuth } from "../../utils/api";
import "./CartPage.css";
import PageHeader from "../../components/PageHeader/PageHeader";
import ActionButton from "../../components/ActionButton/ActionButton";

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
    <div className="container">
      <div className="page-header">
        <PageHeader icon="shopping_cart" title="Корзина" />
      </div>
    
      {cart.length === 0 ? (
        <p>Корзина пуста</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
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
                      <div className="cart-qty-controls">
                        <button
                          className="cart-qty-btn"
                          onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                          disabled={updating[item.item_id]}
                        >
                          −
                        </button>

                        <span className="cart-qty-value">
                          {item.quantity}
                        </span>

                        <button
                          className="cart-qty-btn"
                          onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                          disabled={updating[item.item_id]}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>{item.total_price} ₽</td>
                    <td>
                      <ActionButton
                        type="danger"
                        onClick={() => removeItem(item.item_id)}
                        disabled={updating[item.item_id]}
                        tip="Удалить"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cart-total" style={{marginTop: '16px'}}>
            Итого: {total} ₽
          </div>
          <button onClick={checkout} className="checkout-btn primary-btn">
            Оформить заказ
          </button>
        </>
      )}
    </div>
  );
}

export default CartPage;