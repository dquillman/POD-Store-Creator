# Hero Banner Installation Guide

## Quick Start

### Step 1: Add Your Banner Files

Place your banner files in the `brand` folder:

```
brand/
  ├── hero-2048x1152.mp4    (recommended - video banner)
  └── banner-2048x1152.png  (fallback image)
```

**Recommended sizes:**
- Video (MP4): 2048x1152 pixels
- Image (PNG): 2048x1152 pixels

### Step 2: Run the Installation

```bash
npm run install-hero
```

That's it! The script will:
1. Find your banner files
2. Upload them to Shopify Files
3. Create the hero section in your theme
4. Add it to your homepage

---

## What Gets Installed

The hero section includes:
- Full-width video/image banner
- Centered "DEV MODE" branding
- "ENTER THE FLOW_" tagline
- Responsive design (looks good on all devices)
- Auto-play video with fallback image

---

## File Options

### Option 1: Use Standard Naming (Easiest)

Just name your files:
- `hero-2048x1152.mp4`
- `banner-2048x1152.png`

And place them in the `brand` folder.

### Option 2: Use Custom Paths

Update your `.env` file:

```env
BANNER_MP4=./path/to/your/video.mp4
BANNER_FALLBACK=./path/to/your/image.png
```

### Supported File Names

The script automatically looks for these in the `brand` folder:
- `hero-2048x1152.mp4` or `hero.mp4` or `hero-banner.mp4`
- `banner-2048x1152.png` or `banner.png` or `hero-banner.png`

---

## Testing

After installation:

1. Visit your store homepage:
   ```
   https://YOUR-STORE.myshopify.com
   ```

2. You should see the hero banner at the top

3. If using video, it should auto-play and loop

---

## Troubleshooting

### "No banner files found"

**Solution:** Add your banner files to the `brand` folder with one of the supported names.

### "Missing required environment variables"

**Solution:** Make sure your `.env` file has:
```env
SHOPIFY_STORE=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
THEME_ID=123456789
```

### "GraphQL error" or "Upload failed"

**Solution:**
1. Check your Shopify access token has the right permissions
2. Verify your theme ID is correct
3. Check file size (keep under 20MB)

### How to get your Theme ID

```bash
# List all themes
curl -X GET "https://YOUR-STORE.myshopify.com/admin/api/2025-01/themes.json" \
  -H "X-Shopify-Access-Token: YOUR_TOKEN"

# Look for "id" in the response
# Or get it from Shopify Admin -> Online Store -> Themes -> Actions -> Edit code (URL contains theme ID)
```

---

## Customization

Want to customize the hero section? The code is installed as:

```
sections/hero-devmode.liquid
```

You can edit it in Shopify Admin:
1. Go to Online Store → Themes
2. Click "Edit code"
3. Find `sections/hero-devmode.liquid`
4. Customize the HTML/CSS

---

## Removing the Hero Section

To remove the hero banner:

1. Go to Shopify Admin → Online Store → Themes
2. Click "Customize"
3. On the homepage, find the "hero-devmode" section
4. Click the X to remove it

Or run the setup script again without banner files in `.env`:
```env
BANNER_MP4=
BANNER_FALLBACK=
```

---

## Tips

### Best Practices

1. **Video Format**: Use MP4 (H.264 codec) for best compatibility
2. **Video Size**: Keep under 5MB for fast loading
3. **Video Length**: 5-15 seconds looping works best
4. **Image Fallback**: Always include a PNG fallback for older browsers
5. **Dimensions**: 2048x1152 is optimal for hero banners

### Creating a Banner Video

You can create a banner video using:
- **Canva** (free, easy to use)
- **Adobe Premiere** (professional)
- **DaVinci Resolve** (free, powerful)
- **ffmpeg** (command line, free)

Example ffmpeg command to compress:
```bash
ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset slow hero-2048x1152.mp4
```

---

## Need Help?

Run the store status checker to see what's configured:
```bash
npm run check-status
```

This will show you what files are missing and what to do next.
