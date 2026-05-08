// backend/src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// ============================================
// MOCK NOTIFICATIONS FOR DIFFERENT PLANS
// ============================================
const getNotificationsByPlan = (plan) => {
  const baseNotifications = [
    {
      id: 'notif_001',
      title: 'Welcome to EmailBrain!',
      message: 'Get started by creating your first campaign',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    }
  ];

  const planSpecificNotifications = {
    starter: [
      {
        id: 'notif_002',
        title: 'Starter Plan Tips',
        message: 'You have 3 campaigns and 10 AI emails this month',
        type: 'tip',
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'notif_003',
        title: 'Upgrade to Pro',
        message: 'Get unlimited campaigns and 5,000 subscribers!',
        type: 'promo',
        read: false,
        createdAt: new Date().toISOString()
      }
    ],
    pro: [
      {
        id: 'notif_002',
        title: 'Pro Features Unlocked',
        message: 'You have unlimited campaigns and 5,000 subscribers',
        type: 'success',
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'notif_003',
        title: 'Try A/B Testing',
        message: 'Optimize your campaigns with split testing',
        type: 'tip',
        read: false,
        createdAt: new Date().toISOString()
      }
    ],
    enterprise: [
      {
        id: 'notif_002',
        title: 'Enterprise Welcome',
        message: 'Your dedicated support team is ready to help',
        type: 'success',
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'notif_003',
        title: 'API Access Ready',
        message: 'Your API credentials are available in settings',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'notif_004',
        title: 'Custom Branding',
        message: 'Upload your logo and brand colors in settings',
        type: 'tip',
        read: false,
        createdAt: new Date().toISOString()
      }
    ]
  };

  return [...baseNotifications, ...(planSpecificNotifications[plan] || planSpecificNotifications.starter)];
};

// ============================================
// ROUTES
// ============================================

// GET /api/notifications - Get all notifications for user
router.get('/', authMiddleware, (req, res) => {
  try {
    const userPlan = req.user?.plan || 'starter';
    const notifications = getNotificationsByPlan(userPlan);
    
    res.json({
      success: true,
      data: notifications,
      unreadCount: notifications.filter(n => !n.read).length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// GET /api/notifications/unread-count - Get unread count only
router.get('/unread-count', authMiddleware, (req, res) => {
  try {
    const userPlan = req.user?.plan || 'starter';
    const notifications = getNotificationsByPlan(userPlan);
    const unreadCount = notifications.filter(n => !n.read).length;
    
    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/:id/read', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: `Notification ${id} marked as read`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', authMiddleware, (req, res) => {
  try {
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: `Notification ${id} deleted`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// POST /api/notifications/test - Create test notification (dev only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test', authMiddleware, (req, res) => {
    const { title, message, type = 'info' } = req.body;
    
    res.json({
      success: true,
      data: {
        id: `notif_test_${Date.now()}`,
        title: title || 'Test Notification',
        message: message || 'This is a test notification',
        type,
        read: false,
        createdAt: new Date().toISOString()
      }
    });
  });
}

module.exports = router;