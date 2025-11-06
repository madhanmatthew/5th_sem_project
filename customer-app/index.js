const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http'); 
const { Server } = require('socket.io'); 
const app = express();

// --- Server Setup ---
const server = http.createServer(app); // Create HTTP server from Express app
const io = new Server(server, { // Initialize Socket.io server
    cors: {
        origin: "*", // Allows connections from Expo/deployed client
        methods: ["GET", "POST"]
    }
});
const port = process.env.PORT || 3001; // Use host's port when deployed

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Serve static files (images) from the 'images' folder
// This must match your physical file structure: backend/images/
app.use('/images', express.static(path.join(__dirname, 'images'))); 


// --- In-Memory Database and Menu ---
let orders = [];
let users = []; // NEW: Simple user database for authentication
let orderIdCounter = 1;

// Define your user authentication functions (for simple in-memory storage)
const findUser = (email) => users.find(u => u.email === email);
const hashPassword = (password) => password; // For simplicity, we skip actual hashing in this example
const generateToken = (user) => `auth-token-${user.id}-${Math.random().toString(16).slice(2)}`; // Simple mock token

// Simplified Sagar Cafe Menu (Make sure this array is COMPLETE)
const menu = [
    { id: 1, name: 'Spicy Paneer Wrap', price: 220.00, image: '/images/paneerwrap.png', category: 'Sandwiches & Wraps' },
    { id: 2, name: 'Cheesy Croissant Sandwich', price: 280.00, image: '/images/croissant.png', category: 'Sandwiches & Wraps' },
    { id: 3, name: 'Peri Peri Fries', price: 150.00, image: '/images/fries.png', category: 'Snacks' },
    { id: 4, name: 'Classic Cappuccino', price: 180.00, image: '/images/cappuccino.png', category: 'Coffee' },
    // Add all your 15+ menu items here for the client to fetch
];


// --- SOCKET.IO LOGIC ---
// Function to send an update to ALL connected clients
function emitOrderUpdate(order) {
    io.emit('orderUpdate', order);
}

io.on('connection', (socket) => {
    console.log(`[Socket] New client connected: ${socket.id}`);

    // Client tells the server which order they want to track
    socket.on('trackOrder', (orderId) => {
        console.log(`[Socket] Client ${socket.id} tracking Order #${orderId}`);
        // In a real app, you would join a room based on orderId
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
});


// --- API Endpoints ---

// 1. AUTHENTICATION ROUTES (REQUIRED FOR NEW UI)

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    if (findUser(email)) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = { 
        id: users.length + 1, 
        name, 
        email, 
        password: hashPassword(password) 
    };
    users.push(newUser);
    console.log(`NEW USER REGISTERED: ${email}`);
    
    // Auto-login on successful registration
    res.json({ token: generateToken(newUser), user: newUser });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = findUser(email);

    if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    console.log(`USER LOGGED IN: ${email}`);
    res.json({ token: generateToken(user), user });
});


// 2. MENU AND ORDER ROUTES

// GET /api/menu 
app.get('/api/menu', (req, res) => { res.json(menu); });

// GET /api/orders/:id 
app.get('/api/orders/:id', (req, res) => {
    const order = orders.find(o => o.id === parseInt(req.params.id, 10));
    if (order) {
        res.json(order);
    } else {
        res.status(404).send('Order not found');
    }
});

// POST /api/orders (Creates new order)
app.post('/api/orders', (req, res) => {
    // NOTE: In a real app, you'd check the Authorization header (token) here
    const newOrder = {
        id: orderIdCounter++,
        items: req.body.items,
        status: 'Pending',
        message: 'Your order has been placed and is waiting for confirmation.',
        timestamp: new Date().toLocaleTimeString()
    };
    orders.push(newOrder);
    
    // Notify clients instantly via Socket.io
    emitOrderUpdate(newOrder); 
    
    res.status(201).json(newOrder);
});

// PUT /api/orders/:id/status (Used by Admin Dashboard to change status)
app.put('/api/orders/:id/status', (req, res) => {
    const orderId = parseInt(req.params.id);
    const { status, message } = req.body;
    const order = orders.find(o => o.id === orderId);

    if (order && status && message) {
        order.status = status;
        order.message = message;
        
        // Emit the real-time update to the customer app
        emitOrderUpdate(order);
        
        console.log(`Updated order ${orderId} to status: ${status}, message: "${message}"`);
        res.json(order);
    } else {
        res.status(400).send('Invalid request or order not found.');
    }
});


// --- Start the Server (Must use server.listen for Socket.io) ---
server.listen(port, () => {
    console.log(`✅ Backend server running at http://localhost:${port}`);
    console.log(`✅ Socket.io running on port ${port}`);
});