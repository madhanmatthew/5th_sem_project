import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:3001';

function App() {
  const [orders, setOrders] = useState([]);

  // Function to fetch orders from the backend
  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  // Function to update an order's status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchOrders(); // Re-fetch orders to show the update immediately
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // useEffect to fetch orders when the component loads and then poll every 5 seconds
  useEffect(() => {
    fetchOrders(); // Fetch initial data
    const interval = setInterval(fetchOrders, 5000); // Poll for new orders every 5 seconds
    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Restaurant Admin Dashboard</h1>
      </header>
      <div className="order-container">
        {orders.length === 0 ? (
          <p>No orders yet...</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card">
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