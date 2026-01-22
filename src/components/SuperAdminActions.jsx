import React, { useState } from 'react';
import './SuperAdminActions.css';

function SuperAdminActions({ isOpen, onClose, inline = false }) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [showBulkUpdateForm, setShowBulkUpdateForm] = useState(false);
  const [showCommissionForm, setShowCommissionForm] = useState(false);
  const [recentActions, setRecentActions] = useState([]);

  const handleQuickAction = async (action) => {
    setLoadingAction(action);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Add to log
    const newLog = {
      action: action,
      time: new Date().toLocaleTimeString(),
      status: 'Success'
    };
    setRecentActions(prev => [newLog, ...prev]);

    switch (action) {
      case 'Bulk Product Update':
        setShowBulkUpdateForm(true);
        break;
      case 'Vendor Commission Management':
        setShowCommissionForm(true);
        break;
      default:
        // No alert needed, log is enough
        break;
    }

    setLoadingAction(null);
  };

  const handleBulkUpdate = async () => {
    setLoadingAction('Bulk Update Processing');
    await new Promise(resolve => setTimeout(resolve, 2000));

    setRecentActions(prev => [{
      action: 'Bulk Product Update (1,247 items)',
      time: new Date().toLocaleTimeString(),
      status: 'Success'
    }, ...prev]);

    setShowBulkUpdateForm(false);
    setLoadingAction(null);
  };

  const handleCommissionUpdate = async () => {
    setLoadingAction('Commission Update Processing');
    await new Promise(resolve => setTimeout(resolve, 2000));

    setRecentActions(prev => [{
      action: 'Commission Rates Updated',
      time: new Date().toLocaleTimeString(),
      status: 'Success'
    }, ...prev]);

    setShowCommissionForm(false);
    setLoadingAction(null);
  };

  if (!inline && !isOpen) return null;

  const actionsContent = (
    <>
      <div className="section-header">
        <h3>Available Actions</h3>
      </div>
      <div className="section-content">
        <div className="actions-grid">
          <button
            className="action-btn primary"
            onClick={() => handleQuickAction('Bulk Product Update')}
            disabled={loadingAction === 'Bulk Product Update'}
          >
            {loadingAction === 'Bulk Product Update' ? 'Processing...' : 'Bulk Product Update'}
          </button>
          <button
            className="action-btn primary"
            onClick={() => handleQuickAction('Vendor Commission Management')}
            disabled={loadingAction === 'Vendor Commission Management'}
          >
            {loadingAction === 'Vendor Commission Management' ? 'Processing...' : 'Commission Management'}
          </button>
          <button
            className="action-btn primary"
            onClick={() => handleQuickAction('System Backup')}
            disabled={loadingAction === 'System Backup'}
          >
            {loadingAction === 'System Backup' ? 'Backing up...' : 'System Backup'}
          </button>
          <button
            className="action-btn primary"
            onClick={() => handleQuickAction('User Management')}
            disabled={loadingAction === 'User Management'}
          >
            {loadingAction === 'User Management' ? 'Loading...' : 'User Management'}
          </button>
          <button
            className="action-btn secondary"
            onClick={() => handleQuickAction('Export Data')}
            disabled={loadingAction === 'Export Data'}
          >
            {loadingAction === 'Export Data' ? 'Exporting...' : 'Export Reports'}
          </button>
          <button
            className="action-btn secondary"
            onClick={() => handleQuickAction('Security Audit')}
            disabled={loadingAction === 'Security Audit'}
          >
            {loadingAction === 'Security Audit' ? 'Auditing...' : 'Security Audit'}
          </button>
          <button
            className="action-btn secondary"
            onClick={() => handleQuickAction('Performance Monitoring')}
            disabled={loadingAction === 'Performance Monitoring'}
          >
            {loadingAction === 'Performance Monitoring' ? 'Enabling...' : 'Performance Monitor'}
          </button>
          <button
            className="action-btn secondary"
            onClick={() => handleQuickAction('API Management')}
            disabled={loadingAction === 'API Management'}
          >
            {loadingAction === 'API Management' ? 'Loading...' : 'API Management'}
          </button>
        </div>

        {/* Activity Log Section */}
        <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <h4 style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '15px' }}>RECENT ACTIVITY LOG</h4>
          {recentActions.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>No actions performed in this session yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentActions.map((log, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '10px', background: '#f8f9fa', borderRadius: '6px', borderLeft: '3px solid var(--success)' }}>
                  <span style={{ fontWeight: 500, color: '#333' }}>{log.action}</span>
                  <span style={{ color: '#7f8c8d' }}>{log.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showBulkUpdateForm && (
        <BulkUpdateForm
          onSubmit={handleBulkUpdate}
          onCancel={() => setShowBulkUpdateForm(false)}
          isLoading={loadingAction === 'Bulk Update Processing'}
        />
      )}

      {showCommissionForm && (
        <CommissionForm
          onSubmit={handleCommissionUpdate}
          onCancel={() => setShowCommissionForm(false)}
          isLoading={loadingAction === 'Commission Update Processing'}
        />
      )}
    </>
  );

  if (inline) {
    return (
      <div className="superadmin-inline">
        <div className="modal-header">
          <h2>Super Admin Actions</h2>
        </div>
        <div className="modal-body">{actionsContent}</div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Super Admin Actions</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{actionsContent}</div>
      </div>
    </div>
  );
}

