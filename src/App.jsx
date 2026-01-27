import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { OrderNotificationProvider } from './contexts/OrderNotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import Login from './pages/Login';
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

const ALLOWED_PATHS_FOR_USER = [
  '/product-category-management',
  '/products',
  '/vendors',
  '/shops',
  '/category-sync',
  '/discounts-coupons'
];

function AppContent() {
  const { isAuthenticated, isAdmin } = useAuth();

  const ProtectedRoute = ({ element, path }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    if (isAdmin) return element;
    if (ALLOWED_PATHS_FOR_USER.includes(path)) return element;
    
    return <Navigate to="/product-category-management" replace />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={isAdmin ? "/dashboard" : "/product-category-management"} replace />} />
        
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} path="/dashboard" />} />
        <Route path="/analytics" element={<ProtectedRoute element={<AnalyticsDashboard />} path="/analytics" />} />
        <Route path="/user-seller-management" element={<ProtectedRoute element={<UserSellerManagement />} path="/user-seller-management" />} />
        <Route path="/product-category-management" element={<ProtectedRoute element={<ProductCategoryManagement />} path="/product-category-management" />} />
        <Route path="/order-transaction-monitoring" element={<ProtectedRoute element={<OrderTransactionMonitoring />} path="/order-transaction-monitoring" />} />
        <Route path="/discounts-coupons" element={<ProtectedRoute element={<DiscountsCoupons />} path="/discounts-coupons" />} />
        <Route path="/notifications" element={<ProtectedRoute element={<Notifications />} path="/notifications" />} />
        <Route path="/products" element={<ProtectedRoute element={<ProductsList />} path="/products" />} />
        <Route path="/vendors" element={<ProtectedRoute element={<VendorsList />} path="/vendors" />} />
        <Route path="/super-admin" element={<ProtectedRoute element={<SuperAdminPanel />} path="/super-admin" />} />
        <Route path="/orders" element={<ProtectedRoute element={<Orders />} path="/orders" />} />
        <Route path="/delivery-boys" element={<ProtectedRoute element={<DeliveryBoys />} path="/delivery-boys" />} />
        <Route path="/shops" element={<ProtectedRoute element={<ShopsList />} path="/shops" />} />
        <Route path="/category-sync" element={<ProtectedRoute element={<CategorySync />} path="/category-sync" />} />
        <Route path="/settings" element={<ProtectedRoute element={<Settings />} path="/settings" />} />
        
        <Route path="/" element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : isAdmin ? (
            <Dashboard />
          ) : (
            <Navigate to="/product-category-management" replace />
          )
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <OrderNotificationProvider>
        <AppContent />
      </OrderNotificationProvider>
    </AuthProvider>
  );
}

export default App;
