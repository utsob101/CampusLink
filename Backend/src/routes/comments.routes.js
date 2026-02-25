import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { listComments, addComment } from '../controllers/comments.controller.js';

const router = Router();

router.get('/:postId', listComments);
router.post('/:postId', authRequired, addComment);

export default router;
