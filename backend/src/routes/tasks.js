const express = require('express');
const router = express.Router();
const {
  getTasks, getTask, createTask, updateTask,
  deleteTask, getMyTasks, getDashboardStats
} = require('../controllers/taskController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/my-tasks', getMyTasks);
router.get('/dashboard-stats', getDashboardStats);
router.get('/project/:projectId', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
