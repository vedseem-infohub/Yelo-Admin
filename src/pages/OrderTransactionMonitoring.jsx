import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import { ordersAPI } from '../services/api';
import './OrderTransactionMonitoring.css';

function OrderTransactionMonitoring() {
  const [allTransactions, setAllTransactions] = useState([]); // All transactions for stats
  const [transactions, setTransactions] = useState([]); // Current page transactions
  const [filteredTransactions, setFilteredTransactions] = useState([]); // Filtered by search
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(() => {
    const saved = localStorage.getItem('transactionsPerPage');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [previousPerPage, setPreviousPerPage] = useState(perPage);
  const [totalTransactions, setTotalTransactions] = useState(0);

  // Helper functions for localStorage
  const getCacheKey = (status, page, itemsPerPage) => {
    return `transactions_cache_${status}_page${page}_perPage${itemsPerPage}`;
  };
  
  const getAllTransactionsCacheKey = (status) => {
    return `transactions_cache_all_${status}`;
  };
  
  const saveTransactionsToCache = (transactionsData, status, page, itemsPerPage) => {
    try {
      const allCacheKey = getAllTransactionsCacheKey(status);
      localStorage.setItem(allCacheKey, JSON.stringify({
        transactions: transactionsData,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Error saving transactions to localStorage:', err);
    }
  };
  
  const loadTransactionsFromCache = (status) => {
    try {
      const allCacheKey = getAllTransactionsCacheKey(status);
      const cached = localStorage.getItem(allCacheKey);
      if (cached) {
        const { transactions: cachedTransactions, timestamp } = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return cachedTransactions;
        }
      }
    } catch (err) {
      console.error('Error loading transactions from localStorage:', err);
    }
    return null;
  };

  // Fetch transactions on mount and when filter changes
  useEffect(() => {
    // Check cache first for page/filter change
    if (currentPage !== 1 || filter !== 'all') {
      const cachedTransactions = loadTransactionsFromCache(filter);
      if (cachedTransactions && cachedTransactions.length > 0) {
        // Use cached data
        const startIndex = (currentPage - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedTransactions = cachedTransactions.slice(startIndex, endIndex);
        
        if (paginatedTransactions.length > 0 || startIndex < cachedTransactions.length) {
          setAllTransactions(cachedTransactions);
          setTotalTransactions(cachedTransactions.length);
          setTransactions(cachedTransactions);
          setFilteredTransactions(paginatedTransactions);
          setLoading(false);
          return; // Use cache, don't fetch
        }
      }
    }
    // Only fetch if cache miss or filter changed for first time
    fetchTransactions();
  }, [filter, currentPage, perPage]);

  // Apply pagination and search filter
  useEffect(() => {
    let result = allTransactions;
    
    // Apply search filter (client-side)
    if (search) {
      result = result.filter(txn => {
        const searchLower = search.toLowerCase();
        return (
          txn.id.toLowerCase().includes(searchLower) ||
          txn.customer.toLowerCase().includes(searchLower) ||
          (txn.orderId && txn.orderId.toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Apply pagination
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedResult = result.slice(startIndex, endIndex);
    
    setTransactions(result);
    setFilteredTransactions(paginatedResult);
    setTotalTransactions(result.length);
  }, [search, allTransactions, currentPage, perPage]);

  // Save perPage to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('transactionsPerPage', perPage.toString());
    if (perPage !== previousPerPage) {
      setCurrentPage(1);
      setPreviousPerPage(perPage);
    }
  }, [perPage, previousPerPage]);

  // Transform orders to transactions
  const transformOrdersToTransactions = (orders) => {
    return orders.map(order => {
      const user = order.userId || {};
      // Use name first, then fullName as fallback (from backend select)
      const customerName = user.name || user.fullName || 'Unknown Customer';
      
      // Map payment status to transaction status
      let status = 'Pending';
      if (order.paymentStatus === 'PAID') {
        status = 'Success';
      } else if (order.paymentStatus === 'FAILED') {
        status = 'Failed';
      }
      
      // Map payment method
      let paymentMethod = 'Cash on Delivery';
      if (order.paymentMethod) {
        const method = order.paymentMethod.toLowerCase();
        if (method.includes('razorpay')) paymentMethod = 'Razorpay';
        else if (method.includes('upi')) paymentMethod = 'UPI';
        else if (method.includes('card')) paymentMethod = 'Credit Card';
        else if (method.includes('wallet')) paymentMethod = 'Wallet';
        else if (method.includes('netbanking') || method.includes('net banking')) paymentMethod = 'Net Banking';
        else if (method.includes('cod') || method.includes('cash')) paymentMethod = 'Cash on Delivery';
        else paymentMethod = order.paymentMethod;
      }
      
      // Create transaction ID
      const transactionId = order.razorpayPaymentId || `TXN-${order._id.toString().substring(0, 8).toUpperCase()}`;
      
      return {
        id: transactionId,
        orderId: order._id.toString(),
        type: 'Payment',
        customer: customerName,
        customerEmail: user.email,
        customerPhone: user.phone,
        amount: parseFloat(order.totalAmount || 0),
        status: status,
        date: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
        paymentMethod: paymentMethod,
        createdAt: order.createdAt,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        items: order.items || [],
        deliveryAddress: order.deliveryAddress
      };
    });
  };

  // Fetch transactions from orders API
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch orders based on payment status filter
      const params = {};
      if (filter !== 'all') {
        // Map filter to payment status
        if (filter === 'Success') {
          params.status = 'PAID';
        } else if (filter === 'Pending') {
          params.status = 'PENDING';
        } else if (filter === 'Failed') {
          params.status = 'FAILED';
        }
      }
      
      const response = await ordersAPI.getAllAdmin(params);
      const ordersData = response?.data || response || [];
      const ordersArray = Array.isArray(ordersData) ? ordersData : [];
      
      // Transform orders to transactions
      const transactionsList = transformOrdersToTransactions(ordersArray);
      
      // Sort by date descending (newest first)
      transactionsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Store all transactions (will be paginated in useEffect)
      setAllTransactions(transactionsList);
      
      // Save to cache
      saveTransactionsToCache(transactionsList, filter, currentPage, perPage);
    } catch (err) {
      setError(err.message || 'Failed to fetch transactions');
      setAllTransactions([]);
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from all transactions
  const totalInflow = allTransactions.reduce((sum, t) => t.amount > 0 && t.status === 'Success' ? sum + t.amount : sum, 0);
  const totalRefunds = allTransactions.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0);

  // Handle view transaction
  const handleViewTransaction = async (transactionId) => {
    try {
      // Extract order ID from transaction ID
      let orderId = transactionId;
      if (transactionId.startsWith('TXN-')) {
        orderId = transactionId.replace('TXN-', '');
      }
      
      // Find transaction in current list (check allTransactions, not just current page)
      const transaction = allTransactions.find(t => t.id === transactionId || t.orderId === orderId);
      
      if (transaction) {
        setSelectedTxn(transaction);
      } else {
        // If not found, fetch order details
        const response = await ordersAPI.getByIdAdmin(orderId);
        const orderData = response?.data || response;
        if (orderData) {
          const transformed = transformOrdersToTransactions([orderData]);
          if (transformed.length > 0) {
            setSelectedTxn(transformed[0]);
          }
        }
      }
    } catch (err) {
      alert('Error fetching transaction details: ' + err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="transaction-monitoring-container">

        {/* Header */}
        <div className="transaction-header-modern">
          <div>
            <h1>Transaction Monitoring</h1>
            <p className="text-muted">Real-time financial logs and payment statuses.</p>
          </div>
          <button className="btn btn-primary">Download Statement</button>
        </div>

        {/* Stats */}
        <div className="transaction-stats-grid">
          <div className="stat-card">
            <div className="stat-value">{allTransactions.length}</div>
            <div className="stat-label">Total Transactions</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">₹{totalInflow.toFixed(2)}</div>
            <div className="stat-label">Total Inflow</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-value">₹{totalRefunds.toFixed(2)}</div>
            <div className="stat-label">Processed Refunds</div>
          </div>
        </div>

        {/* Controls */}
        <div className="transaction-controls-bar card">
          <div className="transaction-search-group">
            <span className="search-icon">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Transaction ID or Customer..."
              className="search-input"
            />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="filter-select">
            <option value="all">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
          <select 
            value={perPage} 
            onChange={e => setPerPage(parseInt(e.target.value, 10))} 
            className="filter-select"
            style={{ marginLeft: '10px' }}
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>

        {/* Table */}
        <div className="card table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Transaction ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                    Loading transactions...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--danger)' }}>
                    Error: {error}
                    <button onClick={fetchTransactions} style={{ marginLeft: '10px' }}>Retry</button>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(txn => (
                  <tr key={txn.id}>
                    <td>
                      <div className={`transaction-type-icon ${txn.amount > 0 ? 'inflow' : 'outflow'}`}>
                        {txn.amount > 0 ? '↓' : '↑'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{txn.id}</span>
                    </td>
                    <td>{txn.customer}</td>
                    <td>
                      <span className={txn.amount > 0 ? 'amount-positive' : 'amount-negative'}>
                        {txn.amount > 0 ? '+' : ''}₹{txn.amount.toFixed(2)}
                      </span>
                    </td>
                    <td>{txn.paymentMethod || 'Cash on Delivery'}</td>
                    <td>
                      <span className={`badge ${txn.status === 'Success' ? 'success' :
                          txn.status === 'Pending' ? 'warning' : 'danger'
                        }`}>
                        {txn.status}
                      </span>
                    </td>
                    <td>{txn.date}</td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => handleViewTransaction(txn.id)}>View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalTransactions > 0 && (
          <div className="pagination-container" style={{ 
            marginTop: '20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalTransactions)} of {totalTransactions} transactions
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                style={{ cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <div style={{ display: 'flex', gap: '5px' }}>
                {Array.from({ length: Math.ceil(totalTransactions / perPage) }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    return page === 1 || 
                           page === Math.ceil(totalTransactions / perPage) ||
                           (page >= currentPage - 2 && page <= currentPage + 2);
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if needed
                    const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && <span style={{ padding: '0 5px' }}>...</span>}
                        <button
                          className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setCurrentPage(page)}
                          disabled={loading}
                          style={{ minWidth: '40px' }}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalTransactions / perPage), prev + 1))}
                disabled={currentPage >= Math.ceil(totalTransactions / perPage) || loading}
                style={{ cursor: currentPage >= Math.ceil(totalTransactions / perPage) ? 'not-allowed' : 'pointer', opacity: currentPage >= Math.ceil(totalTransactions / perPage) ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedTxn && (
          <div className="invoice-modal-overlay" onClick={() => setSelectedTxn(null)}>
            <div className="invoice-modal" onClick={e => e.stopPropagation()}>
              <div className="invoice-header">
                <h3>Transaction Details</h3>
                <button className="close-btn" onClick={() => setSelectedTxn(null)}>&times;</button>
              </div>
              <div className="invoice-body">
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: selectedTxn.amount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {selectedTxn.amount > 0 ? '+' : ''}₹{selectedTxn.amount.toFixed(2)}
                  </div>
                  <div className={`badge ${selectedTxn.status === 'Success' ? 'success' : 'danger'}`} style={{ marginTop: '10px', display: 'inline-block' }}>
                    {selectedTxn.status}
                  </div>
                </div>

                <div className="invoice-details">
                  <div className="invoice-row">
                    <span className="invoice-label">Transaction ID</span>
                    <span className="invoice-value">{selectedTxn.id}</span>
                  </div>
                  <div className="invoice-row">
                    <span className="invoice-label">Order Ref</span>
                    <span className="invoice-value">{selectedTxn.orderId}</span>
                  </div>
                  <div className="invoice-row">
                    <span className="invoice-label">Date & Time</span>
                    <span className="invoice-value">{selectedTxn.date} {selectedTxn.time || ''}</span>
                  </div>
                  <div className="invoice-row">
                    <span className="invoice-label">Payment Method</span>
                    <span className="invoice-value">{selectedTxn.paymentMethod}</span>
                  </div>
                  <div className="invoice-row">
                    <span className="invoice-label">Customer</span>
                    <span className="invoice-value">{selectedTxn.customer}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

export default OrderTransactionMonitoring;
