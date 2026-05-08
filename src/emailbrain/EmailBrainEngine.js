// backend/api/email/generate.js

import { EmailBrainEngine } from './emailbrain/EmailBrainEngine.js';

export async function handleGenerateEmail(req, res) {
  const { subject, campaignName, templateName } = req.body;
  const user = req.user; // From your existing auth system
  
  try {
    // Step 1: Run EmailBrain silently using user's profile data
    const brainContext = await EmailBrainEngine.process({
      userId: user.id,
      nicheId: user.nicheId,           // From user profile
      companyName: user.companyName,   // From user profile
      companySize: user.companySize,   // From user profile
      industry: user.industry,         // From user profile
      userInput: subject               // The subject line
    });
    
    // Step 2: Build enriched prompt
    const enrichedPrompt = `
Campaign: ${campaignName || 'Email Campaign'}
Subject: ${subject}
Template: ${templateName || 'Standard'}

Write a professional email with the subject line above.
${brainContext.systemPrompt}
`;
    
    // Step 3: Call AI model
    const aiResponse = await callAIModel(enrichedPrompt);
    
    // Step 4: Return only the email content
    res.json({
      success: true,
      draft: aiResponse.content
    });
    
  } catch (error) {
    console.error('Email generation failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate email' 
    });
  }
}