import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import PageHeader from "../../components/PageHeader/PageHeader";
import { fetchWithAuth } from "../../utils/api";
import "./CatalogPage.css";
import { API_BASE_URL } from "../../config";

function CatalogPage() {
    const [items, setItems] = useState([]);
    const [adding, setAdding] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [cartItemsMap, setCartItemsMap] = useState({})

    const loadItems = async () => {
        setSearching(true);
        try {
            const res = await fetchWithAuth("/items");
            if (res.ok) {
                setItems(await res.json());
            } else {
                toast.error("Ошибка загрузки товаров");
            }
        } catch (error) {
            console.error("Ошибка загрузки:", error);
            toast.error("Ошибка загрузки товаров");
        } finally {
            setSearching(false);
        }
    };

    const loadCart = async () => {
        try {
            const res = await fetchWithAuth("/cart");
            if (res.ok) {
                const cartData = await res.json();
                const map = {};
                cartData.forEach(item => {
                    map[item.item_id] = { quantity: item.quantity };
                });
                setCartItemsMap(map);
            } else {
                console.error("Ошибка загрузки корзины");
            }
        } catch (error) {
            console.error("Ошибка загрузки корзины:", error);
        }
    };

    const searchItems = async () => {
        if (!searchQuery.trim()) {
            loadItems();
            return;
        }
        setSearching(true);
        try {
            const res = await fetchWithAuth(`/items/search/${encodeURIComponent(searchQuery)}`);
            if (!res.ok) {
                toast.error("Ошибка поиска");
                return;
            }
            const data = await res.json();
            setItems(data);
        } catch (error) {
            console.error("Ошибка поиска:", error);
            toast.error("Ошибка поиска");
        } finally {
            setSearching(false);
        }
    };

    const resetSearch = () => {
        setSearchQuery("");
        loadItems();
    };

    const addToCart = async (itemId) => {
        setAdding(prev => ({ ...prev, [itemId]: true }));
        try {
            const res = await fetchWithAuth("/cart/items", {
                method: "POST",
                body: JSON.stringify({ item_id: itemId, quantity: 1 })
            });
            if (res.ok) {
                await loadCart();
            } else {
                const error = await res.json();
                toast.error(error.detail || "Ошибка добавления в корзину");
            }
        } catch (error) {
            console.error("Ошибка добавления:", error);
            toast.error("Ошибка добавления в корзину");
        } finally {
            setAdding(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const updateQuantity = async (itemId, newQuantity) => {
        if (newQuantity < 1) {
            try {
                const res = await fetchWithAuth(`/cart/items/${itemId}`, { method: "DELETE" });
                if (res.ok) {
                    setCartItemsMap(prev => {
                        const newMap = { ...prev };
                        delete newMap[itemId];
                        return newMap;
                    });
                } else {
                    const error = await res.json();
                    toast.error(error.detail || "Ошибка удаления");
                }
            } catch (error) {
                console.error("Ошибка удаления:", error);
                toast.error("Ошибка удаления");
            }
            return;
        }

        try {
            const res = await fetchWithAuth(`/cart/items/${itemId}`, {
                method: "PATCH",
                body: JSON.stringify({ quantity: newQuantity })
            });
            if (res.ok) {
                setCartItemsMap(prev => ({
                    ...prev,
                    [itemId]: { quantity: newQuantity }
                }));
            } else if (res.status === 204) {
                setCartItemsMap(prev => {
                    const newMap = { ...prev };
                    delete newMap[itemId];
                    return newMap;
                });
            } else {
                const error = await res.json();
                toast.error(error.detail || "Ошибка обновления количества");
            }
        } catch (error) {
            console.error("Ошибка обновления:", error);
            toast.error("Ошибка обновления количества");
        }
    };

    useEffect(() => {
        loadItems();
        loadCart();
    }, []);

    return (
        <div className="catalog-container">
            <div className="catalog-header">
                <PageHeader icon="storefront" title="Каталог товаров" />
                <div className="search-section">
                    <div className="search-wrapper">
                        <input
                            type="text"
                            placeholder="Поиск"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchItems()}
                            className="catalog-search-input"
                        />
                        <button
                            onClick={resetSearch}
                            className="catalog-search-clear"
                            aria-label="Очистить поиск"
                        >✕</button>
                    </div>
                    <button className="catalog-search-btn" onClick={searchItems}>
                        Найти
                    </button>
                </div>
            </div>

            {searching ? (
                <div className="loading">Загрузка...</div>
            ) : (
                <div className="cards-grid">
                    {items.map(item => {
                        const cartItem = cartItemsMap[item.id];
                        const isInCart = !!cartItem;
                        const quantity = isInCart ? cartItem.quantity : 0;

                        return (
                            <div key={item.id} className="product-card">
                                <img src={`${API_BASE_URL}${item.image_url}`} alt={item.name} />
                                <h3>{item.name}</h3>
                                <p>Артикул: {item.article}</p>
                                <p className="price">{item.price} ₽</p>
                                <p>Категория: {item.category_name}</p>
                                {isInCart ? (
                                    <div className="cart-controls">
                                        <button 
                                            onClick={() => updateQuantity(item.id, quantity - 1)}
                                            disabled={adding[item.id]}
                                        >-</button>
                                        <span className="cart-quantity">{quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(item.id, quantity + 1)}
                                            disabled={adding[item.id]}
                                        >+</button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => addToCart(item.id)}
                                        disabled={adding[item.id]}
                                    >
                                        {adding[item.id] ? "Добавление..." : "В корзину"}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {items.length === 0 && <p className="no-results">Ничего не найдено</p>}
                </div>
            )}
        </div>
    );
}

export default CatalogPage;