// src/components/AdminLayout.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiShoppingBag, FiLogOut, FiUser, FiLayers } from 'react-icons/fi';
import './AdminLayout.css';

function AdminLayout({ children, activeTab, onTabChange }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('admin_jwt');
        localStorage.removeItem('admin_userName');
        localStorage.removeItem('admin_userRole');
        localStorage.removeItem('admin_userEmail');
        navigate('/admin/login');
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <div className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <h2>CloudRetail</h2>
                    <p>Admin Dashboard</p>
                </div>

                <div className="admin-sidebar-user">
                    <FiUser size={24} />
                    <span>Admin</span>
                </div>

                <nav className="admin-nav">
                    <button
                        className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => onTabChange('products')}
                    >
                        <FiPackage size={20} />
                        <span>Manage Products</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => onTabChange('orders')}
                    >
                        <FiShoppingBag size={20} />
                        <span>View Orders</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'stock' ? 'active' : ''}`}
                        onClick={() => onTabChange('stock')}
                    >
                        <FiLayers size={20} />
                        <span>Manage Stock</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => onTabChange('users')}
                    >
                        <FiUser size={20} />
                        <span>Manage Users</span>
                    </button>
                </nav>

                <button className="admin-logout" onClick={handleLogout}>
                    <FiLogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="admin-main">
                <div className="admin-content">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default AdminLayout;
