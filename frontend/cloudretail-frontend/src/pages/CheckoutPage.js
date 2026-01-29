
// src/pages/CheckoutPage.js
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../cart/CartContext';
import { createOrder } from '../api';

function CheckoutPage() {
    const navigate = useNavigate();
    const { items = [], clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    React.useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (role === 'ADMIN') {
            setIsAdmin(true);
        }
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        shipping_name: '',
        shipping_address: '',
        shipping_city: '',
        shipping_zip: '',
        shipping_country: '',
        delivery_date: '',
        card_number: '',
        card_expiry: '',
        card_cvc: ''
    });

    // Calculate min delivery date (2 days from now)
    const minDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return d.toISOString().split('T')[0];
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const subtotal = useMemo(
        () => (items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
        [items]
    );
    const total = subtotal; // Free shipping

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!items.length) {
            alert("Cart is empty");
            return;
        }
        setLoading(true);

        try {
            const orderItems = items.map((item) => ({
                product_id: Number(item.productId || item.id), // Handle both ID types just in case
                quantity: Number(item.quantity || 1),
                price: Number(item.price || 0),
            }));

            // Prepare payload
            const payload = {
                shipping_name: formData.shipping_name,
                shipping_address: formData.shipping_address,
                shipping_city: formData.shipping_city,
                shipping_zip: formData.shipping_zip,
                shipping_country: formData.shipping_country,
                delivery_date: formData.delivery_date,
                payment_method: 'CREDIT_CARD', // hardcoded for now
                // Card details would strictly go to a payment gateway here.
                // We won't send them to backend plain text usually.
            };

            const order = await createOrder(orderItems, payload);

            // alert(`Order placed successfully! Order ID: ${order.id}`); // Remove alert
            clearCart();
            navigate(`/order-success/${order.id}`);
        } catch (err) {
            console.error("Checkout failed", err);
            alert("Failed to place order. " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="checkout-page" style={{ padding: '2rem' }}>
                <h2>Checkout</h2>
                <p>Your cart is empty.</p>
                <button onClick={() => navigate('/')}>Go Shopping</button>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <h1>Checkout</h1>

            <div className="checkout-grid">
                {/* LEFT COL: FORM */}
                <form onSubmit={handleSubmit} className="checkout-form">

                    <section className="checkout-section">
                        <h3>Delivery Information</h3>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input required name="shipping_name" value={formData.shipping_name} onChange={handleChange} className="form-control" />
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <input required name="shipping_address" value={formData.shipping_address} onChange={handleChange} className="form-control" />
                        </div>
                        <div className="form-row-2">
                            <div className="form-group">
                                <label>City</label>
                                <input required name="shipping_city" value={formData.shipping_city} onChange={handleChange} className="form-control" />
                            </div>
                            <div className="form-group">
                                <label>Zip Code <span style={{ fontWeight: 'normal', textTransform: 'none', color: '#777' }}>(Optional)</span></label>
                                <input name="shipping_zip" value={formData.shipping_zip} onChange={handleChange} className="form-control" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Country</label>
                            <input required name="shipping_country" value={formData.shipping_country} onChange={handleChange} className="form-control" />
                        </div>
                        <div className="form-group">
                            <label>Delivery Date</label>
                            <input required type="date" min={minDate} name="delivery_date" value={formData.delivery_date} onChange={handleChange} className="form-control" />
                            <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>Must be at least 2 days in the future</small>
                        </div>
                    </section>

                    <section className="checkout-section">
                        <h3>Payment Details</h3>
                        <div className="form-group">
                            <label>Card Number</label>
                            <input required name="card_number" value={formData.card_number} onChange={handleChange} placeholder="0000 0000 0000 0000" className="form-control" />
                        </div>
                        <div className="form-row-2">
                            <div className="form-group">
                                <label>Expiry</label>
                                <input required name="card_expiry" value={formData.card_expiry} onChange={handleChange} placeholder="MM/YY" className="form-control" />
                            </div>
                            <div className="form-group">
                                <label>CVC</label>
                                <input required name="card_cvc" value={formData.card_cvc} onChange={handleChange} placeholder="123" className="form-control" />
                            </div>
                        </div>
                    </section>

                    {isAdmin ? (
                        <div style={{ marginTop: '1.5rem', background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '4px', textAlign: 'center' }}>
                            <strong>Admin Restricted</strong>
                            <p style={{ margin: 0, fontSize: '0.9em' }}>Administrators cannot place orders.</p>
                        </div>
                    ) : (
                        <button type="submit" disabled={loading} className="btn-primary-lg" style={{ marginTop: '1.5rem', width: '100%' }}>
                            {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                        </button>
                    )}
                </form>

                {/* RIGHT COL: SUMMARY */}
                <div className="checkout-summary">
                    <h3>Order Summary</h3>
                    <div className="checkout-items">
                        {items.map(item => (
                            <div key={item.id || item.productId} className="checkout-item-row">
                                <span>{item.quantity} x {item.name}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <hr />
                    <div className="checkout-total">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;
