/**
 * EmailBrain Learning API Routes (MongoDB/Mongoose Version)
 * Collects campaign feedback and updates behavioral profiles in MongoDB
 * Location: backend/src/routes/emailbrain-learning.ts
 */

import express from 'express';
import { BehavioralProfileManager } from '../emailbrain/managers/BehavioralProfileManager';
import { BehavioralProfileModel, dbToCamelCase } from '../models/BehavioralProfile';
import { CampaignRecordModel } from '../models/CampaignRecord';

const router = express.Router();

import { authenticateUser } from '../middleware/auth';
/**
 * POST /api/campaigns/feedback
 * Submit campaign results for learning (MongoDB stores with snake_case)
 */
router.post('/api/campaigns/feedback', authenticateUser, async (req, res) => {
  try {
    const feedback = req.body;

    // ✅ FIXED: Better validation with range checks
    if (!feedback.emailId || !feedback.nicheId || !feedback.subject_line || !feedback.cta_used) {
      return res.status(400).json({
        error: 'Missing required fields: emailId, nicheId, subject_line, cta_used'
      });
    }

    // ✅ FIXED: Validate numeric ranges
    if (feedback.actual_open_rate !== undefined && (feedback.actual_open_rate < 0 || feedback.actual_open_rate > 1)) {
      return res.status(400).json({ error: 'actual_open_rate must be between 0 and 1' });
    }

    // ✅ FIXED: Check if campaign exists and belongs to user
    const existingCampaign = await CampaignRecordModel.findOne({ 
      email_id: feedback.emailId,
      user_id: req.user.id 
    });
    
    if (!existingCampaign) {
      return res.status(404).json({ error: 'Campaign not found or unauthorized' });
    }

    // ✅ FIXED: Idempotency check - prevent double processing
    if (existingCampaign.status === 'processed') {
      return res.status(409).json({ error: 'Campaign already processed' });
    }

    // Step 1: Fetch current behavioral profile from MongoDB
    const currentProfile = await BehavioralProfileModel.findOne({
      niche_id: feedback.nicheId
    });

    // Step 2: Process feedback and update profile
    const updatedProfile = await BehavioralProfileManager.processCampaignFeedback(
      feedback,
      currentProfile
    );

    // Step 3: Save updated profile to MongoDB with atomic operation
    await BehavioralProfileModel.updateOne(
      { niche_id: feedback.nicheId },
      { $set: updatedProfile },
      { upsert: true }
    );

    // ✅ FIXED: Update campaign status to processed
    await CampaignRecordModel.updateOne(
      { email_id: feedback.emailId },
      { $set: { status: 'processed', processed_at: new Date() } }
    );

    // Step 4: Return confirmation with insights
    res.json({
      success: true,
      message: `Feedback recorded for ${feedback.nicheId}`,
      insights: {
        prediction_accuracy: {
          open_rate_error: Math.abs((feedback.predicted_open_rate || 0) - (feedback.actual_open_rate || 0)),
          click_rate_error: Math.abs((feedback.predicted_click_rate || 0) - (feedback.actual_click_rate || 0))
        },
        learning_updates: {
          triggers_updated: updatedProfile.learned_triggers?.length || 0,
          ctas_updated: updatedProfile.learned_cta_performance?.length || 0,
          confidence_level: updatedProfile.data_quality?.confidence_level || 'low'
        },
        best_performers: {
          trigger: BehavioralProfileManager.getConfidenceWeightedBest(
            updatedProfile.learned_triggers || []
          ),
          cta: BehavioralProfileManager.getBestPerformer(
            updatedProfile.learned_cta_performance || [],
            'conversion_rate'
          )
        }
      }
    });
  } catch (error) {
    console.error('Campaign feedback error:', error);
    res.status(500).json({ error: 'Failed to process campaign feedback' });
  }
});

/**
 * GET /api/niches/:nicheId/behavioral-profile
 * Fetch learned behavioral data for a niche
 */
