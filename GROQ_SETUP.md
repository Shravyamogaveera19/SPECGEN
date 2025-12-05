# Groq Setup Guide - FREE & FAST LLM

## What's Groq?

Groq is a **free**, **fast**, and **unlimited** LLM inference platform. Perfect for SpecGen!

**Advantages:**

- ✅ **Completely Free** - No credit card required
- ✅ **Super Fast** - 100+ tokens/second (faster than any paid API)
- ✅ **Unlimited** - No usage limits on free tier
- ✅ **Powerful Models** - Mixtral 8x7B, Llama 2, etc.
- ✅ **Easy Setup** - Just 2 minutes

## Quick Setup (2 Minutes)

### Step 1: Get Your Free API Key

1. Go to **https://console.groq.com/keys**
2. Sign up (no credit card required)
3. Create a new API key
4. Copy your key

### Step 2: Add to `.env`

Edit `server/.env`:

```bash
GROQ_API_KEY=gsk_your_key_here
```

### Step 3: Restart & Use

```bash
cd server
npm run dev
```

Then open http://localhost:5173 and generate documentation!

## Available Models

Groq supports several fast models:

- **mixtral-8x7b-32768** (Default) - Best balance of speed & quality
- **llama2-70b-4096** - Higher quality
- **gemma-7b-it** - Fastest, lighter weight

All are **free and unlimited** on Groq!

## Usage Example

Once configured, the system will:

1. Clone GitHub repository
2. Analyze code structure
3. Generate 4 documents using Groq:
   - Functional Requirements
   - System Design
   - Test Plan
   - Deployment Guide
4. Export as PDF

All **completely free** and **super fast**!

## Current Status

✅ **Backend**: Running on http://localhost:3000  
✅ **Frontend**: Running on http://localhost:5173  
✅ **Groq Integration**: Active  
✅ **Models**: Available

## Pricing

**Groq Free Tier:**

- Unlimited requests
- Up to 10,000 tokens/minute per model
- No credit card needed
- No usage limits

**Cost: $0** 🎉

## Troubleshooting

### "GROQ_API_KEY not configured"

→ Add your key to `server/.env` and restart

### "Rate limit exceeded"

→ Free tier has 10k tokens/min limit, wait a minute and try again

### "API error"

→ Check your internet connection
→ Verify key is correct at https://console.groq.com/keys

## Next Steps

1. **Get your API key** from https://console.groq.com/keys
2. **Add to `.env`** in server directory
3. **Restart servers** with `npm run dev`
4. **Generate documentation!** for any GitHub repository

## Support

- Groq Dashboard: https://console.groq.com
- Groq Docs: https://console.groq.com/docs
- API Status: https://status.groq.com

---

**Enjoy free, fast documentation generation! 🚀**
