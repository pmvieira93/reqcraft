# Manifest Version Information

## Current Status: Using Manifest V2

This extension uses **Manifest V2** for maximum compatibility with both Chrome and Firefox.

## Why Manifest V2?

### The Problem with Manifest V3

**Chrome Manifest V3** has removed support for **blocking webRequest** API for regular extensions. This API is essential for our extension to intercept and modify HTTP requests in real-time.

- ❌ Blocking webRequest is **NOT available** in Chrome MV3 for public extensions
- ✅ Blocking webRequest is **ONLY available** for enterprise force-installed extensions
- ⚠️ Firefox doesn't yet support service workers for webRequest blocking

### What This Means

For a request interception extension like this one, **Manifest V2 is required** to work properly in both browsers.

## Browser Compatibility

| Browser | Manifest V2 | Manifest V3 |
|---------|-------------|-------------|
| Chrome | ✅ Works (until mid-2025) | ❌ No blocking webRequest |
| Firefox | ✅ Works | ❌ Service workers not supported |
| Edge | ✅ Works (until mid-2025) | ❌ No blocking webRequest |

## Timeline

- **June 2024**: Chrome removed webRequestBlocking from Manifest V3
- **January 2025**: Manifest V2 deprecation begins for Chrome extensions
- **Mid-2025**: Manifest V2 will stop working in Chrome (estimated)

## Future Migration Path

When Manifest V2 is fully deprecated, this extension will need to:

1. **Option A**: Use `declarativeNetRequest` API instead
   - ⚠️ Much more limited - can only do pattern-based modifications
   - ❌ Cannot do dynamic modifications based on request content
   - ❌ Cannot use JavaScript functions for dynamic values

2. **Option B**: Become an enterprise-only extension
   - Requires deployment via ExtensionInstallForcelist policy
   - Only works for managed Chrome browsers

3. **Option C**: Firefox-only
   - Continue using Manifest V2 (Firefox will support it longer)
   - Abandon Chrome support

## Files

- `manifest.json` - Current Manifest V2 (USE THIS)
- `manifest-v3.json.reference` - Manifest V3 reference (doesn't support blocking)
- `manifest.json.v1` - Old backup

## How to Load Extension

### Chrome (Current - with MV2 warning)
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this extension folder
5. ⚠️ You may see a warning about MV2 deprecation - this is expected

### Firefox
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `manifest.json` from this folder
4. ✅ Works perfectly with MV2

## Technical Details

### Why webRequestBlocking is Essential

This extension needs to:
- Intercept HTTP requests **before** they're sent
- Modify headers, query parameters, and body content
- Use dynamic JavaScript functions to generate values
- Make synchronous modifications (blocking)

None of this is possible with:
- `declarativeNetRequest` - Too limited, no dynamic modifications
- Non-blocking webRequest - Can't modify requests, only observe

### The MV3 Limitation

```javascript
// What we need (MV2):
chrome.webRequest.onBeforeRequest.addListener(
  handler,
  { urls: ["<all_urls>"] },
  ["blocking", "requestBody"]  // ❌ Not allowed in MV3
);

// What MV3 offers:
chrome.webRequest.onBeforeRequest.addListener(
  handler,
  { urls: ["<all_urls>"] },
  ["requestBody"]  // Can only observe, not modify
);
```

## Recommendations

**For Development & Testing (NOW)**:
- ✅ Use current `manifest.json` (Manifest V2)
- ✅ Works in both Chrome and Firefox
- ⚠️ Expect deprecation warnings in Chrome

**For Production (2025+)**:
- Consider Firefox-only distribution
- Or implement limited MV3 version with declarativeNetRequest
- Or target enterprise users only

## Resources

- [Chrome Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [webRequest API Deprecation](https://developer.chrome.com/docs/extensions/reference/webRequest/)
- [Firefox Extension Support](https://extensionworkshop.com/documentation/develop/)
