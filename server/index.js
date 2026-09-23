import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processChatRecommendation, prepareShareApproval } from './services/nimService.js';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    model: process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct',
    hasKey: !!process.env.NVIDIA_API_KEY
  });
});

// Chat recommendation endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await processChatRecommendation(message, history || []);
    res.json(result);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Prepare approval for KakaoTalk share
app.post('/api/share/prepare', async (req, res) => {
  try {
    const { restaurantId, userMessage } = req.body;
    if (!restaurantId) {
      return res.status(400).json({ error: 'restaurantId is required' });
    }

    const result = await prepareShareApproval(restaurantId, userMessage);
    res.json(result);
  } catch (error) {
    console.error('Share prepare error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get restaurant catalog
app.get('/api/restaurants', (req, res) => {
  const restaurantsPath = path.join(__dirname, 'data/restaurants.json');
  const data = JSON.parse(fs.readFileSync(restaurantsPath, 'utf8'));
  res.json(data);
});

// Serve static frontend files in production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Local Gourmet Agent server running on http://localhost:${PORT}`);
});
