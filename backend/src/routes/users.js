const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUserRole, deleteUser } = require('../controllers/userController');
const { auth, isAdmin } = require('../middleware/auth');

router.use(auth);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id/role', isAdmin, updateUserRole);
router.delete('/:id', isAdmin, deleteUser);

module.exports = router;
