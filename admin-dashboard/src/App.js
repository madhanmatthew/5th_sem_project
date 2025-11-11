import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

// This function checks if we have a token
const isAuthenticated = () => {
  return localStorage.getItem('admin_token') !== null;
};

// --- THIS IS THE UPDATED LOGIC ---

// ProtectedRoute: If you are logged in, show the page. If not, go to /login.
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

// NEW: PublicRoute: If you are logged in, go to the dashboard. If not, show the login page.
const PublicRoute = ({ children }) => {
  return isAuthenticated() ? <Navigate to="/" /> : children;
};

// --- END OF UPDATED LOGIC ---

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* /login is now a PublicRoute */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          
          {/* / (the root) is still our protected dashboard */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Any other path will redirect to the root */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;