/* === FINAL BACKEND (Simplified Login) === */
/* This version DOES NOT use bcrypt, for easier demo login. */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken'); // Still use JWT for tokens
const verifyToken = require('./verifyToken');

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
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --- PostgreSQL Connection ---
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false } 
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
 AUTHENTICATION API (SIMPLE)
==================================
*/

// POST /api/auth/register (SIMPLE)
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).send('All fields are required.');
  }
  try {
    // DO NOT HASH THE PASSWORD
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    const simplePassword = password; // Just save the plain text

    const newUserResult = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, is_admin",
      [name, email, simplePassword] // Save the simple password
    );
    const newUser = newUserResult.rows[0];

    const payload = { user: { id: newUser.id, email: newUser.email, name: newUser.name, isAdmin: newUser.is_admin } };
    
    jwt.sign( payload, 'your_jwt_secret_key', { expiresIn: '3h' }, (err, token) => {
        if (err) throw err;
        res.status(201).json({ token, user: payload.user }); 
      }
    );
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') { return res.status(400).send('Email already exists.'); }
    res.status(500).send('Server Error');
  }
});

// POST /api/auth/login (SIMPLE)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
  }
  try {
    // 1. Find user in the database
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).send('Invalid credentials.');
    }
    const user = userResult.rows[0];

    // 2. Check password (SIMPLE, INSECURE CHECK)
    // We just check if the text matches exactly.
    if (password !== user.password) {
      return res.status(400).send('Invalid credentials.');
    }

    // 3. Create JWT Token
    const payload = { user: { id: user.id, email: user.email, name: user.name, isAdmin: user.is_admin } };
    jwt.sign( payload, 'your_jwt_secret_key', { expiresIn: '3h' }, (err, token) => {
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
 MENU API (SECURE)
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
app.post('/api/menu', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).send('Access Denied');
  const { name, price, image, category } = req.body;
  try {
    const newItem = await pool.query(
      "INSERT INTO menu_items (name, price, image, category) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, price, image || '/images/default.jpg', category]
    );
    res.status(201).json(newItem.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/menu/:id (Admin Only)
app.put('/api/menu/:id', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).send('Access Denied');
  const itemId = parseInt(req.params.id);
  const { name, price, image, category } = req.body;
  try {
    const updatedItem = await pool.query(
      "UPDATE menu_items SET name = $1, price = $2, image = $3, category = $4 WHERE id = $5 RETURNING *",
      [name, price, image, category, itemId]
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
app.delete('/api/menu/:id', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).send('Access Denied');
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
 ORDER API (SECURE)
==================================
*/
// GET /api/orders (Admin Only)
app.get('/api/orders', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).send('Access Denied');
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
app.get('/api/orders/my-order', verifyToken, async (req, res) => {
  try {
    const orderQuery = `
      SELECT id, status, message, timestamp 
      FROM orders 
      WHERE user_id = $1 AND status NOT IN ('Completed', 'Cancelled')
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    const orderResult = await pool.query(orderQuery, [req.user.id]);
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
app.post('/api/orders', verifyToken, async (req, res) => {
  const { items } = req.body;
  const userId = req.user.id;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const defaultStatus = 'Pending';
    const defaultMessage = 'Your order has been placed and is waiting for confirmation.';
    const orderQuery = 'INSERT INTO orders (user_id, status, message) VALUES ($1, $2, $3) RETURNING *';
    const orderResult = await client.query(orderQuery, [userId, defaultStatus, defaultMessage]);
    const newOrder = orderResult.rows[0];
    
    for (const item of items) {
      const itemResult = await client.query('SELECT id FROM menu_items WHERE id = $1', [item.id]);
      if (itemResult.rows.length > 0) {
        const itemId = itemResult.rows[0].id;
        const itemQuery = 'INSERT INTO order_items (order_id, item_id, quantity) VALUES ($1, $2, $3)';
        await client.query(itemQuery, [newOrder.id, itemId, item.quantity]);
      } else {
        console.warn(`Item not found in DB, skipping: (ID: ${item.id})`);
      }
    }
    
    await client.query('COMMIT');

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

    io.emit('new_order', fullOrder);
    io.emit('order_update', newOrder);
    
    res.status(201).json(newOrder);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});

// PUT /api/orders/:id/status (Admin Only)
app.put('/api/orders/:id/status', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).send('Access Denied');
  const orderId = parseInt(req.params.id);
  const { status, message } = req.body;
  try {
    const query = 'UPDATE orders SET status = $1, message = $2 WHERE id = $3 RETURNING *';
    const result = await pool.query(query, [status, message, orderId]);
    if (result.rows.length === 0) {
      return res.status(404).send('Order not found');
    }
    const updatedOrder = result.rows[0];
    io.emit('order_update', updatedOrder);
    res.json(updatedOrder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Start the Server ---
server.listen(port, () => {
  console.log(`✅ Backend server with Socket.io running at http://localhost:${port}`);
});