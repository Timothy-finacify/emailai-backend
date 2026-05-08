
const path = require('path');
const fs = require('fs');

// ============================================
// IMPORTS
// ============================================
const BriefPerformanceTracker = require('./briefPerformanceTracker');
const { loadDynamicNiches, findOrCreateNiche } = require('./dynamicNicheManager');

// ============================================
// CONFIGURATION
// ============================================
const AI_PROVIDER = process.env.AI_PROVIDER?.toLowerCase() || 'groq';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// ✅ LOAD EMAILBRAIN CONFIG
let NICHE_PROFILES = {};
let DEFAULT_NICHE_ID = 'DEFAULT_TECH_001';

try {
  const configPath = path.join(__dirname, '../emailbrain/config/masterConfig.generated.js');
  
  console.log(`📁 Loading EmailBrain config from: ${configPath}`);
  
  if (fs.existsSync(configPath)) {
    const config = require(configPath);
    NICHE_PROFILES = config.NICHE_PROFILES || {};
    
    if (Object.keys(NICHE_PROFILES).length > 0) {
      const availableNicheIds = Object.keys(NICHE_PROFILES);
      DEFAULT_NICHE_ID = availableNicheIds[0];
      
      console.log(`✅ EmailBrain config loaded: ${availableNicheIds.length} niches`);
      console.log(`   Default niche: ${DEFAULT_NICHE_ID}`);
    } else {
      throw new Error('NICHE_PROFILES is empty');
    }
  } else {
    throw new Error(`Config file not found at: ${configPath}`);
  }
} catch (error) {
  console.warn(`⚠️ EmailBrain config not found: ${error.message}`);
  console.log('📋 Using fallback NICHE_PROFILES...');
  
  // ✅ FALLBACK CONFIG
  NICHE_PROFILES = {
    'DEFAULT_TECH_001': {
      niche_id: 'DEFAULT_TECH_001',
      niche_name: 'Technology Services',
      sector: 'Technology',
      audience_segments: ['Technology decision makers'],
      pain_points: [
        'Struggling to demonstrate ROI to stakeholders',
        'High customer acquisition costs',
        'Difficulty scaling personalized outreach'
      ],
      value_propositions: ['Specialized expertise', 'Proven results', 'Time savings'],
      psychological_triggers: ['ROI', 'Efficiency', 'Scalability'],
      communication_patterns: {
        tone: 'Professional',
        language_style: 'Clear',
        messaging_focus: 'Efficiency',
        formality_level: 'Moderate'
      },
      email_stage_framework: {
        awareness: {
          primary_trigger: 'Problem Recognition',
          tone_adjustment: 'Educational',
          subject_line_style: 'Question-based',
          cta_type: 'Learn More',
          content_focus: 'Industry insights',
          email_frequency: '1x per week',
          trigger_keywords: ['discover', 'learn', 'understand']
        },
        consideration: {
          primary_trigger: 'Comparison',
          tone_adjustment: 'Consultative',
          subject_line_style: 'Benefit-focused',
          cta_type: 'Schedule Demo',
          content_focus: 'Case studies',
          email_frequency: '2x per week',
          trigger_keywords: ['compare', 'results']
        },
        decision: {
          primary_trigger: 'Urgency',
          tone_adjustment: 'Direct',
          subject_line_style: 'Offer-based',
          cta_type: 'Buy Now',
          content_focus: 'Pricing & Promos',
          email_frequency: '3x per week',
          trigger_keywords: ['offer', 'save', 'now']
        },
        retention: {
          primary_trigger: 'Success, Expansion',
          tone_adjustment: 'Supportive',
          subject_line_style: 'Personalized',
          cta_type: 'Upgrade, Refer',
          content_focus: 'Best practices, Tips',
          email_frequency: 'Monthly',
          trigger_keywords: ['new feature', 'tip', 'maximize']
        }
      },
      company_size_psychology: {
        micro_1_10: {
          decision_maker: 'Founder/Owner',
          pain_priorities: ['Cost', 'Time', 'Simplicity'],
          psychological_driver: 'Survival, Growth',
          budget_reality: 'Very tight',
          risk_tolerance: 'High',
          email_angle: 'Affordable, Quick win, Easy setup',
          proof_needed: 'Simple case studies, Quick ROI',
          cta_sentiment: 'Action-oriented',
          objection: 'Too expensive, Too complex'
        }
      },
      buyer_persona_dna: {
        the_pragmatist: {
          archetype: 'Value-driven, ROI-focused',
          motivation: 'Maximum return, Efficiency',
          pain_language: 'Cost, Time waste, Complexity',
          objection_style: 'Needs proof of value',
          email_trigger: 'Metrics, Case studies, ROI data',
          subject_line_angle: 'Numbers-first',
          social_proof_type: 'Case studies, Reviews, Benchmarks',
          risk_concern: 'Wasted investment',
          best_channel: 'Email, LinkedIn'
        }
      },
      linguistic_mandates: {
        forbidden_absolute_words: ['Guaranteed', 'Best', 'Perfect'],
        required_disclaimer_trigger: ['Results', 'Savings', 'Returns'],
        metaphor_bank: ['Partner', 'Solution', 'Platform', 'Ecosystem'],
        preferred_verb_tense: 'Present/Future Active'
      },
      compliance_scan_rules: [
        'Check for unsubstantiated claims',
        'Verify compliance with industry regulations',
        'Ensure proper disclosures'
      ],
      objection_handling: {
        budget_concern: {
          objection_statement: "It's not in the budget right now",
          email_reframe: 'ROI calculator shows payback in X months. Start with free trial.',
          proof_anchor: 'ROI calculator + Case study',
          cta_variant: 'Calculate Your ROI'
        }
      },
      seasonal_psychology: {
        q4_budget_flush: {
          psychology: 'Use it or lose it budget',
          email_angle: 'Use remaining budget before year end',
          urgency_level: 'High',
          send_window: 'November 1 - December 15'
        }
      },
      value_ladder: {
        entry_level: {
          offering: 'Free Consultation',
          price_point: '$0',
          psychology: 'Low-risk trial',
          key_messaging: 'No risk, expert advice',
          cta: 'Book Free Consultation'
        }
      },
      industry_benchmarks: {
        optimal_subject_line_length: '45-60 chars',
        best_send_times: ['Tuesday-Thursday 9am-11am'],
        avg_email_open_rate: '20-25%',
        avg_ctr: '2-3%'
      }
    }
  };
  
  DEFAULT_NICHE_ID = 'DEFAULT_TECH_001';
  console.log('✅ Fallback NICHE_PROFILES initialized');
}

