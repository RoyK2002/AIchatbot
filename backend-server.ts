import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// In-memory stores
const ipPromptCounts = {};
const blockedIPs = new Set();
let digitalStaffContent = '';

// Fetch and cache digitalstaff.ca content for relevance checking
async function fetchDigitalStaffContent() {
  try {
    const res = await fetch('https://digitalstaff.ca');
    digitalStaffContent = await res.text();
  } catch (e) {
    digitalStaffContent = '';
  }
}
fetchDigitalStaffContent();
setInterval(fetchDigitalStaffContent, 1000 * 60 * 60); // refresh every hour

// Simple RAG-style relevance check
function isRelevant(message) {
  if (!digitalStaffContent) return true; // fallback: allow if content not loaded
  const msg = message.toLowerCase();
  const content = digitalStaffContent.toLowerCase();
  // Check for at least one keyword match (customize as needed)
  const keywords = ['automation', 'digital', 'staff', 'workflow', 'process', 'ai', 'bot', 'integration', 'business'];
  return keywords.some(k => msg.includes(k) && content.includes(k));
}

// Middleware for IP restriction
app.use('/api/chat', (req, res, next) => {
  const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || '') || '';
  if (blockedIPs.has(ip)) {
    return res.status(403).json({ error: 'Your IP has been blocked due to repeated irrelevant messages.' });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (!ipPromptCounts[ip] || ipPromptCounts[ip].lastDate !== today) {
    ipPromptCounts[ip] = { count: 0, lastDate: today };
  }
  ipPromptCounts[ip].count++;
  (req as any).ipPromptMeta = { ip, today, count: ipPromptCounts[ip].count };
  next();
});

// Chat endpoint (proxy to OpenAI or your logic)
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  const { ip, count } = ((req as any).ipPromptMeta || {});
  if (count > 10 && !isRelevant(message)) {
    blockedIPs.add(ip);
    return res.status(403).json({ error: 'Your IP has been blocked due to repeated irrelevant messages.' });
  }
  // TODO: Forward to OpenAI/chatbot logic here
  res.json({ reply: 'This is a placeholder response from the backend.' });
});

// Admin endpoint to unblock an IP
app.post('/api/unblock', (req, res) => {
  const { ip } = req.body;
  if (blockedIPs.has(ip)) {
    blockedIPs.delete(ip);
    return res.json({ success: true, message: `IP ${ip} unblocked.` });
  }
  res.status(404).json({ error: 'IP not found in blocked list.' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

export {};
