const AnalyticsEvent = require('../models/AnalyticsEvent');

const trackView = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId || req.body.campaignId;
    if (campaignId && req.user) {
      await AnalyticsEvent.create({
        userId: req.user._id,
        campaignId,
        type: 'view',
        date: new Date()
      });
    }
  } catch (err) {
    // Silent
  }
  next();
};

const trackEvent = (type) => async (req, res, next) => {
  try {
    if (req.user) {
      await AnalyticsEvent.create({
        userId: req.user._id,
        campaignId: req.params.campaignId || req.body.campaignId || null,
        type,
        date: new Date()
      });
    }
  } catch (err) {
    // Silent
  }
  next();
};

module.exports = { trackView, trackEvent };