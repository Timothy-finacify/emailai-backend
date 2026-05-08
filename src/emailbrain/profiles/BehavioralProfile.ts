/**
 * EmailBrain Behavioral Profile System
 * Tracks REAL performance data and learns from every campaign
 * Location: backend/src/emailbrain/profiles/BehavioralProfile.ts
 */

/**
 * LEARNED TRIGGER: What actually resonates (vs. theoretical)
 * Confidence = how sure we are (based on sample size)
 */
export interface LearnedTrigger {
  trigger: string;
  confidence: number; // 0-1 (0.5 = weak signal, 0.9 = strong)
  sampleSize: number; // How many campaigns tested this
  successRate: number; // % of emails using this triggered desired action
  avgEngagementLift: number; // How much better than baseline
  last_updated: Date;
}

/**
 * SUBJECT LINE PATTERNS: Learn what structures work
 */
export interface SubjectLinePattern {
  pattern: string; // e.g., "Question + Benefit", "Number + Urgency"
  openRate: number;
  clickRate: number;
  sampleSize: number;
  variation_examples: string[]; // Real examples that worked
  last_tested: Date;
}

/**
 * SEND TIME OPTIMIZATION: Learn when this audience actually opens
 */
export interface OptimalSendTime {
  time: string; // e.g., "Tuesday 10am", "Friday 2pm"
  avgOpenRate: number;
  avgClickRate: number;
  sampleSize: number;
  by_persona?: Record<string, number>; // The_pragmatist: 0.32, The_innovator: 0.28
}

/**
 * CTA PERFORMANCE: Which calls-to-action actually convert
 */
export interface CTAPerformance {
  cta: string; // "Schedule Demo", "Start Free Trial", "Download Guide"
  conversionRate: number;
  clickRate: number;
  stage: string; // awareness, consideration, decision, retention
  persona: string; // Which persona resonates with this CTA
  sampleSize: number;
  sentiment: "soft" | "moderate" | "hard";
  urgency_level: "low" | "medium" | "high" | "critical";
}

/**
 * ENGAGEMENT DECAY CURVE
 * How interest naturally drops over email sequence
 * Used to predict fatigue and prevent unsubscribes
 */
export interface EngagementDecayCurve {
  email_sequence_position: number;
  expected_engagement_rate: number; // What we expect at position N
  actual_engagement_rate: number; // What actually happened
  unsubscribe_risk: number; // 0-1, when does fatigue spike?
  re_engagement_opportunity: number; // When should we send value content?
}

/**
 * PERSONA MICRO-ADJUSTMENTS
 * Override default persona behavior based on learned data
 * "The Pragmatist responds better to numbers, not urgency"
 */
export interface PersonaMicroAdjustment {
  personaType: string;
  
  // Override triggers
  actual_best_trigger: string;
  trigger_override_confidence: number;
  
  // Override CTAs
  actual_best_cta: string;
  cta_override_confidence: number;
  
  // Sensitivity factors (0-1, default 0.5)
  sensitivity_to_urgency: number; // Does urgency work? (0 = no, 1 = very)
  sensitivity_to_social_proof: number;
  sensitivity_to_scarcity: number;
  sensitivity_to_exclusivity: number;
  sensitivity_to_price_anchoring: number;
  
  // Content preferences
  prefers_short_copy: boolean;
  prefers_lots_of_links: boolean;
  prefers_narrative: boolean;
  prefers_data_visualization: boolean;
  
  // Optimal send pattern for this persona
  best_send_day: string;
  best_send_time: string;
  
  // Last updated
  last_updated: Date;
  sample_size: number; // Confidence (higher = more reliable)
}

/**
 * MARKET SATURATION & COMPETITIVE INTELLIGENCE
 * Track if messaging is getting stale or competitors are copying
 */
export interface MarketIntelligence {
  niche_id: string;
  
  // Overall saturation
  market_saturation_score: number; // 0-100 (0 = untapped, 100 = dead market)
  
  // What's being overused
  exhausted_urgency_signals: string[]; // "Limited time", "Only 3 left" everywhere
  overused_objection_handlers: string[];
  overused_triggers: string[];
  
  // What's working in market (from competitor intel)
  competitor_messaging_trends: string[];
  competitor_cta_patterns: string[];
  competitor_positioning_angles: string[];
  
