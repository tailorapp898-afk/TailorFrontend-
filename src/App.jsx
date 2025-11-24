import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import CustomersPage from "./pages/CustomersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import MeasurementsPage from "./pages/MeasurementsPage";
import InvoicesPage from "./pages/InvoicesPage";
import TemplatesPage from "./pages/TemplatesPage";
import Family from "./pages/Family";

// UI
import { Toaster } from "@/components/ui/toaster";
import "./App.css";

function App() {
  // Service Worker Registration for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('✅ PWA Service Worker Registered');
          })
          .catch(err => {
            console.log('❌ PWA Registration Failed: ', err);
          });
      });
    }
  }, []);

  return (
    <AuthProvider>
      <Toaster />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="/" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          
          <Route path="/customers" element={
              <ProtectedRoute><CustomersPage /></ProtectedRoute>
          } />
          
          <Route path="/measurements" element={
              <ProtectedRoute><MeasurementsPage /></ProtectedRoute>
          } />
          
          <Route path="/invoices" element={
              <ProtectedRoute><InvoicesPage /></ProtectedRoute>
          } />
          
          <Route path="/templates" element={
              <ProtectedRoute><TemplatesPage /></ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
              <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
          } />
          
          <Route path="/settings" element={
              <ProtectedRoute><SettingsPage /></ProtectedRoute>
          } />
          
          <Route path="/families" element={
              <ProtectedRoute><Family/></ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;