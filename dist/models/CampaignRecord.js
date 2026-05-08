"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/models/CampaignRecord.ts
const mongoose_1 = __importDefault(require("mongoose"));
const CampaignRecordSchema = new mongoose_1.default.Schema({
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
//# sourceMappingURL=CampaignRecord.js.map