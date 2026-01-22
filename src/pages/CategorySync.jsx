import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import { categoriesAPI, productsAPI } from '../services/api';
import './CategorySync.css';

function CategorySync() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [newCategories, setNewCategories] = useState([]);
  const [newSubcategories, setNewSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkForNewCategories();
  }, []);

  const checkForNewCategories = async () => {
    try {
      setChecking(true);
      
      // Get all categories from backend
      const categoriesResponse = await categoriesAPI.getAll();
      const existingCategories = categoriesResponse.data || [];
      setCategories(existingCategories);
      
      // Get all products
      const productsResponse = await productsAPI.getAll({ limit: 1000, isActive: true });
      const productsData = productsResponse.data || [];
      setProducts(productsData);
      
      // Extract unique categories from products
      const productCategories = [...new Set(productsData.map(p => p.category).filter(Boolean))];
      
      // Find new categories
      const existingCategorySlugs = existingCategories.map(c => c.slug);
      const newCats = productCategories.filter(cat => {
        const slug = cat.toLowerCase().replace(/\s+/g, '-');
        return !existingCategorySlugs.includes(slug);
      });
      
      setNewCategories(newCats);
      
      // Find new subcategories
      const newSubcats = [];
      existingCategories.forEach(cat => {
        const catProducts = productsData.filter(p => p.category === cat.name);
        const productTypes = [...new Set(catProducts.map(p => p.productType).filter(Boolean))];
        
        productTypes.forEach(pt => {
          const subcatSlug = pt.toLowerCase().replace(/\s+/g, '-');
          const exists = cat.subcategories?.some(s => s.slug === subcatSlug);
          if (!exists) {
            newSubcats.push({
              categorySlug: cat.slug,
              categoryName: cat.name,
              subcategoryName: pt,
              subcategorySlug: subcatSlug
            });
          }
        });
      });
      
      setNewSubcategories(newSubcats);
    } catch (err) {
      alert('Error checking for new categories: ' + err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  const handleCreateCategory = async (categoryName) => {
    try {
      const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
      await categoriesAPI.create({
        name: categoryName,
        slug: slug
      });
      await checkForNewCategories();
      alert('Category created successfully!');
    } catch (err) {
      alert('Error creating category: ' + err.message);
    }
  };

  const handleCreateSubcategory = async (categorySlug, subcategoryName) => {
    try {
      const slug = subcategoryName.toLowerCase().replace(/\s+/g, '-');
      await categoriesAPI.addSubcategory(categorySlug, {
        name: subcategoryName,
        slug: slug
      });
      await checkForNewCategories();
      alert('Subcategory created successfully!');
    } catch (err) {
      alert('Error creating subcategory: ' + err.message);
    }
  };

  const handleCreateAllCategories = async () => {
    if (window.confirm(`Create all ${newCategories.length} new categories?`)) {
      try {
        await Promise.all(newCategories.map(cat => {
          const slug = cat.toLowerCase().replace(/\s+/g, '-');
          return categoriesAPI.create({ name: cat, slug });
        }));
        await checkForNewCategories();
        alert('All categories created successfully!');
      } catch (err) {
        alert('Error creating categories: ' + err.message);
      }
    }
  };

  const handleCreateAllSubcategories = async () => {
    if (window.confirm(`Create all ${newSubcategories.length} new subcategories?`)) {
      try {
        await Promise.all(newSubcategories.map(sub => {
          const slug = sub.subcategoryName.toLowerCase().replace(/\s+/g, '-');
          return categoriesAPI.addSubcategory(sub.categorySlug, {
            name: sub.subcategoryName,
            slug: slug
          });
        }));
        await checkForNewCategories();
        alert('All subcategories created successfully!');
      } catch (err) {
        alert('Error creating subcategories: ' + err.message);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="category-sync-container">
        <div className="page-header">
          <div>
            <h1>Category & Subcategory Sync</h1>
            <p className="text-muted">Detect and create missing categories and subcategories from products</p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={checkForNewCategories}
            disabled={checking}
          >
            {checking ? 'Checking...' : 'Refresh Check'}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <>
            {/* New Categories Section */}
            {newCategories.length > 0 && (
              <div className="sync-section card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2>New Categories Found ({newCategories.length})</h2>
                  <button className="btn btn-sm btn-success" onClick={handleCreateAllCategories}>
                    Create All
                  </button>
                </div>
                <div className="sync-list">
                  {newCategories.map((cat, idx) => (
                    <div key={idx} className="sync-item">
                      <div>
                        <strong>{cat}</strong>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          Slug: {cat.toLowerCase().replace(/\s+/g, '-')}
                        </div>
                      </div>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleCreateCategory(cat)}
                      >
                        Create
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Subcategories Section */}
            {newSubcategories.length > 0 && (
              <div className="sync-section card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2>New Subcategories Found ({newSubcategories.length})</h2>
                  <button className="btn btn-sm btn-success" onClick={handleCreateAllSubcategories}>
                    Create All
                  </button>
                </div>
                <div className="sync-list">
                  {newSubcategories.map((sub, idx) => (
                    <div key={idx} className="sync-item">
                      <div>
                        <strong>{sub.categoryName}</strong> → <span>{sub.subcategoryName}</span>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          Slug: {sub.subcategorySlug}
                        </div>
                      </div>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleCreateSubcategory(sub.categorySlug, sub.subcategoryName)}
                      >
                        Create
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Synced Message */}
            {newCategories.length === 0 && newSubcategories.length === 0 && (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
                <h3>All Synced!</h3>
                <p style={{ color: '#666', marginTop: '10px' }}>
                  No new categories or subcategories found. Everything is up to date!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default CategorySync;

