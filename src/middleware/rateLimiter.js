// ============================================
// RATE LIMITER MIDDLEWARE
// 30 calls/month for Pro | 50 calls/month for Enterprise | 0 for Starter
// ============================================

const rateLimitStore = new Map(); // In production: use Redis

const PLAN_LIMITS = {
  starter: 0,
  pro: 30,
  professional: 30,
  enterprise: 50
};

const rateLimiter = (req, res, next) => {
  try {
    const userPlan = (req.user?.plan || 'starter').toLowerCase();
    const userId = (req.user?._id || req.user?.id)?.toString();
    const limit = PLAN_LIMITS[userPlan] || 0;

    // Starter has no API access
    if (limit === 0) {
      return res.status(403).json({
        success: false,
        error: 'API access requires Pro or Enterprise plan',
        code: 'PLAN_RESTRICTED'
      });
    }

    // Get current month key
    const now = new Date();
    const monthKey = `${userId}:${now.getFullYear()}-${now.getMonth() + 1}`;

    let userUsage = rateLimitStore.get(monthKey) || 0;
    userUsage++;

    rateLimitStore.set(monthKey, userUsage);

    // Set rate limit headers
    const remaining = Math.max(0, limit - userUsage);
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(resetDate.getTime() / 1000));

    if (userUsage > limit) {
      return res.status(429).json({
        success: false,
        error: `Rate limit exceeded. ${limit} calls/month for ${userPlan} plan. Resets on ${resetDate.toISOString().split('T')[0]}.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((resetDate.getTime() - now.getTime()) / 1000)
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Cleanup old entries every hour
setInterval(() => {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  
  for (const [key] of rateLimitStore) {
    if (!key.endsWith(currentMonthKey)) {
      rateLimitStore.delete(key);
    }
  }
}, 3600000);

module.exports = { rateLimiter, PLAN_LIMITS };