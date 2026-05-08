// backend/src/services/aiKnowledgeRouter.js


// ============================================
// IMPORTS (with error handling)
// ============================================
let BriefPerformanceTracker;
try {
  BriefPerformanceTracker = require('./briefPerformanceTracker');
} catch (error) {
  console.warn('⚠️ BriefPerformanceTracker not found, using fallback');
  BriefPerformanceTracker = {
    getAllStats: () => ({ 
      totalCampaignsTracked: 0, 
      topPerforming: [],
      totalEmailsSent: 0,
      averageOpenRate: 0 
    })
  };
}

// ============================================
// CONSTANTS - Keywords & Routes
// ============================================
const KEYWORDS = {
  PERFORMANCE: ['performance', 'stats', 'how many campaigns', 'analytics', 'results'],
  PRICING: ['price', 'cost', 'plan', 'subscription', 'pricing', 'billing', 'how much'],
  FREE: ['free', 'trial', 'free trial'],
  PROFESSIONAL: ['pro', 'professional'],
  COMPANY: ['who founded', 'who created', 'founder', 'who made', 'about'],
  FEATURES: ['feature', 'what can', 'smart brief', 'capabilities', 'what does'],
  HOW_TO: ['how do i', 'how to create', 'how to make', 'how can i'],
  SUBJECT_LINE: ['subject line', 'write an email', 'email copy', 'write email'],
  FAQ_TRIGGERS: ['first campaign', 'free trial', 'upgrade', 'downgrade', 'different'],
  CONFIDENTIAL: {
    technical: ['code', 'algorithm', 'database', 'server', 'architecture', 'tech stack', 'backend', 'api key', 'how does the ai work', 'how the ai works'],
    financial: ['revenue', 'profit', 'valuation', 'investor', 'salary', 'income', 'earnings', 'making money'],
    internal: ['employee', 'office', 'internal', 'secret', 'proprietary', 'roadmap', 'hiring']
  }
};

// ============================================
// INPUT SANITIZATION
// ============================================
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>\"'%;()&+]/g, '')  // Remove dangerous characters
    .slice(0, 500);  // Limit length to prevent abuse
}

// ============================================
// PUBLIC KNOWLEDGE (AI CAN SHARE FREELY)
// ============================================

const PUBLIC_KNOWLEDGE = {
  
  // === COMPANY INFO ===
  company: {
    name: "EmailBrain",
    founder: "ATOH TIMONTHY",
    founded: "2024",
    mission: "Making AI-powered email marketing accessible and effective for businesses worldwide",
    values: ["Innovation", "Customer Success", "Simplicity", "Results-Driven"]
  },

  // === PRICING ===
  pricing: {
    starter: {
      name: "Starter",
      price: "Free",
      features: ["500 contacts", "3 campaigns/month", "Basic templates", "Community support"]
    },
    professional: {
      name: "Professional",
      price: "$29/month",
      features: ["5,000 contacts", "Unlimited campaigns", "Smart Brief", "Behavioral learning", "7 premium templates"]
    },
    business: {
      name: "Business",
      price: "$79/month",
      features: ["25,000 contacts", "Team collaboration", "Priority AI", "API access"]
    },
    enterprise: {
      name: "Enterprise",
      price: "Custom",
      features: ["Unlimited contacts", "Custom AI models", "SLA guarantee", "24/7 support"]
    }
  },

  // === FEATURES ===
  features: {
    smartBrief: "4 simple inputs that create strategic, high-converting emails",
    industryIntelligence: "Understands 541+ different business niches",
    behavioralLearning: "Gets smarter with every campaign you send",
    templates: "7 professional templates for every occasion"
  },

  // === ROUTING ===
  routing: {
    dashboard: "/dashboard - Main hub for campaigns and analytics",
    editor: "/editor - Create and edit email campaigns",
    plans: "/plan-selection - Compare plans and upgrade",
    settings: "/settings - Manage account and preferences"
  },

  // === FAQ ===
  faq: [
    {
      q: "How do I create my first campaign?",
      a: "Click 'Create Campaign' on your dashboard, enter a campaign name and subject, fill out the Smart Brief with your goal and audience, then click 'Generate AI'."
    },
    {
      q: "Is there a free trial?",
      a: "Yes! The Starter plan is free forever. You can also try Professional features with a 14-day free trial."
    },
    {
      q: "Can I upgrade or downgrade anytime?",
      a: "Absolutely! You can change plans at any time from your account settings."
    },
    {
      q: "What makes EmailBrain different?",
      a: "Unlike basic template tools, our Strategic AI understands psychology and learns from your audience's behavior. It's like having a marketing expert working 24/7."
    }
  ],

  // === SUCCESS TIPS ===
  tips: [
    "Use specific audience descriptions in Smart Brief for better AI targeting",
    "Test different subject lines - our AI can generate variations",
    "Send during business hours for B2B, evenings for B2C",
    "Review analytics after each campaign to see what's working"
  ],

  // === EMAIL COMPLIANCE RULES ===
  emailCompliance: {
    forbiddenWords: ["Guaranteed", "Best", "Perfect"],
    preferredAlternatives: ["Proven", "Trusted", "Results-driven", "Partner", "Solution", "Platform"],
    disclaimerTriggers: ["Results", "Savings", "Returns"],
    subjectLineBestPractices: [
      "Keep subject lines under 50 characters",
      "Avoid ALL CAPS and excessive punctuation",
      "Use numbers when possible (e.g., '3 Ways to...')",
      "Personalize with the recipient's name when you can",
      "Create curiosity without being misleading"
    ]
  }
};

