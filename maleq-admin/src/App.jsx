import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Login from './pages/Login';
import CustomerRegister from './pages/CustomerRegister';
import CustomerDashboard from './pages/CustomerDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AddAdmin from './pages/AddAdmin';
import AdminDashboard from './pages/AdminDashboard'; // Import the new dashboard
import InviteAdmin from './pages/InviteAdmin';       // Import the new invite page
import OrderingSystem from './components/OrderingSystem';
import OrderTracking from './pages/OrderTracking';
import CustomerOrders from './pages/CustomerOrders';
import CompanyStoryPage from './pages/CompanyStoryPage';
import { OrderProvider } from './context/OrderContext';

function InitialRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      // Redirect to the launching screen on every fresh app load/refresh if in the customer area
      if (location.pathname.startsWith('/customer') && location.pathname !== '/customer/order') {
        navigate('/customer/order', { replace: true });
      }
    }
  }, [navigate, location]);

  return null;
}

function App() {
  return (
    <OrderProvider>
      <Router>
        <InitialRedirect />
        <Routes>
          <Route path="/" element={<Navigate to="/customer/order" replace />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<CustomerRegister />} />
          
          {/* Superadmin Routes */}
          <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/add-admin" element={<AddAdmin />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/invite" element={<InviteAdmin />} />

          {/* Customer Routes */}
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/home" element={<Navigate to="/customer/dashboard" replace />} />
          <Route path="/customer/orders" element={<CustomerOrders />} />
          <Route path="/customer/order" element={<OrderingSystem />} />
          <Route path="/customer/story" element={<CompanyStoryPage />} />
          <Route path="/track-order" element={<OrderTracking />} />
          <Route path="/track-order/:trackingToken" element={<OrderTracking />} />
        </Routes>
      </Router>
    </OrderProvider>
  );
}

export default App;