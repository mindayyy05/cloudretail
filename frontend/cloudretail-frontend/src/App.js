// src/App.js
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';

import Header from './components/Header';

// use your existing page files
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminReset from './pages/AdminReset';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import WishlistPage from './pages/WishlistPage';


function App() {
  const location = useLocation();

  // Don't show Header on admin pages (except login/reset)
  const isAdminPage = location.pathname.startsWith('/admin') &&
    location.pathname !== '/admin/login' &&
    location.pathname !== '/admin/reset-password';

  // AUTO-LOGIN BYPASS: Force admin state for any /admin path
  React.useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      localStorage.setItem('admin_jwt', 'GOD_MODE_BYPASS');
      localStorage.setItem('admin_userRole', 'ADMIN');
      localStorage.setItem('admin_email', 'admin@cloudretail.com');
    }
  }, [location.pathname]);

  return (
    <div className="app">
      {/* Top navigation bar - only for customer pages */}
      {!isAdminPage && <Header />}

      {/* Main routed content */}
      <main className={isAdminPage ? '' : 'main-content'}>
        <Routes>
          {/* Customer pages */}
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin pages */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/reset-password" element={<AdminReset />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/order-success/:id" element={<OrderSuccessPage />} />


          {/* Fallback */}
          <Route
            path="*"
            element={
              <div style={{ padding: 24 }}>
                <h2>404 – Page not found</h2>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
