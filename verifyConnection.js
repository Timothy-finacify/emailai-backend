// verifyConnection.js - FIXED VERSION
const https = require('https');
const http = require('http');

// CONFIGURATION
const BACKEND_URL = 'https://emailai-backend-658e.onrender.com';
const FRONTEND_URL = 'https://email-brain.pages.dev';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function logSuccess(msg) { console.log(`${colors.green}✅ ${msg}${colors.reset}`); }
function logError(msg) { console.log(`${colors.red}❌ ${msg}${colors.reset}`); }
function logInfo(msg) { console.log(`${colors.blue}📡 ${msg}${colors.reset}`); }
function logWarn(msg) { console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`); }

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const protocol = urlObj.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ status: 0, error: error.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function verifyConnection() {
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}🔍 BACKEND-FRONTEND CONNECTION VERIFICATION${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}\n`);

  const results = {
    backend: {},
    frontend: {},
    connection: {}
  };

  // ========== BACKEND TESTS ==========
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}🔧 BACKEND API TESTS${colors.reset}`);
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  // Test 1: Root endpoint
  logInfo('Testing GET /...');
  const root = await makeRequest(BACKEND_URL);
  if (root.status === 200) {
    logSuccess(`Root endpoint accessible`);
    results.backend.root = true;
  } else {
    logError(`Root endpoint failed (${root.status})`);
  }

  // Test 2: AI Chat POST
  logInfo('Testing POST /api/ai/chat...');
  const chatPost = await makeRequest(`${BACKEND_URL}/api/ai/chat`, 'POST', { message: 'Hello' });
  if (chatPost.status === 200) {
    logSuccess(`POST /api/ai/chat works`);
    results.backend.chatPost = true;
  } else {
    logError(`POST /api/ai/chat failed (${chatPost.status})`);
  }

  // Test 3: AI Chat GET (CRITICAL for frontend)
  logInfo('Testing GET /api/ai/chat (what frontend uses)...');
  const chatGet = await makeRequest(`${BACKEND_URL}/api/ai/chat?message=Hello`, 'GET');
  if (chatGet.status === 200) {
    logSuccess(`GET /api/ai/chat works - Frontend can communicate!`);
    results.backend.chatGet = true;
  } else if (chatGet.status === 405) {
    logWarn(`GET returns 405 - Method mismatch`);
    results.backend.chatGet = false;
  } else {
    logError(`GET /api/ai/chat failed (${chatGet.status})`);
  }

  // ========== FRONTEND TESTS ==========
  console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}🌐 FRONTEND TESTS${colors.reset}`);
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  logInfo(`Checking frontend at ${FRONTEND_URL}...`);
  const frontend = await makeRequest(FRONTEND_URL);
  if (frontend.status === 200) {
    logSuccess(`Frontend is LIVE`);
    results.frontend.alive = true;
  } else {
    logError(`Frontend is DOWN`);
    results.frontend.alive = false;
  }

  // ========== SUMMARY ==========
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}📊 VERIFICATION SUMMARY${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  if (results.backend.root) {
    logSuccess('Backend: Online');
  } else {
    logError('Backend: Offline');
  }

  if (results.frontend.alive) {
    logSuccess('Frontend: Online');
  } else {
    logError('Frontend: Offline');
  }

  if (results.backend.chatPost && results.backend.chatGet) {
    logSuccess('Chat Endpoint: Works with both GET & POST');
  } else if (results.backend.chatPost && !results.backend.chatGet) {
    logWarn('Chat Endpoint: Only POST works (GET returns 405)');
  } else if (!results.backend.chatPost && results.backend.chatGet) {
    logWarn('Chat Endpoint: Only GET works');
  } else {
    logError('Chat Endpoint: Not working');
  }

  // Final verdict
  console.log(`\n${colors.blue}───────────────────────────────────────────────────────────${colors.reset}`);
  
  if (results.backend.chatGet === true) {
    console.log(`${colors.green}✅✅✅ CONNECTION SUCCESSFUL! ✅✅✅${colors.reset}`);
    console.log(`${colors.green}   Your frontend can now communicate with the backend!${colors.reset}`);
    console.log(`${colors.green}   GET /api/ai/chat is working!${colors.reset}`);
  } else if (results.backend.chatPost && !results.backend.chatGet) {
    console.log(`${colors.yellow}⚠️  Backend reachable but method mismatch${colors.reset}`);
    console.log(`${colors.yellow}   Frontend needs to use POST instead of GET${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Connection issues detected${colors.reset}`);
  }

  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);
}

// Run the verification
verifyConnection();