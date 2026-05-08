"use strict";
/**
 * EmailBrain - ENHANCED WITH LEARNING
 * Now pulls learned data alongside static config
 * Location: backend/src/emailbrain/EmailBrain.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmailContext = generateEmailContext;
const masterConfig_generated_1 = require("../emailbrain/config/masterConfig.generated");
const stageDetector_1 = require("./services/stageDetector");
const personaClassifier_1 = require("./services/personaClassifier");
const BehavioralProfileManager_1 = require("./managers/BehavioralProfileManager");
/**
 * Core function to generate intelligent email context
 * NOW INTEGRATES LEARNED BEHAVIORS
 */
function generateEmailContext(params) {
    const { userId, companyName, userRole, companySize, industry, nicheId, engagementData, behavioralProfile } = params;
    // Step 1: Load niche profile
    const niche = masterConfig_generated_1.NICHE_PROFILES[nicheId];
    if (!niche) {
        throw new Error(`Niche ${nicheId} not found in profiles`);
    }
    // Step 2: Detect current stage
    const currentStage = stageDetector_1.StageDetector.detectStage(engagementData);
    const stageFramework = niche.email_stage_framework[currentStage];
    const engagementMetrics = stageDetector_1.StageDetector.calculateEngagementMetrics(engagementData);
    // Step 3: Classify buyer persona
    const userProfile = { userId, companyName, userRole, companySize, industry };
    const personaScores = personaClassifier_1.PersonaClassifier.classifyPersona(userProfile);
    const topPersona = personaScores[0];
    // Step 4: Get company size profile
    const companySizeKey = getCompanySizeKey(companySize);
    const companySizeProfile = niche.company_size_psychology[companySizeKey];
    // Step 5: Get buyer persona profile
    const buyerPersonaProfile = niche.buyer_persona_dna[topPersona?.personaType];
    // === NEW: INTEGRATE LEARNED BEHAVIORS ===
    let learnedBestTrigger;
    let learnedBestCTA;
    let learnedBestSendTime;
    let learnedPersonaAdjustments = null;
    let learningConfidence = "low";
    if (behavioralProfile && behavioralProfile.data_quality.total_campaigns_tracked > 0) {
        // Get best performing trigger
        const bestTrigger = BehavioralProfileManager_1.BehavioralProfileManager.getConfidenceWeightedBest(behavioralProfile.learned_triggers);
        if (bestTrigger && bestTrigger.confidence > 0.5) {
            learnedBestTrigger = bestTrigger.trigger;
        }
        // Get best performing CTA
        const bestCTA = BehavioralProfileManager_1.BehavioralProfileManager.getBestPerformer(behavioralProfile.learned_cta_performance.filter(c => c.persona === topPersona?.personaType), 'conversionRate');
        if (bestCTA && bestCTA.conversionRate > 0.03) {
            learnedBestCTA = bestCTA.cta;
        }
        // Get best send time
        if (behavioralProfile.learned_send_times.length > 0) {
            learnedBestSendTime = behavioralProfile.learned_send_times[0].time;
        }
        // Get persona micro-adjustments
        if (behavioralProfile.persona_overrides[topPersona?.personaType || '']) {
            learnedPersonaAdjustments =
                behavioralProfile.persona_overrides[topPersona?.personaType || ''];
        }
        learningConfidence = behavioralProfile.data_quality.confidence_level;
    }
    // Step 6: Rank psychological triggers
    const rankedTriggers = rankPsychologicalTriggers(niche.psychological_triggers, currentStage, companySize, topPersona?.personaType, learnedBestTrigger // Pass learned data to influence ranking
    );
    // Step 7: Predict objections with likelihoods
    const predictedObjections = predictObjectionsWithLikelihoods(niche.objection_handling, behavioralProfile?.real_objections || [], currentStage, companySize);
    // Step 8: Check seasonal context
    const { seasonalContext, seasonalUrgency } = getSeasonalContext(niche.seasonal_psychology, currentStage);
    // Step 9: Determine value ladder position
    const { valueLadderTier, valueLadderOffering, nextUpselledProduct } = getValueLadderPosition(niche.value_ladder, engagementMetrics, currentStage);
    // Step 10: Get competitive positioning
    const competitivePosition = niche.competitive_positioning?.market_positioning;
    const competitiveAngle = competitivePosition?.[`${currentStage}_angle`] || 'value leader';
    // Step 11: Get stage recommendations
    const stageRecommendations = stageDetector_1.StageDetector.getStageRecommendations(currentStage);
    // Step 12: Determine urgency level
    const urgencyLevel = getUrgencyLevel(currentStage, companySize, engagementMetrics);
    // Step 13: Build enhanced system prompt with learning
    const formattedTriggers = rankedTriggers.map((trigger, index) => ({
        trigger,
        score: 100 - index * 10
    }));
    const systemPrompt = buildEnhancedSystemPrompt({
        niche,
        stage: currentStage,
        companySize,
        persona: topPersona?.personaType || 'the_pragmatist',
        triggers: formattedTriggers,
        seasonalContext,
        urgencyLevel,
        learnedData: {
            bestTrigger: learnedBestTrigger,
            bestCTA: learnedBestCTA,
            learningConfidence,
            realObjections: behavioralProfile?.real_objections || []
        }
    });
    // Compile context object
    const emailContext = {
        userId,
        companyName,
        userRole,
        companySize,
        nicheId,
        niche,
        // Learning data
        behavioralProfile,
        learningConfidence,
        campaignsTracked: behavioralProfile?.data_quality.total_campaigns_tracked || 0,
        currentStage,
        topPersona: topPersona?.personaType || 'the_pragmatist',
        personaScore: topPersona?.score || 50,
        engagementMetrics,
        psychologicalTriggers: niche.psychological_triggers,
        rankedTriggers: formattedTriggers,
        communicationPattern: {
            tone: niche.communication_patterns.tone,
            languageStyle: niche.communication_patterns.language_style,
            messagingFocus: niche.communication_patterns.messaging_focus,
            formalityLevel: niche.communication_patterns.formality_level
        },
        stageFramework,
        companySizeProfile,
        buyerPersonaProfile,
        // Learned overrides
        learnedBestTrigger,
        learnedBestCTA,
        learnedBestSendTime,
        learnedPersonaAdjustments,
        learnedObjectionPatterns: behavioralProfile?.real_objections,
        narrativeHooks: niche.content_strategies.narrative_hooks,
        ctaPatterns: niche.content_strategies.cta_patterns,
        ctaType: stageFramework.cta_type,
        urgencySignals: niche.content_strategies.urgency_signals,
        subjectLineStyle: stageFramework.subject_line_style,
        predictedObjections,
        seasonalContext,
        seasonalUrgency,
        optimalSendTime: learnedBestSendTime || niche.industry_benchmarks.best_send_times[0],
        valueLadderTier,
        valueLadderOffering,
        nextUpselledProduct,
        competitivePosition: Object.keys(competitivePosition || {})[0] || 'value_leader',
        competitiveAngle,
        marketSaturation: behavioralProfile?.market_intelligence.market_saturation_score,
        exhaustedMessaging: behavioralProfile?.market_intelligence.exhausted_urgency_signals,
        uniqueAnglesAvailable: behavioralProfile?.market_intelligence.unique_angles_available,
        recommendations: {
            emailFrequency: stageRecommendations.emailFrequency,
            contentFocus: stageRecommendations.contentType,
            toneSuggestion: stageRecommendations.toneSuggestion,
            urgencyLevel
        },
        systemPrompt
    };
    return emailContext;
}
/**
 * Enhanced system prompt that incorporates learning
 */
