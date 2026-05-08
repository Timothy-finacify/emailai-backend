// backend/src/routes/aiRoutes.js - COMPLETE WORKING VERSION
const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

// ✅ Import your AI Brain
const { routeQuery, buildKnowledgeSystemPrompt } = require('../services/aiKnowledgeRouter');

const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

console.log('\n🤖 Initializing EmailBrain Brain...');
console.log(`   Model: ${model}`);
console.log(`   Intelligence: EmailBrain + Platform Knowledge + Confidential Guards`);

const groq = new Groq({ apiKey: apiKey });

// Store conversation context
const conversationStore = new Map();

// ✅ UNIVERSAL HANDLER - Works with BOTH GET and POST
async function handleChatMessage(message, conversationId, userContext, res) {
  console.log(`\n🧠 EmailAI Brain Processing: "${message.substring(0, 50)}..."`);

  try {
    // Route through your knowledge router
    const routed = routeQuery(message);
    console.log(`   📍 Routed to: ${routed.type}`);
    
    // Check for direct knowledge response
    if (routed.response && (
      routed.type === 'pricing' || 
      routed.type === 'faq' || 
      routed.type === 'company' || 
      routed.type === 'confidential' || 
      routed.type === 'email_compliance' || 
      routed.type === 'email_tips' ||
      routed.type === 'performance'
    )) {
      console.log(`   ✅ Direct knowledge response`);
      return res.json({ 
        success: true, 
        reply: routed.response,
        source: 'emailbrain_knowledge'
      });
    }
    
    // Get conversation context
    const contextMessages = conversationStore.get(conversationId) || [];
    
    const startTime = Date.now();
    
    // Call Groq
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are EmailBrain AI assistant, expert in email marketing." },
        ...contextMessages.slice(-10),
        { role: "user", content: message }
      ],
      model: model,
      temperature: 0.7,
      max_tokens: 500,
    });

    const elapsed = Date.now() - startTime;
    const reply = completion.choices[0]?.message?.content || "";

    // Store conversation
    const updatedContext = [
      ...contextMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: reply }
    ];
    conversationStore.set(conversationId, updatedContext);

    console.log(`   ✅ Response in ${elapsed}ms`);
    
    res.json({ 
      success: true, 
      reply: reply, 
      latency_ms: elapsed,
      source: 'groq_with_emailbrain'
    });

  } catch (error) {
    console.error('❌ Groq Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      reply: "I'm having a moment. Could you try asking that again?"
    });
  }
}

// ✅ POST handler (for standard API calls)
router.post('/chat', express.json(), async (req, res) => {
  const { message, conversationId = 'default' } = req.body;
  
  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }
  
  await handleChatMessage(message, conversationId, req.user, res);
});

// ✅ GET handler (for frontend browser calls) - THIS FIXES THE 405 ERROR
router.get('/chat', async (req, res) => {
  console.log('📨 GET /api/ai/chat called - converting to POST');
  const message = req.query.message;
  const conversationId = req.query.conversationId || 'default';
  
  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }
  
  await handleChatMessage(message, conversationId, req.user, res);
});

// Welcome endpoint
router.get('/welcome', (req, res) => {
  const welcomes = [
    "👋 Hey there! I'm your EmailBrain assistant. What can I help you with today?",
    "📧 Welcome! Need help with campaigns, pricing, or strategy?",
    "💡 Hi! I'm here to help with all things EmailBrain. What's on your mind?"
  ];
  
  res.json({
    success: true,
    welcome: welcomes[Math.floor(Math.random() * welcomes.length)]
  });
});

// Clear conversation
router.post('/clear/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  conversationStore.delete(conversationId);
  res.json({ success: true, message: 'Conversation cleared' });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'ok',
    provider: 'Groq',
    model: model,
    intelligence: 'EmailBrain + Platform Knowledge',
    context_window: 131072
  });
});

module.exports = router;