const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['post', 'poll', 'event', 'article', 'media'], default: 'post' },
  content: { type: String, default: '' },
  mediaUrls: [{ type: String }],
  images: [{ type: String }],
  poll: {
    question: String,
    options: [{ text: String, votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
    allowMultiple: { type: Boolean, default: false },
    expiresAt: Date
  },
  event: {
    title: String, description: String, date: String, time: String,
    endTime: String, location: String, virtualLink: String,
    attendeeLimit: Number, isPaid: { type: Boolean, default: false },
    ticketPrice: Number, attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    edited: { type: Boolean, default: false },
    editedAt: Date,
    createdAt: { type: Date, default: Date.now }
  }],
  commentCount: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  pinned: { type: Boolean, default: false },
  edited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },
  isSoftDeleted: { type: Boolean, default: false, index: true },
  scheduledFor: { type: Date, default: null }
}, { timestamps: true });

PostSchema.index({ community: 1, createdAt: -1 });
PostSchema.index({ community: 1, pinned: -1 });
PostSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema); 