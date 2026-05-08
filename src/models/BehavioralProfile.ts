/**
 * Behavioral Profile Mongoose Model
 * Uses snake_case for database properties (MongoDB standard)
 * Location: backend/src/models/BehavioralProfile.ts
 */

import mongoose, { Schema, Document } from 'mongoose';

// ✅ Database Interface - snake_case (for MongoDB documents)
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

// Mongoose Schema - snake_case property names for MongoDB
const BehavioralProfileSchema = new Schema<IBehavioralProfileDB>(
  {
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
    engagement_decay_curves: [Schema.Types.Mixed],
    fatigue_thresholds: {
      by_stage: Schema.Types.Mixed,
      by_persona: Schema.Types.Mixed,
      aggressive_threshold: Number
    },
    re_engagement_strategies: [Schema.Types.Mixed],
    persona_overrides: Schema.Types.Mixed,
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
  },
  { timestamps: true }
);

// ✅ Model Export
export const BehavioralProfileModel = mongoose.model<IBehavioralProfileDB>(
  'BehavioralProfile',
  BehavioralProfileSchema,
  'behavioral_profiles' // Collection name
);

/**
 * Helper function: Convert DB response (snake_case) to API response (camelCase)
 * Useful for returning clean JSON to frontend
 */
export function dbToCamelCase(dbProfile: IBehavioralProfileDB) {
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
export function camelCaseToDb(apiData: any): Partial<IBehavioralProfileDB> {
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