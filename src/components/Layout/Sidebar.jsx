import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ onOpenSuperAdmin, onOpenCommission }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
      </div>

      <ul>
        {/* Analytics Section */}
        <li className="sidebar-section">Analytics</li>
        <li>
          <NavLink to="/dashboard" className="nav-link">
            <i className="icon-dashboard"></i>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/analytics" className="nav-link">
            <i className="icon-analytics"></i>
            Analytics Dashboard
          </NavLink>
        </li>

        {/* User & Seller Management Section */}
        <li className="sidebar-section">User & Seller Management</li>
        <li>
          <NavLink to="/user-seller-management" className="nav-link">
            <i className="icon-users"></i>
            User & Seller Management
          </NavLink>
        </li>

        {/* Product & Category Management Section */}
        <li className="sidebar-section">Product & Category Management</li>
        <li>
          <NavLink to="/product-category-management" className="nav-link">
            <i className="icon-products"></i>
            Product & Category Management
          </NavLink>
        </li>
        <li>
          <NavLink to="/products" className="nav-link">
            <i className="icon-products"></i>
            Products
          </NavLink>
        </li>
        <li>
          <NavLink to="/vendors" className="nav-link">
            <i className="icon-vendors"></i>
            Vendor List
          </NavLink>
        </li>
        <li>
          <NavLink to="/shops" className="nav-link">
            <i className="icon-products"></i>
            Shops
          </NavLink>
        </li>
        <li>
          <NavLink to="/category-sync" className="nav-link">
            <i className="icon-products"></i>
            Category Sync
          </NavLink>
        </li>


        {/* Order & Transaction Monitoring Section */}
        <li className="sidebar-section">Order & Transaction Monitoring</li>
        <li>
          <NavLink to="/order-transaction-monitoring" className="nav-link">
            <i className="icon-orders"></i>
            Order & Transaction Monitoring
          </NavLink>
        </li>
        <li>
          <NavLink to="/orders" className="nav-link">
            <i className="icon-orders"></i>
            Orders
          </NavLink>
        </li>
        <li>
          <NavLink to="/delivery-boys" className="nav-link">
            <i className="icon-vendors" style={{ filter: 'hue-rotate(45deg)' }}></i> {/* Reusing vendor icon with hue shift for quick distinction */}
            Delivery Partners
          </NavLink>
        </li>

        {/* Discounts & Coupons Section */}
        <li className="sidebar-section">Discounts & Coupons</li>
        <li>
          <NavLink to="/discounts-coupons" className="nav-link">
            <i className="icon-discount"></i>
            Discounts & Coupons
          </NavLink>
        </li>

        {/* Notifications Section */}
        <li className="sidebar-section">Notifications</li>
        <li>
          <NavLink to="/notifications" className="nav-link">
            <i className="icon-notification"></i>
            Notifications
          </NavLink>
        </li>

        {/* Super Admin & Settings Section */}
        <li className="sidebar-section">Super Admin & Settings</li>
        <li>
          <div className="nav-link" onClick={onOpenSuperAdmin}>
            <i className="icon-dashboard"></i>
            Super Admin Actions
          </div>
        </li>
        <li>
          <NavLink to="/super-admin" className="nav-link">
            <i className="icon-settings"></i>
            Super Admin Panel
          </NavLink>
        </li>
        <li>
          <div className="nav-link" onClick={onOpenCommission}>
            <i className="icon-vendors"></i>
            Commission Management
          </div>
        </li>
        <li>
          <NavLink to="/settings" className="nav-link">
            <i className="icon-settings"></i>
            Settings
          </NavLink>
        </li>
      </ul>

    </div>
  );
}

export default Sidebar;