// ============================================
// CONFIDENTIAL GUARDS
// ============================================

const CONFIDENTIAL_GUARD = {
  guardResponses: {
    technical: "Our technology is proprietary, but what matters is it works incredibly well! You'll see the results in your email performance.",
    financial: "We're a privately held company focused on building the best email AI platform. Our pricing is designed to be accessible for businesses of all sizes.",
    internal: "We're a growing team passionate about making email marketing smarter. I'm happy to tell you all about what our platform can do for you!",
    default: "That's internal information we keep confidential, but I'm happy to tell you all about what our platform can do for you!"
  }
};

// ============================================
// FAQ MATCHING (Improved Algorithm)
// ============================================

function findBestFAQMatch(query) {
  if (!query) return null;
  
  const queryWords = new Set(
    query.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2)  // Ignore short words like "a", "an", "is"
  );
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const faq of PUBLIC_KNOWLEDGE.faq) {
    const faqWords = new Set(
      faq.q.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2)
    );
    
    // Count matching words
    const matchCount = [...queryWords].filter(w => faqWords.has(w)).length;
    
    // Calculate score based on proportion of matched words
    const score = matchCount / Math.max(faqWords.size, 1);
    
    if (score > bestScore && matchCount >= 2) {
      bestScore = score;
      bestMatch = faq;
    }
  }
  
  return bestMatch;
}

// ============================================
// CHECK CONFIDENTIAL KEYWORDS
// ============================================

function checkConfidential(lowerQuery) {
  if (!lowerQuery) return null;
  
  // Check technical keywords (CORRECTED ORDER - financial keywords are NOW under financial)
  for (const keyword of KEYWORDS.CONFIDENTIAL.technical) {
    if (lowerQuery.includes(keyword)) {
      return {
        type: 'confidential',
        response: CONFIDENTIAL_GUARD.guardResponses.technical
      };
    }
  }
  
  // Check financial keywords (CORRECTED - these ARE actual financial terms)
  for (const keyword of KEYWORDS.CONFIDENTIAL.financial) {
    if (lowerQuery.includes(keyword)) {
      return {
        type: 'confidential',
        response: CONFIDENTIAL_GUARD.guardResponses.financial
      };
    }
  }
  
  // Check internal keywords
  for (const keyword of KEYWORDS.CONFIDENTIAL.internal) {
    if (lowerQuery.includes(keyword)) {
      return {
        type: 'confidential',
        response: CONFIDENTIAL_GUARD.guardResponses.internal
      };
    }
  }
  
  return null;
}

// ============================================
// CHECK SUBJECT LINE COMPLIANCE
// ============================================

