"use strict";
/**
 * EmailBrain Behavioral Profile System
 * Tracks REAL performance data and learns from every campaign
 * Location: backend/src/emailbrain/profiles/BehavioralProfile.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BEHAVIORAL_PROFILE_DB_SCHEMA = void 0;
exports.initializeBehavioralProfile = initializeBehavioralProfile;
/**
 * DATABASE SCHEMA HELPER
 * Use this to design your DB tables
 */
exports.BEHAVIORAL_PROFILE_DB_SCHEMA = {
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
function initializeBehavioralProfile(nicheId, nicheName) {
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
//# sourceMappingURL=BehavioralProfile.js.map