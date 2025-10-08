const express = require('express');
const cors = require('cors'); // Allows your frontend to talk to this backend
const app = express();
const port = 3001; // The port your backend will run on

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Allow the server to understand JSON from requests
app.use(express.static('public')); // NEW: Serve static files from the 'public' folder

// --- In-Memory Database (No DB setup needed!) ---
let orders = [];
let orderIdCounter = 1;
const menu = [
  { id: 1, name: 'Paneer Butter Masala', price: 250, image: '/images/paneer.jpg' },
  { id: 2, name: 'Garlic Naan', price: 50, image: '/images/naan.jpg' },
  { id: 3, name: 'Coke', price: 40, image: '/images/coke.jpg' },
];

// --- API Endpoints ---

// GET /api/menu -> Returns the hardcoded menu
app.get('/api/menu', (req, res) => {
  console.log('Request received for /api/menu');
  res.json(menu);
});

// MODIFIED: Orders now have a 'status' and a 'message'
app.post('/api/orders', (req, res) => {
  const newOrder = { 
    id: orderIdCounter++, 
    items: req.body.items, 
    status: 'Pending', // The keyword for the status
    message: 'Your order has been placed and is waiting for confirmation.', // The customer-facing message
    timestamp: new Date().toLocaleTimeString() 
  };
  orders.push(newOrder);
  console.log('New Order Received:', newOrder);
  res.status(201).json(newOrder);
});

app.get('/api/orders', (req, res) => {
  console.log('Request received for /api/orders');
  res.json(orders);
});

// MODIFIED: This endpoint now accepts both a status and a message
app.put('/api/orders/:id/status', (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status, message } = req.body; // Destructure both from the request
  const order = orders.find(o => o.id === orderId);

  if (order) {
    order.status = status;
    order.message = message;
    console.log(`Updated order ${orderId} to status: ${status}, message: ${message}`);
    res.json(order);
  } else {
    res.status(404).send('Order not found');
  }
});


   
// POST /api/orders -> Receives a new order and adds it to our "database"
app.post('/api/orders', (req, res) => {
  const newOrder = { 
    id: orderIdCounter++, 
    items: req.body.items, 
    status: 'Pending', // Default status
    timestamp: new Date().toLocaleTimeString() 
  };
  orders.push(newOrder);
  console.log('New Order Received:', newOrder);
  res.status(201).json(newOrder);
});

// GET /api/orders -> Returns all current orders for the admin dashboard
app.get('/api/orders', (req, res) => {
  console.log('Request received for /api/orders');
  res.json(orders);
});

// PUT /api/orders/:id/status -> Updates the status of a specific order
app.put('/api/orders/:id/status', (req, res) => {
  const orderId = parseInt(req.params.id);
  const newStatus = req.body.status;
  const order = orders.find(o => o.id === orderId);

  if (order) {
    order.status = newStatus;
    console.log(`Updated order ${orderId} to status: ${newStatus}`);
    res.json(order);
  } else {
    res.status(404).send('Order not found');
  }
});


// --- Start the Server ---
app.listen(port, () => {
  console.log(`✅ Backend server running at http://localhost:${port}`);
});