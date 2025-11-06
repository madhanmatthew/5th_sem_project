const express = require('express');
const cors = require('cors'); 
const path = require('path'); // <<< 1. REQUIRE THE PATH MODULE
const app = express();
const port = 3001; 

// --- Middleware ---
app.use(cors()); 
app.use(express.json()); 

// 2. --- CORRECTED STATIC FILE SERVING ---
// This line maps the virtual URL path '/images' to the physical folder './images'
// __dirname is the current directory (the 'backend' folder).
app.use('/images', express.static(path.join(__dirname, 'images'))); 

// Note: You can remove app.use(express.static('public')); if you are not using a 'public' folder.

// --- In-Memory Database (UPDATED MENU for Sagar Cafe) ---
let orders = [];
let orderIdCounter = 1;

// 3. --- MENU UPDATED TO MATCH CAFE NAMES/PATHS ---
const menu = [
    // This is the combined menu that the customer app expects to see
    // The images now point to the files you put in backend/images
    { id: 1, name: 'Spicy Paneer Wrap', price: 220.00, image: '/images/paneerwrap.png', category: 'Sandwiches & Wraps' },
    { id: 2, name: 'Cheesy Croissant Sandwich', price: 280.00, image: '/images/croissant.png', category: 'Sandwiches & Wraps' },
    { id: 3, name: 'Peri Peri Fries', price: 150.00, image: '/images/fries.png', category: 'Snacks' },
    { id: 4, name: 'Classic Cappuccino', price: 180.00, image: '/images/cappuccino.png', category: 'Coffee' },
    { id: 5, name: 'Iced Caramel Macchiato', price: 250.00, image: '/images/macchiato.png', category: 'Coffee' },
    { id: 6, name: 'Alfredo White Sauce Pasta', price: 350.00, image: '/images/alfredopasta.png', category: 'Pastas & Bowls' },
    { id: 7, name: 'Blueberry Cheesecake Slice', price: 420.00, image: '/images/cheesecake.png', category: 'Freshly Baked' },
    { id: 8, name: 'Tiramisu Cup', price: 380.00, image: '/images/tiramisu.png', category: 'Freshly Baked' },
    { id: 9, name: 'Strawberry Banana Smoothie', price: 290.00, image: '/images/smoothie.png', category: 'Milkshakes & Smoothies' },
    // Include the image URLs for the category icons so the app can fetch them as well (even though they aren't 'menu' items)
    { id: 10, name: 'Coffee Category Icon', price: 0, image: '/images/coffee.png', category: 'Icon' },
    { id: 11, name: 'Breakfast Category Icon', price: 0, image: '/images/breakfast.png', category: 'Icon' },
    // Add more of your 15+ menu items here for a complete list!
];

// --- API Endpoints (All routes remain correct and functional) ---

// GET /api/menu -> Returns the menu
app.get('/api/menu', (req, res) => {
    console.log('Request received for /api/menu');
    res.json(menu); // Returns the updated cafe menu
});

// GET /api/orders -> Returns all current orders
app.get('/api/orders', (req, res) => {
    console.log('Request received for /api/orders');
    res.json(orders);
});

// GET /api/orders/:id -> Returns a single order by its ID
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

// POST /api/orders -> Receives a new order
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

// PUT /api/orders/:id/status -> Updates the status and message of a specific order
app.put('/api/orders/:id/status', (req, res) => {
    const orderId = parseInt(req.params.id);
    const { status, message } = req.body;
    const order = orders.find(o => o.id === orderId);

    if (order && status && message) { 
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


// --- Start the Server ---
app.listen(port, () => {
    console.log(`✅ Backend server running at http://localhost:${port}`);
});