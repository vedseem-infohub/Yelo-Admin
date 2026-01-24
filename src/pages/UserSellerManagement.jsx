
import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import { userAdminAPI } from '../services/api';
import './UserSellerManagement.css';

function UserSellerManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ name: '', role: 'User', email: '', phone: '', status: 'Active', password: '' });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const [showPassword, setShowPassword] = useState(false)

  const mapToUI = (apiUser) => ({
    id: apiUser._id,
    name: apiUser.full_name,
    email: apiUser.email,
    phone: apiUser.phone,
    role: apiUser.role.charAt(0).toUpperCase() + apiUser.role.slice(1),
    status: apiUser.is_active ? 'Active' : 'Inactive',
    joined: apiUser.createdAt ? new Date(apiUser.createdAt).toISOString().split('T')[0] : 'N/A'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userAdminAPI.getAll();
      setUsers(data.map(mapToUI));
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Form Handling
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const openModal = (user = null) => {
    if (user) {
      setForm({ ...user, password: '' }); // Don't show password in edit
      setEditingId(user.id);
    } else {
      setForm({ name: '', role: 'User', email: '', phone: '', status: 'Active', password: '' });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ name: '', role: 'User', email: '', phone: '', status: 'Active', password: '' });
    setEditingId(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      full_name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role.toLowerCase(),
      is_active: form.status === 'Active',
      password: form.password
    };

    try {
      if (editingId) {
        if (!payload.password) delete payload.password; // Don't update password if empty
        await userAdminAPI.update(editingId, payload);
      } else {
        await userAdminAPI.create(payload);
      }
      fetchUsers();
      closeModal();
    } catch (err) {
      alert('Error saving user: ' + err.message);
    }
  };

  const handleDelete = async id => {
    if (window.confirm('Delete this user?')) {
      try {
        await userAdminAPI.delete(id);
        fetchUsers();
      } catch (err) {
        alert('Error deleting user');
      }
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      await userAdminAPI.update(id, { is_active: currentStatus !== 'Active' });
      fetchUsers();
    } catch (err) {
      alert('Error updating status');
    }
  };

  // Selection Logic
  const handleSelect = id => {
    setSelected(selected.includes(id) ? selected.filter(sid => sid !== id) : [...selected, id]);
  };

  const handleSelectAll = e => {
    if (e.target.checked) {
      setSelected(filteredUsers.map(u => u.id));
    } else {
      setSelected([]);
    }
  };

  // Filter Logic
  const filteredUsers = users.filter(u =>
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter === 'all' || u.role === roleFilter) &&
    (statusFilter === 'all' || u.status === statusFilter)
  );

  // Statistics
  const totalUsers = users.length;
  const totalSellers = users.filter(u => u.role === 'Seller').length;
  const totalActive = users.filter(u => u.status === 'Active').length;
  const totalInactive = users.filter(u => u.status === 'Inactive').length;

  return (
    <AdminLayout>
      <div className="user-management-container">

        {/* Header */}
        <div className="management-header">
          <div>
            <h1>User & Seller Management</h1>
            <p className="text-muted">Manage all platform accounts and permissions.</p>
          </div>
          <button className="btn btn-primary" onClick={() => openModal()}>
            + Add New User
          </button>
        </div>

        {/* Stats */}
        <div className="user-stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalUsers}</div>
            <div className="stat-label">Total Accounts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalSellers}</div>
            <div className="stat-label">Verified Sellers</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">{totalActive}</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-value">{totalInactive}</div>
            <div className="stat-label">Inactive/Banned</div>
          </div>
        </div>

        {/* Controls */}
        <div className="controls-bar card">
          <div className="user-search-group">
            <span className="search-icon">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="search-input"
            />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="filter-select">
            <option value="all">All Roles</option>
            <option value="User">User</option>
            <option value="Seller">Seller</option>
            <option value="Admin">Admin</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="card table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input type="checkbox" checked={selected.length === filteredUsers.length && filteredUsers.length > 0} onChange={handleSelectAll} />
                </th>
                <th>User Identity</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Loading users...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'red' }}>{error}</td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td><input type="checkbox" checked={selected.includes(u.id)} onChange={() => handleSelect(u.id)} /></td>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-avatar">{u.name.charAt(0)}</div>
                        <div className="user-details">
                          <span className="user-name">{u.name}</span>
                          <span className="user-email">{u.email}</span>
                          <span className="user-phone" style={{ fontSize: '11px', color: 'gray' }}>{u.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${u.role.toLowerCase()}`}>{u.role}</span>
                    </td>
                    <td>{u.joined}</td>
                    <td>
                      <button
                        onClick={() => handleStatusToggle(u.id, u.status)}
                        className={`badge ${u.status === 'Active' ? 'success' : 'danger'}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        {u.status}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn edit" onClick={() => openModal(u)}>✏️</button>
                        <button className="icon-btn delete" onClick={() => handleDelete(u.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && filteredUsers.length === 0 && !error && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit User' : 'Add New User'}</h2>
                <button className="close-btn" onClick={closeModal}>&times;</button>
              </div>
              <div className="modal-body">
                <form id="userForm" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input name="name" className="form-control" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input name="email" type="email" className="form-control" value={form.email} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input name="phone" className="form-control" value={form.phone} onChange={handleChange} required />
                  </div>
                  {!editingId && (
                    <div className="form-group">
                      <label>Password</label>
                      <div className="input-with-icon">
                        <input 
                          name="password" 
                          type={showPassword ? "text" : "password"} 
                          className="form-control" 
                          value={form.password} 
                          onChange={handleChange} 
                          required 
                        />
                        <button 
                          type="button"
                          className="password-toggle-eye"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex="-1"
                        >
                          {showPassword ? '👁️‍🗨️' : '👁️'}
                        </button>
                      </div>
                    </div>
                  )}
                  {editingId && (
                    <div className="form-group">
                      <label>Password (Leave blank to keep current)</label>
                      <div className="input-with-icon">
                        <input 
                          name="password" 
                          type={showPassword ? "text" : "password"} 
                          className="form-control" 
                          value={form.password} 
                          onChange={handleChange} 
                        />
                        <button 
                          type="button"
                          className="password-toggle-eye"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex="-1"
                        >
                          {showPassword ? '👁️‍🗨️' : '👁️'}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Role</label>
                      <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                        <option>User</option>
                        <option>Seller</option>
                        <option>Admin</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" form="userForm" className="btn btn-primary">Save User</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

export default UserSellerManagement;