function buildEnhancedSystemPrompt(params) {
    const { niche, stage, companySize, persona, triggers, seasonalContext, urgencyLevel, learnedData } = params;
    const realObjectionsSection = learnedData.realObjections?.length
        ? `
REAL OBJECTIONS FROM THIS AUDIENCE:
${learnedData.realObjections
            .slice(0, 3)
            .map((obj) => `- "${obj.objection_statement}" (appears ${obj.frequency} times)`)
            .join('\n')}

When writing, preempt these specific concerns naturally in the copy.
`
        : '';
    const learnedDataSection = learnedData.learningConfidence === 'high' ||
        learnedData.learningConfidence === 'very_high'
        ? `
LEARNED FROM REAL CAMPAIGNS (${learnedData.learningConfidence} confidence):
${learnedData.bestTrigger
            ? `- Most effective trigger: ${learnedData.bestTrigger}`
            : ''}
${learnedData.bestCTA ? `- Best performing CTA: ${learnedData.bestCTA}` : ''}

Use these insights to inform your copy - they're based on real performance data.
`
        : '';
    return `
You are an expert email copywriter who deeply understands the ${niche.niche_name} industry.
Your emails are data-driven, psychologically informed, and tailored to real audience behavior.

COMPANY PROFILE:
- Industry: ${niche.sector}
- Niche: ${niche.niche_name}
- Company Size: ${companySize}
- Buyer Persona: ${persona}

CURRENT STAGE: ${stage.toUpperCase()}
- Focus on: ${niche.email_stage_framework[stage].content_focus}
- CTA Type: ${niche.email_stage_framework[stage].cta_type}

PSYCHOLOGICAL FRAMEWORK:
- Primary Triggers: ${triggers.slice(0, 3).map(t => t.trigger).join(', ')}
- Pain Points: ${niche.pain_points.slice(0, 3).join(', ')}

COMMUNICATION STYLE:
- Tone: ${niche.communication_patterns.tone}
- Formality: ${niche.communication_patterns.formality_level}

URGENCY LEVEL: ${urgencyLevel}
${seasonalContext ? `- SEASONAL CONTEXT: ${seasonalContext}` : ''}

${learnedDataSection}
${realObjectionsSection}

GUIDELINES:
1. Write copy that resonates with this specific persona
2. Use the psychological triggers and pain points above
3. Avoid the communication patterns that fall flat with this audience
4. Address real objections preemptively
5. Keep CTA aligned with the stage (${niche.email_stage_framework[stage].cta_type})
`;
}
/**
 * Predict objections with likelihoods based on learned data
 */
