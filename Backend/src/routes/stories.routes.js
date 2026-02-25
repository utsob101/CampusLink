import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { createStory, getStories, viewStory, deleteStory } from '../controllers/stories.controller.js';

const router = Router();

router.get('/', getStories);
router.post('/', authRequired, createStory);
router.post('/:storyId/view', authRequired, viewStory);
router.delete('/:storyId', authRequired, deleteStory);

export default router;
