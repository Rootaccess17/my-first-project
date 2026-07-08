const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  profilePic: { type: String },
  score: { type: Number, required: true },
  domain: { type: String, required: true },
  analysis: {
    matchPercentage: Number,
    suggestions: [String],
    missingSkills: [String],
    projectIdeas: [String],
    strengths: [String],
    recommendation: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', ResumeSchema);