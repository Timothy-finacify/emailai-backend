export = BriefPerformanceTracker;
declare class BriefPerformanceTracker {
    /**
     * Track a campaign's performance
     */
    static trackPerformance(userId: any, brief: any, campaignResult: any): void;
    /**
     * Get winning combinations for a goal/audience
     */
    static getWinningCombinations(goal: any, audience: any): {
        goal: any;
        audience: any;
        totalCampaigns: any;
        avgOpenRate: number;
        avgClickRate: number;
        bestMessage: {
            text: any;
            avgOpenRate: number;
        };
        bestAction: {
            text: any;
            avgConversionRate: number;
        };
    };
    /**
     * Get smart suggestions for a brief
     */
    static getSmartSuggestions(goal: any, audience: any): {
        hasData: boolean;
        totalCampaigns: any;
        avgOpenRate: number;
        suggestedMessage: any;
        suggestedAction: any;
        confidence: string;
        tip: any;
    } | {
        hasData: boolean;
        message: string;
    };
    /**
     * Get user's past successful briefs
     */
    static getUserWinningBriefs(userId: any, limit?: number): any;
    /**
     * Get all stats (for dashboard)
     */
    static getAllStats(): {
        totalCampaignsTracked: number;
        goalsTracked: number;
        topPerforming: any[];
    };
}
