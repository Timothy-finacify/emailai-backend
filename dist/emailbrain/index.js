"use strict";
/**
 * EmailBrain Index - BACKEND VERSION
 * Central export file for the EmailBrain module (Node.js compatible)
 * Location: backend/src/emailbrain/index.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonaClassifier = exports.StageDetector = exports.BUYER_PERSONAS = exports.EMAIL_STAGES = exports.COMPANY_SIZE_CATEGORIES = exports.NICHE_PROFILES = exports.generateEmailContext = void 0;
// Core Function (No React components)
var EmailBrain_1 = require("./EmailBrain");
Object.defineProperty(exports, "generateEmailContext", { enumerable: true, get: function () { return EmailBrain_1.generateEmailContext; } });
// Configuration
var masterConfig_1 = require("./config/masterConfig");
Object.defineProperty(exports, "NICHE_PROFILES", { enumerable: true, get: function () { return masterConfig_1.NICHE_PROFILES; } });
Object.defineProperty(exports, "COMPANY_SIZE_CATEGORIES", { enumerable: true, get: function () { return masterConfig_1.COMPANY_SIZE_CATEGORIES; } });
Object.defineProperty(exports, "EMAIL_STAGES", { enumerable: true, get: function () { return masterConfig_1.EMAIL_STAGES; } });
Object.defineProperty(exports, "BUYER_PERSONAS", { enumerable: true, get: function () { return masterConfig_1.BUYER_PERSONAS; } });
// Services
var stageDetector_1 = require("./services/stageDetector");
Object.defineProperty(exports, "StageDetector", { enumerable: true, get: function () { return stageDetector_1.StageDetector; } });
var personaClassifier_1 = require("./services/personaClassifier");
Object.defineProperty(exports, "PersonaClassifier", { enumerable: true, get: function () { return personaClassifier_1.PersonaClassifier; } });
// NOTE: React hooks and components are NOT exported in backend version
// They are only available in the frontend version of this module
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
//# sourceMappingURL=index.js.map