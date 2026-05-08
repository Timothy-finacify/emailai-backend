const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, '../data/niches.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const rows = csvContent.split('\n').slice(1); // Skip header
const niches = {};

// Default template for missing niches
const getDefaultNicheProfile = (nicheId, nicheName, sector, subSector, targetAudience) => {
  // Determine sector-based defaults
  const sectorDefaults = {
    Financials: {
      psychological_triggers: ["Security & Trust", "Financial Freedom", "ROI", "Risk Mitigation"],
      tone: "Professional, Trustworthy, Data-driven",
      language_style: "Clear, Compliance-aware, Value-focused",
      formality_level: "Moderate to High"
    },
    Technology: {
      psychological_triggers: ["Innovation", "Efficiency", "Competitive Advantage", "Scalability"],
      tone: "Forward-thinking, Educational, Solution-oriented",
      language_style: "Technical but accessible, Benefit-focused",
      formality_level: "Moderate"
    },
    "Commerce (E-commerce)": {
      psychological_triggers: ["Social Proof", "Convenience", "Fear of Missing Out", "Instant Gratification"],
      tone: "Friendly, Urgent, Aspirational",
      language_style: "Visual, Emotion-driven, Action-oriented",
      formality_level: "Low to Moderate"
    },
    Healthcare: {
      psychological_triggers: ["Trust", "Safety", "Empathy", "Results"],
      tone: "Compassionate, Professional, Reassuring",
      language_style: "Clear, Educational, HIPAA-aware",
      formality_level: "Moderate to High"
    },
    Education: {
      psychological_triggers: ["Growth", "Career Advancement", "Certification", "Expertise"],
      tone: "Encouraging, Authoritative, Supportive",
      language_style: "Educational, Structured, Goal-oriented",
      formality_level: "Moderate"
    },
    "Real Estate": {
      psychological_triggers: ["Wealth Building", "Location Scarcity", "Appreciation", "Passive Income"],
      tone: "Confident, Market-aware, Strategic",
      language_style: "Investment-focused, Location-specific",
      formality_level: "Moderate"
    },
    Manufacturing: {
      psychological_triggers: ["Efficiency", "Quality Control", "Cost Reduction", "Reliability"],
      tone: "Technical, Precise, Process-oriented",
      language_style: "Specification-heavy, ROI-focused",
      formality_level: "High"
    },
    "Logistics & Transportation": {
      psychological_triggers: ["Speed", "Reliability", "Cost Savings", "Tracking"],
      tone: "Efficient, Direct, Operational",
      language_style: "Metrics-focused, Process-driven",
      formality_level: "Moderate"
    },
    "Professional Services": {
      psychological_triggers: ["Expertise", "Trust", "Risk Mitigation", "Compliance"],
      tone: "Authoritative, Consultative, Precise",
      language_style: "Legal/Financial terminology, Detail-oriented",
      formality_level: "High"
    },
    "Media & Publishing": {
      psychological_triggers: ["Storytelling", "Engagement", "Community", "Exclusivity"],
      tone: "Creative, Engaging, Authentic",
      language_style: "Narrative-driven, Conversational",
      formality_level: "Low to Moderate"
    },
    "HR & Staffing": {
      psychological_triggers: ["Talent Scarcity", "Retention", "Culture Fit", "Compliance"],
      tone: "Professional, Relationship-focused, Strategic",
      language_style: "People-first, Process-aware",
      formality_level: "Moderate"
    },
    "Government": {
      psychological_triggers: ["Compliance", "Efficiency", "Transparency", "Risk Management"],
      tone: "Formal, Regulatory-aware, Precise",
      language_style: "Legal terminology, Process-focused",
      formality_level: "High"
    },
    Construction: {
      psychological_triggers: ["Safety", "Timeline", "Budget", "Quality"],
      tone: "Practical, Direct, Technical",
      language_style: "Specification-focused, Deadline-aware",
      formality_level: "Moderate to High"
    },
    "Arts & Culture": {
      psychological_triggers: ["Creativity", "Legacy", "Beauty", "Expression"],
      tone: "Inspirational, Appreciative, Artistic",
      language_style: "Descriptive, Emotionally resonant",
      formality_level: "Low to Moderate"
    },
    Energy: {
      psychological_triggers: ["Sustainability", "Cost Savings", "Independence", "Innovation"],
      tone: "Forward-thinking, Technical, Impact-focused",
      language_style: "Data-driven, Solution-oriented",
      formality_level: "Moderate"
    },
    Agriculture: {
      psychological_triggers: ["Yield", "Sustainability", "Heritage", "Efficiency"],
      tone: "Practical, Knowledgeable, Trustworthy",
      language_style: "Seasonal, Crop-focused, Technical",
      formality_level: "Moderate"
    }
  };

  const defaultSector = sectorDefaults[sector] || sectorDefaults.Technology;

  return {
    niche_id: nicheId,
    niche_name: nicheName,
    sector: sector,
    psychological_triggers: defaultSector.psychological_triggers,
    communication_patterns: {
      tone: defaultSector.tone,
      language_style: defaultSector.language_style,
      messaging_focus: `${targetAudience} focused solutions`,
      formality_level: defaultSector.formality_level
    },
    pain_points: [
      `Lack of specialized ${subSector} solutions`,
      "Inefficient current processes",
      "High operational costs",
      "Missed opportunities",
      "Competitive pressure"
    ],
    value_propositions: [
      `Specialized ${subSector} expertise`,
      "Proven results",
      "Time and cost savings",
      "Dedicated support",
      "Scalable solutions"
    ],
    content_strategies: {
      narrative_hooks: [
        "Customer success stories",
        "Industry benchmarks",
        "Educational content",
        "Case studies"
      ],
      cta_patterns: [
        "Schedule Consultation",
        "Learn More",
        "Get Started",
        "Download Guide"
      ],
      urgency_signals: [
        "Limited availability",
        "Seasonal deadlines",
        "Early bird pricing",
        "Exclusive offer"
      ]
    },
    audience_segments: [targetAudience],
    industry_benchmarks: {
      avg_email_open_rate: "20-25%",
      avg_ctr: "2-3%",
      best_send_times: ["Tuesday-Thursday", "9am-11am"],
      optimal_subject_line_length: "45-60 chars"
    },
    email_stage_framework: {
      awareness: {
        primary_trigger: "Curiosity, Problem Recognition",
        tone_adjustment: "Educational, Insightful",
        subject_line_style: "Question-based, Problem-focused",
        cta_type: "Soft (Learn More, Download Guide)",
        success_metrics: ["Open rate", "Engagement"],
        content_focus: "Industry insights, Problem awareness",
        email_frequency: "1x per week",
        trigger_keywords: ["insights", "trends", "challenges"]
      },
      consideration: {
        primary_trigger: "Comparison, Proof",
        tone_adjustment: "Consultative, Transparent",
        subject_line_style: "Benefit-focused, Comparison",
        cta_type: "Moderate (Schedule Demo, See Case Studies)",
        success_metrics: ["Click rate", "Demo requests"],
        content_focus: "Case studies, Feature comparisons",
        email_frequency: "2x per week",
        trigger_keywords: ["compare", "results", "case study"]
      },
      decision: {
        primary_trigger: "Risk Removal, Urgency",
        tone_adjustment: "Confident, Action-oriented",
        subject_line_style: "Offer-specific, Deadline-driven",
        cta_type: "Hard (Get Started, Buy Now)",
        success_metrics: ["Conversion rate", "Revenue"],
        content_focus: "Pricing, Guarantees, Next steps",
        email_frequency: "3x per week",
        trigger_keywords: ["limited time", "get started", "offer"]
      },
      retention: {
        primary_trigger: "Success, Expansion",
        tone_adjustment: "Supportive, Partner-like",
        subject_line_style: "Personalized, Milestone-based",
        cta_type: "Expansion (Upgrade, Refer, Renew)",
        success_metrics: ["Retention", "Upsell", "NPS"],
        content_focus: "Best practices, New features, Tips",
        email_frequency: "Monthly",
        trigger_keywords: ["new feature", "tip", "maximize"]
      }
    },
    company_size_psychology: {
      micro_1_10: {
        decision_maker: "Founder/Owner",
        pain_priorities: ["Cost", "Time", "Simplicity"],
        psychological_driver: "Survival, Growth",
        budget_reality: "Very tight",
        risk_tolerance: "High",
        email_angle: "Affordable, Quick win, Easy setup",
        subject_line_urgency: "High",
        proof_needed: "Simple case studies, Quick ROI",
        cta_sentiment: "Action-oriented",
        objection: "Too expensive, Too complex"
      }
    },
    buyer_persona_dna: {
      the_pragmatist: {
        archetype: "Value-driven, ROI-focused",
        motivation: "Maximum return, Efficiency",
        pain_language: "Cost, Time waste, Complexity",
        objection_style: "Needs proof of value",
        email_trigger: "Metrics, Case studies, ROI data",
        subject_line_angle: "Numbers-first",
        social_proof_type: "Case studies, Reviews, Benchmarks",
        risk_concern: "Wasted investment, Implementation",
        best_channel: "Email, LinkedIn"
      }
    },
    objection_handling: {
      budget_concern: {
        objection_statement: "It's not in the budget right now",
        email_reframe: "ROI calculator shows payback in X months. Start with free trial.",
        proof_anchor: "ROI calculator + Case study",
        cta_variant: "Calculate Your ROI"
      }
    },
    seasonal_psychology: {
      q4_budget_flush: {
        psychology: "Use it or lose it budget",
        trigger_type: "Budget deadline",
        email_angle: "Use remaining budget before year end",
        urgency_level: "High",
        send_window: "November 1 - December 15"
      }
    },
    value_ladder: {
      entry_level: {
        offering: "Free Consultation",
        price_point: "$0",
        psychology: "Low-risk trial",
        buyer_type: "First-time buyer",
        key_messaging: "No risk, expert advice",
        cta: "Book Free Consultation"
      }
    },
    competitive_positioning: {
      market_positioning: {
        awareness_angle: `Leader in ${subSector}`,
        consideration_angle: "Better value, proven results",
        decision_angle: "Limited-time offer",
        retention_angle: "Long-term partnership"
      }
    },
    compliance_scan_rules: [
      "Check for unsubstantiated claims",
      "Verify compliance with industry regulations",
      "Ensure proper disclosures"
    ],
    linguistic_mandates: {
      forbidden_absolute_words: ["Guaranteed", "Best", "Perfect"],
      required_disclaimer_trigger: ["Results", "Savings", "Returns"],
      metaphor_bank: ["Partner", "Solution", "Platform", "Ecosystem"],
      preferred_verb_tense: "Present/Future Active"
    }
  };
};

