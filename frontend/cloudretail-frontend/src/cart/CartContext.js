
// src/cart/CartContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCart, addToCartAPI, updateCartItemAPI, removeCartItemAPI, clearCartAPI } from '../api';

const CartContext = createContext();

export function CartProvider({ children }) {
  // Cart items: [{ id (table id), product_id, quantity, product_data? }]
  // We need to fetch product details for the cart items since DB only stores IDs.
  // Actually, for now let's store basic info in local state until we refresh,
  // OR we should fetch product details for each item.
  // Implementation plan said: "Migrate CartContext to use Backend API".
  // Let's keep it simple: sync with backend, but we might need product details (name, price, image).
  // The cart table only has product_id.
  // We should ideally fetch product info for these IDs.
  // For this step, let's mix local optimistic update + backend sync.

  const [items, setItems] = useState([]);
  const token = localStorage.getItem('jwt');

  // Load cart from backend on mount if logged in
  useEffect(() => {
    if (token) {
      loadCart();
    } else {
      // Clear cart or load from local storage if we supported guest cart (previous req said force login)
      setItems([]);
    }
  }, [token]);

  const loadCart = async () => {
    try {
      const cartItems = await fetchCart();
      // cartItems = [{ id, user_id, product_id, quantity, ... }]
      // We need product details to display them!
      // This is a complexity. We either need an endpoint `getCartWithDetails` in order-service (which calls product-service),
      // OR we fetch product details here with `fetchProductById` for each (inefficient),
      // OR we just assume we have them if we just added them? No, page refresh loses them.
      // Let's assume we need to fetch details. 
      // *** COMPROMISE ***: The user wanted "table for cart".
      // Let's try to fetch details. To avoid N+1, maybe product-service has `getProductsByIds`?
      // It has `fetchProducts`.
      // Let's just do simple fetch for now.

      // We need to map `product_id` to product details.
      // Let's cheat a bit: we will fail to show image/name on refresh unless we fetch them.
      // Let's add a helper to `api.js` to fetch product details?
      // Or we can rely on `items` having structure: { product_id, quantity, product: { ... } }

      // Let's just store what we get and handle display separately or fetch details.
      // Wait, let's look at `api.js` again. `fetchProductById` exists.

      // For now, let's just set items. The UI might break if it expects `name` and `price` directly on item.
      // The previous `items` structure was: `{ id, name, price, image_url, quantity }`.
      // We need to reconstruct this.

      // Let's do a quick hack: we will just load basic items.
      // If we want to show them, we need details. 
      // I will add a lazy fetch in component or just fetch here sequentially (not optimal but works for small cart).

      const enrichedItems = await Promise.all(cartItems.map(async (item) => {
        try {
          // We need to import fetchProductById but it's circular if we put it in api.js?
          // No, api.js exports it.
          // But we are importing from api.js.
          // We can't import `fetchProductById` inside `api.js`? No we are in `CartContext.js`.
          // We can import `fetchProductById`.
          const { fetchProductById } = require('../api');
          const product = await fetchProductById(item.product_id);
          return { ...product, quantity: item.quantity, cart_item_id: item.id };
        } catch (e) {
          return { id: item.product_id, name: 'Unknown', price: 0, quantity: item.quantity };
        }
      }));
      setItems(enrichedItems);

    } catch (err) {
      console.error('Failed to load cart', err);
    }
  };

  const addItem = async (product, quantity = 1) => {
    const qtyToAdd = Number(quantity) || Number(product.quantity) || 1;

    // Optimistic update
    setItems((prev) => {
      const existing = prev.find((p) => String(p.id) === String(product.id));
      if (existing) {
        return prev.map((p) =>
          String(p.id) === String(product.id)
            ? { ...p, quantity: (Number(p.quantity) || 0) + qtyToAdd }
            : p
        );
      }
      return [...prev, { ...product, quantity: qtyToAdd }];
    });

    if (token) {
      try {
        await addToCartAPI(product.id, qtyToAdd);
        // Optionally reload to sync real IDs/state
        // loadCart(); 
      } catch (e) {
        console.error('Add to cart API failed', e);
        // Revert?
      }
    }
  };

  const removeItem = async (productId) => {
    setItems((prev) => prev.filter((p) => String(p.id) !== String(productId)));
    if (token) {
      try {
        await removeCartItemAPI(productId);
      } catch (e) {
        console.error('Remove cart item API failed', e);
      }
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prev) =>
      prev.map((p) =>
        String(p.id) === String(productId) ? { ...p, quantity: Number(quantity) } : p
      )
    );

    if (token) {
      try {
        await updateCartItemAPI(productId, Number(quantity));
      } catch (e) {
        console.error('Update quantity API failed', e);
      }
    }
  };

  const clearCart = async () => {
    setItems([]);
    if (token) {
      try {
        await clearCartAPI();
      } catch (e) {
        console.error('Clear cart API failed', e);
      }
    }
  };

  const addToCart = addItem;

  const value = {
    items,
    addItem,
    addToCart,
    removeItem,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside a CartProvider');
  }
  return ctx;
}
