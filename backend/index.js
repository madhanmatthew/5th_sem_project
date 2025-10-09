const express = require('express');
const cors = require('cors'); // Allows your frontend to talk to this backend
const app = express();
const port = 3001; // The port your backend will run on

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Allow the server to understand JSON from requests
app.use(express.static('public')); // Serve static files from the 'public' folder (for images)

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

// GET /api/orders -> Returns all current orders for the admin dashboard
app.get('/api/orders', (req, res) => {
  console.log('Request received for /api/orders');
  res.json(orders);
});

// --- NEW ROUTE ---
// GET /api/orders/:id -> Returns a single order by its ID
// This was the missing piece causing the 404 error in the customer app.
app.get('/api/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id, 10);
    const order = orders.find(o => o.id === orderId);
    console.log(`Request received for order #${orderId}`);

    if (order) {
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
    status: 'Pending', // The keyword for the status
    message: 'Your order has been placed and is waiting for confirmation.', // The customer-facing message
    timestamp: new Date().toLocaleTimeString() 
  };
  orders.push(newOrder);
  console.log('New Order Received:', newOrder);
  res.status(201).json(newOrder);
});

// PUT /api/orders/:id/status -> Updates the status and message of a specific order
app.put('/api/orders/:id/status', (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status, message } = req.body; // Destructure both from the request
  const order = orders.find(o => o.id === orderId);

  if (order && status && message) { // Ensure status and message are provided
    order.status = status;
    order.message = message;
    console.log(`Updated order ${orderId} to status: ${status}, message: "${message}"`);
    res.json(order);
  } else if (!order) {
    res.status(404).send('Order not found');
  } else {
    res.status(400).send('Bad Request: Status and message are required.');
  }
});


// --- Start the Server -- 0-
app.listen(port, () => {
  console.log(`✅ Backend server running at http://localhost:${port}`);
});
