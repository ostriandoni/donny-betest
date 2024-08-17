'use strict'

const jwt = require('jsonwebtoken');

const generateToken = (user) => jwt.sign({
  id: user.id,
  email: user.email
}, process.env.JWT_SECRET, { expiresIn: '1h' });

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = { generateToken, verifyToken };
