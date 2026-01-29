// src/pages/Cart.js
import React, { useEffect, useState } from 'react';
import { createOrder } from '../api';
import { useNavigate } from 'react-router-dom';

function Cart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(stored);
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    try {
      const items = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      const order = await createOrder(items);
      alert(`Order created with ID ${order.orderId}`);
      localStorage.removeItem('cart');
      navigate(`/orders/${order.orderId}`);
    } catch (err) {
      console.error('checkout error', err);
      alert('Failed to create order (maybe you need to log in)');
    }
  };

  if (cart.length === 0) {
    return <div>Your cart is empty.</div>;
  }

  return (
    <div className="form-container">
      <h2>Your Cart</h2>
      {cart.map((item) => (
        <div key={item.productId} style={{ marginBottom: 8 }}>
          {item.name} x {item.quantity} (${item.price} each)
        </div>
      ))}
      <h3>Total: ${total.toFixed(2)}</h3>
      <button onClick={handleCheckout}>Proceed to Checkout</button>
    </div>
  );
}

export default Cart;
