import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { login, register, me, updateProfile, deleteAvatar, changePassword, getUserProfile, searchUsers } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authRequired, me);
router.put('/me', authRequired, updateProfile);
router.delete('/avatar', authRequired, deleteAvatar);
router.post('/change-password', authRequired, changePassword);
router.get('/search', authRequired, searchUsers);
router.get('/user/:user_id', authRequired, getUserProfile);

export default router;
