const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Campaign = require('../models/Campaign');

router.get('/campaign/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const trackingRoutes = require('../routes/trackingRoutes');
    const data = trackingRoutes.trackingStore?.get(trackingId) || {};
    
    let userData = data.userData || {};
    let campaignData = {};
    
    if (data.campaignId) {
      try {
        const campaign = await Campaign.findById(data.campaignId);
        if (campaign) campaignData = { name: campaign.name, subject: campaign.subject, content: campaign.content || '' };
      } catch (e) {}
    }
    
    const planNames = { starter: 'Starter', pro: 'Professional', premium: 'Enterprise', enterprise: 'Enterprise' };
    const planName = planNames[userData.selectedPlan] || 'EmailAI User';
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    
    res.send(`<!DOCTYPE html><html><head><title>${userData.name || 'EmailBrain'}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,Arial,sans-serif}body{background:#f8fafc;min-height:100vh}
.hero{background:linear-gradient(135deg,#1e1b4b,#3730a3,#6366f1);padding:40px 20px;text-align:center;color:#fff}
.hero-badge{display:inline-block;background:rgba(255,255,255,.2);padding:6px 16px;border-radius:20px;font-size:13px;margin-bottom:16px}
.hero h1{font-size:28px}
.sender-card{max-width:500px;margin:-30px auto 20px;background:#fff;border-radius:16px;padding:24px;box-shadow:0 10px 40px rgba(0,0,0,.1);text-align:center;position:relative;z-index:10}
.avatar{width:70px;height:70px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:#fff;font-size:28px;font-weight:700;overflow:hidden}
.avatar img{width:100%;height:100%;object-fit:cover}
.sender-name{font-size:20px;font-weight:700;color:#1e1b4b}
.sender-role{color:#6b7280;font-size:13px;margin-top:2px}
.plan-badge{display:inline-block;background:#fef3c7;color:#92400e;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;margin-top:8px}
.subscribe-section{max-width:500px;margin:20px auto;padding:0 16px}
.subscribe-section h3{color:#1e1b4b;margin-bottom:12px;text-align:center}
.form-group{margin-bottom:14px}
.form-group label{display:block;font-size:13px;font-weight:700;color:#374151;margin-bottom:4px}
.form-group input{width:100%;padding:12px 16px;border:2px solid #e5e7eb;border-radius:10px;font-size:14px;outline:none}
.form-group input:focus{border-color:#6366f1}
.subscribe-btn{width:100%;padding:14px;background:#10b981;color:#fff;border:none;border-radius:10px;font-weight:700;font-size:15px;cursor:pointer}
.subscribe-btn:hover{background:#059669}
.divider{max-width:500px;margin:30px auto;text-align:center;color:#9ca3af;font-size:13px}
.features{max-width:500px;margin:0 auto 30px;padding:0 16px;text-align:center}
.features h3{font-size:16px;color:#1e1b4b;margin-bottom:16px}
.feature-list{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.feature-item{background:#fff;padding:14px;border-radius:10px;font-size:13px;color:#374151;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.cta-section{text-align:center;padding:20px 20px 50px}
.cta-btn{display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:50px;font-weight:700;font-size:16px;box-shadow:0 4px 20px rgba(99,102,241,.4)}
.cta-sub{color:#6b7280;font-size:13px;margin-top:10px}
.footer{text-align:center;padding:20px;color:#9ca3af;font-size:11px;border-top:1px solid #e5e7eb}
#subMsg{margin-top:12px;font-size:13px;text-align:center}
</style></head><body>
<div class="hero"><div class="hero-badge">📧 Sent via EmailBrain</div><h1>${campaignData.subject || 'Email Campaign'}</h1></div>
<div class="sender-card">
<div class="avatar">${userData.avatar ? '<img src="'+userData.avatar+'" alt="">' : (userData.name?.charAt(0)?.toUpperCase() || '?')}</div>
<div class="sender-name">${userData.name || 'EmailAI User'}</div>
${userData.jobTitle ? '<div class="sender-role">'+userData.jobTitle+(userData.company ? ' at '+userData.company : '')+'</div>' : ''}
${userData.industry ? '<div class="sender-role">'+userData.industry.charAt(0).toUpperCase()+userData.industry.slice(1)+' Industry</div>' : ''}
<div class="plan-badge">⭐ ${planName} Plan</div>
${userData.createdAt ? '<div style="margin-top:10px;font-size:11px;color:#9ca3af;">Member since '+new Date(userData.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long'})+'</div>' : ''}
</div>
<div class="subscribe-section">
<h3>📬 Subscribe to ${userData.name?.split(' ')[0] || 'this sender'}'s List</h3>
<p style="font-size:13px;color:#6b7280;margin-bottom:20px;text-align:center">Get exclusive updates, offers, and insights</p>
<form id="subForm">
<div class="form-group"><label>Full Name *</label><input type="text" id="subName" placeholder="Enter your full name" required></div>
<div class="form-group"><label>Email Address *</label><input type="email" id="subEmail" placeholder="you@example.com" required></div>
<div class="form-group"><label>Phone Number *</label><input type="tel" id="subPhone" placeholder="+1 234 567 8900" required></div>
<div class="form-group"><label>Company (Optional)</label><input type="text" id="subCompany" placeholder="Your company name"></div>
<div class="form-group"><label>Location (Optional)</label><input type="text" id="subLocation" placeholder="City, Country"></div>
<button type="submit" class="subscribe-btn">Subscribe Now →</button>
<p id="subMsg"></p>
</form>
</div>
<div class="divider">Want to send campaigns like this?</div>
<div class="features"><h3>🚀 EmailBrain Features</h3>
<div class="feature-list">
<div class="feature-item">🎯 541 Niche Profiles<br><span style="font-size:11px;color:#6b7280;">AI that knows your industry</span></div>
<div class="feature-item">🧠 Behavioral Learning<br><span style="font-size:11px;color:#6b7280;">Gets smarter every send</span></div>
<div class="feature-item">🛡️ Auto-Compliance<br><span style="font-size:11px;color:#6b7280;">Built-in for every industry</span></div>
<div class="feature-item">👥 Community<br><span style="font-size:11px;color:#6b7280;">Connect with marketers</span></div>
</div></div>
<div class="cta-section">
<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?mode=signup" class="cta-btn">Create Your Free Account →</a>
<p class="cta-sub">No credit card required • Cancel anytime</p>
</div>
<div class="footer">© 2026 EmailBrain. All rights reserved.</div>
<script>
document.getElementById('subForm').addEventListener('submit',async function(e){
e.preventDefault();
var n=document.getElementById('subName').value.trim();
var em=document.getElementById('subEmail').value.trim();
var p=document.getElementById('subPhone').value.trim();
var c=document.getElementById('subCompany').value.trim();
var l=document.getElementById('subLocation').value.trim();
var m=document.getElementById('subMsg');
if(!n){m.textContent='Name is required';m.style.color='#ef4444';return}
if(!em){m.textContent='Email is required';m.style.color='#ef4444';return}
if(!p){m.textContent='Phone is required';m.style.color='#ef4444';return}
m.textContent='Subscribing...';m.style.color='#6b7280';
try{
var r=await fetch('${apiUrl}/api/subscribers/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n,email:em,phone:p,company:c,location:l,campaignId:'${data.campaignId||''}',userId:'${data.userId||''}'})});
var d=await r.json();
if(d.success){m.textContent='✅ Subscribed!';m.style.color='#10b981';document.getElementById('subForm').reset()}
else{m.textContent=d.message||'Failed';m.style.color='#ef4444'}
}catch(err){m.textContent='Network error';m.style.color='#ef4444'}
});
</script>
</body></html>`);
  } catch (error) { console.error('Public route error:', error); res.status(500).send('Error'); }
});

module.exports = router;