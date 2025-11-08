/* === ADMIN DASHBOARD - Login.js (With Skip Button) === */
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'https://restaurant-app-backend-qwfb.onrender.com';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    // ... (your existing handleLogin function)
    e.preventDefault(); 
    setError(''); 

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });
      const { token, user } = response.data;
      if (user && user.isAdmin) {
        localStorage.setItem('admin_token', token);
        window.location.reload();
      } else {
        setError('Access Denied: You are not an administrator.');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Invalid email or password. Please try again.');
    }
  };

  // NEW: Function to bypass login
  const handleSkip = () => {
    // 1. Set a fake token. This is just to pass the router check in App.js.
    localStorage.setItem('admin_token', 'DEV_BYPASS_TOKEN');
    // 2. Reload the page. The router will now let us in.
    window.location.reload();
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Admin Login</h2>
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
        <button type="submit">Login</button>
        
        {/* NEW: Skip Button */}
        <button 
          type="button" 
          onClick={handleSkip} 
          style={{ backgroundColor: '#6c757d', marginTop: '1rem' }}
        >
          Skip Login (Dev)
        </button>
      </form>
    </div>
  );
}

export default Login;