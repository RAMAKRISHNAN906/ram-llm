# RAM LLM

RAM LLM with cloud backend on Render + Hugging Face Inference API.

## Architecture
- Frontend: Firebase Hosting (`https://ram-llm.web.app`)
- Backend API: Render web service (`https://ram-llm-api.onrender.com`)
- Model provider: Hugging Face Inference Providers (chat completions)

## 1) Backend Deploy (Render)

1. Push this project to GitHub.
2. In Render, create a **Web Service** from your repo.
3. Use these settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables in Render:
   - `HF_TOKEN` = your Hugging Face token
   - `HF_MODEL` = `deepseek-ai/DeepSeek-R1:fastest`
   - `HF_API_URL` = `https://router.huggingface.co/v1/chat/completions`
   - `CORS_ORIGIN` = `https://ram-llm.web.app`
   - `MAX_RETRIES` = `2`
   - `RETRY_DELAY_MS` = `1500`
5. Deploy and verify:
   - `https://<your-render-service>.onrender.com/health`

A `render.yaml` is included at repo root for blueprint-style setup.

## 2) Frontend Deploy (Firebase)

Production API URL is configured in:
- `frontend/.env.production`

Current value:
- `VITE_API_BASE_URL=https://ram-llm-api.onrender.com`

Deploy:
```bash
firebase deploy --only hosting
```

## Local Development

Backend:
```bash
cd backend
npm install
npm start
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## API

- `POST /ask`
  - Body: `{ "messages": [{ "role": "user", "content": "Hello" }] }`
  - Response: SSE stream with `{ token }` chunks + `[DONE]`
- `GET /health`
  - Returns backend/provider/model status
