const AuditLog = require('../models/AuditLog');

const auditLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', async () => {
    try {
      await AuditLog.create({
        user: req.user?._id || null,
        email: req.user?.email || 'anonymous',
        action: req.method,
        ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1',
        userAgent: (req.get('User-Agent') || '').substring(0, 200),
        method: req.method,
        endpoint: req.originalUrl?.substring(0, 300),
        statusCode: res.statusCode,
        responseTime: Date.now() - start,
        details: `${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms)`
      });
    } catch (err) {
      // Silent — don't block requests if logging fails
    }
  });

  next();
};

module.exports = auditLogger;