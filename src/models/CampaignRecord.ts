// backend/src/models/CampaignRecord.ts
import mongoose from 'mongoose';

const CampaignRecordSchema = new mongoose.Schema({
  nicheId: String,
  emailId: String,
  persona: String,
  stage: String,
  
  // What the Brain thought would happen
  predictions: {
    open_rate: Number,
    conversion_rate: Number,
    fatigue_risk: Number
  },
  
  // The content used (so we can map patterns)
  metadata: {
    subject_line: String,
    primary_trigger: String,
    cta_used: String,
    send_time: String
  },

  status: { type: String, enum: ['sent', 'processed'], default: 'sent' }
});