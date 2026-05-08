// backend/src/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'arcee-ai/trinity-large-preview:free';
// ✅ FIX 1: Add TTL to conversation store (prevents memory leaks)
class ConversationStore {
    constructor(ttlMs = 3600000) {
        this.store = new Map();
        this.ttl = ttlMs;
        // Cleanup every 10 minutes
        setInterval(() => this.cleanup(), 600000);
    }
    set(id, data) {
        this.store.set(id, {
            data,
            timestamp: Date.now()
        });
    }
    get(id) {
        const entry = this.store.get(id);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > this.ttl) {
            this.store.delete(id);
            return null;
        }
        return entry.data;
    }
    cleanup() {
        const now = Date.now();
        for (const [id, entry] of this.store.entries()) {
            if (now - entry.timestamp > this.ttl) {
                this.store.delete(id);
            }
        }
    }
    delete(id) {
        return this.store.delete(id);
    }
}
const conversationStore = new ConversationStore();
// Platform information
const PLATFORM_INFO = {
    founder: "ATOH TIMONTHY",
    founded: "2024",
    mission: "Making AI-powered email marketing accessible and effective for businesses worldwide"
};
function buildSystemPrompt() {
    return `You are a helpful AI sales assistant for EmailAI Pro, an advanced email marketing platform.

PLATFORM FACTS (You CAN share):
- Founder: ${PLATFORM_INFO.founder}
- Founded: ${PLATFORM_INFO.founded}
- Mission: ${PLATFORM_INFO.mission}

FEATURES YOU CAN DESCRIBE (Value/Benefits Only):
✅ Smart Brief System: 4 simple inputs that create strategic emails
✅ Industry Intelligence: Understands 541+ different business niches
✅ Behavioral Learning: Gets smarter with every campaign sent
✅ Strategic AI: Goes beyond simple templates to understand psychology
✅ Multi-Channel Ready: Optimized for email, with more coming soon

HOW TO DESCRIBE THE TECHNOLOGY (Vague but Impressive):
- "Powered by advanced behavioral intelligence"
- "Uses proprietary learning algorithms"
- "Built on years of email marketing research"
- "Combines psychology with artificial intelligence"
- "Strategic automation that thinks like a marketer"

WHAT MAKES IT SPECIAL:
- Not just templates - actual strategic thinking
- Learns your audience's unique behavior
- Adapts to what actually works (not guesses)
- Creates emails that feel human-written but are AI-optimized

CRITICAL RULES - NEVER REVEAL:
❌ Technical architecture (Node.js, MongoDB, Express)
❌ Specific AI models used (OpenRouter, Trinity, Claude)
❌ How EmailBrain works internally (Bayesian updates, trigger ranking)
❌ Folder structure or code organization
❌ API endpoints or database schemas
❌ That you're a wrapper around another AI

IF ASKED TECHNICAL QUESTIONS:
- "Our proprietary technology handles that automatically"
- "We use advanced behavioral intelligence (the specifics are our secret sauce)"
- "That's part of our core IP - what matters is it works incredibly well!"
- "Think of it like a master chef's recipe - the magic is in how ingredients combine"

YOUR PERSONALITY:
- Enthusiastic about helping users succeed
- Confident in the platform's capabilities
- Focus on RESULTS and BENEFITS, not technical details
- Use analogies: "It's like having a marketing strategist and copywriter working 24/7"

Remember: Be helpful, be impressive, but protect the technical details!`;
}
// ✅ FIX 2: Better error handling with retry logic
async function callOpenRouterChat(message, conversationId, contextMessages = [], retries = 2) {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key not configured');
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    try {
        const systemPrompt = buildSystemPrompt();
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
                'X-Title': 'EmailAI Pro',
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...contextMessages.slice(-8), // ✅ FIX 3: Keep last 8 messages only
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 500,
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        // ✅ FIX 4: Handle rate limits
        if (response.status === 429 && retries > 0) {
            console.log('⏳ Rate limited, retrying in 2s...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            return callOpenRouterChat(message, conversationId, contextMessages, retries - 1);
        }
        const data = await response.json();
        if (!response.ok) {
            console.error('OpenRouter API Error:', JSON.stringify(data, null, 2));
            // ✅ FIX 5: Specific error messages
            if (response.status === 402) {
                throw new Error('API credits exhausted');
            }
            else if (response.status === 401) {
                throw new Error('Invalid API key');
            }
            else {
                throw new Error(data.error?.message || 'AI service error');
            }
        }
        if (!data.choices?.[0]?.message?.content) {
            throw new Error('Invalid response from AI service');
        }
        const aiResponse = data.choices[0].message.content;
        // ✅ FIX 6: Limit stored context size
        const existingContext = conversationStore.get(conversationId) || [];
        const updatedContext = [
            ...existingContext,
            { role: 'user', content: message },
            { role: 'assistant', content: aiResponse }
        ].slice(-12); // Keep last 6 exchanges (12 messages)
        conversationStore.set(conversationId, updatedContext);
        return aiResponse;
    }
    catch (error) {
        clearTimeout(timeoutId);
        // ✅ FIX 7: Retry on timeout
        if (error.name === 'AbortError' && retries > 0) {
            console.log('⏱️ Timeout, retrying...');
            return callOpenRouterChat(message, conversationId, contextMessages, retries - 1);
        }
        throw error;
    }
}
// ✅ FIX 8: Input validation
const validateChatInput = [
    body('message')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Message must be between 1 and 1000 characters')
        .escape(),
    body('conversationId')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 100 })
];
// ✅ FIX 9: Proper error status codes
router.post('/chat', validateChatInput, async (req, res) => {
    try {
        // Check validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input',
                details: errors.array()
            });
        }
        const { message, history = [], conversationId = 'default' } = req.body;
        console.log(`\n💬 AI Chat [${conversationId}]: ${message?.substring(0, 50)}...`);
        // ✅ FIX 10: Get context from store (ignore client history)
        const contextMessages = conversationStore.get(conversationId) || [];
        const reply = await callOpenRouterChat(message, conversationId, contextMessages);
        console.log(`   ✅ Reply: ${reply?.substring(0, 50)}...`);
        res.json({
            success: true,
            reply,
            conversationId
        });
    }
    catch (error) {
        console.error('❌ Chat error:', error.message);
        // ✅ FIX 11: Proper error status codes
        if (error.message.includes('API key')) {
            return res.status(503).json({
                success: false,
                error: 'Service configuration error',
                reply: 'The AI service is temporarily unavailable. Please try again later.'
            });
        }
        if (error.message.includes('credits')) {
            return res.status(503).json({
                success: false,
                error: 'Service limit reached',
                reply: 'We\'ve reached our AI processing limit. Please try again in a few minutes.'
            });
        }
        // Friendly error messages
        const errorReplies = [
            "Hmm, I hit a small snag there. Could you rephrase that?",
            "Oops! Something went wrong on my end. Try asking again?",
            "Sorry about that! I'm having a moment. Could you try once more?"
        ];
        res.status(500).json({
            success: false,
            error: error.message,
            reply: errorReplies[Math.floor(Math.random() * errorReplies.length)]
        });
    }
});
// Welcome message
router.get('/welcome', (req, res) => {
    const welcomes = [
        "👋 Hey there! I'm your EmailAI assistant. What can I help you with today?",
        "📧 Welcome! Need help with email campaigns, subject lines, or strategy?",
        "💡 Hi! I'm here to help with all things email marketing. What's on your mind?"
    ];
    res.json({
        success: true,
        welcome: welcomes[Math.floor(Math.random() * welcomes.length)]
    });
});
// ✅ FIX 12: Clear conversation endpoint
router.post('/clear/:conversationId', (req, res) => {
    const { conversationId } = req.params;
    const deleted = conversationStore.delete(conversationId);
    res.json({
        success: true,
        cleared: deleted,
        message: 'Conversation cleared'
    });
});
// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'AI Chat endpoint is ready',
        model: OPENROUTER_MODEL.replace('arcee-ai/', '').replace(':free', ''),
        conversations: conversationStore.store.size
    });
});
module.exports = router;
//# sourceMappingURL=aiRoutes.js.map