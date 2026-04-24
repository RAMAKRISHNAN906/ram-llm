const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const https = require('https');

const app = express();

const PORT = Number(process.env.PORT || 3001);
const HF_API_URL = process.env.HF_API_URL || 'https://router.huggingface.co/v1/chat/completions';
const HF_TOKEN = process.env.HF_TOKEN || '';
const MODEL = process.env.HF_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
const HF_FALLBACK_MODEL = process.env.HF_FALLBACK_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';
const FIRST_TOKEN_TIMEOUT_MS = Number(process.env.FIRST_TOKEN_TIMEOUT_MS || 3000);
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 1);
const RETRY_DELAY_MS = Number(process.env.RETRY_DELAY_MS || 800);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const HF_TEMPERATURE = Number(process.env.HF_TEMPERATURE || 0.2);
const HF_MAX_TOKENS = Number(process.env.HF_MAX_TOKENS || 180);

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

function isRetryableError(message = '') {
  return (
    message.includes('429') ||
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('ECONNRESET') ||
    message.includes('ETIMEDOUT') ||
    message.includes('ECONNABORTED')
  );
}

async function streamFromModel(messages, res, model) {
  const controller = new AbortController();
  const hfRes = await fetch(HF_API_URL, {
    method: 'POST',
    agent: httpsAgent,
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
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
    let settled = false;

    const firstTokenTimer = setTimeout(() => {
      if (hasTokens || settled) return;
      settled = true;
      controller.abort();
      reject(new Error(`FIRST_TOKEN_TIMEOUT:${model}`));
    }, FIRST_TOKEN_TIMEOUT_MS);

    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(firstTokenTimer);
      if (error) reject(error);
      else resolve();
    };

    hfRes.body.on('data', (chunk) => {
      buffer += chunk.toString();

      const { events, remaining } = parseSseEvents(buffer);
      buffer = remaining;

      for (const eventData of events) {
        if (eventData === '[DONE]') {
          if (!hasTokens) {
            finish(new Error(`No response tokens from model: ${model}`));
            return;
          }
          finish();
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
        finish(new Error(`No response tokens from model: ${model}`));
        return;
      }
      finish();
    });

    hfRes.body.on('error', (err) => {
      if (err?.name === 'AbortError' && !hasTokens) {
        finish(new Error(`FIRST_TOKEN_TIMEOUT:${model}`));
        return;
      }
      finish(err);
    });
  });
}

async function streamFromHuggingFace(messages, res) {
  if (!HF_TOKEN) {
    throw new Error('HF_TOKEN is missing on server.');
  }

  const modelChain = [MODEL];
  if (HF_FALLBACK_MODEL && HF_FALLBACK_MODEL !== MODEL) {
    modelChain.push(HF_FALLBACK_MODEL);
  }

  let lastError = null;

  for (let m = 0; m < modelChain.length; m += 1) {
    const model = modelChain[m];
    const isFallback = m > 0;
    const attempts = isFallback ? 1 : Math.max(MAX_RETRIES + 1, 1);

    if (isFallback) {
      res.write(`data: ${JSON.stringify({ info: `Switching to faster model (${model})...` })}\n\n`);
    }

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await streamFromModel(messages, res, model);
        res.write('data: [DONE]\n\n');
        return;
      } catch (err) {
        lastError = err;
        const msg = err?.message || '';
        const timedOut = msg.startsWith('FIRST_TOKEN_TIMEOUT:');
        const retryable = isRetryableError(msg);

        if (timedOut && !isFallback) {
          res.write(`data: ${JSON.stringify({ info: `Primary model is slow. Trying fallback...` })}\n\n`);
          break;
        }

        if (retryable && attempt < attempts) {
          res.write(`data: ${JSON.stringify({ info: `Retrying (${attempt}/${attempts - 1})...` })}\n\n`);
          await sleep(RETRY_DELAY_MS);
          continue;
        }

        if (isFallback || !timedOut) {
          break;
        }
      }
    }
  }

  throw lastError || new Error('All configured models failed.');
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
    fallbackModel: HF_FALLBACK_MODEL || null,
    firstTokenTimeoutMs: FIRST_TOKEN_TIMEOUT_MS,
    hasToken: Boolean(HF_TOKEN),
  });
});

app.listen(PORT, () => {
  console.log(`RAM LLM backend running on http://localhost:${PORT}`);
  console.log(`Provider: Hugging Face | Model: ${MODEL} | Fallback: ${HF_FALLBACK_MODEL}`);
});
