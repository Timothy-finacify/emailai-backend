"use strict";
/**
 * Behavioral Profile Mongoose Model
 * Uses snake_case for database properties (MongoDB standard)
 * Location: backend/src/models/BehavioralProfile.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BehavioralProfileModel = void 0;
exports.dbToCamelCase = dbToCamelCase;
exports.camelCaseToDb = camelCaseToDb;
const mongoose_1 = __importStar(require("mongoose"));
// Mongoose Schema - snake_case property names for MongoDB
const BehavioralProfileSchema = new mongoose_1.Schema({
    niche_id: { type: String, required: true, unique: true, index: true },
    niche_name: String,
    learned_triggers: [
        {
            trigger: String,
            confidence: Number,
            frequency: Number
        }
    ],
    learned_subject_patterns: [String],
    learned_send_times: [
        {
            time: String,
            open_rate: Number
        }
    ],
    learned_cta_performance: [
        {
            cta: String,
            persona: String,
            conversion_rate: Number
        }
    ],
    engagement_decay_curves: [mongoose_1.Schema.Types.Mixed],
    fatigue_thresholds: {
        by_stage: mongoose_1.Schema.Types.Mixed,
        by_persona: mongoose_1.Schema.Types.Mixed,
        aggressive_threshold: Number
    },
    re_engagement_strategies: [mongoose_1.Schema.Types.Mixed],
    persona_overrides: mongoose_1.Schema.Types.Mixed,
    market_intelligence: {
        niche_id: String,
        market_saturation_score: Number,
        exhausted_urgency_signals: [String],
        overused_objection_handlers: [String],
        overused_triggers: [String],
        competitor_messaging_trends: [String],
        competitor_cta_patterns: [String],
        competitor_positioning_angles: [String],
        unique_angles_available: [String],
        unused_triggers: [String],
        emerging_sub_niches: [String],
        suggested_positioning_shift: String,
        suggested_new_angle: String,
        confidence_in_recommendation: Number,
        last_analyzed: { type: Date, default: Date.now }
    },
    real_objections: [
        {
            objection: String,
            frequency: Number
        }
    ],
    data_quality: {
        total_campaigns_tracked: { type: Number, default: 0 },
        total_emails_sent: { type: Number, default: 0 },
        total_opens: { type: Number, default: 0 },
        total_clicks: { type: Number, default: 0 },
        total_conversions: { type: Number, default: 0 },
        last_updated: { type: Date, default: Date.now },
        confidence_level: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low'
        }
    },
    trends: {
        triggers_improving: [String],
        triggers_declining: [String],
        ctas_gaining_strength: [String],
        ctas_losing_effectiveness: [String]
    }
}, { timestamps: true });
// ✅ Model Export
exports.BehavioralProfileModel = mongoose_1.default.model('BehavioralProfile', BehavioralProfileSchema, 'behavioral_profiles' // Collection name
);
/**
 * Helper function: Convert DB response (snake_case) to API response (camelCase)
 * Useful for returning clean JSON to frontend
 */
function dbToCamelCase(dbProfile) {
    return {
        nicheId: dbProfile.niche_id,
        nicheName: dbProfile.niche_name,
        learnedTriggers: dbProfile.learned_triggers,
        learnedSubjectPatterns: dbProfile.learned_subject_patterns,
        learnedSendTimes: dbProfile.learned_send_times,
        learnedCtaPerformance: dbProfile.learned_cta_performance,
        marketIntelligence: dbProfile.market_intelligence,
        realObjections: dbProfile.real_objections,
        dataQuality: dbProfile.data_quality,
        trends: dbProfile.trends
    };
}
/**
 * Helper function: Convert API input (camelCase) to DB format (snake_case)
 * Useful before saving to MongoDB
 */
function camelCaseToDb(apiData) {
    return {
        niche_id: apiData.nicheId,
        niche_name: apiData.nicheName,
        learned_triggers: apiData.learnedTriggers,
        learned_subject_patterns: apiData.learnedSubjectPatterns,
        learned_send_times: apiData.learnedSendTimes,
        learned_cta_performance: apiData.learnedCtaPerformance,
        market_intelligence: apiData.marketIntelligence,
        real_objections: apiData.realObjections,
        data_quality: apiData.dataQuality,
        trends: apiData.trends
    };
}
//# sourceMappingURL=BehavioralProfile.js.map