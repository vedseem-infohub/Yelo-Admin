
import React, { useState } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import './DiscountsCoupons.css';

function DiscountsCoupons() {
  const [coupons, setCoupons] = useState([
    { id: 1, code: 'WELCOME10', discount: '10%', status: 'Active', description: 'First order discount', expiry: '2025-12-31' },
    { id: 2, code: 'SALE20', discount: '20%', status: 'Inactive', description: 'Holiday sale', expiry: '2025-12-25' },
    { id: 3, code: 'FREESHIP', discount: '100%', status: 'Active', description: 'Free shipping on orders > $50', expiry: '2024-11-01' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', discount: '', status: 'Active', description: '', expiry: '' });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [showExpired, setShowExpired] = useState(false);

  // Stats
  const activeCount = coupons.filter(c => c.status === 'Active').length;
  const expiredCount = coupons.filter(c => new Date(c.expiry) < new Date()).length;

  const isExpired = (expiry) => {
    if (!expiry) return false;
    return new Date(expiry) < new Date();
  };

  const handleEdit = (coupon) => {
    setForm(coupon);
    setEditingId(coupon.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this coupon?')) {
      setCoupons(coupons.filter(c => c.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setCoupons(coupons.map(c => c.id === editingId ? { ...form, id: editingId } : c));
    } else {
      setCoupons([...coupons, { ...form, id: Date.now() }]);
    }
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ code: '', discount: '', status: 'Active', description: '', expiry: '' });
  };

  const filteredCoupons = coupons.filter(c =>
    (c.code.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())) &&
    (showExpired || !isExpired(c.expiry))
  );

  return (
    <AdminLayout>
      <div className="discounts-page">
        {/* Header */}
        <div className="discounts-header">
          <div>
            <h1>Discounts & Coupons</h1>
            <p className="text-muted">Manage promotional codes and offers.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add New Coupon</button>
        </div>

        {/* Stats */}
        <div className="discounts-stats">
          <div className="stat-card">
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Active Coupons</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{expiredCount}</div>
            <div className="stat-label">Expired Coupons</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">1,245</div>
            <div className="stat-label">Total Redemptions</div>
          </div>
        </div>

        {/* Controls */}
        <div className="discounts-controls">
          <div className="search-wrapper">
            <span>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search coupons..." />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
            <input type="checkbox" checked={showExpired} onChange={e => setShowExpired(e.target.checked)} />
            Show Expired
          </label>
        </div>

        {/* Table */}
        <div className="card table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Description</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map(c => (
                <tr key={c.id} style={{ opacity: isExpired(c.expiry) ? 0.6 : 1 }}>
                  <td><span className="code-badge">{c.code}</span></td>
                  <td style={{ fontWeight: 600 }}>{c.discount}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{c.description}</td>
                  <td>
                    <span className={isExpired(c.expiry) ? 'coupon-expiry expired' : ''}>
                      {c.expiry}
                    </span>
                  </td>
                  <td>
                    <span className={`coupon-status ${c.status.toLowerCase()}`}>{c.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => handleEdit(c)}>Edit</button>
                      <button className="btn btn-sm btn-danger-outline" onClick={() => handleDelete(c.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="add-coupon-modal-overlay" onClick={closeModal}>
            <div className="add-coupon-modal" onClick={e => e.stopPropagation()}>
              <h2>{editingId ? 'Edit Coupon' : 'Create New Coupon'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Coupon Code</label>
                  <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER50" />
                </div>
                <div className="form-group">
                  <label>Discount Value</label>
                  <input required value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} placeholder="e.g. 20% or $10" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input type="date" required value={form.expiry} onChange={e => setForm({ ...form, expiry: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create Coupon'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

export default DiscountsCoupons;