router.get('/api/niches/:nicheId/behavioral-profile', authenticateUser, async (req, res) => {
  try {
    const { nicheId } = req.params;

    const dbProfile = await BehavioralProfileModel.findOne({
      niche_id: nicheId
    });

    if (!dbProfile) {
      return res.status(404).json({
        error: `No behavioral profile found for niche ${nicheId}`
      });
    }

    const profile = dbToCamelCase(dbProfile);

    res.json({
      success: true,
      profile,
      recommendations: {
        best_trigger: BehavioralProfileManager.getConfidenceWeightedBest(
          dbProfile.learned_triggers || []
        ),
        best_cta: BehavioralProfileManager.getBestPerformer(
          dbProfile.learned_cta_performance || [],
          'conversion_rate'
        ),
        optimal_send_time: dbProfile.learned_send_times?.[0],
        confidence: dbProfile.data_quality?.confidence_level,
        sample_size: dbProfile.data_quality?.total_campaigns_tracked
      }
    });
  } catch (error) {
    console.error('Error fetching behavioral profile:', error);
    res.status(500).json({ error: 'Failed to fetch behavioral profile' });
  }
});

/**
 * GET /api/niches/:nicheId/trends
 * Get performance trends and insights
 */
router.get('/api/niches/:nicheId/trends', authenticateUser, async (req, res) => {
  try {
    const { nicheId } = req.params;

    const dbProfile = await BehavioralProfileModel.findOne({
      niche_id: nicheId
    });

    if (!dbProfile) {
      return res.status(404).json({ error: `Niche ${nicheId} not found` });
    }

    res.json({
      success: true,
      niche: nicheId,
      trends: dbProfile.trends,
      market_intelligence: dbProfile.market_intelligence,
      data_freshness: {
        last_updated: dbProfile.data_quality?.last_updated,
        campaigns_tracked: dbProfile.data_quality?.total_campaigns_tracked
      }
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

/**
 * GET /api/niches/:nicheId/persona/:persona/overrides
 * Get persona-specific overrides
 */
router.get('/api/niches/:nicheId/persona/:persona/overrides', authenticateUser, async (req, res) => {
  try {
    const { nicheId, persona } = req.params;

    const dbProfile = await BehavioralProfileModel.findOne({
      niche_id: nicheId
    });

    if (!dbProfile) {
      return res.status(404).json({ error: `Niche ${nicheId} not found` });
    }

    const override = dbProfile.persona_overrides?.[persona];

    if (!override) {
      return res.status(404).json({
        error: `No learned overrides for ${persona} in ${nicheId}`
      });
    }

    res.json({
      success: true,
      persona,
      niche: nicheId,
      overrides: override,
      confidence: override.trigger_override_confidence,
      sample_size: override.sample_size
    });
  } catch (error) {
    console.error('Error fetching persona overrides:', error);
    res.status(500).json({ error: 'Failed to fetch persona overrides' });
  }
});

/**
 * GET /api/niches/:nicheId/objections
 * Get real objections that are actually happening
 */
router.get('/api/niches/:nicheId/objections', authenticateUser, async (req, res) => {
  try {
    const { nicheId } = req.params;

    const dbProfile = await BehavioralProfileModel.findOne({
      niche_id: nicheId
    });

    if (!dbProfile) {
      return res.status(404).json({ error: `Niche ${nicheId} not found` });
    }

    const sortedObjections = (dbProfile.real_objections || []).sort(
      (a, b) => (b.frequency || 0) - (a.frequency || 0)
    );

    res.json({
      success: true,
      niche: nicheId,
      objections: sortedObjections,
      total_tracked: sortedObjections.length
    });
  } catch (error) {
    console.error('Error fetching objections:', error);
    res.status(500).json({ error: 'Failed to fetch objections' });
  }
});

/**
 * POST /api/emails/generate
 * Generate AI-powered email using learned behavioral data from MongoDB
 * ✅ FIXED: Now uses OpenRouter instead of Claude
 */
router.post('/api/emails/generate', authenticateUser, async (req, res) => {
  try {
    const { nicheId, stage, persona, subject, audience } = req.body;

    // ✅ FIXED: Validate required fields
    if (!nicheId || !stage || !persona || !audience) {
      return res.status(400).json({ 
        error: 'Missing required fields: nicheId, stage, persona, audience' 
      });
    }

    // ✅ FIXED: Check for req.user existence
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Step 1: Generate static context
    const staticContext = generateEmailContext({
      userId: req.user.id,
      companyName: audience.companyName,
      userRole: audience.userRole,
      companySize: audience.companySize,
      industry: audience.industry,
      nicheId,
      engagementData: audience.engagement || {}
    });

    // Step 2: Fetch learned behaviors from MongoDB
    const dbBehavioralProfile = await BehavioralProfileModel.findOne({
      niche_id: nicheId
    });

    // Step 3: Merge learned data into context
    let enhancedContext = { ...staticContext };

    if (dbBehavioralProfile && (dbBehavioralProfile.data_quality?.total_campaigns_tracked || 0) > 5) {
      const bestTrigger = BehavioralProfileManager.getConfidenceWeightedBest(
        dbBehavioralProfile.learned_triggers || []
      );
      if (bestTrigger && bestTrigger.confidence > 0.5) {
        enhancedContext.psychologicalTriggers = [
          bestTrigger.trigger,
          ...staticContext.psychologicalTriggers.filter(t => t !== bestTrigger.trigger)
        ];
      }

      const bestCTA = BehavioralProfileManager.getBestPerformer(
        (dbBehavioralProfile.learned_cta_performance || []).filter(c => c.persona === persona),
        'conversion_rate'
      );
      if (bestCTA && bestCTA.conversion_rate > 0.03) {
        enhancedContext.ctaPatterns = [
          bestCTA.cta,
          ...staticContext.ctaPatterns.filter(c => c !== bestCTA.cta)
        ];
      }

      if ((dbBehavioralProfile.learned_send_times || []).length > 0) {
        enhancedContext.optimalSendTime = dbBehavioralProfile.learned_send_times[0].time;
      }

      if (dbBehavioralProfile.market_intelligence?.market_saturation_score > 70) {
        enhancedContext.marketWarning = 'Market saturation detected - differentiate on trustworthiness';
      }
    }

    // ✅ FIXED: Call OpenRouter API instead of Claude
    const email = await generateEmailWithOpenRouter(enhancedContext, subject, persona);

    // Step 5: Store campaign record for later feedback
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // ✅ FIXED: Added user_id to campaign record
    await CampaignRecordModel.create({
      email_id: emailId,
      user_id: req.user.id,  // ✅ FIXED: Added user ownership
      niche_id: nicheId,
      stage,
      persona,
      company_size: audience.companySize,
      subject_line: email.subject_line,
      cta_used: email.cta,
      cta_type: staticContext.ctaType,
      primary_trigger_used: enhancedContext.psychologicalTriggers?.[0] || 'default',
      send_time: enhancedContext.optimalSendTime || 'TBD',
      send_day: extractDayFromTime(enhancedContext.optimalSendTime),
      niche_name: staticContext.niche?.niche_name,
      predicted_open_rate: estimateOpenRate(email.subject_line, persona),
      predicted_click_rate: estimateClickRate(email.cta, stage),
      predicted_conversion_rate: estimateConversionRate(stage, persona),
      status: 'generated',
      sent_to: 0,
      sent_at: null,
      created_at: new Date(),
      metadata: {
        learning_confidence_at_send: dbBehavioralProfile?.data_quality?.confidence_level || 'none',
        best_trigger_used: enhancedContext.psychologicalTriggers?.[0],
        market_saturation_score: dbBehavioralProfile?.market_intelligence?.market_saturation_score,
        ai_model: process.env.OPENROUTER_MODEL || 'arcee-ai/trinity-large-preview:free'
      }
    });

    res.json({
      success: true,
      email: {
        subject_line: email.subject_line,
        body: email.body,
        cta: email.cta
      },
      tracking: {
        emailId,
        feedbackEndpoint: '/api/campaigns/feedback'
      },
      learning_applied: {
        confidence_level: dbBehavioralProfile?.data_quality?.confidence_level || 'none',
        campaigns_studied: dbBehavioralProfile?.data_quality?.total_campaigns_tracked || 0,
        best_trigger_from_learning: BehavioralProfileManager.getConfidenceWeightedBest(
          dbBehavioralProfile?.learned_triggers || []
        )?.trigger
      }
    });
  } catch (error) {
    console.error('Email generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * ========== HELPER FUNCTIONS ==========
 */

function estimateOpenRate(subject: string, persona: string): number {
  const baseRate = persona === 'the_pragmatist' ? 0.24 : 0.2;
  const hasUrgency = /urgent|today|now|limited/i.test(subject) ? 1.2 : 1;
  const hasNumber = /\d+/.test(subject) ? 1.1 : 1;
  return Math.min(baseRate * hasUrgency * hasNumber, 0.5);
}

function estimateClickRate(cta: string, stage: string): number {
  const stageBase: Record<string, number> = {
    awareness: 0.02,
    consideration: 0.05,
    decision: 0.08,
    retention: 0.04
  };
  return stageBase[stage] || 0.03;
}

function estimateConversionRate(stage: string, persona: string): number {
  const stageBase: Record<string, number> = {
    awareness: 0.005,
    consideration: 0.015,
    decision: 0.05,
    retention: 0.03
  };
  return stageBase[stage] || 0.01;
}

function extractDayFromTime(time: string): string {
  if (!time) return 'Monday';
  const match = time.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
  return match ? match[0] : 'Monday';
}

// ✅ FIXED: Complete implementation of generateEmailContext
function generateEmailContext(params: any): any {
  const personaTriggers: Record<string, string[]> = {
    the_pragmatist: ['ROI Evidence', 'Case Studies', 'Efficiency Gains', 'Data-Driven Results'],
    the_decision_maker: ['Strategic Advantage', 'Competitive Edge', 'Time Savings', 'Scalability'],
    the_implementer: ['Technical Specs', 'Integration Ease', 'API Access', 'Customization'],
    the_influencer: ['Industry Trends', 'Peer Success', 'Innovation', 'Early Adopter Benefits'],
    the_risk_averse: ['Security', 'Compliance', 'Proven Track Record', 'Risk Mitigation']
  };
  
  const ctaPatterns: Record<string, string[]> = {
    awareness: ['Learn more', 'See how it works', 'Get the guide'],
    consideration: ['See case studies', 'Book a demo', 'Get pricing'],
    decision: ['Start free trial', 'Schedule onboarding', 'Get started'],
    retention: ['Upgrade now', 'Refer a colleague', 'Provide feedback']
  };
  
  const stage = params.engagementData?.stage || 'consideration';
  const persona = params.engagementData?.persona || 'the_pragmatist';
  
  return {
    companyName: params.companyName || 'your company',
    userRole: params.userRole || 'marketing professional',
    companySize: params.companySize || 'mid-size',
    industry: params.industry || 'technology',
    nicheId: params.nicheId,
    stage: stage,
    persona: persona,
    psychologicalTriggers: personaTriggers[persona] || personaTriggers.the_pragmatist,
    ctaPatterns: ctaPatterns[stage] || ctaPatterns.consideration,
    ctaType: stage === 'awareness' ? 'educational' : stage === 'decision' ? 'direct' : 'value-based',
    optimalSendTime: 'Tuesday 10am',
    engagementScore: params.engagementData?.score || 0.5,
    niche: { niche_name: params.nicheId }
  };
}

// ✅ FIXED: New function using OpenRouter instead of Claude
async function generateEmailWithOpenRouter(context: any, subject: string, persona: string): Promise<any> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'arcee-ai/trinity-large-preview:free';
  
  if (!apiKey) {
    console.warn('OPENROUTER_API_KEY not configured, using fallback');
    return generateFallbackEmail(context, persona);
  }
  
  const prompt = buildEmailPrompt(context, subject, persona);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'EmailBrain Learning System'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are an expert email copywriter specializing in cold outreach and marketing emails.
                      You understand psychological triggers, conversion optimization, and personalization.
                      Write in a natural, human tone. Avoid spam triggers and overly salesy language.
                      Return ONLY valid JSON with fields: subject_line, body, cta`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error (${response.status})`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.warn('Invalid JSON response, attempting to parse manually');
      parsed = extractEmailComponents(content);
    }
    
    return {
      subject_line: parsed.subject_line || parsed.subject || subject || 'Your personalized solution',
      body: parsed.body || parsed.content || content,
      cta: parsed.cta || parsed.call_to_action || 'Learn More'
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return generateFallbackEmail(context, persona);
  }
}

// ✅ FIXED: New function to build prompts for OpenRouter
function buildEmailPrompt(context: any, subject: string, persona: string): string {
  const personaProfiles: Record<string, string> = {
    the_pragmatist: 'Practical, ROI-focused, wants data and results. Skeptical of hype.',
    the_decision_maker: 'Busy executive who needs clear value proposition and quick wins.',
    the_implementer: 'Technical user who wants specifics, integration details, and use cases.',
    the_influencer: 'Social proof seeker who cares about trends and what peers are using.',
    the_risk_averse: 'Needs guarantees, security, compliance, and proven track record.'
  };
  
  return `Generate a cold email with the following specifications:
  
CONTEXT:
- Company: ${context.companyName}
- Industry: ${context.industry}
- Target Persona: ${persona} - ${personaProfiles[persona] || 'Standard business professional'}
- Subject line hint: ${subject || 'Write a compelling subject line'}
- Buyer Journey Stage: ${context.stage || 'consideration'}

PSYCHOLOGICAL TRIGGERS TO USE:
${context.psychologicalTriggers?.map((t: string) => `- ${t}`).join('\n') || '- Authority, Social Proof, Scarcity'}

CTA PATTERNS THAT WORK:
${context.ctaPatterns?.map((c: string) => `- ${c}`).join('\n') || '- Clear, low-commitment, value-focused'}

${context.marketWarning ? `⚠️ MARKET INSIGHT: ${context.marketWarning}` : ''}

OPTIMAL SEND TIME: ${context.optimalSendTime || 'Tuesday 10am'}

REQUIREMENTS:
1. Keep it under 150 words
2. Personalize with company name
3. Focus on value, not features
4. End with a specific, low-friction CTA
5. Avoid spam triggers: "free", "guaranteed", "limited time" (unless appropriate)

Return JSON format:
{
  "subject_line": "compelling subject line",
  "body": "full email body text",
  "cta": "call to action text"
}`;
}

// ✅ FIXED: New fallback function
function generateFallbackEmail(context: any, persona: string): any {
  const subjectLines = [
    `Improving ${context.companyName}'s ${context.industry} outreach`,
    `A quick thought on ${context.industry} engagement`,
    `${context.companyName} - personalized approach inside`
  ];
  
  const bodies = [
    `Hi there,

I've been analyzing how ${context.industry} companies like ${context.companyName} handle customer engagement.

Based on our data, there's an opportunity to improve response rates by focusing on ${persona === 'the_pragmatist' ? 'ROI-driven' : 'personalized'} messaging.

Would you be open to a brief conversation about what we're seeing in your space?

Best regards,`,
    
    `Hello,

Noticed ${context.companyName}'s approach to ${context.industry} outreach could benefit from some behavioral insights we've discovered.

Happy to share what's working for similar companies.

Thoughts?`
  ];
  
  return {
    subject_line: subjectLines[Math.floor(Math.random() * subjectLines.length)],
    body: bodies[Math.floor(Math.random() * bodies.length)],
    cta: 'Reply to learn more'
  };
}

// ✅ FIXED: New extraction function
function extractEmailComponents(text: string): any {
  const subjectMatch = text.match(/subject[_\s:]+["']?([^"'\n]+)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : null;
  
  const ctaMatch = text.match(/cta[_\s:]+["']?([^"'\n]+)/i);
  const cta = ctaMatch ? ctaMatch[1].trim() : null;
  
  let body = text;
  if (subjectMatch) body = body.replace(subjectMatch[0], '');
  if (ctaMatch) body = body.replace(ctaMatch[0], '');
  
  return {
    subject_line: subject,
    body: body.trim(),
    cta: cta
  };
}

export default router;