import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import { categoriesAPI } from '../services/api';
import SingleImageUploader from '../components/SingleImageUploader';
import './ProductCategoryManagement.css';

function ProductCategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [freeSubcategories, setFreeSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [assigningSubcategory, setAssigningSubcategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', slug: '', image: '' });
  const [subcategoryFormData, setSubcategoryFormData] = useState({ name: '', slug: '', image: '' });

  useEffect(() => {
    fetchCategories();
    fetchFreeSubcategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoriesAPI.getAll();
      const categoriesData = response.data || [];
      setCategories(categoriesData);
      return categoriesData; // Return data for use in other functions
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
      console.error('Error fetching categories:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchFreeSubcategories = async () => {
    try {
      const response = await categoriesAPI.getFreeSubcategories();
      const freeSubcats = response.data || [];
      setFreeSubcategories(freeSubcats);
    } catch (err) {
      console.error('Error fetching free subcategories:', err);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const slug = categoryFormData.slug || categoryFormData.name.toLowerCase().replace(/\s+/g, '-');
      await categoriesAPI.create({ ...categoryFormData, slug });
      showNotification('success', 'Category created successfully');
      setIsCategoryModalOpen(false);
      setCategoryFormData({ name: '', slug: '', image: '' });
      await fetchCategories();
    } catch (err) {
      showNotification('error', 'Error creating category: ' + err.message);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      await categoriesAPI.update(editingCategory.slug, categoryFormData);
      showNotification('success', 'Category updated successfully');
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryFormData({ name: '', slug: '', image: '' });
      await fetchCategories();
    } catch (err) {
      showNotification('error', 'Error updating category: ' + err.message);
    }
  };

  const handleDeleteCategory = async (slug) => {
    if (window.confirm('Are you sure you want to delete this category? Subcategories will be moved to Free Subcategories section.')) {
      try {
        await categoriesAPI.delete(slug);
        showNotification('success', 'Category deleted successfully. Subcategories moved to Free Subcategories.');
        if (selectedCategory?.slug === slug) {
          setSelectedCategory(null);
        }
        await fetchCategories();
        await fetchFreeSubcategories(); // Refresh free subcategories
      } catch (err) {
        showNotification('error', 'Error deleting category: ' + err.message);
      }
    }
  };

  const handleAssignFreeSubcategory = async (freeSubcategoryId, categorySlug) => {
    try {
      await categoriesAPI.assignFreeSubcategory(freeSubcategoryId, categorySlug);
      showNotification('success', 'Subcategory assigned to category successfully');
      setIsAssignModalOpen(false);
      setAssigningSubcategory(null);
      await fetchCategories();
      await fetchFreeSubcategories();
      // Refresh selected category if it was updated
      if (selectedCategory?.slug === categorySlug) {
        const updated = await categoriesAPI.getBySlug(categorySlug);
        if (updated.success) {
          setSelectedCategory(updated.data);
        }
      }
    } catch (err) {
      showNotification('error', 'Error assigning subcategory: ' + err.message);
    }
  };

  const handleDeleteFreeSubcategory = async (freeSubcategoryId) => {
    if (window.confirm('Are you sure you want to permanently delete this free subcategory?')) {
      try {
        await categoriesAPI.deleteFreeSubcategory(freeSubcategoryId);
        showNotification('success', 'Free subcategory deleted successfully');
        await fetchFreeSubcategories();
      } catch (err) {
        showNotification('error', 'Error deleting free subcategory: ' + err.message);
      }
    }
  };

  const handleOpenAssignModal = (freeSubcategory) => {
    setAssigningSubcategory(freeSubcategory);
    setIsAssignModalOpen(true);
  };

  const handleOpenCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({ name: category.name, slug: category.slug, image: category.image || '' });
    } else {
      setEditingCategory(null);
      setCategoryFormData({ name: '', slug: '', image: '' });
    }
    setIsCategoryModalOpen(true);
  };

  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    try {
      if (!selectedCategory || !selectedCategory.slug) {
        showNotification('error', 'Please select a category first');
        return;
      }
      
      if (!subcategoryFormData.name) {
        showNotification('error', 'Subcategory name is required');
        return;
      }
      
      const subcategorySlug = subcategoryFormData.slug || subcategoryFormData.name.toLowerCase().replace(/\s+/g, '-');
      await categoriesAPI.addSubcategory(selectedCategory.slug, { 
        name: subcategoryFormData.name,
        subcategorySlug: subcategorySlug,
        image: subcategoryFormData.image || null,
        icon: subcategoryFormData.icon || null
      });
      showNotification('success', 'Subcategory added successfully');
      setIsSubcategoryModalOpen(false);
      setSubcategoryFormData({ name: '', slug: '', image: '' });
      await fetchCategories();
      if (selectedCategory) {
        const updated = categories.find(c => c.slug === selectedCategory.slug);
        if (updated) handleSelectCategory(updated);
      }
    } catch (err) {
      showNotification('error', 'Error adding subcategory: ' + err.message);
    }
  };

  const handleUpdateSubcategory = async (e) => {
    e.preventDefault();
    try {
      await categoriesAPI.updateSubcategory(
        selectedCategory.slug,
        editingSubcategory.slug,
        subcategoryFormData
      );
      showNotification('success', 'Subcategory updated successfully');
      setIsSubcategoryModalOpen(false);
      setEditingSubcategory(null);
      setSubcategoryFormData({ name: '', slug: '', image: '' });
      await fetchCategories();
      if (selectedCategory) {
        const updated = categories.find(c => c.slug === selectedCategory.slug);
        if (updated) handleSelectCategory(updated);
      }
    } catch (err) {
      showNotification('error', 'Error updating subcategory: ' + err.message);
    }
  };

  const handleDeleteSubcategory = async (subcategorySlug) => {
    if (window.confirm('Are you sure you want to delete this subcategory?')) {
      try {
        await categoriesAPI.deleteSubcategory(selectedCategory.slug, subcategorySlug);
        
        // Optimistically update the UI immediately
        const updatedCategories = categories.map(cat => {
          if (cat.slug === selectedCategory.slug) {
            return {
              ...cat,
              subcategories: cat.subcategories.filter(sub => sub.slug !== subcategorySlug)
            };
          }
          return cat;
        });
        setCategories(updatedCategories);
        
        // Update selected category to reflect the change immediately
        const updatedCategory = updatedCategories.find(c => c.slug === selectedCategory.slug);
        if (updatedCategory) {
          setSelectedCategory(updatedCategory);
        }
        
        showNotification('success', 'Subcategory deleted successfully');
        
        // Fetch fresh data from backend in background and update selected category
        const freshData = await fetchCategories();
        fetchFreeSubcategories(); // Refresh free subcategories list as well
        const freshCategory = freshData.find(c => c.slug === selectedCategory.slug);
        if (freshCategory) {
          setSelectedCategory(freshCategory);
        }
      } catch (err) {
        showNotification('error', 'Error deleting subcategory: ' + err.message);
        // Revert on error by fetching fresh data
        await fetchCategories();
      }
    }
  };

  const handleOpenSubcategoryModal = (subcategory = null) => {
    if (!selectedCategory || !selectedCategory.slug) {
      showNotification('error', 'Please select a category first');
      return;
    }
    if (subcategory) {
      setEditingSubcategory(subcategory);
      setSubcategoryFormData({ name: subcategory.name, slug: subcategory.slug, image: subcategory.image || '' });
    } else {
      setEditingSubcategory(null);
      setSubcategoryFormData({ name: '', slug: '', image: '' });
    }
    setIsSubcategoryModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="management-container">
        <div className="page-header">
          <div>
            <h1>Category & Subcategory Management</h1>
            <p className="text-muted">Manage product categories and their subcategories</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenCategoryModal()}>
            + Add Category
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`notification-toast ${notification.type}`}>
            {notification.message}
          </div>
        )}

        {error && (
          <div className="notification-toast error" style={{ marginBottom: '20px' }}>
            {error}
            <button onClick={fetchCategories} style={{ marginLeft: '10px' }}>Retry</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px' }}>
          {/* Categories List */}
          <div className="card">
            <h3 style={{ padding: '15px', borderBottom: '1px solid #eee', margin: 0 }}>Categories</h3>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
            ) : categories.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No categories found</div>
            ) : (
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {categories.map(category => (
                  <div
                    key={category.slug}
                    onClick={() => handleSelectCategory(category)}
                    style={{
                      padding: '15px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedCategory?.slug === category.slug ? '#fff9e6' : 'white',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory?.slug !== category.slug) {
                        e.target.style.backgroundColor = '#f9f9f9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory?.slug !== category.slug) {
                        e.target.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {category.image && (
                        <img 
                          src={category.image} 
                          alt={category.name}
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{category.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {category.subcategories?.length || 0} subcategories
                        </div>
                      </div>
                    </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          className="action-btn-icon edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCategoryModal(category);
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn-icon delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.slug);
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subcategories List */}
          <div className="card">
            <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>
                {selectedCategory ? `${selectedCategory.name} - Subcategories` : 'Select a Category'}
              </h3>
              {selectedCategory && (
                <button className="btn btn-sm btn-primary" onClick={() => handleOpenSubcategoryModal()}>
                  + Add Subcategory
                </button>
              )}
            </div>
            {!selectedCategory ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                Select a category to view and manage subcategories
              </div>
            ) : (selectedCategory.subcategories || []).length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                No subcategories found. Click "+ Add Subcategory" to create one.
              </div>
            ) : (
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedCategory.subcategories || []).map(subcategory => (
                      <tr key={subcategory.slug}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {subcategory.image && (
                              <img 
                                src={subcategory.image} 
                                alt={subcategory.name}
                                style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            <span>{subcategory.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '12px', color: '#666' }}>{subcategory.slug}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              className="action-btn-icon edit"
                              onClick={() => handleOpenSubcategoryModal(subcategory)}
                            >
                              ✏️
                            </button>
                            <button
                              className="action-btn-icon delete"
                              onClick={() => handleDeleteSubcategory(subcategory.slug)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Free Subcategories Section */}
        <div className="card" style={{ marginTop: '20px' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>
              Free Subcategories
              {freeSubcategories.length > 0 && (
                <span style={{ marginLeft: '10px', fontSize: '14px', color: '#666', fontWeight: 'normal' }}>
                  ({freeSubcategories.length})
                </span>
              )}
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
              Subcategories from deleted categories. Assign them to existing categories.
            </p>
          </div>
          {freeSubcategories.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              No free subcategories. Subcategories from deleted categories will appear here.
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Original Category</th>
                    <th>Product Count</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {freeSubcategories.map(freeSubcat => (
                    <tr key={freeSubcat._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {freeSubcat.image && (
                            <img 
                              src={freeSubcat.image} 
                              alt={freeSubcat.name}
                              style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <span>{freeSubcat.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: '#666' }}>{freeSubcat.slug}</td>
                      <td style={{ fontSize: '12px', color: '#666' }}>
                        {freeSubcat.originalCategoryName} ({freeSubcat.originalCategorySlug})
                      </td>
                      <td>{freeSubcat.productCount || 0}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleOpenAssignModal(freeSubcat)}
                          >
                            Assign to Category
                          </button>
                          <button
                            className="action-btn-icon delete"
                            onClick={() => handleDeleteFreeSubcategory(freeSubcat._id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Category Modal */}
        {isCategoryModalOpen && (
          <div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                <button className="close-btn" onClick={() => setIsCategoryModalOpen(false)}>×</button>
              </div>
              <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Category Name *</label>
                    <input
                      type="text"
                      required
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                      placeholder="e.g. Men's Wear"
                    />
                  </div>
                  <div className="form-group">
                    <label>Slug</label>
                    <input
                      type="text"
                      value={categoryFormData.slug}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                      placeholder="Auto-generated if empty (e.g. mens-wear)"
                    />
                  </div>
                  <SingleImageUploader
                    label="Category Image"
                    currentImage={categoryFormData.image}
                    onImageChange={(url) => setCategoryFormData({ ...categoryFormData, image: url })}
                    folder="categories"
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsCategoryModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Subcategory Modal */}
        {isSubcategoryModalOpen && (
          <div className="modal-overlay" onClick={() => setIsSubcategoryModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}</h2>
                <button className="close-btn" onClick={() => setIsSubcategoryModalOpen(false)}>×</button>
              </div>
              <form onSubmit={editingSubcategory ? handleUpdateSubcategory : handleAddSubcategory}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Subcategory Name *</label>
                    <input
                      type="text"
                      required
                      value={subcategoryFormData.name}
                      onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
                      placeholder="e.g. T-Shirts"
                    />
                  </div>
                  <div className="form-group">
                    <label>Slug</label>
                    <input
                      type="text"
                      value={subcategoryFormData.slug}
                      onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, slug: e.target.value })}
                      placeholder="Auto-generated if empty (e.g. t-shirts)"
                    />
                  </div>
                  <SingleImageUploader
                    label="Subcategory Image"
                    currentImage={subcategoryFormData.image}
                    onImageChange={(url) => setSubcategoryFormData({ ...subcategoryFormData, image: url })}
                    folder="subcategories"
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsSubcategoryModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {editingSubcategory ? 'Update Subcategory' : 'Create Subcategory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Free Subcategory Modal */}
        {isAssignModalOpen && assigningSubcategory && (
          <div className="modal-overlay" onClick={() => setIsAssignModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Assign Subcategory to Category</h2>
                <button className="close-btn" onClick={() => setIsAssignModalOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Subcategory: <strong>{assigningSubcategory.name}</strong></label>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Originally from: {assigningSubcategory.originalCategoryName}
                  </p>
                </div>
                <div className="form-group">
                  <label>Select Category *</label>
                  <select
                    className="form-select"
                    id="assignCategorySelect"
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="">-- Select a Category --</option>
                    {categories.filter(cat => cat.isActive !== false).map(cat => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name} ({cat.slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={async () => {
                    const select = document.getElementById('assignCategorySelect');
                    const categorySlug = select?.value;
                    if (categorySlug) {
                      await handleAssignFreeSubcategory(assigningSubcategory._id, categorySlug);
                    }
                  }}
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default ProductCategoryManagement;
