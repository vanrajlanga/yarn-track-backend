import express, { Request } from 'express';
import Project from '../models/Project';
import User from '../models/User';
import Yarn from '../models/Yarn';
import Pattern from '../models/Pattern';
import { authenticateToken } from '../middleware/auth';

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

const router = express.Router();

// Get all projects
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const projects = await Project.findAll({
      where: { user_id: req.user?.id },
      include: [
        { model: User, attributes: ['id', 'username', 'email'] },
        { model: Yarn },
        { model: Pattern }
      ]
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const project = await Project.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user?.id
      },
      include: [
        { model: User, attributes: ['id', 'username', 'email'] },
        { model: Yarn },
        { model: Pattern }
      ]
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  const { name, description, status } = req.body;
  try {
    const project = await Project.create({
      user_id: req.user?.id,
      name,
      description,
      status
    });
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { name, description, status } = req.body;
  try {
    const project = await Project.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user?.id
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.update({
      name,
      description,
      status
    });
    
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const project = await Project.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user?.id
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.destroy();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router; 