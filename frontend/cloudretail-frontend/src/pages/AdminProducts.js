// src/pages/AdminProducts.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, createProduct, uploadProductImage, updateStock } from '../api';

const CATEGORIES = [
  'Electronics',
  'Wearables',
  'Fashion',
  'Home & Living',
  'Beauty & Personal Care',
  'Sports & Outdoors',
  'Toys & Games',
  'Automotive',
  'Books & Stationery',
  'Pet Supplies',
  'Groceries',
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

function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [brand, setBrand] = useState(CATEGORY_BRANDS[CATEGORIES[0]][0]); // Default to first brand of first category

  // Reset brand when category changes
  useEffect(() => {
    const brands = CATEGORY_BRANDS[category] || [];
    if (brands.length > 0) {
      setBrand(brands[0]);
    } else {
      setBrand('Other');
    }
  }, [category]);
  const [customBrand, setCustomBrand] = useState('');
  const [quantity, setQuantity] = useState(10);



  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Stock Management State
  const [stockProduct, setStockProduct] = useState(null);
  const [stockToAdd, setStockToAdd] = useState('');

  const [message, setMessage] = useState('');

  // On load: check role and load product list
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('jwt');

    if (!token || role !== 'ADMIN') {
      alert('You must be an admin to access this page.');
      navigate('/admin/login');
      return;
    }

    fetchProducts()
      .then(setProducts)
      .catch(err => console.error('fetchProducts error', err));
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview('');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (!name || !price) {
        setMessage('Name and price are required');
        return;
      }
      if (!imageFile) {
        setMessage('Please upload a product image');
        return;
      }

      const priceNumber = parseFloat(price);
      const qtyNumber = parseInt(quantity, 10);

      // 1) Upload image to product-service
      setUploadingImage(true);
      const { imageUrl } = await uploadProductImage(imageFile);
      setUploadingImage(false);

      // 2) Create product with that image URL
      const finalBrand = brand === 'Other' ? customBrand : brand;
      const created = await createProduct({
        name,
        description,
        price: priceNumber,
        category,
        brand: finalBrand,
        image_url: imageUrl, // used by customer pages
        rating: 0,
        quantity: qtyNumber,
      });

      setMessage(`Product "${created.name}" created with ID ${created.id}`);

      // Clear form
      setName('');
      setDescription('');
      setPrice('');
      setQuantity(10);
      setImageFile(null);
      setImagePreview('');

      // Refresh list
      const updated = await fetchProducts();
      setProducts(updated);
    } catch (err) {
      console.error('createProduct / upload error', err);

      const backendMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Unknown error';

      setUploadingImage(false);
      setMessage(`Error: ${backendMsg}`);
    }
  };

  const handleOpenStock = (p) => {
    setStockProduct(p);
    setStockToAdd('');
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

      await updateStock(stockProduct.id, added);
      alert(`Added ${added} stock to ${stockProduct.name}`);

      setStockProduct(null);
      setStockToAdd('');

      // Refresh list
      const updated = await fetchProducts();
      setProducts(updated);
    } catch (err) {
      console.error('Stock update failed', err);
      alert('Failed to update stock');
    }
  };

  return (
    <div className="form-container">
      <h2>Admin – Manage Products</h2>

      <h3>Add New Product</h3>
      {message && <div style={{ marginBottom: 10 }}>{message}</div>}

      <form onSubmit={handleSubmit}>
        <label>Product Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label>Price (USD)</label>
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <label>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label>Brand</label>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}>
          {(CATEGORY_BRANDS[category] || []).map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
          <option value="Other">Other</option>
        </select>
        {brand === 'Other' && (
          <input
            placeholder="Enter custom brand"
            value={customBrand}
            onChange={(e) => setCustomBrand(e.target.value)}
            style={{ marginTop: 5, marginBottom: 10 }}
          />
        )}

        <label>Quantity</label>
        <input
          type="number"
          value={quantity}
          min={0}
          onChange={(e) => setQuantity(e.target.value)}
        />

        <label>Product Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        {imagePreview && (
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 12 }}>Preview:</span>
            <br />
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                width: 120,
                height: 120,
                objectFit: 'cover',
                borderRadius: 6,
                marginTop: 4,
              }}
            />
          </div>
        )}

        <button type="submit" disabled={uploadingImage}>
          {uploadingImage ? 'Uploading image...' : 'Add Product'}
        </button>
      </form>

      <h3 style={{ marginTop: 30 }}>Existing Products</h3>
      {products.length === 0 && <div>No products found yet.</div>}

      {products.length > 0 && (
        <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 10 }}>
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                borderBottom: '1px solid #eee',
                padding: '6px 0',
                fontSize: 14,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <strong>#{p.id}</strong> – {p.name} (${p.price}) – {p.category} <br />
                <span style={{ fontSize: '0.9em', color: '#666' }}>Stock: {p.quantity}</span>
              </div>
              <button
                onClick={() => handleOpenStock(p)}
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                Add Stock
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Simple Stock Modal/Overlay */}
      {stockProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 8, minWidth: 300 }}>
            <h3>Add Stock: {stockProduct.name}</h3>
            <p>Current Quantity: {stockProduct.quantity}</p>
            <form onSubmit={handleStockSubmit}>
              <label>Quantity to Add</label>
              <input
                type="number"
                min="1"
                value={stockToAdd}
                onChange={e => setStockToAdd(e.target.value)}
                autoFocus
                style={{ width: '100%', marginBottom: 10 }}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setStockProduct(null)} style={{ background: '#ccc' }}>Cancel</button>
                <button type="submit">Confirm Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
