const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

// --- Middleware ---
<<<<<<< HEAD
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
=======
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Allow the server to understand JSON from requests
app.use(express.static('public')); // Serve static files from the 'public' folder (for images)
>>>>>>> 41c7160f4e0e0ad7d15f9d82d72cb828b96f65a2

// --- In-Memory Database ---
let orders = [];
let orderIdCounter = 1;
const menu = [
  { id: 1, name: 'Paneer Butter Masala', price: 250, image: '/images/paneer.jpg' },
  { id: 2, name: 'Garlic Naan', price: 50, image: '/images/naan.jpg' },
  { id: 3, name: 'Coke', price: 40, image: '/images/coke.jpg' },
];

// --- API Endpoints ---

app.get('/api/menu', (req, res) => {
  console.log('Request received for /api/menu');
  res.json(menu);
});

<<<<<<< HEAD
=======
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
>>>>>>> 41c7160f4e0e0ad7d15f9d82d72cb828b96f65a2
app.post('/api/orders', (req, res) => {
  const newOrder = { 
    id: orderIdCounter++, 
    items: req.body.items, 
    status: 'Pending',
    message: 'Your order has been placed and is waiting for confirmation.',
    timestamp: new Date().toLocaleTimeString() 
  };
  orders.push(newOrder);
  console.log('New Order Received:', newOrder);
  res.status(201).json(newOrder);
});

<<<<<<< HEAD
app.get('/api/orders', (req, res) => {
  console.log('Request received for /api/orders');
  res.json(orders);
});

=======
// PUT /api/orders/:id/status -> Updates the status and message of a specific order
>>>>>>> 41c7160f4e0e0ad7d15f9d82d72cb828b96f65a2
app.put('/api/orders/:id/status', (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status, message } = req.body;
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

<<<<<<< HEAD
// ADDED: The missing endpoint for the customer app to get a single order's status
app.get('/api/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id);
  const order = orders.find(o => o.id === orderId);

  if (order) {
    res.json(order);
  } else {
    res.status(404).send('Order not found');
  }
});

// --- DELETED: The old, duplicate endpoints that were causing conflicts have been removed from here ---


// --- Start the Server ---
app.listen(port, () => {
  console.log(`✅ Backend server running at http://localhost:${port}`);
});


//new backend code
=======

// --- Start the Server -- 0-
app.listen(port, () => {
  console.log(`✅ Backend server running at http://localhost:${port}`);
});
>>>>>>> 41c7160f4e0e0ad7d15f9d82d72cb828b96f65a2
