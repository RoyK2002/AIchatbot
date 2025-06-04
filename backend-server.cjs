require('dotenv').config(); // Load .env file
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// In-memory stores
const ipPromptCounts = {}; // { [ip]: { count: number, lastDate: string } }
const ipIrrelevantCounts = {}; // { [ip]: { count: number, lastDate: string } }
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
  // Expanded keywords for general business/service questions
  const keywords = [
    'automation', 'digital', 'staff', 'workflow', 'process', 'ai', 'bot', 'integration', 'business',
    'service', 'offer', 'provide', 'help', 'support', 'solution', 'product', 'company', 'about', 'what', 'how', 'do', 'can', 'who', 'contact', 'price', 'cost', 'demo', 'trial', 'feature', 'benefit', 'value', 'team', 'expert', 'consult', 'call', 'schedule', 'meeting', 'appointment', 'information', 'info', 'details', 'work', 'client', 'customer', 'industry', 'sector', 'partner', 'portfolio', 'case', 'study', 'testimonial', 'review', 'faq', 'question', 'answer', 'assist', 'consultation', 'project', 'implementation', 'custom', 'tailor', 'fit', 'solution', 'transform', 'improve', 'optimize', 'save', 'time', 'money', 'efficiency', 'growth', 'scale', 'expand', 'future', 'innovate', 'technology', 'platform', 'tool', 'software', 'app', 'application', 'system', 'integration', 'api', 'connect', 'automate', 'robot', 'virtual', 'assistant', 'intelligent', 'smart', 'digitalstaff', 'oscar', 'calendly'
  ];
  // If message contains any keyword or is a question (ends with ?), treat as relevant
  if (keywords.some(k => msg.includes(k))) return true;
  if (msg.trim().endsWith('?')) return true;
  // Fallback to original logic
  return keywords.some(k => msg.includes(k) && content.includes(k));
}

// Middleware for IP restriction
app.use('/api/chat', (req, res, next) => {
  const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || '') || '';
  if (blockedIPs.has(ip)) {
    return res.status(403).json({ error: 'Your IP has been blocked due to repeated irrelevant messages.' });
  }
  const today = new Date().toISOString().slice(0, 10);
  // Track total prompts (optional, for analytics)
  if (!ipPromptCounts[ip] || ipPromptCounts[ip].lastDate !== today) {
    ipPromptCounts[ip] = { count: 0, lastDate: today };
  }
  ipPromptCounts[ip].count++;
  // Track irrelevant prompts
  if (!ipIrrelevantCounts[ip] || ipIrrelevantCounts[ip].lastDate !== today) {
    ipIrrelevantCounts[ip] = { count: 0, lastDate: today };
  }
  req.ipPromptMeta = {
    ip,
    today,
    totalCount: ipPromptCounts[ip].count,
    irrelevantCount: ipIrrelevantCounts[ip].count
  };
  next();
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const { ip, irrelevantCount, today } = req.ipPromptMeta || {};
  if (!isRelevant(message)) {
    // Only increment irrelevant count if message is irrelevant
    if (!ipIrrelevantCounts[ip] || ipIrrelevantCounts[ip].lastDate !== today) {
      ipIrrelevantCounts[ip] = { count: 0, lastDate: today };
    }
    ipIrrelevantCounts[ip].count++;
    console.log(`[BLOCK CHECK] IP: ${ip}, Message: "${message}", Relevant: false, IrrelevantCount: ${ipIrrelevantCounts[ip].count}`);
    if (ipIrrelevantCounts[ip].count > 5) {
      blockedIPs.add(ip);
      console.log(`[BLOCKED] IP: ${ip} has been blocked for too many irrelevant messages.`);
      return res.status(403).json({ error: 'Your IP has been blocked due to repeated irrelevant messages.' });
    }
  } else {
    console.log(`[BLOCK CHECK] IP: ${ip}, Message: "${message}", Relevant: true, IrrelevantCount: ${ipIrrelevantCounts[ip].count}`);
  }
  // Call OpenAI API for real response
  try {
    const SYSTEM_PROMPT = "You are Winston, a friendly and professional AI assistant at DigitalStaff. Help users with automation-related questions and invite them to schedule a call at https://calendly.com/digitalstaff/call-with-oscar/ if needed.";
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message }
      ]
    });
    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to get response from AI backend.' });
  }
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
