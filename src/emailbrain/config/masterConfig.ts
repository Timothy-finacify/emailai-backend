/**
 * EmailBrain Master Configuration
 * Core intelligence engine for EmailBrain
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
  
  // ✅ NEW: Missing properties added
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
  FIN_001: {
    niche_id: "FIN_001",
    niche_name: "Retail Banking",
    sector: "Financials & Insurance",
    psychological_triggers: [
      "Security & Trust",
      "Financial Freedom",
      "Peace of Mind",
      "Wealth Growth",
      "Fear of Loss",
      "Convenience",
      "Community & Belonging"
    ],
    communication_patterns: {
      tone: "Professional, Reassuring, Accessible",
      language_style: "Clear jargon explanation, regulatory confident",
      messaging_focus: "Safety, simplicity, accessibility",
      formality_level: "Moderate to High"
    },
    pain_points: [
      "High fees on accounts",
      "Poor customer service response",
      "Outdated digital banking",
      "Credit score concerns",
      "Mortgage approval anxiety",
      "Hidden charges",
      "Complex account structures"
    ],
    value_propositions: [
      "Lower fees, higher yields",
      "24/7 mobile banking access",
      "Personalized financial guidance",
      "Quick loan approvals",
      "Transparent pricing",
      "Expert support when needed",
      "Building credit responsibly"
    ],
    content_strategies: {
      narrative_hooks: [
        "Customer success stories (debt payoff, home purchase)",
        "Educational content (financial literacy, budgeting)",
        "Limited-time offers (promotional rates, fee waivers)",
        "Security assurances (FDIC protection, data encryption)"
      ],
      cta_patterns: [
        "Open Account Now",
        "Check Your Rate",
        "Schedule Financial Review",
        "Get Pre-Approved",
        "Claim Your Offer"
      ],
      urgency_signals: [
        "Limited-time promotional rates",
        "Deadline-based offers",
        "Exclusive member benefits",
        "Early-bird bonuses"
      ]
    },
    audience_segments: [
      "First-time homebuyers",
      "Young professionals",
      "Families building savings",
      "Retirees managing pensions"
    ],
    industry_benchmarks: {
      avg_email_open_rate: "22-28%",
      avg_ctr: "2.5-4%",
      best_send_times: ["Wednesday-Thursday", "10am-2pm"],
      optimal_subject_line_length: "45-60 chars"
    },
    email_stage_framework: {
      awareness: {
        primary_trigger: "Curiosity, Financial Security Concern",
        tone_adjustment: "Educational, Non-threatening",
        subject_line_style: "Question-based, Problem-validation ('Are your savings protected?')",
        cta_type: "Soft (Learn More, Download Guide, Schedule Consultation)",
        success_metrics: ["Open rate", "Engagement time", "Educational content downloads"],
        content_focus: "Financial literacy, market trends, banking tips, security education",
        email_frequency: "1x per week, value-first approach",
        trigger_keywords: ["financial security", "smart banking", "protect your money"]
      },
      consideration: {
        primary_trigger: "Competitive Comparison, Rate Comparison, Service Evaluation",
        tone_adjustment: "Consultative, Transparent, Comparative",
        subject_line_style: "Benefit-focused, Rate comparison ('Our rates vs. competitors')",
        cta_type: "Moderate (Check Your Rate, Compare Offers, Request Proposal)",
        success_metrics: ["Click rate", "Rate check requests", "Demo/consultation requests"],
        content_focus: "Feature comparison, customer testimonials, ROI calculators, fee breakdown",
        email_frequency: "2x per week, product education",
        trigger_keywords: ["better rates", "how it compares", "transparent pricing"]
      },
      decision: {
        primary_trigger: "Risk Removal, Exclusivity, Time Pressure",
        tone_adjustment: "Confident, Action-oriented, Supportive",
        subject_line_style: "Urgency-focused, Offer-specific ('Limited-time rate lock ends Friday')",
        cta_type: "Hard (Open Account Now, Claim Offer, Complete Application)",
        success_metrics: ["Conversion rate", "Account opens", "Application completion"],
        content_focus: "Social proof, testimonials, limited-time offers, guaranteed rate locks",
        email_frequency: "3-4x per week, conversion-focused",
        trigger_keywords: ["limited time", "exclusive", "today only", "don't miss out"]
      },
      retention: {
        primary_trigger: "Account Optimization, Wealth Growth, Community Belonging",
        tone_adjustment: "Supportive, Partner-like, Success-focused",
        subject_line_style: "Personalization, Success-celebration ('Congratulations on your savings milestone')",
        cta_type: "Expansion (Explore New Products, Refer Friends, Upgrade Account)",
        success_metrics: ["Product adoption rate", "Upsell conversion", "Referral rate", "Lifetime value"],
        content_focus: "Best practices, advanced features, referral incentives, exclusive member benefits",
        email_frequency: "2x per week, relationship-building",
        trigger_keywords: ["maximize savings", "exclusive member", "next step", "grow your wealth"]
      }
    },
    company_size_psychology: {
      micro_individual_saver: {
        decision_maker: "Individual consumer",
        pain_priorities: ["Cost minimization", "Ease of use", "Quick results"],
        psychological_driver: "Personal financial security",
        budget_reality: "Every dollar counts",
        risk_tolerance: "Medium (money sensitive)",
        email_angle: "No-fee accounts, easy mobile app, quick account setup",
        subject_line_urgency: "High (price-sensitive)",
        proof_needed: "Simple testimonials, fee comparisons, trust badges",
        cta_sentiment: "Energetic, permission-giving ('Try free for 30 days')",
        objection: "Too complicated, too risky, hidden fees"
      }
    },
    buyer_persona_dna: {
      the_pragmatist_saver: {
        archetype: "Budget-conscious, numbers-focused",
        motivation: "Maximum savings, fee elimination, transparency",
        pain_language: "Fee structure, APY comparison, total cost of account ownership",
        objection_style: "Questions every cost, compares rates obsessively",
        email_trigger: "Fee comparisons, APY guarantees, transparent pricing breakdowns",
        subject_line_angle: "Numbers-first ('Save $300/year on fees')",
        social_proof_type: "Rate comparison charts, fee transparency reports, certification badges",
        risk_concern: "Hidden fees, bait-and-switch rates, unexpected charges",
        best_channel: "Detailed comparison emails, ROI calculators, downloadable fee guides"
      }
    },
    objection_handling: {
      hidden_fees_concern: {
        objection_statement: "Banks always have hidden fees - what aren't you telling me?",
        email_reframe: "Zero hidden fees guarantee: [Full transparent fee schedule]. Every charge is listed upfront with [X-day satisfaction guarantee]",
        proof_anchor: "Downloadable fee schedule + customer testimonial ('No surprises, just honest banking')",
        cta_variant: "Download Our Complete Fee Schedule (builds confidence)"
      }
    },
    seasonal_psychology: {
      q1_new_year_resolution: {
        psychology: "Financial fresh start, New Year savings goals, resolution momentum",
        trigger_type: "Goal-setting, behavior change",
        email_angle: "New year, new financial goals, goal-tracking features, savings challenges",
        urgency_level: "High",
        send_window: "January 1-31"
      }
    },
    value_ladder: {
      entry_level: {
        offering: "Basic Savings Account",
        price_point: "Free to open, no monthly fees",
        psychology: "Low-risk try-before-you-commit, builds trust",
        buyer_type: "First-time bank customers, young savers, cautious individuals",
        key_messaging: "Free to start, zero risk, no commitment",
        cta: "Open Free Account"
      }
    },
    // ✅ NEW: Added missing properties
    competitive_positioning: {
      market_positioning: {
        awareness_angle: "Trusted financial partner",
        consideration_angle: "Better rates, lower fees",
        decision_angle: "Limited-time offer",
        retention_angle: "Grow your wealth with us"
      }
    },
    compliance_scan_rules: [
      "Check for % claims without citation",
      "Check for promises of future performance",
      "Ensure footer contains 'Member FDIC'"
    ],
    linguistic_mandates: {
      forbidden_absolute_words: ["Guaranteed", "Safe", "Risk-Free", "Profit", "Rich"],
      required_disclaimer_trigger: ["Returns", "Growth", "Income", "APY"],
      metaphor_bank: ["Foundation", "Path", "Journey", "Steady hand"],
      preferred_verb_tense: "Future Conditional (may, could, seeks to)"
    }
  },
  FIN_002: {
    niche_id: "FIN_002",
    niche_name: "Commercial Banking",
    sector: "Financials & Insurance",
    psychological_triggers: [
      "Business Growth Ambition",
      "Risk Mitigation",
      "ROI Optimization",
      "Time Efficiency",
      "Competitive Advantage",
      "Cash Flow Control",
      "Strategic Expansion"
    ],
    communication_patterns: {
      tone: "Strategic, Data-driven, Executive",
      language_style: "Industry-specific, metrics-focused, solution-oriented",
      messaging_focus: "Efficiency gains, risk reduction, growth enablement",
      formality_level: "High"
    },
    pain_points: [
      "Cash flow volatility",
      "Slow loan approval process",
      "Complex treasury management",
      "Inadequate credit facilities",
      "Regulatory compliance burden",
      "Limited working capital",
      "Payment processing delays"
    ],
    value_propositions: [
      "Faster funding decisions",
      "Tailored credit solutions",
      "Integrated cash management",
      "Dedicated relationship manager",
      "Competitive lending rates",
      "Automated compliance reporting",
      "Supply chain financing options"
    ],
    content_strategies: {
      narrative_hooks: [
        "Case studies (business growth, expansion stories)",
        "ROI calculators",
        "Regulatory update alerts",
        "Industry trend reports",
        "Comparative rate analysis"
      ],
      cta_patterns: [
        "Schedule a Business Review",
        "Apply for Credit Facility",
        "Download Industry Report",
        "Speak with Relationship Manager",
        "Get Custom Quote"
      ],
      urgency_signals: [
        "Quarter-end financing deadlines",
        "Seasonal funding cycles",
        "Expansion window closures",
        "Rate lock expiration dates"
      ]
    },
    audience_segments: [
      "Small to mid-size businesses (SMBs)",
      "Manufacturing companies",
      "Retail chains",
      "Professional services firms"
    ],
    industry_benchmarks: {
      avg_email_open_rate: "18-24%",
      avg_ctr: "2-3%",
      best_send_times: ["Tuesday-Thursday", "8am-11am"],
      optimal_subject_line_length: "50-70 chars"
    },
    email_stage_framework: {
      awareness: {
        primary_trigger: "Business growth questions, expansion planning curiosity",
        tone_adjustment: "Educational, industry-expert",
        subject_line_style: "Industry insight, business challenge ('How fast-growing companies fund expansion')",
        cta_type: "Soft (Download Guide, Attend Webinar, Request Consultation)",
        success_metrics: ["Open rate", "Webinar attendance", "Whitepaper downloads"],
        content_focus: "Industry trends, business growth strategies, funding landscape, competitive benchmarking",
        email_frequency: "1x per week",
        trigger_keywords: ["business growth", "expansion strategies", "industry trends"]
      },
      consideration: {
        primary_trigger: "Specific funding need, loan shopping, credit evaluation",
        tone_adjustment: "Consultative, solution-focused",
        subject_line_style: "Specific solution ('The fastest SMB loan approval in [Industry]')",
        cta_type: "Moderate (Request Proposal, Schedule Business Review, Compare Rates)",
        success_metrics: ["Demo requests", "Consultation bookings", "Proposal downloads"],
        content_focus: "Product comparisons, rate analysis, approval timeline guarantees, customer case studies",
        email_frequency: "2x per week",
        trigger_keywords: ["faster approvals", "better rates", "proven process"]
      },
      decision: {
        primary_trigger: "Funding urgency, competitive pressure, time-sensitive opportunity",
        tone_adjustment: "Action-oriented, partnership-focused",
        subject_line_style: "Urgency + solution ('48-hour funding: Your expansion can't wait')",
        cta_type: "Hard (Apply Now, Lock Rate, Start Process)",
        success_metrics: ["Application submissions", "Funding closures", "Deal value"],
        content_focus: "Limited-time offers, testimonials, approval guarantees, next-step clarity",
        email_frequency: "3-4x per week",
        trigger_keywords: ["fast approval", "ready to grow", "limited time offer"]
      },
      retention: {
        primary_trigger: "Relationship expansion, additional credit facilities, strategic partnership",
        tone_adjustment: "Partner-like, growth-focused",
        subject_line_style: "Success celebration ('You've grown 40% - let's fund the next stage')",
        cta_type: "Expansion (Additional Facilities, New Products, Advisor Access)",
        success_metrics: ["Cross-sell revenue", "Customer lifetime value", "Product adoption"],
        content_focus: "Growth milestones, next-stage funding, supply chain financing, treasury solutions",
        email_frequency: "2x per week",
        trigger_keywords: ["next growth stage", "expansion capital", "strategic financing"]
      }
    },
    company_size_psychology: {
      micro_1_10_startup: {
        decision_maker: "Founder/CEO, personally signs off",
        pain_priorities: ["Cash survival", "Quick funding", "Minimal bureaucracy"],
        psychological_driver: "Startup survival mentality, rapid growth hunger",
        budget_reality: "Bootstrap mindset, every dollar critical",
        risk_tolerance: "High (must take risks to survive)",
        email_angle: "Fast, simple, founder-friendly funding",
        subject_line_urgency: "Very High ('Funding in 48 hours, not months')",
        proof_needed: "Founder testimonials, quick case studies, speed guarantees",
        cta_sentiment: "Energetic, action-now ('Start your application in 10 minutes')",
        objection: "Too slow, too expensive, too complicated"
      }
    },
    buyer_persona_dna: {
      the_growth_obsessed_founder: {
        archetype: "Founder/CEO, startup mentality",
        motivation: "Speed of growth, market share capture, victory over competitors",
        pain_language: "Growth bottlenecks, cash runway, competitor threats",
        objection_style: "Fast-moving, wants speed over details",
        email_trigger: "Growth metrics, speed guarantees, competitive positioning",
        subject_line_angle: "Growth-first ('Add $500k to runway by Friday')",
        social_proof_type: "Fast-growing company success stories, founder testimonials, speed records",
        risk_concern: "Losing market window, competition winning, slow process",
        best_channel: "Direct email from banker, quick demo calls, founder community"
      }
    },
    objection_handling: {
      slow_approval_concern: {
        objection_statement: "Banks are slow - I need funding before my expansion window closes",
        email_reframe: "48-hour guarantee: Application → Decision → Funding in 2 days. Not weeks. [Link to 48-hour guarantee details]",
        proof_anchor: "Case studies showing actual funding timelines, speed guarantee certificate",
        cta_variant: "Start Application (48-hour guarantee applies)"
      }
    },
    seasonal_psychology: {
      q1_budget_planning: {
        psychology: "Annual budget approved, transformation initiatives greenlit, strategic planning mode",
        trigger_type: "Budget-driven investment",
        email_angle: "Use your 2024 budget, strategic transformation, competitive advantage",
        urgency_level: "High",
        send_window: "January 15 - February 28"
      }
    },
    value_ladder: {
      entry_level: {
        offering: "Working Capital Line of Credit",
        price_point: "$25k-$250k, variable rates",
        psychology: "Low-risk, try-before-you-commit, working capital flexibility",
        buyer_type: "Young SMBs, cash flow management focus",
        key_messaging: "Flexible working capital for growth",
        cta: "Apply for LOC"
      }
    },
    // ✅ NEW: Added missing properties
    competitive_positioning: {
      market_positioning: {
        awareness_angle: "Strategic growth partner",
        consideration_angle: "Faster funding, better terms",
        decision_angle: "Limited-time rate lock",
        retention_angle: "Scale with our capital solutions"
      }
    },
    compliance_scan_rules: [
      "Check for promises of future performance",
      "Ensure commercial lending disclosures",
      "Verify rate claims with current prime rate"
    ],
    linguistic_mandates: {
      forbidden_absolute_words: ["Guaranteed", "Sure thing", "Risk-Free"],
      required_disclaimer_trigger: ["Returns", "Rates", "Funding"],
      metaphor_bank: ["Growth engine", "Runway", "Scale", "Accelerate"],
      preferred_verb_tense: "Present/Future Active"
    }
  },
    
  ECOMM_FASHION_01: {
    niche_id: "ECOMM_FASHION_01",
    niche_name: "Fashion E-commerce",
    sector: "E-commerce",
    psychological_triggers: [
      "Social Proof",
      "Exclusivity",
      "Fear of Missing Out",
      "Aspiration",
      "Convenience"
    ],
    communication_patterns: {
      tone: "Trendy, Aspirational, Friendly",
      language_style: "Casual, Visual, Emotion-driven",
      messaging_focus: "Style, Confidence, Self-expression",
      formality_level: "Low to Moderate"
    },
    pain_points: [
      "Finding the right fit",
      "Keeping up with trends",
      "Quality concerns",
      "Shipping costs",
      "Return hassles"
    ],
    value_propositions: [
      "Curated collections",
      "Free shipping & returns",
      "Sustainable fashion",
      "Exclusive designs",
      "Style inspiration"
    ],
    content_strategies: {
      narrative_hooks: [
        "Customer style stories",
        "Behind-the-scenes",
        "Limited drops",
        "Influencer collaborations"
      ],
      cta_patterns: [
        "Shop the Look",
        "Get the Style",
        "Limited Stock - Buy Now",
        "Join the Waitlist"
      ],
      urgency_signals: [
        "Almost gone",
        "Limited edition",
        "Selling fast",
        "Back in stock"
      ]
    },
    audience_segments: [
      "Trend-conscious shoppers",
      "Bargain hunters",
      "Luxury enthusiasts",
      "Sustainable consumers"
    ],
    industry_benchmarks: {
      avg_email_open_rate: "18-25%",
      avg_ctr: "2-4%",
      best_send_times: ["Thursday-Friday", "8pm-10pm"],
      optimal_subject_line_length: "40-50 chars"
    },
    email_stage_framework: {
      awareness: {
        primary_trigger: "Curiosity, Style Inspiration",
        tone_adjustment: "Inspirational, Welcoming",
        subject_line_style: "Lifestyle-focused, Aspirational",
        cta_type: "Explore Collection",
        success_metrics: ["Open rate", "Site visits"],
        content_focus: "Trend guides, lookbooks, brand story",
        email_frequency: "1x per week",
        trigger_keywords: ["new arrivals", "trending", "discover"]
      },
      consideration: {
        primary_trigger: "Social Proof, Product Quality",
        tone_adjustment: "Educational, Trust-building",
        subject_line_style: "Product-focused, Benefit-driven",
        cta_type: "Shop Now",
        success_metrics: ["Click rate", "Product views"],
        content_focus: "Product highlights, customer reviews, styling tips",
        email_frequency: "2x per week",
        trigger_keywords: ["bestseller", "rated", "reviewed"]
      },
      decision: {
        primary_trigger: "Urgency, Exclusivity, Scarcity",
        tone_adjustment: "Action-oriented, Exciting",
        subject_line_style: "Urgency-driven, Offer-focused",
        cta_type: "Buy Now",
        success_metrics: ["Conversion rate", "Revenue"],
        content_focus: "Flash sales, limited stock alerts, cart reminders",
        email_frequency: "3x per week",
        trigger_keywords: ["limited time", "almost gone", "exclusive"]
      },
      retention: {
        primary_trigger: "Loyalty Rewards, Community",
        tone_adjustment: "Appreciative, Exclusive",
        subject_line_style: "Personalized, VIP-focused",
        cta_type: "Shop Early Access",
        success_metrics: ["Repeat purchase rate", "LTV"],
        content_focus: "VIP early access, loyalty perks, birthday rewards",
        email_frequency: "2x per month",
        trigger_keywords: ["exclusive for you", "VIP", "just for you"]
      }
    },
    company_size_psychology: {
      micro_1_10: {
        decision_maker: "Founder/Solo Entrepreneur",
        pain_priorities: ["Cost", "Time", "Inventory management"],
        psychological_driver: "Growth hacking, Brand building",
        budget_reality: "Bootstrap, ROI-focused",
        risk_tolerance: "Medium-High",
        email_angle: "Affordable trends, Easy setup, Marketing tools",
        subject_line_urgency: "Medium",
        proof_needed: "Success stories, ROI examples",
        cta_sentiment: "Action-oriented",
        objection: "Too expensive, Too complex"
      }
    },
    buyer_persona_dna: {
      the_trend_seeker: {
        archetype: "Fashion-forward, Social media active",
        motivation: "Stay ahead of trends, Look stylish",
        pain_language: "Outdated styles, Missing out, Copycat looks",
        objection_style: "Wants what's hot now",
        email_trigger: "New arrivals, Celebrity styles, Trend alerts",
        subject_line_angle: "Trend-first",
        social_proof_type: "Influencer posts, User-generated content",
        risk_concern: "Looking outdated, Poor quality",
        best_channel: "Instagram, TikTok, Visual emails"
      }
    },
    objection_handling: {
      quality_concern: {
        objection_statement: "I'm worried about the quality for this price",
        email_reframe: "Premium materials + 30-day return policy. See real customer photos.",
        proof_anchor: "Customer photo gallery + material close-ups",
        cta_variant: "See Real Customer Photos"
      }
    },
    seasonal_psychology: {
      q4_holiday: {
        psychology: "Gift-giving urgency, Self-reward",
        trigger_type: "Scarcity, Generosity",
        email_angle: "Gift guides, Holiday party looks, Self-gifting",
        urgency_level: "Critical",
        send_window: "November 1 - December 24"
      }
    },
    value_ladder: {
      entry_level: {
        offering: "Welcome Discount Code",
        price_point: "10-15% off",
        psychology: "Low-risk trial",
        buyer_type: "First-time visitor",
        key_messaging: "Welcome gift",
        cta: "Claim Discount"
      }
    },
    competitive_positioning: {
      market_positioning: {
        awareness_angle: "Trend authority",
        consideration_angle: "Better quality, better price",
        decision_angle: "Limited stock, free returns",
        retention_angle: "VIP community"
      }
    },
    compliance_scan_rules: [
      "Check for misleading discount claims",
      "Verify free shipping conditions stated"
    ],
    linguistic_mandates: {
      forbidden_absolute_words: ["Guaranteed fit", "One size fits all"],
      required_disclaimer_trigger: ["Sale", "Discount", "Free"],
      metaphor_bank: ["Wardrobe staples", "Statement pieces", "Capsule collection"]
    }
  },

  // ============================================
  // SAAS NICHES
  // ============================================
  
  SAAS_B2B_01: {
    niche_id: "SAAS_B2B_01",
    niche_name: "B2B SaaS",
    sector: "Technology",
    psychological_triggers: [
      "ROI Optimization",
      "Time Efficiency",
      "Competitive Advantage",
      "Risk Mitigation",
      "Scalability"
    ],
    communication_patterns: {
      tone: "Professional, Data-driven, Solution-oriented",
      language_style: "Clear value props, Metrics-focused",
      messaging_focus: "Efficiency gains, Cost savings, Productivity",
      formality_level: "Moderate to High"
    },
    pain_points: [
      "Inefficient workflows",
      "High operational costs",
      "Data silos",
      "Poor integration",
      "Security concerns"
    ],
    value_propositions: [
      "Increase productivity by X%",
      "Reduce costs by X%",
      "Seamless integrations",
      "Enterprise-grade security",
      "Scalable solution"
    ],
    content_strategies: {
      narrative_hooks: [
        "Case studies with metrics",
        "ROI calculators",
        "Industry benchmarks",
        "Product demo videos"
      ],
      cta_patterns: [
        "Schedule Demo",
        "Start Free Trial",
        "Download Whitepaper",
        "Calculate Your ROI"
      ],
      urgency_signals: [
        "Limited beta spots",
        "Early-bird pricing",
        "Quarter-end"
      ]
    },
    audience_segments: [
      "IT Decision Makers",
      "Business Owners",
      "Operations Managers",
      "Finance Leaders"
    ],
    industry_benchmarks: {
      avg_email_open_rate: "20-25%",
      avg_ctr: "2-3.5%",
      best_send_times: ["Tuesday-Thursday", "8am-10am"],
      optimal_subject_line_length: "50-60 chars"
    },
    email_stage_framework: {
      awareness: {
        primary_trigger: "Curiosity, Problem Recognition",
        tone_adjustment: "Educational, Insightful",
        subject_line_style: "Question-based, Statistic-led",
        cta_type: "Download Guide",
        success_metrics: ["Open rate", "Downloads"],
        content_focus: "Industry reports, Problem awareness",
        email_frequency: "1x per week",
        trigger_keywords: ["challenges", "trends", "insights"]
      },
      consideration: {
        primary_trigger: "Comparison, Proof",
        tone_adjustment: "Consultative, Transparent",
        subject_line_style: "Benefit-focused, Comparison",
        cta_type: "Schedule Demo",
        success_metrics: ["Demo requests", "Trial signups"],
        content_focus: "Case studies, Feature comparisons, ROI examples",
        email_frequency: "2x per week",
        trigger_keywords: ["vs", "comparison", "results"]
      },
      decision: {
        primary_trigger: "Risk Removal, Urgency",
        tone_adjustment: "Confident, Supportive",
        subject_line_style: "Offer-specific, Deadline-driven",
        cta_type: "Start Free Trial",
        success_metrics: ["Conversion rate", "MRR"],
        content_focus: "Onboarding guides, Success stories, Pricing",
        email_frequency: "2-3x per week",
        trigger_keywords: ["get started", "pricing", "implementation"]
      },
      retention: {
        primary_trigger: "Success, Expansion",
        tone_adjustment: "Partner-like, Proactive",
        subject_line_style: "Personalized, Milestone-based",
        cta_type: "Upgrade Plan",
        success_metrics: ["Expansion MRR", "NPS"],
        content_focus: "Feature updates, Best practices, Training",
        email_frequency: "Monthly",
        trigger_keywords: ["new feature", "tip", "maximize"]
      }
    },
    company_size_psychology: {
      micro_1_10: {
        decision_maker: "Founder/CEO",
        pain_priorities: ["Cost", "Time savings", "Ease of use"],
        psychological_driver: "Survival, Growth",
        budget_reality: "Very tight",
        risk_tolerance: "High",
        email_angle: "Affordable, Quick win, No-brainer",
        subject_line_urgency: "High",
        proof_needed: "Simple case studies, Quick ROI",
        cta_sentiment: "Action-oriented",
        objection: "Too expensive, Too complex"
      }
    },
    buyer_persona_dna: {
      the_efficiency_seeker: {
        archetype: "Operations-focused, ROI-driven",
        motivation: "Save time, Reduce costs",
        pain_language: "Inefficient, Manual, Slow",
        objection_style: "Needs proof of ROI",
        email_trigger: "Productivity metrics, Automation examples",
        subject_line_angle: "Numbers-first",
        social_proof_type: "Case studies, G2 reviews, ROI reports",
        risk_concern: "Implementation time, Team adoption",
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
        email_angle: "Use remaining 2024 budget for 2025 productivity",
        urgency_level: "High",
        send_window: "November 1 - December 15"
      }
    },
    value_ladder: {
      entry_level: {
        offering: "Free Trial",
        price_point: "$0",
        psychology: "Try before you buy",
        buyer_type: "Evaluator",
        key_messaging: "No risk, full access",
        cta: "Start Free Trial"
      }
    },
    competitive_positioning: {
      market_positioning: {
        awareness_angle: "Thought leader",
        consideration_angle: "Better value, easier to use",
        decision_angle: "Faster time to value",
        retention_angle: "Innovation partner"
      }
    },
    compliance_scan_rules: [
      "Check for unsubstantiated ROI claims",
      "Verify SOC2 compliance mentions"
    ],
    linguistic_mandates: {
      forbidden_absolute_words: ["Guaranteed ROI", "100% secure"],
      required_disclaimer_trigger: ["Results", "Savings"],
      metaphor_bank: ["Productivity engine", "Growth lever", "Digital workforce"]
    }
  }
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
