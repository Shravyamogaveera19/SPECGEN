# SpecGen - LLM Configuration Quick Reference

## 🚀 Quick Setup (2 minutes)

### Step 1: Get API Key

Choose ONE:

- **OpenAI** (recommended): https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/

### Step 2: Update `.env`

```bash
# In server/.env

# For OpenAI:
OPENAI_API_KEY=sk-your-key-here

# OR for Anthropic:
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Step 3: Restart

```bash
cd server
npm run dev
```

### Step 4: Generate Docs!

1. Open http://localhost:5173
2. Enter GitHub repo URL
3. Click "Generate Documentation"
4. Download PDF

---

## 💰 Cost Comparison

| Provider  | Model         | Cost/1K Tokens | 10 Repos     |
| --------- | ------------- | -------------- | ------------ |
| OpenAI    | gpt-3.5-turbo | $0.0005        | **$0.04** ✨ |
| OpenAI    | gpt-4         | $0.03          | $2.40        |
| Anthropic | Claude Sonnet | $0.003         | $0.24        |
| Anthropic | Claude Opus   | $0.015         | $1.20        |

**Recommendation**: Start with `gpt-3.5-turbo` - it's cheap and effective!

---

## 🔧 Configuration Examples

### Option 1: OpenAI (Fastest Setup)

```bash
OPENAI_API_KEY=sk-proj-abc123...
LLM_MODEL=gpt-3.5-turbo
```

### Option 2: Anthropic (High Quality)

```bash
ANTHROPIC_API_KEY=sk-ant-abc123...
LLM_MODEL=claude-opus-4-1
```

---

## 📋 What Gets Generated

Each repository generates 4 documents:

1. **Functional Requirements**

   - Project overview
   - Functional requirements
   - Non-functional requirements
   - Dependencies

2. **System Design**

   - Architecture overview
   - Components and interactions
   - API design
   - Database schema
   - Security architecture

3. **Test Plan**

   - Testing strategy
   - Unit testing approach
   - Integration testing
   - E2E scenarios
   - Performance testing

4. **Deployment Guide**
   - Prerequisites
   - Installation steps
   - Configuration
   - Deployment options
   - Scaling strategies

---

## ⚠️ Troubleshooting

| Problem               | Solution                              |
| --------------------- | ------------------------------------- |
| "No LLM API key"      | Add key to `.env` and restart server  |
| "Rate limit exceeded" | Wait 60 seconds, try again            |
| "Connection timeout"  | Check internet, try different model   |
| "Poor quality docs"   | Use GPT-4 or Claude Opus (costs more) |
| "Server won't start"  | Make sure `.env` has valid keys       |

---

## 📚 Full Documentation

- **Setup Guide**: See `LLM_SETUP.md`
- **Integration Status**: See `LLM_INTEGRATION_STATUS.md`
- **Project README**: See `README.md`

---

## 🎯 Pro Tips

1. **Start cheap**: Use `gpt-3.5-turbo` first
2. **Upgrade if needed**: Switch to `gpt-4` for better quality
3. **Batch processing**: Generate docs for multiple repos to save money
4. **Review output**: Always review generated docs for accuracy
5. **Customize**: Edit generated docs to match your standards

---

## 📞 Getting Help

- **API Issues**: Contact your LLM provider support
- **SpecGen Issues**: Check the GitHub issues
- **Configuration**: Review `LLM_SETUP.md`

---

**Last Updated**: December 5, 2025  
**Status**: ✅ Production Ready
