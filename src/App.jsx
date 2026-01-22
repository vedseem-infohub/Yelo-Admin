import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { OrderNotificationProvider } from './contexts/OrderNotificationContext';
import Dashboard from './pages/Dashboard';
import ProductsList from './pages/ProductsList';
import VendorsList from './pages/VendorsList';
import SuperAdminPanel from './pages/SuperAdminPanel';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import UserSellerManagement from './pages/UserSellerManagement';
import ProductCategoryManagement from './pages/ProductCategoryManagement';
import OrderTransactionMonitoring from './pages/OrderTransactionMonitoring';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import DiscountsCoupons from './pages/DiscountsCoupons';
import Notifications from './pages/Notifications';
import DeliveryBoys from './pages/DeliveryBoys';
import ShopsList from './pages/ShopsList';
import CategorySync from './pages/CategorySync';
import './App.css';
import './pages/Dashboard.css';
import './pages/ProductsList.css';
import './pages/VendorsList.css';
import './pages/SuperAdminPanel.css';
import './pages/Orders.css';
import './pages/Settings.css';
import './pages/UserSellerManagement.css';
import './pages/ProductCategoryManagement.css';
import './pages/OrderTransactionMonitoring.css';

function App() {
  return (
    <OrderNotificationProvider>
    <Router>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/user-seller-management" element={<UserSellerManagement />} />
        <Route path="/product-category-management" element={<ProductCategoryManagement />} />
        <Route path="/order-transaction-monitoring" element={<OrderTransactionMonitoring />} />
        <Route path="/discounts-coupons" element={<DiscountsCoupons />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/products" element={<ProductsList />} />
        <Route path="/vendors" element={<VendorsList />} />
        <Route path="/super-admin" element={<SuperAdminPanel />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/delivery-boys" element={<DeliveryBoys />} />
        <Route path="/shops" element={<ShopsList />} />
        <Route path="/category-sync" element={<CategorySync />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </Router>
    </OrderNotificationProvider>
  );
}

export default App;
