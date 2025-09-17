// Vercel API Route: /api/appscript-proxy.js
// This proxies requests to Google Apps Script and handles CORS

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeSHLU8sW3S87yEZ7BAGJWBdaMEvJfkz3OzjPjE8XaP0pOjmGxxYQWmUwvgoIvMQArXA/exec';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Determine the method and build the request (same as working local proxy)
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
    }
    // For GET requests, add query parameters to URL
    else if (req.method === 'GET' && Object.keys(req.query).length > 0) {
      targetUrl = `${GOOGLE_APPS_SCRIPT_URL}?${new URLSearchParams(req.query)}`;
    }

    // Make request to Google Apps Script
    const response = await fetch(targetUrl, requestOptions);

    // Get response data
    const data = await response.text();

    // Try to parse as JSON, fallback to text
    let responseData;
    try {
      responseData = JSON.parse(data);
    } catch (e) {
      responseData = { success: false, error: 'Invalid JSON response', raw: data };
    }

    // Forward the response
    res.status(response.ok ? 200 : response.status).json(responseData);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({
      success: false,
      error: 'Proxy request failed',
      details: error.message
    });
  }
}