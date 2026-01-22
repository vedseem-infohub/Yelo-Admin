import React, { useState } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import './AnalyticsDashboard.css';

function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('month');

  // KPIS
  const kpis = [
    { title: 'Total Revenue', value: '₹4,50,200', change: '+12%', isPositive: true },
    { title: 'Orders', value: '3,200', change: '+8%', isPositive: true },
    { title: 'Avg Order Value', value: '₹1,400', change: '-2%', isPositive: false },
    { title: 'New Customers', value: '450', change: '+15%', isPositive: true },
  ];

  // Mock Data for Charts
  const revenueData = [
    { label: 'Jan', value: 40, display: '₹40k' },
    { label: 'Feb', value: 30, display: '₹30k' },
    { label: 'Mar', value: 60, display: '₹60k' },
    { label: 'Apr', value: 55, display: '₹55k' },
    { label: 'May', value: 80, display: '₹80k' },
    { label: 'Jun', value: 95, display: '₹95k' },
    { label: 'Jul', value: 70, display: '₹70k' },
  ];

  return (
    <AdminLayout>
      <div className="analytics-container">

        {/* Header */}
        <div className="analytics-header">
          <div>
            <h1>Analytics Overview</h1>
            <p className="text-muted">In-depth insights into platform performance.</p>
          </div>
          <div className="analytics-controls">
            <select className="form-control" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <button className="btn btn-outline">
              Export Data
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="analytics-kpi-grid">
          {kpis.map((kpi, i) => (
            <div key={i} className="kpi-card">
              <div className="stat-content">
                <h3>{kpi.title}</h3>
                <p className="stat-value">{kpi.value}</p>
                <span className={`badge ${kpi.isPositive ? 'success' : 'danger'}`}>
                  {kpi.change} vs last period
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="charts-grid">

          {/* Bar Chart - Revenue Trend */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Revenue Trend</h3>
              <div className="chart-period-selector">
                <button className="period-btn active">6M</button>
                <button className="period-btn">1Y</button>
              </div>
            </div>
            <div className="analytics-chart-container">
              {revenueData.map((d, i) => (
                <div key={i} className="chart-bar-group">
                  <div
                    className="chart-bar"
                    style={{ height: `${d.value}%` }}
                    data-value={d.display}
                  ></div>
                  <span className="chart-label">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut Chart - Category Distribution */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Sales by Category</h3>
            </div>
            <div className="donut-chart-container">
              <div className="donut-chart">
                <div className="donut-center">
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>100%</span>
                  <span className="text-muted">Distribution</span>
                </div>
              </div>
            </div>
            <div className="donut-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ background: 'var(--primary)' }}></div>
                <span>Men (33%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: 'var(--success)' }}></div>
                <span>Women (33%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: 'var(--info)' }}></div>
                <span>Kids (17%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: 'var(--warning)' }}></div>
                <span>Access (17%)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}

export default AnalyticsDashboard;
