import React, { useState } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import './Settings.css';

function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    storeName: 'FashionHub Admin',
    storeEmail: 'admin@fashionhub.com',
    currency: 'USD',
    timezone: 'UTC-5',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    security: {
      twoFactor: true,
      sessionTimeout: '30m'
    }
  });

  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Admin User', role: 'Super Admin', status: 'Active', initials: 'AD', lastActive: 'Just now' },
    { id: 2, name: 'John Support', role: 'Support', status: 'Active', initials: 'JS', lastActive: '2 hours ago' }
  ]);

  const handleInvite = () => {
    const newMember = {
      id: Date.now(),
      name: 'New Member',
      role: 'Editor',
      status: 'Pending',
      initials: 'NM',
      lastActive: '-'
    };
    setTeamMembers([...teamMembers, newMember]);
  };

  const handleToggle = (category, field) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [field]: !settings[category][field]
      }
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="settings-panel">
            <div className="panel-section">
              <h2>General Information</h2>
              <p className="section-desc">Basic details about your store and admin panel.</p>
              <div className="settings-form-grid">
                <div className="form-group full-width">
                  <label>Store Name</label>
                  <input value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Support Email</label>
                  <input value={settings.storeEmail} onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Store Currency</label>
                  <select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Timezone</label>
                  <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}>
                    <option value="UTC">UTC</option>
                    <option value="UTC-5">EST (UTC-5)</option>
                    <option value="UTC+5:30">IST (UTC+5:30)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="settings-actions-bar">
              <button className="btn btn-primary">Save Changes</button>
              <button className="btn btn-outline">Discard</button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-panel">
            <div className="panel-section">
              <h2>Notification Preferences</h2>
              <p className="section-desc">Manage how you receive alerts and updates.</p>

              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Email Notifications</h4>
                  <p>Receive daily summaries and critical alerts via email.</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={settings.notifications.email} onChange={() => handleToggle('notifications', 'email')} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Push Notifications</h4>
                  <p>Browser alerts for real-time order updates.</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={settings.notifications.push} onChange={() => handleToggle('notifications', 'push')} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>SMS Alerts</h4>
                  <p>Get text messages for high-priority incidents.</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={settings.notifications.sms} onChange={() => handleToggle('notifications', 'sms')} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
            <div className="settings-actions-bar">
              <button className="btn btn-primary">Save Preferences</button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="settings-panel">
            <div className="panel-section">
              <h2>Security Settings</h2>
              <p className="section-desc">Protect your admin account and store data.</p>

              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Two-Factor Authentication (2FA)</h4>
                  <p>Require an OTP when logging in.</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={settings.security.twoFactor} onChange={() => handleToggle('security', 'twoFactor')} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Session Timeout</label>
                <select value={settings.security.sessionTimeout} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, sessionTimeout: e.target.value } })}>
                  <option value="15m">15 Minutes</option>
                  <option value="30m">30 Minutes</option>
                  <option value="1h">1 Hour</option>
                </select>
              </div>

              <div style={{ marginTop: '30px' }}>
                <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>Change Password</button>
              </div>
            </div>
          </div>
        );

      case 'admins':
        return (
          <div className="settings-panel">
            <div className="panel-section">
              <div className="settings-header-modern" style={{ marginBottom: '20px' }}>
                <div style={{ margin: 0 }}>
                  <h2>Team Members</h2>
                  <p className="section-desc">Manage admin access and roles.</p>
                </div>
                <button className="btn btn-primary" onClick={handleInvite}>+ Invite Member</button>
              </div>

              <table className="modern-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map(member => (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>{member.initials}</div>
                          <span style={{ fontWeight: 500 }}>{member.name}</span>
                        </div>
                      </td>
                      <td><span className={`badge ${member.role === 'Super Admin' ? 'info' : 'warning'}`}>{member.role}</span></td>
                      <td><span className={`badge ${member.status === 'Active' ? 'success' : 'warning'}`}>{member.status}</span></td>
                      <td>{member.lastActive}</td>
                      <td><button className="btn btn-sm btn-outline">Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="settings-page">
        <div className="settings-header-modern">
          <div>
            <h1>Settings</h1>
            <p className="text-muted">Manage store configuration and admin preferences.</p>
          </div>
        </div>

        <div className="settings-content-wrapper">
          <div className="settings-sidebar">
            <button className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
              ⚙️ General
            </button>
            <button className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
              🔔 Notifications
            </button>
            <button className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
              🔒 Security
            </button>
            <button className={`settings-tab-btn ${activeTab === 'admins' ? 'active' : ''}`} onClick={() => setActiveTab('admins')}>
              👥 Team Members
            </button>
          </div>

          {renderContent()}
        </div>
      </div>
    </AdminLayout>
  );
}

export default Settings;
