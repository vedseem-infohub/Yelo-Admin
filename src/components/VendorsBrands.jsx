import React, { useState } from 'react';
import AdminLayout from './Layout/AdminLayout';
import './VendorsBrands.css';

function VendorsBrands() {
  // Mock data for vendors/brands
  const [vendors, setVendors] = useState([
    { id: 1, name: 'Nike', category: 'Sportswear', contact: 'John Doe', status: 'Active', products: 150 },
    { id: 2, name: 'Adidas', category: 'Athletic Wear', contact: 'Jane Smith', status: 'Active', products: 200 },
    { id: 3, name: 'Zara', category: 'Fashion', contact: 'Bob Johnson', status: 'Inactive', products: 300 },
    { id: 4, name: 'H&M', category: 'Fast Fashion', contact: 'Alice Brown', status: 'Active', products: 500 },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '', category: '', contact: '', status: 'Active', products: '' });

  const handleAddVendor = () => {
    if (newVendor.name && newVendor.category && newVendor.contact) {
      setVendors([...vendors, { ...newVendor, id: vendors.length + 1 }]);
      setNewVendor({ name: '', category: '', contact: '', status: 'Active', products: '' });
      setShowAddForm(false);
    }
  };

  const handleDeleteVendor = (id) => {
    setVendors(vendors.filter(vendor => vendor.id !== id));
  };

  return (
    <AdminLayout>
      <div className="vendors-brands">
      <div className="vendors-header">
        <h1>Vendors/Brands Management</h1>
        <button className="add-vendor-btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add New Vendor/Brand'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-vendor-form">
          <h2>Add New Vendor/Brand</h2>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Brand Name"
              value={newVendor.name}
              onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
            />
            <input
              type="text"
              placeholder="Category"
              value={newVendor.category}
              onChange={(e) => setNewVendor({...newVendor, category: e.target.value})}
            />
            <input
              type="text"
              placeholder="Contact Person"
              value={newVendor.contact}
              onChange={(e) => setNewVendor({...newVendor, contact: e.target.value})}
            />
            <select
              value={newVendor.status}
              onChange={(e) => setNewVendor({...newVendor, status: e.target.value})}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <input
              type="number"
              placeholder="Number of Products"
              value={newVendor.products}
              onChange={(e) => setNewVendor({...newVendor, products: e.target.value})}
            />
          </div>
          <button className="submit-btn" onClick={handleAddVendor}>Add Vendor/Brand</button>
        </div>
      )}

      <div className="vendors-stats">
        <div className="stat-item">
          <h3>Total Vendors</h3>
          <p>{vendors.length}</p>
        </div>
        <div className="stat-item">
          <h3>Active Vendors</h3>
          <p>{vendors.filter(vendor => vendor.status === 'Active').length}</p>
        </div>
        <div className="stat-item">
          <h3>Total Products</h3>
          <p>{vendors.reduce((sum, vendor) => sum + parseInt(vendor.products || 0), 0)}</p>
        </div>
      </div>

      <div className="vendors-table">
        <div className="table-header">
          <div>Name</div>
          <div>Category</div>
          <div>Contact</div>
          <div>Status</div>
          <div>Products</div>
          <div>Actions</div>
        </div>
        {vendors.map((vendor) => (
          <div key={vendor.id} className="table-row">
            <div>{vendor.name}</div>
            <div>{vendor.category}</div>
            <div>{vendor.contact}</div>
            <div>
              <span className={`status ${vendor.status.toLowerCase()}`}>
                {vendor.status}
              </span>
            </div>
            <div>{vendor.products}</div>
            <div className="actions">
              <button className="edit-btn">Edit</button>
              <button className="delete-btn" onClick={() => handleDeleteVendor(vendor.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </AdminLayout>
  );
}

export default VendorsBrands;