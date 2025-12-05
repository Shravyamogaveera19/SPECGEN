# LLM Setup Guide for SpecGen

SpecGen now uses Large Language Models (LLMs) to generate intelligent, contextual SDLC documentation. Follow this guide to set up your preferred LLM provider.

## Supported LLM Providers

### 1. OpenAI (Recommended)

**Pros:**

- Most affordable
- Fast response times
- Excellent documentation generation quality
- Free trial credits available

**Steps:**

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your account
3. Navigate to API keys section
4. Click "Create new secret key"
5. Copy the API key
6. In your `.env` file, add:
   ```
   OPENAI_API_KEY=sk-your-key-here
   LLM_MODEL=gpt-3.5-turbo
   ```

**Available Models:**

- `gpt-3.5-turbo` (fastest, most affordable) - **default**
- `gpt-4` (higher quality, slower, more expensive)
- `gpt-4-turbo-preview` (balanced)

**Pricing:**

- gpt-3.5-turbo: ~$0.0005 per 1K tokens
- gpt-4: ~$0.03 per 1K input tokens

### 2. Anthropic Claude

**Pros:**

- High-quality outputs
- Strong safety features
- Good context window

**Steps:**

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API keys
4. Create a new API key
5. Copy the key
6. In your `.env` file, add:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   LLM_MODEL=claude-opus-4-1
   ```

**Available Models:**

- `claude-opus` (best quality) - **default**
- `claude-opus-4-1` (latest)
- `claude-sonnet` (faster, cheaper)

**Pricing:**

- Claude Sonnet: ~$0.003 per 1K input tokens
- Claude Opus: ~$0.015 per 1K input tokens

## Configuration

### Option 1: Environment Variables

Create or update `.env` file in the `server/` directory:

```bash
# For OpenAI
OPENAI_API_KEY=sk-your-openai-key
LLM_MODEL=gpt-3.5-turbo

# OR for Anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
LLM_MODEL=claude-opus-4-1
```

### Option 2: Copy from Example

```bash
cp server/.env.example server/.env
# Then edit server/.env with your API key
```

## Verification

To verify your setup is working:

1. Start the server: `npm run dev` in the `server/` directory
2. Use the application to generate docs for a GitHub repository
3. Check the console for any API errors

## Cost Estimation

For generating documentation for 10 repositories:

**OpenAI (gpt-3.5-turbo):**

- ~2,000 tokens per doc generation
- ~4 doc generations per request
- ~8,000 tokens per request
- Cost: 10 repos × 8,000 tokens × $0.0005 = **~$0.04**

**Anthropic Claude (Sonnet):**

- ~2,000 tokens per doc generation
- ~4 doc generations per request
- ~8,000 tokens per request
- Cost: 10 repos × 8,000 tokens × $0.003 = **~$0.24**

## Troubleshooting

### "No LLM API key configured"

- Ensure you've added the API key to `.env`
- Verify the key format is correct
- Restart the server after changing `.env`

### Rate Limit Errors

- You've made too many requests in a short time
- Wait a few minutes before trying again
- Consider upgrading your API plan for higher limits

### Poor Quality Outputs

- Try a different model (GPT-4 for OpenAI, Claude Opus for Anthropic)
- The repo README helps LLM understand the project better
- More diverse dependencies improve context

### Timeout Errors

- The LLM API is taking too long to respond
- Check your internet connection
- Try again in a few minutes
- Use a faster model (gpt-3.5-turbo over gpt-4)

## Switching Providers

To switch between providers:

1. Remove the old provider's API key from `.env`
2. Add the new provider's API key
3. Update `LLM_MODEL` if needed
4. Restart the server

## Next Steps

- Generate documentation for your repositories
- Review and customize the generated documents
- Integrate SpecGen into your CI/CD pipeline
- Share SpecGen with your team

## Support

For issues with:

- **OpenAI API**: Visit [OpenAI Support](https://help.openai.com/)
- **Anthropic API**: Visit [Anthropic Support](https://support.anthropic.com/)
- **SpecGen**: Check the project README or create an issue
