import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import {
  createProject,
  getMyProjects,
  getProjectById,
  getUserProjects,
  updateProject,
  deleteProject,
  getProjectStats,
} from '../controllers/projects.controller.js';

const router = Router();

// All routes require authentication
router.post('/', authRequired, createProject);
router.get('/my-projects', authRequired, getMyProjects);
router.get('/stats', authRequired, getProjectStats);
router.get('/user/:userId', authRequired, getUserProjects);
router.get('/:projectId', authRequired, getProjectById);
router.put('/:projectId', authRequired, updateProject);
router.delete('/:projectId', authRequired, deleteProject);

export default router;
