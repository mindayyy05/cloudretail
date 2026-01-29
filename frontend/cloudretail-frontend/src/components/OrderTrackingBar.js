// src/components/OrderTrackingBar.js
import React from 'react';
import './OrderTrackingBar.css';

const OrderTrackingBar = ({ currentStatus }) => {
    // Status progression: placed -> preparing -> shipped -> delivered
    const steps = [
        { id: 'placed', label: 'Order Placed', icon: '📝' },
        { id: 'preparing', label: 'Preparing', icon: '📦' },
        { id: 'shipped', label: 'Shipped', icon: '🚚' },
        { id: 'delivered', label: 'Delivered', icon: '✓' }
    ];

    // Map tracking_status to step index
    const statusIndex = {
        'placed': 0,
        'preparing': 1,
        'shipped': 2,
        'delivered': 3,
        'cancelled': -1
    };

    const currentIndex = statusIndex[currentStatus] || 0;

    if (currentStatus === 'cancelled') {
        return (
            <div className="tracking-bar">
                <div className="tracking-cancelled">
                    <span className="cancel-icon">✕</span>
                    <span>Order Cancelled</span>
                </div>
            </div>
        );
    }

    return (
        <div className="tracking-bar">
            <div className="tracking-steps">
                {steps.map((step, index) => (
                    <div key={step.id} className="tracking-step-wrapper">
                        <div className={`tracking-step ${index <= currentIndex ? 'active' : ''} ${index === currentIndex ? 'current' : ''}`}>
                            <div className="step-circle">
                                <span className="step-icon">{step.icon}</span>
                            </div>
                            <div className="step-label">{step.label}</div>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`tracking-line ${index < currentIndex ? 'active' : ''}`}></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrderTrackingBar;
