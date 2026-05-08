const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Get models WITHOUT re-compiling
let Community = mongoose.models.Community;
if (!Community) { Community = require('./Community'); }

let Post = mongoose.models.Post;
if (!Post) { Post = require('./Post'); }

let Notification = mongoose.models.Notification;
if (!Notification) { Notification = require('./Notification'); }

let Transaction = mongoose.models.Transaction;
if (!Transaction) { Transaction = require('./Transaction'); }

let User = mongoose.models.User;
if (!User) { User = require('../User'); }

const { authMiddleware } = require('../../middleware/auth');
const PLATFORM_COMMISSION_RATE = 0.15;



// GET /api/community — List all communities (ROOT route)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, category, filter, page = 1, limit = 12 } = req.query;
    let query = { isActive: true };

    if (search) query.name = { $regex: search, $options: 'i' };
    if (category && category !== 'all') query.category = category;

    let sortObj = { createdAt: -1 };
    if (filter === 'popular') sortObj = { memberCount: -1 };
    if (filter === 'newest') sortObj = { createdAt: -1 };
    if (filter === 'trending') sortObj = { memberCount: -1, createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Community.countDocuments(query);

    const communities = await Community.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select('name description category visibility photo avatarImage bannerImage owner memberCount postCount isMonetized subscriptionPrice socialLinks tags createdAt')
      .populate('owner', 'name avatar');

    res.json({
      success: true,
      data: {
        communities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
          hasMore: skip + communities.length < total
        }
      }
    });
  } catch (error) {
    console.error('List communities error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}); 

// ============================================
// 1. COMMUNITY DISCOVERY & LISTING
// ============================================

// GET /api/community - List all communities
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { search, category, filter, page = 1, limit = 12 } = req.query;
    let query = { isActive: true };

    if (search) query.name = { $regex: search, $options: 'i' };
    if (category && category !== 'all') query.category = category;

    let sortObj = { createdAt: -1 };
    if (filter === 'popular') sortObj = { memberCount: -1 };
    if (filter === 'newest') sortObj = { createdAt: -1 };
    if (filter === 'trending') sortObj = { memberCount: -1, createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Community.countDocuments(query);

    const communities = await Community.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select('name description category visibility photo avatarImage bannerImage owner memberCount postCount isMonetized subscriptionPrice socialLinks tags createdAt')
      .populate('owner', 'name avatar');

    res.json({
      success: true,
      data: {
        communities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
          hasMore: skip + communities.length < total
        }
      }
    });
  } catch (error) {
    console.error('List communities error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 2. SINGLE COMMUNITY WITH POSTS
// ============================================

// GET /api/community/:id - Get community detail with posts
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('owner', 'name email avatar plan')
      .populate('members.user', 'name email avatar plan');

    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const member = community.members.find(m => {
      const memberId = (m.user?._id || m.user)?.toString();
      return memberId === userId;
    });

    const posts = await Post.find({ 
      community: req.params.id, 
      isSoftDeleted: false 
    })
      .populate('author', 'name avatar plan')
      .populate('comments.author', 'name avatar')
      .populate('likes', 'name avatar')
      .populate('poll.options.votes', 'name')
      .populate('event.attendees', 'name avatar')
      .sort({ pinned: -1, createdAt: -1 });

    res.json({
      success: true,
      data: {
        community,
        posts,
        isMember: !!member,
        isAdmin: member?.role === 'admin',
        memberRole: member?.role || null
      }
    });
  } catch (error) {
    console.error('Get community error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 3. CREATE COMMUNITY (with plan limits)
// ============================================

// POST /api/community/create
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { name, description, category, visibility, isMonetized, subscriptionPrice, tags } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Community name is required' });
    }

    // Plan limit check
    const userPlan = (req.user.plan || 'starter').toLowerCase();
    const userId = req.user._id || req.user.id;

    const ownedCount = await Community.countDocuments({ 
      $or: [{ owner: userId }, { createdBy: userId }] 
    });

    const limits = { starter: 0, pro: 4, professional: 4, enterprise: 999 };
    const maxAllowed = limits[userPlan] || 0;

    if (ownedCount >= maxAllowed) {
      return res.status(403).json({
        success: false,
        error: userPlan === 'starter' 
          ? 'Upgrade to Pro to create communities' 
          : `Limit reached (${maxAllowed} max). Upgrade to Enterprise for unlimited.`
      });
    }

    const community = await Community.create({
      name: name.trim(),
      description: description?.trim() || '',
      category: category || 'general',
      visibility: visibility || 'public',
      isMonetized: isMonetized || false,
      subscriptionPrice: Math.max(0, Math.round(subscriptionPrice || 0)),
      tags: tags || [],
      owner: userId,
      createdBy: userId,
      members: [{ user: userId, role: 'admin', joinedAt: new Date() }],
      memberCount: 1,
      currentMembers: 1,
      isActive: true
    });

    // Update user's community count
    await User.findByIdAndUpdate(userId, { $inc: { communitiesOwned: 1 } });

    const populated = await Community.findById(community._id)
      .populate('owner', 'name avatar plan');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 4. UPDATE COMMUNITY
// ============================================

// PUT /api/community/:id
router.put('/:id/update', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const ownerId = (community.owner || community.createdBy).toString();

    if (ownerId !== userId) {
      return res.status(403).json({ success: false, error: 'Only owner can update' });
    }

    const allowedFields = [
      'name', 'description', 'category', 'visibility', 
      'isMonetized', 'subscriptionPrice', 'tags', 
      'photo', 'bannerImage', 'avatarImage', 'rules'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        community[field] = req.body[field];
      }
    });

    await community.save();

    const populated = await Community.findById(community._id)
      .populate('owner', 'name avatar plan');

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Update community error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 5. DELETE COMMUNITY
// ============================================

// DELETE /api/community/:id
router.delete('/:id/delete', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const ownerId = (community.owner || community.createdBy).toString();

    if (ownerId !== userId) {
      return res.status(403).json({ success: false, error: 'Only owner can delete' });
    }

    await Post.deleteMany({ community: req.params.id });
    await Notification.deleteMany({ communityId: req.params.id });
    await Transaction.deleteMany({ communityId: req.params.id });
    await Community.findByIdAndDelete(req.params.id);

    await User.findByIdAndUpdate(userId, { $inc: { communitiesOwned: -1 } });

    res.json({ success: true, message: 'Community deleted successfully' });
  } catch (error) {
    console.error('Delete community error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 6. JOIN / LEAVE COMMUNITY
// ============================================

// POST /api/community/:id/join

router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, error: 'Not found' });

    const userId = (req.user._id || req.user.id).toString();
    const alreadyMember = community.members.find(m => m.user.toString() === userId);
    if (alreadyMember) return res.json({ success: true, data: { isMember: true } });

    // ✅ ADD THIS: Check if paid community and user hasn't paid
    if (community.isMonetized && community.subscriptionPrice > 0) {
      const hasActiveSubscription = community.members.find(m => 
        m.user.toString() === userId && m.subscriptionActive === true
      );
      if (!hasActiveSubscription) {
        return res.status(402).json({ 
          success: false, 
          error: 'Payment required',
          requiresPayment: true 
        });
      }
    }

    community.members.push({ user: req.user._id || req.user.id, role: 'member' });
    community.memberCount = community.members.length;
    await community.save();
    
    res.json({ success: true, data: { isMember: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});



// POST /api/community/:id/leave
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const member = community.members.find(m => 
      (m.user?._id || m.user)?.toString() === userId
    );

    if (!member) {
      return res.json({ success: true, message: 'Not a member' });
    }

    if (member.role === 'admin') {
      return res.status(400).json({ 
        success: false, 
        error: 'Admin cannot leave. Transfer ownership or delete the community.' 
      });
    }

    community.members = community.members.filter(m => 
      (m.user?._id || m.user)?.toString() !== userId
    );
    community.memberCount = community.members.length;
    community.currentMembers = community.members.length;
    await community.save();

    res.json({ success: true, data: { isMember: false }, message: 'You left the community' });
  } catch (error) {
    console.error('Leave community error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 7. MEMBER MANAGEMENT
// ============================================

// GET /api/community/:id/members
router.get('/:id/members', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('members.user', 'name email avatar plan');

    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    res.json({
      success: true,
      data: {
        members: community.members,
        total: community.memberCount
      }
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/community/:id/members/:memberId/role
router.put('/:id/members/:memberId/role', authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'moderator', 'member'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const isAdmin = community.members.find(m => 
      (m.user?._id || m.user)?.toString() === userId && m.role === 'admin'
    );

    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const member = community.members.find(m => 
      (m.user?._id || m.user)?.toString() === req.params.memberId
    );

    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    member.role = role;
    await community.save();

    // Notify member
    await Notification.create({
      recipient: member.user,
      actor: req.user._id || req.user.id,
      type: 'role_changed',
      communityId: community._id,
      message: `Your role changed to ${role} in ${community.name}`,
      read: false
    });

    res.json({ success: true, data: member, message: 'Role updated' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/community/:id/members/:memberId/ban
router.post('/:id/members/:memberId/ban', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const isAdmin = community.members.find(m => 
      (m.user?._id || m.user)?.toString() === userId && m.role === 'admin'
    );

    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    community.members = community.members.filter(m => 
      (m.user?._id || m.user)?.toString() !== req.params.memberId
    );
    community.memberCount = community.members.length;
    community.currentMembers = community.members.length;
    await community.save();

    res.json({ success: true, message: 'Member banned' });
  } catch (error) {
    console.error('Ban member error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 8. SOCIAL LINKS
// ============================================

// PUT /api/community/:id/social-links
router.put('/:id/social-links', authMiddleware, async (req, res) => {
  try {
    const { links } = req.body;
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const ownerId = (community.owner || community.createdBy).toString();

    if (ownerId !== userId) {
      return res.status(403).json({ success: false, error: 'Owner only' });
    }

    const userPlan = (req.user.plan || 'starter').toLowerCase();
    const proPlatforms = ['tiktok', 'facebook'];
    const enterprisePlatforms = [
      'tiktok', 'facebook', 'youtube', 'instagram', 
      'x_twitter', 'linkedin', 'discord', 'slack'
    ];
    const allowedPlatforms = userPlan === 'enterprise' ? enterprisePlatforms : proPlatforms;

    const validLinks = links.filter(l => allowedPlatforms.includes(l.platform));
    community.socialLinks = validLinks;
    await community.save();

    res.json({ success: true, data: community.socialLinks });
  } catch (error) {
    console.error('Social links error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 9. POSTS — CREATE, EDIT, DELETE, LIKE, PIN
// ============================================

// POST /api/community/:id/post
router.post('/:id/post', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const isMember = community.members.find(m => 
      (m.user?._id || m.user)?.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({ success: false, error: 'Must join community to post' });
    }

    const { content, type, poll, event, mediaUrls } = req.body;

    if (type === 'post' && !content?.trim()) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    if (type === 'poll') {
      const validOptions = poll?.options?.filter(o => o.text?.trim()) || [];
      if (!poll?.question?.trim() || validOptions.length < 2) {
        return res.status(400).json({ success: false, error: 'Poll needs question + at least 2 options' });
      }
    }

    if (type === 'event' && (!event?.title?.trim() || !event?.date)) {
      return res.status(400).json({ success: false, error: 'Event needs title and date' });
    }

    const postData = {
      community: req.params.id,
      author: req.user._id || req.user.id,
      type: type || 'post',
      content: content?.trim() || '',
      mediaUrls: mediaUrls || [],
      pinned: false,
      isSoftDeleted: false,
      edited: false,
      commentCount: 0,
      views: 0
    };

    if (type === 'poll') {
      postData.poll = {
        question: poll.question.trim(),
        options: poll.options.filter(o => o.text?.trim()).map(o => ({
          text: o.text.trim(),
          votes: []
        })),
        allowMultiple: poll.allowMultiple || false,
        expiresAt: poll.expiresInDays ? new Date(Date.now() + poll.expiresInDays * 86400000) : null
      };
    }

    if (type === 'event') {
      postData.event = {
        title: event.title.trim(),
        description: event.description?.trim() || '',
        date: event.date,
        time: event.time || '',
        endTime: event.endTime || '',
        location: event.location?.trim() || '',
        virtualLink: event.virtualLink?.trim() || '',
        attendeeLimit: event.attendeeLimit || 0,
        isPaid: event.isPaid || false,
        ticketPrice: event.ticketPrice || 0,
        attendees: []
      };
    }

    const post = await Post.create(postData);

    // Update community post count
    community.postCount = (community.postCount || 0) + 1;
    await community.save();

    // Notify all members
    for (const member of community.members) {
      const memberUserId = (member.user?._id || member.user)?.toString();
      if (memberUserId && memberUserId !== userId) {
        await Notification.create({
          recipient: member.user,
          actor: req.user._id || req.user.id,
          type: 'new_post',
          communityId: community._id,
          postId: post._id,
          message: `${req.user.name || 'Someone'} posted in ${community.name}`,
          read: false
        }).catch(() => {}); // Don't fail if notification fails
      }
    }

    const populated = await Post.findById(post._id)
      .populate('author', 'name avatar plan')
      .populate('poll.options.votes', 'name')
      .populate('event.attendees', 'name avatar');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/community/post/:postId
router.put('/post/:postId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    if (post.author.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Only author can edit' });
    }

    if (req.body.content !== undefined) {
      post.content = req.body.content;
      post.edited = true;
      post.editedAt = new Date();
    }

    await post.save();

    const populated = await Post.findById(post._id)
      .populate('author', 'name avatar plan')
      .populate('comments.author', 'name avatar')
      .populate('likes', 'name');

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/community/post/:postId
router.delete('/post/:postId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const community = await Community.findById(post.community);
    const isAdmin = community?.members.find(m => 
      (m.user?._id || m.user)?.toString() === userId && m.role === 'admin'
    );

    if (post.author.toString() !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    post.isSoftDeleted = true;
    await post.save();

    res.json({ success: true, message: 'Post deleted (recoverable for 30 days)' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/community/post/:postId/like
router.post('/post/:postId/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const index = post.likes.findIndex(id => id.toString() === userId);

    let liked = false;
    if (index > -1) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(req.user._id || req.user.id);
      liked = true;

      if (post.author.toString() !== userId) {
        await Notification.create({
          recipient: post.author,
          actor: req.user._id || req.user.id,
          type: 'post_liked',
          communityId: post.community,
          postId: post._id,
          message: `${req.user.name || 'Someone'} liked your post`,
          read: false
        }).catch(() => {});
      }
    }

    await post.save();

    res.json({ success: true, data: { liked, likeCount: post.likes.length } });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/community/post/:postId/pin
router.post('/post/:postId/pin', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const community = await Community.findById(post.community);
    const userId = (req.user._id || req.user.id).toString();
    const isAdmin = community?.members.find(m => 
      (m.user?._id || m.user)?.toString() === userId && m.role === 'admin'
    );

    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    post.pinned = !post.pinned;
    await post.save();

    if (post.pinned && post.author.toString() !== userId) {
      await Notification.create({
        recipient: post.author,
        actor: req.user._id || req.user.id,
        type: 'post_pinned',
        communityId: post.community,
        postId: post._id,
        message: `${req.user.name || 'Admin'} pinned your post`,
        read: false
      }).catch(() => {});
    }

    res.json({ success: true, data: { pinned: post.pinned } });
  } catch (error) {
    console.error('Pin post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 10. POLL VOTING & EVENT RSVP
// ============================================

// POST /api/community/post/:postId/vote
router.post('/post/:postId/vote', authMiddleware, async (req, res) => {
  try {
    const { optionId } = req.body;
    const post = await Post.findById(req.params.postId);
    
    if (!post?.poll) {
      return res.status(404).json({ success: false, error: 'Poll not found' });
    }

    const option = post.poll.options.find(o => o._id.toString() === optionId);
    if (!option) {
      return res.status(400).json({ success: false, error: 'Invalid option' });
    }

    const userId = (req.user._id || req.user.id).toString();

    // Remove previous votes
    post.poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(v => v.toString() !== userId);
    });

    // Add new vote
    option.votes.push(req.user._id || req.user.id);
    await post.save();

    const populated = await Post.findById(post._id).populate('poll.options.votes', 'name');

    res.json({ success: true, data: populated.poll });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/community/post/:postId/rsvp
router.post('/post/:postId/rsvp', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post?.event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const idx = post.event.attendees.findIndex(id => id.toString() === userId);

    let attending = false;

    if (idx > -1) {
      post.event.attendees.splice(idx, 1);
    } else {
      if (post.event.attendeeLimit > 0 && post.event.attendees.length >= post.event.attendeeLimit) {
        return res.status(400).json({ success: false, error: 'Event is full' });
      }
      post.event.attendees.push(req.user._id || req.user.id);
      attending = true;
    }

    await post.save();

    const populated = await Post.findById(post._id).populate('event.attendees', 'name avatar');

    res.json({ 
      success: true, 
      data: { 
        attending, 
        attendeeCount: post.event.attendees.length,
        event: populated.event 
      } 
    });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 11. REPORT POST
// ============================================

// POST /api/community/post/:postId/report
router.post('/post/:postId/report', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Reason is required' });
    }

    // In production: save to a Report model
    console.log(`Report: Post ${req.params.postId} reported by ${req.user._id} - Reason: ${reason}`);

    res.json({ success: true, message: 'Report submitted for review' });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 12. COMMENTS
// ============================================

// POST /api/community/post/:postId/comment
router.post('/post/:postId/comment', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, error: 'Comment content required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const comment = {
      author: req.user._id || req.user.id,
      content: content.trim(),
      likes: [],
      createdAt: new Date()
    };

    post.comments.push(comment);
    post.commentCount = post.comments.length;
    await post.save();

    const userId = (req.user._id || req.user.id).toString();
    if (post.author.toString() !== userId) {
      await Notification.create({
        recipient: post.author,
        actor: req.user._id || req.user.id,
        type: 'new_comment',
        communityId: post.community,
        postId: post._id,
        message: `${req.user.name || 'Someone'} commented on your post`,
        read: false
      }).catch(() => {});
    }

    const populated = await Post.findById(post._id)
      .populate('comments.author', 'name avatar');

    const newComment = populated.comments[populated.comments.length - 1];

    res.status(201).json({ success: true, data: newComment });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/community/comment/:commentId
router.put('/comment/:commentId', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, error: 'Content required' });
    }

    const post = await Post.findOne({ 'comments._id': req.params.commentId });
    if (!post) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    const userId = (req.user._id || req.user.id).toString();

    if (comment.author.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    comment.content = content.trim();
    comment.edited = true;
    comment.editedAt = new Date();
    await post.save();

    res.json({ success: true, data: comment });
  } catch (error) {
    console.error('Edit comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/community/comment/:commentId
router.delete('/comment/:commentId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ 'comments._id': req.params.commentId });
    if (!post) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    const userId = (req.user._id || req.user.id).toString();
    const community = await Community.findById(post.community);
    const isAdmin = community?.members.find(m => 
      (m.user?._id || m.user)?.toString() === userId && m.role === 'admin'
    );

    if (comment.author.toString() !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    post.comments.pull(req.params.commentId);
    post.commentCount = post.comments.length;
    await post.save();

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 13. MONETIZATION / EARNINGS
// ============================================

// GET /api/community/:communityId/earnings
router.get('/:communityId/earnings', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const ownerId = (community.owner || community.createdBy).toString();

    if (ownerId !== userId) {
      return res.status(403).json({ success: false, error: 'Owner only' });
    }

    const { period = 'monthly' } = req.query;
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'daily': startDate.setDate(now.getDate() - 1); break;
      case 'weekly': startDate.setDate(now.getDate() - 7); break;
      case 'monthly': startDate.setMonth(now.getMonth() - 1); break;
      case 'yearly': startDate.setFullYear(now.getFullYear() - 1); break;
      default: startDate.setMonth(now.getMonth() - 1);
    }

    const transactions = await Transaction.find({
      communityId: req.params.communityId,
      status: 'completed',
      date: { $gte: startDate, $lte: now }
    })
      .populate('subscriberId', 'name email')
      .sort({ date: -1 });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const platformFee = Math.round(totalRevenue * PLATFORM_COMMISSION_RATE);
    const ownerEarnings = totalRevenue - platformFee;

    const uniqueSubscribers = await Transaction.distinct('subscriberId', {
      communityId: req.params.communityId,
      status: 'completed',
      date: { $gte: startDate, $lte: now }
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        platformCommission: platformFee,
        ownerEarnings,
        subscriberCount: uniqueSubscribers.length,
        period,
        transactions
      }
    });
  } catch (error) {
    console.error('Earnings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/community/:communityId/transactions
router.get('/:communityId/transactions', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const ownerId = (community.owner || community.createdBy).toString();

    if (ownerId !== userId) {
      return res.status(403).json({ success: false, error: 'Owner only' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Transaction.countDocuments({ communityId: req.params.communityId });
    const transactions = await Transaction.find({ communityId: req.params.communityId })
      .populate('subscriberId', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
          hasMore: skip + transactions.length < total
        }
      }
    });
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/community/:communityId/subscription-price
router.put('/:communityId/subscription-price', authMiddleware, async (req, res) => {
  try {
    const { price, currency = 'USD' } = req.body;

    const community = await Community.findById(req.params.communityId);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const ownerId = (community.owner || community.createdBy).toString();

    if (ownerId !== userId) {
      return res.status(403).json({ success: false, error: 'Owner only' });
    }

    const numericPrice = Math.max(0, Math.round(price || 0));
    community.isMonetized = numericPrice > 0;
    community.subscriptionPrice = numericPrice;
    community.subscriptionCurrency = currency.toUpperCase();
    await community.save();

    res.json({ 
      success: true, 
      data: { 
        price: community.subscriptionPrice, 
        isMonetized: community.isMonetized,
        currency: community.subscriptionCurrency
      } 
    });
  } catch (error) {
    console.error('Subscription price error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 14. NOTIFICATIONS
// ============================================

// GET /api/community/notifications
router.get('/notifications/list', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Notification.countDocuments({ recipient: userId });

    const notifications = await Notification.find({ recipient: userId })
      .populate('actor', 'name avatar')
      .populate('communityId', 'name')
      .populate('postId', 'content')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      read: false 
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
          hasMore: skip + notifications.length < total
        }
      }
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/community/notifications/unread-count
router.get('/notifications/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const count = await Notification.countDocuments({ recipient: userId, read: false });
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/community/notifications/:id/read
router.post('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/community/notifications/read-all
router.post('/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );
    res.json({ success: true, message: 'All marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// EXPORT
// ============================================

module.exports = router;