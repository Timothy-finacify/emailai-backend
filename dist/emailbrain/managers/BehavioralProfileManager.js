"use strict";
/**
 * BehavioralProfile Manager
 * Processes campaign feedback and updates learned behaviors
 * Location: backend/src/emailbrain/managers/BehavioralProfileManager.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BehavioralProfileManager = void 0;
class BehavioralProfileManager {
    /**
     * Process feedback from a sent campaign and update profile
     */
    static async processCampaignFeedback(feedback, currentProfile) {
        const updated = { ...currentProfile };
        // Step 1: Update trigger performance
        updated.learned_triggers = this.updateLearnedTriggers(updated.learned_triggers, feedback);
        // Step 2: Update subject line patterns
        updated.learned_subject_patterns = this.updateSubjectPatterns(updated.learned_subject_patterns, feedback);
        // Step 3: Update send time performance
        updated.learned_send_times = this.updateSendTimes(updated.learned_send_times, feedback);
        // Step 4: Update CTA performance
        updated.learned_cta_performance = this.updateCTAPerformance(updated.learned_cta_performance, feedback);
        // Step 5: Track engagement decay
        updated.engagement_decay_curves = this.updateEngagementDecay(updated.engagement_decay_curves, feedback);
        // Step 6: Update persona micro-adjustments
        updated.persona_overrides = this.updatePersonaOverrides(updated.persona_overrides, feedback);
        // Step 7: Track real objections
        if (feedback.objections_mentioned) {
            updated.real_objections = this.trackObjections(updated.real_objections, feedback);
        }
        // Step 8: Analyze trends
        updated.trends = this.analyzeTrends(updated);
        // Step 9: Update metadata
        updated.data_quality = this.updateDataQuality(updated.data_quality, feedback);
        return updated;
    }
    /**
     * Update learned triggers based on campaign results
     */
    static updateLearnedTriggers(triggers, feedback) {
        const triggerUsed = feedback.primary_trigger_used;
        // Calculate success metrics
        const emailWasSuccess = feedback.actual_open_rate > 0.2 && feedback.actual_click_rate > 0.05;
        // Find or create trigger entry
        let trigger = triggers.find(t => t.trigger === triggerUsed);
        if (!trigger) {
            trigger = {
                trigger: triggerUsed,
                confidence: 0,
                sampleSize: 0,
                successRate: 0,
                avgEngagementLift: 0,
                last_updated: new Date()
            };
            triggers.push(trigger);
        }
        // Bayesian update: adjust confidence based on result
        const newSampleSize = trigger.sampleSize + 1;
        const oldSuccessCount = trigger.successRate * trigger.sampleSize;
        const newSuccessCount = oldSuccessCount + (emailWasSuccess ? 1 : 0);
        const newSuccessRate = newSuccessCount / newSampleSize;
        // Calculate engagement lift (vs. average)
        const avgOpenRate = 0.22; // Industry baseline for emails
        const engagementLift = feedback.actual_open_rate > avgOpenRate ? feedback.actual_open_rate - avgOpenRate : 0;
        // Update confidence (higher sample size = higher confidence)
        const newConfidence = Math.min(newSampleSize / 30, 1); // Max out at 30 samples
        trigger.successRate = newSuccessRate;
        trigger.sampleSize = newSampleSize;
        trigger.confidence = newConfidence;
        trigger.avgEngagementLift =
            (trigger.avgEngagementLift * (newSampleSize - 1) + engagementLift) /
                newSampleSize;
        trigger.last_updated = new Date();
        return triggers;
    }
    /**
     * Update subject line patterns
     */
    static updateSubjectPatterns(patterns, feedback) {
        const subjectPattern = this.extractSubjectPattern(feedback.subject_line);
        let pattern = patterns.find(p => p.pattern === subjectPattern);
        if (!pattern) {
            pattern = {
                pattern: subjectPattern,
                openRate: 0,
                clickRate: 0,
                sampleSize: 0,
                variation_examples: [],
                last_tested: new Date()
            };
            patterns.push(pattern);
        }
        // Update moving average
        const n = pattern.sampleSize + 1;
        pattern.openRate =
            (pattern.openRate * (n - 1) + feedback.actual_open_rate) / n;
        pattern.clickRate =
            (pattern.clickRate * (n - 1) + feedback.actual_click_rate) / n;
        pattern.sampleSize = n;
        // Track example variations
        if (pattern.variation_examples.length < 5) {
            pattern.variation_examples.push(feedback.subject_line);
        }
        pattern.last_tested = new Date();
        return patterns;
    }
    /**
     * Update send time optimization
     */
    static updateSendTimes(sendTimes, feedback) {
        const timeSlot = feedback.send_time;
        let timeData = sendTimes.find(t => t.time === timeSlot);
        if (!timeData) {
            timeData = {
                time: timeSlot,
                avgOpenRate: 0,
                avgClickRate: 0,
                sampleSize: 0,
                by_persona: {}
            };
            sendTimes.push(timeData);
        }
        // Update rolling average
        const n = timeData.sampleSize + 1;
        timeData.avgOpenRate =
            (timeData.avgOpenRate * (n - 1) + feedback.actual_open_rate) / n;
        timeData.avgClickRate =
            (timeData.avgClickRate * (n - 1) + feedback.actual_click_rate) / n;
        timeData.sampleSize = n;
        // Track by persona
        if (!timeData.by_persona[feedback.persona]) {
            timeData.by_persona[feedback.persona] = feedback.actual_open_rate;
        }
        else {
            const personaN = (Object.keys(timeData.by_persona).length + 1) || 1;
            timeData.by_persona[feedback.persona] =
                (timeData.by_persona[feedback.persona] * (personaN - 1) +
                    feedback.actual_open_rate) /
                    personaN;
        }
        return sendTimes;
    }
    /**
     * Update CTA performance tracking
     */
    static updateCTAPerformance(ctaPerfs, feedback) {
        const ctaUsed = feedback.cta_used;
        let cta = ctaPerfs.find(c => c.cta === ctaUsed &&
            c.stage === feedback.stage &&
            c.persona === feedback.persona);
        if (!cta) {
            cta = {
                cta: ctaUsed,
                conversionRate: 0,
                clickRate: 0,
                stage: feedback.stage,
                persona: feedback.persona,
                sampleSize: 0,
                sentiment: feedback.cta_type,
                urgency_level: "medium"
            };
            ctaPerfs.push(cta);
        }
        // Update performance
        const n = cta.sampleSize + 1;
        cta.conversionRate =
            (cta.conversionRate * (n - 1) + feedback.actual_conversion_rate) / n;
        cta.clickRate =
            (cta.clickRate * (n - 1) + feedback.actual_click_rate) / n;
        cta.sampleSize = n;
        return ctaPerfs;
    }
    /**
     * Track engagement decay over sequence
     */
    static updateEngagementDecay(decayData, feedback) {
        // This would track position in sequence vs. actual engagement
        // Simplified version shown
        return decayData;
    }
    /**
     * Update persona micro-adjustments
     */
    static updatePersonaOverrides(overrides, feedback) {
        if (!overrides[feedback.persona]) {
            overrides[feedback.persona] = {
                personaType: feedback.persona,
                actual_best_trigger: feedback.primary_trigger_used,
                trigger_override_confidence: 0.3,
                actual_best_cta: feedback.cta_used,
                cta_override_confidence: 0.3,
                sensitivity_to_urgency: 0.5,
                sensitivity_to_social_proof: 0.5,
                sensitivity_to_scarcity: 0.5,
                sensitivity_to_exclusivity: 0.5,
                sensitivity_to_price_anchoring: 0.5,
                prefers_short_copy: false,
                prefers_lots_of_links: false,
                prefers_narrative: false,
                prefers_data_visualization: false,
                best_send_day: feedback.send_day,
                best_send_time: feedback.send_time,
                last_updated: new Date(),
                sample_size: 1
            };
        }
        else {
            const override = overrides[feedback.persona];
            // Update best trigger if this one performed better
            if (feedback.actual_open_rate > 0.25) {
                override.actual_best_trigger = feedback.primary_trigger_used;
                override.trigger_override_confidence = Math.min(override.trigger_override_confidence + 0.1, 1);
            }
            // Update best CTA if this one converted
            if (feedback.actual_conversion_rate > 0.05) {
                override.actual_best_cta = feedback.cta_used;
                override.cta_override_confidence = Math.min(override.cta_override_confidence + 0.1, 1);
            }
            override.sample_size += 1;
            override.last_updated = new Date();
        }
        return overrides;
    }
    /**
     * Track objections mentioned in replies
     */
    static trackObjections(objections, feedback) {
        if (!feedback.objections_mentioned)
            return objections;
        feedback.objections_mentioned.forEach(objectionText => {
            let objection = objections.find(o => o.objection_statement === objectionText);
            if (!objection) {
                objection = {
                    objection_statement: objectionText,
                    frequency: 0,
                    source: "email_reply",
                    tested_reframes: [],
                    best_response_cta: ""
                };
                objections.push(objection);
            }
            objection.frequency += 1;
        });
        return objections;
    }
    /**
     * Analyze trends
     */
    static analyzeTrends(profile) {
        return {
            triggers_improving: profile.learned_triggers
                .filter(t => t.confidence > 0.6)
                .sort((a, b) => b.successRate - a.successRate)
                .slice(0, 5),
            triggers_declining: profile.learned_triggers
                .filter(t => t.confidence > 0.4 && t.successRate < 0.3)
                .sort((a, b) => a.successRate - b.successRate)
                .slice(0, 5),
            ctas_gaining_strength: profile.learned_cta_performance
                .filter(c => c.sampleSize > 5)
                .sort((a, b) => b.conversionRate - a.conversionRate)
                .slice(0, 5),
            ctas_losing_effectiveness: profile.learned_cta_performance
                .filter(c => c.sampleSize > 5 && c.conversionRate < 0.03)
                .sort((a, b) => a.conversionRate - b.conversionRate)
                .slice(0, 5)
        };
    }
    /**
     * Update data quality score
     */
    static updateDataQuality(quality, feedback) {
        quality.total_campaigns_tracked += 1;
        quality.total_emails_sent += feedback.sent_to;
        quality.total_opens += feedback.opens;
        quality.total_clicks += feedback.clicks;
        quality.total_conversions += feedback.conversions;
        quality.last_updated = new Date();
        // Calculate confidence level based on sample size
        if (quality.total_campaigns_tracked < 10) {
            quality.confidence_level = "low";
        }
        else if (quality.total_campaigns_tracked < 50) {
            quality.confidence_level = "medium";
        }
        else if (quality.total_campaigns_tracked < 200) {
            quality.confidence_level = "high";
        }
        else {
            quality.confidence_level = "very_high";
        }
        return quality;
    }
    /**
     * Helper: Extract pattern from subject line
     * Examples: "Question + Benefit", "Number + Urgency", "Personalization + FOMO"
     */
    static extractSubjectPattern(subject) {
        const patterns = {
            "Question": /\?/,
            "Number": /\d+/,
            "Urgency": /urgent|now|today|today only|limited|only \d+/i,
            "FOMO": /before|missing out|almost|gone|last chance/i,
            "Curiosity": /discover|uncover|secret|hidden|revealed|shocking/i,
            "Personalization": /you|your|me|my|[A-Z][a-z]+/,
            "Benefit": /save|free|make|increase|boost|gain|grow|profit/i,
            "Action": /don't miss|act now|secure|grab|claim|get/i
        };
        const found = Object.keys(patterns)
            .filter(p => patterns[p].test(subject))
            .slice(0, 2)
            .join(" + ");
        return found || "Generic";
    }
    /**
     * Get best performer in category
     */
    static getBestPerformer(items, metric = "successRate") {
        return items.sort((a, b) => {
            const scoreA = a[metric] || 0;
            const scoreB = b[metric] || 0;
            return scoreB - scoreA;
        })[0];
    }
    /**
     * Get confidence-weighted recommendation
     */
    static getConfidenceWeightedBest(items) {
        if (!items.length)
            return null;
        return items.reduce((best, current) => {
            const bestScore = best.successRate * best.confidence;
            const currentScore = current.successRate * current.confidence;
            return currentScore > bestScore ? current : best;
        });
    }
}
exports.BehavioralProfileManager = BehavioralProfileManager;
//# sourceMappingURL=BehavioralProfileManager.js.map