  // Market gaps (opportunities)
  unique_angles_available: string[]; // Positioning NOT being used
  unused_triggers: string[]; // Psychology competitors ignore
  emerging_sub_niches: string[];
  
  // Recommendations
  suggested_positioning_shift: string;
  suggested_new_angle: string;
  confidence_in_recommendation: number;
  
  last_analyzed: Date;
}

/**
 * OBJECTION PATTERN TRACKING
 * Learn which objections are ACTUALLY happening
 */
export interface ObjectionPattern {
  objection_statement: string;
  frequency: number; // How often this objection appears
  source: "email_reply" | "survey" | "support_ticket" | "sales_call";
  
  // Which reframes work
  tested_reframes: Array<{
    reframe: string;
    success_rate: number;
    sampleSize: number;
  }>;
  
  // Best CTA to overcome this objection
  best_response_cta: string;
}

/**
 * COMPLETE BEHAVIORAL PROFILE
 * Combines all learned data for a niche
 */
export interface BehavioralProfile {
  niche_id: string;
  niche_name: string;
  
  // === LEARNED PERFORMANCE DATA ===
  
  // What triggers actually work (vs. theory)
  learned_triggers: LearnedTrigger[];
  
  // Subject line patterns that convert
  learned_subject_patterns: SubjectLinePattern[];
  
  // When this audience opens (by day/time)
  learned_send_times: OptimalSendTime[];
  
  // Which CTAs convert best
  learned_cta_performance: CTAPerformance[];
  
  // === FATIGUE & DECAY ===
  
  // How engagement drops over sequence
  engagement_decay_curves: EngagementDecayCurve[];
  
  // When unsubscribes spike
  fatigue_thresholds: {
    by_stage: Record<string, number>; // awareness: 8 emails, decision: 20 emails
    by_persona: Record<string, number>;
    aggressive_threshold: number; // Unsubscribe rate > this = too many
  };
  
  // How to recover engagement
  re_engagement_strategies: Array<{
    trigger: string;
    content_type: string;
    success_rate: number;
  }>;
  
  // === PERSONA MICRO-LEARNING ===
  
  // What actually works for EACH persona (overrides defaults)
  persona_overrides: Record<string, PersonaMicroAdjustment>;
  
  // === MARKET DYNAMICS ===
  
  // Competitive position, saturation, opportunities
  market_intelligence: MarketIntelligence;
  
  // === OBJECTION TRACKING ===
  
  // What objections are ACTUALLY happening
  real_objections: ObjectionPattern[];
  
  // === METADATA ===
  
  // How reliable is this data?
  data_quality: {
    total_campaigns_tracked: number;
    total_emails_sent: number;
    total_opens: number;
    total_clicks: number;
    total_conversions: number;
    last_updated: Date;
    confidence_level: "low" | "medium" | "high" | "very_high"; // Based on sample size
  };
  
  // Trend analysis
  trends: {
    triggers_improving: LearnedTrigger[];
    triggers_declining: LearnedTrigger[];
    ctas_gaining_strength: CTAPerformance[];
    ctas_losing_effectiveness: CTAPerformance[];
  };
}

/**
 * CAMPAIGN FEEDBACK DATA
 * Sent after each campaign to update BehavioralProfile
 */
export interface CampaignFeedback {
  emailId: string;
  nicheId: string;
  stage: string; // awareness, consideration, decision, retention
  persona: string; // the_pragmatist, the_innovator, etc.
  companySize: string; // micro_1_10, small_11_50, etc.
  
  // What we generated
  subject_line: string;
  cta_used: string;
  cta_type: string; // soft, moderate, hard
  primary_trigger_used: string;
  send_time: string; // "Tuesday 10am"
  send_day: string; // "Tuesday"
  
  // Predictions we made
  predicted_open_rate: number;
  predicted_click_rate: number;
  predicted_conversion_rate: number;
  
  // What actually happened
  actual_open_rate: number;
  actual_click_rate: number;
  actual_conversion_rate: number;
  
  // Engagement signals
  opens: number;
  clicks: number;
  conversions: number;
  unsubscribes: number;
  complaints: number;
  bounces: number;
  
  // User feedback (if captured)
  reply_sentiment?: "positive" | "negative" | "neutral";
  objections_mentioned?: string[];
  
