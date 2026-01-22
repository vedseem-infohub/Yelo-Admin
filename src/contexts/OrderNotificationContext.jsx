import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ordersAPI } from '../services/api';

const OrderNotificationContext = createContext();

export const useOrderNotifications = () => {
  const context = useContext(OrderNotificationContext);
  if (!context) {
    throw new Error('useOrderNotifications must be used within OrderNotificationProvider');
  }
  return context;
};

export const OrderNotificationProvider = ({ children }) => {
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isPolling, setIsPolling] = useState(false);

  // Check for new orders
  const checkForNewOrders = useCallback(async () => {
    try {
      // Only check if we have a baseline count (polling is active)
      if (lastOrderCount === 0) {
        return;
      }
      
      // Fetch just the latest 10 orders for notification checking
      const response = await ordersAPI.getAllAdmin({ page: 1, limit: 10 });
      const orders = response.data || [];
      const currentCount = response.total || orders.length; // Use total from paginated response

      // If we have a previous count and current is higher, new orders arrived
      // Only notify if count increased (truly new orders)
      if (lastOrderCount > 0 && currentCount > lastOrderCount) {
        const newOrderCount = currentCount - lastOrderCount;
        const newOrders = orders.slice(0, Math.min(newOrderCount, orders.length)); // Get the newest orders
        
        // Create notification for each new order
        // We check for duplicates inside addNotification
        newOrders.forEach(order => {
          const orderIdStr = (order._id || order.orderId)?.toString();
          
          // Use 'name' field first, then fallback to fullName
          const customerName = order.userId?.name || order.userId?.fullName || 'Unknown Customer';
          const amount = order.totalAmount || 0;
          
          addNotification({
            type: 'new-order',
            message: `New order placed by ${customerName} - ₹${amount}`,
            orderId: order._id || order.orderId,
            order: order,
            timestamp: Date.now()
          });
        });
      }

      setLastOrderCount(currentCount);
    } catch (error) {
      // Silently fail - don't disrupt the UI
      console.error('Error checking for new orders:', error);
    }
  }, [lastOrderCount]);

  // Add notification (with duplicate checking)
  const addNotification = (notification) => {
    // Check if notification already exists for this order
    setNotifications(prev => {
      const orderIdStr = (notification.orderId?._id || notification.orderId)?.toString();
      const alreadyExists = prev.some(n => {
        const existingOrderId = (n.orderId?._id || n.orderId)?.toString();
        return existingOrderId === orderIdStr;
      });
      
      if (alreadyExists) {
        return prev; // Don't add duplicate
      }
      
      const id = Date.now() + Math.random();
      const newNotification = { ...notification, id };
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        removeNotification(id);
      }, 10000);
      
      return [newNotification, ...prev];
    });
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Initialize polling
  useEffect(() => {
    // Clear any existing notifications on mount (prevent showing old orders)
    setNotifications([]);
    
    // Initial fetch to set baseline
    const initializeCount = async () => {
      try {
        // Fetch just 1 order to get the total count quickly
        const response = await ordersAPI.getAllAdmin({ page: 1, limit: 1 });
        const currentCount = response.total || response.data?.length || 0;
        // Set baseline count without triggering notifications
        setLastOrderCount(currentCount);
        // Wait a bit before starting polling to ensure baseline is set
        setTimeout(() => {
          setIsPolling(true);
        }, 2000); // Wait 2 seconds before starting to poll
      } catch (error) {
        // Silently fail
        setIsPolling(true); // Start polling anyway
      }
    };

    initializeCount();
  }, []);

  // Poll for new orders every 10 seconds
  useEffect(() => {
    if (!isPolling) return;

    const intervalId = setInterval(() => {
      checkForNewOrders();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [isPolling, checkForNewOrders]);

  // Refresh order count when needed (called from Orders page)
  const refreshOrderCount = useCallback(() => {
    checkForNewOrders();
  }, [checkForNewOrders]);

  return (
    <OrderNotificationContext.Provider
      value={{
        notifications,
        removeNotification,
        refreshOrderCount,
        setLastOrderCount
      }}
    >
      {children}
    </OrderNotificationContext.Provider>
  );
};

