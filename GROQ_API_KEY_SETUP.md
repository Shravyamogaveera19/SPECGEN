# 🔑 Groq API Key Setup - Fix "Invalid API Key" Error

## The Problem

You're seeing this error:

```
Error: Groq API error: 401 {"error":{"message":"Invalid API Key"}}
```

This means your Groq API key is either invalid, expired, or not set correctly.

## ✅ Solution (2 Minutes)

### Step 1: Get a Fresh API Key

1. **Open Groq Console**: https://console.groq.com/keys
2. **Sign up/Login** (completely free, no credit card)
3. **Delete old keys** (if any exist)
4. **Click "Create API Key"**
5. **Copy the new key** (starts with `gsk_`)

### Step 2: Update Your `.env` File

1. Open `server/.env`
2. Find this line:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```
3. Replace with your actual key:
   ```
   GROQ_API_KEY=gsk_YOUR_ACTUAL_KEY_HERE
   ```
4. **Save the file**

### Step 3: Restart the Server

```powershell
cd c:\Users\shrav\SpecGen\server
npm run dev
```

You should see:

```
✓ Groq client initialized
- GROQ_API_KEY: ✓ Configured
Server listening on http://localhost:3000
```

## 🔍 Common Issues

### Issue: "Invalid API Key"

**Cause**: Key is wrong, expired, or has extra spaces  
**Fix**: Generate a brand new key from Groq Console

### Issue: "GROQ_API_KEY not configured"

**Cause**: `.env` file not loaded or key not set  
**Fix**: Make sure `.env` is in `server/` folder and has no typos

### Issue: "Rate limit exceeded"

**Cause**: Too many requests (10k tokens/min limit)  
**Fix**: Wait 1 minute and try again

### Issue: Key has spaces/newlines

**Cause**: Copy-paste added extra characters  
**Fix**:

```bash
# WRONG (has quotes)
GROQ_API_KEY="gsk_your_key"

# WRONG (has spaces)
GROQ_API_KEY= gsk_your_key

# CORRECT
GROQ_API_KEY=gsk_your_key
```

## 📋 Checklist

Before running the server, verify:

- [ ] You have a valid Groq API key (from https://console.groq.com/keys)
- [ ] Key is in `server/.env` file (not `client/.env`)
- [ ] Key has no quotes, spaces, or extra characters
- [ ] Line looks like: `GROQ_API_KEY=gsk_...`
- [ ] You saved the `.env` file
- [ ] You restarted the server after editing

## 🎯 Quick Test

After setting your key, test it:

```powershell
cd c:\Users\shrav\SpecGen\server
npm run dev
```

Look for these messages:

```
✓ Groq client initialized          ← Good!
- GROQ_API_KEY: ✓ Configured       ← Good!
Server listening on http://localhost:3000
```

If you see these, you're ready to generate documentation!

## 🆘 Still Having Issues?

1. **Double-check your key**: Copy it again from https://console.groq.com/keys
2. **Check for typos**: Make sure `GROQ_API_KEY` is spelled correctly
3. **Verify file location**: `.env` should be in `server/` folder (not root)
4. **Check key format**: Should start with `gsk_` and be ~50+ characters
5. **Try a new key**: Delete old key in Groq Console, create a new one

## 🚀 Next Steps

Once your key is working:

1. Open http://localhost:5173
2. Enter any GitHub repository URL
3. Click "Generate Documentation"
4. Download your generated SDLC docs as PDF!

---

**Need a Groq account?** → https://console.groq.com (free, no credit card!)