function checkSubjectLineCompliance(lowerQuery) {
  if (!lowerQuery) return null;
  
  const forbiddenWords = PUBLIC_KNOWLEDGE.emailCompliance.forbiddenWords;
  const usedForbiddenWord = forbiddenWords.find(word => 
    lowerQuery.includes(word.toLowerCase())
  );
  
  if (usedForbiddenWord) {
    const alternatives = PUBLIC_KNOWLEDGE.emailCompliance.preferredAlternatives;
    return {
      type: 'email_compliance',
      response: `I recommend avoiding "${usedForbiddenWord}" in subject lines - it can trigger spam filters and hurt your deliverability.\n\nInstead, try these high-performing alternatives:\n${alternatives.map(a => `${a}`).join('\n')}\n\nWant me to suggest a subject line using one of these? Just tell me your audience and goal!`
    };
  }
  
  return null;
}

// ============================================
// ROUTER FUNCTION (CLEAN, PRIORITIZED, FIXED)
// ============================================

function routeQuery(query) {
  // Sanitize input first
  const lowerQuery = sanitizeInput(query);
  
  if (!lowerQuery) {
    return {
      type: 'general',
      response: null
    };
  }
  
  // ============================================
  // PRIORITY 1: CONFIDENTIAL CHECKS (HIGHEST PRIORITY)
  // ============================================
  const confidentialResult = checkConfidential(lowerQuery);
  if (confidentialResult) return confidentialResult;
  
  // ============================================
  // PRIORITY 2: EMAIL COMPLIANCE CHECKS
  // ============================================
  const complianceResult = checkSubjectLineCompliance(lowerQuery);
  if (complianceResult) return complianceResult;
  
  // ============================================
  // PRIORITY 3: PERFORMANCE & STATS
  // ============================================
  if (KEYWORDS.PERFORMANCE.some(keyword => lowerQuery.includes(keyword))) {
    let stats;
    try {
      stats = BriefPerformanceTracker.getAllStats();
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        type: 'performance',
        response: "We're having trouble fetching your stats right now. Please try again in a moment, or head to your dashboard to see your latest campaign performance."
      };
    }
    
    // Validate stats object
    if (!stats || typeof stats !== 'object') {
      return {
        type: 'performance',
        response: "Your performance data is being processed. Check back soon to see insights from your campaigns!"
      };
    }
    
    // Handle zero campaigns case
    if (!stats.totalCampaignsTracked || stats.totalCampaignsTracked === 0) {
      return {
        type: 'performance',
        response: "We're just getting started! No campaigns have been tracked yet. Every campaign you send helps our behavioral learning engine get smarter. Ready to create your first campaign?"
      };
    }
    
    // Build response with safe data access
    const topGoal = stats.topPerforming && stats.topPerforming[0];
    let responseText = `EmailBrain has analyzed ${stats.totalCampaignsTracked} campaigns! `;
    
    if (topGoal && topGoal.goal) {
      const openRate = topGoal.avgOpenRate ? Math.round(topGoal.avgOpenRate * 100) : 0;
      responseText += `Our top performing goal is "${topGoal.goal}" with an average open rate of ${openRate}%.`;
    } else {
      responseText += 'The behavioral learning engine is actively optimizing your campaigns.';
    }
    
    return {
      type: 'performance',
      response: responseText
    };
  }
  
  // ============================================
  // PRIORITY 4: PRICING ROUTES
  // ============================================
  if (KEYWORDS.PRICING.some(keyword => lowerQuery.includes(keyword))) {
    // Free plan inquiry
    if (KEYWORDS.FREE.some(keyword => lowerQuery.includes(keyword))) {
      return {
        type: 'pricing',
        response: `Our Starter plan is completely free forever! It includes up to 500 contacts and 3 campaigns per month - perfect for getting started with AI-powered email marketing.`
      };
    }
    
    // Professional plan inquiry
    if (KEYWORDS.PROFESSIONAL.some(keyword => lowerQuery.includes(keyword))) {
      return {
        type: 'pricing',
        response: `The Professional plan is $29/month and includes 5,000 contacts, unlimited campaigns, our Smart Brief system, behavioral learning, and 7 premium templates. It's our most popular plan for growing businesses!`
      };
    }
    
    // General pricing overview
    return {
      type: 'pricing',
      response: `EmailBrain offers flexible plans for every business size:\n\nStarter: Free forever (500 contacts, 3 campaigns/mo)\nProfessional: $29/month (5,000 contacts, Smart Brief, behavioral learning)\nBusiness: $79/month (25,000 contacts, team features)\nEnterprise: Custom pricing (unlimited everything)\n\nWhich plan would you like to know more about?`
    };
  }
  
  // ============================================
  // PRIORITY 5: COMPANY/FOUNDER ROUTES
  // ============================================
  if (KEYWORDS.COMPANY.some(keyword => lowerQuery.includes(keyword))) {
    return {
      type: 'company',
      response: `EmailBrain was founded by ${PUBLIC_KNOWLEDGE.company.founder} in ${PUBLIC_KNOWLEDGE.company.founded}. Our mission is ${PUBLIC_KNOWLEDGE.company.mission}. We're passionate about making AI-powered email marketing accessible and effective for businesses of all sizes!`
    };
  }
  
  // ============================================
  // PRIORITY 6: FEATURE ROUTES
  // ============================================
  if (KEYWORDS.FEATURES.some(keyword => lowerQuery.includes(keyword))) {
    return {
      type: 'features',
      response: `EmailBrain's key features:\n\nSmart Brief System: ${PUBLIC_KNOWLEDGE.features.smartBrief}\nIndustry Intelligence: ${PUBLIC_KNOWLEDGE.features.industryIntelligence}\nBehavioral Learning: ${PUBLIC_KNOWLEDGE.features.behavioralLearning}\nTemplates: ${PUBLIC_KNOWLEDGE.features.templates}\n\nWhat would you like to know more about?`
    };
  }
  
  // ============================================
  // PRIORITY 7: HOW-TO ROUTES
  // ============================================
  if (KEYWORDS.HOW_TO.some(keyword => lowerQuery.includes(keyword))) {
    return {
      type: 'routing',
      response: `To create a campaign: Go to Dashboard, click 'Create Campaign', fill in campaign name and subject, complete the Smart Brief (goal, audience, message, action), then click 'Generate AI'. Your strategic email will be ready in seconds!`
    };
  }

  // ============================================
  // PRIORITY 8: SUBJECT LINE / EMAIL WRITING TIPS
  // ============================================
  if (KEYWORDS.SUBJECT_LINE.some(keyword => lowerQuery.includes(keyword))) {
    const forbiddenWords = PUBLIC_KNOWLEDGE.emailCompliance.forbiddenWords;
    const preferredWords = PUBLIC_KNOWLEDGE.emailCompliance.preferredAlternatives;
    
    return {
      type: 'email_tips',
      response: `Here are my top subject line tips:\n\n${PUBLIC_KNOWLEDGE.emailCompliance.subjectLineBestPractices.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}\n\nAvoid these words (they trigger spam filters): ${forbiddenWords.join(', ')}\nUse these instead: ${preferredWords.slice(0, 3).join(', ')}\n\nWant me to write one for your specific campaign? Tell me your audience and goal!`
    };
  }
  
  // ============================================
  // PRIORITY 9: FAQ MATCHING (IMPROVED ALGORITHM)
  // ============================================
  const bestFaq = findBestFAQMatch(lowerQuery);
  if (bestFaq) {
    return {
      type: 'faq',
      response: bestFaq.a
    };
  }
  
  // ============================================
  // DEFAULT - LET AI HANDLE
  // ============================================
  return {
    type: 'general',
    response: null
  };
}

