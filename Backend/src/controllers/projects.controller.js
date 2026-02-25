import Project from '../models/Project.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Create a new project
export async function createProject(req, res) {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      category,
      status,
      skills,
      github_url,
      demo_url,
      team_size,
      start_date,
      end_date,
      images,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Project title is required' });
    }

    const project = new Project({
      user_id: userId,
      title: title.trim(),
      description: description?.trim(),
      category: category || 'Personal',
      status: status || 'Planning',
      skills: Array.isArray(skills) ? skills : [],
      github_url: github_url?.trim(),
      demo_url: demo_url?.trim(),
      team_size: team_size || 1,
      start_date,
      end_date,
      images: Array.isArray(images) ? images : [],
    });

    await project.save();

    console.log('[Projects] Created project:', project._id, 'by user:', userId);

    res.status(201).json({
      message: 'Project created successfully',
      project: {
        id: project._id,
        title: project.title,
        description: project.description,
        category: project.category,
        status: project.status,
        skills: project.skills,
        github_url: project.github_url,
        demo_url: project.demo_url,
        team_size: project.team_size,
        start_date: project.start_date,
        end_date: project.end_date,
        images: project.images,
        created_at: project.created_at,
        updated_at: project.updated_at,
      },
    });
  } catch (error) {
    console.error('[Projects] ❌ Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
}

// Get user's projects (optionally filtered by status)
export async function getMyProjects(req, res) {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const filter = { user_id: userId };
    
    // Filter by status if provided
    if (status && ['Planning', 'In Progress', 'Completed', 'On Hold'].includes(status)) {
      filter.status = status;
    }

    const projects = await Project.find(filter)
      .sort({ created_at: -1 })
      .lean();

    console.log('[Projects] Found', projects.length, 'projects for user:', userId);

    const formattedProjects = projects.map(p => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      category: p.category,
      status: p.status,
      skills: p.skills,
      github_url: p.github_url,
      demo_url: p.demo_url,
      team_size: p.team_size,
      start_date: p.start_date,
      end_date: p.end_date,
      images: p.images,
      likes_count: p.likes_count,
      views_count: p.views_count,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    res.json({ projects: formattedProjects });
  } catch (error) {
    console.error('[Projects] ❌ Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
}

// Get a specific project by ID
export async function getProjectById(req, res) {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId)
      .populate('user_id', 'full_name avatar_url department batch')
      .lean();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Increment view count if not the owner
    if (project.user_id._id.toString() !== userId) {
      await Project.findByIdAndUpdate(projectId, { 
        $inc: { views_count: 1 } 
      });
    }

    const formattedProject = {
      id: project._id.toString(),
      title: project.title,
      description: project.description,
      category: project.category,
      status: project.status,
      skills: project.skills,
      github_url: project.github_url,
      demo_url: project.demo_url,
      team_size: project.team_size,
      start_date: project.start_date,
      end_date: project.end_date,
      images: project.images,
      likes_count: project.likes_count,
      views_count: project.views_count,
      created_at: project.created_at,
      updated_at: project.updated_at,
      owner: {
        id: project.user_id._id.toString(),
        name: project.user_id.full_name,
        avatar_url: project.user_id.avatar_url,
        department: project.user_id.department,
        batch: project.user_id.batch,
      },
    };

    res.json({ project: formattedProject });
  } catch (error) {
    console.error('[Projects] ❌ Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
}

// Get projects by user ID (for viewing other users' projects)
export async function getUserProjects(req, res) {
  try {
    const { userId } = req.params;

    const projects = await Project.find({ 
      user_id: userId,
      status: { $in: ['In Progress', 'Completed'] } // Only show active/completed projects
    })
      .sort({ created_at: -1 })
      .lean();

    const formattedProjects = projects.map(p => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      category: p.category,
      status: p.status,
      skills: p.skills,
      github_url: p.github_url,
      demo_url: p.demo_url,
      team_size: p.team_size,
      start_date: p.start_date,
      end_date: p.end_date,
      images: p.images,
      likes_count: p.likes_count,
      views_count: p.views_count,
      created_at: p.created_at,
    }));

    res.json({ projects: formattedProjects });
  } catch (error) {
    console.error('[Projects] ❌ Get user projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
}

// Update a project
export async function updateProject(req, res) {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;
    const updates = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user owns the project
    if (project.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'You can only update your own projects' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title',
      'description',
      'category',
      'status',
      'skills',
      'github_url',
      'demo_url',
      'team_size',
      'start_date',
      'end_date',
      'images',
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        project[field] = updates[field];
      }
    });

    await project.save();

    console.log('[Projects] Updated project:', projectId);

    res.json({
      message: 'Project updated successfully',
      project: {
        id: project._id,
        title: project.title,
        description: project.description,
        category: project.category,
        status: project.status,
        skills: project.skills,
        github_url: project.github_url,
        demo_url: project.demo_url,
        team_size: project.team_size,
        start_date: project.start_date,
        end_date: project.end_date,
        images: project.images,
        updated_at: project.updated_at,
      },
    });
  } catch (error) {
    console.error('[Projects] ❌ Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
}

// Delete a project
export async function deleteProject(req, res) {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user owns the project
    if (project.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own projects' });
    }

    await Project.findByIdAndDelete(projectId);

    console.log('[Projects] Deleted project:', projectId);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('[Projects] ❌ Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
}

// Get project stats for a user
export async function getProjectStats(req, res) {
  try {
    const userId = req.user.id;

    const stats = await Project.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      total: 0,
      planning: 0,
      in_progress: 0,
      completed: 0,
      on_hold: 0,
    };

    stats.forEach((stat) => {
      formattedStats.total += stat.count;
      
      if (stat._id === 'Planning') formattedStats.planning = stat.count;
      if (stat._id === 'In Progress') formattedStats.in_progress = stat.count;
      if (stat._id === 'Completed') formattedStats.completed = stat.count;
      if (stat._id === 'On Hold') formattedStats.on_hold = stat.count;
    });

    console.log('[Projects] Stats for user:', userId, formattedStats);

    res.json({ stats: formattedStats });
  } catch (error) {
    console.error('[Projects] ❌ Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch project stats' });
  }
}
