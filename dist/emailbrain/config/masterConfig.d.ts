/**
 * EmailBrain Master Configuration
 * Core intelligence engine for EmailAI Pro
 * Location: src/emailbrain/config/masterConfig.ts
 */
export interface EmailStageFramework {
    primary_trigger: string;
    tone_adjustment: string;
    subject_line_style: string;
    cta_type: string;
    success_metrics: string[];
    content_focus: string;
    email_frequency: string;
    trigger_keywords: string[];
}
export interface CompanySizeProfile {
    decision_maker: string;
    pain_priorities: string[];
    psychological_driver: string;
    budget_reality: string;
    risk_tolerance: string;
    email_angle: string;
    subject_line_urgency: string;
    proof_needed: string;
    cta_sentiment: string;
    objection: string;
}
export interface BuyerPersona {
    archetype: string;
    motivation: string;
    pain_language: string;
    objection_style: string;
    email_trigger: string;
    subject_line_angle: string;
    social_proof_type: string;
    risk_concern: string;
    best_channel: string;
}
export interface ObjectionHandler {
    objection_statement: string;
    email_reframe: string;
    proof_anchor: string;
    cta_variant: string;
}
export interface ValueLadderTier {
    offering: string;
    price_point: string;
    psychology: string;
    buyer_type: string;
    key_messaging: string;
    cta: string;
}
export interface NicheProfile {
    niche_id: string;
    niche_name: string;
    sector: string;
    psychological_triggers: string[];
    communication_patterns: {
        tone: string;
        language_style: string;
        messaging_focus: string;
        formality_level: string;
    };
    pain_points: string[];
    value_propositions: string[];
    content_strategies: {
        narrative_hooks: string[];
        cta_patterns: string[];
        urgency_signals: string[];
    };
    audience_segments: string[];
    industry_benchmarks: {
        avg_email_open_rate: string;
        avg_ctr: string;
        best_send_times: string[];
        optimal_subject_line_length: string;
    };
    email_stage_framework: {
        awareness: EmailStageFramework;
        consideration: EmailStageFramework;
        decision: EmailStageFramework;
        retention: EmailStageFramework;
    };
    company_size_psychology: Record<string, CompanySizeProfile>;
    buyer_persona_dna: Record<string, BuyerPersona>;
    objection_handling: Record<string, ObjectionHandler>;
    seasonal_psychology: Record<string, any>;
    value_ladder: Record<string, ValueLadderTier>;
    competitive_positioning?: {
        market_positioning: {
            awareness_angle?: string;
            consideration_angle?: string;
            decision_angle?: string;
            retention_angle?: string;
        };
    };
    compliance_scan_rules?: string[];
    linguistic_mandates?: {
        forbidden_absolute_words: string[];
        required_disclaimer_trigger: string[];
        metaphor_bank: string[];
        preferred_verb_tense?: string;
    };
}
export declare const NICHE_PROFILES: Record<string, NicheProfile>;
export declare const COMPANY_SIZE_CATEGORIES: {
    MICRO: string;
    SMALL: string;
    MID_MARKET: string;
    ENTERPRISE: string;
};
export declare const EMAIL_STAGES: {
    AWARENESS: string;
    CONSIDERATION: string;
    DECISION: string;
    RETENTION: string;
};
export declare const BUYER_PERSONAS: {
    PRAGMATIST: string;
    INNOVATOR: string;
    RISK_AVERSE: string;
    CONSENSUS_BUILDER: string;
};
