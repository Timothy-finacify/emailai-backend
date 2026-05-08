// backend/src/services/emailBrainBridge.js
/**
 * EmailBrain Bridge Service
 * Connects Express backend (JavaScript) with EmailBrain module (TypeScript)
 *
 * This service handles:
 * 1. Converting User model to EmailBrain expected format
 * 2. Building engagement data from user history
 * 3. Calling the AI model with EmailBrain context
 */
// Import the compiled TypeScript EmailBrain
// After running tsc, it will be in dist/emailbrain/
const { generateEmailContext } = require('../../dist/emailbrain/EmailBrain');
const { NICHE_PROFILES } = require('../../dist/emailbrain/config/masterConfig');
// AI Provider configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // 'openai', 'claude', 'deepseek'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
/**
 * Map user from database to EmailBrain expected format
 */
function mapUserToEmailBrainFormat(user) {
    // Determine niche ID based on user's industry
    const nicheId = mapIndustryToNicheId(user.industry);
    // Map company size to EmailBrain format
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
/**
 * Map user's industry to appropriate niche ID
 */
function mapIndustryToNicheId(industry) {
    const industryMap = {
        'finance': 'FIN_001',
        'technology': 'SAAS_B2B_01',
        'healthcare': 'HLTH_FIT_01',
        'ecommerce': 'ECOMM_FASHION_01',
        'education': 'EDU_ONLINE_01',
        'realestate': 'RE_RES_01',
        'other': 'SAAS_B2B_01' // Default to B2B SaaS
    };
    return industryMap[industry] || 'SAAS_B2B_01';
}
/**
 * Map company size string to EmailBrain format
 */
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
/**
 * Build engagement data from user's activity history
 * This would come from your email tracking/analytics database
 */
async function buildEngagementData(userId) {
    // TODO: Replace with actual database queries
    // For now, return sensible defaults based on user's stage
    // You can fetch from:
    // - Email open tracking table
    // - Click tracking table
    // - Campaign history
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
/**
 * Build the AI prompt using EmailBrain context
 */
function buildAIPrompt(brainContext, subject, campaignName) {
    const niche = brainContext.niche;
    const stage = brainContext.currentStage;
    const stageFramework = niche.email_stage_framework[stage];
    const systemPrompt = `
You are an expert email copywriter specializing in the ${niche.niche_name} industry.

CONTEXT:
- Company: ${brainContext.companyName}
- Industry: ${niche.sector}
- Campaign Stage: ${stage}
- Buyer Persona: ${brainContext.topPersona}

PSYCHOLOGICAL FRAMEWORK:
- Primary Trigger: ${brainContext.rankedTriggers[0]?.trigger || 'Trust'}
- Pain Point: ${niche.pain_points[0]}
- Communication Tone: ${niche.communication_patterns.tone}
- Formality: ${niche.communication_patterns.formality_level}

CONTENT REQUIREMENTS:
- Stage Focus: ${stageFramework.content_focus}
- CTA Type: ${stageFramework.cta_type}
- Subject Line Style: ${stageFramework.subject_line_style}

RULES:
1. Write in a ${niche.communication_patterns.tone} tone
2. Address the pain point: "${niche.pain_points[0]}"
3. Use language style: ${niche.communication_patterns.language_style}
4. End with a clear CTA matching: ${stageFramework.cta_type}
5. Keep email between 150-250 words
6. Return valid HTML with inline styling

FORMAT:
Return ONLY the email body HTML. Do not include the subject line.
`;
    const userPrompt = `
Campaign: ${campaignName || 'Email Campaign'}
Subject: ${subject}

Write a compelling email that converts for the ${stage} stage.

The email should:
- Hook the reader in the first sentence
- Address their specific pain point about ${niche.pain_points[0]}
- Present the solution naturally
- End with a single, clear CTA

Return HTML format with proper email-friendly styling.
`;
    return { systemPrompt, userPrompt };
}
/**
 * Call AI model based on configured provider
 */
async function callAIModel(systemPrompt, userPrompt) {
    const provider = AI_PROVIDER.toLowerCase();
    switch (provider) {
        case 'openai':
            return await callOpenAI(systemPrompt, userPrompt);
        case 'claude':
            return await callClaude(systemPrompt, userPrompt);
        case 'deepseek':
            return await callDeepSeek(systemPrompt, userPrompt);
        default:
            throw new Error(`Unknown AI provider: ${provider}`);
    }
}
/**
 * Call OpenAI API
 */
async function callOpenAI(systemPrompt, userPrompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1500
        })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`OpenAI error: ${data.error?.message || 'Unknown error'}`);
    }
    return data.choices[0].message.content;
}
/**
 * Call Anthropic Claude API
 */
