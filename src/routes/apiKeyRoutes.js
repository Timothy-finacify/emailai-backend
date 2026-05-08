const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const crypto = require('crypto');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const keys = (user.apiKeys || []).map(k => ({
      id: k._id ? k._id.toString() : k._id,
      name: k.name,
      key: k.key,
      preview: (k.key || '').substring(0, 8) + '...',
      createdAt: k.createdAt
    }));
    res.json({ success: true, keys });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}); 


// POST /api/keys/generate - Create new key
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const key = 'eak_' + crypto.randomBytes(24).toString('hex');
    
    const user = await User.findById(req.user._id);
    if (!user.apiKeys) user.apiKeys = [];
    
    user.apiKeys.push({
      name: req.body.name || 'API Key',
      key: key,
      createdAt: new Date(),
      callCount: 0
    });
    
    await user.save();
    
   const newKey = user.apiKeys[user.apiKeys.length - 1];

res.json({
  success: true,
  key: {
    id: newKey._id || newKey._id,
    name: newKey.name,
    key: key,
    preview: key.substring(0, 8) + '...',
    createdAt: newKey.createdAt,
    callCount: 0
  }
});

  } catch (error) {
    console.error('Generate key error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/keys/:id - Revoke key
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.apiKeys = (user.apiKeys || []).filter(k => k._id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true, message: 'Key revoked' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;