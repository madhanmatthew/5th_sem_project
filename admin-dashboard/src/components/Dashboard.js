/* === ADMIN DASHBOARD - Dashboard.js (The Main View) === */
import React, { useState } from 'react';
import OrderManager from './OrderManager';
import MenuManager from './MenuManager';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('orders');

  const handleLogout = () => {
    localStorage.removeItem('admin_token'); // Clear the token
    window.location.reload(); // Refresh the page (will redirect to /login)
  };

  return (
    <div>
      <header className="App-header">
        <h1>Restaurant Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>
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