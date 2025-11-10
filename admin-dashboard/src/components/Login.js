import React, { useState } from 'react';
import axios from 'axios';

// This is your live, deployed backend server
const API_URL = 'https://restaurant-app-backend-qwfb.onrender.com';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // NEW: Add loading state

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setError(''); 
    setIsLoading(true); // NEW: Set loading to true

    try {
      // 1. "Wake up" the server (optional, but good practice)
      // We'll give it a 30-second timeout
      await axios.get(`${API_URL}/api/menu`, { timeout: 30000 });

      // 2. Send login request to the backend
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      // 3. Check if the user is an admin
      if (user && user.isAdmin) {
        // 4. Save the REAL token to localStorage
        localStorage.setItem('admin_token', token);
        // 5. Reload the page to go to the dashboard
        window.location.reload();
      } else {
        setError('Access Denied: You are not an administrator.');
      }

    } catch (err) {
      console.error('Login failed:', err);
      // Check for timeout error vs. wrong password error
      if (err.code === 'ECONNABORTED') {
        setError('Server is waking up. Please try again in 30 seconds.');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setIsLoading(false); // NEW: Set loading to false
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Sagar's Cafe Admin Login</h2>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p>{error}</p>}
        
        {/* MODIFIED: Show loading text on the button */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Waking up server...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default Login;