import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Get the deployed API URL
const API_URL = 'https://restaurant-app-backend-qwfb.onrender.com';

// This is a helper function to get your saved login token
const getAuthToken = () => {
  return localStorage.getItem('admin_token');
};

function StatsDisplay() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    completedCount: 0,
    cancelledCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No auth token found');
        }
        
        // Fetch data from the new endpoint you created
        const response = await axios.get(`${API_URL}/api/admin/stats`, {
          headers: { 'x-auth-token': token }
        });
        
        setStats(response.data); // Save the stats
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Could not load stats. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []); // The empty array [] means this runs once

  if (isLoading) {
    return <div className="stats-container">Loading stats...</div>;
  }

  if (error) {
    return <div className="stats-container"><p style={{ color: 'red' }}>{error}</p></div>;
  }

  return (
    <div className="stats-container">
      <div className="stat-card revenue">
        <span className="stat-value">₹{stats.totalRevenue}</span>
        <span className="stat-label">Total Revenue (Today)</span>
      </div>
      <div className="stat-card completed">
        <span className="stat-value">{stats.completedCount}</span>
        <span className="stat-label">Orders Completed (Today)</span>
      </div>
      <div className="stat-card cancelled">
        <span className="stat-value">{stats.cancelledCount}</span>
        <span className="stat-label">Orders Cancelled (Today)</span>
      </div>
    </div>
  );
}

export default StatsDisplay;