import React, { useState } from 'react';
import Sidebar from './Sidebar';
import SuperAdminActions from '../SuperAdminActions';
import CommissionManagement from '../CommissionManagement';
import OrderNotificationToast from '../OrderNotificationToast';
import './Sidebar.css';

function AdminLayout({ children }) {
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);

  const openSuperAdminModal = () => setIsSuperAdminModalOpen(true);
  const closeSuperAdminModal = () => setIsSuperAdminModalOpen(false);

  const openCommissionModal = () => setIsCommissionModalOpen(true);
  const closeCommissionModal = () => setIsCommissionModalOpen(false);

  return (
    <div className="admin-layout">
      <Sidebar onOpenSuperAdmin={openSuperAdminModal} onOpenCommission={openCommissionModal} />
      <div className="content-area">
        {children}
      </div>
      <OrderNotificationToast />
      <SuperAdminActions isOpen={isSuperAdminModalOpen} onClose={closeSuperAdminModal} />
      <CommissionManagement isOpen={isCommissionModalOpen} onClose={closeCommissionModal} />
    </div>
  );
}

export default AdminLayout;