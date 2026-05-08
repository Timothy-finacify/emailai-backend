/**
 * EmailBrain Index - BACKEND VERSION
 * Central export file for the EmailBrain module (Node.js compatible)
 * Location: backend/src/emailbrain/index.ts
 */
export { generateEmailContext } from './EmailBrain';
export type { EmailBrainContext, EmailBrainParams } from './EmailBrain';
export { NICHE_PROFILES, COMPANY_SIZE_CATEGORIES, EMAIL_STAGES, BUYER_PERSONAS } from './config/masterConfig';
export type { NicheProfile, EmailStageFramework, CompanySizeProfile, BuyerPersona, ObjectionHandler, ValueLadderTier } from './config/masterConfig';
export { StageDetector } from './services/stageDetector';
export type { EmailEngagementData } from './services/stageDetector';
export { PersonaClassifier } from './services/personaClassifier';
export type { UserProfile } from './services/personaClassifier';
/**
 * BACKEND USAGE EXAMPLE:
 *
 * const { generateEmailContext } = require('./emailbrain');
 *
 * const context = generateEmailContext({
 *   userId: 'user123',
 *   companyName: 'Acme Corp',
 *   userRole: 'CFO',
 *   companySize: 'mid_market',
 *   industry: 'Finance',
 *   nicheId: 'FIN_001',
 *   engagementData: {
 *     totalEmailsSent: 5,
 *     totalEmailsOpened: 3,
 *     totalEmailsClicked: 1,
 *     hasClickedCTA: true,
 *     hasScheduledDemo: false,
 *     hasRequestedQuote: false,
 *     daysSinceFirstEmail: 14,
 *     avgDaysBetweenEmails: 3,
 *     lastActionType: 'click',
 *     lastActionDaysAgo: 2
 *   }
 * });
 *
 * console.log(context.currentStage); // 'awareness'
 * console.log(context.systemPrompt); // AI prompt ready to use
 */ 