// ============================================
// BUILD SYSTEM PROMPT (RESTRUCTURED)
// ============================================

function buildKnowledgeSystemPrompt(userContext = {}) {
  // Safely extract context with defaults
  const context = {
    industry: userContext?.industry || '',
    companySize: userContext?.companySize || 'small',
    companyName: userContext?.companyName || '',
    learningContext: userContext?.learningContext || ''
  };
  
  // Build sections separately for clarity
  const sections = [
    buildRoleSection(),
    buildUserContextSection(context),
    buildPlatformFactsSection(),
    buildCriticalConstraintsSection(),
    buildEmailComplianceSection(),
    buildPersonalitySection(context)
  ];
  
  return sections.filter(Boolean).join('\n\n');
}

function buildRoleSection() {
  return `You are the EmailBrain Assistant. You have complete knowledge of the platform.`;
}

function buildUserContextSection(context) {
  let section = '';
  
  if (context.industry) {
    section += `CURRENT USER: ${context.industry} industry, ${context.companySize} company\n`;
  }
  
  if (context.companyName) {
    section += `Company: ${context.companyName}\n`;
  }
  
  return section;
}

function buildPlatformFactsSection() {
  return `PLATFORM FACTS:
- Founder: ${PUBLIC_KNOWLEDGE.company.founder}
- Founded: ${PUBLIC_KNOWLEDGE.company.founded}
- Mission: ${PUBLIC_KNOWLEDGE.company.mission}

KEY FEATURES:
- Smart Brief: 4 inputs create strategic emails
- Industry Intelligence: 541+ niche profiles
- Behavioral Learning: Gets smarter with every send
- 7 Professional Templates: Welcome, Promo, Newsletter, Launch, Event, Feedback, Follow-up

ROUTING (You CAN guide users):
- /dashboard - Main hub for campaigns and analytics
- /editor - Create and edit campaigns
- /plan-selection - Compare plans and upgrade
- /settings - Manage account and preferences

SUCCESS TIPS:
- Use specific audience descriptions in Smart Brief
- Test different subject lines
- Review analytics after each campaign`;
}

