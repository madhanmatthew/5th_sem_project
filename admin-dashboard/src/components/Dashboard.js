/* === ADMIN DASHBOARD - Dashboard.js (The Main View) === */
import React, { useState } from 'react';
import OrderManager from './OrderManager';
import MenuManager from './MenuManager';
import StatsDisplay from './StatsDisplay'; // <-- 1. IMPORT THE NEW COMPONENT

function Dashboard() {
  const [activeTab, setActiveTab] = useState('orders');

  const handleLogout = () => {
    localStorage.removeItem('admin_token'); // Clear the token
    window.location.reload(); // Refresh the page (will redirect to /login)
  };

  return (
    <div>
      <header className="App-header">
        <h1>Sagar's Cafe (Admin)</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>
      
      {/* --- 2. ADD THE STATS COMPONENT HERE --- */}
      <StatsDisplay />

      <nav className="dashboard-nav">
        <button 
          onClick={() => setActiveTab('orders')} 
          className={activeTab === 'orders' ? 'active' : ''}
        >
          Manage Orders
        </button>
        <button 
          onClick={() => setActiveTab('menu')}
          className={activeTab === 'menu' ? 'active' : ''}
        >
          Manage Menu
        </button>
      </nav>
      <main>
        {activeTab === 'orders' && <OrderManager />}
        {activeTab === 'menu' && <MenuManager />}
      </main>
    </div>
  );
}

export default Dashboard;