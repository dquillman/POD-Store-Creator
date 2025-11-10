# T-Shirt Designer - Quick Start Guide

## 🚀 EXACT STEPS TO SEE A T-SHIRT PREVIEW

### Prerequisites Check:
1. ✅ Backend is running on http://localhost:8080 (already confirmed)
2. ✅ You have a store config JSON file with API keys

---

## Step-by-Step Instructions:

### Step 1: Open the Frontend
1. Open this file in Chrome or Edge:
   ```
   file:///G:/Users/daveq/DevMode_Shopify_Scripts/frontend/index.html
   ```

### Step 2: Load Your Store Configuration
1. Click **"Load Store"** button (top right corner)
2. Select your store JSON file (contains OpenAI & Printful API keys)
3. You should see "Store Loaded" indicator turn blue/green

### Step 3: Switch to T-Shirt Designer
1. At the top, click the **"App" dropdown**
2. Select **"WeScale POD Console"**
3. Click the **"T-Shirt Designer"** tab

### Step 4: Create Your First Design
1. In the **center panel** (Prompt Builder), you'll see:
   - Positive Prompt textarea
   - Negative Prompt textarea
   - Settings (Background, Model, Canvas Size)

2. **Enter a prompt**, for example:
   ```
   DevMode logo with bold typography, white text, minimalist design, clean and modern
   ```

3. **Click the BIG GREEN BUTTON**:
   ```
   🎨 Generate This Design Now
   ```

### Step 5: Wait for Generation
1. Button changes to "⏳ Generating..."
2. You'll see toast messages:
   - "Generating design with DALL-E..."
   - "Design created! Generating mockup..."
   - "✅ Design complete! Check the preview panel →"

3. **Total wait time: 20-40 seconds**
   - 10-15 seconds for DALL-E to generate the design
   - 10-20 seconds for Printful to create the mockup

### Step 6: View Your T-Shirt
1. Look at the **right panel** (Preview section)
2. You should now see:
   - **Front tab**: Full t-shirt mockup image
   - **Detail tab**: Close-up of your design
   - **Lifestyle tab**: Model wearing the shirt (if available)

3. At the bottom, you'll see:
   - ❌ **Reject** button (red)
   - ✅ **Accept** button (green)
   - 💾 **Download PNG** button
   - 📥 **Download Mockup** button

---

## 🧪 Test with Mock Mode (No API Keys)

If you don't have API keys configured:

1. Skip "Step 2: Load Store"
2. Continue with Steps 3-6
3. You'll get **placeholder images** instead of real AI-generated designs
4. The workflow will still work - just with mock data

---

## ✅ Success Criteria

You'll know it worked when you see:
- ✅ Real t-shirt mockup image in the preview panel
- ✅ Accept/Reject buttons appear at the bottom
- ✅ Design appears in the queue (left panel) with green "ready" status

---

## ❌ Troubleshooting

### "API call failed" error
- **Check**: Backend is running (`netstat -ano | findstr :8080` should show output)
- **Fix**: Restart backend with `cd backend && npm start`

### "Mock image" appears instead of real design
- **Check**: Store config is loaded (top right should show store name)
- **Fix**: Load a valid store JSON with `openaiApiKey` and `printfulApiKey`

### "Generation failed" error
- **Check**: Your OpenAI API key has credits
- **Check**: Your Printful API key is valid
- **Fix**: Verify keys in your store config JSON

### Preview panel shows placeholder emoji instead of image
- **Wait**: Generation takes 20-40 seconds total
- **Check**: Toast messages for progress updates
- **Check**: Browser console (F12) for any errors

---

## 💡 Quick Tips

1. **Start simple**: Use a basic prompt like "DevMode logo, white text"
2. **Be patient**: First generation takes 30-40 seconds
3. **Check queue**: Generated designs appear in left panel
4. **Click designs**: Click queue items to switch between them
5. **Download**: Use download buttons to save your favorites

---

## 🎨 Example Prompts to Try

```
1. "DevMode logo with circuit board pattern, white on black, tech aesthetic"

2. "Minimalist code brackets with DevMode text, clean typography"

3. "Retro 80s style DevMode logo, neon colors, vintage computing"

4. "Terminal window with DevMode branding, monospace font, hacker theme"

5. "Geometric shapes forming DevMode wordmark, modern abstract design"
```

---

## 🔄 Workflow Summary

```
Enter Prompt → Click Generate → Wait 30s → View Preview → Accept/Reject → Download
```

That's it! You should now see real AI-generated t-shirt designs with mockups.
