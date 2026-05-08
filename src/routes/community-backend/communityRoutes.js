// ============================================
// COMMUNITY ROUTES — All community, post, comment, poll, event, member management
// ============================================

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const Community = require('../../models/Community');
const Post = require('../../models/Post');
const Notification = require('../../models/Notification');




// ============================================
// COMMUNITY CRUD
// ============================================

// GET all communities (with search, category, filter)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, category, filter, page = 1, limit = 12 } = req.query;
    let query = { isActive: true };
    
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category && category !== 'all') query.category = category;
    
    let sortObj = { createdAt: -1 };
    if (filter === 'popular') sortObj = { currentMembers: -1 };
    if (filter === 'newest') sortObj = { createdAt: -1 };
    if (filter === 'trending') sortObj = { 'posts.createdAt': -1 };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Community.countDocuments(query);
    
    const communities = await Community.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select('name description category visibility bannerImage avatarImage owner memberCount isMonetized subscriptionPrice socialLinks tags createdAt');
    
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
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single community with posts
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('owner', 'name email avatar plan')
      .populate('members.user', 'name email avatar plan');
    
    if (!community) return res.status(404).json({ success: false, error: 'Community not found' });
    
    const userId = (req.user._id || req.user.id).toString();
    const member = community.members.find(m => {
      const memberId = (m.user?._id || m.user)?.toString();
      return memberId === userId;
    });
    
    const posts = await Post.find({ community: req.params.id, isSoftDeleted: false })
      .populate('author', 'name avatar plan')
      .populate('comments.author', 'name avatar')
      .populate('likes', 'name')
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
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE community (with plan limit check)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { name, description, category, visibility, isMonetized, subscriptionPrice, tags } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Community name is required' });
    }
    
    // Plan limit check
    const userPlan = (req.user.plan || 'starter').toLowerCase();
    const ownedCount = await Community.countDocuments({ owner: req.user._id || req.user.id });
    
    const limits = { starter: 0, pro: 4, professional: 4, enterprise: 999 };
    const maxAllowed = limits[userPlan] || 0;
    
    if (ownedCount >= maxAllowed) {
      return res.status(403).json({
        success: false,
        error: userPlan === 'starter'
          ? 'Upgrade to Pro to create communities'
          : `Community limit reached (${maxAllowed} max). Upgrade to Enterprise for unlimited.`
      });
    }
    
    // Price validation
    let price = 0;
    if (isMonetized && subscriptionPrice) {
      price = Math.max(0, Math.round(subscriptionPrice));
    }
    
    const community = await Community.create({
      name: name.trim(),
      description: description?.trim() || '',
      category: category || 'general',
      visibility: visibility || 'public',
      isMonetized: isMonetized || false,
      subscriptionPrice: price,
      tags: tags || [],
      owner: req.user._id || req.user.id,
      members: [{ user: req.user._id || req.user.id, role: 'admin' }],
      memberCount: 1
    });
    
    // Update user's community count
    await User.findByIdAndUpdate(req.user._id || req.user.id, {
      $inc: { communitiesOwned: 1 }
    });
    
    const populated = await Community.findById(community._id)
      .populate('owner', 'name avatar plan');
    
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE community
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, error: 'Not found' });
    
    const userId = (req.user._id || req.user.id).toString();
    if (community.owner.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Only owner can update' });
    }
    
    const allowedUpdates = ['name', 'description', 'category', 'visibility', 'isMonetized', 'subscriptionPrice', 'tags', 'bannerImage', 'avatarImage'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        community[field] = req.body[field];
      }
    });
    
    await community.save();
    
    const populated = await Community.findById(community._id)
      .populate('owner', 'name avatar plan');
    
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE community
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, error: 'Not found' });
    
    const userId = (req.user._id || req.user.id).toString();
    if (community.owner.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Only owner can delete' });
    }
    
    await Post.deleteMany({ community: req.params.id });
    await Community.findByIdAndDelete(req.params.id);
    
    await User.findByIdAndUpdate(req.user._id || req.user.id, {
      $inc: { communitiesOwned: -1 }
    });
    
    res.json({ success: true, message: 'Community deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// MEMBER MANAGEMENT
// ============================================

// JOIN community
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, error: 'Not found' });
    
    const userId = (req.user._id || req.user.id).toString();
    const alreadyMember = community.members.find(m => m.user.toString() === userId);
    
    if (alreadyMember) {
      return res.json({ success: true, data: { isMember: true }, message: 'Already a member' });
    }
    
    // Paid community check
    if (community.isMonetized && community.subscriptionPrice > 0) {
      // In production: verify payment/subscription exists
      // For now: allow join (payment handled separately)
    }
    
    community.members.push({ user: req.user._id || req.user.id, role: 'member' });
    community.memberCount = community.members.length;
    await community.save();
    
    // Notify community owner
    await Notification.create({
      recipient: community.owner,
      actor: req.user._id || req.user.id,
      type: 'member_joined',
      communityId: community._id,
      message: 'joined your community',
      read: false
    });
    
    res.json({ success: true, data: { isMember: true }, message: 'Joined successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// LEAVE community
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, error: 'Not found' });
    
    const userId = (req.user._id || req.user.id).toString();
    const member = community.members.find(m => m.user.toString() === userId);
    
    if (!member) return res.json({ success: true, message: 'Not a member' });
    if (member.role === 'admin') {
      return res.status(400).json({ success: false, error: 'Admin cannot leave. Transfer ownership or delete community.' });
    }
    
    community.members = community.members.filter(m => m.user.toString() !== userId);
    community.memberCount = community.members.length;
    await community.save();
    
    res.json({ success: true, data: { isMember: false }, message: 'Left community' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET members
router.get('/:id/members', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const community = await Community.findById(req.params.id)
      .populate({
        path: 'members.user',
        select: 'name email avatar plan',
        options: {
          skip: (parseInt(page) - 1) * parseInt(limit),
          limit: parseInt(limit)
        }
      });
    
    if (!community) return res.status(404).json({ success: false, error: 'Not found' });
    
    res.json({
      success: true,
      data: {
        members: community.members,
        total: community.memberCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE member role
router.put('/:id/members/:memberId/role', authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'moderator', 'member'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }
    
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, error: 'Not found' });
    
    const userId = (req.user._id || req.user.id).toString();
    const isAdmin = community.members.find(m => m.user.toString() === userId && m.role === 'admin');
    if (!isAdmin) return res.status(403).json({ success: false, error: 'Admin only' });
    
    const member = community.members.find(m => m.user.toString() === req.params.memberId);
    if (!member) return res.status(404).json({ success: false, error: 'Member not found' });
    
    member.role = role;
    await community.save();
    
    res.json({ success: true, data: member, message: 'Role updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// BAN member
router.post('/:id/members/:memberId/ban', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, error: 'Not found' });
    
    const userId = (req.user._id || req.user.id).toString();
    const isAdmin = community.members.find(m => m.user.toString() === userId && m.role === 'admin');
    if (!isAdmin) return res.status(403).json({ success: false, error: 'Admin only' });
    
    community.members = community.members.filter(m => m.user.toString() !== req.params.memberId);
    community.memberCount = community.members.length;
    await community.save();
    
    res.json({ success: true, message: 'Member banned' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SOCIAL LINKS
// ============================================

// UPDATE social links
router.put('/:id/social-links', authMiddleware, async (req, res) => {
  try {
    const { links } = req.body;
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, error: 'Not found' });
    
    const userId = (req.user._id || req.user.id).toString();
    if (community.owner.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Owner only' });
    }
    
    // Validate based on plan
    const userPlan = (req.user.plan || 'starter').toLowerCase();
    const proPlatforms = ['tiktok', 'facebook'];
    const enterprisePlatforms = ['tiktok', 'facebook', 'youtube', 'instagram', 'x_twitter', 'linkedin', 'discord', 'slack'];
    const allowedPlatforms = userPlan === 'enterprise' ? enterprisePlatforms : proPlatforms;
    
    const validLinks = links.filter(link => allowedPlatforms.includes(link.platform));
    community.socialLinks = validLinks;
    await community.save();
    
    res.json({ success: true, data: community.socialLinks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POSTS (Create, Read, Update, Delete)
// ============================================

// CREATE post
router.post('/:id/post', authMiddleware, async (req, res) => {
  try {
    const { content, type, poll, event, mediaUrls, scheduledFor } = req.body;
    
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, error: 'Community not found' });
    
    const userId = (req.user._id || req.user.id).toString();
    const isMember = community.members.find(m => m.user.toString() === userId);
    if (!isMember) return res.status(403).json({ success: false, error: 'Join community first' });
    
    if (type === 'post' && !content?.trim()) {
      return res.status(400).json({ success: false, error: 'Content required' });
    }
    if (type === 'poll' && (!poll?.question || !poll?.options || poll.options.filter(o => o.text?.trim()).length < 2)) {
      return res.status(400).json({ success: false, error: 'Poll needs question + at least 2 options' });
    }
    if (type === 'event' && (!event?.title || !event?.date)) {
      return res.status(400).json({ success: false, error: 'Event needs title and date' });
    }
    
    const postData = {
      community: req.params.id,
      author: req.user._id || req.user.id,
      type: type || 'post',
      content: content?.trim() || '',
      mediaUrls: mediaUrls || [],
      scheduledFor: scheduledFor || null,
      pinned: false,
      isSoftDeleted: false,
      edited: false
    };
    
    if (type === 'poll') {
      postData.poll = {
        question: poll.question.trim(),
        options: poll.options.filter(o => o.text?.trim()).map(o => ({
          text: o.text.trim(),
          votes: []
        }))
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
    
    // Notify community members about new post (background)
    community.members.forEach(async (member) => {
      if (member.user.toString() !== userId) {
        await Notification.create({
          recipient: member.user,
          actor: req.user._id || req.user.id,
          type: 'new_post',
          communityId: community._id,
          postId: post._id,
          message: `posted in ${community.name}`,
          read: false
        });
      }
    });
    
    const populated = await Post.findById(post._id)
      .populate('author', 'name avatar plan')
      .populate('poll.options.votes', 'name')
      .populate('event.attendees', 'name avatar');
    
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// EDIT post
router.put('/post/:postId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    
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
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE post (soft delete)
router.delete('/post/:postId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    
    const userId = (req.user._id || req.user.id).toString();
    const community = await Community.findById(post.community);
    const isAdmin = community?.members.find(m => m.user.toString() === userId && m.role === 'admin');
    
    if (post.author.toString() !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    // Soft delete for 30 days
    post.isSoftDeleted = true;
    await post.save();
    
    res.json({ success: true, message: 'Post deleted (recoverable for 30 days)' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// LIKE/UNLIKE post
router.post('/post/:postId/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    
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
          postId: post._id,
          communityId: post.community,
          message: 'liked your post',
          read: false
        });
      }
    }
    
    await post.save();
    res.json({ success: true, data: { liked, likeCount: post.likes.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PIN/UNPIN post (admin only)
router.post('/post/:postId/pin', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    
    const community = await Community.findById(post.community);
    const userId = (req.user._id || req.user.id).toString();
    const isAdmin = community?.members.find(m => m.user.toString() === userId && m.role === 'admin');
    
    if (!isAdmin) return res.status(403).json({ success: false, error: 'Admin only' });
    
    post.pinned = !post.pinned;
    await post.save();
    
    res.json({ success: true, data: { pinned: post.pinned } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// VOTE on poll
router.post('/post/:postId/vote', authMiddleware, async (req, res) => {
  try {
    const { optionId } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post?.poll) return res.status(404).json({ success: false, error: 'Poll not found' });
    
    const option = post.poll.options.find(o => o._id.toString() === optionId);
    if (!option) return res.status(400).json({ success: false, error: 'Invalid option' });
    
    const userId = (req.user._id || req.user.id).toString();
    post.poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(v => v.toString() !== userId);
    });
    option.votes.push(req.user._id || req.user.id);
    
    await post.save();
    
    const populated = await Post.findById(post._id).populate('poll.options.votes', 'name');
    res.json({ success: true, data: populated.poll });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// RSVP to event
router.post('/post/:postId/rsvp', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post?.event) return res.status(404).json({ success: false, error: 'Event not found' });
    
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
    res.json({ success: true, data: { attending, attendeeCount: post.event.attendees.length, event: populated.event } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// REPORT post
router.post('/post/:postId/report', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, error: 'Reason required' });
    
    // Store report (you can create a Report model if needed)
    // For now, just acknowledge
    res.json({ success: true, message: 'Report submitted for review' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// COMMENTS
// ============================================

// ADD comment
router.post('/post/:postId/comment', authMiddleware, async (req, res) => {
  try {
    const { content, parentCommentId } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, error: 'Comment content required' });
    
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    
    post.comments.push({
      author: req.user._id || req.user.id,
      content: content.trim(),
      parentCommentId: parentCommentId || null,
      createdAt: new Date()
    });
    post.commentCount = post.comments.length;
    await post.save();
    
    const userId = (req.user._id || req.user.id).toString();
    if (post.author.toString() !== userId) {
      await Notification.create({
        recipient: post.author,
        actor: req.user._id || req.user.id,
        type: 'new_comment',
        postId: post._id,
        communityId: post.community,
        message: 'commented on your post',
        read: false
      });
    }
    
    const populated = await Post.findById(post._id)
      .populate('comments.author', 'name avatar')
      .populate('author', 'name avatar');
    
    res.status(201).json({ success: true, data: populated.comments[populated.comments.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// EDIT comment
router.put('/comment/:commentId', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, error: 'Content required' });
    
    const post = await Post.findOne({ 'comments._id': req.params.commentId });
    if (!post) return res.status(404).json({ success: false, error: 'Comment not found' });
    
    const comment = post.comments.id(req.params.commentId);
    if (comment.author.toString() !== (req.user._id || req.user.id).toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    comment.content = content.trim();
    comment.edited = true;
    comment.editedAt = new Date();
    await post.save();
    
    res.json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE comment
router.delete('/comment/:commentId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ 'comments._id': req.params.commentId });
    if (!post) return res.status(404).json({ success: false, error: 'Comment not found' });
    
    const comment = post.comments.id(req.params.commentId);
    const userId = (req.user._id || req.user.id).toString();
    const community = await Community.findById(post.community);
    const isAdmin = community?.members.find(m => m.user.toString() === userId && m.role === 'admin');
    
    if (comment.author.toString() !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    post.comments.pull(req.params.commentId);
    post.commentCount = post.comments.length;
    await post.save();
    
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// LIKE comment
router.post('/comment/:commentId/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ 'comments._id': req.params.commentId });
    if (!post) return res.status(404).json({ success: false, error: 'Comment not found' });
    
    const comment = post.comments.id(req.params.commentId);
    const userId = (req.user._id || req.user.id).toString();
    const idx = (comment.likes || []).findIndex(id => id.toString() === userId);
    
    if (idx > -1) {
      comment.likes.splice(idx, 1);
    } else {
      if (!comment.likes) comment.likes = [];
      comment.likes.push(req.user._id || req.user.id);
    }
    
    await post.save();
    res.json({ success: true, data: { liked: idx === -1, likeCount: comment.likes?.length || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;