import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import { createNotification } from './notifications.controller.js';

export async function listComments(req, res) {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post_id: postId })
      .sort({ created_at: 1 })
      .populate('user_id', 'full_name avatar_url');

    const data = comments.map((c) => ({
      id: c._id.toString(),
      content: c.content,
      created_at: c.created_at,
      user_id: c.user_id?._id?.toString(),
      profiles: {
        full_name: c.user_id?.full_name || 'User',
        avatar_url: c.user_id?.avatar_url || null,
      },
    }));
    res.json(data);
  } catch (err) {
    console.error('List comments error:', err);
    res.status(500).json({ error: 'Failed to load comments' });
  }
}

export async function addComment(req, res) {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });

    const comment = await Comment.create({ post_id: postId, user_id: userId, content: content.trim() });
    const post = await Post.findByIdAndUpdate(postId, { $inc: { comments_count: 1 } }, { new: true });

    // Create notification for post author
    if (post && post.user_id.toString() !== userId) {
      await createNotification(
        post.user_id,
        userId,
        'comment',
        'commented on your post',
        postId,
        'Post'
      );
    }

    res.status(201).json({
      id: comment._id.toString(),
      content: comment.content,
      createdAt: comment.created_at,
    });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
}
