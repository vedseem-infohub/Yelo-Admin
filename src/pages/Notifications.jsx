import React, { useState } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'order', title: 'New Order #1005', message: 'Received a new order from Mike Wilson for ₹80.', date: '2 mins ago', read: false },
    { id: 2, type: 'user', title: 'New User Registration', message: 'Alice Brown has just signed up.', date: '1 hour ago', read: false },
    { id: 3, type: 'system', title: 'System Backup', message: 'Daily backup completed successfully.', date: '3 hours ago', read: true },
    { id: 4, type: 'order', title: 'Order Shipped', message: 'Order #1002 belonging to Jane Smith has been shipped.', date: 'Yesterday', read: true },
    { id: 5, type: 'alert', title: 'Low Stock Alert', message: 'Product "Summer Dress" is running low on stock.', date: 'Yesterday', read: true },
  ]);

  const [filter, setFilter] = useState('all');

  const markRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotif = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  }

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'order': return '📦';
      case 'user': return '👤';
      case 'alert': return '⚠️';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  return (
    <AdminLayout>
      <div className="notifications-page">

        <div className="notifications-header">
          <div>
            <h1>Notifications</h1>
            <p className="text-muted">Stay updated with system activities.</p>
          </div>
          <button className="btn btn-sm btn-outline" onClick={markAllRead}>Mark All Read</button>
        </div>

        <div className="notifications-container">

          {/* Sidebar */}
          <div className="notifications-sidebar">
            <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Notifications</button>
            <button className={`filter-btn ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>Unread</button>
            <div style={{ margin: '10px 0', height: '1px', background: '#eee' }}></div>
            <button className={`filter-btn ${filter === 'order' ? 'active' : ''}`} onClick={() => setFilter('order')}>Orders</button>
            <button className={`filter-btn ${filter === 'user' ? 'active' : ''}`} onClick={() => setFilter('user')}>Users</button>
            <button className={`filter-btn ${filter === 'system' ? 'active' : ''}`} onClick={() => setFilter('system')}>System</button>
            <button className={`filter-btn ${filter === 'alert' ? 'active' : ''}`} onClick={() => setFilter('alert')}>Alerts</button>
          </div>

          {/* List */}
          <div className="notifications-list">
            {filteredNotifs.length === 0 && (
              <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                No notifications found.
              </div>
            )}
            {filteredNotifs.map(n => (
              <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`}>
                <div className="notif-icon-frame">
                  {getIcon(n.type)}
                </div>
                <div className="notif-content">
                  <div className="notif-header">
                    <span className="notif-title">{n.title}</span>
                    <span className="notif-time">{n.date}</span>
                  </div>
                  <div className="notif-body">
                    {n.message}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {!n.read && (
                      <button className="mark-read-btn" onClick={() => markRead(n.id)}>Mark as read</button>
                    )}
                    <button className="mark-read-btn" onClick={() => deleteNotif(n.id)} style={{ color: '#e74c3c' }}>Dismiss</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}

export default Notifications;
