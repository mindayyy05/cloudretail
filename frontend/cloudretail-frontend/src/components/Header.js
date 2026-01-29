import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSuggestions } from '../api';
import {
  FiSearch,
  FiUser,
  FiHeart,
  FiShoppingCart,
  FiShield
} from 'react-icons/fi';

function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await fetchSuggestions(searchQuery);
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (err) {
        console.error('fetchSuggestions error', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const token = localStorage.getItem('jwt');
  let userName = 'Guest';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      userName = user.first_name || user.name || 'User';
    }
  } catch (e) {
    // ignore
  }

  const userRole = localStorage.getItem('userRole') || 'USER';
  const isAdmin = token && userRole === 'ADMIN';

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (productId) => {
    navigate(`/product/${productId}`);
    setShowSuggestions(false);
    setSearchQuery('');
  };

  const handleAdminClick = () => {
    if (isAdmin) {
      navigate('/admin/products');
    } else {
      navigate('/admin/login');
    }
  };

  return (
    <header className="cb-header">
      {/* Top white bar */}
      <div className="cb-header-main">
        <div className="cb-header-inner">
          {/* Logo */}
          <div className="cb-logo" onClick={() => navigate('/')}>
            CloudRetail
          </div>

          {/* Search */}
          <form className="cb-search" onSubmit={handleSearch} style={{ position: 'relative' }}>
            <FiSearch className="cb-search-icon" />
            <input
              type="text"
              placeholder="What can we help you find?"
              aria-label="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="cb-search-suggestions">
                {suggestions.map((p) => (
                  <div
                    key={p.id}
                    className="cb-suggestion-item"
                    onClick={() => handleSuggestionClick(p.id)}
                  >
                    {p.image_url && <img src={p.image_url} alt="" className="cb-suggestion-img" />}
                    <span className="cb-suggestion-name">{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </form>

          {/* Right actions */}
          <div className="cb-header-actions">
            {/* Orders / sign in */}
            <button
              type="button"
              className="cb-header-link-block"
              onClick={() => (token ? navigate('/orders') : navigate('/login'))}
            >
              <span className="cb-header-link-sub">Orders &</span>
              <span className="cb-header-link-main">
                {token ? 'Account' : 'Sign In'}
              </span>
            </button>

            {/* User icon + name */}
            <div className="cb-header-icon-block">
              <FiUser />
              <span>{token ? (isAdmin ? 'Admin' : userName) : 'Guest'}</span>
            </div>

            <button
              type="button"
              className="cb-header-icon-block"
              onClick={() => navigate('/wishlist')}
              title="Wishlist"
            >
              <FiHeart />
            </button>

            {/* Cart */}
            <button
              type="button"
              className="cb-header-icon-block"
              onClick={() => navigate('/cart')}
            >
              <FiShoppingCart />
            </button>

            {/* Admin */}
            <button
              type="button"
              className="cb-header-admin"
              onClick={handleAdminClick}
            >
              <FiShield />
              <span>{isAdmin ? 'Admin' : 'Admin Login'}</span>
            </button>

            {/* Logout when logged in */}
            {token && (
              <button
                type="button"
                className="cb-header-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Black category strip */}
      <div className="cb-header-nav">
        <div className="cb-header-inner cb-header-nav-inner">
          <button type="button" onClick={() => navigate('/?category=All')}>All Products</button>
          <button type="button" onClick={() => navigate('/?category=Electronics')}>Electronics</button>
          <button type="button" onClick={() => navigate('/?category=Wearables')}>Wearables</button>
          <button type="button" onClick={() => navigate('/?category=Fashion')}>Fashion</button>
          <button type="button" onClick={() => navigate('/?category=Home %26 Living')}>Home & Living</button>
          <button type="button" onClick={() => navigate('/?category=Beauty %26 Personal Care')}>Beauty</button>
          <button type="button" onClick={() => navigate('/?category=Sports %26 Outdoors')}>Sports</button>
          <button type="button" onClick={() => navigate('/?category=Toys %26 Games')}>Toys</button>
          <button type="button" onClick={() => navigate('/?category=Automotive')}>Automotive</button>
          <button type="button" onClick={() => navigate('/?category=Books %26 Stationery')}>Books</button>
          <button type="button" onClick={() => navigate('/?category=Pet Supplies')}>Pets</button>
          <button type="button" onClick={() => navigate('/?category=Groceries')}>Groceries</button>
        </div>
      </div>
    </header>
  );
}

export default Header;
