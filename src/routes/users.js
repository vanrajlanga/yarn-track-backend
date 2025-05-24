import express from 'express';
import { User } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js'; // Import actual middleware

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // By default, paranoid: true will exclude soft-deleted users
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new user (Admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    // Basic validation for role
    const allowedRoles = ['sales', 'operator', 'factory', 'admin']; // Allow admin to create other admins if needed
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid user role specified' });
    }
    const user = await User.create({ username, email, password, role });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Edit an existing user (Admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Basic validation for role if provided
    if (role) {
        const allowedRoles = ['sales', 'operator', 'factory', 'admin'];
        if (!allowedRoles.includes(role)) {
          return res.status(400).json({ error: 'Invalid user role specified' });
        }
        user.role = role;
    }

    user.username = username || user.username;
    user.email = email || user.email;
    // Note: Password update should ideally be handled separately and securely
    if (password) {
        user.password = password; // Assuming password needs to be hashed before saving if updated here
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Soft delete a user (Admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // This performs a soft delete due to paranoid: true in the model
    await user.destroy();
    res.json({ message: 'User soft deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 