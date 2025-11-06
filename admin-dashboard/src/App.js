/* === ADMIN DASHBOARD - App.js (THE ROUTER) === */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard'; // We will create this next
import './App.css';

// A simple check to see if we have a login token
const isAuthenticated = () => {
  return localStorage.getItem('admin_token') !== null;
};

// A "Protected Route" component.
// If you are logged in, it shows the component you want (e.g., Dashboard).
// If not, it redirects you to the /login page.
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* /login will show the Login component */}
          <Route path="/login" element={<Login />} />
          
          {/* / (the root) will be our protected dashboard */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Any other path will redirect to the dashboard or login */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;