import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/Layout/AdminLayout';
import { ordersAPI, vendorsAPI, productsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [timeRange, setTimeRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders, vendors, products in parallel
      const [ordersRes, vendorsRes, productsRes] = await Promise.allSettled([
        ordersAPI.getAllAdmin({ limit: 100 }),
        vendorsAPI.getAll(),
        productsAPI.getAll({ limit: 50, isActive: true })
      ]);

      // Handle orders response
      let orders = [];
      if (ordersRes.status === 'fulfilled' && ordersRes.value) {
        const ordersData = ordersRes.value;
        const ordersList = ordersData?.data || ordersData || [];
        orders = Array.isArray(ordersList) ? ordersList : [];
      }
      
      orders = orders.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.orderDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.orderDate || 0).getTime();
        return dateB - dateA;
      });

      // Handle vendors response
      let vendors = [];
      if (vendorsRes.status === 'fulfilled' && vendorsRes.value) {
        const vendorsData = vendorsRes.value;
        vendors = vendorsData?.data || vendorsData || [];
        vendors = Array.isArray(vendors) ? vendors : [];
      }

      // Handle products response
      let products = [];
      if (productsRes.status === 'fulfilled' && productsRes.value) {
        const productsData = productsRes.value;
        products = productsData?.data || productsData || [];
        products = Array.isArray(products) ? products : [];
      }
      
      const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.totalAmount || o.amount || 0)), 0);
      const totalOrders = orders.length;
      const activeVendors = vendors.filter(v => v.status === 'APPROVED' || v.status === 'Active' || v.status === 'ACTIVE').length;
      const activeProducts = products.filter(p => p.isActive !== false).length;
      
      const formatRevenue = (amount) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        return `₹${amount.toLocaleString('en-IN')}`;
      };

      setStats([
        {
          title: 'Total Revenue',
          value: formatRevenue(totalRevenue),
          change: '+0%',
          isPositive: true,
          icon: '💰',
          period: 'Total',
          color: 'var(--success)'
        },
        {
          title: 'Total Orders',
          value: totalOrders.toLocaleString('en-IN'),
          change: '+0%',
          isPositive: true,
          icon: '🛒',
          period: 'Total',
          color: 'var(--info)'
        },
        {
          title: 'Active Vendors',
          value: activeVendors.toString(),
          change: '+0%',
          isPositive: true,
          icon: '🏪',
          period: 'Total',
          color: 'var(--warning)'
        },
        {
          title: 'Active Products',
          value: activeProducts.toLocaleString('en-IN'),
          change: '+0%',
          isPositive: true,
          icon: '📦',
          period: 'Total',
          color: 'var(--primary)'
        },
      ]);

      const recent = orders.slice(0, 5).map(order => {
        const user = order.userId || {};
        const customerName = user.name || user.fullName || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown');
        const totalAmount = parseFloat(order.totalAmount || order.amount || 0);
        
        return {
          id: `#${(order._id || order.orderId || order.id || '').toString().substring(0, 8).toUpperCase()}`,
          customer: customerName,
          items: order.items?.length || 0,
          total: `₹${totalAmount.toLocaleString('en-IN')}`,
          status: (order.orderStatus || order.status || 'PENDING').toUpperCase(),
          time: getTimeAgo(new Date(order.createdAt || Date.now()))
        };
      });
      setRecentOrders(recent);

      const activities = [];
      if (vendors.length > 0) {
        const recentVendor = vendors[vendors.length - 1];
        activities.push({
          action: 'Vendor Activity',
          details: `${recentVendor.name || 'New vendor'} - ${recentVendor.status || 'Pending'}`,
          time: 'Recently',
          type: 'vendor'
        });
      }
      if (orders.length > 0) {
        const recentOrder = orders[0];
        activities.push({
          action: 'New Order',
          details: `Order ${recentOrder._id?.toString().substring(0, 8) || 'N/A'} - ₹${recentOrder.totalAmount || 0}`,
          time: getTimeAgo(new Date(recentOrder.createdAt || Date.now())),
          type: 'order'
        });
      }
      setRecentActivities(activities.slice(0, 5));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <AdminLayout>
      <div className="dashboard-container">
        <div className="dashboard-header-modern">
          <div>
            <h1>Command Center</h1>
            <p className="text-muted">Real-time overview of platform performance</p>
          </div>
          <div className="dashboard-actions">
            <select className="form-control" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button className="btn btn-primary">
              Export Report
            </button>
          </div>
        </div>

        <div className="kpi-grid">
          {stats.map((stat, index) => (
            <div key={index} className="card kpi-modern">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="kpi-content">
                <p className="kpi-label">{stat.title}</p>
                <h3 className="kpi-value">{stat.value}</h3>
                <div className="kpi-footer">
                  <span className={`kpi-change ${stat.isPositive ? 'positive' : 'negative'}`}>
                    {stat.change}
                  </span>
                  <span className="kpi-period">vs {stat.period}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-main-grid">
          <div className="main-col-left">
            <div className="card orders-card">
              <div className="card-header">
                <h3>Recent Orders</h3>
                <button 
                  className={`btn btn-outline btn-sm ${!isAdmin ? 'locked-btn' : ''}`}
                  onClick={() => isAdmin && navigate('/orders')}
                  disabled={!isAdmin}
                >
                  View All {!isAdmin && '🔒'}
                </button>
              </div>
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                    ) : recentOrders.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No recent orders</td></tr>
                    ) : (
                      recentOrders.map((order, i) => (
                        <tr key={i}>
                          <td className="font-medium">{order.id}</td>
                          <td>{order.customer}</td>
                          <td>{order.total}</td>
                          <td>
                            <span className={`badge ${order.status === 'COMPLETED' ? 'success' : 'warning'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="text-muted text-sm">{order.time}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="main-col-right">
            <div className="card activity-card">
              <h3>Recent Activity</h3>
              <div className="activity-feed">
                {recentActivities.map((activity, i) => (
                  <div key={i} className="activity-item">
                    <div className={`activity-dot ${activity.type}`}></div>
                    <div className="activity-content-wrapper">
                      <p className="activity-action">{activity.action}</p>
                      <p className="activity-desc">{activity.details}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Dashboard;