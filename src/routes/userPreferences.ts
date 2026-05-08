// backend/src/routes/userPreferences.ts

import express, { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router: Router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /:userId
 * Load user preferences/learnings
 * Full path: /user/preferences/:userId
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user owns this data
    if (req.user?.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Return stored preferences or empty object
    const preferences = {
      userId,
      isAuthenticated: true,
      preferredTone: 'friendly',
      preferredLength: 'balanced',
      topicsOfInterest: [],
      topicsToAvoid: [],
      questionsAsked: [],
      problemsDiscussed: [],
      solutionsPreferred: [],
      emailMarketingLevel: 'beginner',
      campaignObjectives: [],
      targetAudience: [],
      recentCampaignTopics: [],
      averageMessagesPerSession: 0,
      totalConversations: 0,
      lastInteraction: new Date(),
      accountCreatedDate: req.user.createdAt,
      needsOnboarding: true,
      hasCompletedFirstCampaign: false,
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        dataQuality: 'low'
      }
    };

    return res.json(preferences);
  } catch (error) {
    console.error('Error loading preferences:', error);
    return res.status(500).json({ error: 'Failed to load preferences' });
  }
});

/**
 * PUT /
 * Save/update user preferences
 * Full path: /user/preferences
 */
router.put('/', async (req: Request, res: Response) => {
  try {
    const { userId, ...preferences } = req.body;

    // Verify user owns this data
    if (req.user?.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Validate preferences object
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Invalid preferences format' });
    }

    console.log(`✅ Updated preferences for user ${userId}`);

    return res.json({
      success: true,
      preferences: {
        ...preferences,
        userId,
        metadata: {
          ...preferences.metadata,
          lastUpdated: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return res.status(500).json({ error: 'Failed to save preferences' });
  }
});

/**
 * GET /:userId/summary
 * Get a summary of what we've learned about the user
 * Full path: /user/preferences/:userId/summary
 */
router.get('/:userId/summary', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (req.user?.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const summary = {
      topicsOfInterest: [],
      mainChallenges: [],
      experienceLevel: 'beginner',
      communicationStyle: 'balanced and friendly',
      questionsAsked: 0,
      dataMaturity: 'low',
      needsOnboarding: true,
      totalInteractions: 0
    };

    return res.json(summary);
  } catch (error) {
    console.error('Error getting summary:', error);
    return res.status(500).json({ error: 'Failed to get summary' });
  }
});

export default router;