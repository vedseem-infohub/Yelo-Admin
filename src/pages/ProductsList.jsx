import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import { productsAPI, categoriesAPI, vendorsAPI } from '../services/api';
import ImageUploader from '../components/ImageUploader';
import { compressImage as compressImageConvertAPI } from '../utils/convertApiCompression';
import { compressImage } from '../utils/imageCompression'; // Fallback
import './ProductsList.css';

function ProductsList() {
  const [products, setProducts] = useState([]); // Products for current page
  const [allProducts, setAllProducts] = useState([]); // All products for filtering
  const [filteredProducts, setFilteredProducts] = useState([]); // Filtered products
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(() => {
    // Load from localStorage or default to 10
    const saved = localStorage.getItem('productsPerPage');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isReassigning, setIsReassigning] = useState(false);

  // Optimize product data for caching (remove unnecessary fields)
  const optimizeProductForCache = (products) => {
    return products.map(product => ({
      _id: product._id,
      name: product.name,
      category: product.category,
      slug: product.slug,
      price: product.price,
      stock: product.stock,
      isActive: product.isActive
    }));
  };
  
  const saveProductsToCache = (productsData) => {
    try {
      // Optimize data before caching to reduce size
      const optimizedProducts = optimizeProductForCache(productsData);
      
      // Try to save optimized data
      const cacheKey = 'products_cache_all';
      const cacheData = {
        products: optimizedProducts,
        timestamp: Date.now()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (err) {
      // Silently fail - caching is optional
      if (err.name === 'QuotaExceededError') {
        // Clear old cache entries if quota exceeded
        try {
          localStorage.removeItem('products_cache_all');
        } catch (clearErr) {
          // Ignore clear errors
        }
      }
    }
  };

  // Fetch products when page, perPage, or filters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, perPage]);

  // Save perPage to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('productsPerPage', perPage.toString());
    // Reset to page 1 when perPage changes
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [perPage]);

  // Fetch products from backend with pagination
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params with filters
      const params = {
        isActive: true,
        page: currentPage,
        limit: perPage,
        sort: 'newest'
      };
      
      // Add search to backend API
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      // Add category filter to backend API
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      
      const response = await productsAPI.getAll(params);
      
      const productsData = response.data || [];
      const pagination = response.pagination || {};
      
      // Store products for current page
      setAllProducts(productsData);
      setTotalProducts(pagination.total || productsData.length);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(productsData.map(p => p.category).filter(Boolean))];
      setCategories(prev => {
        // Merge with existing categories
        const combined = [...new Set([...prev, ...uniqueCategories])];
        return combined;
      });
      
      // Set products directly (no client-side filtering for now since we're using backend pagination)
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Refetch products when filters change (reset to page 1)
  useEffect(() => {
    if (currentPage === 1) {
      fetchProducts();
    } else {
      // Reset to page 1 when filters change, which will trigger fetchProducts
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory]);

  // Pagination calculation
  const totalPages = Math.ceil(totalProducts / perPage);
  
  // Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(products.map(p => p._id || p.sku));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (sku) => {
    if (selectedItems.includes(sku)) {
      setSelectedItems(selectedItems.filter(item => item !== sku));
    } else {
      setSelectedItems([...selectedItems, sku]);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedItems.length} items?`)) {
      try {
        await Promise.all(selectedItems.map(id => productsAPI.delete(id)));
        await fetchProducts();
        setSelectedItems([]);
        alert('Products deleted successfully');
      } catch (err) {
        alert('Error deleting products: ' + err.message);
      }
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(productId);
        // Remove product from the list
        setAllProducts(prev => prev.filter(p => p._id !== productId));
        setTotalProducts(prev => prev - 1);
        alert('Product deleted successfully');
      } catch (err) {
        alert('Error deleting product: ' + err.message);
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleSaveProduct = async (productData) => {
    try {
      let savedProduct;
      if (editingProduct) {
        savedProduct = await productsAPI.update(editingProduct._id, productData);
        alert('Product updated successfully');
        // Update existing product in the list
        setAllProducts(prev => prev.map(p => 
          p._id === editingProduct._id 
            ? { ...p, ...savedProduct.data } 
            : p
        ));
      } else {
        savedProduct = await productsAPI.create(productData);
        alert('Product created successfully');
        // Add new product to the beginning of the list
        const newProduct = savedProduct.data || savedProduct;
        setAllProducts(prev => [newProduct, ...prev]);
        setTotalProducts(prev => prev + 1);
      }
      setShowAddForm(false);
      setEditingProduct(null);
    } catch (err) {
      alert('Error saving product: ' + err.message);
    }
  };

  const handleReassignProducts = async () => {
    if (!window.confirm('This will reassign all products to their appropriate shops (luxury-shop, under-999, fresh-arrival, etc.). This may take a few moments. Continue?')) {
      return;
    }

    try {
      setIsReassigning(true);
      const response = await productsAPI.reassignAndSync();
      
      if (response && response.success) {
        alert(`✅ Success! ${response.assignedCount || 0} products reassigned to shops.\n${response.message || ''}`);
        // Optionally refresh the product list
        await fetchProducts();
      } else {
        alert('Reassignment completed but may have had issues. Check console for details.');
      }
    } catch (err) {
      alert('Error reassigning products: ' + err.message);
    } finally {
      setIsReassigning(false);
    }
  };

  // KPI calculations - use allProducts for accurate stats across all products
  const totalStock = allProducts.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const lowStockCount = allProducts.filter(p => (p.stock || 0) < 10 && (p.stock || 0) > 0).length;
  const outOfStockCount = allProducts.filter(p => (p.stock || 0) === 0).length;

  return (
    <AdminLayout>
      <div className="products-container">

        {/* Header & KPIs */}
        <div className="products-header-modern">
          <div>
            <h1>Product Management</h1>
            <p className="text-muted">Manage catalog, inventory, and pricing.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn" 
              onClick={handleReassignProducts}
              disabled={isReassigning}
              style={{ 
                backgroundColor: '#10b981', 
                color: 'white',
                border: 'none',
                opacity: isReassigning ? 0.6 : 1,
                cursor: isReassigning ? 'not-allowed' : 'pointer'
              }}
              title="Reassign all products to appropriate shops (luxury-shop, under-999, fresh-arrival, etc.)"
            >
              {isReassigning ? '⏳ Reassigning...' : '🔄 Reassign to Shops'}
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              + Add Product
            </button>
          </div>
        </div>

        <div className="product-stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalProducts}</div>
            <div className="stat-label">Total SKUs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalStock}</div>
            <div className="stat-label">Total Stock</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{lowStockCount}</div>
            <div className="stat-label">Low Stock</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-value">{outOfStockCount}</div>
            <div className="stat-label">Out of Stock</div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="controls-bar card">
          <div className="search-group">
            <i className="search-icon">🔍</i>
            <input
              type="text"
              placeholder="Search by name, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <select 
            value={perPage} 
            onChange={e => setPerPage(parseInt(e.target.value, 10))} 
            className="filter-select"
            style={{ marginLeft: '10px' }}
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
          {selectedItems.length > 0 && (
            <div className="bulk-actions">
              <span className="selected-count">{selectedItems.length} Selected</span>
              <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>Delete Selected</button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="table-container card">
          <table className="modern-table product-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedItems.length === products.length && products.length > 0}
                  />
                </th>
                <th>Product Info</th>
                <th>Category</th>
                <th>Style</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                    Loading products...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--danger)' }}>
                    Error: {error}
                    <button onClick={fetchProducts} style={{ marginLeft: '10px' }}>Retry</button>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className={selectedItems.includes(product._id) ? 'selected-row' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(product._id)}
                        onChange={() => handleSelectItem(product._id)}
                      />
                    </td>
                    <td>
                      <div className="product-cell">
                        <div className="product-img-placeholder">
                          {(() => {
                            const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
                            const imageUrl = primaryImage ? (typeof primaryImage === 'string' ? primaryImage : primaryImage.url) : null;
                            return imageUrl ? (
                              <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              product.name?.charAt(0) || 'P'
                            );
                          })()}
                        </div>
                        <div>
                          <div className="product-name">{product.name || 'Unnamed Product'}</div>
                          <div className="product-sku">{product.slug || product._id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{product.category || 'N/A'}</td>
                    <td>{product.productType || product.style || 'N/A'}</td>
                    <td className="font-bold">₹{product.price || 0}</td>
                    <td>
                      <div className="stock-cell">
                        <div className="stock-bar-bg">
                          <div
                            className="stock-bar-fill"
                            style={{
                              width: `${Math.min((product.stock || 0), 100)}%`,
                              backgroundColor: (product.stock || 0) < 10 ? 'var(--danger)' : 'var(--success)'
                            }}
                          ></div>
                        </div>
                        <span>{product.stock || 0}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${product.isActive !== false ? 'success' : 'danger'}`}>
                        {product.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn edit" title="Edit" onClick={() => handleEdit(product)}>✏️</button>
                        <button className="icon-btn delete" title="Delete" onClick={() => handleDelete(product._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalProducts > 0 && (
            <div className="pagination-container" style={{ 
              marginTop: '20px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '15px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalProducts)} of {totalProducts} products
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  style={{ cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  Previous
                </button>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                    // Show page numbers around current page
                    let pageNum;
                    if (totalPages <= 10) {
                      pageNum = i + 1;
                    } else if (currentPage <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 4) {
                      pageNum = totalPages - 9 + i;
                    } else {
                      pageNum = currentPage - 5 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`btn btn-sm page-num ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          padding: '6px 12px',
                          minWidth: '36px',
                          cursor: 'pointer',
                          backgroundColor: currentPage === pageNum ? '#007bff' : '#fff',
                          color: currentPage === pageNum ? '#fff' : '#333',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  style={{ cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Product Modal */}
        {showAddForm && (
          <ProductFormModal
            product={editingProduct}
            onClose={() => {
              setShowAddForm(false);
              setEditingProduct(null);
            }}
            onSave={handleSaveProduct}
            categories={categories}
          />
        )}

      </div>
    </AdminLayout>
  );
}

// Product Form Modal Component
function ProductFormModal({ product, onClose, onSave, categories }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    subcategory: product?.subcategory || '',
    productType: product?.productType || '',
    price: product?.price || '',
    originalPrice: product?.originalPrice || '',
    discount: product?.discount || 0,
    stock: product?.stock || 0,
    description: product?.description || '',
    brand: product?.brand || '',
    vendorSlug: product?.vendorSlug || '',
    isActive: product?.isActive !== false,
    isTrending: product?.isTrending || false,
    images: product?.images || [],
    sizes: product?.sizes || [],
  });

  const [backendCategories, setBackendCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);

  // Fetch categories and vendors when modal opens
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        // Fetch categories with subcategories
        const categoriesResponse = await categoriesAPI.getAll();
        const categoriesData = categoriesResponse.data || categoriesResponse || [];
        setBackendCategories(categoriesData);

        // Fetch vendors
        const vendorsResponse = await vendorsAPI.getAll();
        const vendorsData = vendorsResponse.data || vendorsResponse || [];
        setVendors(Array.isArray(vendorsData) ? vendorsData : []);

        // If editing and category is set, load subcategories for that category
        if (product?.category) {
          const selectedCategory = categoriesData.find(
            cat => cat.name === product.category || cat.slug === product.category
          );
          if (selectedCategory?.subcategories) {
            setAvailableSubcategories(selectedCategory.subcategories);
          }
        }
      } catch (err) {
        alert('Failed to load categories/vendors: ' + err.message);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Update form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        productType: product.productType || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        discount: product.discount || 0,
        stock: product.stock || 0,
        description: product.description || '',
        brand: product.brand || '',
        vendorSlug: product.vendorSlug || '',
        isActive: product.isActive !== false,
        isTrending: product.isTrending || false,
        images: product.images || [],
        sizes: product.sizes || [],
      });
    } else {
      setFormData({
        name: '',
        category: '',
        subcategory: '',
        productType: '',
        price: '',
        originalPrice: '',
        discount: 0,
        stock: 0,
        description: '',
        brand: '',
        vendorSlug: '',
        isActive: true,
        isTrending: false,
        images: [],
        sizes: [],
      });
      setAvailableSubcategories([]);
    }
  }, [product]);

  // Load subcategories when categories are loaded and product has a category
  useEffect(() => {
    if (product?.category && backendCategories.length > 0) {
      const selectedCategory = backendCategories.find(
        cat => cat.name === product.category || cat.slug === product.category
      );
      if (selectedCategory?.subcategories) {
        setAvailableSubcategories(selectedCategory.subcategories);
      }
    } else if (formData.category && backendCategories.length > 0) {
      // Also handle when category is selected in form
      const selectedCategory = backendCategories.find(
        cat => cat.name === formData.category || cat.slug === formData.category
      );
      if (selectedCategory?.subcategories) {
        setAvailableSubcategories(selectedCategory.subcategories);
      }
    }
  }, [backendCategories, product?.category, formData.category]);

  // Handle category change - update subcategories
  const handleCategoryChange = (categoryNameOrSlug) => {
    const selectedCategory = backendCategories.find(
      cat => cat.name === categoryNameOrSlug || cat.slug === categoryNameOrSlug
    );
    
    setFormData({
      ...formData,
      category: selectedCategory?.name || categoryNameOrSlug,
      subcategory: '' // Reset subcategory when category changes
    });

    if (selectedCategory?.subcategories) {
      setAvailableSubcategories(selectedCategory.subcategories);
    } else {
      setAvailableSubcategories([]);
    }
  };

  const handleImagesChange = (images) => {
    setFormData({ ...formData, images });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('Please fill in required fields (name, price)');
      return;
    }
    
    if (isSaving) return; // Prevent multiple submissions
    
    setIsSaving(true);
    
    try {
      // Process images - images are already compressed in ImageUploader component
      // So we just need to format them correctly
      let processedImages = formData.images || [];
      
      // Helper function to extract base64 from data URL
      const extractBase64 = (dataUrl) => {
        if (!dataUrl) return '';
        // If it's already a pure base64 string, return it
        if (!dataUrl.includes('base64,')) {
          // Already base64, but validate it doesn't have data: prefix
          if (dataUrl.startsWith('data:')) {
            const base64Index = dataUrl.indexOf('base64,');
            if (base64Index !== -1) {
              return dataUrl.substring(base64Index + 7);
            }
          }
          return dataUrl;
        }
        // Extract base64 part from data URL (data:image/webp;base64,xxxxx)
        const base64Index = dataUrl.indexOf('base64,');
        if (base64Index === -1) return dataUrl;
        return dataUrl.substring(base64Index + 7); // +7 to skip "base64,"
      };
      
      // Helper function to sanitize and validate base64 string
      const sanitizeBase64 = (base64) => {
        if (!base64) return '';
        // Remove any whitespace, newlines, and invalid characters
        base64 = base64.replace(/\s/g, ''); // Remove all whitespace
        base64 = base64.replace(/[^A-Za-z0-9+/=]/g, ''); // Remove any non-base64 characters
        return base64;
      };
      
      // Helper function to validate and limit base64 size (target: 20-30 KB images)
      const validateBase64 = (base64) => {
        if (!base64) return '';
        
        // Sanitize the base64 string first
        base64 = sanitizeBase64(base64);
        
        // Limit to 50KB base64 string (roughly 37KB actual, allowing some buffer above 20-30 KB target)
        // Base64 is ~33% larger than binary, so 50KB base64 ≈ 37KB binary
        const maxBase64Size = 50 * 1024; // 50KB in bytes
        if (base64.length > maxBase64Size) {
          throw new Error(`Image too large (${(base64.length / 1024).toFixed(2)}KB). Maximum size is 50KB. Please compress the image further or use a smaller image.`);
        }
        
        // Validate base64 format - should only contain base64 characters
        // Base64 padding (if any) should be at the end and max 2 '=' characters
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
          throw new Error('Invalid base64 format');
        }
        
        // Validate length is multiple of 4 (for proper padding)
        const remainder = base64.length % 4;
        if (remainder !== 0) {
          // Add padding if needed
          base64 += '='.repeat(4 - remainder);
        }
        
        return base64;
      };
      
      // Process all images - always compress to ensure they're under size limit
      try {
        processedImages = await Promise.all(
          processedImages.map(async (img) => {
            let base64 = '';
            
            // If image has a file, always compress it (even if it has preview)
            if (img.file) {
              let compressedDataUrl;
              try {
                // Try ConvertAPI compression first - use quality 20 for very high compression (target 20-30 KB)
                compressedDataUrl = await compressImageConvertAPI(img.file, 20);
              } catch (convertApiError) {
                // Fallback to client-side compression - smaller dimensions and lower quality
                compressedDataUrl = await compressImage(img.file, 800, 800, 0.5);
              }
              
              // Extract pure base64 from data URL
              base64 = validateBase64(extractBase64(compressedDataUrl));
            }
            // If image doesn't have file but has preview, use it (but validate size)
            else if (img.preview && typeof img.preview === 'string' && img.preview.length > 0) {
              const imageUrl = img.preview;
              // If it's a data URL, extract base64; if it's a regular URL, keep it as is
              const isDataUrl = imageUrl.startsWith('data:');
              if (isDataUrl) {
                const extractedBase64 = extractBase64(imageUrl);
                // Check if the extracted base64 is too large - if so, we can't compress further without the file
                // But since we don't have the file, we'll just validate and use it
                base64 = validateBase64(extractedBase64);
              } else {
                // Regular URL - keep as is
                base64 = imageUrl;
              }
            }
            // If image doesn't have file or preview, use url if available
            else if (img.url || typeof img === 'string') {
              const imageUrl = img.url || (typeof img === 'string' ? img : '');
              // If it's a data URL, extract base64; if it's a regular URL, keep it as is
              const isDataUrl = imageUrl.startsWith('data:');
              if (isDataUrl) {
                base64 = validateBase64(extractBase64(imageUrl));
              } else {
                base64 = imageUrl;
              }
            }
            
            // Return the processed image
            return {
              url: base64,
              isPrimary: img.isPrimary || false,
              alt: img.alt || ''
            };
          })
        );
      } catch (err) {
        alert('Error processing images: ' + err.message);
        setIsSaving(false);
        return;
      }
      
      // Ensure at least one image is primary if images exist
      if (processedImages.length > 0 && !processedImages.some(img => img.isPrimary)) {
        processedImages[0].isPrimary = true;
      }
      
      await onSave({
        ...formData,
        images: processedImages.length > 0 ? processedImages : undefined,
        sizes: formData.sizes.filter(size => size && size.trim() !== '') // Filter out empty sizes
      });
    } catch (err) {
      // Error is already handled in handleSaveProduct
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label>Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <label>Category</label>
              {loadingData ? (
                <select disabled>
                  <option>Loading categories...</option>
                </select>
              ) : (
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {backendCategories.map(cat => (
                    <option key={cat._id || cat.slug} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label>Subcategory</label>
              {loadingData ? (
                <select disabled>
                  <option>Loading subcategories...</option>
                </select>
              ) : availableSubcategories.length > 0 ? (
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                >
                  <option value="">Select Subcategory</option>
                  {availableSubcategories.map(subcat => (
                    <option key={subcat._id || subcat.slug} value={subcat.name}>
                      {subcat.name}
                    </option>
                  ))}
                </select>
              ) : (
                <select disabled>
                  <option>Select a category first</option>
                </select>
              )}
            </div>
            <div>
              <label>Vendor</label>
              {loadingData ? (
                <select disabled>
                  <option>Loading vendors...</option>
                </select>
              ) : (
                <select
                  value={formData.vendorSlug}
                  onChange={(e) => setFormData({ ...formData, vendorSlug: e.target.value })}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor._id || vendor.slug} value={vendor.slug}>
                      {vendor.name || vendor.businessName || vendor.slug}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label>Product Type</label>
              <input
                type="text"
                value={formData.productType}
                onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                placeholder="e.g., T-Shirt, Jeans"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label>Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => {
                    const newPrice = Number(e.target.value);
                    const newFormData = { ...formData, price: newPrice };
                    // Auto-calculate discount if originalPrice exists
                    if (formData.originalPrice && formData.originalPrice > newPrice) {
                      const calculatedDiscount = Math.round(((formData.originalPrice - newPrice) / formData.originalPrice) * 100);
                      newFormData.discount = calculatedDiscount;
                    }
                    setFormData(newFormData);
                  }}
                />
              </div>
              <div>
                <label>Original Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.originalPrice}
                  onChange={(e) => {
                    const newOriginalPrice = Number(e.target.value);
                    const newFormData = { ...formData, originalPrice: newOriginalPrice };
                    // Auto-calculate discount if price exists
                    if (newOriginalPrice > formData.price) {
                      const calculatedDiscount = Math.round(((newOriginalPrice - formData.price) / newOriginalPrice) * 100);
                      newFormData.discount = calculatedDiscount;
                    } else if (newOriginalPrice === 0 || !newOriginalPrice) {
                      newFormData.discount = 0;
                    }
                    setFormData(newFormData);
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label>Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => {
                    const newDiscount = Number(e.target.value);
                    const newFormData = { ...formData, discount: newDiscount };
                    // Auto-calculate price if originalPrice exists
                    if (formData.originalPrice && newDiscount > 0) {
                      const calculatedPrice = Math.round(formData.originalPrice * (1 - newDiscount / 100));
                      newFormData.price = calculatedPrice;
                    }
                    setFormData(newFormData);
                  }}
                />
              </div>
              <div>
                <label>Stock</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label>Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Enter brand name"
              />
            </div>
            <div>
              <label>Sizes</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formData.sizes.map((size, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={size}
                      onChange={(e) => {
                        const newSizes = [...formData.sizes];
                        newSizes[index] = e.target.value;
                        setFormData({ ...formData, sizes: newSizes });
                      }}
                      placeholder="e.g., S, M, L, XL"
                      style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSizes = formData.sizes.filter((_, i) => i !== index);
                        setFormData({ ...formData, sizes: newSizes });
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, sizes: [...formData.sizes, ''] });
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    alignSelf: 'flex-start'
                  }}
                >
                  + Add Size
                </button>
              </div>
            </div>
            <div>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter product description"
                rows="3"
              />
            </div>
            <ImageUploader
              images={formData.images}
              onChange={handleImagesChange}
              maxImages={10}
            />
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Active
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.isTrending}
                  onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                />
                Is Trending
              </label>
            </div>
          </div>
          <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <span style={{ display: 'inline-block', marginRight: '8px' }}>
                    <span className="spinner-inline"></span>
                  </span>
                  Saving...
                </>
              ) : (
                'Save Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductsList;