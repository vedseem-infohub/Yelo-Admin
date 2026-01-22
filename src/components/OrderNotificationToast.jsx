import React from 'react';
import { useOrderNotifications } from '../contexts/OrderNotificationContext';
import { useNavigate } from 'react-router-dom';
import './OrderNotificationToast.css';

function OrderNotificationToast() {
  const { notifications, removeNotification } = useOrderNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification) => {
    if (notification.type === 'new-order') {
      navigate('/admin/orders');
      removeNotification(notification.id);
    }
  };

  return (
    <div className="order-notification-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`order-notification-toast ${notification.type}`}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="notification-icon">
            {notification.type === 'new-order' ? '🛒' : '📢'}
          </div>
          <div className="notification-content">
            <div className="notification-title">New Order!</div>
            <div className="notification-message">{notification.message}</div>
          </div>
          <button
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default OrderNotificationToast;

