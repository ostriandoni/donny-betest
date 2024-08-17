'use strict'

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const User = require('../models/userModel');
const jwtHelper = require('../utils/jwtHelper');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/register', async (req, res) => {
  try {
    const {
      userName,
      accountNumber,
      emailAddress,
      identityNumber,
      password
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ emailAddress });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      userName,
      accountNumber,
      emailAddress,
      identityNumber,
      password: hashedPassword
    });

    // Save user to database
    const savedUser = await newUser.save();

    // Generate JWT token
    const token = jwtHelper.generateToken({
      id: savedUser._id,
      email: savedUser.emailAddress
    })

    res.status(201).json({
      message: 'User has been registered',
      token
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { emailAddress, password } = req.body;

  try {
    // Find the user
    const user = await User.findOne({ emailAddress });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Check the password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate JWT token
    const token = jwtHelper.generateToken({
      id: user._id,
      email: user.emailAddress
    })

    res.json({
      message: 'User has been authenticated',
      token
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
