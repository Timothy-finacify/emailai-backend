/**
 * Behavioral Profile Mongoose Model
 * Uses snake_case for database properties (MongoDB standard)
 * Location: backend/src/models/BehavioralProfile.ts
 */
import mongoose, { Document } from 'mongoose';
export interface IBehavioralProfileDB extends Document {
    niche_id: string;
    niche_name: string;
    learned_triggers: Array<{
        trigger: string;
        confidence: number;
        frequency: number;
    }>;
    learned_subject_patterns: string[];
    learned_send_times: Array<{
        time: string;
        open_rate: number;
    }>;
    learned_cta_performance: Array<{
        cta: string;
        persona: string;
        conversion_rate: number;
    }>;
    engagement_decay_curves: any[];
    fatigue_thresholds: {
        by_stage: Record<string, number>;
        by_persona: Record<string, number>;
        aggressive_threshold: number;
    };
    re_engagement_strategies: any[];
    persona_overrides: Record<string, any>;
    market_intelligence: {
        niche_id: string;
        market_saturation_score: number;
        exhausted_urgency_signals: string[];
        overused_objection_handlers: string[];
        overused_triggers: string[];
        competitor_messaging_trends: string[];
        competitor_cta_patterns: string[];
        competitor_positioning_angles: string[];
        unique_angles_available: string[];
        unused_triggers: string[];
        emerging_sub_niches: string[];
        suggested_positioning_shift: string;
        suggested_new_angle: string;
        confidence_in_recommendation: number;
        last_analyzed: Date;
    };
    real_objections: Array<{
        objection: string;
        frequency: number;
    }>;
    data_quality: {
        total_campaigns_tracked: number;
        total_emails_sent: number;
        total_opens: number;
        total_clicks: number;
        total_conversions: number;
        last_updated: Date;
        confidence_level: 'low' | 'medium' | 'high';
    };
    trends: {
        triggers_improving: string[];
        triggers_declining: string[];
        ctas_gaining_strength: string[];
        ctas_losing_effectiveness: string[];
    };
}
export declare const BehavioralProfileModel: mongoose.Model<IBehavioralProfileDB, {}, {}, {}, mongoose.Document<unknown, {}, IBehavioralProfileDB> & IBehavioralProfileDB & {
    _id: mongoose.Types.ObjectId;
}, any>;
/**
 * Helper function: Convert DB response (snake_case) to API response (camelCase)
 * Useful for returning clean JSON to frontend
 */
export declare function dbToCamelCase(dbProfile: IBehavioralProfileDB): {
    nicheId: string;
    nicheName: string;
    learnedTriggers: {
        trigger: string;
        confidence: number;
        frequency: number;
    }[];
    learnedSubjectPatterns: string[];
    learnedSendTimes: {
        time: string;
        open_rate: number;
    }[];
    learnedCtaPerformance: {
        cta: string;
        persona: string;
        conversion_rate: number;
    }[];
    marketIntelligence: {
        niche_id: string;
        market_saturation_score: number;
        exhausted_urgency_signals: string[];
        overused_objection_handlers: string[];
        overused_triggers: string[];
        competitor_messaging_trends: string[];
        competitor_cta_patterns: string[];
        competitor_positioning_angles: string[];
        unique_angles_available: string[];
        unused_triggers: string[];
        emerging_sub_niches: string[];
        suggested_positioning_shift: string;
        suggested_new_angle: string;
        confidence_in_recommendation: number;
        last_analyzed: Date;
    };
    realObjections: {
        objection: string;
        frequency: number;
    }[];
    dataQuality: {
        total_campaigns_tracked: number;
        total_emails_sent: number;
        total_opens: number;
        total_clicks: number;
        total_conversions: number;
        last_updated: Date;
        confidence_level: "low" | "medium" | "high";
    };
    trends: {
        triggers_improving: string[];
        triggers_declining: string[];
        ctas_gaining_strength: string[];
        ctas_losing_effectiveness: string[];
    };
};
/**
 * Helper function: Convert API input (camelCase) to DB format (snake_case)
 * Useful before saving to MongoDB
 */
export declare function camelCaseToDb(apiData: any): Partial<IBehavioralProfileDB>;
