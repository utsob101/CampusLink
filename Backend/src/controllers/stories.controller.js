import Story from '../models/Story.js';

export async function createStory(req, res) {
  try {
    const { image_url, text, background_color } = req.body;
    
    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Stories expire after 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await Story.create({
      user_id: req.user.id,
      image_url,
      text: text || '',
      background_color: background_color || '#6C63FF',
      expires_at: expiresAt,
    });

    console.log('[Stories] Story created:', story._id.toString());
    res.status(201).json({ 
      story: {
        id: story._id.toString(),
        image_url: story.image_url,
        text: story.text,
        created_at: story.created_at,
        expires_at: story.expires_at,
      }
    });
  } catch (err) {
    console.error('Create story error:', err);
    res.status(500).json({ error: 'Failed to create story' });
  }
}

export async function getStories(req, res) {
  try {
    const now = new Date();
    
    // Get all active stories (not expired)
    const stories = await Story.find({ expires_at: { $gt: now } })
      .sort({ created_at: -1 })
      .populate('user_id', 'full_name avatar_url department')
      .limit(50);

    // Group stories by user
    const groupedStories = {};
    stories.forEach((story) => {
      const userId = story.user_id._id.toString();
      if (!groupedStories[userId]) {
        groupedStories[userId] = {
          user: {
            id: userId,
            name: story.user_id.full_name || 'User',
            avatar_url: story.user_id.avatar_url || null,
            department: story.user_id.department || 'Student',
          },
          stories: [],
        };
      }
      groupedStories[userId].stories.push({
        id: story._id.toString(),
        image_url: story.image_url,
        text: story.text,
        background_color: story.background_color,
        created_at: story.created_at,
        expires_at: story.expires_at,
        views_count: story.views_count,
      });
    });

    // Convert to array
    const result = Object.values(groupedStories);

    res.json({ stories: result });
  } catch (err) {
    console.error('Get stories error:', err);
    res.status(500).json({ error: 'Failed to load stories' });
  }
}

export async function viewStory(req, res) {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Add user to viewers if not already viewed
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Check if already viewed
    const alreadyViewed = story.viewers.some(
      (viewerId) => viewerId.toString() === userId
    );

    if (!alreadyViewed) {
      story.viewers.push(userId);
      story.views_count = story.viewers.length;
      await story.save();
    }

    res.json({ ok: true, views_count: story.views_count });
  } catch (err) {
    console.error('View story error:', err);
    res.status(500).json({ error: 'Failed to record view' });
  }
}

export async function deleteStory(req, res) {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Only allow user to delete their own story
    const story = await Story.findOne({ _id: storyId, user_id: userId });
    if (!story) {
      return res.status(404).json({ error: 'Story not found or not authorized' });
    }

    await Story.findByIdAndDelete(storyId);
    console.log('[Stories] Story deleted:', storyId);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete story error:', err);
    res.status(500).json({ error: 'Failed to delete story' });
  }
}
