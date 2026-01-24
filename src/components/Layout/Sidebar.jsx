import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

function Sidebar({ onOpenSuperAdmin, onOpenCommission }) {
  const { role, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const ALLOWED_PATHS_FOR_USER = [
    '/product-category-management',
    '/products',
    '/vendors',
    '/shops',
    '/category-sync',
    '/discounts-coupons'
  ];

  const isAllowed = (path) => isAdmin || ALLOWED_PATHS_FOR_USER.includes(path);

  const renderNavLink = (to, iconClass, label) => {
    const allowed = isAllowed(to);
    if (!allowed) {
      return (
        <div className="nav-link locked" title="Admin access only">
          <i className={iconClass}></i>
          {label}
          <span className="lock-badge">🔒</span>
        </div>
      );
    }
    return (
      <NavLink to={to} className="nav-link">
        <i className={iconClass}></i>
        {label}
      </NavLink>
    );
  };

  const renderActionLink = (onClick, iconClass, label) => {
    if (!isAdmin) {
      return (
        <div className="nav-link locked" title="Admin access only">
          <i className={iconClass}></i>
          {label}
          <span className="lock-badge">🔒</span>
        </div>
      );
    }
    return (
      <div className="nav-link" onClick={onClick}>
        <i className={iconClass}></i>
        {label}
      </div>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
      </div>

      <ul>
        {/* Analytics Section */}
        <li className="sidebar-section">Analytics</li>
        <li>
          {renderNavLink('/dashboard', 'icon-dashboard', 'Dashboard')}
        </li>
        <li>
          {renderNavLink('/analytics', 'icon-analytics', 'Analytics Dashboard')}
        </li>

        {/* User & Seller Management Section */}
        <li className="sidebar-section">User & Seller Management</li>
        <li>
          {renderNavLink('/user-seller-management', 'icon-users', 'User & Seller Management')}
        </li>

        {/* Product & Category Management Section */}
        <li className="sidebar-section">Product & Category Management</li>
        <li>
          {renderNavLink('/product-category-management', 'icon-products', 'Product & Category Management')}
        </li>
        <li>
          {renderNavLink('/products', 'icon-products', 'Products')}
        </li>
        <li>
          {renderNavLink('/vendors', 'icon-vendors', 'Vendor List')}
        </li>
        <li>
          {renderNavLink('/shops', 'icon-products', 'Shops')}
        </li>
        <li>
          {renderNavLink('/category-sync', 'icon-products', 'Category Sync')}
        </li>


        {/* Order & Transaction Monitoring Section */}
        <li className="sidebar-section">Order & Transaction Monitoring</li>
        <li>
          {renderNavLink('/order-transaction-monitoring', 'icon-orders', 'Order & Transaction Monitoring')}
        </li>
        <li>
          {renderNavLink('/orders', 'icon-orders', 'Orders')}
        </li>
        <li>
          {renderNavLink('/delivery-boys', 'icon-vendors', 'Delivery Partners')}
        </li>

        {/* Discounts & Coupons Section */}
        <li className="sidebar-section">Discounts & Coupons</li>
        <li>
          {renderNavLink('/discounts-coupons', 'icon-discount', 'Discounts & Coupons')}
        </li>

        {/* Notifications Section */}
        <li className="sidebar-section">Notifications</li>
        <li>
          {renderNavLink('/notifications', 'icon-notification', 'Notifications')}
        </li>

        {/* Super Admin & Settings Section */}
        <li className="sidebar-section">Super Admin & Settings</li>
        <li>
          {renderActionLink(onOpenSuperAdmin, 'icon-dashboard', 'Super Admin Actions')}
        </li>
        <li>
          {renderNavLink('/super-admin', 'icon-settings', 'Super Admin Panel')}
        </li>
        <li>
          {renderActionLink(onOpenCommission, 'icon-vendors', 'Commission Management')}
        </li>
        <li>
          {renderNavLink('/settings', 'icon-settings', 'Settings')}
        </li>
        
        <li className="sidebar-section">Session</li>
        <li>
          <div className="nav-link logout-btn" onClick={handleLogout}>
            <i className="icon-logout">🚪</i>
            Logout
          </div>
        </li>
      </ul>

    </div>
  );
}

export default Sidebar;