const express = require('express');
const router = express.Router();
const {
  getProjects, getProject, createProject, updateProject,
  deleteProject, addMember, removeMember
} = require('../controllers/projectController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/members', addMember);
router.delete('/:id/members/:memberId', removeMember);

module.exports = router;
