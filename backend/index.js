const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

app.get('/api/orders', (req, res) => {
  console.log('Request received for /api/orders');
  res.json(orders);
});

app.put('/api/orders/:id/status', (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status, message } = req.body;
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