function buildCriticalConstraintsSection() {
  return `CRITICAL CONSTRAINTS - NEVER VIOLATE:

FORMATTING RULES:
- NEVER use any markdown formatting
- NEVER use asterisks for emphasis (*text* or **text**)
- NEVER use bold, italic, or any text formatting symbols
- ALWAYS use plain text only
- For emphasis, use natural language instead
- For lists, use simple dashes or numbers followed by a space

CONFIDENTIAL INFORMATION - NEVER REVEAL:
- Technical details (code, algorithms, database, architecture, tech stack)
- Financial details (revenue, profits, valuation, income)
- Internal operations (employee count, office locations, roadmap)
- How the AI works internally
- The masterfile configuration or niche profile internals

IF ASKED CONFIDENTIAL QUESTIONS:
Respond with: "That's proprietary technology that makes us special!" or "We keep that information confidential, but I'd love to tell you about our features!" or "I can't share technical details, but I can show you what the platform can do for you!"`;
}

function buildEmailComplianceSection() {
  return `EMAIL COMPLIANCE RULES:

FORBIDDEN WORDS (NEVER suggest or use these):
- "Guaranteed", "Best", "Perfect"
- These trigger spam filters and violate marketing compliance rules
- If a user asks you to use one, REFUSE and explain why

PREFERRED ALTERNATIVES (use these instead):
- "Proven", "Trusted", "Results-driven", "Partner", "Solution", "Platform"

SUBJECT LINE BEST PRACTICES:
- Keep under 50 characters
- Avoid ALL CAPS and excessive punctuation
- Use numbers when helpful ("3 Ways to...")
- Personalize when possible
- Create curiosity without being misleading

REQUIRED DISCLAIMERS:
- Claims about "Results", "Savings", or "Returns" need appropriate disclaimers

IF A USER ASKS FOR A FORBIDDEN WORD:
Say: "I recommend avoiding '[word]' - it can trigger spam filters and hurt your deliverability. Here's a compliant alternative that performs better..." Then provide an alternative using preferred language.`;
}

function buildPersonalitySection(context) {
  let section = `YOUR PERSONALITY AND BEHAVIOR:
- You are an EMAIL MARKETING EXPERT AND EmailBrain platform specialist
- Lead with VALUE: Give strategic marketing advice first, then show how EmailBrain makes it easy
- Natural flow: "Here's what works, then here's how our platform does it for you"
- When asked for advice:
  1. Start with the marketing principle/strategy
  2. Give an actionable tip they can use right now
  3. Mention how EmailBrain handles this automatically (if relevant)
  4. Offer to guide them to the right tool

- Balance: 60% expert advice, 40% platform connection
- Never just sell - always educate first
- Keep responses warm, confident, and genuinely helpful
- Sound like a smart colleague, not a pushy salesperson
- NEVER use asterisks (*) or any markdown formatting in your responses

Remember: Be the expert they trust. The platform sells itself when the advice is good.`;

  // Add learning context if available
  if (context.learningContext) {
    section += `\n\nUSER'S CAMPAIGN PERFORMANCE:\n${context.learningContext}\n\nUse these insights to give personalized advice.`;
  }

  return section;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  PUBLIC_KNOWLEDGE,
  CONFIDENTIAL_GUARD,
  routeQuery,
  buildKnowledgeSystemPrompt
};