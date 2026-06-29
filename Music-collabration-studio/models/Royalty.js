const mongoose = require('mongoose');

const contributorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  role: String,
  percentage: { type: Number, required: true, min: 0, max: 100 }
});

const royaltySchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  projectTitle: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contributors: [contributorSchema],
  totalPercentage: { type: Number, default: 0 },
  agreementText: String,
  status: { type: String, enum: ['draft', 'finalized'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

royaltySchema.pre('save', function(next) {
  this.totalPercentage = this.contributors.reduce((sum, c) => sum + c.percentage, 0);
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Royalty', royaltySchema);
