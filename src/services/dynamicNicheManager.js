/**
 * Dynamic Niche Manager
 * Automatically creates and saves new niches when AI encounters unknown industries
 */

const path = require('path');
const fs = require('fs');

const DYNAMIC_NICHES_FILE = path.join(__dirname, '..', 'emailbrain', 'config', 'dynamic_niches.json');

/**
 * Load previously saved dynamic niches into NICHE_PROFILES
 */
function loadDynamicNiches(NICHE_PROFILES, DEFAULT_NICHE_ID) {
  try {
    if (fs.existsSync(DYNAMIC_NICHES_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DYNAMIC_NICHES_FILE, 'utf8'));
      const base = NICHE_PROFILES[DEFAULT_NICHE_ID];
      let count = 0;
      
      for (const [id, data] of Object.entries(saved)) {
        if (base && !NICHE_PROFILES[id]) {
          NICHE_PROFILES[id] = {
            ...JSON.parse(JSON.stringify(base)),
            niche_id: id,
            niche_name: data.industry,
            sector: data.industry,
            _dynamic: true,
            _createdAt: data.createdAt
          };
          count++;
        }
      }
      
      if (count > 0) console.log(`📦 Loaded ${count} dynamic niches`);
    }
  } catch (e) {
    console.warn('⚠️ Could not load dynamic niches:', e.message);
  }
}

/**
 * Find or create a niche. Never returns the default.
 */
function findOrCreateNiche(NICHE_PROFILES, DEFAULT_NICHE_ID, industry) {
  const cleanIndustry = (industry || 'general').replace(/[^a-z0-9]/gi, '_');
  const newId = `DYNAMIC_${cleanIndustry.toUpperCase()}_${Date.now()}`;
  
  // Clone the default niche as a template
  const base = NICHE_PROFILES[DEFAULT_NICHE_ID];
  if (!base) return { nicheId: DEFAULT_NICHE_ID, niche: NICHE_PROFILES[DEFAULT_NICHE_ID] };
  
  NICHE_PROFILES[newId] = {
    ...JSON.parse(JSON.stringify(base)),
    niche_id: newId,
    niche_name: industry || 'General',
    sector: industry || 'general',
    _dynamic: true,
    _createdAt: new Date().toISOString()
  };
  
  // Save to file
  const saved = fs.existsSync(DYNAMIC_NICHES_FILE) 
    ? JSON.parse(fs.readFileSync(DYNAMIC_NICHES_FILE, 'utf8')) 
    : {};
  saved[newId] = { industry: industry || 'general', createdAt: new Date().toISOString() };
  fs.writeFileSync(DYNAMIC_NICHES_FILE, JSON.stringify(saved, null, 2));
  
  console.log(`🆕 New dynamic niche created: ${newId} (${industry})`);
  
  return { nicheId: newId, niche: NICHE_PROFILES[newId] };
}

module.exports = { loadDynamicNiches, findOrCreateNiche };