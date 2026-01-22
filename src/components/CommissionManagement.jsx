import React, { useState, useEffect } from 'react';
import './CommissionManagement.css';

function CommissionManagement({ isOpen, onClose }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);
  const [showBulkCommissionForm, setShowBulkCommissionForm] = useState(false);
  const [showAnalyticsView, setShowAnalyticsView] = useState(false);
  const [showPaymentSchedule, setShowPaymentSchedule] = useState(false);
  const [commissionData, setCommissionData] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Initialize with realistic data
  useEffect(() => {
    if (isOpen) {
      loadCommissionData();
    }
  }, [isOpen]);

  const loadCommissionData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockCommissionData = {
        totalCommission: 245680,
        monthlyGrowth: 12.5,
        averageRate: 14.8,
        activeVendors: 47,
        paidThisMonth: 189450,
        pendingPayments: 56480,
        monthlyData: [
          { month: 'Aug', commission: 198450 },
          { month: 'Sep', commission: 215680 },
          { month: 'Oct', commission: 223450 },
          { month: 'Nov', commission: 234560 },
          { month: 'Dec', commission: 245680 }
        ]
      };

      const mockVendors = [
        { id: 'VNDR-001', name: 'Urban Wear Inc.', currentRate: 15, tier: 'premium', revenue: 12450, lastPayment: '2025-12-15' },
        { id: 'VNDR-002', name: 'Fashion Forward Ltd.', currentRate: 12, tier: 'premium', revenue: 18920, lastPayment: '2025-12-14' },
        { id: 'VNDR-003', name: 'Style Masters Co.', currentRate: 18, tier: 'standard', revenue: 8750, lastPayment: '2025-12-10' },
        { id: 'VNDR-004', name: 'Trendy Threads Inc.', currentRate: 14, tier: 'premium', revenue: 15680, lastPayment: '2025-12-16' },
        { id: 'VNDR-005', name: 'Elite Garments Ltd.', currentRate: 16, tier: 'premium', revenue: 22340, lastPayment: '2025-12-13' }
      ];

      setCommissionData(mockCommissionData);
      setVendors(mockVendors);
    } catch (error) {
      console.error('Failed to load commission data:', error);
      // We might not be able to showNotification if this is early, but we can try if it's rendered. 
      // Actually showNotification depends on state which is available.
      // But let's just use console for initial load failure or set a flag. 
      // If I use showNotification it might clear too fast or conflict.
      // Better: just console log for now, or use a specific error state in UI.
      // But requirement says "replace alert".
      showNotification('error', 'Failed to load commission data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommissionAction = async (action) => {
    setLoadingAction(action);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      switch (action) {
        case 'Bulk Commission Update':
          setShowBulkCommissionForm(true);
          break;
        case 'Commission Analytics':
          setShowAnalyticsView(true);
          break;
        case 'Payment Schedule':
          setShowPaymentSchedule(true);
          break;
        case 'Individual Vendor Update':
          showNotification('success', '✅ Individual vendor commission update completed successfully!');
          await loadCommissionData(); // Refresh data
          break;
        case 'Commission Report':
          await generateCommissionReport();
          break;
        case 'Payment Processing':
          await processPayments();
          break;
        default:
          showNotification('success', `Action "${action}" completed successfully!`);
      }
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
      showNotification('error', `Failed to execute ${action}. Please try again.`);
    } finally {
      setLoadingAction(null);
    }
  };

  const generateCommissionReport = async () => {
    try {
      // Simulate report generation
      // ... (keep existing logic) ...
      const reportData = {
        generatedAt: new Date().toISOString(),
        period: 'December 2025',
        totalCommission: commissionData.totalCommission,
        vendorCount: vendors.length,
        averageRate: commissionData.averageRate,
        topPerformers: vendors.slice(0, 3).map(v => ({ name: v.name, revenue: v.revenue }))
      };

      // Create downloadable report
      const reportBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commission-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification('success', '✅ Commission report generated and downloaded successfully!');
    } catch (error) {
      console.error('Failed to generate report:', error);
      showNotification('error', 'Failed to generate commission report. Please try again.');
    }
  };

  const processPayments = async () => {
    try {
      // Simulate payment processing
      const pendingPayments = vendors.filter(v => {
        const lastPayment = new Date(v.lastPayment);
        const now = new Date();
        const daysSincePayment = (now - lastPayment) / (1000 * 60 * 60 * 24);
        return daysSincePayment > 30; // Simulate monthly payments
      });

      if (pendingPayments.length === 0) {
        showNotification('info', 'ℹ️ No pending payments found. All vendors are up to date.');
        return;
      }

      // Process payments
      const totalProcessed = pendingPayments.reduce((sum, vendor) => {
        return sum + (vendor.revenue * vendor.currentRate / 100);
      }, 0);

      showNotification('success', `✅ Payment processing completed! Processed ₹${totalProcessed.toLocaleString()} for ${pendingPayments.length} vendors.`);

      // Update last payment dates
      setVendors(prevVendors =>
        prevVendors.map(vendor =>
          pendingPayments.find(p => p.id === vendor.id)
            ? { ...vendor, lastPayment: new Date().toISOString().split('T')[0] }
            : vendor
        )
      );

      await loadCommissionData(); // Refresh data
    } catch (error) {
      console.error('Failed to process payments:', error);
      showNotification('error', 'Failed to process payments. Please try again.');
    }
  };

  const handleBulkCommissionUpdate = async (formData) => {
    setLoadingAction('Bulk Commission Processing');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update vendor commissions based on form data
      setVendors(prevVendors => {
        return prevVendors.map(vendor => {
          let shouldUpdate = false;

          if (formData.vendorTier === 'all') {
            shouldUpdate = true;
          } else if (formData.vendorTier === 'premium' && vendor.tier === 'premium') {
            shouldUpdate = true;
          } else if (formData.vendorTier === 'standard' && vendor.tier === 'standard') {
            shouldUpdate = true;
          } else if (formData.vendorTier === 'new' && vendor.tier === 'new') {
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            return {
              ...vendor,
              currentRate: formData.commissionType === 'percentage' ? parseFloat(formData.rate) : vendor.currentRate
            };
          }

          return vendor;
        });
      });

      // Update commission data
      const updatedAverageRate = vendors.reduce((sum, vendor) => sum + vendor.currentRate, 0) / vendors.length;
      setCommissionData(prev => ({
        ...prev,
        averageRate: updatedAverageRate.toFixed(1)
      }));

      showNotification('success', `✅ Bulk commission update completed! ${formData.vendorCount || vendors.length} vendors updated successfully.`);
      setShowBulkCommissionForm(false);
      await loadCommissionData(); // Refresh data
    } catch (error) {
      console.error('Failed to update commissions:', error);
      showNotification('error', 'Failed to update commissions. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading commission data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Commission Management</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {notification && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              backgroundColor: notification.type === 'success' ? '#d4edda' : '#f8d7da',
              color: notification.type === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'fadeIn 0.3s ease'
            }}>
              <span>{notification.message}</span>
              <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit', opacity: 0.7 }}>×</button>
            </div>
          )}
          <div className="section-header">
            <h3>Commission Tools</h3>
            <button className="toggle-btn" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? '▼' : '▶'}
            </button>
          </div>
          {isExpanded && (
            <div className="section-content">
              <div className="commission-overview">
                <div className="overview-card">
                  <h4>Total Commission This Month</h4>
                  <p className="amount">₹{commissionData.totalCommission.toLocaleString()}</p>
                  <span className={`change ${commissionData.monthlyGrowth >= 0 ? 'positive' : 'negative'}`}>
                    {commissionData.monthlyGrowth >= 0 ? '+' : ''}{commissionData.monthlyGrowth}%
                  </span>
                </div>
                <div className="overview-card">
                  <h4>Active Vendors</h4>
                  <p className="amount">{commissionData.activeVendors}</p>
                  <span className="change neutral">+3.2%</span>
                </div>
                <div className="overview-card">
                  <h4>Average Commission Rate</h4>
                  <p className="amount">{commissionData.averageRate}%</p>
                  <span className="change positive">+1.2%</span>
                </div>
                <div className="overview-card">
                  <h4>Pending Payments</h4>
                  <p className="amount">₹{commissionData.pendingPayments.toLocaleString()}</p>
                  <span className="change neutral">This Month</span>
                </div>
              </div>

              <div className="actions-grid">
                <button
                  className="action-btn primary"
                  onClick={() => handleCommissionAction('Bulk Commission Update')}
                  disabled={loadingAction === 'Bulk Commission Update'}
                >
                  {loadingAction === 'Bulk Commission Update' ? 'Processing...' : 'Bulk Commission Update'}
                </button>
                <button
                  className="action-btn primary"
                  onClick={() => handleCommissionAction('Commission Analytics')}
                  disabled={loadingAction === 'Commission Analytics'}
                >
                  {loadingAction === 'Commission Analytics' ? 'Loading...' : 'Commission Analytics'}
                </button>
                <button
                  className="action-btn primary"
                  onClick={() => handleCommissionAction('Payment Schedule')}
                  disabled={loadingAction === 'Payment Schedule'}
                >
                  {loadingAction === 'Payment Schedule' ? 'Loading...' : 'Payment Schedule'}
                </button>
                <button
                  className="action-btn secondary"
                  onClick={() => handleCommissionAction('Individual Vendor Update')}
                  disabled={loadingAction === 'Individual Vendor Update'}
                >
                  {loadingAction === 'Individual Vendor Update' ? 'Updating...' : 'Individual Vendor Update'}
                </button>
                <button
                  className="action-btn secondary"
                  onClick={() => handleCommissionAction('Commission Report')}
                  disabled={loadingAction === 'Commission Report'}
                >
                  {loadingAction === 'Commission Report' ? 'Generating...' : 'Generate Report'}
                </button>
                <button
                  className="action-btn secondary"
                  onClick={() => handleCommissionAction('Payment Processing')}
                  disabled={loadingAction === 'Payment Processing'}
                >
                  {loadingAction === 'Payment Processing' ? 'Processing...' : 'Process Payments'}
                </button>
              </div>
            </div>
          )}

          {showBulkCommissionForm && (
            <BulkCommissionForm
              onSubmit={handleBulkCommissionUpdate}
              onCancel={() => setShowBulkCommissionForm(false)}
              isLoading={loadingAction === 'Bulk Commission Processing'}
            />
          )}

          {showAnalyticsView && (
            <CommissionAnalytics
              onClose={() => setShowAnalyticsView(false)}
              commissionData={commissionData}
              vendors={vendors}
            />
          )}

          {showPaymentSchedule && (
            <PaymentSchedule
              onClose={() => setShowPaymentSchedule(false)}
              vendors={vendors}
              commissionData={commissionData}
              showNotification={showNotification}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Bulk Commission Update Form
function BulkCommissionForm({ onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    commissionType: 'percentage',
    rate: '',
    vendorTier: 'all',
    effectiveDate: '',
    vendorCount: 0,
    confirmAction: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="form-overlay">
      <div className="form-content">
        <h3>Bulk Commission Update</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Commission Type:</label>
            <select
              value={formData.commissionType}
              onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
              required
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
              <option value="tiered">Tiered Structure</option>
            </select>
          </div>

          <div className="form-group">
            <label>New Rate/Value:</label>
            <input
              type="number"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              placeholder="Enter rate (e.g., 15 for 15%)"
              required
            />
          </div>

          <div className="form-group">
            <label>Vendor Tier:</label>
            <select
              value={formData.vendorTier}
              onChange={(e) => setFormData({ ...formData, vendorTier: e.target.value })}
            >
              <option value="all">All Vendors</option>
              <option value="premium">Premium Vendors</option>
              <option value="standard">Standard Vendors</option>
              <option value="new">New Vendors</option>
            </select>
          </div>

          <div className="form-group">
            <label>Effective Date:</label>
            <input
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.confirmAction}
                onChange={(e) => setFormData({ ...formData, confirmAction: e.target.checked })}
                required
              />
              I confirm these bulk commission changes
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Commissions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Commission Analytics Component
function CommissionAnalytics({ onClose, commissionData, vendors }) {
  const topPerformers = vendors
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const tierDistribution = vendors.reduce((acc, vendor) => {
    acc[vendor.tier] = (acc[vendor.tier] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="analytics-overlay">
      <div className="analytics-content">
        <div className="analytics-header">
          <h3>Commission Analytics</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="analytics-body">
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Total Commission</h4>
              <p className="metric">₹{commissionData.totalCommission.toLocaleString()}</p>
              <span className="trend positive">+{commissionData.monthlyGrowth}%</span>
            </div>
            <div className="analytics-card">
              <h4>Average Rate</h4>
              <p className="metric">{commissionData.averageRate}%</p>
            </div>
            <div className="analytics-card">
              <h4>Active Vendors</h4>
              <p className="metric">{commissionData.activeVendors}</p>
            </div>
            <div className="analytics-card">
              <h4>Paid This Month</h4>
              <p className="metric">₹{commissionData.paidThisMonth.toLocaleString()}</p>
            </div>
          </div>

          <div className="analytics-charts">
            <div className="chart-container">
              <h4>Monthly Commission Trend</h4>
              <div className="chart">
                {commissionData.monthlyData.map((data, index) => (
                  <div key={data.month} className="chart-bar">
                    <div
                      className="bar-fill"
                      style={{
                        height: `${(data.commission / 250000) * 100}%`,
                        backgroundColor: index === commissionData.monthlyData.length - 1 ? '#FFC107' : '#E0E0E0'
                      }}
                    ></div>
                    <span className="bar-label">{data.month}</span>
                    <span className="bar-value">₹{(data.commission / 1000).toFixed(0)}K</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-tables">
              <div className="table-section">
                <h4>Top Performing Vendors</h4>
                <div className="mini-table">
                  {topPerformers.map((vendor, index) => (
                    <div key={vendor.id} className="table-row">
                      <span className="rank">#{index + 1}</span>
                      <span className="vendor-name">{vendor.name}</span>
                      <span className="vendor-revenue">₹{vendor.revenue.toLocaleString()}</span>
                      <span className="vendor-rate">{vendor.currentRate}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="table-section">
                <h4>Vendor Tier Distribution</h4>
                <div className="tier-distribution">
                  {Object.entries(tierDistribution).map(([tier, count]) => (
                    <div key={tier} className="tier-item">
                      <span className="tier-name">{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                      <div className="tier-bar">
                        <div
                          className="tier-fill"
                          style={{ width: `${(count / vendors.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="tier-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Payment Schedule Component
// Payment Schedule Component
function PaymentSchedule({ onClose, vendors, showNotification }) {
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [processingPayments, setProcessingPayments] = useState(false);

  // Generate payment schedule based on vendor data
  const paymentSchedule = vendors.map(vendor => {
    const commissionAmount = Math.round(vendor.revenue * vendor.currentRate / 100);
    const lastPayment = new Date(vendor.lastPayment);
    const nextPayment = new Date(lastPayment);
    nextPayment.setMonth(nextPayment.getMonth() + 1);

    // Determine status based on days until payment
    const today = new Date();
    const daysUntilPayment = Math.ceil((nextPayment - today) / (1000 * 60 * 60 * 24));

    let status = 'scheduled';
    if (daysUntilPayment < 0) status = 'overdue';
    else if (daysUntilPayment <= 3) status = 'due_soon';
    else if (daysUntilPayment <= 7) status = 'pending';

    return {
      vendor: vendor.name,
      amount: commissionAmount,
      dueDate: nextPayment.toISOString().split('T')[0],
      status,
      daysUntil: daysUntilPayment,
      vendorId: vendor.id
    };
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  const handlePaymentSelection = (vendorId) => {
    setSelectedPayments(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleBulkPayment = async () => {
    if (selectedPayments.length === 0) {
      showNotification('info', 'Please select payments to process.');
      return;
    }

    setProcessingPayments(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const selectedAmount = paymentSchedule
        .filter(payment => selectedPayments.includes(payment.vendorId))
        .reduce((sum, payment) => sum + payment.amount, 0);

      showNotification('success', `✅ Bulk payment processing completed! Processed ₹${selectedAmount.toLocaleString()} for ${selectedPayments.length} vendors.`);

      setSelectedPayments([]);
      onClose(); // Close modal after successful processing
    } catch (error) {
      console.error('Failed to process payments:', error);
      showNotification('error', 'Failed to process payments. Please try again.');
    } finally {
      setProcessingPayments(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue': return '#e74c3c';
      case 'due_soon': return '#f39c12';
      case 'pending': return '#3498db';
      case 'scheduled': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'overdue': return 'Overdue';
      case 'due_soon': return 'Due Soon';
      case 'pending': return 'Pending';
      case 'scheduled': return 'Scheduled';
      default: return 'Unknown';
    }
  };

  const totalPending = paymentSchedule
    .filter(p => p.status === 'pending' || p.status === 'due_soon' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const nextPaymentDate = paymentSchedule.length > 0 ? paymentSchedule[0].dueDate : 'N/A';

  return (
    <div className="schedule-overlay">
      <div className="schedule-content">
        <div className="schedule-header">
          <h3>Payment Schedule</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="schedule-body">
          <div className="schedule-summary">
            <div className="summary-item">
              <span>Total Pending:</span>
              <strong>₹{totalPending.toLocaleString()}</strong>
            </div>
            <div className="summary-item">
              <span>Next Payment Date:</span>
              <strong>{nextPaymentDate}</strong>
            </div>
            <div className="summary-item">
              <span>Selected for Payment:</span>
              <strong>{selectedPayments.length} vendors</strong>
            </div>
          </div>

          {selectedPayments.length > 0 && (
            <div className="bulk-actions">
              <button
                className="process-btn"
                onClick={handleBulkPayment}
                disabled={processingPayments}
              >
                {processingPayments ? 'Processing...' : `Process Selected Payments (₹${paymentSchedule.filter(p => selectedPayments.includes(p.vendorId)).reduce((sum, p) => sum + p.amount, 0).toLocaleString()})`}
              </button>
            </div>
          )}

          <div className="schedule-table">
            <div className="table-header">
              <div className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={selectedPayments.length === paymentSchedule.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPayments(paymentSchedule.map(p => p.vendorId));
                    } else {
                      setSelectedPayments([]);
                    }
                  }}
                />
              </div>
              <div>Vendor</div>
              <div>Amount</div>
              <div>Due Date</div>
              <div>Status</div>
            </div>
            {paymentSchedule.map((item, index) => (
              <div key={index} className="table-row">
                <div className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedPayments.includes(item.vendorId)}
                    onChange={() => handlePaymentSelection(item.vendorId)}
                  />
                </div>
                <div data-label="Vendor">{item.vendor}</div>
                <div data-label="Amount">₹{item.amount.toLocaleString()}</div>
                <div data-label="Due Date">{item.dueDate}</div>
                <div data-label="Status">
                  <span
                    className="status"
                    style={{ backgroundColor: getStatusColor(item.status) }}
                  >
                    {getStatusText(item.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommissionManagement;