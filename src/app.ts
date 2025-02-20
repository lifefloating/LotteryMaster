import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

// eslint-disable-next-line no-console
console.log('Environment variables loaded:', {
  PORT: process.env.PORT,
  SSQ_URL: process.env.SSQ_URL,
  DLT_URL: process.env.DLT_URL,
  DATA_PATH: process.env.DATA_PATH,
});

import express from 'express';
import scraper from './services/scraper';
import aiService from './services/ai';

const DATA_PATH = process.env.DATA_PATH ?? 'lottery_data';
const PORT = process.env.PORT || 3008;

const app = express();
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    res.json({ success: true, message: 'Welcome to the lottery API' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/scrape/ssq', async (req, res) => {
  try {
    const data = await scraper.scrapeSSQ();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/scrape/dlt', async (req, res) => {
  try {
    const data = await scraper.scrapeDLT();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/analyze/ssq', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const fileName = path.join(DATA_PATH, `ssq_data_${today}.xlsx`);
    const analysis = await aiService.analyzeLotteryData(fileName);
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/analyze/dlt', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const fileName = path.join(DATA_PATH, `dlt_data_${today}.xlsx`);
    const analysis = await aiService.analyzeLotteryData(fileName);
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('- GET /api/scrape/ssq');
  console.log('- GET /api/scrape/dlt');
  console.log('- GET /api/analyze/ssq');
  console.log('- GET /api/analyze/dlt');
  console.log(`Server is running on port ${PORT}`);
});
