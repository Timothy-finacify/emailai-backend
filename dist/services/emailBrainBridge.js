// backend/src/services/emailBrainBridge.js
/**
 * EmailBrain Bridge Service - MULTI-AI VERSION
 * Supports: OpenAI, Claude, DeepSeek, Gemini, Mistral, Ollama, OpenRouter
 */
const BriefPerformanceTracker = require('./briefPerformanceTracker');
const path = require('path');
const fs = require('fs');
// Try to load the compiled EmailBrain
let generateEmailContext;
let NICHE_PROFILES;
let DEFAULT_NICHE_ID;
try {
    // Use absolute path resolution to avoid path issues
    const configPath = path.join(__dirname, '../emailbrain/config/masterConfig.generated.js');
    console.log(`📁 Attempting to load config from: ${configPath}`);
    // Check if file exists first
    if (!fs.existsSync(configPath)) {
        throw new Error(`Config file not found at: ${configPath}`);
    }
    const config = require(configPath);
    NICHE_PROFILES = config.NICHE_PROFILES;
    if (!NICHE_PROFILES) {
        throw new Error('NICHE_PROFILES is undefined in config file');
    }
    console.log('✅ EmailBrain config loaded');
    console.log(`📊 Loaded ${Object.keys(NICHE_PROFILES).length} niche profiles`);
    // Find the first available niche ID to use as default
    const availableNicheIds = Object.keys(NICHE_PROFILES);
    DEFAULT_NICHE_ID = availableNicheIds[0]; // Use first available niche as default
    console.log(`✅ Default niche ID set to: ${DEFAULT_NICHE_ID}`);
    console.log(`   Profile: ${NICHE_PROFILES[DEFAULT_NICHE_ID]?.niche_name || 'Unknown'}`);
    // Show sample of available niches for debugging
    console.log('📊 Sample of available niche IDs (first 10):');
    availableNicheIds.slice(0, 10).forEach(id => {
        console.log(`   - ${id}: ${NICHE_PROFILES[id]?.niche_name || 'Unknown'}`);
    });
    // Try to load the full EmailBrain module
    try {
        const emailBrain = require('../../dist/emailbrain/EmailBrain');
        generateEmailContext = emailBrain.generateEmailContext;
        console.log('✅ EmailBrain full module loaded');
    }
    catch (e) {
        console.log('⚠️ Using fallback generateEmailContext');
        generateEmailContext = (params) => {
            const nicheProfile = NICHE_PROFILES[params.nicheId] || NICHE_PROFILES[DEFAULT_NICHE_ID];
            return {
                userId: params.userId,
                companyName: params.companyName,
                currentStage: params.stage || 'consideration',
                topPersona: params.persona || 'the_pragmatist',
                niche: nicheProfile,
                systemPrompt: 'You are an expert email copywriter.'
            };
        };
    }
}
catch (error) {
    console.error('❌ Failed to load config:', error.message);
    console.log('⚠️ Using fallback NICHE_PROFILES');
    // Create comprehensive fallback config
    NICHE_PROFILES = {
        "DEFAULT_TECH_001": {
            niche_id: "DEFAULT_TECH_001",
            niche_name: "Technology Services",
            sector: "Technology",
            pain_points: [
                "Struggling to demonstrate clear ROI to stakeholders",
                "High customer acquisition costs eating into margins",
                "Difficulty scaling personalized outreach efficiently"
            ],
            psychological_triggers: ["ROI", "Efficiency", "Scalability"],
            communication_patterns: {
                tone: "Professional",
                language_style: "Clear",
                messaging_focus: "Efficiency",
                formality_level: "Moderate"
            },
            email_stage_framework: {
                awareness: {
                    primary_trigger: "Problem Recognition",
                    tone_adjustment: "Educational",
                    subject_line_style: "Question-based",
                    cta_type: "Learn More",
                    success_metrics: ["Opens", "Clicks"],
                    content_focus: "Industry insights",
                    email_frequency: "1x/week",
                    trigger_keywords: ["discover", "learn", "understand"]
                },
                consideration: {
                    primary_trigger: "Comparison",
                    tone_adjustment: "Consultative",
                    subject_line_style: "Benefit-focused",
                    cta_type: "Schedule Demo",
                    success_metrics: ["Clicks"],
                    content_focus: "Case studies",
                    email_frequency: "2x/week",
                    trigger_keywords: ["compare", "results"]
                },
                decision: {
                    primary_trigger: "Urgency",
                    tone_adjustment: "Direct",
                    subject_line_style: "Offer-based",
                    cta_type: "Buy Now",
                    success_metrics: ["Conversions"],
                    content_focus: "Pricing/Promos",
                    email_frequency: "3x/week",
                    trigger_keywords: ["offer", "save", "now"]
                }
            }
        }
    };
    DEFAULT_NICHE_ID = "DEFAULT_TECH_001";
    generateEmailContext = (params) => ({
        userId: params.userId,
        companyName: params.companyName,
        currentStage: 'consideration',
        topPersona: 'the_pragmatist',
        niche: NICHE_PROFILES[DEFAULT_NICHE_ID],
        systemPrompt: 'You are an expert email copywriter.'
    });
    console.log('✅ Fallback NICHE_PROFILES initialized');
}
// Safety check - ensure NICHE_PROFILES is defined
if (!NICHE_PROFILES) {
    console.error('❌ CRITICAL: NICHE_PROFILES is still undefined after initialization!');
    NICHE_PROFILES = {
        "DEFAULT_TECH_001": {
            niche_id: "DEFAULT_TECH_001",
            niche_name: "Technology Services",
            sector: "Technology"
        }
    };
    DEFAULT_NICHE_ID = "DEFAULT_TECH_001";
}
// ============================================
// AI PROVIDER CONFIGURATION
// ============================================
const AI_PROVIDER = process.env.AI_PROVIDER || 'openrouter';
// Cloud API Keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// Ollama (Local) Configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
// Model selection per provider
const MODEL_CONFIG = {
    openai: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    claude: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
    deepseek: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    gemini: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    mistral: process.env.MISTRAL_MODEL || 'mistral-small',
    ollama: process.env.OLLAMA_MODEL || 'llama3.2',
    openrouter: process.env.OPENROUTER_MODEL || 'meta-llama/llama-4-scout:free'
};
console.log(`🤖 AI Provider: ${AI_PROVIDER.toUpperCase()}`);
console.log(`📦 Model: ${MODEL_CONFIG[AI_PROVIDER] || 'default'}`);
// ============================================
// HELPER FUNCTIONS
// ============================================
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
function mapIndustryToNicheId(industry) {
    // CRITICAL: These IDs must match what's in your masterConfig.generated.js
    // Based on your logs showing available niches like FIN_BANK_MM_001
    const industryMap = {
        'finance': 'FIN_BANK_MM_001',
        'banking': 'FIN_BANK_MM_001',
        'financial': 'FIN_BANK_MM_001',
        'accounting': 'FIN_BANK_MM_001',
        'insurance': 'FIN_BANK_MM_001',
        'technology': 'FIN_BANK_MM_001', // Temporary - update this when you find tech niches
        'saas': 'FIN_BANK_MM_001', // Temporary - update this when you find saas niches
        'healthcare': 'FIN_BANK_MM_001', // Temporary - update this when you find health niches
        'ecommerce': 'FIN_BANK_MM_001', // Temporary - update this when you find ecomm niches
        'education': 'FIN_BANK_MM_001', // Temporary - update this when you find edu niches
        'realestate': 'FIN_BANK_MM_001', // Temporary - update this when you find real estate niches
        'other': DEFAULT_NICHE_ID
    };
    // Get the mapped ID or use default
    const mappedId = industryMap[industry?.toLowerCase()] || DEFAULT_NICHE_ID;
    // Verify it actually exists in NICHE_PROFILES
    if (NICHE_PROFILES && NICHE_PROFILES[mappedId]) {
        return mappedId;
    }
    // If not found, return the default
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
function buildAIPrompt(brainContext, subject, campaignName, brief = null) {
    const niche = brainContext.niche;
    const stage = brainContext.currentStage || 'awareness';
    const stageFramework = niche.email_stage_framework?.[stage] || {};
    // ✅ Build brief section if brief was provided
    let briefSection = '';
    if (brief) {
        briefSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CAMPAIGN STRATEGY (User-Specified Requirements)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIMARY GOAL: ${brief.goal || brief.campaignGoal || 'Not specified'}
TARGET AUDIENCE: ${brief.targetAudience || 'Not specified'}
KEY MESSAGE TO CONVEY: "${brief.keyMessage || 'Not specified'}"
DESIRED ACTION: ${brief.desiredAction || 'Not specified'}

⚠️ IMPORTANT: You MUST follow this strategy. The user specifically wants:
- Write for this audience: ${brief.targetAudience}
- Focus on this message: "${brief.keyMessage}"
- Drive this action: ${brief.desiredAction}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }
    const systemPrompt = `You are an expert email copywriter specializing in the ${niche.niche_name} industry.

${briefSection}

CRITICAL RULES - YOU MUST FOLLOW:
1. Return ONLY valid HTML. No explanations, no markdown, no code blocks.
2. Do NOT include "<!DOCTYPE>", "<html>", "<head>", or "<body>" tags.
3. Start directly with a <div> or <p> tag.
4. Use inline CSS styles only (style="...").
5. Keep email between 150-250 words.
6. ${brief ? `Focus on this key message: "${brief.keyMessage}"` : `Address the pain point: "${niche.pain_points?.[0] || 'customer needs'}"`}
7. Include exactly ONE call-to-action${brief ? ` that drives: "${brief.desiredAction}"` : ' button or link'}.
8. End with a professional signature.

INCORRECT RESPONSE EXAMPLE (DO NOT DO THIS):
\`\`\`html
<div>Content</div>
\`\`\`

CORRECT RESPONSE EXAMPLE:
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <p>Email content here...</p>
  <a href="#" style="...">Click Here</a>
</div>`;
    const userPrompt = `Campaign: ${campaignName || 'Email Campaign'}
Subject: ${subject}
Company: ${brainContext.companyName || 'Your Company'}
Industry: ${niche.sector}
Stage: ${stage}
${brief ? `
TARGET AUDIENCE: ${brief.targetAudience}
KEY MESSAGE: "${brief.keyMessage}"
DESIRED ACTION: ${brief.desiredAction}
` : ''}

Write a professional email body that addresses: ${brief ? `"${brief.keyMessage}"` : `"${niche.pain_points?.[0] || 'customer needs'}"`}.

Remember: Return ONLY the HTML body content. No explanations. No markdown formatting.`;
    return { systemPrompt, userPrompt };
}
// ============================================
// AI PROVIDER ROUTER
// ============================================
async function callAIModel(systemPrompt, userPrompt) {
    const provider = AI_PROVIDER.toLowerCase();
    switch (provider) {
        case 'openai':
            return await callOpenAI(systemPrompt, userPrompt);
        case 'claude':
        case 'anthropic':
            return await callClaude(systemPrompt, userPrompt);
        case 'deepseek':
            return await callDeepSeek(systemPrompt, userPrompt);
        case 'gemini':
        case 'google':
            return await callGemini(systemPrompt, userPrompt);
        case 'mistral':
            return await callMistral(systemPrompt, userPrompt);
        case 'ollama':
        case 'local':
            return await callOllama(systemPrompt, userPrompt);
        case 'openrouter':
            return await callOpenRouter(systemPrompt, userPrompt);
        default:
            throw new Error(`Unknown AI provider: ${provider}. Supported: openai, claude, deepseek, gemini, mistral, ollama, openrouter`);
    }
}
// ============================================
// OPENAI
// ============================================
async function callOpenAI(systemPrompt, userPrompt) {
    if (!OPENAI_API_KEY)
        throw new Error('OpenAI API key not configured');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: MODEL_CONFIG.openai,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
        })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`OpenAI error: ${data.error?.message || 'Unknown error'}`);
    }
    return data.choices[0].message.content;
}
// ============================================
// CLAUDE (ANTHROPIC)
// ============================================
async function callClaude(systemPrompt, userPrompt) {
    if (!CLAUDE_API_KEY)
        throw new Error('Claude API key not configured');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: MODEL_CONFIG.claude,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
            max_tokens: 1000,
            temperature: 0.7
        })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Claude error: ${data.error?.message || 'Unknown error'}`);
    }
    return data.content[0].text;
}
// ============================================
// DEEPSEEK
// ============================================
async function callDeepSeek(systemPrompt, userPrompt) {
    if (!DEEPSEEK_API_KEY)
        throw new Error('DeepSeek API key not configured');
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: MODEL_CONFIG.deepseek,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
        })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`DeepSeek error: ${data.error?.message || 'Unknown error'}`);
    }
    return data.choices[0].message.content;
}
// ============================================
// GEMINI (GOOGLE)
// ============================================
async function callGemini(systemPrompt, userPrompt) {
    if (!GEMINI_API_KEY)
        throw new Error('Gemini API key not configured');
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const modelName = MODEL_CONFIG.gemini;
    console.log(`   📦 Using Gemini model: ${modelName}`);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                    parts: [{ text: combinedPrompt }]
                }]
        })
    });
    const data = await response.json();
    if (!response.ok) {
        console.error('Gemini API Error:', JSON.stringify(data, null, 2));
        throw new Error(`Gemini error: ${data.error?.message || 'Unknown error'}`);
    }
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    }
    throw new Error('Gemini returned no content');
}
// ============================================
// MISTRAL AI
// ============================================
async function callMistral(systemPrompt, userPrompt) {
    if (!MISTRAL_API_KEY)
        throw new Error('Mistral API key not configured');
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
            model: MODEL_CONFIG.mistral,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
        })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Mistral error: ${data.error?.message || 'Unknown error'}`);
    }
    return data.choices[0].message.content;
}
// ============================================
// OPENROUTER - FREE MODELS GATEWAY
// ============================================
async function callOpenRouter(systemPrompt, userPrompt) {
    if (!OPENROUTER_API_KEY)
        throw new Error('OpenRouter API key not configured');
    console.log(`   📦 Using OpenRouter model: ${MODEL_CONFIG.openrouter}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
                'X-Title': 'EmailAI Pro'
            },
            body: JSON.stringify({
                model: MODEL_CONFIG.openrouter,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 1200,
                top_p: 0.9,
                frequency_penalty: 0.1,
                presence_penalty: 0.1,
                stream: false
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (!response.ok) {
            console.error('OpenRouter API Error:', JSON.stringify(data, null, 2));
            if (data.error?.code === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.');
            }
            else if (data.error?.code === 408) {
                throw new Error('Request timeout. Try again with a shorter prompt.');
            }
            else {
                throw new Error(`OpenRouter error: ${data.error?.message || 'Unknown error'}`);
            }
        }
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Unexpected OpenRouter response:', JSON.stringify(data, null, 2));
            throw new Error('OpenRouter returned unexpected response structure');
        }
        const content = data.choices[0].message.content;
        if (!content || content.trim().length === 0) {
            throw new Error('OpenRouter returned empty content');
        }
        console.log(`   ✅ Received ${content.length} characters`);
        return content;
    }
    catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('OpenRouter request timed out after 60 seconds. Try a different model.');
        }
        if (error.message.includes('fetch')) {
            throw new Error('Network error: Unable to reach OpenRouter. Check your internet connection.');
        }
        throw error;
    }
}
// ============================================
// OLLAMA (LOCAL - FREE & PRIVATE)
// ============================================
async function callOllama(systemPrompt, userPrompt) {
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    try {
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL_CONFIG.ollama,
                prompt: combinedPrompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 1000
                }
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Ollama error: ${data.error || 'Unknown error'}`);
        }
        return data.response;
    }
    catch (error) {
        if (error.message.includes('ECONNREFUSED')) {
            throw new Error(`Ollama not running. Start with: ollama serve\nThen pull model: ollama pull ${MODEL_CONFIG.ollama}`);
        }
        throw error;
    }
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
        console.log(`\n🧠 EmailBrain: Processing for ${user.email}`);
        // ✅ Extract brief from options
        const { nicheId, stage, persona, audience, brief } = options;
        // Log brief if provided
        if (brief) {
            console.log(`   📋 Brief received: Goal=${brief.campaignGoal || brief.goal}, Audience=${brief.targetAudience}`);
        }
        // Use provided nicheId, mapped from user, or fallback to default
        let activeNicheId = nicheId;
        if (!activeNicheId) {
            const userData = mapUserToEmailBrainFormat(user);
            activeNicheId = userData.nicheId;
        }
        // Final fallback to default
        if (!activeNicheId || !NICHE_PROFILES[activeNicheId]) {
            console.log(`   ⚠️ Niche ${activeNicheId} not found, using default: ${DEFAULT_NICHE_ID}`);
            activeNicheId = DEFAULT_NICHE_ID;
        }
        console.log(`   📊 Using niche: ${activeNicheId}`);
        if (!NICHE_PROFILES) {
            throw new Error('NICHE_PROFILES is not initialized');
        }
        const nicheProfile = NICHE_PROFILES[activeNicheId];
        if (!nicheProfile) {
            console.error(`❌ Niche profile not found for: ${activeNicheId}`);
            throw new Error(`Niche profile not found for: ${activeNicheId}`);
        }
        console.log(`   ✅ Found profile: ${nicheProfile.niche_name || 'Unknown'}`);
        const userData = {
            userId: user._id.toString(),
            companyName: audience?.companyName || user.company || user.name || 'Valued Customer',
            userRole: audience?.userRole || user.jobTitle || user.role || 'Professional',
            companySize: audience?.companySize || user.companySize || 'mid_market_51_500',
            industry: audience?.industry || user.industry || 'finance'
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
        console.log(`   ✅ Stage: ${brainContext.currentStage}, Persona: ${brainContext.topPersona}`);
        // ✅ PASS BRIEF to buildAIPrompt
        const { systemPrompt, userPrompt } = buildAIPrompt(brainContext, subject, campaignName, brief);
        const provider = options.aiProvider || AI_PROVIDER;
        console.log(`   🤖 Calling ${provider.toUpperCase()} (${MODEL_CONFIG[provider] || 'default'})...`);
        const generatedContent = await callAIModel(systemPrompt, userPrompt);
        let cleanedContent = generatedContent;
        cleanedContent = cleanedContent.replace(/```html\s*/gi, '');
        cleanedContent = cleanedContent.replace(/```\s*/g, '');
        cleanedContent = cleanedContent.trim();
        cleanedContent = cleanedContent.replace(/^<!--[\s\S]*?-->\s*/g, '');
        console.log(`   ✨ Email generated (${cleanedContent.length} chars)`);
        // In generateEmailWithBrain function, before return:
        if (brief) {
            // Track that this brief was used (performance tracked later when campaign results come in)
            console.log(`   📊 Brief tracked for future learning`);
        }
        return {
            draft: cleanedContent,
            metadata: {
                stage: brainContext.currentStage,
                persona: brainContext.topPersona,
                niche: brainContext.niche?.niche_name,
                provider: provider,
                model: MODEL_CONFIG[provider] || 'default',
                briefUsed: !!brief // ✅ Indicate if brief was used
            },
            tracking: {
                emailId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                feedbackEndpoint: '/api/campaigns/feedback'
            }
        };
    }
    catch (error) {
        console.error('❌ EmailBrain error:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    }
}
// ============================================
// EXPORTS
// ============================================
module.exports = {
    generateEmailWithBrain,
    mapUserToEmailBrainFormat,
    buildEngagementData
};
//# sourceMappingURL=emailBrainBridge.js.map