async function callClaude(systemPrompt, userPrompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 1500,
            temperature: 0.7
        })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Claude error: ${data.error?.message || 'Unknown error'}`);
    }
    return data.content[0].text;
}
/**
 * Call DeepSeek API
 */
async function callDeepSeek(systemPrompt, userPrompt) {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1500
        })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`DeepSeek error: ${data.error?.message || 'Unknown error'}`);
    }
    return data.choices[0].message.content;
}
/**
 * Apply compliance filters based on niche rules
 */
function applyComplianceFilters(content, nicheId) {
    const niche = NICHE_PROFILES[nicheId];
    if (!niche || !niche.linguistic_mandates) {
        return content;
    }
    let filteredContent = content;
    const forbiddenWords = niche.linguistic_mandates.forbidden_absolute_words || [];
    // Add compliance disclaimer if needed
    if (niche.compliance_scan_rules && niche.compliance_scan_rules.length > 0) {
        const disclaimer = `\n\n<!-- Compliance: ${niche.compliance_scan_rules.join(', ')} -->`;
        filteredContent += disclaimer;
    }
    return filteredContent;
}
/**
 * Main function: Generate email using EmailBrain
 */
async function generateEmailWithBrain(user, subject, campaignName) {
    try {
        console.log(`\n🧠 EmailBrain: Processing for user ${user.email}`);
        // Step 1: Map user data to EmailBrain format
        const userData = mapUserToEmailBrainFormat(user);
        // Step 2: Build engagement data
        const engagementData = await buildEngagementData(user._id);
        // Step 3: Run EmailBrain reasoning engine
        console.log(`   📊 Generating context for niche: ${userData.nicheId}`);
        const brainContext = generateEmailContext({
            userId: userData.userId,
            companyName: userData.companyName,
            userRole: userData.userRole,
            companySize: userData.companySize,
            industry: userData.industry,
            nicheId: userData.nicheId,
            engagementData
        });
        console.log(`   ✅ Context generated - Stage: ${brainContext.currentStage}, Persona: ${brainContext.topPersona}`);
        // Step 4: Build AI prompts
        const { systemPrompt, userPrompt } = buildAIPrompt(brainContext, subject, campaignName);
        // Step 5: Call AI model
        console.log(`   🤖 Calling ${AI_PROVIDER} for generation...`);
        const generatedContent = await callAIModel(systemPrompt, userPrompt);
        // Step 6: Apply compliance filters
        const finalContent = applyComplianceFilters(generatedContent, userData.nicheId);
        console.log(`   ✨ Email generated successfully`);
        return {
            success: true,
            draft: finalContent,
            metadata: {
                stage: brainContext.currentStage,
                persona: brainContext.topPersona,
                niche: brainContext.niche?.niche_name
            }
        };
    }
    catch (error) {
        console.error('❌ EmailBrain generation error:', error.message);
        throw error;
    }
}
module.exports = {
    generateEmailWithBrain,
    mapUserToEmailBrainFormat,
    buildEngagementData
};
//# sourceMappingURL=emailBrainBridge.js.map