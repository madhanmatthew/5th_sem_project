import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:3001';

// NEW: Predefined status options for clarity and consistency
const statusOptions = {
  Queued: "Your order is in the queue.",
  Preparing: "Your order has been accepted and is being prepared.",
  Ready: "Your order is ready for pickup!",
};

function App() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders`);
      if (!response.ok) throw new Error('Network response was not ok');
      let data = await response.json();
      const statusOrder = { 'Pending': 1, 'Queued': 2, 'Preparing': 3, 'Ready': 4, 'Cancelled': 5, 'Completed': 6 };
      data.sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || b.id - a.id);
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setError("Could not connect to the server. Please make sure it's running.");
    } finally {
      setIsLoading(false);
    }
  };

  // MODIFIED: This function now sends a status keyword and a message string
  const updateOrderStatus = async (orderId, status, message) => {
    try {
      await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, message }),
      });
      fetchOrders(); 
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update order status. Please check your connection.");
    }
  };
  
  // NEW: Handler for the dropdown menu
  const handleStatusChange = (orderId, newStatus) => {
    const newMessage = statusOptions[newStatus];
    updateOrderStatus(orderId, newStatus, newMessage);
  };

  // NEW: Handler for setting a custom time message
  const handleSetTime = (orderId) => {
    const time = prompt("Enter the estimated wait time (e.g., '10-15 mins'):");
    if (time) { // Only update if the user enters something
      updateOrderStatus(orderId, 'Preparing', `Will be ready in ${time}.`);
    }
  };
  
  // NEW: Handler for canceling an order
  const handleCancelOrder = (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order? This cannot be undone.")) {
      updateOrderStatus(orderId, 'Cancelled', 'Sorry, your order has been cancelled as an item is unavailable.');
    }
  };


  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <div className="App"><p>Loading orders...</p></div>;
  if (error) return <div className="App"><p style={{ color: 'red' }}>{error}</p></div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Restaurant Admin Dashboard</h1>
        <h2>Active Orders: {orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length}</h2>
      </header>
      <div className="order-container">
        {orders.length === 0 ? ( <p>No orders yet...</p> ) : (
          orders.map((order) => (
            <div key={order.id} className={`order-card ${order.status.toLowerCase()}`}>
              <h3>Order #{order.id} - <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span></h3>
              <p>"{order.message}"</p>
              <ul>
                {order.items.map((item, index) => ( <li key={index}>{item.quantity} x {item.name}</li> ))}
              </ul>
              
              { /* MODIFIED: New interactive button group */ }
              <div className="button-group">
                <select 
                  value={order.status} 
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  disabled={['Completed', 'Cancelled'].includes(order.status)}
                >
                  <option value="Pending" disabled>Pending</option>
                  {Object.keys(statusOptions).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <button onClick={() => handleSetTime(order.id)}>Set Custom Time</button>
                <button className="complete-btn" onClick={() => updateOrderStatus(order.id, 'Completed', 'Your order has been completed.')}>Mark as Completed</button>
                <button className="cancel-btn" onClick={() => handleCancelOrder(order.id)}>Cancel Order</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;