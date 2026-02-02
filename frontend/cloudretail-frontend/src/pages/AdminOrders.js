// src/pages/AdminOrders.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ORDER_BASE } from '../api';

function AdminOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        const token = localStorage.getItem('jwt');

        if (!token || role !== 'ADMIN') {
            alert('You must be an admin to access this page.');
            navigate('/admin/login');
            return;
        }

        // Fetch all orders
        fetchAllOrders(token);
    }, [navigate]);

    const fetchAllOrders = async (token) => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(`${ORDER_BASE}/api/v1/admin/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to load orders');
            }

            const data = await response.json();
            setOrders(data);
        } catch (err) {
            console.error('fetchAllOrders error', err);
            setError(err.message || 'Failed to load orders. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const formatPrice = (price) => {
        return `$${parseFloat(price).toFixed(2)}`;
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            1: 'Placed',
            2: 'Processing',
            3: 'Shipped',
            4: 'Delivered',
            5: 'Cancelled',
        };
        return statusMap[status] || 'Unknown';
    };

    if (loading) {
        return (
            <div className="form-container">
                <h2>Admin – All Orders</h2>
                <p>Loading orders...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="form-container">
                <h2>Admin – All Orders</h2>
                <p style={{ color: 'red' }}>{error}</p>
            </div>
        );
    }

    return (
        <div className="form-container" style={{ maxWidth: 1200 }}>
            <h2>Admin – All Orders</h2>

            {orders.length === 0 ? (
                <p>No orders found.</p>
            ) : (
                <div>
                    <p style={{ marginBottom: 20, color: '#666' }}>
                        Total Orders: {orders.length}
                    </p>

                    {orders.map((order) => (
                        <div
                            key={order.id}
                            style={{
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                padding: 20,
                                marginBottom: 20,
                                backgroundColor: '#f9f9f9',
                            }}
                        >
                            {/* Order Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, borderBottom: '2px solid #333', paddingBottom: 10 }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>Order #{order.id}</h3>
                                    <p style={{ margin: '5px 0 0 0', fontSize: 14, color: '#666' }}>
                                        Placed: {formatDate(order.created_at)}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        backgroundColor: order.status === 4 ? '#4caf50' : '#2196f3',
                                        color: 'white',
                                        borderRadius: 4,
                                        fontSize: 14,
                                        fontWeight: 'bold',
                                    }}>
                                        {getStatusLabel(order.status)}
                                    </div>
                                    <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#666' }}>
                                        Payment: {order.payment_status || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Customer & Shipping Info */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 15 }}>
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#333' }}>Customer Details</h4>
                                    <p style={{ margin: 0, fontSize: 13 }}>User ID: {order.user_id}</p>
                                    {order.shipping_name && (
                                        <p style={{ margin: '4px 0 0 0', fontSize: 13 }}>Name: {order.shipping_name}</p>
                                    )}
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#333' }}>Shipping Address</h4>
                                    {order.shipping_address ? (
                                        <>
                                            <p style={{ margin: 0, fontSize: 13 }}>{order.shipping_address}</p>
                                            <p style={{ margin: '4px 0 0 0', fontSize: 13 }}>
                                                {order.shipping_city}, {order.shipping_zip}
                                            </p>
                                            <p style={{ margin: '4px 0 0 0', fontSize: 13 }}>{order.shipping_country}</p>
                                        </>
                                    ) : (
                                        <p style={{ margin: 0, fontSize: 13, color: '#999' }}>Not provided</p>
                                    )}
                                </div>
                            </div>

                            {/* Delivery & Payment Info */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 15 }}>
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#333' }}>Delivery</h4>
                                    <p style={{ margin: 0, fontSize: 13 }}>
                                        Expected: {order.delivery_date ? formatDate(order.delivery_date) : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#333' }}>Payment</h4>
                                    <p style={{ margin: 0, fontSize: 13 }}>Method: {order.payment_method || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: 14, color: '#333' }}>Order Items</h4>
                                {order.items && order.items.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#eee' }}>
                                                <th style={{ padding: 8, textAlign: 'left', border: '1px solid #ddd' }}>Product</th>
                                                <th style={{ padding: 8, textAlign: 'center', border: '1px solid #ddd' }}>Quantity</th>
                                                <th style={{ padding: 8, textAlign: 'right', border: '1px solid #ddd' }}>Unit Price</th>
                                                <th style={{ padding: 8, textAlign: 'right', border: '1px solid #ddd' }}>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items.map((item, idx) => (
                                                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f5f5f5' }}>
                                                    <td style={{ padding: 8, border: '1px solid #ddd' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            {item.image_url && (
                                                                <img
                                                                    src={item.image_url}
                                                                    alt={item.product_name || 'Product'}
                                                                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                                                                />
                                                            )}
                                                            <div>
                                                                <div>{item.product_name || `Product #${item.product_id}`}</div>
                                                                <div style={{ fontSize: 11, color: '#666' }}>ID: {item.product_id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: 8, textAlign: 'center', border: '1px solid #ddd' }}>
                                                        {item.quantity}
                                                    </td>
                                                    <td style={{ padding: 8, textAlign: 'right', border: '1px solid #ddd' }}>
                                                        {formatPrice(item.unit_price)}
                                                    </td>
                                                    <td style={{ padding: 8, textAlign: 'right', border: '1px solid #ddd' }}>
                                                        {formatPrice(item.quantity * item.unit_price)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p style={{ margin: 0, fontSize: 13, color: '#999' }}>No items</p>
                                )}
                            </div>

                            {/* Total */}
                            <div style={{
                                marginTop: 15,
                                paddingTop: 15,
                                borderTop: '2px solid #333',
                                textAlign: 'right'
                            }}>
                                <h3 style={{ margin: 0, fontSize: 18 }}>
                                    Total: {formatPrice(order.total_amount)}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminOrders;
