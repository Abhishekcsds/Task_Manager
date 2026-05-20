const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Check if user is Admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// Check if user is project Admin or global Admin
const isProjectAdmin = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    const projectId = req.params.projectId || req.params.id || req.body.project;
    
    if (!projectId) return next();
    
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    const memberEntry = project.members.find(m => m.user.toString() === req.user._id.toString());
    const isMemberAdmin = memberEntry?.role === 'Admin';
    const isGlobalAdmin = req.user.role === 'Admin';

    if (!isOwner && !isMemberAdmin && !isGlobalAdmin) {
      return res.status(403).json({ message: 'Access denied. Project admin role required.' });
    }
    
    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { auth, isAdmin, isProjectAdmin };
