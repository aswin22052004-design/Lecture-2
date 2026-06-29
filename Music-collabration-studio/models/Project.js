const mongoose = require('mongoose');

const audioFileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  size: Number,
  mimetype: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
});

const versionSchema = new mongoose.Schema({
  versionNumber: Number,
  label: String,
  description: String,
  files: [audioFileSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const collaboratorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: String,
  role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'editor' },
  addedAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
  title: String,
  assignedTo: String,
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  createdAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  text: String,
  author: String,
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  genre: String,
  bpm: Number,
  key: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [collaboratorSchema],
  audioFiles: [audioFileSchema],
  versions: [versionSchema],
  tasks: [taskSchema],
  comments: [commentSchema],
  status: { type: String, enum: ['active', 'archived', 'published'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Project', projectSchema);
