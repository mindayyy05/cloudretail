// src/pages/Home.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, addToWishlist, removeFromWishlist } from '../api';
import { FiHeart } from 'react-icons/fi';

import { useSearchParams } from 'react-router-dom';





const renderStars = (rating) => {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
};

function Home() {
  const [products, setProducts] = useState([]);
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('search') || '';

  const [selectedBrand, setSelectedBrand] = useState('All');
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const params = { sort };
    if (categoryParam !== 'All') params.category = categoryParam;
    if (searchQuery) params.search = searchQuery;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;

    fetchProducts(params)
      .then(setProducts)
      .catch(err => console.error('fetchProducts error', err));
  }, [categoryParam, searchQuery, sort, minPrice, maxPrice]);

  const handleWishlistToggle = async (e, product) => {
    e.stopPropagation();
    const token = localStorage.getItem('jwt');
    if (!token) {
      alert('Please log in to use the wishlist.');
      return;
    }

    try {
      if (product.is_wishlisted) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
      // Refresh products to show updated heart state
      const params = { sort };
      if (categoryParam !== 'All') params.category = categoryParam;
      if (searchQuery) params.search = searchQuery;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      const updated = await fetchProducts(params);
      setProducts(updated);
    } catch (err) {
      console.error('wishlist toggle error', err);
    }
  };

  // Reset brand when category or search changes
  useEffect(() => {
    setSelectedBrand('All');
  }, [categoryParam, searchQuery]);

  // Extract Brands from current products
  const availableBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));
  // Add 'All' to start
  const brandList = ['All', ...availableBrands];

  // Final Filter by Brand
  const finalProducts = products.filter(p =>
    selectedBrand === 'All' ? true : p.brand === selectedBrand
  );

  return (
    <div className="cb-home">
      {/* Hero section */}
      <section className="cb-hero">
        <div className="cb-hero-content">
          <p className="cb-hero-eyebrow">Going, going, almost gone</p>
          <h1 className="cb-hero-title">Up to 60% off: Summer Tech Event</h1>
          <p className="cb-hero-subtitle">
            Save on earbuds, smart watches, home gadgets and more – limited-time online offers.
          </p>
          <button
            className="cb-hero-button"
            type="button"
            onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })}
          >
            Shop Deals
          </button>
        </div>
      </section>

      {/* Brand Ribbon (was Category pills) */}
      <div style={{ padding: '0 20px', marginTop: 20 }}>
        <h3>
          {searchQuery ? `Search results for "${searchQuery}"` : `Showing results for: ${categoryParam}`}
        </h3>
      </div>
      <nav className="cb-category-bar">
        {brandList.length > 1 ? brandList.map((brand) => (
          <button
            key={brand}
            type="button"
            className={
              selectedBrand === brand
                ? 'cb-category-pill cb-category-pill--active'
                : 'cb-category-pill'
            }
            onClick={() => setSelectedBrand(brand)}
          >
            {brand}
          </button>
        )) : <div style={{ padding: '10px 0', color: '#666' }}>No specific brands found.</div>}
      </nav>

      {/* Advanced Filters & Sorting */}
      <div className="cb-filters-bar">
        <div className="cb-price-filters">
          <span className="cb-filter-label">Price:</span>
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="cb-filter-input"
          />
          <span className="cb-filter-separator">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="cb-filter-input"
          />
        </div>

        <div className="cb-sorting">
          <span className="cb-filter-label">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="cb-filter-select"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Product grid */}
      <section className="cb-products">
        {/* <h2>Featured picks</h2> */}
        <div className="cb-product-grid">
          {finalProducts.map((p) => (
            <div
              key={p.id}
              className="cb-product-card"
              onClick={() => navigate(`/product/${p.id}`)}
            >
              <div className="cb-product-image-wrapper">
                <img
                  src={p.image_url || 'https://via.placeholder.com/400x400?text=Product'}
                  alt={p.name}
                />
                <button
                  className={`cb-wishlist-btn ${p.is_wishlisted ? 'active' : ''}`}
                  onClick={(e) => handleWishlistToggle(e, p)}
                  title={p.is_wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <FiHeart fill={p.is_wishlisted ? '#ff4d4f' : 'none'} stroke={p.is_wishlisted ? '#ff4d4f' : 'currentColor'} />
                </button>
              </div>
              <div className="cb-product-info">
                <div className="cb-product-name">{p.name}</div>
                <div className="cb-product-brand-row">
                  <span className="cb-product-brand">{p.brand}</span>
                  {p.avg_rating > 0 && (
                    <span className="cb-product-rating">{renderStars(p.avg_rating)}</span>
                  )}
                </div>

                {/* Stock Badge */}
                {p.stock_status === 'out_of_stock' ? (
                  <div className="stock-badge out-of-stock">Out of Stock</div>
                ) : p.stock_status === 'low_stock' ? (
                  <div className="stock-badge low-stock">Only {p.quantity} left</div>
                ) : (
                  <div className="stock-badge in-stock">In Stock ({p.quantity} available)</div>
                )}

                <div className="cb-product-price">${p.price}</div>
              </div>
            </div>
          ))}
          {finalProducts.length === 0 && (
            <div style={{ marginTop: 20 }}>No products found in this selection.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
