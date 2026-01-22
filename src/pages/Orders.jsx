import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import { ordersAPI } from '../services/api';
import { useOrderNotifications } from '../contexts/OrderNotificationContext';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Store all orders for stats calculation
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(() => {
    // Load from localStorage or default to 10
    const saved = localStorage.getItem('ordersPerPage');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [previousPerPage, setPreviousPerPage] = useState(perPage);
  const [totalOrders, setTotalOrders] = useState(0);
  const [lastOrderCount, setLastOrderCount] = useState(0); // Track order count to detect new orders
  
  const { refreshOrderCount, setLastOrderCount: setContextOrderCount } = useOrderNotifications();
  
  // Helper functions for localStorage
  const getCacheKey = (status, page, itemsPerPage) => {
    return `orders_cache_${status}_page${page}_perPage${itemsPerPage}`;
  };
  
  const getAllOrdersCacheKey = (status) => {
    return `orders_cache_all_${status}`;
  };
  
  // Optimize order data for caching (remove unnecessary fields)
  const optimizeOrderForCache = (orders) => {
    return orders.map(order => {
      // Only keep essential fields to reduce storage size
      return {
        _id: order._id,
        orderId: order.orderId,
        userId: order.userId ? {
          _id: order.userId._id,
          name: order.userId.name,
          fullName: order.userId.fullName,
          email: order.userId.email,
          phone: order.userId.phone
        } : null,
        items: order.items ? order.items.map(item => ({
          productId: item.productId ? {
            _id: item.productId._id,
            name: item.productId.name,
            slug: item.productId.slug,
            price: item.productId.price,
            brand: item.productId.brand,
            images: item.productId.images ? item.productId.images.slice(0, 1) : [] // Only first image
          } : null,
          quantity: item.quantity,
          price: item.price,
          color: item.color,
          size: item.size
        })) : [],
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        deliveryAddress: order.deliveryAddress,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        statusHistory: order.statusHistory,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    });
  };

  const saveOrdersToCache = (ordersData, status, page, itemsPerPage) => {
    try {
      // Optimize data before caching
      const optimizedOrders = optimizeOrderForCache(ordersData);
      
      const cacheKey = getCacheKey(status, page, itemsPerPage);
      const allCacheKey = getAllOrdersCacheKey(status);
      
      // Use try-catch for each storage attempt
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          orders: optimizedOrders,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Could not cache page-specific orders, skipping...');
      }
      
      // Only save all orders cache if we have space
      try {
        localStorage.setItem(allCacheKey, JSON.stringify({
          orders: optimizedOrders,
          timestamp: Date.now()
        }));
      } catch (e) {
        // If quota exceeded, try to clear old cache entries
        console.warn('localStorage quota exceeded for all orders. Clearing old cache...');
        clearOldCacheEntries();
        // Retry once after clearing
        try {
          localStorage.setItem(allCacheKey, JSON.stringify({
            orders: optimizedOrders,
            timestamp: Date.now()
          }));
        } catch (e2) {
          console.warn('Still cannot cache all orders after cleanup. Skipping cache for large datasets.');
        }
      }
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  };

  // Clear old cache entries to free up space
  const clearOldCacheEntries = () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('orders_cache_') || key.startsWith('transactions_cache_'))) {
          try {
            const cached = JSON.parse(localStorage.getItem(key));
            // Remove entries older than 2 minutes
            if (cached && cached.timestamp && (Date.now() - cached.timestamp > 2 * 60 * 1000)) {
              keysToRemove.push(key);
            }
          } catch (e) {
            keysToRemove.push(key); // Remove invalid entries
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (err) {
      console.error('Error clearing old cache:', err);
    }
  };
  
  const loadOrdersFromCache = (status, page, itemsPerPage) => {
    try {
      const cacheKey = getCacheKey(status, page, itemsPerPage);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { orders: cachedOrders, timestamp } = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return cachedOrders;
        }
      }
    } catch (err) {
      console.error('Error loading from localStorage:', err);
    }
    return null;
  };
  
  const loadAllOrdersFromCache = (status) => {
    try {
      const allCacheKey = getAllOrdersCacheKey(status);
      const cached = localStorage.getItem(allCacheKey);
      if (cached) {
        const { orders: cachedOrders, timestamp } = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return cachedOrders;
        }
      }
    } catch (err) {
      console.error('Error loading all orders from localStorage:', err);
    }
    return null;
  };

  // Save perPage to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('ordersPerPage', perPage.toString());
    // Reset to page 1 when perPage changes (but only if it actually changed)
    if (perPage !== previousPerPage) {
      setCurrentPage(1);
      setPreviousPerPage(perPage);
    }
  }, [perPage, previousPerPage]);

  // Auto-refresh when new orders are detected
  useEffect(() => {
    const intervalId = setInterval(() => {
      checkForNewOrders();
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [filterStatus, totalOrders]);

  // Fetch orders when page, perPage, or filterStatus changes
  useEffect(() => {
    // Check cache first for page change
    if (currentPage !== 1 || perPage !== previousPerPage) {
      const cachedAllOrders = loadAllOrdersFromCache(filterStatus);
      if (cachedAllOrders && cachedAllOrders.length > 0) {
        // Use cached data for pagination
        const startIndex = (currentPage - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedOrders = cachedAllOrders.slice(startIndex, endIndex);
        
        if (paginatedOrders.length > 0 || startIndex < cachedAllOrders.length) {
          setAllOrders(cachedAllOrders);
          setTotalOrders(cachedAllOrders.length);
          setOrders(paginatedOrders);
          setFilteredOrders(paginatedOrders);
          setLoading(false);
          return; // Use cache, don't fetch
        }
      }
    }
    // Only fetch if cache miss or filter status changed
    fetchOrders();
  }, [currentPage, perPage, filterStatus]);
  
  // Load from cache on initial mount
  useEffect(() => {
    const cachedAllOrders = loadAllOrdersFromCache(filterStatus);
    if (cachedAllOrders && cachedAllOrders.length > 0) {
      setAllOrders(cachedAllOrders);
      setTotalOrders(cachedAllOrders.length);
      setLastOrderCount(cachedAllOrders.length);
      setContextOrderCount(cachedAllOrders.length);
      
      // Load current page from cache
      const startIndex = (currentPage - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedOrders = cachedAllOrders.slice(startIndex, endIndex);
      
      if (paginatedOrders.length > 0) {
        setOrders(paginatedOrders);
        setFilteredOrders(paginatedOrders);
        setLoading(false);
      } else {
        // Cache didn't have enough, fetch fresh
        fetchOrders(true);
      }
    } else {
      // No cache, fetch fresh
      fetchOrders(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Auto-refresh when new orders are detected (via context polling)
  // Disabled for now since we're using pagination - can be re-enabled if needed
  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     refreshOrdersSilently();
  //   }, 10000);
  //   return () => clearInterval(intervalId);
  // }, []);

  // Filter orders (client-side filtering for search only, pagination handled by backend)
  useEffect(() => {
    let result = orders;
    
    // Apply search filter (client-side)
    if (searchTerm) {
      result = result.filter(order => {
        const orderId = order._id?.toString() || order.orderId || '';
        const customerName = order.userId?.name || '';
        const email = order.userId?.email || '';
        const phone = order.userId?.phone || '';
        
        return orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phone.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    // Status filter is already applied on backend via API params
    
    setFilteredOrders(result);
  }, [searchTerm, orders]);

  // Check for new orders (silent refresh)
  const checkForNewOrders = async () => {
    try {
      const allParams = {};
      if (filterStatus !== 'all') {
        allParams.status = filterStatus.toUpperCase();
      }
      // Fetch all orders - handle paginated response
      const firstResponse = await ordersAPI.getAllAdmin({ page: 1, limit: 100, ...allParams });
      let ordersArray = Array.isArray(firstResponse?.data) ? firstResponse.data : [];
      const totalCount = firstResponse?.total || ordersArray.length;
      
      // Fetch remaining pages if needed
      if (totalCount > ordersArray.length && firstResponse?.totalPages > 1) {
        const remainingPages = Math.min(firstResponse.totalPages - 1, 10);
        const remainingPromises = [];
        
        for (let page = 2; page <= remainingPages + 1; page++) {
          remainingPromises.push(
            ordersAPI.getAllAdmin({ page, limit: 100, ...allParams })
              .then(res => Array.isArray(res?.data) ? res.data : [])
              .catch(() => [])
          );
        }
        
        const remainingOrders = await Promise.all(remainingPromises);
        ordersArray = [...ordersArray, ...remainingOrders.flat()];
      }
      
      // Check if new orders arrived
      if (ordersArray.length !== lastOrderCount) {
        // New orders detected, refresh cache and state
        setAllOrders(ordersArray);
        setTotalOrders(ordersArray.length);
        setLastOrderCount(ordersArray.length);
        setContextOrderCount(ordersArray.length);
        
        // Save to cache
        saveOrdersToCache(ordersArray, filterStatus, currentPage, perPage);
        
        // Update current page orders
        const startIndex = (currentPage - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedOrders = ordersArray.slice(startIndex, endIndex);
        setOrders(paginatedOrders);
        setFilteredOrders(paginatedOrders);
      }
    } catch (err) {
      // Silently fail
      console.error('Error checking for new orders:', err);
    }
  };

  // Fetch orders from backend with pagination and caching
  const fetchOrders = async (skipCache = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're increasing perPage (e.g., from 10 to 20)
      const isPerPageIncrease = previousPerPage > 0 && perPage > previousPerPage && currentPage === 1;
      
      // Try to load from cache first if not skipping cache
      if (!skipCache && !isPerPageIncrease) {
        const cachedAllOrders = loadAllOrdersFromCache(filterStatus);
        if (cachedAllOrders && cachedAllOrders.length > 0) {
          const cachedPageOrders = loadOrdersFromCache(filterStatus, currentPage, perPage);
          if (cachedPageOrders && cachedPageOrders.length > 0) {
            setAllOrders(cachedAllOrders);
            setTotalOrders(cachedAllOrders.length);
            setLastOrderCount(cachedAllOrders.length);
            setContextOrderCount(cachedAllOrders.length);
            
            const startIndex = (currentPage - 1) * perPage;
            const endIndex = startIndex + perPage;
            const paginatedOrders = cachedAllOrders.slice(startIndex, endIndex);
            setOrders(paginatedOrders);
            setFilteredOrders(paginatedOrders);
            setLoading(false);
            return; // Use cache, no need to fetch
          }
        }
      }
      
      // Fetch all orders from backend with pagination
      // Note: Backend now returns paginated data, so we need to fetch all pages
      const allParams = { page: 1, limit: 100 }; // Fetch more to get all orders
      if (filterStatus !== 'all') {
        allParams.status = filterStatus.toUpperCase();
      }
      
      // First fetch to get total count and first page
      const firstResponse = await ordersAPI.getAllAdmin(allParams);
      let ordersArray = Array.isArray(firstResponse?.data) ? firstResponse.data : [];
      const totalCount = firstResponse?.total || ordersArray.length;
      
      // If there are more orders, fetch remaining pages
      if (totalCount > ordersArray.length && firstResponse?.totalPages > 1) {
        const remainingPages = Math.ceil((totalCount - ordersArray.length) / 100);
        const remainingPromises = [];
        
        for (let page = 2; page <= firstResponse.totalPages && page <= 10; page++) { // Limit to 10 pages max
          remainingPromises.push(
            ordersAPI.getAllAdmin({ ...allParams, page, limit: 100 })
              .then(res => Array.isArray(res?.data) ? res.data : [])
              .catch(() => [])
          );
        }
        
        const remainingOrders = await Promise.all(remainingPromises);
        ordersArray = [...ordersArray, ...remainingOrders.flat()];
      }
      
      // Ensure we have an array
      if (!Array.isArray(ordersArray)) {
        ordersArray = [];
      }
      
      // If perPage increased, merge with existing cached orders
      if (isPerPageIncrease) {
        const cachedAllOrders = loadAllOrdersFromCache(filterStatus);
        if (cachedAllOrders && cachedAllOrders.length > 0) {
          // Get existing orders (first previousPerPage items)
          const existingOrders = cachedAllOrders.slice(0, previousPerPage);
          
          // Check if new orders need to be fetched (orders beyond what we have)
          if (ordersArray.length > existingOrders.length) {
            // Merge existing with new
            const newOrders = ordersArray.slice(existingOrders.length);
            const mergedOrders = [...existingOrders, ...newOrders];
            // Use merged orders but limit to what backend has
            const finalOrders = mergedOrders.length <= ordersArray.length 
              ? mergedOrders 
              : ordersArray.slice(0, mergedOrders.length);
            
            setAllOrders(finalOrders.length > ordersArray.length ? finalOrders : ordersArray);
            setTotalOrders(ordersArray.length);
            setLastOrderCount(ordersArray.length);
            setContextOrderCount(ordersArray.length);
            
            // Save merged orders to cache
            saveOrdersToCache(finalOrders.length > ordersArray.length ? finalOrders : ordersArray, filterStatus, currentPage, perPage);
            
            // Paginate for current display
            const startIndex = 0;
            const endIndex = perPage;
            const paginatedOrders = (finalOrders.length > ordersArray.length ? finalOrders : ordersArray).slice(startIndex, endIndex);
            setOrders(paginatedOrders);
            setFilteredOrders(paginatedOrders);
            setLoading(false);
            return;
          }
        }
      }
      
      // Normal fetch (no perPage increase or cache miss)
      setAllOrders(ordersArray);
      setTotalOrders(ordersArray.length);
      setLastOrderCount(ordersArray.length);
      setContextOrderCount(ordersArray.length);
      
      // Save to cache
      saveOrdersToCache(ordersArray, filterStatus, currentPage, perPage);
      
      // Calculate pagination
      const startIndex = (currentPage - 1) * perPage;
      const endIndex = startIndex + perPage;
      
      // Slice the orders for current page (client-side pagination)
      const paginatedOrders = ordersArray.slice(startIndex, endIndex);
      
      setOrders(paginatedOrders);
      setFilteredOrders(paginatedOrders);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
      setOrders([]);
      setFilteredOrders([]);
      setTotalOrders(0);
    } finally {
      setLoading(false);
    }
  };


  const handleUpdateStatus = async (orderId, newStatus) => {
    const status = newStatus.toUpperCase();
    
    try {
      await ordersAPI.updateStatus(orderId, status);
      
      // Update the order in local state and cache immediately
      const updatedAllOrders = allOrders.map(order => {
        const oId = order._id?.toString() || order.orderId || order.id;
        if (oId === orderId || oId.toString() === orderId.toString()) {
          return { ...order, orderStatus: status, status: status };
        }
        return order;
      });
      
      setAllOrders(updatedAllOrders);
      setTotalOrders(updatedAllOrders.length);
      
      // Update current page orders
      const startIndex = (currentPage - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedOrders = updatedAllOrders.slice(startIndex, endIndex);
      setOrders(paginatedOrders);
      
      // Update filtered orders (considering search)
      let filtered = paginatedOrders;
      if (searchTerm) {
        filtered = paginatedOrders.filter(order => {
          const oId = order._id?.toString() || order.orderId || '';
          const customerName = order.userId?.name || '';
          const email = order.userId?.email || '';
          const phone = order.userId?.phone || '';
          return oId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            phone.toLowerCase().includes(searchTerm.toLowerCase());
        });
      }
      setFilteredOrders(filtered);
      
      // Update cache
      saveOrdersToCache(updatedAllOrders, filterStatus, currentPage, perPage);
      
      // Update order details cache if this order is in cache
      if (orderDetailsCache[orderId]) {
        setOrderDetailsCache(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            orderStatus: status,
            status: status
          }
        }));
      }
      
      // Return success - don't show alert here, let the drawer handle it
      return { success: true };
    } catch (err) {
      console.error('Error updating order status:', err);
      // Throw error so drawer can catch it
      throw err;
    }
  };


  const handleCompleteOrder = async (orderId) => {
    if (window.confirm('Mark this order as complete?')) {
      try {
        await ordersAPI.complete(orderId);
        
        // Update the order in local state and cache immediately
        const updatedAllOrders = allOrders.map(order => {
          const oId = order._id?.toString() || order.orderId || order.id;
          if (oId === orderId || oId.toString() === orderId.toString()) {
            return { ...order, orderStatus: 'COMPLETED', status: 'COMPLETED' };
          }
          return order;
        });
        
        setAllOrders(updatedAllOrders);
        setTotalOrders(updatedAllOrders.length);
        
        // Update current page orders
        const startIndex = (currentPage - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedOrders = updatedAllOrders.slice(startIndex, endIndex);
        setOrders(paginatedOrders);
        
        // Update filtered orders (considering search)
        let filtered = paginatedOrders;
        if (searchTerm) {
          filtered = paginatedOrders.filter(order => {
            const oId = order._id?.toString() || order.orderId || '';
            const customerName = order.userId?.name || '';
            const email = order.userId?.email || '';
            const phone = order.userId?.phone || '';
            return oId.toLowerCase().includes(searchTerm.toLowerCase()) ||
              customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              email.toLowerCase().includes(searchTerm.toLowerCase()) ||
              phone.toLowerCase().includes(searchTerm.toLowerCase());
          });
        }
        setFilteredOrders(filtered);
        
        // Update cache
        saveOrdersToCache(updatedAllOrders, filterStatus, currentPage, perPage);
        
        // Update order details cache if this order is in cache
        if (orderDetailsCache[orderId]) {
          setOrderDetailsCache(prev => ({
            ...prev,
            [orderId]: {
              ...prev[orderId],
              orderStatus: 'COMPLETED',
              status: 'COMPLETED'
            }
          }));
        }
        
        alert('Order marked as complete');
      } catch (err) {
        console.error('Error completing order:', err);
        alert('Error completing order: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'success';
      case 'DELIVERED': return 'success';
      case 'SHIPPED': return 'info';
      case 'CONFIRMED': return 'warning';
      case 'PLACED': return 'danger';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  };

  // State to store full order details when fetched
  const [orderDetailsCache, setOrderDetailsCache] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  
  // Fetch full order details when details button is clicked - only for the specific order
  const fetchOrderDetails = async (orderId) => {
    // Normalize orderId - ensure it's a string
    const actualOrderId = String(orderId).trim();
    
    if (!actualOrderId || actualOrderId === 'N/A' || actualOrderId === 'undefined') {
      console.error('❌ Invalid order ID provided to fetchOrderDetails:', orderId);
      throw new Error('Invalid order ID');
    }
    
    // Check if already in cache
    if (orderDetailsCache[actualOrderId]) {
      console.log('✅ Using cached order details for:', actualOrderId);
      return orderDetailsCache[actualOrderId];
    }
    
    // Check if already loading
    if (loadingDetails[actualOrderId]) {
      console.log('⏳ Order details already loading for:', actualOrderId);
      // Wait for the existing request to complete
      let attempts = 0;
      while (loadingDetails[actualOrderId] && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      // Check cache again after waiting
      if (orderDetailsCache[actualOrderId]) {
        return orderDetailsCache[actualOrderId];
      }
      return null;
    }
    
    console.log('🔍 Fetching order details for:', actualOrderId);
    setLoadingDetails(prev => ({ ...prev, [actualOrderId]: true }));
    setError(null); // Clear previous errors
    
    try {
      console.log('📡 Calling ordersAPI.getByIdAdmin with ID:', actualOrderId);
      const startTime = Date.now();
      
      // Add timeout to the API call (15 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000);
      });
      
      const response = await Promise.race([
        ordersAPI.getByIdAdmin(actualOrderId),
        timeoutPromise
      ]);
      
      const fetchTime = Date.now() - startTime;
      console.log(`✅ Order details API response received in ${fetchTime}ms:`, {
        success: response?.success,
        hasData: !!response?.data,
        dataKeys: response?.data ? Object.keys(response.data) : [],
        itemsCount: response?.data?.items?.length || 0,
        orderId: response?.data?._id || response?.data?.orderId,
        userId: response?.data?.userId ? {
          hasName: !!response.data.userId.name,
          hasFullName: !!response.data.userId.fullName,
          name: response.data.userId.name,
          fullName: response.data.userId.fullName,
          email: response.data.userId.email,
          phone: response.data.userId.phone,
          _id: response.data.userId._id
        } : null
      });
      
      if (response && response.success && response.data) {
        // Validate that this is the correct order
        const responseOrderId = response.data._id?.toString() || response.data.orderId;
        if (responseOrderId && responseOrderId !== actualOrderId) {
          console.warn('⚠️ Order ID mismatch:', { requested: actualOrderId, received: responseOrderId });
        }
        
        // Cache the full order details - use multiple keys for lookup
        const cachedData = response.data;
        setOrderDetailsCache(prev => ({
          ...prev,
          [actualOrderId]: cachedData,
          // Also cache by other possible IDs
          ...(response.data._id && { [response.data._id.toString()]: cachedData }),
          ...(response.data.orderId && { [response.data.orderId]: cachedData })
        }));
        
        console.log('✅ Order details cached successfully for:', actualOrderId);
        return cachedData;
      } else {
        console.error('❌ Invalid response format:', response);
        const errorMsg = 'Failed to load order details: Invalid response format';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error fetching order details:', error);
      const errorMsg = 'Failed to load order details: ' + (error.message || 'Unknown error');
      setError(errorMsg);
      throw error; // Re-throw to let caller handle
    } finally {
      setLoadingDetails(prev => {
        const newState = { ...prev };
        delete newState[actualOrderId];
        return newState;
      });
    }
  };
  
  const toggleDetails = async (id) => {
    console.log('🔵 Toggle details clicked for order:', id);
    
    // Find the actual order to get the correct _id
    const order = filteredOrders.find(o => {
      const oId = o._id?.toString() || o.orderId || 'N/A';
      return oId === id || o._id?.toString() === id || o.orderId === id;
    });
    
    if (!order) {
      console.error('❌ Order not found in filteredOrders:', id);
      setError(`Order with ID ${id} not found`);
      return;
    }
    
    // Use _id if available (preferred), otherwise fall back to orderId or provided id
    const actualOrderId = order._id?.toString() || order.orderId || id;
    const displayId = order._id?.toString() || order.orderId || id;
    
    console.log('📋 Order details:', { 
      id, 
      actualOrderId, 
      displayId, 
      orderExists: !!order, 
      order_id: order._id,
      orderId: order.orderId,
      cachedDetails: !!orderDetailsCache[actualOrderId]
    });
    
    // If expanding (not already expanded), fetch full details
    if (expandedOrderId !== displayId) {
      console.log('📂 Expanding order details for:', displayId);
      // Expand immediately for better UX (use displayId for state)
      setExpandedOrderId(displayId);
      // Clear any previous error
      setError(null);
      // Fetch full details in background using actualOrderId (MongoDB _id)
      if (actualOrderId && actualOrderId !== 'N/A') {
        try {
          const fetchedDetails = await fetchOrderDetails(actualOrderId);
          console.log('✅ Order details fetched successfully:', {
            hasItems: !!fetchedDetails?.items,
            itemsCount: fetchedDetails?.items?.length || 0,
            hasUserId: !!fetchedDetails?.userId
          });
        } catch (error) {
          console.error('❌ Error fetching order details:', error);
          setError('Failed to load order details: ' + (error.message || 'Unknown error'));
          // Close the drawer on error
          setExpandedOrderId(null);
        }
      } else {
        console.error('❌ Invalid order ID for fetching details:', actualOrderId);
        setError('Invalid order ID: ' + actualOrderId);
        setExpandedOrderId(null);
      }
    } else {
      // Collapsing - just close it
      console.log('📁 Collapsing order details');
      setExpandedOrderId(null);
    }
  }

  // Stats (calculated from all orders, not just current page)
  const pendingOrders = allOrders.filter(o => {
    const status = o.orderStatus || o.status || '';
    return status === 'PLACED' || status === 'Placed' || status === 'PENDING' || status === 'Pending';
  }).length;
  const totalRev = allOrders.reduce((acc, curr) => {
    const amount = curr.totalAmount || curr.amount || 0;
    return acc + (typeof amount === 'string' ? parseFloat(amount.replace('₹', '').replace(',', '')) : amount);
  }, 0);

  return (
    <AdminLayout>
      <div className="orders-page">

        {/* Header */}
        <div className="orders-header-modern">
          <div>
            <h1>Order Management</h1>
            <p className="text-muted">Track and manage customer orders.</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline">Export CSV</button>
          </div>
        </div>

        {/* Stats */}
        <div className="orders-stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalOrders}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{pendingOrders}</div>
            <div className="stat-label">Pending Action</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">₹{totalRev}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>

        {/* Controls */}
        <div className="orders-controls-bar card">
          <div className="order-search-group">
            <span className="search-icon">🔍</span>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search Order ID, Customer..."
              className="search-input"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Orders</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELIVERED">Delivered</option>
            <option value="SHIPPED">Shipped</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PLACED">Placed</option>
            <option value="CANCELLED">Cancelled</option>
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
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    Loading orders...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--danger)' }}>
                    Error: {error}
                    <button onClick={fetchOrders} style={{ marginLeft: '10px' }}>Retry</button>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const orderId = order._id?.toString() || order.orderId || 'N/A';
                  const isExpanded = expandedOrderId === orderId;
                  const status = order.orderStatus || order.status || 'PENDING';
                  // Use 'name' field first, fallback to 'fullName' if name is not available
                  // Use 'name' field first, fallback to 'fullName' if name is not available
                  const customerName = order.userId?.name || order.userId?.fullName || 'Unknown Customer';
                  // Get email from 'email' field, show 'Not provided' if empty or missing
                  const customerEmail = (order.userId?.email && order.userId.email.trim() !== '') ? order.userId.email : 'Not provided';
                  const customerPhone = order.userId?.phone || 'N/A';
                  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
                  const totalAmount = order.totalAmount || order.amount || 0;
                  
                  return (
                    <React.Fragment key={orderId}>
                      <tr className={isExpanded ? 'active-row' : ''}>
                        <td className="order-id-cell">{orderId.substring(0, 12)}...</td>
                        <td>
                          <div className="customer-cell">
                            {/* Display name from 'name' field (prioritized over fullName) */}
                            <span className="customer-name" style={{ fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                              {(() => {
                                // Debug: Log userId structure if name is missing
                                if (order.userId && !order.userId.name && !order.userId.fullName) {
                                  console.warn('⚠️ Order userId missing name/fullName:', {
                                    orderId: orderId,
                                    userId: order.userId,
                                    userIdKeys: order.userId ? Object.keys(order.userId) : [],
                                    userIdType: typeof order.userId
                                  });
                                }
                                // Try multiple fallbacks
                                const name = order.userId?.name || order.userId?.fullName || 
                                           (typeof order.userId === 'object' && order.userId !== null ? 
                                            (order.userId.name || order.userId.fullName || 'Unknown Customer') : 
                                            'Unknown Customer');
                                return name;
                              })()}
                            </span>
                            {/* Display email from 'email' field - always show even if empty */}
                            <span className="customer-email" style={{ fontSize: '13px', color: customerEmail === 'Not provided' ? '#999' : '#555', display: 'block', marginBottom: '2px' }}>
                              {customerEmail}
                            </span>
                            {customerPhone !== 'N/A' && (
                              <span className="customer-phone" style={{ fontSize: '12px', color: '#666', display: 'block', marginTop: '2px' }}>
                                {customerPhone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="amount-font">₹{totalAmount}</td>
                        <td>
                          <span className={`badge ${order.paymentMethod === 'cod' ? 'warning' : 'info'}`}>
                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'razorpay' ? 'Razorpay' : order.paymentMethod || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(status)}`}>{status}</span>
                        </td>
                        <td>{orderDate}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => toggleDetails(orderId)}
                          >
                            {isExpanded ? 'Close' : 'Details'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Detail Drawer */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="7" style={{ padding: 0, borderBottom: 'none' }}>
                            {(() => {
                              // Get the actual order ID (MongoDB _id is preferred)
                              const actualOrderId = order._id?.toString() || order.orderId || orderId;
                              
                              // Get cached order details - try multiple ID formats for lookup
                              const cachedOrder = 
                                orderDetailsCache[order._id?.toString()] || 
                                orderDetailsCache[order.orderId] || 
                                orderDetailsCache[orderId] || 
                                orderDetailsCache[actualOrderId] ||
                                order;
                              
                              // Check if currently loading for this specific order
                              const currentlyLoading = 
                                loadingDetails[order._id?.toString()] || 
                                loadingDetails[order.orderId] || 
                                loadingDetails[orderId] ||
                                loadingDetails[actualOrderId] ||
                                false;
                              
                              console.log('🔍 Rendering OrderDetailsDrawer for order:', {
                                orderId: actualOrderId,
                                hasCachedData: !!orderDetailsCache[order._id?.toString()] || !!orderDetailsCache[order.orderId] || !!orderDetailsCache[orderId],
                                isLoading: currentlyLoading,
                                hasItems: Array.isArray(cachedOrder.items),
                                itemsCount: cachedOrder.items?.length || 0,
                                cachedOrderKeys: Object.keys(orderDetailsCache)
                              });
                              
                              return (
                                <OrderDetailsDrawer
                                  key={`order-details-${actualOrderId}`} // Force re-render when order changes
                                  order={cachedOrder}
                                  originalOrder={order} // Pass the original order from list (has populated userId)
                                  isLoading={currentlyLoading}
                                  onUpdateStatus={(orderId, status) => handleUpdateStatus(actualOrderId || orderId, status)}
                                  onCompleteOrder={(orderId) => handleCompleteOrder(actualOrderId || orderId)}
                                />
                              );
                            })()}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalOrders > 0 && (
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
              Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalOrders)} of {totalOrders} orders
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
                {Array.from({ length: Math.ceil(totalOrders / perPage) }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    return page === 1 || 
                           page === Math.ceil(totalOrders / perPage) ||
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
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalOrders / perPage), prev + 1))}
                disabled={currentPage >= Math.ceil(totalOrders / perPage) || loading}
                style={{ cursor: currentPage >= Math.ceil(totalOrders / perPage) ? 'not-allowed' : 'pointer', opacity: currentPage >= Math.ceil(totalOrders / perPage) ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

// Order Details Skeleton Component
function OrderDetailsSkeleton() {
  return (
    <div className="order-details-drawer">
      <div className="details-grid">
        {/* Left Col: User Info & Items */}
        <div className="details-section">
          <div className="skeleton-header"></div>
          <div className="skeleton-box" style={{ marginBottom: '20px', padding: '15px', height: '120px' }}></div>
          
          <div className="skeleton-header" style={{ marginTop: '30px' }}></div>
          <div className="skeleton-box" style={{ marginBottom: '20px', padding: '15px', height: '180px' }}></div>
          
          <div className="skeleton-header" style={{ marginTop: '30px' }}></div>
          {/* Order Items Skeleton */}
          <div style={{ marginBottom: '15px' }}>
            {[1, 2, 3].map((idx) => (
              <div key={idx} style={{ 
                marginBottom: '15px', 
                padding: '15px', 
                border: '1px solid #e0e0e0', 
                borderRadius: '8px',
                backgroundColor: '#fff',
                display: 'flex',
                gap: '15px'
              }}>
                <div className="skeleton-image" style={{ width: '80px', height: '80px', borderRadius: '6px', flexShrink: 0 }}></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton-line" style={{ width: '70%', height: '20px', marginBottom: '10px' }}></div>
                  <div className="skeleton-line" style={{ width: '40%', height: '16px', marginBottom: '8px' }}></div>
                  <div className="skeleton-line" style={{ width: '50%', height: '14px', marginBottom: '6px' }}></div>
                  <div className="skeleton-line" style={{ width: '60%', height: '14px' }}></div>
                </div>
                <div className="skeleton-line" style={{ width: '80px', height: '24px' }}></div>
              </div>
            ))}
          </div>
          
          <div className="skeleton-box" style={{ marginTop: '20px', padding: '15px', height: '150px' }}></div>
        </div>

        {/* Right Col: Status Timeline */}
        <div className="details-section">
          <div className="skeleton-header"></div>
          <div style={{ marginBottom: '20px' }}>
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="skeleton-circle" style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0 }}></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton-line" style={{ width: '60%', height: '16px', marginBottom: '6px' }}></div>
                  <div className="skeleton-line" style={{ width: '40%', height: '12px' }}></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="skeleton-header" style={{ marginTop: '30px' }}></div>
          <div className="skeleton-line" style={{ width: '100%', height: '40px', marginBottom: '12px', borderRadius: '4px' }}></div>
          <div className="skeleton-line" style={{ width: '100%', height: '40px', borderRadius: '4px' }}></div>
        </div>
      </div>
    </div>
  );
}

// Order Details Drawer Component
function OrderDetailsDrawer({ order, originalOrder, isLoading, onUpdateStatus, onCompleteOrder }) {
  // Use local state for status to allow selection without immediate update
  const [localStatus, setLocalStatus] = useState(order?.orderStatus || order?.status || 'PLACED');
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadedData, setLoadedData] = useState(order);
  
  // Update loaded data when order prop changes (when full details are fetched)
  useEffect(() => {
    console.log('📦 OrderDetailsDrawer: order prop changed', {
      hasOrder: !!order,
      isLoading,
      hasItems: Array.isArray(order?.items),
      itemsCount: order?.items?.length || 0,
      orderId: order?._id || order?.orderId
    });
    
    if (order && !isLoading) {
      // Check if this is the full order data (has items array, even if empty, or has populated userId with more fields)
      // The minimal order from list won't have items, the full order will have items array
      const hasItems = Array.isArray(order.items);
      const hasFullData = hasItems || (order.userId && order.items !== undefined);
      
      console.log('📦 Checking if order has full data:', {
        hasItems,
        hasFullData,
        orderId: order._id || order.orderId
      });
      
      if (hasFullData) {
        console.log('✅ Setting loaded data for order:', order._id || order.orderId);
        setLoadedData(order);
      }
    }
  }, [order, isLoading]);
  
  // Update local status when order prop changes (after successful update)
  useEffect(() => {
    const newStatus = order?.orderStatus || order?.status || 'PLACED';
    setLocalStatus(newStatus);
  }, [order?.orderStatus, order?.status, order?._id]);
  
  // Show loading state if details are still being fetched
  // Show skeleton if: loading OR (order doesn't have items array property yet - meaning it's still the minimal version)
  const hasFullData = loadedData && (Array.isArray(loadedData.items) || (loadedData.userId && loadedData.items !== undefined));
  if (isLoading || !hasFullData) {
    return <OrderDetailsSkeleton />;
  }
  
  // Use loadedData which has the full order details, fallback to order prop
  const fullOrder = loadedData || order;
  
  const status = localStatus;
  const address = fullOrder.deliveryAddress || fullOrder.shippingAddress || {};
  
  // Get user from userId - prioritize data from fullOrder, but fallback to originalOrder (from list) if fullOrder doesn't have proper user data
  // The originalOrder comes from the list and has properly populated userId with name/phone
  let user = fullOrder.userId || {};
  
  // Check if user is properly populated (has name or fullName)
  const isUserProperlyPopulated = user && typeof user === 'object' && Object.keys(user).length > 0 && 
    (user.name || user.fullName || (user.email && user.email !== 'Not provided'));
  
  // If userId is not properly populated (or shows "User not found"), use originalOrder's userId from the list
  if (!isUserProperlyPopulated && originalOrder && originalOrder.userId && 
      typeof originalOrder.userId === 'object' && 
      (originalOrder.userId.name || originalOrder.userId.fullName || originalOrder.userId.phone)) {
    console.log('✅ Using userId from originalOrder (list) as fallback:', {
      originalOrderUserId: originalOrder.userId,
      hasName: !!originalOrder.userId.name,
      name: originalOrder.userId.name
    });
    user = originalOrder.userId;
  }
  
  // If userId still doesn't have name/phone, try to get from deliveryAddress
  if (user && Object.keys(user).length > 0 && typeof user === 'object') {
    // Check if user has a name but it's "User not found" or similar - try to get from address or originalOrder
    if ((!user.name || user.name === 'User not found' || user.name === 'Failed to load user') && !user.fullName) {
      if (address.fullName) {
        user.name = address.fullName;
      } else if (originalOrder?.userId?.name || originalOrder?.userId?.fullName) {
        user.name = originalOrder.userId.name || originalOrder.userId.fullName;
      }
    }
    if (!user.name && !user.fullName && address.fullName) {
      user.name = address.fullName;
    }
    if (!user.phone && address.phone) {
      user.phone = address.phone;
    } else if (!user.phone && originalOrder?.userId?.phone) {
      user.phone = originalOrder.userId.phone;
    }
    if (!user.email && address.email) {
      user.email = address.email;
    } else if (!user.email && originalOrder?.userId?.email) {
      user.email = originalOrder.userId.email;
    }
  } else if (address.fullName || address.phone) {
    // If userId is not available at all, use deliveryAddress as user info
    user = {
      name: address.fullName,
      phone: address.phone,
      email: address.email
    };
  } else if (originalOrder?.userId) {
    // Last resort: use originalOrder's userId
    user = originalOrder.userId;
  }
  
  // Debug userId in OrderDetailsDrawer
  if (user && Object.keys(user).length > 0 && !user.name && !user.fullName) {
    console.warn('⚠️ OrderDetailsDrawer: user object missing name/fullName:', {
      userId: user,
      userIdKeys: Object.keys(user),
      userIdType: typeof user,
      orderId: fullOrder._id || fullOrder.orderId,
      hasAddressName: !!address.fullName,
      hasAddressPhone: !!address.phone
    });
  }
  
  const items = fullOrder.items || [];
  
  // Build timeline from status history - deduplicate to show each status only once
  const statusHistory = fullOrder.statusHistory || [];
  const timelineMap = new Map();
  const currentOrderStatus = (fullOrder.orderStatus || fullOrder.status || 'PLACED').toUpperCase();
  
  // Add initial PLACED status if not present
  if (statusHistory.length === 0) {
    timelineMap.set('PLACED', { status: 'PLACED', updatedAt: fullOrder.createdAt });
  } else {
    // Process status history, keeping only the most recent entry for each status
    statusHistory.forEach(step => {
      const stepStatus = (step.status || step).toUpperCase();
      const existingEntry = timelineMap.get(stepStatus);
      const stepDate = step.updatedAt || step.createdAt;
      
      if (!existingEntry || !existingEntry.updatedAt || (stepDate && new Date(stepDate) > new Date(existingEntry.updatedAt))) {
        timelineMap.set(stepStatus, {
          status: stepStatus,
          updatedAt: stepDate || step.updatedAt
        });
      }
    });
  }
  
  // Ensure current status is in timeline if not already present
  if (!timelineMap.has(currentOrderStatus)) {
    timelineMap.set(currentOrderStatus, {
      status: currentOrderStatus,
      updatedAt: null // No timestamp if not in history yet
    });
  }
  
  // Convert map to array and sort by status order
  const statusOrder = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
  const timeline = Array.from(timelineMap.values()).sort((a, b) => {
    const indexA = statusOrder.indexOf(a.status);
    const indexB = statusOrder.indexOf(b.status);
    return indexA - indexB;
  });
  
  // Get all available status options
  const allStatusOptions = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
  
  // Get completed statuses from timeline (statuses that have been marked and have a timestamp)
  // Only filter out statuses that have been completed (have updatedAt timestamp) and are not the current order status
  const completedStatuses = new Set(
    timeline
      .filter(step => step.updatedAt !== null && step.updatedAt !== undefined) // Only statuses that were actually marked
      .map(step => step.status.toUpperCase())
      .filter(s => s !== currentOrderStatus) // Don't filter out current status
  );
  
  // Filter out completed statuses from dropdown options (except current status)
  const statusOptions = allStatusOptions.filter(opt => !completedStatuses.has(opt) || opt === currentOrderStatus);
  
  // Handle status dropdown selection (just update local state, don't save yet)
  const handleStatusSelect = (e) => {
    const selectedStatus = e.target.value.toUpperCase();
    setLocalStatus(selectedStatus);
  };
  
  // Handle marking order with selected status
  const handleMarkStatus = async () => {
    const newStatus = localStatus.toUpperCase();
    const oldStatus = fullOrder.orderStatus || fullOrder.status || 'PLACED';
    
    // Don't update if same as current status
    if (newStatus === oldStatus) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      await onUpdateStatus(fullOrder._id || fullOrder.orderId, newStatus);
      // Success - status will be confirmed via useEffect when order prop updates
      alert(`Order status updated to ${newStatus} successfully`);
    } catch (error) {
      // Revert on error
      setLocalStatus(oldStatus);
      alert('Error updating order status: ' + (error.message || 'Unknown error'));
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Generate Google Maps link from address coordinates
  const getGoogleMapsLink = () => {
    const lat = address.latitude;
    const lng = address.longitude;
    if (lat && lng) {
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    // Fallback to address search if no coordinates
    const addressStr = [
      address.addressLine1,
      address.addressLine2,
      address.area,
      address.city,
      address.state,
      address.pincode
    ].filter(Boolean).join(', ');
    if (addressStr) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressStr)}`;
    }
    return null;
  };

  const googleMapsLink = getGoogleMapsLink();

  return (
    <div className="order-details-drawer">
      <div className="details-grid">
        {/* Left Col: User Info & Items */}
        <div className="details-section">
          <h3>Customer Information</h3>
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <p style={{ margin: '8px 0' }}>
              <strong>Name:</strong> {user?.name || user?.fullName || (typeof user === 'object' && user._id ? 'Loading...' : 'Not provided')}
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>Email:</strong> {user?.email && user.email.trim() !== '' ? user.email : 'Not provided'}
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>Phone:</strong> 
              {user?.phone ? (
                <a href={`tel:${user.phone}`} style={{ marginLeft: '8px', color: '#007bff', textDecoration: 'none' }}>
                  {user.phone}
                </a>
              ) : (
                <span style={{ marginLeft: '8px', color: '#666' }}>Not provided</span>
              )}
            </p>
          </div>

          <h3>Delivery Address</h3>
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            {address.addressLine1 && (
              <p style={{ margin: '4px 0' }}>{address.addressLine1}</p>
            )}
            {address.addressLine2 && (
              <p style={{ margin: '4px 0' }}>{address.addressLine2}</p>
            )}
            {(address.area || address.block) && (
              <p style={{ margin: '4px 0' }}>{[address.area, address.block].filter(Boolean).join(', ')}</p>
            )}
            {address.landmark && (
              <p style={{ margin: '4px 0' }}><strong>Landmark:</strong> {address.landmark}</p>
            )}
            <p style={{ margin: '4px 0' }}>
              {[address.city, address.state, address.pincode].filter(Boolean).join(', ')}
            </p>
            {googleMapsLink && (
              <p style={{ margin: '12px 0 0 0' }}>
                <a 
                  href={googleMapsLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#007bff', 
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#e7f3ff',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <span>📍</span> View on Google Maps
                </a>
              </p>
            )}
          </div>

          <h3>Ordered Items</h3>
          <div className="order-items-list">
            {items.length === 0 ? (
              <p>No items found</p>
            ) : (
              items.map((item, idx) => {
                const product = item.productId || {};
                const vendor = product.vendorId || {};
                const productImage = product.images && product.images.length > 0 
                  ? product.images.find(img => img.isPrimary)?.url || product.images[0]?.url 
                  : null;
                
                return (
                  <div key={idx} className="order-item-row" style={{ 
                    marginBottom: '15px', 
                    padding: '15px', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    display: 'flex',
                    gap: '15px'
                  }}>
                    {productImage && (
                      <img 
                        src={productImage} 
                        alt={product.name}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          flexShrink: 0
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'start' }}>
                        <div>
                          <span className="item-name" style={{ fontSize: '15px', fontWeight: '600', display: 'block' }}>
                            {product.name || item.name || 'Unknown Product'}
                          </span>
                          <span style={{ fontSize: '14px', color: '#666', marginTop: '4px', display: 'block' }}>
                            Quantity: {item.quantity || item.qty || 1}
                          </span>
                        </div>
                        <span className="item-meta" style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                          ₹{(item.price || product.price || 0) * (item.quantity || 1)}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.6' }}>
                        {item.size && (
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Size:</strong> {item.size}
                          </div>
                        )}
                        {item.color && (
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Color:</strong> {item.color}
                          </div>
                        )}
                        {product.brand && (
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Brand:</strong> {product.brand}
                          </div>
                        )}
                        {vendor && vendor.name && (
                          <div style={{ marginBottom: '4px', color: '#007bff' }}>
                            <div style={{ marginBottom: '2px' }}>
                              <strong>Vendor:</strong> {vendor.name}
                              {vendor.phone && (
                                <span style={{ marginLeft: '8px', color: '#666' }}>
                                  <a href={`tel:${vendor.phone}`} style={{ color: '#666', textDecoration: 'none' }}>
                                    {vendor.phone}
                                  </a>
                                </span>
                              )}
                            </div>
                            {vendor.address && (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '10px' }}>
                                <strong>Address:</strong> {vendor.address}
                              </div>
                            )}
                          </div>
                        )}
                        {product.vendorSlug && !vendor && (
                          <div style={{ marginBottom: '4px', color: '#007bff' }}>
                            <strong>Vendor Slug:</strong> {product.vendorSlug}
                          </div>
                        )}
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                          <strong>Unit Price:</strong> ₹{item.price || product.price || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4 style={{ marginTop: 0 }}>Order Summary</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''}):</span>
              <span>₹{fullOrder.totalAmount || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd', fontWeight: 'bold', fontSize: '16px' }}>
              <span>Total Amount:</span>
              <span style={{ color: '#28a745' }}>₹{fullOrder.totalAmount || 0}</span>
            </div>
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
              <p><strong>Payment Method:</strong> {
                fullOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                fullOrder.paymentMethod === 'razorpay' ? 'Razorpay' : 
                fullOrder.paymentMethod || 'Not specified'
              }</p>
              <p><strong>Payment Status:</strong> 
                <span style={{ 
                  color: fullOrder.paymentStatus === 'PAID' ? '#28a745' : fullOrder.paymentStatus === 'FAILED' ? '#dc3545' : '#ffc107',
                  marginLeft: '8px',
                  fontWeight: '600'
                }}>
                  {fullOrder.paymentStatus || 'PENDING'}
                </span>
              </p>
            </div>
            {fullOrder.assignedShop && (
              <p style={{ marginTop: '8px', fontSize: '13px' }}>
                <strong>Assigned Shop:</strong> {fullOrder.assignedShop}
              </p>
            )}
            {fullOrder.razorpayOrderId && (
              <p style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                <strong>Razorpay Order ID:</strong> {fullOrder.razorpayOrderId}
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Timeline & Actions */}
        <div className="details-section">
          <h3>Order Timeline</h3>
          <div className="order-timeline">
            {timeline.map((step) => {
              const stepStatus = step.status || step;
              const statusOrder = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED'];
              const currentStatusIndex = statusOrder.indexOf(currentOrderStatus);
              const stepStatusIndex = statusOrder.indexOf(stepStatus);
              const isCompleted = stepStatusIndex <= currentStatusIndex || step.updatedAt !== null;
              const isActive = stepStatus === currentOrderStatus;
              const date = step.updatedAt ? new Date(step.updatedAt).toLocaleString() : 'Pending';
              
              return (
                <div key={stepStatus} className={`timeline-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span className="timeline-title">{stepStatus}</span>
                    <span className="timeline-date">{date}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Select Status</label>
              <select
                value={status}
                onChange={handleStatusSelect}
                disabled={isUpdating}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '6px', 
                  border: '1px solid #ddd',
                  cursor: isUpdating ? 'wait' : 'pointer',
                  opacity: isUpdating ? 0.7 : 1
                }}
              >
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {isUpdating && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  Updating status...
                </div>
              )}
            </div>

            {/* Show "Mark as [status]" button if selected status is different from current status */}
            {status.toUpperCase() !== currentOrderStatus && statusOptions.length > 0 && (
              <button
                className="btn btn-sm btn-success"
                onClick={handleMarkStatus}
                disabled={isUpdating}
                style={{
                  cursor: isUpdating ? 'wait' : 'pointer',
                  opacity: isUpdating ? 0.7 : 1
                }}
              >
                Mark as {status}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Orders;
