import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import { fetchWithAuth } from "../utils/api";

export function useCart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  const loadCart = async () => {
    setLoading(true);
    const res = await fetchWithAuth("/cart");
    if (res.ok) {
      const data = await res.json();
      setCart(data);
    } else {
      toast.error("Ошибка загрузки корзины");
    }
    setLoading(false);
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await removeItem(itemId);
      return;
    }
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    const res = await fetchWithAuth(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity: newQuantity })
    });
    setUpdating(prev => ({ ...prev, [itemId]: false }));
    if (res.ok || res.status === 204) {
      loadCart();
    } else {
      const error = await res.json();
      toast.error(error.detail || "Ошибка обновления");
    }
  };

  const removeItem = async (itemId) => {
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    const res = await fetchWithAuth(`/cart/items/${itemId}`, { method: "DELETE" });
    setUpdating(prev => ({ ...prev, [itemId]: false }));
    if (res.ok) {
      loadCart();
    } else {
      const error = await res.json();
      toast.error(error.detail || "Ошибка удаления");
    }
  };

  const addToCart = async (itemId, quantity = 1) => {
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    const res = await fetchWithAuth("/cart/items", {
      method: "POST",
      body: JSON.stringify({ item_id: itemId, quantity })
    });
    setUpdating(prev => ({ ...prev, [itemId]: false }));
    if (res.ok) {
      loadCart();
    } else {
      const error = await res.json();
      toast.error(error.detail || "Ошибка добавления в корзину");
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  return { cart, loading, updating, updateQuantity, removeItem, addToCart, loadCart };
}