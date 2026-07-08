const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// SIGNUP ROUTE
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists.' });

    // 💡 AUTOMATIC USERNAME GENERATOR:
    // If email is 'testuser@gmail.com', this cleanly extracts 'testuser' 
    // and sends it to satisfy your MongoDB User schema requirements.
    const autoUsername = email.split('@')[0];

    user = new User({ 
      username: autoUsername, // 👈 Injects the auto-username into the model query
      email, 
      password 
    });
    
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, profilePic: user.profilePic }
    });
  } catch (error) {
    console.error("❌ SIGNUP PIPELINE EXCEPTION ERROR:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});
// LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'All fields are required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = generateToken(user._id);
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, profilePic: user.profilePic }
    });
  } catch (error) {
    console.error("❌ LOGIN PIPELINE EXCEPTION ERROR:", error);
    res.status(400).json({ message: "Bad Request", error: error.message });
}
});

module.exports = router;