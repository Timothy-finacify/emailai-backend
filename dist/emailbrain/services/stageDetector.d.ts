/**
 * EmailBrain Stage Detector
 * Determines user's position in buyer journey (awareness/consideration/decision/retention)
 * Location: src/emailbrain/services/stageDetector.ts
 */
export interface EmailEngagementData {
    totalEmailsSent: number;
    totalEmailsOpened: number;
    totalEmailsClicked: number;
    hasClickedCTA: boolean;
    hasScheduledDemo: boolean;
    hasRequestedQuote: boolean;
    daysSinceFirstEmail: number;
    avgDaysBetweenEmails: number;
    lastActionType?: 'open' | 'click' | 'cta' | 'none';
    lastActionDaysAgo?: number;
    conversionHistory?: {
        type: 'demo' | 'quote' | 'purchase' | 'upgrade';
        daysAgo: number;
    }[];
}
export interface UserBehaviorMetrics {
    openRate: number;
    clickRate: number;
    ctaClickRate: number;
    engagementScore: number;
    isActive: boolean;
    lastEngagementDaysAgo: number;
}
export declare class StageDetector {
    /**
     * Detect user's stage in buyer journey
     * Logic:
     * - AWARENESS: Early emails, low CTR, just opening/reading
     * - CONSIDERATION: More engagement, clicks, asking questions/requesting demos
     * - DECISION: High engagement, requesting quotes, scheduling calls
     * - RETENTION: Post-purchase, looking for upsells, using product
     */
    static detectStage(engagement: EmailEngagementData): 'awareness' | 'consideration' | 'decision' | 'retention';
    /**
     * Calculate engagement metrics from behavior data
     */
    static calculateEngagementMetrics(engagement: EmailEngagementData): UserBehaviorMetrics;
    /**
     * Predict next stage based on current metrics
     */
    static predictNextStage(currentStage: 'awareness' | 'consideration' | 'decision' | 'retention', metrics: UserBehaviorMetrics): 'awareness' | 'consideration' | 'decision' | 'retention' | null;
    /**
     * Get stage-specific recommendations
     */
    static getStageRecommendations(stage: 'awareness' | 'consideration' | 'decision' | 'retention'): {
        emailFrequency: string;
        contentType: string[];
        ctaType: string;
        toneSuggestion: string;
    };
}
