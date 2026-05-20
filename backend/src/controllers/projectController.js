const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// Get all projects for current user
exports.getProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'Admin';

    let query = isAdmin 
      ? {} 
      : { $or: [{ owner: userId }, { 'members.user': userId }] };

    const projects = await Project.find(query)
      .populate('owner', 'name email role')
      .populate('members.user', 'name email role')
      .sort({ createdAt: -1 });

    // Add task counts
    const projectsWithCounts = await Promise.all(projects.map(async (project) => {
      const taskCounts = await Task.aggregate([
        { $match: { project: project._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const counts = { Todo: 0, 'In Progress': 0, Review: 0, Done: 0, total: 0 };
      taskCounts.forEach(t => {
        counts[t._id] = t.count;
        counts.total += t.count;
      });
      return { ...project.toObject(), taskCounts: counts };
    }));

    res.json({ projects: projectsWithCounts });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
};

// Get single project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('members.user', 'name email role');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const userId = req.user._id.toString();
    const isOwner = project.owner._id.toString() === userId;
    const isMember = project.members.some(m => m.user._id.toString() === userId);
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isMember && !isAdmin) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch project', error: error.message });
  }
};

// Create project
exports.createProject = async (req, res) => {
  try {
    const { name, description, deadline } = req.body;

    const project = new Project({
      name,
      description,
      deadline,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'Admin' }]
    });

    await project.save();
    await project.populate('owner', 'name email role');
    await project.populate('members.user', 'name email role');

    res.status(201).json({ message: 'Project created', project });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { name, description, status, deadline } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const userId = req.user._id.toString();
    const isOwner = project.owner.toString() === userId;
    const memberEntry = project.members.find(m => m.user.toString() === userId);
    const isMemberAdmin = memberEntry?.role === 'Admin';
    const isGlobalAdmin = req.user.role === 'Admin';

    if (!isOwner && !isMemberAdmin && !isGlobalAdmin) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    Object.assign(project, { name, description, status, deadline });
    await project.save();
    await project.populate('owner', 'name email role');
    await project.populate('members.user', 'name email role');

    res.json({ message: 'Project updated', project });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update project', error: error.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. Only owner or admin can delete.' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: 'Project and all its tasks deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete project', error: error.message });
  }
};

// Add member to project
exports.addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found with this email' });

    const alreadyMember = project.members.some(m => m.user.toString() === user._id.toString());
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member' });

    project.members.push({ user: user._id, role: role || 'Member' });
    await project.save();
    await project.populate('members.user', 'name email role');

    res.json({ message: 'Member added successfully', project });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add member', error: error.message });
  }
};

// Remove member
exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() === memberId) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    project.members = project.members.filter(m => m.user.toString() !== memberId);
    await project.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove member', error: error.message });
  }
};
