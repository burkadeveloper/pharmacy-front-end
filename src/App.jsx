import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import DispenseRequests from "./pages/DispenseRequests";
import AdminProfile from "./pages/AdminProfile";

// ... inside Routes

// Lazy load pages for performance
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const ReceiveOrder = lazy(() => import("./pages/ReceiveOrder"));
const StockList = lazy(() => import("./pages/StockList"));
// const Dispense = lazy(() => import("./pages/Dispense"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Companies = lazy(() => import("./pages/Companies"));
const Drugs = lazy(() => import("./pages/Drugs"));
const Reports = lazy(() => import("./pages/Reports"));

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="receive" element={<ReceiveOrder />} />
          <Route path="stock" element={<StockList />} />
          {/* <Route path="dispense" element={<Dispense />} /> */}
          <Route path="analytics" element={<Analytics />} />
          <Route path="companies" element={<Companies />} />
          <Route path="drugs" element={<Drugs />} />
          <Route path="reports" element={<Reports />} />
          <Route path="dispense-requests" element={<DispenseRequests />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
