// 1. MUST BE AT THE VERY TOP: Force Node.js to use stable global DNS servers
try {
  require('node:dns/promises').setServers(["1.1.1.1", "8.8.8.8"]);
  console.log("🌐 Custom DNS Resolution Configured (Cloudflare/Google Bypass Active).");
} catch (dnsErr) {
  console.warn("⚠️ DNS bypass failed to initialize:", dnsErr.message);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import Router Nodes
const authRoutes = require('./routes/auth');
const analyzeRoutes = require('./routes/analyze'); // <-- New Route Link

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Essential for parsing incoming data payloads

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🔄 Connected to MongoDB Cloud Database Successfully.'))
  .catch(err => console.error('❌ Database connectivity error:', err));

// Link Routes to App Engine
app.use('/api/auth', authRoutes);
app.use('/api', analyzeRoutes); // <-- New Route Mount Endpoint

// Base route for testing
app.get('/', (req, res) => res.send('LinuxAi2026 Core Engine is Operational.'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Security Engine actively running on port ${PORT}`));