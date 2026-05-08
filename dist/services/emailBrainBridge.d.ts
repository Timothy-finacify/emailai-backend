export function generateEmailWithBrain(user: any, subject: any, campaignName: any, options?: {}): Promise<{
    draft: any;
    metadata: {
        stage: any;
        persona: any;
        niche: any;
        provider: any;
        model: any;
        briefUsed: boolean;
    };
    tracking: {
        emailId: string;
        feedbackEndpoint: string;
    };
}>;
export function mapUserToEmailBrainFormat(user: any): {
    userId: any;
    companyName: any;
    userRole: any;
    companySize: any;
    industry: any;
    nicheId: any;
};
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
