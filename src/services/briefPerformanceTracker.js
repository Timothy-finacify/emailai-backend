// backend/src/services/briefPerformanceTracker.js

/**
 * Brief Performance Tracker
 * Learns which brief combinations perform best and auto-suggests winners
 */

// In-memory storage (works immediately, upgrade to MongoDB later)
const performanceDB = new Map();
const userHistoryDB = new Map();

class BriefPerformanceTracker {
  
  /**
   * Track a campaign's performance
   */
  static trackPerformance(userId, brief, campaignResult) {
    if (!brief || !brief.campaignGoal) return;
    
    const audienceKey = brief.targetAudience?.toLowerCase().trim() || 'general';
    const key = `${brief.campaignGoal}_${audienceKey}`;
    
    // Initialize if new
    if (!performanceDB.has(key)) {
      performanceDB.set(key, {
        goal: brief.campaignGoal,
        audience: brief.targetAudience,
        totalCampaigns: 0,
        totalOpens: 0,
        totalClicks: 0,
        winningMessages: new Map(),
        winningActions: new Map()
      });
    }
    
    const record = performanceDB.get(key);
    record.totalCampaigns++;
    record.totalOpens += campaignResult.openRate || 0;
    record.totalClicks += campaignResult.clickRate || 0;
    
    // Track message performance
    if (brief.keyMessage) {
      const msgKey = brief.keyMessage.toLowerCase().trim();
      if (!record.winningMessages.has(msgKey)) {
        record.winningMessages.set(msgKey, { uses: 0, totalOpenRate: 0 });
      }
      const msgRecord = record.winningMessages.get(msgKey);
      msgRecord.uses++;
      msgRecord.totalOpenRate += campaignResult.openRate || 0;
    }
    
    // Track action performance
    if (brief.desiredAction) {
      const actionKey = brief.desiredAction.toLowerCase().trim();
      if (!record.winningActions.has(actionKey)) {
        record.winningActions.set(actionKey, { uses: 0, totalConversionRate: 0 });
      }
      const actionRecord = record.winningActions.get(actionKey);
      actionRecord.uses++;
      actionRecord.totalConversionRate += campaignResult.conversionRate || 0;
    }
    
    // Track user history
    if (!userHistoryDB.has(userId)) {
      userHistoryDB.set(userId, []);
    }
    userHistoryDB.get(userId).push({
      brief,
      performance: campaignResult,
      timestamp: new Date()
    });
    
    console.log(`📊 Tracker: ${key} now has ${record.totalCampaigns} campaigns tracked`);
  }
  
  /**
   * Get winning combinations for a goal/audience
   */
  static getWinningCombinations(goal, audience) {
    const audienceKey = audience?.toLowerCase().trim() || 'general';
    const key = `${goal}_${audienceKey}`;
    
    if (!performanceDB.has(key)) {
      return null;
    }
    
    const record = performanceDB.get(key);
    
    // Find best message
    let bestMessage = null;
    let bestMessageRate = 0;
    for (const [msg, data] of record.winningMessages.entries()) {
      const avgRate = data.totalOpenRate / data.uses;
      if (avgRate > bestMessageRate && data.uses >= 2) {
        bestMessageRate = avgRate;
        bestMessage = msg;
      }
    }
    
    // Find best action
    let bestAction = null;
    let bestActionRate = 0;
    for (const [action, data] of record.winningActions.entries()) {
      const avgRate = data.totalConversionRate / data.uses;
      if (avgRate > bestActionRate && data.uses >= 2) {
        bestActionRate = avgRate;
        bestAction = action;
      }
    }
    
    return {
      goal,
      audience,
      totalCampaigns: record.totalCampaigns,
      avgOpenRate: record.totalOpens / record.totalCampaigns,
      avgClickRate: record.totalClicks / record.totalCampaigns,
      bestMessage: bestMessage ? {
        text: bestMessage,
        avgOpenRate: Math.round(bestMessageRate * 100) / 100
      } : null,
      bestAction: bestAction ? {
        text: bestAction,
        avgConversionRate: Math.round(bestActionRate * 100) / 100
      } : null
    };
  }
  
  /**
   * Get smart suggestions for a brief
   */
  static getSmartSuggestions(goal, audience) {
    const winners = this.getWinningCombinations(goal, audience);
    
    if (!winners || winners.totalCampaigns < 2) {
      return {
        hasData: false,
        message: "Not enough data yet. Send a few campaigns to get smart suggestions!"
      };
    }
    
    const suggestions = {
      hasData: true,
      totalCampaigns: winners.totalCampaigns,
      avgOpenRate: Math.round(winners.avgOpenRate * 100) / 100,
      suggestedMessage: winners.bestMessage?.text || null,
      suggestedAction: winners.bestAction?.text || null,
      confidence: winners.totalCampaigns > 5 ? 'High' : 'Medium',
      tip: null
    };
    
    if (winners.bestMessage) {
      suggestions.tip = `💡 For ${audience}, "${winners.bestMessage.text}" gets ${winners.bestMessage.avgOpenRate}% open rate`;
    }
    
    return suggestions;
  }
  
  /**
   * Get user's past successful briefs
   */
  static getUserWinningBriefs(userId, limit = 3) {
    const history = userHistoryDB.get(userId) || [];
    
    return history
      .filter(h => h.performance.openRate > 0.25)
      .sort((a, b) => b.performance.openRate - a.performance.openRate)
      .slice(0, limit)
      .map(h => ({
        goal: h.brief.campaignGoal,
        audience: h.brief.targetAudience,
        message: h.brief.keyMessage,
        action: h.brief.desiredAction,
        openRate: h.performance.openRate,
        date: h.timestamp
      }));
  }
  
  /**
   * Get all stats (for dashboard)
   */
  static getAllStats() {
    const stats = {
      totalCampaignsTracked: 0,
      goalsTracked: performanceDB.size,
      topPerforming: []
    };
    
    for (const [key, record] of performanceDB.entries()) {
      stats.totalCampaignsTracked += record.totalCampaigns;
      stats.topPerforming.push({
        key,
        goal: record.goal,
        audience: record.audience,
        campaigns: record.totalCampaigns,
        avgOpenRate: record.totalOpens / record.totalCampaigns
      });
    }
    
    stats.topPerforming.sort((a, b) => b.avgOpenRate - a.avgOpenRate);
    stats.topPerforming = stats.topPerforming.slice(0, 5);
    
    return stats;
  }
}

module.exports = BriefPerformanceTracker;