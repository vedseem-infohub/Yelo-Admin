import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/Layout/AdminLayout';
import { ordersAPI, vendorsAPI, productsAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
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
      // Optimize: Reduce product limit for dashboard (only need count, not all products)
      const [ordersRes, vendorsRes, productsRes] = await Promise.allSettled([
        ordersAPI.getAllAdmin({ limit: 100 }),
        vendorsAPI.getAll(),
        productsAPI.getAll({ limit: 50, isActive: true }) // Reduced limit - only need active product count
      ]);

      // Handle orders response
      let orders = [];
      if (ordersRes.status === 'fulfilled' && ordersRes.value) {
        const ordersData = ordersRes.value;
        // Handle different response structures
        const ordersList = ordersData?.data || ordersData || [];
        orders = Array.isArray(ordersList) ? ordersList : [];
      } else {
        console.error('Failed to fetch orders:', ordersRes.reason);
      }
      
      // Sort orders by date (newest first)
      orders = orders.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.orderDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.orderDate || 0).getTime();
        return dateB - dateA; // Newest first
      });
      // Handle vendors response
      let vendors = [];
      if (vendorsRes.status === 'fulfilled' && vendorsRes.value) {
        const vendorsData = vendorsRes.value;
        vendors = vendorsData?.data || vendorsData || [];
        vendors = Array.isArray(vendors) ? vendors : [];
      } else {
        console.error('Failed to fetch vendors:', vendorsRes.reason);
      }

      // Handle products response
      let products = [];
      if (productsRes.status === 'fulfilled' && productsRes.value) {
        const productsData = productsRes.value;
        products = productsData?.data || productsData || [];
        products = Array.isArray(products) ? products : [];
      } else {
        console.error('Failed to fetch products:', productsRes.reason);
      }
      
      // Calculate stats
      const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.totalAmount || o.amount || 0)), 0);
      const totalOrders = orders.length;
      const activeVendors = vendors.filter(v => v.status === 'APPROVED' || v.status === 'Active' || v.status === 'ACTIVE').length;
      const activeProducts = products.filter(p => p.isActive !== false).length;
      
      // Format revenue
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

      // Get recent 5 orders (already sorted by date)
      const recent = orders.slice(0, 5).map(order => {
        const user = order.userId || {};
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
        const timeAgo = getTimeAgo(orderDate);
        
        // Format customer name
        const customerName = user.name || user.fullName || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown');
        
        // Format total amount
        const totalAmount = parseFloat(order.totalAmount || order.amount || 0);
        const formattedTotal = totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
        
        return {
          id: `#${(order._id || order.orderId || order.id || '').toString().substring(0, 8).toUpperCase()}`,
          customer: customerName,
          items: order.items?.length || 0,
          total: `₹${formattedTotal}`,
          status: (order.orderStatus || order.status || 'PENDING').toUpperCase(),
          time: timeAgo
        };
      });
      setRecentOrders(recent);

      // Generate activities from recent data
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
        const user = recentOrder.userId || {};
        activities.push({
          action: 'New Order',
          details: `Order ${recentOrder._id?.toString().substring(0, 8) || 'N/A'} - ₹${recentOrder.totalAmount || 0} by ${user.name || 'Customer'}`,
          time: getTimeAgo(recentOrder.createdAt ? new Date(recentOrder.createdAt) : new Date()),
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

  const systemMetrics = [
    { label: 'System Status', value: 'Online', color: 'var(--success)', isText: true },
  ];

  return (
    <AdminLayout>
      <div className="dashboard-container">
        {/* Header */}
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
              <i className="filter-icon"></i> Export Report
            </button>
          </div>
        </div>

        {/* KPI Grid */}
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

        {/* Main Content Grid */}
        <div className="dashboard-main-grid">
          {/* Left Column */}
          <div className="main-col-left">
            {/* Recent Orders */}
            <div className="card orders-card">
              <div className="card-header">
                <h3>Recent Orders</h3>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate('/orders')}
                >
                  View All
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
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td>
                      </tr>
                    ) : recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No recent orders</td>
                      </tr>
                    ) : (
                      recentOrders.map((order, i) => (
                        <tr key={i}>
                          <td className="font-medium">{order.id}</td>
                          <td>{order.customer}</td>
                          <td>{order.total}</td>
                          <td>
                            <span className={`badge ${order.status === 'COMPLETED' || order.status === 'Completed' ? 'success' :
                                order.status === 'PROCESSING' || order.status === 'Processing' ? 'info' : 'warning'
                              }`}>
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

            {/* Performance Graph Placeholder - To be replaced by Charts later */}
            <div className="card chart-card">
              <div className="card-header">
                <h3>Revenue Growth</h3>
                <div className="chart-legend">
                  <span className="legend-item"><span className="dot primary"></span> This Year</span>
                  <span className="legend-item"><span className="dot secondary"></span> Last Year</span>
                </div>
              </div>
              <div className="chart-placeholder">
                <div className="chart-visual">
                  {/* CSS-only simple visualization for now */}
                  <div className="bar" style={{ height: '40%' }}></div>
                  <div className="bar" style={{ height: '65%' }}></div>
                  <div className="bar" style={{ height: '55%' }}></div>
                  <div className="bar" style={{ height: '80%' }}></div>
                  <div className="bar" style={{ height: '70%' }}></div>
                  <div className="bar active" style={{ height: '90%' }}></div>
                  <div className="bar" style={{ height: '60%' }}></div>
                </div>
                <div className="chart-labels">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="main-col-right">
            {/* System Status */}
            <div className="card system-card">
              <h3>System Health</h3>
              <div className="system-metrics">
                {systemMetrics.map((metric, i) => (
                  <div key={i} className="metric-item">
                    <div className="metric-info">
                      <span>{metric.label}</span>
                      <span className="metric-value">{metric.value}{!metric.isText && '%'}</span>
                    </div>
                    {!metric.isText && typeof metric.value === 'number' && (
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
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