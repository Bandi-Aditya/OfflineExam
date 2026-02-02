// Vercel serverless function handler
// This file is the entry point for all requests on Vercel
import app from '../src/server.js';

// Vercel expects a handler function, not the app directly
// Wrap the Express app in a handler function
const handler = (req, res) => {
    return app(req, res);
};

export default handler;
