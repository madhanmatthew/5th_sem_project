import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'https://restaurant-app-backend-qwfb.onrender.com';
const socket = io(API_URL); // Connect to your backend socket

function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get the auth token
  const getAuthToken = () => {
    return localStorage.getItem('admin_token');
  };

  // Function to fetch all orders on initial load
  const fetchOrders = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_URL}/api/orders`, {
        headers: { 'x-auth-token': token }
      });
      
      // Sort orders by status
      const statusOrder = { 'Pending': 1, 'Queued': 2, 'Preparing': 3, 'Ready': 4, 'Cancelled': 5, 'Completed': 6 };
      const sortedData = response.data.sort((a, b) => 
        statusOrder[a.status] - statusOrder[b.status] || b.id - a.id
      );
      setOrders(sortedData);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Could not fetch orders. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update an order's status
  const updateOrderStatus = async (orderId, status, message) => {
    try {
      const token = getAuthToken();
      // We don't need to manually update state, the socket will do it
      await axios.put(`${API_URL}/api/orders/${orderId}/status`, 
        { status, message },
        { headers: { 'x-auth-token': token } }
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update order status.");
    }
  };

  // --- Predefined Statuses ---
  const statusOptions = {
    Queued: "Your order is in the queue.",
    Preparing: "Your order has been accepted and is being prepared.",
    Ready: "Your order is ready for pickup!",
  };

  // Handlers for the buttons
  const handleStatusChange = (orderId, newStatus) => {
    const newMessage = statusOptions[newStatus];
    updateOrderStatus(orderId, newStatus, newMessage);
  };

  const handleSetTime = (orderId) => {
    const time = prompt("Enter the estimated wait time (e.g., '10-15 mins'):");
    if (time) {
      updateOrderStatus(orderId, 'Preparing', `Will be ready in ${time}.`);
    }
  };

  const handleCancelOrder = (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      updateOrderStatus(orderId, 'Cancelled', 'Sorry, your order has been cancelled.');
    }
  };

  // useEffect to set up socket listeners
  useEffect(() => {
    // 1. Fetch initial data
    fetchOrders();

    // 2. Listen for new orders
    socket.on('new_order', (newOrder) => {
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
    });

    // 3. Listen for status updates
    socket.on('order_update', (updatedOrder) => {
      setOrders((prevOrders) =>
        prevOrders.map(order =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
    });

    // 4. Clean up listeners on unmount
    return () => {
      socket.off('new_order');
      socket.off('order_update');
    };
  }, []);

  if (isLoading) return <p>Loading orders...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="order-container">
      {orders.length === 0 ? (
        <p>No active orders yet...</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className={`order-card ${order.status.toLowerCase()}`}>
            <h3>
              Order #{order.id} ({order.user_name || 'Customer'})
              <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span>
            </h3>
            <p>"{order.message}"</p>
            <ul>
              {order.items.map((item, index) => (
                <li key={index}>{item.quantity} x {item.name}</li>
              ))}
            </ul>

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
  );
}

export default OrderManager;