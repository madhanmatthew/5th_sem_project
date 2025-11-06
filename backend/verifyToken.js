/* === AUTHENTICATION MIDDLEWARE === */
/* This file checks for a valid JWT token on protected routes */

const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).send('No token, authorization denied');
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret_key'); // Must match the secret in index.js
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).send('Token is not valid');
  }
};