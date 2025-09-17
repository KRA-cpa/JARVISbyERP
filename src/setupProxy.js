/**
 * Create React App Development Proxy Configuration
 * Matches the Vercel API proxy behavior exactly using direct fetch instead of proxy middleware
 */

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeSHLU8sW3S87yEZ7BAGJWBdaMEvJfkz3OzjPjE8XaP0pOjmGxxYQWmUwvgoIvMQArXA/exec';

module.exports = function(app) {
  console.log('📦 setupProxy.js loaded - Development proxy active (direct fetch mode)');

  // Handle all methods for /api/appscript-proxy
  app.use('/api/appscript-proxy', async (req, res) => {
    const timestamp = new Date().toISOString();

    // Set CORS headers (same as Vercel proxy)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      console.log(`🔧 [${timestamp}] Handling OPTIONS preflight request`);
      res.status(200).end();
      return;
    }

    try {
      console.log(`\n🔄 [${timestamp}] Processing ${req.method} request to Google Apps Script:`);
      console.log(`   Original URL: ${req.url}`);
      console.log(`   Query: ${JSON.stringify(req.query, null, 2)}`);

      // Determine the method and build the request (same as Vercel proxy)
      let requestOptions = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      let targetUrl = GOOGLE_APPS_SCRIPT_URL;

      // For POST requests, forward the body
      if (req.method === 'POST' && req.body) {
        requestOptions.body = JSON.stringify(req.body);
        console.log(`📤 POST Body: ${JSON.stringify(req.body, null, 2)}`);
      }
      // For GET requests, add query parameters to URL
      else if (req.method === 'GET' && Object.keys(req.query).length > 0) {
        targetUrl = `${GOOGLE_APPS_SCRIPT_URL}?${new URLSearchParams(req.query)}`;
        console.log(`📤 GET URL: ${targetUrl}`);
      }

      console.log(`   Target URL: ${targetUrl}`);
      console.log(`   Request Options: ${JSON.stringify(requestOptions, null, 2)}`);

      // Make request to Google Apps Script (exactly like Vercel proxy)
      const response = await fetch(targetUrl, requestOptions);

      console.log(`\n✅ [${timestamp}] Response from Google Apps Script:`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Headers: ${JSON.stringify([...response.headers.entries()], null, 2)}`);

      // Get response data
      const data = await response.text();
      console.log(`   Raw Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);

      // Try to parse as JSON, fallback to text (same as Vercel proxy)
      let responseData;
      try {
        responseData = JSON.parse(data);
        console.log(`📥 JSON Response: ${JSON.stringify(responseData, null, 2)}`);
      } catch (e) {
        responseData = { success: false, error: 'Invalid JSON response', raw: data };
        console.log(`❌ Failed to parse JSON: ${e.message}`);
      }

      // Forward the response (same as Vercel proxy)
      res.status(response.ok ? 200 : response.status).json(responseData);

    } catch (error) {
      console.error(`❌ [${timestamp}] Proxy Error:`, {
        message: error.message,
        method: req.method,
        url: req.url,
        code: error.code,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Proxy request failed',
        details: error.message
      });
    }
  });
};