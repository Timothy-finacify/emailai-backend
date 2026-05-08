"use strict";
/**
 * EmailBrain Stage Detector
 * Determines user's position in buyer journey (awareness/consideration/decision/retention)
 * Location: src/emailbrain/services/stageDetector.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StageDetector = void 0;
class StageDetector {
    /**
     * Detect user's stage in buyer journey
     * Logic:
     * - AWARENESS: Early emails, low CTR, just opening/reading
     * - CONSIDERATION: More engagement, clicks, asking questions/requesting demos
     * - DECISION: High engagement, requesting quotes, scheduling calls
     * - RETENTION: Post-purchase, looking for upsells, using product
     */
    static detectStage(engagement) {
        // If they've converted, they're in retention
        if (engagement.conversionHistory && engagement.conversionHistory.length > 0) {
            const mostRecentConversion = engagement.conversionHistory[0];
            if (mostRecentConversion.daysAgo < 90) {
                return 'retention';
            }
        }
        // Calculate engagement metrics
        const openRate = engagement.totalEmailsSent > 0
            ? (engagement.totalEmailsOpened / engagement.totalEmailsSent) * 100
            : 0;
        const clickRate = engagement.totalEmailsOpened > 0
            ? (engagement.totalEmailsClicked / engagement.totalEmailsOpened) * 100
            : 0;
        // Decision stage signals
        if (engagement.hasRequestedQuote ||
            engagement.hasScheduledDemo ||
            (clickRate > 40 && engagement.totalEmailsClicked > 2)) {
            return 'decision';
        }
        // Consideration stage signals
        if (engagement.hasClickedCTA ||
            (clickRate > 15 && engagement.totalEmailsClicked > 1) ||
            (engagement.lastActionType === 'click' && engagement.lastActionDaysAgo !== undefined && engagement.lastActionDaysAgo < 7)) {
            return 'consideration';
        }
        // Awareness stage (default)
        return 'awareness';
    }
    /**
     * Calculate engagement metrics from behavior data
     */
    static calculateEngagementMetrics(engagement) {
        const openRate = engagement.totalEmailsSent > 0
            ? (engagement.totalEmailsOpened / engagement.totalEmailsSent) * 100
            : 0;
        const clickRate = engagement.totalEmailsOpened > 0
            ? (engagement.totalEmailsClicked / engagement.totalEmailsOpened) * 100
            : 0;
        const ctaClickRate = engagement.totalEmailsClicked > 0
            ? (Number(engagement.hasClickedCTA) / engagement.totalEmailsClicked) * 100
            : 0;
        // Engagement score (0-100)
        // Factors: open rate (30%), click rate (40%), CTA clicks (30%)
        const engagementScore = (openRate * 0.3) + (clickRate * 0.4) + (ctaClickRate * 0.3);
        // Active if opened email in last 14 days
        const isActive = engagement.lastActionDaysAgo !== undefined && engagement.lastActionDaysAgo < 14;
        return {
            openRate: Math.round(openRate * 100) / 100,
            clickRate: Math.round(clickRate * 100) / 100,
            ctaClickRate: Math.round(ctaClickRate * 100) / 100,
            engagementScore: Math.round(engagementScore * 100) / 100,
            isActive,
            lastEngagementDaysAgo: engagement.lastActionDaysAgo || engagement.daysSinceFirstEmail
        };
    }
    /**
     * Predict next stage based on current metrics
     */
    static predictNextStage(currentStage, metrics) {
        switch (currentStage) {
            case 'awareness':
                // Move to consideration if engagement score > 25
                if (metrics.engagementScore > 25 && metrics.isActive) {
                    return 'consideration';
                }
                return null;
            case 'consideration':
                // Move to decision if engagement score > 50
                if (metrics.engagementScore > 50 && metrics.isActive) {
                    return 'decision';
                }
                return null;
            case 'decision':
                // Move to retention if they convert (handled in detectStage)
                return null;
            case 'retention':
                return null; // End of journey
            default:
                return null;
        }
    }
    /**
     * Get stage-specific recommendations
     */
    static getStageRecommendations(stage) {
        const recommendations = {
            awareness: {
                emailFrequency: "1x per week",
                contentType: ["Educational", "Trend Report", "Industry Insights", "Best Practices"],
                ctaType: "Soft (Learn More, Download, Webinar)",
                toneSuggestion: "Helpful, informative, non-salesy"
            },
            consideration: {
                emailFrequency: "2x per week",
                contentType: ["Case Study", "Product Demo", "Feature Comparison", "ROI Calculator"],
                ctaType: "Moderate (Schedule Demo, Compare, Request Quote)",
                toneSuggestion: "Consultative, solution-focused, professional"
            },
            decision: {
                emailFrequency: "3-4x per week",
                contentType: ["Limited Offer", "Testimonial", "Success Story", "Implementation Timeline"],
                ctaType: "Hard (Buy Now, Apply Now, Claim Offer)",
                toneSuggestion: "Urgent, action-oriented, supportive"
            },
            retention: {
                emailFrequency: "1-2x per week",
                contentType: ["Best Practices", "Feature Update", "Success Celebration", "Upsell Offer"],
                ctaType: "Expansion (Upgrade, Referral, New Feature)",
                toneSuggestion: "Partnership-focused, success-celebrating, growth-minded"
            }
        };
        return recommendations[stage];
    }
}
exports.StageDetector = StageDetector;
//# sourceMappingURL=stageDetector.js.map