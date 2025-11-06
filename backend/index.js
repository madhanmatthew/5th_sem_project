const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const http = require('http'); 
const { Server } = require('socket.io'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('./verifyToken.js'); // Assuming this file handles JWT verification

const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// FIXED STATIC FILE SERVING: Maps the virtual URL path '/images' to the physical folder './images'
// This ensures your client app can load the food pictures.
app.use('/images', express.static(path.join(__dirname, 'images'))); 

// --- HTTP and Socket.io Setup ---
const server = http.createServer(app); 
const io = new Server(server, { 
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// --- PostgreSQL Connection (Use your friend's exact config/password) ---
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'restaurant_db',
    password: 'Madhan@1107', // !!! CRITICAL: Ensure this is the correct DB password
    port: 5432,
});

// Check DB connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to PostgreSQL database', err.stack);
    } else {
        console.log('✅ Successfully connected to PostgreSQL database.');
    }
});

// --- Socket.io Logic ---
function emitOrderUpdate(order) {
    // We stick to the 'order_update' event name from your friend's code
    io.emit('order_update', order); 
    console.log(`[Socket.io] Emitted status update for Order #${order.id}`);
}

io.on('connection', (socket) => {
    console.log('A user connected', socket.id);
    socket.on('trackOrder', (orderId) => {
        console.log(`Client ${socket.id} tracking Order #${orderId}`);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});


// --- API Endpoints ---

// 1. AUTHENTICATION ROUTES (Uses DB)
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).send('All fields required.');
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await pool.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, is_admin",
            [name, email, hashedPassword]
        );
        // Create JWT Token
        const payload = { user: { id: newUser.rows[0].id, email: email, name: name, isAdmin: false } };
        jwt.sign(payload, 'your_jwt_secret_key', { expiresIn: '3h' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token, user: payload.user });
        });
    } catch (err) {
        if (err.code === '23505') return res.status(400).send('Email already exists.');
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send('Email and password required.');
    try {
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) return res.status(400).send('Invalid credentials.');
        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send('Invalid credentials.');

        const payload = { user: { id: user.id, email: user.email, name: user.name, isAdmin: user.is_admin } };
        jwt.sign(payload, 'your_jwt_secret_key', { expiresIn: '3h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: payload.user });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// 2. MENU AND ORDER ROUTES (Uses DB)

app.get('/api/menu', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM menu_items ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.get('/api/orders/:id', async (req, res) => {
    // Client app still needs this route, but since the client is authenticated, 
    // we should use the secured /my-order route eventually.
    // For now, let's keep it simple and public for status polling fallback.
    const order = orders.find(o => o.id === parseInt(req.params.id, 10)); // Uses temporary in-memory lookup
    if (order) {
        res.json(order);
    } else {
        res.status(404).send('Order not found');
    }
});


app.post('/api/orders', verifyToken, async (req, res) => {
    const { items } = req.body; 
    const userId = req.user.id; // Extracted from JWT token by verifyToken
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const defaultStatus = 'Pending';
      const defaultMessage = 'Your order has been placed and is waiting for confirmation.';
      const orderQuery = 'INSERT INTO orders (user_id, status, message) VALUES ($1, $2, $3) RETURNING *';
      const orderResult = await client.query(orderQuery, [userId, defaultStatus, defaultMessage]);
      const newOrder = orderResult.rows[0];
      
      for (const item of items) {
        const itemQuery = 'INSERT INTO order_items (order_id, item_id, quantity) VALUES ($1, $2, $3)';
        await client.query(itemQuery, [newOrder.id, item.id, item.quantity]);
      }
      
      await client.query('COMMIT');

      // Fetch full order details for the admin dashboard (includes user name/items)
      const fullOrderQuery = `
          SELECT 
            o.id, o.status, o.message, o.timestamp, u.name as user_name,
            (SELECT json_agg(json_build_object('name', mi.name, 'quantity', oi.quantity))
             FROM order_items oi
             JOIN menu_items mi ON oi.item_id = mi.id
             WHERE oi.order_id = o.id
            ) as items
          FROM orders o
          JOIN users u ON o.user_id = u.id
          WHERE o.id = $1
      `;
      const fullOrderResult = await pool.query(fullOrderQuery, [newOrder.id]);
      const fullOrder = fullOrderResult.rows[0];

      io.emit('new_order', fullOrder); // Emit to admin dashboard
      emitOrderUpdate(newOrder); // Emit basic update for customer tracking
      
      res.status(201).json(newOrder); // Send the basic order info back to the customer
      
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err.message);
      res.status(500).send('Server Error');
    } finally {
      client.release();
    }
});

app.put('/api/orders/:id/status', verifyToken, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send('Access Denied');
    
    const orderId = parseInt(req.params.id);
    const { status, message } = req.body;

    try {
        const query = 'UPDATE orders SET status = $1, message = $2 WHERE id = $3 RETURNING *';
        const result = await pool.query(query, [status, message, orderId]);
        if (result.rows.length === 0) return res.status(404).send('Order not found');
        
        const updatedOrder = result.rows[0];
        emitOrderUpdate(updatedOrder); 
        
        res.json(updatedOrder);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- Start the Server ---
server.listen(port, () => {
    console.log(`✅ FINAL BACKEND running on port ${port} with Postgres and Socket.io.`);
});