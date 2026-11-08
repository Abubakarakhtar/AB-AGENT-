# AB Agent — deployable AI chat app

AB Agent is a responsive Next.js AI assistant with a modern dark UI, chat history saved in browser local storage, code-friendly responses, and a secure server-side AI Gateway connection.

## Features
- Chat in English, Urdu, or Roman Urdu
- Coding questions, code generation, debugging, explanations, writing, and planning
- Chat sessions saved in the user's browser
- Responsive desktop and mobile UI
- API key stays server-side (never shipped to the browser)
- Vercel-ready Next.js App Router API endpoint

## Deploy on Vercel
1. Unzip this project.
2. Upload the project to a GitHub repository.
3. In Vercel, choose **Add New → Project** and import that repository.
4. In Project Settings → **Environment Variables**, add:
   - `AI_GATEWAY_API_KEY` — your Vercel AI Gateway API key
   - `AI_MODEL` — optional, defaults to `openai/gpt-5.5`
5. Deploy. After adding/changing environment variables, redeploy the project.

Create the API key in your Vercel AI Gateway dashboard: https://vercel.com/ai-gateway

## Run locally
```bash
npm install
cp .env.example .env.local
# Edit .env.local and add your real AI_GATEWAY_API_KEY
npm run dev
```
Open http://localhost:3000

## Notes
- AI responses require an active AI Gateway key and available model credits/permissions.
- This starter does not claim to autonomously complete outside actions (like sending email or deploying code) because no external tools are connected yet.
- Chat history is stored only in the local browser profile. It is not synced across devices.
- API requests are sent to the Vercel AI Gateway. Review your provider and Gateway data policies before use.
