/* === FINAL BACKEND (Full Server) === */
/* === SECURITY TEMPORARILY DISABLED FOR DEVELOPMENT === */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const http = require('http'); // Required for socket.io
const { Server } = require('socket.io'); // Import socket.io
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('./verifyToken'); // We still import it, just don't use it

const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- Socket.io Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"]
  }
});

// --- PostgreSQL Connection ---
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'restaurant_db',
  password: 'Madhan@1107', // !!! REPLACE with your local password
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

// --- Socket.io Connection ---
io.on('connection', (socket) => {
  console.log('A user connected', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

/* ==================================
 AUTHENTICATION API (Still functional)
==================================
*/

// POST /api/auth/register (For Customers)
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).send('All fields are required.');
  }
  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into DB
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, is_admin",
      [name, email, hashedPassword]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') { // Unique constraint violation
      return res.status(400).send('Email already exists.');
    }
    res.status(500).send('Server Error');
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
  }
  try {
    // Find user
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).send('Invalid credentials.');
    }
    const user = userResult.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send('Invalid credentials.');
    }

    // Create JWT Token
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin
      }
    };

    jwt.sign(
      payload,
      'your_jwt_secret_key', // Use a long, random string in production
      { expiresIn: '3h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: payload.user });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/* ==================================
 MENU API (Security Disabled)
==================================
*/

// GET /api/menu (Public)
app.get('/api/menu', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menu_items ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/menu (Admin Only)
app.post('/api/menu', /* verifyToken, */ async (req, res) => {
  // if (!req.user.isAdmin) return res.status(403).send('Access Denied'); // Security disabled
  
  const { name, price, image } = req.body;
  try {
    const newItem = await pool.query(
      "INSERT INTO menu_items (name, price, image) VALUES ($1, $2, $3) RETURNING *",
      [name, price, image || '/images/default.jpg']
    );
    res.status(201).json(newItem.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/menu/:id (Admin Only)
app.put('/api/menu/:id', /* verifyToken, */ async (req, res) => {
  // if (!req.user.isAdmin) return res.status(403).send('Access Denied'); // Security disabled

  const itemId = parseInt(req.params.id);
  const { name, price, image } = req.body;
  try {
    const updatedItem = await pool.query(
      "UPDATE menu_items SET name = $1, price = $2, image = $3 WHERE id = $4 RETURNING *",
      [name, price, image, itemId]
    );
    if (updatedItem.rows.length === 0) {
      return res.status(404).send('Item not found');
    }
    res.json(updatedItem.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/menu/:id (Admin Only)
app.delete('/api/menu/:id', /* verifyToken, */ async (req, res) => {
  // if (!req.user.isAdmin) return res.status(403).send('Access Denied'); // Security disabled
  
  const itemId = parseInt(req.params.id);
  try {
    await pool.query("DELETE FROM menu_items WHERE id = $1", [itemId]);
    res.send('Menu item deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


/* ==================================
 ORDER API (Security Disabled)
==================================
*/

// GET /api/orders (Admin Only)
app.get('/api/orders', /* verifyToken, */ async (req, res) => {
  // if (!req.user.isAdmin) return res.status(403).send('Access Denied'); // Security disabled

  try {
    const query = `
      SELECT 
        o.id, o.status, o.message, o.timestamp, u.name as user_name,
        (SELECT json_agg(json_build_object('name', mi.name, 'quantity', oi.quantity))
         FROM order_items oi
         JOIN menu_items mi ON oi.item_id = mi.id
         WHERE oi.order_id = o.id
        ) as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.timestamp DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/orders/my-order (Customer Only)
app.get('/api/orders/my-order', /* verifyToken, */ async (req, res) => {
  // We will add a fake user ID for testing
  const testUserId = 1; // Assuming a user with ID 1 exists
  
  try {
    const orderQuery = `
      SELECT id, status, message, timestamp 
      FROM orders 
      WHERE user_id = $1 AND status NOT IN ('Completed', 'Cancelled')
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    const orderResult = await pool.query(orderQuery, [/* req.user.id */ testUserId]); // Using testUserId
    if (orderResult.rows.length === 0) {
      return res.status(404).send('No active order found');
    }
    res.json(orderResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/orders (Customer Only)
app.post('/api/orders', /* verifyToken, */ async (req, res) => {
  const { items } = req.body;
  const userId = 1; // Using a fake test user ID
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Create the order
    const defaultStatus = 'Pending';
    const defaultMessage = 'Your order has been placed and is waiting for confirmation.';
    const orderQuery = 'INSERT INTO orders (user_id, status, message) VALUES ($1, $2, $3) RETURNING *';
    const orderResult = await client.query(orderQuery, [userId, defaultStatus, defaultMessage]);
    const newOrder = orderResult.rows[0];
    
    // 2. Insert all items into order_items
    for (const item of items) {
      const itemQuery = 'INSERT INTO order_items (order_id, item_id, quantity) VALUES ($1, $2, $3)';
      await client.query(itemQuery, [newOrder.id, item.id, item.quantity]);
    }
    
    await client.query('COMMIT');

    // 3. Get the full order details to send to the admin
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
    const fullOrderResult = await client.query(fullOrderQuery, [newOrder.id]);
    const fullOrder = fullOrderResult.rows[0];

    // Emit the new order to all connected admins
    io.emit('new_order', fullOrder);
    
    res.status(201).json(newOrder); // Send the basic order info back to the customer
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});

// PUT /api/orders/:id/status (Admin Only)
app.put('/api/orders/:id/status', /* verifyToken, */ async (req, res) => {
  // if (!req.user.isAdmin) return res.status(403).send('Access Denied'); // Security disabled
  
  const orderId = parseInt(req.params.id);
  const { status, message } = req.body;

  try {
    const query = 'UPDATE orders SET status = $1, message = $2 WHERE id = $3 RETURNING *';
    const result = await pool.query(query, [status, message, orderId]);
    if (result.rows.length === 0) {
      return res.status(404).send('Order not found');
    }
    const updatedOrder = result.rows[0];

    // Emit the status update to all connected clients
    io.emit('order_update', updatedOrder);
    
    res.json(updatedOrder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// --- Start the Server ---
// MODIFIED: Use server.listen instead of app.listen
server.listen(port, () => {
  console.log(`✅ Backend server with Socket.io running at http://localhost:${port}`);

});