function predictObjectionsWithLikelihoods(staticObjectionHandlers, learnedObjections, stage, companySize) {
    const predictions = [];
    if (stage === 'consideration' || stage === 'decision') {
        // First, add learned objections (real data)
        for (const learned of learnedObjections.slice(0, 3)) {
            predictions.push({
                objection: learned.objection_statement,
                reframe: `Address: ${learned.objection_statement}`,
                cta: learned.best_response_cta || 'Learn More',
                likelihood: Math.min(learned.frequency / 10, 1) // Normalize frequency to 0-1
            });
        }
        // Then add static handlers (theoretical)
        for (const [, handler] of Object.entries(staticObjectionHandlers).slice(0, 3)) {
            if (!predictions.find((p) => p.objection === handler.objection_statement)) {
                predictions.push({
                    objection: handler.objection_statement,
                    reframe: handler.email_reframe,
                    cta: handler.cta_variant,
                    likelihood: 0.5 // Default confidence for theoretical objections
                });
            }
        }
    }
    return predictions.slice(0, 3);
}
/**
 * Helper: Rank triggers with learning integration
 */
function rankPsychologicalTriggers(allTriggers, stage, companySize, persona, learnedBestTrigger) {
    const stageOrdering = {
        awareness: {
            'Curiosity': 1,
            'Security & Trust': 2,
            'Peace of Mind': 3,
            'Financial Freedom': 4
        },
        consideration: {
            'Competitive Comparison': 1,
            'ROI Optimization': 2,
            'Time Efficiency': 3,
            'Risk Mitigation': 4
        },
        decision: {
            'Fear of Loss': 1,
            'Urgency': 2,
            'Exclusivity': 3,
            'Social Proof': 4
        },
        retention: {
            'Success Celebration': 1,
            'Community & Belonging': 2,
            'Wealth Growth': 3,
            'Optimization': 4
        }
    };
    const ordering = stageOrdering[stage] || {};
    // If we have learned best trigger, prioritize it
    let triggers = [...allTriggers];
    if (learnedBestTrigger && triggers.includes(learnedBestTrigger)) {
        triggers = [
            learnedBestTrigger,
            ...triggers.filter(t => t !== learnedBestTrigger)
        ];
    }
    return triggers.sort((a, b) => {
        const scoreA = ordering[a] || 999;
        const scoreB = ordering[b] || 999;
        return scoreA - scoreB;
    });
}
/**
 * Other helper functions remain the same...
 */
function getCompanySizeKey(size) {
    const sizeMap = {
        '1-10': 'micro_1_10',
        'micro': 'micro_1_10',
        '11-50': 'small_11_50',
        'small': 'small_11_50',
        '51-200': 'mid_market_51_500',
        '201-500': 'mid_market_51_500',
        '51-500': 'mid_market_51_500',
        'mid_market': 'mid_market_51_500',
        '500+': 'enterprise_501_plus',
        'enterprise': 'enterprise_501_plus'
    };
    return sizeMap[size] || 'small_11_50';
}
function getSeasonalContext(seasonalProfiles, stage) {
    const month = new Date().getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    for (const [key, profile] of Object.entries(seasonalProfiles)) {
        if (key.includes(`q${quarter}`)) {
            return {
                seasonalContext: profile.email_angle,
                seasonalUrgency: profile.urgency_level
            };
        }
    }
    return {};
}
function getValueLadderPosition(valueLadder, metrics, stage) {
    let tier = 'entry_level';
    if (metrics.engagementScore > 50 && stage === 'consideration') {
        tier = 'core_product';
    }
    else if (metrics.engagementScore > 75 && stage === 'decision') {
        tier = 'premium_tier';
    }
    const tierData = valueLadder[tier];
    const tiers = Object.keys(valueLadder);
    const nextTier = tiers[tiers.indexOf(tier) + 1];
    return {
        valueLadderTier: tier,
        valueLadderOffering: tierData?.offering || 'entry-level offering',
        nextUpselledProduct: nextTier ? valueLadder[nextTier]?.offering : undefined
    };
}
function getUrgencyLevel(stage, companySize, metrics) {
    if (stage === 'decision') {
        return metrics.engagementScore > 75 ? 'critical' : 'high';
    }
    if (stage === 'consideration') {
        return 'high';
    }
    if (stage === 'awareness') {
        return 'low';
    }
    return 'medium';
}
//# sourceMappingURL=EmailBrain.js.map