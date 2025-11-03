# ReqCraft - HTTP ReqCraft & Modifier

A browser extension that intercepts and modifies HTTP requests before they reach the server. Perfect for developers, testers, and API debugging workflows.

## Overview

ReqCraft gives you complete control over outgoing HTTP requests. Create rules to automatically modify headers, query parameters, request bodies, and even rewrite URLs on the fly. Whether you're testing APIs, debugging applications, or developing integrations, ReqCraft streamlines your workflow.

## What Can You Do?

- **Modify Headers** - Add authentication tokens, change user agents, remove tracking headers
- **Edit Query Parameters** - Inject debug flags, override API versions, test different parameter values
- **Rewrite URLs** - Redirect requests from production to staging, change API endpoints
- **Transform Request Bodies** - Modify JSON payloads, test different data structures
- **Pattern Matching** - Use wildcards to match multiple URLs with a single rule
- **Method Filtering** - Apply rules only to specific HTTP methods (GET, POST, PUT, DELETE, etc.)
- **Request Logging** - Monitor all intercepted requests and see which rules were applied

## Browser Support

> **⚠️ IMPORTANT: Browser Compatibility (October 2025)**

| Browser | Functionality | Manifest Version | Notes |
|---------|--------------|------------------|-------|
| **Firefox** | ✅ Full Support | V2 | Can intercept and modify all requests |
| **Chrome/Edge** | ⚠️ Observation Only | V3 | Can observe requests but cannot modify them |

**Why the difference?** Chrome deprecated the blocking webRequest API in Manifest V3, removing the ability to modify requests. Firefox still supports Manifest V2 with full modification capabilities.

**Recommendation:** Use Firefox for full functionality.

## Quick Start

📖 **See [`QUICK_START_GUIDE.md`](QUICK_START_GUIDE.md)** for:
- Installation instructions
- How to use the extension
- Real-world use cases and examples
- Test websites to try it out

## Key Features

✅ **Header Modifications** - Add, modify, or remove HTTP request headers  
✅ **Query Parameter Control** - Manipulate URL query strings  
✅ **URL Rewriting** - Pattern-based URL transformation  
✅ **JSON Body Editing** - Modify request payloads using JSONPath  
✅ **Rule-Based System** - Create reusable modification rules  
✅ **Pattern Matching** - Wildcard support for flexible URL matching  
✅ **Toggle Controls** - Enable/disable rules individually or globally  
✅ **Request Logging** - View intercepted requests and applied modifications  
✅ **Full Tab Mode** - Work in a full browser tab for extended sessions  
✅ **Responsive UI** - Adaptive layout for managing multiple rules  


## Use Cases

### API Development
- Test different authentication tokens without changing your code
- Switch between staging and production APIs
- Add debug parameters to track request flow

### Integration Testing
- Simulate different API responses by modifying requests
- Test error handling by injecting invalid data
- Verify your app handles various header combinations

### Debugging
- Add correlation IDs to trace requests across systems
- Inject verbose logging flags
- Override cache headers to force fresh data

### Security Testing
- Test how your application handles manipulated requests
- Verify authentication and authorization logic
- Check CORS and header validation

## Installation

### Firefox (Recommended - Full Functionality)

1. **Prepare the extension:**
   ```bash
   cp manifest-firefox.json manifest.json
   ```

2. **Load in Firefox:**
   - Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the extension directory
   - The extension icon will appear in your toolbar

✅ You now have full request modification capabilities!

### Chrome/Edge (Observation Only)

1. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension directory
   - The extension icon will appear in your toolbar

⚠️ **Note:** Chrome can only observe requests, not modify them. For full functionality, use Firefox.

## How to Use

### Basic Workflow

1. **Open the Extension**
   - Click the ReqCraft icon in your browser toolbar
   - The popup provides quick access to rules

2. **Create a Rule**
   - Click "+ Add New Rule"
   - Give it a descriptive name
   - Set URL pattern (e.g., `https://api.example.com/*`)
   - Choose HTTP method (GET, POST, ALL, etc.)

3. **Add Modifications**
   - Add headers, query parameters, or body modifications
   - Enable the modifications you want to apply

4. **Save and Test**
   - Click "Save Rule"
   - Navigate to a page that makes matching requests
   - Check the Logs tab to see intercepted requests

### Pro Tips

- **Use the Full Tab Mode** - Click "Open in Full Tab" for better workspace when managing many rules
- **Test with wildcards** - Use `*` to match any URL segment
- **Check the logs** - The Logs tab shows exactly what was intercepted
- **Toggle rules easily** - Disable rules you're not actively using

## Technical Details

### Architecture

- **Background Script** (`background.js`) - Intercepts requests using webRequest API
- **Popup Interface** (`popup.html`, `popup.js`) - User interface for managing rules
- **Storage API** - Persists rules and settings across browser sessions

### Permissions

- `webRequest` - Monitor HTTP requests
- `webRequestBlocking` - Modify requests (Firefox only)
- `storage` - Save rules and preferences
- `<all_urls>` - Intercept requests to any domain

### Pattern Matching

URL patterns support wildcard matching:
- `*` matches any characters
- `https://example.com/*` - All URLs on the domain
- `https://*/api/users` - Any domain with that path
- `*://example.com/*` - HTTP or HTTPS on the domain

### Limitations

- **Chrome**: Cannot modify requests due to Manifest V3 restrictions
- **Protected Headers**: Some headers (Host, Origin) cannot be modified by browser security
- **CORS**: Modified requests may trigger CORS checks
- **Body Modifications**: Only JSON content-type is supported

## Troubleshooting

### Rules Not Working?

1. ✓ **Master toggle enabled** - Check the main switch at the top
2. ✓ **Rule enabled** - Individual rule toggle should be ON
3. ✓ **URL pattern matches** - Test with a broader pattern like `*`
4. ✓ **Browser support** - Using Firefox for modifications?
5. ✓ **Check logs** - Logs tab shows if rule was triggered

### Headers Not Appearing?

- Some headers are protected by browsers (Host, Referer, Origin)
- Use custom headers with `X-` prefix (e.g., `X-Custom-Token`)
- Check Network tab in DevTools to verify headers

### Debug Console

View detailed logs in the background console:
- **Firefox**: `about:debugging` → This Firefox → Inspect (next to extension)
- **Chrome**: Extensions page → Details → Inspect views: service worker

## Project Structure

```
.
├── manifest.json              # Extension manifest (Chrome/current)
├── manifest-firefox.json      # Firefox-specific manifest
├── background.js             # Request interception logic
├── popup.html               # Extension UI
├── popup.js                 # UI logic and rule management
├── content.js               # Content script (if needed)
├── icons/                   # Extension icons
├── test-*.html             # Test pages for verification
└── *.md                    # Documentation
```

## Contributing

Contributions are welcome! When contributing:

1. Test on both Firefox and Chrome
2. Verify modifications work in Firefox
3. Ensure observation mode works in Chrome
4. Update documentation as needed
5. Follow existing code style

## License

MIT License - See LICENSE file for details

## Additional Documentation

- **[QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)** - Usage guide with examples
- **[BROWSER_SETUP.md](BROWSER_SETUP.md)** - Detailed browser setup
- **[MANIFEST_VERSION_INFO.md](MANIFEST_VERSION_INFO.md)** - Technical background on manifest versions

---

**Built for developers, by developers.** Happy request crafting! 🚀
