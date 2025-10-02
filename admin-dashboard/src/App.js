import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:3001';

function App() {
  const [orders, setOrders] = useState([]);
  // NEW: State for loading and error messages
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // MODIFIED: fetchOrders function now handles loading and error states
  const fetchOrders = async () => {
    // Don't set loading to true on every poll, only on initial load.
    // setError(null); // Optional: clear previous errors on each fetch

    try {
      const response = await fetch(`${API_URL}/api/orders`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      let data = await response.json();

      // NEW: Sort orders to show active ones first (Pending, Preparing, Ready)
      const statusOrder = { 'Pending': 1, 'Preparing': 2, 'Ready': 3, 'Completed': 4 };
      data.sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || b.id - a.id);
      
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      // NEW: Set a user-friendly error message
      setError("Could not connect to the server. Please make sure it's running.");
    } finally {
      // NEW: Stop the loading indicator after the first fetch
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchOrders(); 
    } catch (error) {
      console.error("Failed to update status:", error);
      // NEW: Notify user if update fails
      alert("Failed to update order status. Please check your connection.");
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // NEW: Show a loading message on initial load
  if (isLoading) {
    return <div className="App"><p>Loading orders...</p></div>;
  }

  // NEW: Show an error message if the fetch failed
  if (error) {
    return <div className="App"><p style={{ color: 'red' }}>{error}</p></div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Restaurant Admin Dashboard</h1>
        {/* NEW: Display the number of active orders */}
        <h2>Active Orders: {orders.filter(o => o.status !== 'Completed').length}</h2>
      </header>
      <div className="order-container">
        {orders.length === 0 ? (
          <p>No orders yet...</p>
        ) : (
          orders.map((order) => (
            // MODIFIED: Added a conditional class for completed orders
            <div key={order.id} className={`order-card ${order.status === 'Completed' ? 'completed' : ''}`}>
              <h3>Order #{order.id} - <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span></h3>
              <p>Time: {order.timestamp}</p>
              <ul>
                {order.items.map((item, index) => (
                  <li key={index}>{item.quantity} x {item.name}</li>
                ))}
              </ul>
              <div className="button-group">
                <button onClick={() => updateOrderStatus(order.id, 'Preparing')}>Accept & Prepare</button>
                <button onClick={() => updateOrderStatus(order.id, 'Ready')}>Mark as Ready</button>
                <button onClick={() => updateOrderStatus(order.id, 'Completed')}>Mark as Completed</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