  // Quality metrics
  sent_to: number; // How many people
  timestamp: Date;
}

/**
 * DATABASE SCHEMA HELPER
 * Use this to design your DB tables
 */
export const BEHAVIORAL_PROFILE_DB_SCHEMA = {
  behavioral_profiles: {
    niche_id: "VARCHAR(50) PRIMARY KEY",
    niche_name: "VARCHAR(255)",
    data_quality_json: "JSON",
    market_intelligence_json: "JSON",
    last_updated: "TIMESTAMP"
  },
  
  learned_triggers: {
    id: "UUID PRIMARY KEY",
    niche_id: "VARCHAR(50) FK",
    trigger: "VARCHAR(255)",
    confidence: "FLOAT",
    sampleSize: "INT",
    successRate: "FLOAT",
    last_updated: "TIMESTAMP"
  },
  
  learned_subject_patterns: {
    id: "UUID PRIMARY KEY",
    niche_id: "VARCHAR(50) FK",
    pattern: "VARCHAR(255)",
    openRate: "FLOAT",
    clickRate: "FLOAT",
    sampleSize: "INT",
    last_tested: "TIMESTAMP"
  },
  
  learned_send_times: {
    id: "UUID PRIMARY KEY",
    niche_id: "VARCHAR(50) FK",
    time: "VARCHAR(50)",
    avgOpenRate: "FLOAT",
    sampleSize: "INT"
  },
  
  cta_performance: {
    id: "UUID PRIMARY KEY",
    niche_id: "VARCHAR(50) FK",
    cta: "VARCHAR(255)",
    stage: "VARCHAR(50)",
    persona: "VARCHAR(50)",
    conversionRate: "FLOAT",
    sampleSize: "INT"
  },
  
  persona_micro_adjustments: {
    id: "UUID PRIMARY KEY",
    niche_id: "VARCHAR(50) FK",
    personaType: "VARCHAR(50)",
    actual_best_trigger: "VARCHAR(255)",
    sensitivity_to_urgency: "FLOAT",
    sample_size: "INT",
    last_updated: "TIMESTAMP"
  },
  
  campaign_feedback: {
    id: "UUID PRIMARY KEY",
    nicheId: "VARCHAR(50) FK",
    emailId: "VARCHAR(50)",
    stage: "VARCHAR(50)",
    persona: "VARCHAR(50)",
    subject_line: "TEXT",
    cta_used: "VARCHAR(255)",
    actual_open_rate: "FLOAT",
    actual_click_rate: "FLOAT",
    actual_conversion_rate: "FLOAT",
    unsubscribes: "INT",
    timestamp: "TIMESTAMP"
  }
};

/**
 * INITIALIZATION
 * How to create a new BehavioralProfile for a niche
 */
export function initializeBehavioralProfile(nicheId: string, nicheName: string): BehavioralProfile {
  return {
    niche_id: nicheId,
    niche_name: nicheName,
    
    learned_triggers: [],
    learned_subject_patterns: [],
    learned_send_times: [],
    learned_cta_performance: [],
    
    engagement_decay_curves: [],
    fatigue_thresholds: {
      by_stage: { awareness: 8, consideration: 12, decision: 20, retention: 16 },
      by_persona: {},
      aggressive_threshold: 0.5
    },
    re_engagement_strategies: [],
    
    persona_overrides: {},
    
    market_intelligence: {
       niche_id: nicheId, 
      market_saturation_score: 50, // Start neutral
      exhausted_urgency_signals: [],
      overused_objection_handlers: [],
      overused_triggers: [],
      competitor_messaging_trends: [],
      competitor_cta_patterns: [],
      competitor_positioning_angles: [],
      unique_angles_available: [],
      unused_triggers: [],
      emerging_sub_niches: [],
      suggested_positioning_shift: "",
      suggested_new_angle: "",
      confidence_in_recommendation: 0,
      last_analyzed: new Date()
    },
    
    real_objections: [],
    
    data_quality: {
      total_campaigns_tracked: 0,
      total_emails_sent: 0,
      total_opens: 0,
      total_clicks: 0,
      total_conversions: 0,
      last_updated: new Date(),
      confidence_level: "low"
    },
    
    trends: {
      triggers_improving: [],
      triggers_declining: [],
      ctas_gaining_strength: [],
      ctas_losing_effectiveness: []
    }
  };
}