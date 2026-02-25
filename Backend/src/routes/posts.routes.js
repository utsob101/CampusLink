import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { createPost, getFeed, likePost, unlikePost, sharePost, deletePost } from '../controllers/posts.controller.js';

const router = Router();

router.get('/feed', authRequired, getFeed);
router.post('/', authRequired, createPost);
router.post('/:postId/like', authRequired, likePost);
router.delete('/:postId/like', authRequired, unlikePost);
router.post('/:postId/share', authRequired, sharePost);
router.delete('/:postId', authRequired, deletePost);

export default router;
