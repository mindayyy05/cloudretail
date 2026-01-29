
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchWishlist, removeFromWishlist } from '../api';
import { useCart } from '../cart/CartContext';
import { FiTrash2, FiShoppingCart, FiHeart } from 'react-icons/fi';

function WishlistPage() {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('jwt');
        if (!token) {
            navigate('/login');
            return;
        }

        async function loadWishlist() {
            try {
                setLoading(true);
                const data = await fetchWishlist();
                setWishlistItems(data);
            } catch (err) {
                console.error('load wishlist error', err);
                setError('Failed to load wishlist.');
            } finally {
                setLoading(false);
            }
        }

        loadWishlist();
    }, [navigate]);

    const handleRemove = async (productId) => {
        try {
            await removeFromWishlist(productId);
            setWishlistItems(prev => prev.filter(item => item.id !== productId));
        } catch (err) {
            console.error('remove from wishlist error', err);
            alert('Failed to remove item.');
        }
    };

    const handleAddToCart = (product) => {
        addToCart(product, 1);
        alert(`Added "${product.name}" to cart.`);
    };

    if (loading) return <div className="wishlist-page"><p>Loading your wishlist...</p></div>;
    if (error) return <div className="wishlist-page"><p className="error">{error}</p></div>;

    return (
        <div className="wishlist-page">
            <div className="wishlist-header">
                <h1>My Wishlist</h1>
                <p>{wishlistItems.length} items saved for later</p>
            </div>

            {wishlistItems.length === 0 ? (
                <div className="wishlist-empty">
                    <FiHeart size={64} color="#cbd5e1" />
                    <h2>Your wishlist is empty</h2>
                    <p>Save items you like to find them easily later.</p>
                    <Link to="/" className="btn-primary">Start Shopping</Link>
                </div>
            ) : (
                <div className="wishlist-grid">
                    {wishlistItems.map((item) => (
                        <div key={item.id} className="wishlist-item">
                            <div className="wishlist-img-wrap" onClick={() => navigate(`/product/${item.id}`)}>
                                <img src={item.image_url || 'https://via.placeholder.com/200'} alt={item.name} />
                            </div>
                            <div className="wishlist-info">
                                <div className="wishlist-details">
                                    <span className="brand">{item.brand}</span>
                                    <h3 onClick={() => navigate(`/product/${item.id}`)}>{item.name}</h3>
                                    <p className="price">${Number(item.price).toFixed(2)}</p>
                                </div>
                                <div className="wishlist-actions">
                                    <button
                                        className="wishlist-add-cart"
                                        onClick={() => handleAddToCart(item)}
                                        title="Add to Cart"
                                    >
                                        <FiShoppingCart /> Add to Cart
                                    </button>
                                    <button
                                        className="wishlist-remove"
                                        onClick={() => handleRemove(item.id)}
                                        title="Remove"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default WishlistPage;
