// src/pages/CartPage.js
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2 } from 'react-icons/fi';
import { useCart } from '../cart/CartContext';

function CartPage() {
  const navigate = useNavigate();
  const { items = [], updateQuantity, removeItem, clearCart } = useCart();

  const increment = (id, currentQty) => {
    console.log('Incrementing', id, currentQty);
    updateQuantity(id, Number(currentQty) + 1);
  };

  const decrement = (id, currentQty) => {
    console.log('Decrementing', id, currentQty);
    updateQuantity(id, Number(currentQty) - 1);
  };

  // Calculate subtotal from cart items
  const subtotal = useMemo(
    () =>
      (items || []).reduce(
        (sum, item) =>
          sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
      ),
    [items]
  );

  const delivery = 0;
  const total = subtotal + delivery;

  // ----- Checkout -----
  const handleCheckout = () => {
    if (!items || items.length === 0) {
      alert('Your cart is empty.');
      return;
    }
    navigate('/checkout');
  };

  // ----- Empty cart state -----
  if (!items || items.length === 0) {
    return (
      <div className="cart-page">
        <section className="cart-main">
          <h2>Your cart</h2>
          <p>Your cart is empty.</p>
        </section>

        <aside className="cart-summary">
          <h3>Order summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Estimated delivery</span>
            <span>Free</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button className="summary-checkout-btn" disabled>
            Checkout
          </button>
        </aside>
      </div>
    );
  }

  // ----- Cart with items -----
  return (
    <div className="cart-page">
      <section className="cart-main">
        <h2>Your cart</h2>

        {items.map((item) => {
          const unitPrice = Number(item.price || 0);
          const lineTotal = unitPrice * Number(item.quantity || 0);

          return (
            <div key={item.id} className="cart-line">
              <div className="cart-line-left">
                <img
                  src={
                    item.image_url ||
                    'https://via.placeholder.com/120x120?text=Product'
                  }
                  alt={item.name}
                  className="cart-line-img"
                />
                <div>
                  <div className="cart-line-name">{item.name}</div>
                  <div className="cart-line-price">
                    ${unitPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="cart-line-right">
                <div className="qty-selector">
                  <button
                    type="button"
                    onClick={() => decrement(item.id, item.quantity)}
                  >
                    –
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => increment(item.id, item.quantity)}
                  >
                    +
                  </button>
                </div>
                <div className="cart-line-total">
                  ${lineTotal.toFixed(2)}
                </div>
                <button
                  type="button"
                  className="cart-remove-btn"
                  onClick={() => removeItem(item.id)}
                  title="Remove Item"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <aside className="cart-summary">
        <h3>Order summary</h3>
        <div className="summary-row">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Estimated delivery</span>
          <span>Free</span>
        </div>
        <div className="summary-total">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <button
          type="button"
          className="summary-checkout-btn"
          disabled={!items.length}
          onClick={handleCheckout}
        >
          Checkout
        </button>

        <button
          type="button"
          className="summary-secondary-btn"
          onClick={clearCart}
        >
          Clear cart
        </button>
      </aside>
    </div>
  );
}

export default CartPage;
