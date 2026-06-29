const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Royalty = require('../models/Royalty');

const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

// Create project
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, genre, bpm, key } = req.body;
    if (!title) return res.status(400).json({ error: 'Project title required' });

    const project = new Project({
      title, description, genre, bpm, key,
      owner: req.session.userId
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all projects for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.session.userId },
        { 'collaborators.user': req.session.userId }
      ]
    }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single project
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.userId },
      req.body,
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Project.findOneAndDelete({ _id: req.params.id, owner: req.session.userId });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add collaborator
router.post('/:id/collaborators', requireAuth, async (req, res) => {
  try {
    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.collaborators.push({ email, role: role || 'editor' });
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.comments.push({ text, author: req.session.userName, authorId: req.session.userId });
    await project.save();
    res.json(project.comments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add task
router.post('/:id/tasks', requireAuth, async (req, res) => {
  try {
    const { title, assignedTo } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.tasks.push({ title, assignedTo });
    await project.save();
    res.json(project.tasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Save version
router.post('/:id/versions', requireAuth, async (req, res) => {
  try {
    const { label, description } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const vNum = project.versions.length + 1;
    project.versions.push({
      versionNumber: vNum,
      label: label || `v${vNum}.0`,
      description,
      files: project.audioFiles,
      createdBy: req.session.userId
    });
    await project.save();
    res.json(project.versions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete version
router.delete('/:id/versions/:versionId', requireAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.versions = project.versions.filter(v => v._id.toString() !== req.params.versionId);
    await project.save();
    res.json({ message: 'Version deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Royalty Routes ---

// Save royalty split
router.post('/:id/royalty', requireAuth, async (req, res) => {
  try {
    const { contributors } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    let royalty = await Royalty.findOne({ project: req.params.id });
    if (royalty) {
      royalty.contributors = contributors;
      royalty.projectTitle = project.title;
    } else {
      royalty = new Royalty({
        project: req.params.id,
        projectTitle: project.title,
        createdBy: req.session.userId,
        contributors
      });
    }
    await royalty.save();
    res.json(royalty);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get royalty
router.get('/:id/royalty', requireAuth, async (req, res) => {
  try {
    const royalty = await Royalty.findOne({ project: req.params.id });
    res.json(royalty || { contributors: [] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
