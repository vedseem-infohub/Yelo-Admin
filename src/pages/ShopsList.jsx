import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import { shopsAPI } from '../services/api';
import './ShopsList.css';

function ShopsList() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    route: '',
    description: '',
    majorCategory: 'AFFORDABLE',
    criteria: {},
    bannerImage: ''
  });

  // Helper functions for localStorage
  const getCacheKey = () => {
    return 'shops_cache_all';
  };
  
  const saveShopsToCache = (shopsData) => {
    try {
      const cacheKey = getCacheKey();
      localStorage.setItem(cacheKey, JSON.stringify({
        shops: shopsData,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Error saving shops to localStorage:', err);
    }
  };
  
  const loadShopsFromCache = () => {
    try {
      const cacheKey = getCacheKey();
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { shops: cachedShops, timestamp } = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return cachedShops;
        }
      }
    } catch (err) {
      console.error('Error loading shops from localStorage:', err);
    }
    return null;
  };

  useEffect(() => {
    // Try cache first
    const cachedShops = loadShopsFromCache();
    if (cachedShops && cachedShops.length > 0) {
      setShops(cachedShops);
      setLoading(false);
    }
    fetchShops();
  }, []);

  const fetchShops = async (skipCache = false) => {
    try {
      if (!skipCache) {
        const cachedShops = loadShopsFromCache();
        if (cachedShops && cachedShops.length > 0) {
          return; // Already loaded from cache in useEffect
        }
      }
      
      setLoading(true);
      setError(null);
      const response = await shopsAPI.getAll();
      const shopsData = response.data || [];
      setShops(shopsData);
      
      // Save to cache
      saveShopsToCache(shopsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch shops');
      console.error('Error fetching shops:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (shop = null) => {
    if (shop) {
      setEditingShop(shop);
      setFormData({
        name: shop.name || '',
        slug: shop.slug || '',
        route: shop.route || '',
        description: shop.description || '',
        majorCategory: shop.majorCategory || 'AFFORDABLE',
        criteria: shop.criteria || {},
        bannerImage: shop.bannerImage || shop.image || ''
      });
    } else {
      setEditingShop(null);
      setFormData({
        name: '',
        slug: '',
        route: '',
        description: '',
        majorCategory: 'AFFORDABLE',
        criteria: {},
        bannerImage: ''
      });
    }
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingShop(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingShop) {
        await shopsAPI.update(editingShop.slug, formData);
        alert('Shop updated successfully');
      } else {
        const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');
        await shopsAPI.create({ ...formData, slug });
        alert('Shop created successfully');
      }
      handleCloseModal();
      await fetchShops(true); // Skip cache to get fresh data
    } catch (err) {
      alert('Error saving shop: ' + err.message);
    }
  };

  const handleDelete = async (slug) => {
    if (window.confirm('Are you sure you want to delete this shop?')) {
      try {
        await shopsAPI.delete(slug);
        // Update local state immediately
        const updatedShops = shops.filter(s => s.slug !== slug);
        setShops(updatedShops);
        saveShopsToCache(updatedShops);
        alert('Shop deleted successfully');
      } catch (err) {
        alert('Error deleting shop: ' + err.message);
      }
    }
  };

  const handleSeedShops = async () => {
    if (window.confirm('This will seed all shops from the seed file. Existing shops will be deleted and recreated. Continue?')) {
      try {
        setLoading(true);
        const response = await shopsAPI.seedShops();
        alert(response.message || 'Shops seeded successfully!');
        await fetchShops(); // Refresh the shops list
      } catch (err) {
        console.error('Error seeding shops:', err);
        alert('Error seeding shops: ' + (err.message || 'Unknown error. Please check console for details.'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReassignProducts = async () => {
    if (window.confirm('This will reassign all products to shops based on their criteria. This may take a few moments. Continue?')) {
      try {
        setLoading(true);
        const response = await shopsAPI.reassignProducts();
        alert(response.message || 'Products reassigned successfully!');
        // Optionally refresh the page or update UI
        window.location.reload();
      } catch (err) {
        console.error('Error reassigning products:', err);
        alert('Error reassigning products: ' + (err.message || 'Unknown error. Please check console for details.'));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="shops-container">
        <div className="page-header">
          <div>
            <h1>Shop Management</h1>
            <p className="text-muted">Manage shops like Super Saver, Under-999, etc.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={handleSeedShops}>
              Seed Shops
            </button>
            <button className="btn btn-outline" onClick={handleReassignProducts}>
              Reassign Products
            </button>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              + Add Shop
            </button>
          </div>
        </div>

        {error && (
          <div className="notification-toast error" style={{ marginBottom: '20px' }}>
            {error}
            <button onClick={fetchShops} style={{ marginLeft: '10px' }}>Retry</button>
          </div>
        )}

        <div className="table-container card">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading shops...</div>
          ) : shops.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              No shops found. Click "+ Add Shop" to create one.
            </div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Slug</th>
                  <th>Route</th>
                  <th>Major Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map(shop => (
                  <tr key={shop.slug}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {(shop.bannerImage || shop.image) && (
                          <img 
                            src={shop.bannerImage || shop.image} 
                            alt={shop.name}
                            style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{shop.name}</div>
                          {shop.description && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                              {shop.description.substring(0, 50)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#666' }}>{shop.slug}</td>
                    <td>{shop.route || 'N/A'}</td>
                    <td>
                      <span className={`badge ${shop.majorCategory === 'LUXURY' ? 'success' : 'secondary'}`}>
                        {shop.majorCategory || 'AFFORDABLE'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn edit" onClick={() => handleOpenModal(shop)} title="Edit">
                          ✏️
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDelete(shop.slug)} title="Delete">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingShop ? 'Edit Shop' : 'Add New Shop'}</h2>
                <button className="close-btn" onClick={handleCloseModal}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Shop Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Super Saver"
                    />
                  </div>
                  <div className="form-group">
                    <label>Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="Auto-generated if empty (e.g. super-saver)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Route</label>
                    <input
                      type="text"
                      value={formData.route}
                      onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                      placeholder="e.g. /shop/super-saver"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Shop description"
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Major Category</label>
                    <select
                      value={formData.majorCategory}
                      onChange={(e) => setFormData({ ...formData, majorCategory: e.target.value })}
                    >
                      <option value="AFFORDABLE">Affordable</option>
                      <option value="LUXURY">Luxury</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Banner Image URL</label>
                    <input
                      type="url"
                      value={formData.bannerImage}
                      onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                      placeholder="https://example.com/banner.jpg"
                    />
                    {formData.bannerImage && (
                      <img 
                        src={formData.bannerImage} 
                        alt="Banner Preview"
                        style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', marginTop: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {editingShop ? 'Update Shop' : 'Create Shop'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default ShopsList;

