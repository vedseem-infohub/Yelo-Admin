import React, { useState } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import './DeliveryBoys.css';

function DeliveryBoys() {
    const [activeTab, setActiveTab] = useState('list');
    const [showModal, setShowModal] = useState(false);
    const [selectedBoy, setSelectedBoy] = useState(null);

    // Dummy Data
    const initialBoys = [
        { id: 1, name: 'Rahul Sharma', phone: '+91 98765 43210', zone: 'Jhansi', status: 'Active', deliveries: 145, rating: 4.8, earnings: '₹12,400', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul' },
        { id: 2, name: 'Vikram Singh', phone: '+91 87654 32109', zone: 'Jhansi', status: 'On Duty', deliveries: 89, rating: 4.5, earnings: '₹8,200', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram' },
        { id: 3, name: 'Amit Patel', phone: '+91 76543 21098', zone: 'Jhansi', status: 'Inactive', deliveries: 234, rating: 4.9, earnings: '₹18,900', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit' },
        { id: 4, name: 'Sunil Kumar', phone: '+91 65432 10987', zone: 'Jhansi', status: 'Active', deliveries: 56, rating: 4.2, earnings: '₹5,600', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sunil' },
    ];

    const [deliveryBoys, setDeliveryBoys] = useState(initialBoys);

    const handleEdit = (boy) => {
        setSelectedBoy(boy);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to remove this delivery partner?')) {
            setDeliveryBoys(deliveryBoys.filter(boy => boy.id !== id));
        }
    };

    const handleAddNew = () => {
        setSelectedBoy(null);
        setShowModal(true);
    };

    return (
        <AdminLayout>
            <div className="delivery-boys-container">
                <div className="page-header">
                    <div>
                        <h1>Delivery Partners</h1>
                        <p className="text-muted">Manage fleet, assign orders, and track performance.</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleAddNew}>
                        + Add New Partner
                    </button>
                </div>

                {/* Stats Row */}
                <div className="delivery-stats">
                    <div className="stat-card">
                        <div className="stat-icon info">🛵</div>
                        <div className="stat-info">
                            <h3>Total Partners</h3>
                            <p>24</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon success">✅</div>
                        <div className="stat-info">
                            <h3>Active Now</h3>
                            <p>18</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon warning">📦</div>
                        <div className="stat-info">
                            <h3>Orders in Transit</h3>
                            <p>42</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon danger">⚠️</div>
                        <div className="stat-info">
                            <h3>Issues Reported</h3>
                            <p>3</p>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="card">
                    <div className="card-header">
                        <div className="tabs">
                            <button
                                className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                                onClick={() => setActiveTab('list')}
                            >
                                All Partners
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('assignments')}
                            >
                                Live Assignments
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'payouts' ? 'active' : ''}`}
                                onClick={() => setActiveTab('payouts')}
                            >
                                Payouts
                            </button>
                        </div>
                        <div className="search-box">
                            <input type="text" placeholder="Search by name or zone..." className="form-control" />
                        </div>
                    </div>

                    <div className="card-body">
                        {activeTab === 'list' && (
                            <table className="modern-table delivery-table">
                                <thead>
                                    <tr>
                                        <th>Profile</th>
                                        <th>Name & Contact</th>
                                        <th>Zone</th>
                                        <th>Status</th>
                                        <th>Performance</th>
                                        <th>Earnings</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deliveryBoys.map((boy) => (
                                        <tr key={boy.id}>
                                            <td>
                                                <img src={boy.image} alt={boy.name} className="avatar" />
                                            </td>
                                            <td>
                                                <div className="boy-details">
                                                    <span className="boy-name">{boy.name}</span>
                                                    <span className="boy-phone">{boy.phone}</span>
                                                </div>
                                            </td>
                                            <td>{boy.zone}</td>
                                            <td>
                                                <span className={`badge ${boy.status === 'Active' ? 'success' :
                                                    boy.status === 'On Duty' ? 'info' : 'secondary'
                                                    }`}>
                                                    {boy.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="rating">
                                                    ⭐ {boy.rating} <span className="text-muted">({boy.deliveries} orders)</span>
                                                </div>
                                            </td>
                                            <td className="font-medium">{boy.earnings}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="icon-btn edit" onClick={() => handleEdit(boy)}>✏️</button>
                                                    <button className="icon-btn delete" onClick={() => handleDelete(boy.id)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab !== 'list' && (
                            <div className="empty-state">
                                <p>Module under development. Please check back later.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>{selectedBoy ? 'Edit Profile' : 'Add New Partner'}</h2>
                                <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <form>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" className="form-control" defaultValue={selectedBoy?.name} />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input type="text" className="form-control" defaultValue={selectedBoy?.phone} />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Zone</label>
                                            <select className="form-control" defaultValue={selectedBoy?.zone}>
                                                <option>Jhansi</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Status</label>
                                            <select className="form-control" defaultValue={selectedBoy?.status}>
                                                <option>Active</option>
                                                <option>Inactive</option>
                                                <option>On Duty</option>
                                            </select>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn btn-primary">Save Changes</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

export default DeliveryBoys;
