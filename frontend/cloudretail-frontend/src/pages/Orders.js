// src/pages/Orders.js
import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { fetchOrderById } from '../api';

function Orders() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState('');

  useEffect(() => {
    if (order) return; // already have from navigate state

    const token = localStorage.getItem('jwt');
    if (!token) {
      setError('Please log in to view your order.');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const data = await fetchOrderById(id);
        setOrder(data);
      } catch (err) {
        console.error('fetchOrder error', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to load order'
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, order]);

  if (loading) {
    return (
      <div className="form-container">
        <p>Loading order...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-container">
        <h2>Order</h2>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="form-container">
        <h2>Order</h2>
        <p>Order not found.</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2>Thank you for your order!</h2>
      <p>
        Order <strong>#{order.id}</strong> has been placed with status{' '}
        <strong>{order.status}</strong>.
      </p>

      <h3 style={{ marginTop: 24 }}>Items</h3>
      {order.items && order.items.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {order.items.map((item) => (
            <li
              key={item.id || `${item.order_id}-${item.product_id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 6,
                    marginRight: 12,
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div>{item.name || `Product #${item.product_id}`}</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  Qty: {item.quantity} @ ${item.unit_price.toFixed(2)}
                </div>
              </div>
              <div style={{ fontWeight: 600 }}>
                ${(item.quantity * item.unit_price).toFixed(2)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No items found for this order.</p>
      )}

      <div
        style={{
          marginTop: 20,
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Total paid</span>
        <span>${(order.total_amount || 0).toFixed(2)}</span>
      </div>

      <div style={{ marginTop: 24 }}>
        <Link to="/">Back to shopping</Link>
      </div>
    </div>
  );
}

export default Orders;
