
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchOrderById } from '../api';

function OrderSuccessPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        fetchOrderById(id)
            .then(data => setOrder(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="checkout-page" style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;

    if (!order) return <div className="checkout-page" style={{ textAlign: 'center', padding: '50px' }}>Order not found.</div>;

    return (
        <div className="checkout-page" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>

            <div className="success-animation">
                <div className="checkmark-circle">
                    <div className="checkmark draw"></div>
                </div>
            </div>

            <h1 style={{ marginTop: '20px', color: '#28a745' }}>Order Placed!</h1>
            <p style={{ fontSize: '18px', color: '#555' }}>Thank you for your purchase, {order.shipping_name}.</p>
            <p style={{ color: '#777' }}>Your order #<strong>{order.id}</strong> has been confirmed.</p>

            <div className="checkout-summary" style={{ textAlign: 'left', marginTop: '40px' }}>
                <h3>Order Summary</h3>
                <div className="checkout-items">
                    {order.items && order.items.map(item => (
                        <div key={item.id} className="checkout-item-row">
                            <span>{item.quantity} x {item.product_name || `Product #${item.product_id}`}</span>
                            <span>${Number(item.unit_price).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <hr />
                <div className="checkout-total">
                    <span>Total Paid</span>
                    <span>${Number(order.total_amount).toFixed(2)}</span>
                </div>
            </div>

            <button className="btn-primary-lg" style={{ marginTop: '30px', width: '100%' }} onClick={() => navigate('/')}>
                Continue Shopping
            </button>
        </div>
    );
}

export default OrderSuccessPage;
