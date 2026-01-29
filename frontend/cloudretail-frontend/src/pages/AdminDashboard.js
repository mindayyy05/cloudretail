// src/pages/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { fetchProducts, createProduct, uploadProductImage, updateStock, fetchUsers, deleteUser, updateUser } from '../api';
import './AdminDashboard.css';

const CATEGORIES = [
    'Electronics', 'Wearables', 'Fashion', 'Home & Living',
    'Beauty & Personal Care', 'Sports & Outdoors', 'Toys & Games',
    'Automotive', 'Books & Stationery', 'Pet Supplies', 'Groceries',
];

const CATEGORY_BRANDS = {
    'Electronics': ['Apple', 'Samsung', 'Sony', 'Dell', 'HP', 'LG', 'Bose', 'Microsoft', 'Canon', 'Asus'],
    'Wearables': ['Apple', 'Samsung', 'Fitbit', 'Garmin', 'Huawei', 'Xiaomi', 'Fossil', 'Whoop'],
    'Fashion': ['Nike', 'Adidas', 'Gucci', 'Zara', 'H&M', 'Uniqlo', 'Louis Vuitton', 'Calvin Klein', 'Levi\'s', 'Ralph Lauren'],
    'Home & Living': ['IKEA', 'Dyson', 'Philips', 'Nest', 'KitchenAid', 'Cuisinart', 'Shark', 'Herman Miller', 'West Elm'],
    'Beauty & Personal Care': ['L\'Oreal', 'Estee Lauder', 'Dove', 'Nivea', 'Maybelline', 'MAC', 'Clinique', 'Olay', 'Neutrogena'],
    'Sports & Outdoors': ['Nike', 'Adidas', 'Puma', 'Under Armour', 'Columbia', 'Reebok', 'New Balance', 'Asics', 'The North Face', 'Patagonia'],
    'Toys & Games': ['Lego', 'Hasbro', 'Mattel', 'Nintendo', 'Fisher-Price', 'Hot Wheels', 'Nerf', 'Barbie', 'Bandai'],
    'Automotive': ['Bosch', 'Michelin', 'Castrol', 'Meguiar\'s', 'Pioneer', 'Sony', 'Garmin', 'Bridgestone'],
    'Books & Stationery': ['Penguin', 'HarperCollins', 'Moleskine', 'Pilot', 'Paper Mate', 'Oxford', 'Scholastic', 'Pearson'],
    'Pet Supplies': ['Royal Canin', 'Purina', 'Pedigree', 'Whiskas', 'Kong', 'Blue Buffalo', 'Hill\'s', 'Trixie'],
    'Groceries': ['Nestle', 'Coca-Cola', 'Kellogg\'s', 'Heinz', 'Kraft', 'Unilever', 'PepsiCo', 'Danone', 'General Mills'],
};

