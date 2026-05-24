import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { fetchWithAuth } from "../../utils/api";
import "../../styles/shared.css";
import "./PaymentPage.css";

function PaymentPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState("form");

    const [card, setCard] = useState({
        number: "",
        name: "",
        expiry: "",
        cvv: "",
    });

    useEffect(() => {
        const loadOrder = async () => {
            const res = await fetchWithAuth("/orders/my");
            if (res.ok) {
                const orders = await res.json();
                const found = orders.find((o) => o.id === parseInt(orderId));
                if (!found || found.status !== "CONFIRMED") {
                    navigate("/orders");
                    return;
                }
                setOrder(found);
            } else {
                navigate("/orders");
            }
            setLoading(false);
        };
        loadOrder();
    }, [orderId, navigate]);

    const formatCardNumber = (val) => {
        const digits = val.replace(/\D/g, "").slice(0, 16);
        return digits.replace(/(.{4})/g, "$1 ").trim();
    };

    const formatExpiry = (val) => {
        const digits = val.replace(/\D/g, "").slice(0, 4);
        if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
        return digits;
    };

    const handleCardChange = (field, value) => {
        if (field === "number") value = formatCardNumber(value);
        if (field === "name") {
            value = value.replace(/[^A-Za-zА-Яа-яЁё\s]/g, "").toUpperCase();
        }

        if (field === "expiry") {
            value = formatExpiry(value);
            const digits = value.replace(/\D/g, "");
            if (digits.length >= 2) {
                const month = parseInt(digits.slice(0, 2));
                if (month < 1 || month > 12) return;
            }
        }

        if (field === "cvv") value = value.replace(/\D/g, "").slice(0, 3);

        setCard((prev) => ({ ...prev, [field]: value }));
    };

    const handlePay = async () => {
        const digits = card.number.replace(/\s/g, "");
        if (digits.length < 16) return alert("Введите корректный номер карты");
        if (!card.name.trim()) return alert("Введите имя держателя карты");
        if (card.expiry.length < 5) return alert("Введите срок действия карты");
        const [month, year] = card.expiry.split("/");
        const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        const now = new Date();
        if (expDate < new Date(now.getFullYear(), now.getMonth())) {
            toast.error("Срок действия карты истёк");
        }

        if (card.cvv.length < 3) return alert("Введите CVV");

        setStep("processing");

        await new Promise((r) => setTimeout(r, 2500));

        const res = await fetchWithAuth(`/orders/${orderId}/pay`, {
            method: "POST",
        });

        if (res.ok) {
            setStep("success");
        } else {
            setStep("form");
            alert("Ошибка при обновлении статуса. Попробуйте снова.");
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (!order) return null;

    return (
        <div className="payment-page">
            {step === "form" && (
                <div className="payment-wrapper">
                    <div className="payment-summary">
                        <div className="summary-header">
                            <span className="material-symbols-outlined summary-icon">receipt_long</span>
                            <h2>Заказ #{order.id}</h2>
                        </div>
                        <div className="summary-items">
                            {order.items.map((item) => (
                                <div key={item.id} className="summary-item">
                                    <span className="summary-item-name">{item.name}</span>
                                    <span className="summary-item-qty">× {item.quantity}</span>
                                    <span className="summary-item-price">
                                        {(item.price_at_time * item.quantity).toLocaleString("ru-RU")} ₽
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="summary-total">
                            <span>Итого</span>
                            <strong>{order.total_price.toLocaleString("ru-RU")} ₽</strong>
                        </div>
                    </div>

                    <div className="payment-form">
                        <h2 className="form-title">Данные карты</h2>

                        <div className="card-visual">
                            <div className="card-chip">
                                <span className="material-symbols-outlined">credit_card</span>
                            </div>
                            <div className="card-number-display">
                                {card.number || "•••• •••• •••• ••••"}
                            </div>
                            <div className="card-meta">
                                <div>
                                    <div className="card-label">Держатель</div>
                                    <div className="card-value">{card.name || "Ivan IVANOV"}</div>
                                </div>
                                <div>
                                    <div className="card-label">Срок</div>
                                    <div className="card-value">{card.expiry || "MM/YY"}</div>
                                </div>
                            </div>
                        </div>

                        <div className="form-fields">
                            <div className="field-group">
                                <label>Номер карты</label>
                                <input
                                    className="payment-input"
                                    type="text"
                                    placeholder="1234 5678 9012 3456"
                                    value={card.number}
                                    onChange={(e) => handleCardChange("number", e.target.value)}
                                />
                            </div>
                            <div className="field-group">
                                <label>Имя держателя</label>
                                <input
                                    className="payment-input"
                                    type="text"
                                    placeholder="IVAN IVANOV"
                                    value={card.name}
                                    onChange={(e) =>
                                        handleCardChange("name", e.target.value.toUpperCase())
                                    }
                                />
                            </div>
                            <div className="field-row">
                                <div className="field-group">
                                    <label>Срок действия</label>
                                    <input
                                        className="payment-input"
                                        type="text"
                                        placeholder="MM/YY"
                                        value={card.expiry}
                                        onChange={(e) => handleCardChange("expiry", e.target.value)}
                                    />
                                </div>
                                <div className="field-group">
                                    <label>CVV</label>
                                    <input
                                        className="payment-input"
                                        type="password"
                                        placeholder="•••"
                                        value={card.cvv}
                                        onChange={(e) => handleCardChange("cvv", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="payment-actions">
                            <button className="pay-btn" onClick={handlePay}>
                                <span className="material-symbols-outlined">lock</span>
                                Оплатить {order.total_price.toLocaleString("ru-RU")} ₽
                            </button>
                            <button className="cancel-pay-btn" onClick={() => navigate("/orders")}>
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === "processing" && (
                <div className="payment-processing">
                    <div className="processing-spinner" />
                    <h2>Обработка платежа...</h2>
                    <p>Пожалуйста, не закрывайте страницу</p>
                </div>
            )}

            {step === "success" && (
                <div className="payment-success">
                    <div className="success-icon-wrap">
                        <span className="material-symbols-outlined success-icon">check_circle</span>
                    </div>
                    <h2>Оплата прошла успешно!</h2>
                    <p>Заказ #{orderId} оплачен. Спасибо за покупку.</p>
                    <button className="primary-btn" onClick={() => navigate("/orders")}>
                        Вернуться к заказам
                    </button>
                </div>
            )}
        </div>
    );
}

export default PaymentPage;