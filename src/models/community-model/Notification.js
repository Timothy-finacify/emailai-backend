const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  actor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: [
      'new_post', 'new_comment', 'comment_reply', 'post_liked', 
      'member_joined', 'subscription_renewed', 'earnings_update', 
      'role_changed', 'post_pinned', 'community_featured'
    ],
    required: true 
  },
  message: { type: String, required: true },
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  read: { type: Boolean, default: false, index: true }
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);