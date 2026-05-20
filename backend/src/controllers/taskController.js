const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper: check project access
const checkProjectAccess = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', status: 404 };
  
  const isOwner = project.owner.toString() === userId;
  const isMember = project.members.some(m => m.user.toString() === userId);
  const isAdmin = userRole === 'Admin';
  
  if (!isOwner && !isMember && !isAdmin) {
    return { error: 'Access denied.', status: 403 };
  }
  return { project };
};

// Get tasks for a project
exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignedTo } = req.query;

    const access = await checkProjectAccess(projectId, req.user._id.toString(), req.user.role);
    if (access.error) return res.status(access.status).json({ message: access.error });

    let filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
};

// Get single task
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const access = await checkProjectAccess(task.project._id, req.user._id.toString(), req.user.role);
    if (access.error) return res.status(access.status).json({ message: access.error });

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch task', error: error.message });
  }
};

// Create task
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, project, assignedTo, dueDate, tags } = req.body;

    const access = await checkProjectAccess(project, req.user._id.toString(), req.user.role);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const task = new Task({
      title, description, status, priority, project,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      dueDate, tags
    });

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ message: 'Task created', task });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const access = await checkProjectAccess(task.project, req.user._id.toString(), req.user.role);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const { title, description, status, priority, assignedTo, dueDate, tags } = req.body;
    Object.assign(task, { title, description, status, priority, dueDate, tags });
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.json({ message: 'Task updated', task });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const access = await checkProjectAccess(task.project, req.user._id.toString(), req.user.role);
    if (access.error) return res.status(access.status).json({ message: access.error });

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
};

// Get my tasks (assigned to current user)
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'name status')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });

    const now = new Date();
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'Done');

    res.json({ tasks, overdue });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'Admin';

    const projectFilter = isAdmin 
      ? {} 
      : { $or: [{ owner: userId }, { 'members.user': userId }] };

    const Project = require('../models/Project');
    const projects = await Project.find(projectFilter);
    const projectIds = projects.map(p => p._id);

    const taskStats = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const stats = { Todo: 0, 'In Progress': 0, Review: 0, Done: 0 };
    taskStats.forEach(s => { stats[s._id] = s.count; });

    const now = new Date();
    const overdueTasks = await Task.countDocuments({
      project: { $in: projectIds },
      dueDate: { $lt: now },
      status: { $ne: 'Done' }
    });

    const myTasks = await Task.countDocuments({ assignedTo: userId, status: { $ne: 'Done' } });

    res.json({
      totalProjects: projects.length,
      taskStats: stats,
      totalTasks: Object.values(stats).reduce((a, b) => a + b, 0),
      overdueTasks,
      myPendingTasks: myTasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};