// Process each row
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  if (!row.trim()) continue;
  
  const columns = row.split(',');
  if (columns.length < 5) continue;
  
  const nicheId = columns[0].trim();
  const nicheName = columns[1].trim();
  const sector = columns[2].trim();
  const subSector = columns[3].trim();
  const targetAudience = columns[4].trim();
  
  if (nicheId && !niches[nicheId]) {
    niches[nicheId] = getDefaultNicheProfile(nicheId, nicheName, sector, subSector, targetAudience);
    console.log(`✅ Generated profile for: ${nicheId} - ${nicheName}`);
  }
}

// Generate the output file
const outputPath = path.join(__dirname, '../src/emailbrain/config/masterConfig.generated.ts');

const outputContent = `/**
 * EmailBrain Master Configuration - GENERATED FROM CSV
 * This file is auto-generated. Do not edit manually.
 * Generated: ${new Date().toISOString()}
 * Total Niches: ${Object.keys(niches).length}
 * Location: src/emailbrain/config/masterConfig.generated.ts
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

export const NICHE_PROFILES: Record<string, NicheProfile> = {
${Object.entries(niches).map(([id, profile]) => {
  const p = profile;
  return `  "${id}": {
    niche_id: "${p.niche_id}",
    niche_name: "${p.niche_name}",
    sector: "${p.sector}",
    psychological_triggers: ${JSON.stringify(p.psychological_triggers)},
    communication_patterns: {
      tone: "${p.communication_patterns.tone}",
      language_style: "${p.communication_patterns.language_style}",
      messaging_focus: "${p.communication_patterns.messaging_focus}",
      formality_level: "${p.communication_patterns.formality_level}"
    },
    pain_points: ${JSON.stringify(p.pain_points)},
    value_propositions: ${JSON.stringify(p.value_propositions)},
    content_strategies: {
      narrative_hooks: ${JSON.stringify(p.content_strategies.narrative_hooks)},
      cta_patterns: ${JSON.stringify(p.content_strategies.cta_patterns)},
      urgency_signals: ${JSON.stringify(p.content_strategies.urgency_signals)}
    },
    audience_segments: ${JSON.stringify(p.audience_segments)},
    industry_benchmarks: {
      avg_email_open_rate: "${p.industry_benchmarks.avg_email_open_rate}",
      avg_ctr: "${p.industry_benchmarks.avg_ctr}",
      best_send_times: ${JSON.stringify(p.industry_benchmarks.best_send_times)},
      optimal_subject_line_length: "${p.industry_benchmarks.optimal_subject_line_length}"
    },
    email_stage_framework: {
      awareness: {
        primary_trigger: "${p.email_stage_framework.awareness.primary_trigger}",
        tone_adjustment: "${p.email_stage_framework.awareness.tone_adjustment}",
        subject_line_style: "${p.email_stage_framework.awareness.subject_line_style}",
        cta_type: "${p.email_stage_framework.awareness.cta_type}",
        success_metrics: ${JSON.stringify(p.email_stage_framework.awareness.success_metrics)},
        content_focus: "${p.email_stage_framework.awareness.content_focus}",
        email_frequency: "${p.email_stage_framework.awareness.email_frequency}",
        trigger_keywords: ${JSON.stringify(p.email_stage_framework.awareness.trigger_keywords)}
      },
      consideration: {
        primary_trigger: "${p.email_stage_framework.consideration.primary_trigger}",
        tone_adjustment: "${p.email_stage_framework.consideration.tone_adjustment}",
        subject_line_style: "${p.email_stage_framework.consideration.subject_line_style}",
        cta_type: "${p.email_stage_framework.consideration.cta_type}",
        success_metrics: ${JSON.stringify(p.email_stage_framework.consideration.success_metrics)},
        content_focus: "${p.email_stage_framework.consideration.content_focus}",
        email_frequency: "${p.email_stage_framework.consideration.email_frequency}",
        trigger_keywords: ${JSON.stringify(p.email_stage_framework.consideration.trigger_keywords)}
      },
      decision: {
        primary_trigger: "${p.email_stage_framework.decision.primary_trigger}",
        tone_adjustment: "${p.email_stage_framework.decision.tone_adjustment}",
        subject_line_style: "${p.email_stage_framework.decision.subject_line_style}",
        cta_type: "${p.email_stage_framework.decision.cta_type}",
        success_metrics: ${JSON.stringify(p.email_stage_framework.decision.success_metrics)},
        content_focus: "${p.email_stage_framework.decision.content_focus}",
        email_frequency: "${p.email_stage_framework.decision.email_frequency}",
        trigger_keywords: ${JSON.stringify(p.email_stage_framework.decision.trigger_keywords)}
      },
      retention: {
        primary_trigger: "${p.email_stage_framework.retention.primary_trigger}",
        tone_adjustment: "${p.email_stage_framework.retention.tone_adjustment}",
        subject_line_style: "${p.email_stage_framework.retention.subject_line_style}",
        cta_type: "${p.email_stage_framework.retention.cta_type}",
        success_metrics: ${JSON.stringify(p.email_stage_framework.retention.success_metrics)},
        content_focus: "${p.email_stage_framework.retention.content_focus}",
        email_frequency: "${p.email_stage_framework.retention.email_frequency}",
        trigger_keywords: ${JSON.stringify(p.email_stage_framework.retention.trigger_keywords)}
      }
    },
    company_size_psychology: {
      micro_1_10: {
        decision_maker: "${p.company_size_psychology.micro_1_10.decision_maker}",
        pain_priorities: ${JSON.stringify(p.company_size_psychology.micro_1_10.pain_priorities)},
        psychological_driver: "${p.company_size_psychology.micro_1_10.psychological_driver}",
        budget_reality: "${p.company_size_psychology.micro_1_10.budget_reality}",
        risk_tolerance: "${p.company_size_psychology.micro_1_10.risk_tolerance}",
        email_angle: "${p.company_size_psychology.micro_1_10.email_angle}",
        subject_line_urgency: "${p.company_size_psychology.micro_1_10.subject_line_urgency}",
        proof_needed: "${p.company_size_psychology.micro_1_10.proof_needed}",
        cta_sentiment: "${p.company_size_psychology.micro_1_10.cta_sentiment}",
        objection: "${p.company_size_psychology.micro_1_10.objection}"
      }
    },
    buyer_persona_dna: {
      the_pragmatist: {
        archetype: "${p.buyer_persona_dna.the_pragmatist.archetype}",
        motivation: "${p.buyer_persona_dna.the_pragmatist.motivation}",
        pain_language: "${p.buyer_persona_dna.the_pragmatist.pain_language}",
        objection_style: "${p.buyer_persona_dna.the_pragmatist.objection_style}",
        email_trigger: "${p.buyer_persona_dna.the_pragmatist.email_trigger}",
        subject_line_angle: "${p.buyer_persona_dna.the_pragmatist.subject_line_angle}",
        social_proof_type: "${p.buyer_persona_dna.the_pragmatist.social_proof_type}",
        risk_concern: "${p.buyer_persona_dna.the_pragmatist.risk_concern}",
        best_channel: "${p.buyer_persona_dna.the_pragmatist.best_channel}"
      }
    },
    objection_handling: {
      budget_concern: {
        objection_statement: "${p.objection_handling.budget_concern.objection_statement}",
        email_reframe: "${p.objection_handling.budget_concern.email_reframe}",
        proof_anchor: "${p.objection_handling.budget_concern.proof_anchor}",
        cta_variant: "${p.objection_handling.budget_concern.cta_variant}"
      }
    },
    seasonal_psychology: {
      q4_budget_flush: {
        psychology: "${p.seasonal_psychology.q4_budget_flush.psychology}",
        trigger_type: "${p.seasonal_psychology.q4_budget_flush.trigger_type}",
        email_angle: "${p.seasonal_psychology.q4_budget_flush.email_angle}",
        urgency_level: "${p.seasonal_psychology.q4_budget_flush.urgency_level}",
        send_window: "${p.seasonal_psychology.q4_budget_flush.send_window}"
      }
    },
    value_ladder: {
      entry_level: {
        offering: "${p.value_ladder.entry_level.offering}",
        price_point: "${p.value_ladder.entry_level.price_point}",
        psychology: "${p.value_ladder.entry_level.psychology}",
        buyer_type: "${p.value_ladder.entry_level.buyer_type}",
        key_messaging: "${p.value_ladder.entry_level.key_messaging}",
        cta: "${p.value_ladder.entry_level.cta}"
      }
    },
    competitive_positioning: {
      market_positioning: {
        awareness_angle: "${p.competitive_positioning.market_positioning.awareness_angle}",
        consideration_angle: "${p.competitive_positioning.market_positioning.consideration_angle}",
        decision_angle: "${p.competitive_positioning.market_positioning.decision_angle}",
        retention_angle: "${p.competitive_positioning.market_positioning.retention_angle}"
      }
    },
    compliance_scan_rules: ${JSON.stringify(p.compliance_scan_rules)},
    linguistic_mandates: {
      forbidden_absolute_words: ${JSON.stringify(p.linguistic_mandates.forbidden_absolute_words)},
      required_disclaimer_trigger: ${JSON.stringify(p.linguistic_mandates.required_disclaimer_trigger)},
      metaphor_bank: ${JSON.stringify(p.linguistic_mandates.metaphor_bank)},
      preferred_verb_tense: "${p.linguistic_mandates.preferred_verb_tense}"
    }
  },`;
}).join('\n')}
};

export const COMPANY_SIZE_CATEGORIES = {
  MICRO: "micro_1_10",
  SMALL: "small_11_50",
  MID_MARKET: "mid_market_51_500",
  ENTERPRISE: "enterprise_501_plus"
};

export const EMAIL_STAGES = {
  AWARENESS: "awareness",
  CONSIDERATION: "consideration",
  DECISION: "decision",
  RETENTION: "retention"
};

export const BUYER_PERSONAS = {
  PRAGMATIST: "the_pragmatist",
  INNOVATOR: "the_innovator",
  RISK_AVERSE: "the_risk_averse",
  CONSENSUS_BUILDER: "the_consensus_builder"
};
`;

// Write the file
fs.writeFileSync(outputPath, outputContent);
console.log(`\n✅ Generated ${Object.keys(niches).length} niche profiles`);
console.log(`📁 Output: ${outputPath}`);