loadDynamicNiches(NICHE_PROFILES, DEFAULT_NICHE_ID); 
// ============================================
// VALIDATION
// ============================================
if (!NICHE_PROFILES || Object.keys(NICHE_PROFILES).length === 0) {
  console.error('❌ CRITICAL: NICHE_PROFILES is empty!');
  throw new Error('EmailBrain initialization failed');
}

console.log(`🤖 AI Provider: ${AI_PROVIDER.toUpperCase()}`);
console.log(`📦 Model: ${GROQ_MODEL}`);
console.log(`✅ Available niches: ${Object.keys(NICHE_PROFILES).length}`);

// ============================================
// AI CALL FUNCTIONS
// ============================================

/**
 * Call Groq API
 */
async function callGroq(systemPrompt, userPrompt) {
  if (!GROQ_API_KEY) {
    throw new Error('❌ Groq API key not configured (GROQ_API_KEY)');
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  console.log(`   🤖 Calling Groq (${GROQ_MODEL})...`);

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${error.error?.message || response.status}`);
    }

    const data = await response.json();
    console.log(`   ✅ Response from Groq (${data.choices[0].message.content.length} chars)`);

    return data.choices[0].message.content;
  } catch (error) {
    console.error(`❌ Groq call failed: ${error.message}`);
    throw error;
  }
}

/**
 * Router: Call appropriate AI provider
 */
async function callAIModel(systemPrompt, userPrompt) {
  const provider = AI_PROVIDER.toLowerCase();

  switch (provider) {
    case 'groq':
      return await callGroq(systemPrompt, userPrompt);

    default:
      throw new Error(`❌ Unknown AI provider: ${provider}. Supported: groq`);
  }
}

// ============================================
// MAPPING FUNCTIONS
// ============================================

function mapIndustryToNicheId(industry) {
  const industryMap = {
    'finance': 'FIN_BANK_MM_001',
    'fintech': 'FIN_FINTECH_PM_032',
    'banking': 'FIN_BANK_MM_001',
    'financial': 'FIN_BANK_MM_001',
    'accounting': 'FIN_BANK_MM_001',
    'insurance': 'FIN_BANK_MM_001',
      'education': 'FIN_FINTECH_PM_032',
    'technology': 'DEFAULT_TECH_001',
    'saas': 'DEFAULT_TECH_001',
    'healthcare': 'DEFAULT_TECH_001',
    'ecommerce': 'DEFAULT_TECH_001',
    'education': 'DEFAULT_TECH_001',
    'realestate': 'DEFAULT_TECH_001',
    'other': DEFAULT_NICHE_ID
  };

  const mappedId = industryMap[industry?.toLowerCase()] || DEFAULT_NICHE_ID;

  if (NICHE_PROFILES[mappedId]) {
    return mappedId;
  }

  return DEFAULT_NICHE_ID;
}

function mapCompanySize(size) {
  const sizeMap = {
    '1-10': 'micro_1_10',
    '11-50': 'small_11_50',
    '51-200': 'mid_market_51_500',
    '201-500': 'mid_market_51_500',
    '500+': 'enterprise_501_plus'
  };
  return sizeMap[size] || 'small_11_50';
}

function mapUserToEmailBrainFormat(user) {
  const nicheId = mapIndustryToNicheId(user.industry);
  const companySize = mapCompanySize(user.companySize);

  return {
    userId: user._id.toString(),
    companyName: user.company || user.name || 'Valued Customer',
    userRole: user.jobTitle || user.role || 'Professional',
    companySize: companySize,
    industry: user.industry || 'other',
    nicheId: nicheId
  };
}

async function buildEngagementData(userId) {
  return {
    totalEmailsSent: 5,
    totalEmailsOpened: 3,
    totalEmailsClicked: 1,
    hasClickedCTA: true,
    hasScheduledDemo: false,
    hasRequestedQuote: false,
    daysSinceFirstEmail: 14,
    avgDaysBetweenEmails: 3,
    lastActionType: 'click',
    lastActionDaysAgo: 2
  };
}

// ============================================
// PROMPT BUILDING (MASTERFILE-FIRST)
// ============================================

/**
 * Build AI prompts with FULL masterfile grounding.
 * The masterfile ALWAYS comes first so the AI internalizes it
 * before processing any user request — even vague ones.
 */
function buildAIPrompt(brainContext, subject, campaignName, brief = null) {
  const niche = brainContext.niche;
  const stage = brainContext.currentStage || 'awareness';
  const persona = brainContext.topPersona || 'the_pragmatist';
  const companySize = brainContext.companySize || 'small_11_50';
  
  const stageFramework = niche.email_stage_framework?.[stage] || {};
  const personaDNA = niche.buyer_persona_dna?.[persona] || {};
  const sizeProfile = niche.company_size_psychology?.[companySize] || {};
  const linguisticRules = niche.linguistic_mandates || {};
  const complianceRules = niche.compliance_scan_rules || [];
  const objectionHandlers = niche.objection_handling || {};
  const benchmarks = niche.industry_benchmarks || {};
  const commPatterns = niche.communication_patterns || {};

  // ============================================
  // BUILD MASTERFILE GROUNDING (READ FIRST)
  // ============================================
  let masterfileSection = `
═══════════════════════════════════════════════
MASTERFILE CONFIGURATION — INTERNALIZE FIRST
═══════════════════════════════════════════════
You are writing for a VERY SPECIFIC audience. Before generating ANY content,
you MUST ground yourself in this configuration:

───────────────────────────────────────────────
NICHE: ${niche.niche_name} (${niche.sector})
───────────────────────────────────────────────
- Audience: ${niche.audience_segments?.join(', ') || niche.niche_name + ' professionals'}
- Value Proposition: ${niche.value_propositions?.slice(0, 3).join(' | ') || 'Specialized expertise'}
- Pain Points: ${niche.pain_points?.join(' | ') || 'Efficiency, Cost, Results'}

───────────────────────────────────────────────
CURRENT STAGE: ${stage.toUpperCase()}
───────────────────────────────────────────────
- Goal: ${stageFramework.primary_trigger || 'Engage'}
- Tone: ${stageFramework.tone_adjustment || 'Professional'}
- Subject Line Style: ${stageFramework.subject_line_style || 'Benefit-focused'}
- CTA Type: ${stageFramework.cta_type || 'Soft'}
- Content Focus: ${stageFramework.content_focus || 'Value-driven'}
- Email Frequency: ${stageFramework.email_frequency || '1x/week'}
- Keywords to use: ${stageFramework.trigger_keywords?.join(', ') || 'value, results, solution'}

───────────────────────────────────────────────
BUYER PERSONA: ${persona}
───────────────────────────────────────────────
- Archetype: ${personaDNA.archetype || 'ROI-focused decision maker'}
- What motivates them: ${personaDNA.motivation || 'Maximum return, Efficiency'}
- How they talk about pain: "${personaDNA.pain_language || 'Cost, Time waste, Complexity'}"
- How they object: ${personaDNA.objection_style || 'Needs proof of value'}
- What triggers them to open emails: ${personaDNA.email_trigger || 'Metrics, Case studies, ROI data'}
- Subject line angle that works: ${personaDNA.subject_line_angle || 'Numbers-first'}
- Proof they need: ${personaDNA.social_proof_type || 'Case studies, Reviews, Benchmarks'}
- Their biggest fear: ${personaDNA.risk_concern || 'Wasted investment'}
- Best channel: ${personaDNA.best_channel || 'Email, LinkedIn'}

───────────────────────────────────────────────
COMPANY SIZE PROFILE: ${companySize}
───────────────────────────────────────────────
- Decision Maker: ${sizeProfile.decision_maker || 'Founder/Owner'}
- Priority Pains (in order): ${sizeProfile.pain_priorities?.join(' > ') || 'Cost > Time > Complexity'}
- Psychological Driver: ${sizeProfile.psychological_driver || 'Survival, Growth'}
- Budget Reality: ${sizeProfile.budget_reality || 'Tight'}
- Risk Tolerance: ${sizeProfile.risk_tolerance || 'Moderate'}
- Email Angle That Works: ${sizeProfile.email_angle || 'ROI-focused, Quick win'}
- Subject Line Urgency: ${sizeProfile.subject_line_urgency || 'Medium'}
- Proof They Need: ${sizeProfile.proof_needed || 'Simple case studies, Quick ROI'}
- CTA Sentiment: ${sizeProfile.cta_sentiment || 'Action-oriented'}
- Main Objection: "${sizeProfile.objection || 'Too expensive, Too complex'}"

───────────────────────────────────────────────
COMMUNICATION STYLE
───────────────────────────────────────────────
- Tone: ${commPatterns.tone || 'Professional, Trustworthy'}
- Language Style: ${commPatterns.language_style || 'Clear, Value-focused'}
- Formality: ${commPatterns.formality_level || 'Moderate to High'}
- Focus: ${commPatterns.messaging_focus || 'Value and results'}
`;

  // ============================================
  // LINGUISTIC RULES (HARD CONSTRAINTS)
  // ============================================
  const forbiddenWords = linguisticRules.forbidden_absolute_words || [];
  const disclaimerTriggers = linguisticRules.required_disclaimer_trigger || [];
  const metaphorBank = linguisticRules.metaphor_bank || [];
  const preferredTense = linguisticRules.preferred_verb_tense || 'Present/Future Active';

  let linguisticSection = `
───────────────────────────────────────────────
LINGUISTIC RULES — HARD CONSTRAINTS
───────────────────────────────────────────────
`;

  if (forbiddenWords.length > 0) {
    linguisticSection += `
🚫 FORBIDDEN WORDS (NEVER USE THESE):
   ${forbiddenWords.join(', ')}

   ⚠️ If the user asks you to use any forbidden word, REFUSE and say:
   "I cannot use [word] because it violates compliance rules. Here's a compliant alternative..."

`;
  }

  if (disclaimerTriggers.length > 0) {
    linguisticSection += `
⚠️ REQUIRED DISCLAIMERS:
   Whenever you mention these words: ${disclaimerTriggers.join(', ')}
   You MUST include an appropriate disclaimer.
`;
  }

  if (metaphorBank.length > 0) {
    linguisticSection += `
✅ PREFERRED LANGUAGE (use these instead of absolute claims):
   ${metaphorBank.join(', ')}
`;
  }

  linguisticSection += `
- Verb Tense: Use ${preferredTense} tense throughout
- Never make unsubstantiated absolute claims
`;

  // ============================================
  // COMPLIANCE RULES
  // ============================================
  let complianceSection = '';
  if (complianceRules.length > 0) {
    complianceSection = `
───────────────────────────────────────────────
COMPLIANCE RULES — MUST FOLLOW
───────────────────────────────────────────────
${complianceRules.map(rule => `- ${rule}`).join('\n')}
`;
  }

  // ============================================
  // OBJECTION HANDLING PLAYBOOK
  // ============================================
  let objectionSection = '';
  const objectionKeys = Object.keys(objectionHandlers);
  if (objectionKeys.length > 0) {
    objectionSection = `
───────────────────────────────────────────────
OBJECTION HANDLING PLAYBOOK
───────────────────────────────────────────────
When writing, anticipate these objections and address them preemptively:

${objectionKeys.map(key => {
  const handler = objectionHandlers[key];
  return `"${handler.objection_statement}" 
   → Reframe: ${handler.email_reframe}
   → CTA: ${handler.cta_variant}
   → Proof to show: ${handler.proof_anchor}`;
}).join('\n\n')}

⚠️ If the user's request touches on any of these objections, you MUST
weave the reframe naturally into the email copy.
`;
  }

  // ============================================
  // BENCHMARKS
  // ============================================
  let benchmarkSection = '';
  if (Object.keys(benchmarks).length > 0) {
    benchmarkSection = `
───────────────────────────────────────────────
PERFORMANCE BENCHMARKS
───────────────────────────────────────────────
- Subject Line Length: ${benchmarks.optimal_subject_line_length || '45-60 chars'}
- Best Send Times: ${benchmarks.best_send_times?.join(', ') || 'Tuesday-Thursday 9am-11am'}
- Avg Open Rate: ${benchmarks.avg_email_open_rate || '20-25%'}
- Avg CTR: ${benchmarks.avg_ctr || '2-3%'}
`;
  }

  // ============================================
  // SEASONAL CONTEXT (if applicable)
  // ============================================
  let seasonalSection = '';
  const seasonalPsychology = niche.seasonal_psychology || {};
  const month = new Date().getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  
  for (const [key, profile] of Object.entries(seasonalPsychology)) {
    if (key.includes(`q${quarter}`)) {
      seasonalSection = `
───────────────────────────────────────────────
SEASONAL CONTEXT (ACTIVE NOW)
───────────────────────────────────────────────
- Psychology: ${profile.psychology}
- Angle: ${profile.email_angle}
- Urgency: ${profile.urgency_level}
- Send Window: ${profile.send_window}
`;
      break;
    }
  }

  // ============================================
  // VALUE LADDER
  // ============================================
  let valueLadderSection = '';
  const valueLadder = niche.value_ladder || {};
  if (Object.keys(valueLadder).length > 0) {
    const entryLevel = valueLadder.entry_level || {};
    valueLadderSection = `
───────────────────────────────────────────────
VALUE LADDER — CURRENT OFFERING
───────────────────────────────────────────────
- Entry Offer: ${entryLevel.offering || 'Free consultation'} (${entryLevel.price_point || '$0'})
- Psychology: ${entryLevel.psychology || 'Low-risk trial'}
- Key Message: ${entryLevel.key_messaging || 'No risk, expert advice'}
- CTA: ${entryLevel.cta || 'Book Free Consultation'}
`;
  }

  // ============================================
  // BRIEF SECTION (User-specified overrides)
  // ============================================
  let briefSection = '';
  if (brief) {
    briefSection = `
═══════════════════════════════════════════════
🎯 USER-SPECIFIED CAMPAIGN BRIEF (Overlay)
═══════════════════════════════════════════════
PRIMARY GOAL: ${brief.goal || brief.campaignGoal || 'Not specified'}
TARGET AUDIENCE: ${brief.targetAudience || 'Not specified'}
KEY MESSAGE: "${brief.keyMessage || 'Not specified'}"
DESIRED ACTION: ${brief.desiredAction || 'Not specified'}

⚠️ IMPORTANT: Follow this strategy while respecting ALL masterfile rules above.
If the brief conflicts with compliance rules, the masterfile rules WIN.
`;
  }



    // ============================================
  // LEARNED INSIGHTS (from past campaigns)
  // ============================================
  let learnedInsightsSection = '';
  if (brief && (brief.goal || brief.campaignGoal)) {
    const suggestions = BriefPerformanceTracker.getSmartSuggestions(
      brief.goal || brief.campaignGoal,
      brief.targetAudience
    );
    
    if (suggestions && suggestions.hasData) {
      learnedInsightsSection = `
───────────────────────────────────────────────
📊 LEARNED FROM PAST CAMPAIGNS
───────────────────────────────────────────────
${suggestions.tip || ''}
- Best performing message: "${suggestions.suggestedMessage || 'N/A'}"
- Best performing CTA: "${suggestions.suggestedAction || 'N/A'}"
- Based on: ${suggestions.totalCampaigns} campaigns
- Avg open rate for this goal: ${suggestions.avgOpenRate}%
- Confidence: ${suggestions.confidence}

Use these real-world insights to inform your copy.
`;
    }
  }

  // ============================================
  // RESPONSE PROTOCOL (How to process this)
  // ============================================
  const responseProtocol = `
═══════════════════════════════════════════════
RESPONSE PROTOCOL — HOW TO PROCESS REQUESTS
═══════════════════════════════════════════════

STEP 1: IDENTIFY what the user is asking for
  - Is it an awareness email? Decision email? Subject line only?
  - Map their vague request to the correct STAGE above

STEP 2: SELECT the right configuration
  - Use the PERSONA DNA to match their communication style
  - Use the COMPANY SIZE profile to match their budget/reality
  - Use the STAGE framework for tone, CTA type, and content focus

STEP 3: APPLY linguistic rules as HARD CONSTRAINTS
  - NEVER use forbidden words
  - ALWAYS use preferred metaphors
  - ALWAYS include disclaimers when needed

STEP 4: ANTICIPATE objections
  - Look at the objection playbook
  - Address the most relevant objection naturally in the copy

STEP 5: GENERATE the email
  - Write for THIS specific audience, not a generic one
  - Use the psychological triggers that matter to them
  - Keep HTML clean and professional

  STEP 6: HANDLE LINKS CORRECTLY
  - ONLY include links that the user explicitly provides in their brief/description
  - If the user includes a URL in their description, use THAT link for the CTA button
  - If no link is provided by the user, use href="#" for buttons (placeholder)
  - Never generate random URLs, fake domains, or made-up links
  - The CTA text should match the user's desired action

IF THE USER'S PROMPT IS VAGUE (e.g., "write me an email about saving money"):
  → Ground it in the masterfile: What would a ${sizeProfile.decision_maker || 'decision maker'} 
    in ${niche.niche_name} care about regarding savings?
  → Use their pain language: "${sizeProfile.pain_priorities?.join(', ') || 'Cost, Time'}"
  → Apply the correct stage tone and CTA type
`;

  // ============================================
  // ASSEMBLE THE COMPLETE SYSTEM PROMPT
  // ============================================
  const systemPrompt = `You are an expert email copywriter specializing in ${niche.niche_name}.
You write for ${niche.audience_segments?.join(', ') || 'professionals'} in the ${niche.sector} sector.

${masterfileSection}
${linguisticSection}
${complianceSection}
${objectionSection}
${benchmarkSection}
${seasonalSection}
${valueLadderSection}
${briefSection}
${responseProtocol}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Return ONLY valid HTML. No explanations, markdown, or code blocks.
2. Do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags.
3. Start directly with a <div> or <p> tag.
4. Use inline CSS styles only (style="...").
5. Keep email body between 150-250 words.
6. Include exactly ONE call-to-action button.
7. End with a professional signature line.
8. The email must feel personalized to THIS specific audience.
9. NEVER use forbidden words: ${forbiddenWords.join(', ') || 'none specified'}
10. Do NOT invent URLs. Only use links the user provides. If no link given, use href="#".

CORRECT OUTPUT EXAMPLE:
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p style="color: #333; font-size: 16px; line-height: 1.5;">Email content here...</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="#" style="display: inline-block; padding: 12px 28px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Call to Action</a>
  </div>
  <p style="color: #666; font-size: 14px; margin-top: 20px;">Best regards,<br>The Team</p>
</div>

Do NOT use markdown. Do NOT wrap in code blocks. Return ONLY the HTML.`;

  // ============================================
  // USER PROMPT
  // ============================================
  const userPrompt = `Generate a ${stage} email.

Campaign: ${campaignName || 'Email Campaign'}
Subject Line: ${subject}
Company: ${brainContext.companyName || 'Your Company'}
${brief ? `
AUDIENCE: ${brief.targetAudience}
GOAL: ${brief.goal}
KEY MESSAGE: "${brief.keyMessage}"
DESIRED ACTION: ${brief.desiredAction}
` : `
Write for: ${sizeProfile.decision_maker || 'decision maker'} at a ${companySize.replace(/_/g, ' ')} company
Focus on: ${sizeProfile.pain_priorities?.join(', ') || 'value and results'}
`}

Now generate the email. Return ONLY HTML.`;

  return { systemPrompt, userPrompt };
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

async function generateEmailWithBrain(user, subject, campaignName, options = {}) {
  try {
    if (!user) {
      throw new Error('User object is required');
    }

    if (!user.email) {
      throw new Error('User email is required');
    }

    console.log(`\n🧠 EmailBrain: Generating for ${user.email}`);

    const { nicheId, stage, persona, audience, brief, aiProvider } = options;

    if (brief) {
      console.log(`   📋 Brief: Goal=${brief.goal}, Audience=${brief.targetAudience}`);
    }

    // Determine niche ID
    let activeNicheId = nicheId;

    if (!activeNicheId) {
      const userData = mapUserToEmailBrainFormat(user);
      activeNicheId = userData.nicheId;
    }

  
if (!activeNicheId || !NICHE_PROFILES[activeNicheId]) {
  const result = findOrCreateNiche(NICHE_PROFILES, DEFAULT_NICHE_ID, user.industry);
  activeNicheId = result.nicheId;
} 

    const nicheProfile = NICHE_PROFILES[activeNicheId];

    if (!nicheProfile) {
      throw new Error(`Niche profile not found: ${activeNicheId}`);
    }

    console.log(`   ✅ Niche: ${nicheProfile.niche_name}`);

    const userData = {
      userId: user._id.toString(),
      companyName: audience?.companyName || user.company || user.name || 'Valued Customer',
      userRole: audience?.userRole || user.jobTitle || user.role || 'Professional',
      companySize: audience?.companySize || mapCompanySize(user.companySize) || 'small_11_50',
      industry: audience?.industry || user.industry || 'technology'
    };

    const engagementData = await buildEngagementData(user._id);

    const brainContext = {
      userId: userData.userId,
      companyName: userData.companyName,
      userRole: userData.userRole,
      companySize: userData.companySize,
      industry: userData.industry,
      nicheId: activeNicheId,
      currentStage: stage || 'consideration',
      topPersona: persona || 'the_pragmatist',
      niche: nicheProfile,
      engagementData
    };

    console.log(`   📊 Stage: ${brainContext.currentStage}, Persona: ${brainContext.topPersona}`);

    // Build prompts using the ENHANCED function
    const { systemPrompt, userPrompt } = buildAIPrompt(brainContext, subject, campaignName, brief);

    // Log prompt sizes for debugging
    console.log(`   📝 System prompt: ${systemPrompt.length} chars`);
    console.log(`   📝 User prompt: ${userPrompt.length} chars`);

    const provider = aiProvider || AI_PROVIDER;
    console.log(`   🤖 Provider: ${provider.toUpperCase()}`);

    // Generate content
    const generatedContent = await callAIModel(systemPrompt, userPrompt);

    // Clean response
    let cleanedContent = generatedContent
      .replace(/```html\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^<!--[\s\S]*?-->\s*/g, '')
      .trim();

    console.log(`   ✨ Generated: ${cleanedContent.length} chars`);

    // ✅ Track brief performance
        // ✅ Track brief performance
    if (brief) {
      const campaignResult = {
        openRate: 0.25,
        clickRate: 0.08,
        conversionRate: 0.03
      };

      BriefPerformanceTracker.trackPerformance(
        user._id.toString(),
        brief,
        campaignResult
      );

      console.log(`   📊 Brief tracked (${brief.campaignGoal || brief.goal} / ${brief.targetAudience})`);
    }
    
    
    const trackingId = `trk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const trackingPixel = `<img src="${process.env.API_URL || 'http://localhost:3001'}/api/track/open/${trackingId}" width="1" height="1" style="display:none;" />`;
const contentWithTracking = cleanedContent + trackingPixel;

    
    return {
       draft: contentWithTracking,
  trackingId: trackingId,
      metadata: {
        stage: brainContext.currentStage,
        persona: brainContext.topPersona,
        niche: brainContext.niche?.niche_name,
        provider: provider,
        briefUsed: !!brief
      },
      tracking: {
        emailId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        feedbackEndpoint: '/api/campaigns/feedback'
      }
    };
  } catch (error) {
    console.error('❌ EmailBrain error:', error.message);
    throw error;
  }
}



module.exports = {
  generateEmailWithBrain,
  mapUserToEmailBrainFormat,
  buildEngagementData,
  callAIModel
};