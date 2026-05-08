/**
 * BehavioralProfile Manager
 * Processes campaign feedback and updates learned behaviors
 * Location: backend/src/emailbrain/managers/BehavioralProfileManager.ts
 */
import { BehavioralProfile, CampaignFeedback, LearnedTrigger } from '../profiles/BehavioralProfile';
export declare class BehavioralProfileManager {
    /**
     * Process feedback from a sent campaign and update profile
     */
    static processCampaignFeedback(feedback: CampaignFeedback, currentProfile: BehavioralProfile): Promise<BehavioralProfile>;
    /**
     * Update learned triggers based on campaign results
     */
    private static updateLearnedTriggers;
    /**
     * Update subject line patterns
     */
    private static updateSubjectPatterns;
    /**
     * Update send time optimization
     */
    private static updateSendTimes;
    /**
     * Update CTA performance tracking
     */
    private static updateCTAPerformance;
    /**
     * Track engagement decay over sequence
     */
    private static updateEngagementDecay;
    /**
     * Update persona micro-adjustments
     */
    private static updatePersonaOverrides;
    /**
     * Track objections mentioned in replies
     */
    private static trackObjections;
    /**
     * Analyze trends
     */
    private static analyzeTrends;
    /**
     * Update data quality score
     */
    private static updateDataQuality;
    /**
     * Helper: Extract pattern from subject line
     * Examples: "Question + Benefit", "Number + Urgency", "Personalization + FOMO"
     */
    private static extractSubjectPattern;
    /**
     * Get best performer in category
     */
    static getBestPerformer(items: Array<{
        conversionRate?: number;
        successRate?: number;
        clickRate?: number;
    }>, metric?: "conversionRate" | "successRate" | "clickRate"): any;
    /**
     * Get confidence-weighted recommendation
     */
    static getConfidenceWeightedBest(items: LearnedTrigger[]): LearnedTrigger | null;
}
