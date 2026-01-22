import React from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import SuperAdminActions from '../components/SuperAdminActions';
import './SuperAdminPanel.css';

function SuperAdminPanel() {
  return (
    <AdminLayout>
      <div className="super-admin-panel">
        <div className="panel-header">
          <h1>Super Admin Actions</h1>
          <p>Manage administrative functions and system-wide settings.</p>
        </div>

        <div className="super-admin-actions-section">
          <SuperAdminActions inline={true} isOpen={true} onClose={() => {}} />
        </div>
      </div>
    </AdminLayout>
  );
}

export default SuperAdminPanel;