// Bulk Update Form Component
function BulkUpdateForm({ onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    operation: 'price_update',
    value: '',
    category: 'all',
    confirmAction: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="form-overlay">
      <div className="form-content">
        <h3>Bulk Product Update</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Operation Type:</label>
            <select
              value={formData.operation}
              onChange={(e) => setFormData({ ...formData, operation: e.target.value })}
              required
            >
              <option value="price_update">Update Prices</option>
              <option value="stock_update">Update Stock</option>
              <option value="status_update">Update Status</option>
              <option value="category_update">Update Category</option>
            </select>
          </div>

          <div className="form-group">
            <label>Value:</label>
            <input
              type="text"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="Enter value (e.g., +10%, 50, 'active')"
              required
            />
          </div>

          <div className="form-group">
            <label>Category:</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="all">All Products</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="home">Home & Garden</option>
              <option value="sports">Sports</option>
            </select>
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.confirmAction}
                onChange={(e) => setFormData({ ...formData, confirmAction: e.target.checked })}
                required
              />
              I confirm this bulk operation
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Execute Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Commission Management Form Component
function CommissionForm({ onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    commissionType: 'percentage',
    rate: '',
    vendorTier: 'all',
    effectiveDate: '',
    confirmAction: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="form-overlay">
      <div className="form-content">
        <h3>Vendor Commission Management</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Commission Type:</label>
            <select
              value={formData.commissionType}
              onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
              required
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
              <option value="tiered">Tiered Structure</option>
            </select>
          </div>

          <div className="form-group">
            <label>Rate/Value:</label>
            <input
              type="number"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              placeholder="Enter rate (e.g., 15 for 15%)"
              required
            />
          </div>

          <div className="form-group">
            <label>Vendor Tier:</label>
            <select
              value={formData.vendorTier}
              onChange={(e) => setFormData({ ...formData, vendorTier: e.target.value })}
            >
              <option value="all">All Vendors</option>
              <option value="premium">Premium Vendors</option>
              <option value="standard">Standard Vendors</option>
              <option value="new">New Vendors</option>
            </select>
          </div>

          <div className="form-group">
            <label>Effective Date:</label>
            <input
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.confirmAction}
                onChange={(e) => setFormData({ ...formData, confirmAction: e.target.checked })}
                required
              />
              I confirm these commission changes
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Commissions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SuperAdminActions;
