const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const https = require('https');

const app = express();

const PORT = Number(process.env.PORT || 3001);
const HF_API_URL = process.env.HF_API_URL || 'https://router.huggingface.co/v1/chat/completions';
const HF_TOKEN = process.env.HF_TOKEN || '';
const MODEL = process.env.HF_MODEL || 'deepseek-ai/DeepSeek-R1:fastest';
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 1);
const RETRY_DELAY_MS = Number(process.env.RETRY_DELAY_MS || 800);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const HF_TEMPERATURE = Number(process.env.HF_TEMPERATURE || 0.2);
const HF_MAX_TOKENS = Number(process.env.HF_MAX_TOKENS || 256);

// Reuse TLS connections to reduce handshake overhead across requests.
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
});

app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseSseEvents(buffer) {
  const events = [];
  let remaining = buffer;

  while (true) {
    const idx = remaining.indexOf('\n\n');
    if (idx === -1) break;

    const rawEvent = remaining.slice(0, idx);
    remaining = remaining.slice(idx + 2);

    const dataLines = rawEvent
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim());

    if (dataLines.length > 0) {
      events.push(dataLines.join('\n'));
    }
  }

  return { events, remaining };
}

async function streamFromHuggingFace(messages, res, attempt = 1) {
  if (!HF_TOKEN) {
    throw new Error('HF_TOKEN is missing on server.');
  }

  try {
    const hfRes = await fetch(HF_API_URL, {
      method: 'POST',
      agent: httpsAgent,
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: HF_TEMPERATURE,
        max_tokens: HF_MAX_TOKENS,
        stream: true,
      }),
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      throw new Error(errText || `Hugging Face error (${hfRes.status})`);
    }

    return new Promise((resolve, reject) => {
      let hasTokens = false;
      let buffer = '';

      hfRes.body.on('data', (chunk) => {
        buffer += chunk.toString();

        const { events, remaining } = parseSseEvents(buffer);
        buffer = remaining;

        for (const eventData of events) {
          if (eventData === '[DONE]') {
            res.write('data: [DONE]\n\n');
            resolve();
            return;
          }

          try {
            const parsed = JSON.parse(eventData);
            const token = parsed?.choices?.[0]?.delta?.content || '';
            if (token) {
              hasTokens = true;
              res.write(`data: ${JSON.stringify({ token })}\n\n`);
            }
          } catch {
            // Ignore malformed chunks and continue.
          }
        }
      });

      hfRes.body.on('end', () => {
        if (!hasTokens) {
          reject(new Error('No response tokens from Hugging Face model.'));
          return;
        }
        res.write('data: [DONE]\n\n');
        resolve();
      });

      hfRes.body.on('error', (err) => reject(err));
    });
  } catch (err) {
    const msg = err.message || '';
    const retryable =
      msg.includes('429') ||
      msg.includes('503') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ETIMEDOUT');

    if (retryable && attempt <= MAX_RETRIES) {
      res.write(`data: ${JSON.stringify({ info: `Retrying (${attempt}/${MAX_RETRIES})...` })}\n\n`);
      await sleep(RETRY_DELAY_MS);
      return streamFromHuggingFace(messages, res, attempt + 1);
    }

    throw err;
  }
}

app.post('/ask', async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  try {
    await streamFromHuggingFace(messages, res);
  } catch (err) {
    const message = err.message || 'Unexpected server error.';
    console.error('[ask:error]', message);
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  } finally {
    res.end();
  }
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    provider: 'huggingface',
    model: MODEL,
    hasToken: Boolean(HF_TOKEN),
  });
});

app.listen(PORT, () => {
  console.log(`RAM LLM backend running on http://localhost:${PORT}`);
  console.log(`Provider: Hugging Face | Model: ${MODEL}`);
});
