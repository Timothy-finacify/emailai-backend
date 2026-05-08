"use strict";
// backend/src/routes/userPreferences.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User"); // Your user model
const router = express_1.default.Router();
// Apply auth middleware to all routes
router.use(auth_1.authMiddleware);
/**
 * GET /user/preferences/:userId
 * Load user preferences/learnings
 */
router.get('/user/preferences/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // Verify user owns this data
        if (req.user?.id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User_1.UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Return stored preferences or empty object
        const preferences = user.learningPreferences || {
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
            accountCreatedDate: user.createdAt,
            needsOnboarding: true,
            hasCompletedFirstCampaign: false,
            metadata: {
                version: '1.0',
                lastUpdated: new Date(),
                dataQuality: 'low'
            }
        };
        return res.json(preferences);
    }
    catch (error) {
        console.error('Error loading preferences:', error);
        return res.status(500).json({ error: 'Failed to load preferences' });
    }
});
/**
 * PUT /user/preferences
 * Save/update user preferences
 */
router.put('/user/preferences', async (req, res) => {
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
        // Update user document
        const user = await User_1.UserModel.findByIdAndUpdate(userId, {
            learningPreferences: {
                ...preferences,
                userId,
                isAuthenticated: true,
                metadata: {
                    ...preferences.metadata,
                    lastUpdated: new Date()
                }
            }
        }, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Log preference updates for analytics
        console.log(`✅ Updated preferences for user ${userId}`, {
            level: preferences.emailMarketingLevel,
            topicsCount: preferences.topicsOfInterest?.length || 0,
            questionsCount: preferences.questionsAsked?.length || 0,
            dataQuality: preferences.metadata?.dataQuality
        });
        return res.json({
            success: true,
            preferences: user.learningPreferences
        });
    }
    catch (error) {
        console.error('Error saving preferences:', error);
        return res.status(500).json({ error: 'Failed to save preferences' });
    }
});
/**
 * GET /user/preferences/:userId/summary
 * Get a summary of what we've learned about the user
 */
router.get('/user/preferences/:userId/summary', async (req, res) => {
    try {
        const { userId } = req.params;
        if (req.user?.id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User_1.UserModel.findById(userId);
        if (!user || !user.learningPreferences) {
            return res.status(404).json({ error: 'No preferences found' });
        }
        const prefs = user.learningPreferences;
        const summary = {
            topicsOfInterest: prefs.topicsOfInterest?.slice(0, 5) || [],
            mainChallenges: prefs.problemsDiscussed?.slice(0, 3) || [],
            experienceLevel: prefs.emailMarketingLevel,
            communicationStyle: `${prefs.preferredLength} and ${prefs.preferredTone}`,
            questionsAsked: prefs.questionsAsked?.length || 0,
            dataMaturity: prefs.metadata?.dataQuality,
            needsOnboarding: prefs.needsOnboarding,
            totalInteractions: prefs.questionsAsked?.length || 0
        };
        return res.json(summary);
    }
    catch (error) {
        console.error('Error getting summary:', error);
        return res.status(500).json({ error: 'Failed to get summary' });
    }
});
exports.default = router;
// ========================================
// User Model Extension (for reference)
// ========================================
// Add to your User model schema:
/*
interface IUser extends Document {
  // ... existing fields
  
  learningPreferences?: {
    userId: string;
    isAuthenticated: boolean;
    preferredTone: 'professional' | 'casual' | 'technical' | 'friendly';
    preferredLength: 'concise' | 'detailed' | 'balanced';
    topicsOfInterest: string[];
    topicsToAvoid: string[];
    questionsAsked: string[];
    problemsDiscussed: string[];
    solutionsPreferred: string[];
    emailMarketingLevel: 'beginner' | 'intermediate' | 'advanced';
    campaignObjectives: string[];
    targetAudience: string[];
    recentCampaignTopics: string[];
    averageMessagesPerSession: number;
    totalConversations: number;
    lastInteraction: Date;
    accountCreatedDate: Date;
    needsOnboarding: boolean;
    hasCompletedFirstCampaign: boolean;
    metadata: {
      version: string;
      lastUpdated: Date;
      dataQuality: 'low' | 'medium' | 'high' | 'very_high';
    };
  };
}

const userSchema = new Schema({
  // ... existing fields
  
  learningPreferences: {
    type: Schema.Types.Mixed,
    default: null
  }
});
*/ 
//# sourceMappingURL=userPreferences.js.map