function AdminDashboard() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'products';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Products state
    const [products, setProducts] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [brand, setBrand] = useState(CATEGORY_BRANDS[CATEGORIES[0]][0]);
    const [customBrand, setCustomBrand] = useState('');
    const [quantity, setQuantity] = useState(10);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [productMessage, setProductMessage] = useState('');

    // Stock Management state
    const [stockProduct, setStockProduct] = useState(null);
    const [stockToAdd, setStockToAdd] = useState('');
    const [stockMessage, setStockMessage] = useState('');

    // Orders state
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [ordersError, setOrdersError] = useState('');

    // Users state
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Edit User State
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', role: 'USER' });

    useEffect(() => {
        const role = localStorage.getItem('admin_userRole');
        const token = localStorage.getItem('admin_jwt');

        if (!token || role !== 'ADMIN') {
            alert('You must be an admin to access this page.');
            navigate('/admin/login');
            return;
        }

        // Load products
        fetchProducts({}, token)
            .then(setProducts)
            .catch(err => console.error('fetchProducts error', err));

        // Load data based on tab
        if (activeTab === 'orders') {
            fetchAllOrders(token);
        } else if (activeTab === 'users') {
            loadUsers();
        }
    }, [navigate, activeTab]);

    useEffect(() => {
        const brands = CATEGORY_BRANDS[category] || [];
        if (brands.length > 0) {
            setBrand(brands[0]);
        } else {
            setBrand('Other');
        }
    }, [category]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams({ tab });

        if (tab === 'orders') {
            const token = localStorage.getItem('admin_jwt');
            fetchAllOrders(token);
        } else if (tab === 'users') {
            loadUsers();
        }
    };

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const data = await fetchUsers();
            setUsers(data);
        } catch (err) {
            console.error('Failed to load users', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await deleteUser(userId);
            loadUsers(); // Refresh
        } catch (err) {
            console.error('Failed to delete user', err);
            alert('Failed to delete user');
        }
    };

    const handleEditUserClick = (user) => {
        setEditingUser(user);
        setEditForm({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role
        });
    };

    const handleEditUserSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateUser(editingUser.id, editForm);
            alert('User updated successfully');
            setEditingUser(null);
            loadUsers();
        } catch (err) {
            console.error('Failed to update user', err);
            alert(err.response?.data?.message || 'Failed to update user');
        }
    };

    const fetchAllOrders = async (token) => {
        try {
            setLoadingOrders(true);
            setOrdersError('');

            const response = await fetch('http://localhost:4004/api/v1/admin/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to load orders');
            }

            const data = await response.json();
            setOrders(data);
        } catch (err) {
            console.error('fetchAllOrders error', err);
            setOrdersError(err.message || 'Failed to load orders. Please try again.');
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) {
            setImageFiles([]);
            setImagePreviews([]);
            return;
        }
        setImageFiles(files);
        setImagePreviews(files.map(file => URL.createObjectURL(file)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProductMessage('');

        try {
            if (!name || !price) {
                setProductMessage('Name and price are required');
                return;
            }
            if (imageFiles.length === 0) {
                setProductMessage('Please upload at least one product image');
                return;
            }

            const priceNumber = parseFloat(price);
            const qtyNumber = parseInt(quantity, 10);

            setUploadingImage(true);

            const token = localStorage.getItem('admin_jwt');

            // Upload all images
            const uploadPromises = imageFiles.map(file => uploadProductImage(file, token));
            const uploadResults = await Promise.all(uploadPromises);
            const imageUrls = uploadResults.map(res => res.imageUrl);

            setUploadingImage(false);

            const primaryImage = imageUrls[0];
            const additionalImages = imageUrls.slice(1);

            const finalBrand = brand === 'Other' ? customBrand : brand;
            const created = await createProduct({
                name,
                description,
                price: priceNumber,
                category,
                brand: finalBrand,
                image_url: primaryImage,
                additionalImages,
                rating: 0,
                quantity: qtyNumber,
            }, token);

            setProductMessage(`Product "${created.name}" created successfully!`);

            // Clear form
            setName('');
            setDescription('');
            setPrice('');
            setQuantity(10);
            setImageFiles([]);
            setImagePreviews([]);

            // Refresh list
            const updated = await fetchProducts({}, token);
            setProducts(updated);
        } catch (err) {
            console.error('createProduct error', err);
            const backendMsg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Unknown error';
            setUploadingImage(false);
            setProductMessage(`Error: ${backendMsg}`);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const formatPrice = (price) => {
        return `$${parseFloat(price).toFixed(2)}`;
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            1: 'Placed',
            2: 'Processing',
            3: 'Shipped',
            4: 'Delivered',
            5: 'Cancelled',
            'PENDING': 'Placed',
        };
        return statusMap[status] || statusMap['PENDING'] || 'Placed';
    };

    const getStatusClass = (status) => {
        const numStatus = typeof status === 'string' ? 1 : status;
        if (numStatus === 4) return 'status-delivered';
        if (numStatus === 5) return 'status-cancelled';
        if (numStatus === 3) return 'status-shipped';
        return 'status-active';
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('admin_jwt');
            const response = await fetch(`http://localhost:4004/api/v1/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            // Refresh orders
            fetchAllOrders(token);
        } catch (err) {
            console.error('handleStatusUpdate error', err);
            alert('Failed to update order status');
        }
    };

    const handleOpenStock = (p) => {
        setStockProduct(p);
        setStockToAdd('');
        setStockMessage('');
    };

    const handleStockSubmit = async (e) => {
        e.preventDefault();
        if (!stockProduct || !stockToAdd) return;

        try {
            const added = parseInt(stockToAdd, 10);
            if (isNaN(added) || added <= 0) {
                alert('Please enter a valid positive number');
                return;
            }

            const token = localStorage.getItem('admin_jwt');
            await updateStock(stockProduct.id, added, token);
            setStockMessage(`Successfully added ${added} units to ${stockProduct.name}`);

            setStockProduct(null);
            setStockToAdd('');

            // Refresh list
            const updated = await fetchProducts({}, token);
            setProducts(updated);

            // Auto clear message after 3s
            setTimeout(() => setStockMessage(''), 3000);
        } catch (err) {
            console.error('Stock update failed', err);
            alert('Failed to update stock');
        }
    };

    return (
        <AdminLayout activeTab={activeTab} onTabChange={handleTabChange}>
            {activeTab === 'users' ? (
                <div>
                    <div className="admin-section-header">
                        <h1>Manage Users</h1>
                        <p>View registered users and manage their access</p>
                    </div>

                    <div className="admin-card">
                        {loadingUsers ? (
                            <p>Loading users...</p>
                        ) : users.length === 0 ? (
                            <p>No users found.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 15 }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                        <th style={{ padding: '10px' }}>Name</th>
                                        <th style={{ padding: '10px' }}>Email</th>
                                        <th style={{ padding: '10px' }}>Role</th>
                                        <th style={{ padding: '10px' }}>Last Login</th>
                                        <th style={{ padding: '10px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>{u.first_name} {u.last_name}</td>
                                            <td style={{ padding: '10px' }}>{u.email}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: 4, fontSize: '12px',
                                                    background: u.role === 'ADMIN' ? '#e0f2fe' : '#f3f4f6',
                                                    color: u.role === 'ADMIN' ? '#0369a1' : '#374151',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                {u.last_login ? formatDate(u.last_login) : 'Never'}
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <button
                                                    onClick={() => handleEditUserClick(u)}
                                                    style={{
                                                        padding: '6px 12px', background: '#3b82f6', color: 'white',
                                                        border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '13px',
                                                        marginRight: '8px'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    style={{
                                                        padding: '6px 12px', background: '#fee2e2', color: '#991b1b',
                                                        border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '13px'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Edit User Modal */}
                    {editingUser && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                        }}>
                            <div style={{ background: 'white', padding: 24, borderRadius: 8, minWidth: 400, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ marginTop: 0 }}>Edit User</h3>
                                <form onSubmit={handleEditUserSubmit}>
                                    <div style={{ marginBottom: 15 }}>
                                        <label style={{ display: 'block', marginBottom: 5 }}>First Name</label>
                                        <input
                                            value={editForm.first_name}
                                            onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
                                            required
                                        />
                                    </div>
                                    <div style={{ marginBottom: 15 }}>
                                        <label style={{ display: 'block', marginBottom: 5 }}>Last Name</label>
                                        <input
                                            value={editForm.last_name}
                                            onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
                                            required
                                        />
                                    </div>
                                    <div style={{ marginBottom: 15 }}>
                                        <label style={{ display: 'block', marginBottom: 5 }}>Email</label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
                                            required
                                        />
                                    </div>
                                    <div style={{ marginBottom: 15 }}>
                                        <label style={{ display: 'block', marginBottom: 5 }}>Role</label>
                                        <select
                                            value={editForm.role}
                                            onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
                                        >
                                            <option value="USER">USER</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                        <button type="button" onClick={() => setEditingUser(null)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                                        <button type="submit" style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            ) : activeTab === 'products' ? (
                <div>
                    <div className="admin-section-header">
                        <h1>Manage Products</h1>
                        <p>Add new products and manage your inventory</p>
                    </div>

                    {/* Add Product Form */}
                    <div className="admin-card">
                        <h3>Add New Product</h3>
                        {productMessage && (
                            <div className={`admin-message ${productMessage.includes('Error') ? 'error' : 'success'}`}>
                                {productMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="admin-form">
                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Product Name *</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter product name"
                                        required
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label>Price (USD) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="admin-form-group">
                                <label>Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter product description"
                                    rows={3}
                                />
                            </div>

                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Category *</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="admin-form-group">
                                    <label>Brand *</label>
                                    <select value={brand} onChange={(e) => setBrand(e.target.value)}>
                                        {(CATEGORY_BRANDS[category] || []).map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="admin-form-group">
                                    <label>Quantity *</label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        min={0}
                                        onChange={(e) => setQuantity(e.target.value)}
                                    />
                                </div>
                            </div>

                            {brand === 'Other' && (
                                <div className="admin-form-group">
                                    <label>Custom Brand Name</label>
                                    <input
                                        placeholder="Enter custom brand"
                                        value={customBrand}
                                        onChange={(e) => setCustomBrand(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="admin-form-group">
                                <label>Product Image *</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                />
                                {imagePreviews.length > 0 && (
                                    <div className="image-previews-grid" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                                        {imagePreviews.map((preview, idx) => (
                                            <div key={idx} className="image-preview" style={{ position: 'relative' }}>
                                                <img src={preview} alt={`Preview ${idx}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                                                {idx === 0 && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px' }}>Primary</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="admin-btn" disabled={uploadingImage}>
                                {uploadingImage ? 'Uploading...' : 'Add Product'}
                            </button>
                        </form>
                    </div>

                    {/* Products List */}
                    <div className="admin-card">
                        <h3>All Products ({products.length})</h3>
                        {products.length === 0 ? (
                            <p style={{ color: '#94a3b8' }}>No products found yet.</p>
                        ) : (
                            <div className="products-grid">
                                {products.map((p) => (
                                    <div key={p.id} className="product-card">
                                        {p.image_url && (
                                            <img src={p.image_url} alt={p.name} className="product-image" />
                                        )}
                                        <div className="product-info">
                                            <h4>{p.name}</h4>
                                            <p className="product-category">{p.category}</p>
                                            <p className="product-price">{formatPrice(p.price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : activeTab === 'stock' ? (
                <div>
                    <div className="admin-section-header">
                        <h1>Manage Stock</h1>
                        <p>View quantity levels and add stock</p>
                    </div>

                    {stockMessage && (
                        <div className="admin-message success" style={{ marginBottom: 20 }}>
                            {stockMessage}
                        </div>
                    )}

                    <div className="admin-card">
                        <h3>Current Inventory</h3>
                        {products.length === 0 ? (
                            <p>No products found.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 15 }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                        <th style={{ padding: '10px' }}>Product</th>
                                        <th style={{ padding: '10px' }}>Category</th>
                                        <th style={{ padding: '10px' }}>Current Stock</th>
                                        <th style={{ padding: '10px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {p.image_url && <img src={p.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} />}
                                                <span>{p.name}</span>
                                            </td>
                                            <td style={{ padding: '10px' }}>{p.category}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: 12, fontSize: '12px', fontWeight: 'bold',
                                                    background: p.quantity > 50 ? '#dcfce7' : p.quantity > 10 ? '#fef9c3' : '#fee2e2',
                                                    color: p.quantity > 50 ? '#166534' : p.quantity > 10 ? '#854d0e' : '#991b1b'
                                                }}>
                                                    {p.quantity} units
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <button
                                                    onClick={() => handleOpenStock(p)}
                                                    style={{
                                                        padding: '6px 12px', background: '#2563eb', color: 'white',
                                                        border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '13px'
                                                    }}
                                                >
                                                    + Add Stock
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Stock Modal */}
                    {stockProduct && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                        }}>
                            <div style={{ background: 'white', padding: 24, borderRadius: 8, minWidth: 350, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ marginTop: 0 }}>Add Stock: {stockProduct.name}</h3>
                                <p style={{ color: '#666', marginBottom: 20 }}>Current Quantity: <strong>{stockProduct.quantity}</strong></p>

                                <form onSubmit={handleStockSubmit}>
                                    <div style={{ marginBottom: 15 }}>
                                        <label style={{ display: 'block', marginBottom: 5, fontSize: '14px' }}>Quantity to Add</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={stockToAdd}
                                            onChange={e => setStockToAdd(e.target.value)}
                                            autoFocus
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
                                            placeholder="Enter amount"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                        <button type="button" onClick={() => setStockProduct(null)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                                        <button type="submit" style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Confirm Add</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div className="admin-section-header">
                        <h1>All Orders</h1>
                        <p>View and manage customer orders</p>
                    </div>

                    {loadingOrders ? (
                        <div className="admin-card">
                            <p>Loading orders...</p>
                        </div>
                    ) : ordersError ? (
                        <div className="admin-card">
                            <div className="admin-message error">{ordersError}</div>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="admin-card">
                            <p style={{ color: '#94a3b8' }}>No orders found.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="orders-stats">
                                <div className="stat-card">
                                    <h4>Total Orders</h4>
                                    <p>{orders.length}</p>
                                </div>
                                <div className="stat-card">
                                    <h4>Total Revenue</h4>
                                    <p>{formatPrice(orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0))}</p>
                                </div>
                            </div>

                            <div className="orders-list">
                                {orders.map((order) => (
                                    <div key={order.id} className="order-card">
                                        <div className="order-header">
                                            <div>
                                                <h3>Order #{order.id}</h3>
                                                <p className="order-date">{formatDate(order.created_at)}</p>
                                            </div>
                                            <div className="order-header-right">
                                                <span className={`order-status ${getStatusClass(order.status)}`}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                                <p className="order-total">{formatPrice(order.total_amount)}</p>
                                            </div>
                                        </div>

                                        <div className="order-details">
                                            <div className="order-detail-section">
                                                <h4>Customer</h4>
                                                <p>
                                                    {order.first_name && order.last_name
                                                        ? `${order.first_name} ${order.last_name}`
                                                        : order.shipping_name || `User #${order.user_id}`}
                                                </p>
                                                {order.user_email && <p style={{ fontSize: '12px', color: '#64748b' }}>{order.user_email}</p>}
                                            </div>

                                            <div className="order-detail-section">
                                                <h4>Shipping</h4>
                                                {order.shipping_address ? (
                                                    <>
                                                        <p>{order.shipping_address}</p>
                                                        <p>{order.shipping_city}, {order.shipping_zip}</p>
                                                        <p>{order.shipping_country}</p>
                                                    </>
                                                ) : (
                                                    <p style={{ color: '#94a3b8' }}>Not provided</p>
                                                )}
                                            </div>

                                            <div className="order-detail-section">
                                                <h4>Payment</h4>
                                                <p>{order.payment_method || 'N/A'}</p>
                                                <p className="payment-status">{order.payment_status || 'N/A'}</p>
                                            </div>

                                            <div className="order-detail-section">
                                                <h4>Delivery</h4>
                                                <p>{order.delivery_date ? formatDate(order.delivery_date) : 'N/A'}</p>
                                            </div>
                                        </div>

                                        {/* Status Update Buttons */}
                                        <div className="order-status-actions">
                                            <h4>Update Order Status:</h4>
                                            <div className="status-buttons">
                                                <button
                                                    className={`status-btn ${(order.status === 2 || order.status === 'PROCESSING') ? 'active' : ''}`}
                                                    onClick={() => handleStatusUpdate(order.id, 2)}
                                                    disabled={order.status === 4 || order.status === 5}
                                                >
                                                    Preparing
                                                </button>
                                                <button
                                                    className={`status-btn ${order.status === 3 ? 'active' : ''}`}
                                                    onClick={() => handleStatusUpdate(order.id, 3)}
                                                    disabled={order.status === 4 || order.status === 5}
                                                >
                                                    Sent for Delivery
                                                </button>
                                                <button
                                                    className={`status-btn ${order.status === 4 ? 'active' : ''}`}
                                                    onClick={() => handleStatusUpdate(order.id, 4)}
                                                    disabled={order.status === 4 || order.status === 5}
                                                >
                                                    Delivered
                                                </button>
                                            </div>
                                        </div>

                                        {order.items && order.items.length > 0 && (
                                            <div className="order-items">
                                                <h4>Items ({order.items.length})</h4>
                                                <div className="items-list">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="order-item">
                                                            {item.image_url && (
                                                                <img src={item.image_url} alt={item.product_name} />
                                                            )}
                                                            <div className="item-details">
                                                                <p className="item-name">{item.product_name || `Product #${item.product_id}`}</p>
                                                                <p className="item-quantity">Qty: {item.quantity}</p>
                                                            </div>
                                                            <p className="item-price">{formatPrice(item.unit_price * item.quantity)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AdminLayout>
    );
}

export default AdminDashboard;
