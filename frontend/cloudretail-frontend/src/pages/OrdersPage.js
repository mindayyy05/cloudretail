import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, submitItemFeedback, exportUserData } from '../api';

function OrdersPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedbackStates, setFeedbackStates] = useState({}); // { orderItemId: { rating: 5, feedback: '', loading: false } }

    useEffect(() => { loadOrders(); }, []);

    const loadOrders = async () => {
        try {
            const data = await fetchOrders();
            setOrders(data);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 401) {
                setError('Session expired. Please logout and login again.');
            } else {
                setError('Failed to load orders: ' + (err.response?.data?.message || err.message));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFeedbackChange = (itemId, field, value) => {
        setFeedbackStates(prev => ({
            ...prev,
            [itemId]: {
                ...(prev[itemId] || { rating: 5, feedback: '' }),
                [field]: value
            }
        }));
    };

    const handleFeedbackSubmit = async (itemId) => {
        const state = feedbackStates[itemId] || { rating: 5, feedback: '' };
        try {
            setFeedbackStates(prev => ({ ...prev, [itemId]: { ...state, loading: true } }));
            await submitItemFeedback(itemId, state.rating, state.feedback);
            alert('Feedback saved! Thank you.');
            // Update local state to reflect it's saved
            setOrders(prevOrders => prevOrders.map(order => ({
                ...order,
                items: order.items.map(item => item.id === itemId ? { ...item, rating: state.rating, feedback: state.feedback } : item)
            })));
        } catch (err) {
            console.error(err);
            alert('Failed to save feedback.');
        } finally {
            setFeedbackStates(prev => ({ ...prev, [itemId]: { ...state, loading: false } }));
        }
    };

    const handleExportData = async () => {
        try {
            const blob = await exportUserData();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'my_cloudretail_data.json');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            alert('Failed to export data');
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading orders...</div>;
    if (error) return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>{error}</div>;


    if (orders.length === 0) {
        return (
            <div className="cart-page">
                <div className="cart-main" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <h2>No orders found</h2>
                    <p style={{ color: '#666', marginBottom: '20px' }}>Looks like you haven't placed any orders yet.</p>
                    <button className="btn-primary-lg" onClick={() => navigate('/')}>Start Shopping</button>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>My Orders</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-secondary" onClick={handleExportData} title="GDPR: Download your profile and order history">
                        📥 Download My Data (GDPR)
                    </button>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {orders.map(order => (
                    <div key={order.id} className="checkout-section" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ margin: 0, marginBottom: '4px' }}>Order #{order.id}</h3>
                                <div style={{ fontSize: '13px', color: '#666' }}>
                                    Placed on {new Date(order.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: '700', fontSize: '16px' }}>${Number(order.total_amount).toFixed(2)}</div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: (order.tracking_status || '').toLowerCase() === 'delivered' ? 'green' :
                                        (order.tracking_status || '').toLowerCase() === 'cancelled' ? 'red' :
                                            '#4a5568',
                                    textTransform: 'capitalize'
                                }}>
                                    {order.tracking_status || 'placed'}
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="checkout-items" style={{ marginTop: '12px' }}>
                            {order.items && order.items.map(item => (
                                <div key={item.id} style={{ marginBottom: '20px', borderBottom: '1px solid #f9f9f9', paddingBottom: '16px' }}>
                                    <div className="checkout-item-row" style={{ marginBottom: '8px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {item.image_url && <img src={item.image_url} alt={item.product_name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                                            <span>{item.quantity} x {item.product_name || `Product #${item.product_id}`}</span>
                                        </span>
                                        <span>${Number(item.unit_price).toFixed(2)}</span>
                                    </div>

                                    {/* Feedback Section for Delivered Orders */}
                                    {(order.tracking_status || '').toLowerCase() === 'delivered' && (
                                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginTop: '8px', fontSize: '14px' }}>
                                            {item.rating ? (
                                                <div>
                                                    <div style={{ color: '#fbbf24', marginBottom: '4px' }}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</div>
                                                    <div style={{ fontStyle: 'italic', color: '#475569' }}>"{item.feedback || 'No comments'}"</div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <strong>Rate this item:</strong>
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                        <select
                                                            value={feedbackStates[item.id]?.rating || 5}
                                                            onChange={(e) => handleFeedbackChange(item.id, 'rating', Number(e.target.value))}
                                                            style={{ padding: '4px', borderRadius: '4px' }}
                                                        >
                                                            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                                                        </select>
                                                        <input
                                                            type="text"
                                                            placeholder="Leave a comment..."
                                                            value={feedbackStates[item.id]?.feedback || ''}
                                                            onChange={(e) => handleFeedbackChange(item.id, 'feedback', e.target.value)}
                                                            style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                                        />
                                                        <button
                                                            className="btn-primary"
                                                            onClick={() => handleFeedbackSubmit(item.id)}
                                                            disabled={feedbackStates[item.id]?.loading}
                                                            style={{ padding: '4px 12px', fontSize: '13px' }}
                                                        >
                                                            {feedbackStates[item.id]?.loading ? 'Saving...' : 'Submit'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f9f9f9', fontSize: '13px', color: '#555' }}>
                            <strong>Shipping to:</strong> {order.shipping_name}, {order.shipping_address}, {order.shipping_city}, {order.shipping_zip}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default OrdersPage;
