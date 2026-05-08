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
    confidence: number;
    sampleSize: number;
    successRate: number;
    avgEngagementLift: number;
    last_updated: Date;
}
/**
 * SUBJECT LINE PATTERNS: Learn what structures work
 */
export interface SubjectLinePattern {
    pattern: string;
    openRate: number;
    clickRate: number;
    sampleSize: number;
    variation_examples: string[];
    last_tested: Date;
}
/**
 * SEND TIME OPTIMIZATION: Learn when this audience actually opens
 */
export interface OptimalSendTime {
    time: string;
    avgOpenRate: number;
    avgClickRate: number;
    sampleSize: number;
    by_persona?: Record<string, number>;
}
/**
 * CTA PERFORMANCE: Which calls-to-action actually convert
 */
export interface CTAPerformance {
    cta: string;
    conversionRate: number;
    clickRate: number;
    stage: string;
    persona: string;
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
    expected_engagement_rate: number;
    actual_engagement_rate: number;
    unsubscribe_risk: number;
    re_engagement_opportunity: number;
}
/**
 * PERSONA MICRO-ADJUSTMENTS
 * Override default persona behavior based on learned data
 * "The Pragmatist responds better to numbers, not urgency"
 */
export interface PersonaMicroAdjustment {
    personaType: string;
    actual_best_trigger: string;
    trigger_override_confidence: number;
    actual_best_cta: string;
    cta_override_confidence: number;
    sensitivity_to_urgency: number;
    sensitivity_to_social_proof: number;
    sensitivity_to_scarcity: number;
    sensitivity_to_exclusivity: number;
    sensitivity_to_price_anchoring: number;
    prefers_short_copy: boolean;
    prefers_lots_of_links: boolean;
    prefers_narrative: boolean;
    prefers_data_visualization: boolean;
    best_send_day: string;
    best_send_time: string;
    last_updated: Date;
    sample_size: number;
}
/**
 * MARKET SATURATION & COMPETITIVE INTELLIGENCE
 * Track if messaging is getting stale or competitors are copying
 */
export interface MarketIntelligence {
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
}
/**
 * OBJECTION PATTERN TRACKING
 * Learn which objections are ACTUALLY happening
 */
export interface ObjectionPattern {
    objection_statement: string;
    frequency: number;
    source: "email_reply" | "survey" | "support_ticket" | "sales_call";
    tested_reframes: Array<{
        reframe: string;
        success_rate: number;
        sampleSize: number;
    }>;
    best_response_cta: string;
}
/**
 * COMPLETE BEHAVIORAL PROFILE
 * Combines all learned data for a niche
 */
export interface BehavioralProfile {
    niche_id: string;
    niche_name: string;
    learned_triggers: LearnedTrigger[];
    learned_subject_patterns: SubjectLinePattern[];
    learned_send_times: OptimalSendTime[];
    learned_cta_performance: CTAPerformance[];
    engagement_decay_curves: EngagementDecayCurve[];
    fatigue_thresholds: {
        by_stage: Record<string, number>;
        by_persona: Record<string, number>;
        aggressive_threshold: number;
    };
    re_engagement_strategies: Array<{
        trigger: string;
        content_type: string;
        success_rate: number;
    }>;
    persona_overrides: Record<string, PersonaMicroAdjustment>;
    market_intelligence: MarketIntelligence;
    real_objections: ObjectionPattern[];
    data_quality: {
        total_campaigns_tracked: number;
        total_emails_sent: number;
        total_opens: number;
        total_clicks: number;
        total_conversions: number;
        last_updated: Date;
        confidence_level: "low" | "medium" | "high" | "very_high";
    };
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
    stage: string;
    persona: string;
    companySize: string;
    subject_line: string;
    cta_used: string;
    cta_type: string;
    primary_trigger_used: string;
    send_time: string;
    send_day: string;
    predicted_open_rate: number;
    predicted_click_rate: number;
    predicted_conversion_rate: number;
    actual_open_rate: number;
    actual_click_rate: number;
    actual_conversion_rate: number;
    opens: number;
    clicks: number;
    conversions: number;
    unsubscribes: number;
    complaints: number;
    bounces: number;
    reply_sentiment?: "positive" | "negative" | "neutral";
    objections_mentioned?: string[];
    sent_to: number;
    timestamp: Date;
}
/**
 * DATABASE SCHEMA HELPER
 * Use this to design your DB tables
 */
export declare const BEHAVIORAL_PROFILE_DB_SCHEMA: {
    behavioral_profiles: {
        niche_id: string;
        niche_name: string;
        data_quality_json: string;
        market_intelligence_json: string;
        last_updated: string;
    };
    learned_triggers: {
        id: string;
        niche_id: string;
        trigger: string;
        confidence: string;
        sampleSize: string;
        successRate: string;
        last_updated: string;
    };
    learned_subject_patterns: {
        id: string;
        niche_id: string;
        pattern: string;
        openRate: string;
        clickRate: string;
        sampleSize: string;
        last_tested: string;
    };
    learned_send_times: {
        id: string;
        niche_id: string;
        time: string;
        avgOpenRate: string;
        sampleSize: string;
    };
    cta_performance: {
        id: string;
        niche_id: string;
        cta: string;
        stage: string;
        persona: string;
        conversionRate: string;
        sampleSize: string;
    };
    persona_micro_adjustments: {
        id: string;
        niche_id: string;
        personaType: string;
        actual_best_trigger: string;
        sensitivity_to_urgency: string;
        sample_size: string;
        last_updated: string;
    };
    campaign_feedback: {
        id: string;
        nicheId: string;
        emailId: string;
        stage: string;
        persona: string;
        subject_line: string;
        cta_used: string;
        actual_open_rate: string;
        actual_click_rate: string;
        actual_conversion_rate: string;
        unsubscribes: string;
        timestamp: string;
    };
};
/**
 * INITIALIZATION
 * How to create a new BehavioralProfile for a niche
 */
export declare function initializeBehavioralProfile(nicheId: string, nicheName: string): BehavioralProfile;
