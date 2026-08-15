# Brand Assets

## Logo Files

Place your Krib logo files here:

1. **krib-logo.png** - Full logo with text (use the image you provided)
2. **krib-icon.png** - Just the house icon part (for favicon)
3. **krib-logo.svg** - SVG version (optional, for better scaling)

## Current Logo
The Krib logo should be saved as:
- `/public/brand/krib-logo.png` (Main logo)
- `/public/brand/krib-icon.png` (Icon only for favicon)

## Usage
Reference in your app as:
- `/brand/krib-logo.png` in src code
- Set in .env.local: `NEXT_PUBLIC_BRAND_LOGO_URL=/brand/krib-logo.png`

## For Public URL (CDN)
If you want to use a CDN URL instead:
1. Upload to Cloudinary, ImgBB, or GitHub
2. Get the public URL
3. Update NEXT_PUBLIC_BRAND_LOGO_URL in .env.local
