import { useState, useEffect } from 'react';
import { migrateLocalStorage } from '@/lib/localStorageMigration';

migrateLocalStorage();

const CART_KEY = 'basha_cart';
const FAV_KEY = 'basha_favorites';
const COMPARE_KEY = 'basha_compare';
const COUPON_KEY = 'basha_coupon';

function getStored(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function getStoredObj(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

export function useCart() {
  const [items, setItems] = useState(() => getStored(CART_KEY));
  const [appliedCoupon, setAppliedCoupon] = useState(() => getStoredObj(COUPON_KEY));

  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(items)); }, [items]);
  useEffect(() => {
    if (appliedCoupon) localStorage.setItem(COUPON_KEY, JSON.stringify(appliedCoupon));
    else localStorage.removeItem(COUPON_KEY);
  }, [appliedCoupon]);

  const addItem = (product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { product_id: product.id, title: product.title, price: product.price, image: product.image, quantity: qty }];
    });
  };

  const removeItem = (productId) => setItems(prev => prev.filter(i => i.product_id !== productId));
  const updateQty = (productId, qty) => {
    if (qty <= 0) return removeItem(productId);
    setItems(prev => prev.map(i => i.product_id === productId ? { ...i, quantity: qty } : i));
  };
  const clearCart = () => { setItems([]); setAppliedCoupon(null); };
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const discountAmount = appliedCoupon
    ? (appliedCoupon.discount_type === 'percentage'
        ? total * (appliedCoupon.discount_value || 0) / 100
        : Math.min(appliedCoupon.discount_value || 0, total))
    : 0;
  const discountedTotal = total - discountAmount;

  return { items, addItem, removeItem, updateQty, clearCart, total, count, appliedCoupon, setAppliedCoupon, discountAmount, discountedTotal };
}

export function useFavorites() {
  const [favs, setFavs] = useState(() => getStored(FAV_KEY));
  useEffect(() => { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); }, [favs]);

  const toggleFav = (productId) => {
    setFavs(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };
  const isFav = (productId) => favs.includes(productId);

  return { favs, toggleFav, isFav };
}

export function useCompare() {
  const [compareList, setCompareList] = useState(() => getStored(COMPARE_KEY));
  useEffect(() => { localStorage.setItem(COMPARE_KEY, JSON.stringify(compareList)); }, [compareList]);

  const toggleCompare = (productId) => {
    setCompareList(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : prev.length < 4 ? [...prev, productId] : prev);
  };
  const isComparing = (productId) => compareList.includes(productId);
  const clearCompare = () => setCompareList([]);

  return { compareList, toggleCompare, isComparing, clearCompare };
}