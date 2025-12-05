# 🚀 Getting Started with SpecGen LLM Integration

## The Good News! ✅

Your SpecGen application now generates documentation using **Artificial Intelligence**!

Instead of template-based documentation, SpecGen now uses cutting-edge LLMs (Large Language Models) to:

- 🧠 Understand your repository
- 📝 Generate intelligent, contextual documentation
- 📊 Create professional SDLC documents
- 📥 Export as PDF

## What You Need (2 Steps)

### 1️⃣ Get an API Key

**Option A: OpenAI (Recommended)** ⭐ _Cheapest & Fastest_

- Go to: https://platform.openai.com/api-keys
- Sign up (free account)
- Create an API key
- Copy it to clipboard

**Option B: Anthropic Claude** _Higher Quality_

- Go to: https://console.anthropic.com/
- Sign up (free account)
- Create an API key
- Copy it to clipboard

### 2️⃣ Configure SpecGen

1. Open `server/.env` file
2. Add your API key:

**For OpenAI:**

```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
LLM_MODEL=gpt-3.5-turbo
```

**For Anthropic:**

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
LLM_MODEL=claude-opus-4-1
```

3. Save the file
4. Restart the server

## Start Using It! 🎉

### In Terminal 1 (Backend):

```bash
cd server
npm run dev
```

### In Terminal 2 (Frontend):

```bash
cd client
npm run dev
```

### In Browser:

1. Open http://localhost:5173
2. Enter a GitHub repo URL (e.g., https://github.com/vuejs/vue)
3. Click "Generate Documentation"
4. See the magic happen! ✨
5. Download as PDF

## What Gets Generated?

📄 **4 Professional Documents**:

1. **Functional Requirements**

   - What the project does
   - Key features
   - Business requirements

2. **System Design**

   - How it's built
   - Architecture overview
   - Component interactions

3. **Test Plan**

   - How to test it
   - Test strategies
   - Quality assurance

4. **Deployment Guide**
   - How to deploy
   - Setup instructions
   - Operations guide

## Cost? 💰

**Very Cheap!**

For 10 repositories:

- **OpenAI gpt-3.5-turbo**: ~$0.04 (basically free!)
- **Anthropic Claude**: ~$0.24

You'll also get **free credits** with your first signup:

- OpenAI: $5 free credit
- Anthropic: Free trial

## Troubleshooting

### "I don't see an API key option"

→ Make sure you're on the right website:

- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/

### "Server says no API key"

→ Check:

1. You added the key to `server/.env`
2. No typos in the key
3. You restarted the server
4. Key is not expired

### "Documentation looks generic"

→ Try GPT-4 instead:

```
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4
```

(Costs more but better quality)

### "Generation is slow"

→ Use faster model:

```
LLM_MODEL=gpt-3.5-turbo  # Fast and cheap
```

## Advanced Tips 💡

### Switching Between Providers

Want to try both? No problem!

1. Have both keys in `.env`:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

2. OpenAI is checked first, so it'll use that
3. To switch to Anthropic, comment out OpenAI:

```
# OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Using Different Models

```bash
# Fast & Cheap
LLM_MODEL=gpt-3.5-turbo

# Better Quality (slower, more expensive)
LLM_MODEL=gpt-4

# Balanced
LLM_MODEL=gpt-4-turbo-preview
```

### Saving Money

1. Start with `gpt-3.5-turbo` (it's good!)
2. Only upgrade to GPT-4 for important projects
3. Use Claude Sonnet instead of Opus
4. Generate docs for similar projects in batch

## What's Different from Before?

### Old Way (Template-Based) ❌

- Fixed templates
- Generic content
- No AI understanding
- Limited context

### New Way (LLM-Based) ✅

- **Smart generation**
- **Contextual content**
- **AI understands your code**
- **Professional output**
- **Faster document creation**
- **Better recommendations**

## Next Steps

1. ✅ Get API key (5 minutes)
2. ✅ Update `.env` (1 minute)
3. ✅ Restart server (1 minute)
4. ✅ Generate your first docs (2 minutes)
5. ✅ Download as PDF (1 minute)
6. ✅ Share with your team! 🎉

## Need More Help?

### Quick Questions?

→ Check `QUICK_SETUP.md`

### Detailed Setup Guide?

→ Check `LLM_SETUP.md`

### Want to Know More?

→ Check `IMPLEMENTATION_SUMMARY.md`

## Pro Tips 🎯

1. **Test with a well-documented repo first**
   → Great README = Better documentation

2. **Save your API key somewhere safe**
   → Don't commit `.env` to git

3. **Monitor your API usage**
   → Check your provider's dashboard

4. **Start with gpt-3.5-turbo**
   → It's cheap and effective

5. **Generate docs for important projects first**
   → Build your documentation library

## Support

### If Something Goes Wrong:

1. Check the error message
2. Look at troubleshooting section above
3. Review `LLM_SETUP.md`
4. Check provider's documentation
5. Check your API key is valid

### Common Errors & Fixes:

| Error                 | Fix                                 |
| --------------------- | ----------------------------------- |
| "No LLM API key"      | Add key to `.env` and restart       |
| "Invalid API key"     | Check key format and expiration     |
| "Rate limit exceeded" | Wait 60 seconds, try again          |
| "Timeout"             | Check internet, try different model |
| "Connection refused"  | Make sure server is running         |

## Success! 🎊

You're now ready to:

- Generate intelligent documentation
- Export professional PDFs
- Analyze any GitHub repository
- Create SDLC documents in seconds

**Enjoy using SpecGen with AI power!** 🚀

---

**Questions?** Check the detailed guides:

- `QUICK_SETUP.md` - 2-minute reference
- `LLM_SETUP.md` - Complete setup guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `README.md` - Project overview

**Last Updated**: December 5, 2025
