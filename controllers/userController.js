'use strict'

const User = require('../models/userModel');
const { producer } = require('../config/kafka');
const redisClient = require('../config/redis');

// Create a new user
const createUser = async (req, res) => {
  const { userName, emailAddress } = req.body;

  try {
    // Check if user with the same userName or emailAddress already exists
    const existingUser = await User.findOne({
      $or: [
        { userName: userName },
        { emailAddress: emailAddress }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with the same userName or emailAddress already exists'
      });
    }

    const newUser = new User(req.body);
    const savedUser = await newUser.save();

    // Produce user data to Kafka
    producer.send([{ topic: 'kafka-donny-betest', messages: JSON.stringify(savedUser) }], (err, data) => {
      if (err) console.error('Kafka Producer error:', err);
    });

    res.status(201).json({
      message: 'User has been created',
      data: newUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read a user by ID
const getUserById = async (req, res) => {
  const userId = req.params.id

  try {
    // Check if the user is in Redis cache
    let cachedUser;

    try {
      cachedUser = await redisClient.get(`redis_donny_betest:${userId}`);
    } catch (redisError) {
      return res.status(500).json({ message: 'Error accessing Redis cache' });
    }

    if (cachedUser) {
      // User data is in cache
      return res.json({
        message: 'Success get an user',
        data: JSON.parse(cachedUser)
      });
    }

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Cache user data
    redisClient.set(`redis_donny_betest:${user._id}`, 3600, JSON.stringify(user));

    res.json({
      message: 'Success get an user',
      data: user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a user
const updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    // Produce updated user data to Kafka
    producer.send([{ topic: 'kafka-donny-betest', messages: JSON.stringify(updatedUser) }], (err, data) => {
      if (err) console.error('Kafka Producer error:', err);
    });

    res.json({
      message: 'Success update an user',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) return res.status(404).json({ message: 'User not found' });

    // Produce deleted user data to Kafka
    producer.send([{ topic: 'kafka-donny-betest', messages: JSON.stringify(deletedUser) }], (err, data) => {
      if (err) console.error('Kafka Producer error:', err);
    });

    res.json({ message: 'User has been deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Consume user data from Kafka and insert to MongoDB
const consumeUserData = () => {
  const { consumer } = require('../config/kafka');
  consumer.on('message', async (message) => {
    try {
      const userData = JSON.parse(message.value);
      const existingUser = await User.findById(userData._id);

      if (!existingUser) {
        await User.create(userData);
      }
    } catch (error) {
      console.error('Error processing Kafka message:', error.message);
    }
  });
};

module.exports = {
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  consumeUserData
};
