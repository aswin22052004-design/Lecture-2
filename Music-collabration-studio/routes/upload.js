const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Project = require('../models/Project');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['audio/wav', 'audio/mpeg', 'audio/aiff', 'audio/x-aiff', 'audio/mp3', 'audio/wave'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = ['.wav', '.mp3', '.aiff', '.aif'];
  if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only WAV, MP3, and AIFF audio files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB
});

// Middleware: auth check
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

// Upload audio to a project
router.post('/:projectId', requireAuth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: '/uploads/' + req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.session.userId
    };

    project.audioFiles.push(fileData);
    await project.save();

    res.json({ message: 'File uploaded successfully', file: fileData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// Upload without project (standalone)
router.post('/', requireAuth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: '/uploads/' + req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    res.json({ message: 'File uploaded successfully', file: fileData });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

module.exports = router;
