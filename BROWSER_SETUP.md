# Browser Setup Guide

## 🚨 IMPORTANT: Different Browsers Need Different Setup

Due to Chrome deprecating Manifest V2 in 2025, this extension now has **two different manifest files**:

- **`manifest-chrome.json`** - For Chrome (Manifest V3) - **OBSERVATION MODE ONLY**
- **`manifest-firefox.json`** - For Firefox (Manifest V2) - **FULL MODIFICATION SUPPORT**

## ⚠️ Chrome Limitation (October 2025+)

**Chrome no longer supports blocking webRequest modifications** for regular extensions.

### What works in Chrome:
- ✅ View and manage rules
- ✅ Observe/log matching requests
- ✅ See which rules would match

### What DOESN'T work in Chrome:
- ❌ Actually modifying request headers
- ❌ Actually modifying query parameters
- ❌ Actually modifying request body
- ❌ URL rewriting

**If you need full modification support, use Firefox.**

---

## 🦊 Firefox Setup (RECOMMENDED - Full Functionality)

Firefox still supports Manifest V2 with full blocking capabilities.

### Steps:

1. **Navigate to the extension folder**:
   ```bash
   cd /path/to/ReqCraft-extension
   ```

2. **Copy the Firefox manifest**:
   ```bash
   cp manifest-firefox.json manifest.json
   ```

3. **Load in Firefox**:
   - Open Firefox
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on..."
   - Select `manifest.json` from this folder

4. **Test it**:
   - Click the extension icon
   - Create a rule
   - Make a matching request
   - ✅ Request will be **actually modified**!

### Permanent Installation (Firefox):
To keep it installed permanently:
- Package as `.xpi` file
- Submit to Firefox Add-ons store
- Or use Firefox Developer Edition with extended temporary add-on support

---

## 🌐 Chrome Setup (Limited - Observation Only)

Chrome with Manifest V3 can only observe requests, not modify them.

### Steps:

1. **Ensure you're using the Chrome manifest**:
   - The repository's `manifest.json` is already configured for Chrome MV3
   - If you previously switched to Firefox, restore it:
     ```bash
     git checkout manifest.json
     # OR copy from reference:
     cp manifest-v3.json.reference manifest.json
     ```

2. **Load in Chrome**:
   - Open Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select this extension folder

3. **Test it**:
   - Click the extension icon
   - Create a rule
   - Make a matching request
   - ⚠️ Request will be **logged but NOT modified**
   - Check the console to see: "⚠️ Non-blocking mode (Manifest V3)"

### What You'll See:
```
ReqCraft running in Manifest V3 mode
⚠️ Running in Chrome MV3: Blocking modifications are NOT supported.
⚠️ For full functionality, use Firefox with manifest-firefox.json
```

---

## 📊 Feature Comparison

| Feature | Firefox (MV2) | Chrome (MV3) |
|---------|---------------|--------------|
| View rules | ✅ Yes | ✅ Yes |
| Create rules | ✅ Yes | ✅ Yes |
| Log matching requests | ✅ Yes | ✅ Yes |
| **Modify headers** | ✅ **Yes** | ❌ **No** |
| **Modify query params** | ✅ **Yes** | ❌ **No** |
| **Modify body** | ✅ **Yes** | ❌ **No** |
| **URL rewriting** | ✅ **Yes** | ❌ **No** |
| Dynamic functions | ✅ Yes | ⚠️ Simulated only |
| Persistent background | ✅ Yes | ⚠️ Service worker |

---

## 🔄 Switching Between Browsers

### From Chrome to Firefox:
```bash
cp manifest-firefox.json manifest.json
```
Then reload in Firefox.

### From Firefox to Chrome:
```bash
cp manifest-chrome.json manifest.json
```
Then reload in Chrome.

---

## 🛠️ Development Workflow

### For Full Testing (Recommended):
1. Use **Firefox** with `manifest-firefox.json`
2. Test all modification features
3. Verify rules work correctly

### For Chrome Compatibility Check:
1. Switch to `manifest-chrome.json` (MV3)
2. Load in Chrome
3. Verify UI and observation features work
4. Accept that modifications won't actually happen

---

## 📁 File Reference

- **`manifest-chrome.json`** - Chrome MV3 manifest (default in repo)
- **`manifest-firefox.json`** - Firefox MV2 manifest (full features)
- **`background.js`** - Auto-detects manifest version and adjusts behavior
- **`MANIFEST_VERSION_INFO.md`** - Technical details about the MV2/MV3 situation

---

## 🤔 Why This Complexity?

**June 2024**: Google removed blocking webRequest from Manifest V3
**2025**: Chrome stopped accepting Manifest V2 extensions
**Result**: Impossible to modify requests in Chrome anymore (for regular extensions)

### Options Going Forward:

1. **Use Firefox** (Recommended) - Still supports MV2
2. **Chrome Enterprise** - Deploy via ExtensionInstallForcelist policy
3. **Accept Chrome limitations** - Observation-only mode
4. **Rewrite using declarativeNetRequest** - Very limited, no dynamic modifications

---

## ✅ Quick Start

**Want full functionality? Use Firefox:**
```bash
cp manifest-firefox.json manifest.json
# Load in Firefox at about:debugging
```

**Just testing UI in Chrome?**
```bash
# manifest.json is already set up for Chrome
# Load in Chrome at chrome://extensions/
```

---

## 📝 Notes

- The extension **automatically detects** which manifest version it's running
- Console logs will show: `Running in Manifest V2 mode` or `Running in Manifest V3 mode`
- Chrome console will show warnings about observation-only mode
- Firefox will show confirmation of blocking mode enabled

---

## 🆘 Troubleshooting

### "Manifest version not supported" in Chrome
- ✅ Make sure you're using `manifest-chrome.json` (MV3)
- ❌ Don't use `manifest-firefox.json` in Chrome

### "service_worker is disabled" in Firefox
- ✅ Make sure you copied `manifest-firefox.json` to `manifest.json`
- ❌ Don't use the Chrome MV3 manifest in Firefox

### Rules not modifying requests in Chrome
- ⚠️ This is expected! Chrome MV3 doesn't support modifications
- ✅ Switch to Firefox for full functionality
