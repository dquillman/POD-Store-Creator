# Store Configuration Guide

## What is Load Store / Export Store?

The **Load Store** and **Export Store** buttons allow you to manage your API keys and store credentials in a secure, portable JSON file.

---

## 🔑 What Goes in a Store Configuration?

A store config file contains all your API keys and credentials:

```json
{
  "name": "DevMode Store",
  "shopifyStore": "your-store.myshopify.com",
  "shopifyAccessToken": "shpat_xxxxxxxxxxxxx",
  "printfulApiKey": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "openaiApiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

### Required Fields:
- **name**: Your store name (for display)
- **shopifyStore**: Your Shopify store URL
- **shopifyAccessToken**: Shopify Admin API token

### Optional Fields:
- **printfulApiKey**: For generating t-shirt mockups
- **openaiApiKey**: For AI design generation (DALL-E)

---

## 📥 How to Load a Store

### Step 1: Create Your Store Config File

Create a JSON file (e.g., `devmode-store.json`) with your credentials:

```json
{
  "name": "DevMode Store",
  "shopifyStore": "devmode.myshopify.com",
  "shopifyAccessToken": "shpat_abc123...",
  "printfulApiKey": "12345678-1234-1234-1234-123456789012",
  "openaiApiKey": "sk-proj-xyz789..."
}
```

### Step 2: Load It in the App

1. Click **"Load Store"** button (top right corner)
2. Select your JSON file
3. You'll see the store name appear in the top bar
4. The badge will turn green/blue indicating "Store Loaded"

### Step 3: Your APIs Are Now Active!

Once loaded:
- ✅ T-Shirt Designer can use DALL-E
- ✅ Mockup generator can use Printful
- ✅ Product listings can publish to Shopify
- ✅ All features have access to your credentials

---

## 📤 How to Export a Store

If you've loaded a store and want to save it:

1. Click **"Export Store"** button (top right)
2. A JSON file downloads automatically
3. Save it securely (it contains sensitive API keys!)

**Use Cases:**
- Backup your configuration
- Share configuration with team members (securely!)
- Switch between multiple stores
- Migrate to a new computer

---

## 🏪 Where to Find Your Store Configuration

### Option 1: Check the Root Directory

Look for files like:
```
G:\Users\daveq\DevMode_Shopify_Scripts\devmode-store.json
G:\Users\daveq\DevMode_Shopify_Scripts\store-config.json
```

### Option 2: Create a New One

If you don't have one yet, create a file called `store-config.json`:

```json
{
  "name": "My POD Store",
  "shopifyStore": "your-store.myshopify.com",
  "shopifyAccessToken": "GET_THIS_FROM_SHOPIFY",
  "printfulApiKey": "GET_THIS_FROM_PRINTFUL",
  "openaiApiKey": "GET_THIS_FROM_OPENAI"
}
```

---

## 🔐 How to Get Your API Keys

### Shopify Admin API Token

1. Go to your Shopify Admin
2. Navigate to: **Settings → Apps and sales channels → Develop apps**
3. Create a new app or use existing
4. Grant permissions: Products (read/write), Files (read/write)
5. Copy the **Admin API access token**

### Printful API Key

1. Go to: https://www.printful.com/dashboard
2. Navigate to: **Settings → API**
3. Click **"Generate new API key"**
4. Copy the key (starts with UUID format)

### OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Name it (e.g., "POD Creator")
4. Copy the key (starts with `sk-proj-` or `sk-`)
5. **Add credits** to your OpenAI account

---

## 💾 Storage Location

Store configurations are saved in:
- **Browser LocalStorage**: `pod-creator-store` key
- **Your Local Files**: Wherever you save the JSON

**Important:** LocalStorage is per-browser and per-domain. If you:
- Clear browser cache → Store config is lost
- Switch browsers → Need to reload
- Use incognito mode → Need to reload each time

**Solution:** Keep a backup JSON file on disk!

---

## 🔄 Multi-Store Support

You can manage multiple stores:

1. **Create separate JSON files:**
   ```
   devmode-store.json
   persona-patterns-store.json
   wescale-store.json
   ```

2. **Switch between them:**
   - Click "Load Store"
   - Select the JSON for the store you want
   - The app loads that store's credentials

3. **Each store can have different APIs:**
   - Different Shopify stores
   - Different Printful accounts
   - Different OpenAI keys

---

## 🛡️ Security Best Practices

### ⚠️ DO NOT:
- ❌ Commit store config files to Git
- ❌ Share your JSON files publicly
- ❌ Post API keys in screenshots
- ❌ Store in cloud folders (Dropbox, Google Drive) without encryption

### ✅ DO:
- ✅ Keep JSON files in a secure local folder
- ✅ Add `*-store.json` to your `.gitignore`
- ✅ Use different keys for dev/prod
- ✅ Rotate keys if compromised
- ✅ Backup your config files securely

---

## 🐛 Troubleshooting

### "No store to export"
- **Problem**: You haven't loaded a store yet
- **Fix**: Click "Load Store" first

### "Invalid store config"
- **Problem**: JSON is missing required fields
- **Fix**: Ensure `shopifyStore` and `shopifyAccessToken` are present

### "API call failed"
- **Problem**: Invalid or expired API keys
- **Fix**: Check your keys are correct and active

### Store not persisting between sessions
- **Problem**: Browser is clearing localStorage
- **Fix**:
  1. Check browser privacy settings
  2. Always keep a backup JSON file
  3. Reload the JSON each session if needed

---

## 📊 Example: Complete Store Setup

1. **Create `my-store.json`:**
   ```json
   {
     "name": "My Awesome Store",
     "shopifyStore": "my-awesome-store.myshopify.com",
     "shopifyAccessToken": "shpat_1234567890abcdef",
     "printfulApiKey": "12345678-90ab-cdef-1234-567890abcdef",
     "openaiApiKey": "sk-proj-abc123xyz789"
   }
   ```

2. **Open the app:**
   ```
   file:///G:/Users/daveq/DevMode_Shopify_Scripts/frontend/index.html
   ```

3. **Load the store:**
   - Click "Load Store"
   - Select `my-store.json`
   - See "My Awesome Store" in the top bar

4. **Verify it worked:**
   - Go to T-Shirt Designer
   - Click "Generate This Design Now"
   - If it works → Store is loaded correctly!

---

## 🎯 Quick Reference

| Button | What It Does |
|--------|-------------|
| **Load Store** | Import store config JSON (with API keys) |
| **Export Store** | Download current store config as JSON |
| **Store Badge** | Shows which store is loaded (green = active) |

**Remember:** The store config is YOUR API keys. Keep it safe! 🔐
