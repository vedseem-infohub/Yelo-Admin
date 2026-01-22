
import React, { useState } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import './UserSellerManagement.css';

function UserSellerManagement() {
  const [users, setUsers] = useState([
    { id: 1, name: 'Alice Johnson', role: 'User', email: 'alice@example.com', status: 'Active', joined: '2023-10-15' },
    { id: 2, name: 'Bob Smith', role: 'Seller', email: 'bob.store@example.com', status: 'Inactive', joined: '2023-09-21' },
    { id: 3, name: 'Carol White', role: 'User', email: 'carol.w@example.com', status: 'Active', joined: '2023-11-02' },
    { id: 4, name: 'Dave Brown', role: 'Seller', email: 'dave.traders@example.com', status: 'Active', joined: '2023-08-14' },
    { id: 5, name: 'Eve Davis', role: 'Admin', email: 'eve.admin@example.com', status: 'Active', joined: '2023-01-10' },
  ]);

  const [form, setForm] = useState({ name: '', role: 'User', email: '', status: 'Active' });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState([]);

  // Form Handling
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const openModal = (user = null) => {
    if (user) {
      setForm(user);
      setEditingId(user.id);
    } else {
      setForm({ name: '', role: 'User', email: '', status: 'Active' });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ name: '', role: 'User', email: '', status: 'Active' });
    setEditingId(null);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (editingId) {
      setUsers(users.map(u => u.id === editingId ? { ...form, id: editingId, joined: u.joined } : u));
    } else {
      setUsers([...users, { ...form, id: Date.now(), joined: new Date().toISOString().split('T')[0] }]);
    }
    closeModal();
  };

  const handleDelete = id => {
    if (window.confirm('Delete this user?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleStatusToggle = id => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u));
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
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td><input type="checkbox" checked={selected.includes(u.id)} onChange={() => handleSelect(u.id)} /></td>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar">{u.name.charAt(0)}</div>
                      <div className="user-details">
                        <span className="user-name">{u.name}</span>
                        <span className="user-email">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${u.role.toLowerCase()}`}>{u.role}</span>
                  </td>
                  <td>{u.joined}</td>
                  <td>
                    <button
                      onClick={() => handleStatusToggle(u.id)}
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
              ))}
              {filteredUsers.length === 0 && (
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
