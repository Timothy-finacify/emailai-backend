/**
 * Main function: Generate email using EmailBrain
 */
export function generateEmailWithBrain(user: any, subject: any, campaignName: any): Promise<{
    success: boolean;
    draft: any;
    metadata: {
        stage: any;
        persona: any;
        niche: any;
    };
}>;
/**
 * Map user from database to EmailBrain expected format
 */
export function mapUserToEmailBrainFormat(user: any): {
    userId: any;
    companyName: any;
    userRole: any;
    companySize: any;
    industry: any;
    nicheId: any;
};
/**
 * Build engagement data from user's activity history
 * This would come from your email tracking/analytics database
 */
export function buildEngagementData(userId: any): Promise<{
    totalEmailsSent: number;
    totalEmailsOpened: number;
    totalEmailsClicked: number;
    hasClickedCTA: boolean;
    hasScheduledDemo: boolean;
    hasRequestedQuote: boolean;
    daysSinceFirstEmail: number;
    avgDaysBetweenEmails: number;
    lastActionType: string;
    lastActionDaysAgo: number;
}>;
