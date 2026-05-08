// worker.js - Cloudflare Workers entry point
import { httpServerHandler } from 'cloudflare:node';

// We need to initialize your Express app before the worker starts
// Create a wrapper that Cloudflare can use
export default {
  async fetch(request, env, ctx) {
    // Load your Express app (we handle this differently for Workers)
    const app = require('./src/app');
    
    // Use the Node.js server handler to bridge Express to Workers
    return httpServerHandler({ 
      app,
      port: env.PORT || 3001 
    })(request, env, ctx);
  }
};