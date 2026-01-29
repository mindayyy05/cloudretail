// src/pages/ProductDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProductById, fetchProducts, fetchReviews, submitReview, addToWishlist, removeFromWishlist } from '../api';
import { FiHeart } from 'react-icons/fi';
import { useCart } from '../cart/CartContext';
import AuthDialog from '../components/AuthDialog';

function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [error, setError] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(null);
  const [zoomStyle, setZoomStyle] = useState({ display: 'none' });
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadProductAndRecs() {
      try {
        setLoading(true);
        setError('');
        const [p, revs] = await Promise.all([
          fetchProductById(id),
          fetchReviews(id)
        ]);
        setProduct(p);
        setReviews(revs);
        if (p.images && p.images.length > 0) {
          setActiveImage(p.images[0].image_url);
        } else {
          setActiveImage(p.image_url);
        }
        setLoading(false);

        if (p?.category) {
          setLoadingRecs(true);
          const all = await fetchProducts({ category: p.category });
          const filtered = all
            .filter((item) => item.id !== p.id)
            .slice(0, 4);
          setRecommendations(filtered);
          setLoadingRecs(false);
        } else {
          setRecommendations([]);
        }
      } catch (err) {
        console.error('load product error', err);
        setError('Failed to load product.');
        setLoading(false);
      }
    }

    loadProductAndRecs();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const token = localStorage.getItem('jwt');
    if (!token) {
      setShowAuth(true);
      return;
    }
    addToCart(product, quantity);
    alert(`Added ${quantity} x "${product.name}" to cart.`);
  };

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`,
      backgroundImage: `url(${activeImage})`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('jwt');
    if (!token) {
      setShowAuth(true);
      return;
    }

    const userStr = localStorage.getItem('user');
    let userName = 'Anonymous';
    if (userStr) {
      const user = JSON.parse(userStr);
      userName = `${user.first_name} ${user.last_name}`;
    }

    try {
      setSubmittingReview(true);
      await submitReview(id, {
        rating: newRating,
        comment: newComment,
        user_name: userName
      });
      setNewComment('');
      setNewRating(5);
      // Refresh reviews
      const updatedRevs = await fetchReviews(id);
      setReviews(updatedRevs);
      alert('Review submitted successfully!');
    } catch (err) {
      console.error('submit review error', err);
      alert('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  const handleWishlistToggle = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      setShowAuth(true);
      return;
    }

    try {
      if (product.is_wishlisted) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
      // Refresh product to update heart state
      const updated = await fetchProductById(id);
      setProduct(updated);
    } catch (err) {
      console.error('wishlist toggle error', err);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-main skeleton">
          Loading product...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-main">
          <p>{error || 'Product not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      {/* Main product panel */}
      <div className="product-detail-main">
        <div className="product-detail-left">
          <div
            className="product-detail-image-wrapper"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={activeImage || 'https://via.placeholder.com/500'}
              alt={product.name}
              className="product-detail-image"
            />
            <div className="product-zoom-preview" style={zoomStyle}></div>
          </div>

          {/* Gallery Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="product-gallery">
              {product.images.map((img, idx) => (
                <div
                  key={idx}
                  className={`gallery-thumb ${activeImage === img.image_url ? 'active' : ''}`}
                  onClick={() => setActiveImage(img.image_url)}
                >
                  <img src={img.image_url} alt={`${product.name} view ${idx + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <div className="product-detail-breadcrumb">
            {product.category && (
              <span className="product-detail-category-pill">
                {product.category}
              </span>
            )}
          </div>

          <h1 className="product-detail-title">{product.name}</h1>

          {product.description && (
            <p className="product-detail-description">
              {product.description}
            </p>
          )}

          <div className="product-detail-price-row">
            {/* Stock Status */}
            {product.stock_status === 'out_of_stock' ? (
              <div className="stock-status out-of-stock" style={{ marginBottom: 12 }}>
                <strong>Out of Stock</strong>
              </div>
            ) : product.stock_status === 'low_stock' ? (
              <div className="stock-status low-stock" style={{ marginBottom: 12 }}>
                <strong>Only {product.quantity} left in stock!</strong> - Order soon
              </div>
            ) : (
              <div className="stock-status in-stock" style={{ marginBottom: 12 }}>
                <strong>In Stock</strong> - Ships within 2-3 business days
              </div>
            )}

            <div className="product-detail-price">
              ${Number(product.price).toFixed(2)}
            </div>
            <div className="product-detail-rating-summary">
              <span className="stars">{renderStars(product.avg_rating || 0)}</span>
              <span className="count">({product.review_count || 0} reviews)</span>
            </div>
            <div className="product-detail-meta">
              <span>Ships in 2–3 business days</span>
              <span>Free returns within 30 days</span>
            </div>
          </div>

          <div className="product-detail-actions">
            <div className="qty-selector" style={{ marginBottom: 0, marginRight: '1rem' }}>
              <button type="button" onClick={handleDecrement}>–</button>
              <span>{quantity}</span>
              <button type="button" onClick={handleIncrement}>+</button>
            </div>
            <button
              type="button"
              className="btn-primary-lg"
              onClick={handleAddToCart}
              disabled={product.stock_status === 'out_of_stock'}
              style={{
                opacity: product.stock_status === 'out_of_stock' ? 0.5 : 1,
                cursor: product.stock_status === 'out_of_stock' ? 'not-allowed' : 'pointer'
              }}
            >
              {product.stock_status === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              type="button"
              className="btn-secondary-lg"
              disabled={product.stock_status === 'out_of_stock'}
              style={{
                opacity: product.stock_status === 'out_of_stock' ? 0.5 : 1,
                cursor: product.stock_status === 'out_of_stock' ? 'not-allowed' : 'pointer'
              }}
            >
              Buy Now
            </button>
            <button
              type="button"
              className="wishlist-toggle-btn"
              onClick={handleWishlistToggle}
              title={product.is_wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: product.is_wishlisted ? '#ef4444' : '#64748b',
                transition: 'all 0.2s ease'
              }}
            >
              <FiHeart
                size={28}
                fill={product.is_wishlisted ? '#ef4444' : 'none'}
                strokeWidth={2}
              />
            </button>
          </div>

          <div className="product-detail-extra">
            <div className="product-detail-extra-row">
              <span className="label">Delivery</span>
              <span>Standard delivery to your address</span>
            </div>
            <div className="product-detail-extra-row">
              <span className="label">Returns</span>
              <span>30-day return policy. Conditions apply.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <div className="reviews-header">
          <h2>Customer Reviews</h2>
          <div className="avg-rating-block">
            <span className="big-rating">{Number(product.avg_rating || 0).toFixed(1)}</span>
            <div className="avg-stars">
              <div>{renderStars(product.avg_rating || 0)}</div>
              <p>Based on {product.review_count || 0} reviews</p>
            </div>
          </div>
        </div>

        <div className="reviews-content">
          {/* Review Form */}
          <div className="review-form-card">
            <h3>Share your thoughts</h3>
            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label>Rating</label>
                <div className="star-input">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={s <= newRating ? 'star active' : 'star'}
                      onClick={() => setNewRating(s)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Comment</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="What did you like or dislike?"
                  rows={4}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={submittingReview}
              >
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          </div>

          {/* Review List */}
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="review-item">
                  <div className="review-meta">
                    <span className="rev-user">{r.user_name}</span>
                    <span className="rev-date">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="rev-stars">{renderStars(r.rating)}</div>
                  <p className="rev-comment">{r.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>


      {/* Recommendations */}
      <div className="recommendation-section">
        <div className="recommendation-header">
          <h2>More items you may like</h2>
          {product.category && (
            <span className="recommendation-subtitle">
              More from <strong>{product.category}</strong>
            </span>
          )}
        </div>

        {loadingRecs && <p>Loading similar items…</p>}

        {!loadingRecs && recommendations.length === 0 && (
          <p className="recommendation-empty">
            No similar items found right now.
          </p>
        )}

        {!loadingRecs && recommendations.length > 0 && (
          <div className="recommendation-grid">
            {recommendations.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="recommendation-card"
              >
                <div className="recommendation-image-wrap">
                  <img
                    src={p.image_url || 'https://via.placeholder.com/300'}
                    alt={p.name}
                  />
                </div>
                <div className="recommendation-info">
                  <div className="name">{p.name}</div>
                  <div className="price">
                    ${Number(p.price).toFixed(2)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <AuthDialog
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          setShowAuth(false);
          // Optionally auto-add to cart after login?
          // For now user has to click again or we can do it here.
          // Let's just close dialog and let them click again or satisfy default req.
        }}
      />
    </div>
  );
}

export default ProductDetail;
