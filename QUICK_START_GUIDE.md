# Quick Start Guide - ReqCraft

Get started with ReqCraft in 5 minutes! This guide walks you through installation, basic usage, and real-world test scenarios.

---

## 📦 Installation

### Firefox (Recommended - Full Functionality)

**Step 1:** Copy the Firefox manifest
```bash
cd /path/to/ReqCraft-extension
cp manifest-firefox.json manifest.json
```

**Step 2:** Load the extension
1. Open Firefox
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click **"Load Temporary Add-on"**
4. Select the `manifest.json` file
5. ✅ Done! The ReqCraft icon appears in your toolbar

### Chrome/Edge (Observation Only)

**Step 1:** Load the extension
1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the extension folder
6. ⚠️ Done! Extension can observe but not modify requests

---

## 🚀 Basic Usage

### 1. Open the Extension

Click the ReqCraft icon in your browser toolbar.

**Two Modes:**
- **Popup Mode** - Quick access for toggling rules
- **Full Tab Mode** - Click "Open in Full Tab" for extended work sessions

### 2. Create Your First Rule

1. Click **"+ Add New Rule"**
2. Fill in the basics:
   - **Name**: `Test API Header`
   - **URL Pattern**: `https://httpbin.org/*`
   - **Method**: `ALL`

3. Add a header modification:
   - Click **"+ Add Header Modification"**
   - **Action**: `Add`
   - **Name**: `X-My-Custom-Header`
   - **Value**: `test-value-123`
   - Check **"Enabled"**

4. Click **"Save Rule"**
5. Toggle the rule **ON** (switch should be blue)

### 3. Test It

1. Open the **test-httpbin.html** file in your browser
2. Click **"Test GET Request"**
3. Check the response - you should see your custom header!

Alternatively, open developer tools:
- Press **F12**
- Go to **Network** tab
- Visit `https://httpbin.org/get`
- Click the request → **Headers** section
- Look for `X-My-Custom-Header: test-value-123`

### 4. Check the Logs

1. Click the **"Logs"** tab in ReqCraft
2. See your intercepted request
3. View which rules were applied

---

## 🧪 Test Scenarios & Use Cases

### Scenario 1: Add Authentication Token

**Use Case:** Test your app with different API tokens without changing code

**Test Site:** `https://httpbin.org/bearer` (expects Authorization header)

**Rule Setup:**
- **Name**: `Add Auth Token`
- **URL Pattern**: `https://httpbin.org/bearer`
- **Method**: `GET`
- **Header Modification**:
  - Action: `Add`
  - Name: `Authorization`
  - Value: `Bearer my-test-token-12345`
  - Enabled: ✓

**Test It:**
```javascript
// Open browser console and run:
fetch('https://httpbin.org/bearer')
  .then(r => r.json())
  .then(data => console.log(data));
// Should show: { "authenticated": true, "token": "my-test-token-12345" }
```

---

### Scenario 2: Add Debug Query Parameter

**Use Case:** Enable debug mode on API requests without changing your application

**Test Site:** `https://httpbin.org/get` (echoes query parameters)

**Rule Setup:**
- **Name**: `Enable Debug Mode`
- **URL Pattern**: `https://httpbin.org/get*`
- **Method**: `GET`
- **Query Modification**:
  - Action: `Add`
  - Name: `debug`
  - Value: `true`
  - Enabled: ✓

**Test It:**
```javascript
// Visit or fetch:
fetch('https://httpbin.org/get')
  .then(r => r.json())
  .then(data => console.log(data.args));
// Should show: { "debug": "true" }
```

---

### Scenario 3: Change User Agent

**Use Case:** Test how your API handles different clients (mobile, desktop, bots)

**Test Site:** `https://httpbin.org/user-agent`

**Rule Setup:**
- **Name**: `Mobile User Agent`
- **URL Pattern**: `https://httpbin.org/user-agent`
- **Method**: `ALL`
- **Header Modification**:
  - Action: `Modify`
  - Name: `User-Agent`
  - Value: `Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)`
  - Enabled: ✓

**Test It:**
```javascript
fetch('https://httpbin.org/user-agent')
  .then(r => r.json())
  .then(data => console.log(data));
// Should show the iPhone user agent
```

---

### Scenario 4: API Endpoint Redirect

**Use Case:** Switch between staging and production APIs

**Test Site:** Any URL pattern

**Rule Setup:**
- **Name**: `Redirect to Staging`
- **URL Pattern**: `https://api.production.example.com/*`
- **Method**: `ALL`
- **URL Rewriting**:
  - Enable: ✓
  - Pattern: `https://api.production.example.com/{path}`
  - Template: `https://api.staging.example.com/{path}`

**Test It:**
- Make a request to production URL
- It will automatically redirect to staging
- Check logs to verify the redirect

---

### Scenario 5: Modify JSON Request Body

**Use Case:** Test API with different payload values

**Test Site:** `https://httpbin.org/post` (echoes POST data)

**Rule Setup:**
- **Name**: `Override User Email`
- **URL Pattern**: `https://httpbin.org/post`
- **Method**: `POST`
- **Body Modification**:
  - Action: `Change Value`
  - Path: `$.email`
  - Value: `test@example.com`
  - Enabled: ✓

**Test It:**
```javascript
fetch('https://httpbin.org/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'original@example.com', name: 'John' })
})
  .then(r => r.json())
  .then(data => console.log(data.json));
// Should show: { "email": "test@example.com", "name": "John" }
```

---

### Scenario 6: Remove Tracking Headers

**Use Case:** Test without tracking/analytics headers

**Test Site:** Any site with tracking

**Rule Setup:**
- **Name**: `Remove Tracking`
- **URL Pattern**: `https://*/*`
- **Method**: `ALL`
- **Header Modifications**:
  - Action: `Remove`, Name: `X-Analytics-ID`, Enabled: ✓
  - Action: `Remove`, Name: `X-Tracking-Token`, Enabled: ✓

---

## 🌐 Recommended Test Websites

### HTTPBin.org
**Best for:** Header, query parameter, and method testing

- `https://httpbin.org/get` - Test GET requests
- `https://httpbin.org/post` - Test POST with body
- `https://httpbin.org/headers` - See all headers
- `https://httpbin.org/bearer` - Test Authorization header
- `https://httpbin.org/user-agent` - Test User-Agent modification
- `https://httpbin.org/anything` - Accepts any method, returns everything

### JSONPlaceholder
**Best for:** Testing API modifications

- `https://jsonplaceholder.typicode.com/posts` - GET collection
- `https://jsonplaceholder.typicode.com/posts/1` - GET single item
- `https://jsonplaceholder.typicode.com/posts` (POST) - Create resource

### ReqRes.in
**Best for:** Testing authentication flows

- `https://reqres.in/api/users` - User API
- `https://reqres.in/api/login` - Login endpoint
- `https://reqres.in/api/register` - Registration endpoint

### Postman Echo
**Best for:** Advanced testing scenarios

- `https://postman-echo.com/get` - Echo GET parameters
- `https://postman-echo.com/post` - Echo POST data
- `https://postman-echo.com/headers` - Echo headers

---

## 💡 Pro Tips

### Tip 1: Use Wildcards Wisely
- `https://api.example.com/*` - Match all API endpoints
- `https://*/api/*` - Match any domain with `/api/` path
- `*://example.com/*` - Match both HTTP and HTTPS

### Tip 2: Test Incrementally
1. Start with broad patterns (e.g., `*`)
2. Verify rule triggers in Logs tab
3. Narrow pattern to specific URLs

### Tip 3: Use Full Tab Mode
- Better for managing multiple rules
- Responsive grid layout
- Easier to compare rules side-by-side

### Tip 4: Check Browser Console
- Press **F12** → Console
- Look for ReqCraft log messages
- Check for any error messages

### Tip 5: Master Toggle
- Use the main toggle to quickly disable ALL rules
- Great for A/B testing (with/without modifications)

---

## 🐛 Troubleshooting

### Rule Not Triggering?

1. ✓ **Master toggle is ON** (top of popup)
2. ✓ **Individual rule toggle is ON**
3. ✓ **URL pattern matches** - Try using `*` to test
4. ✓ **Method matches** - Try using `ALL`
5. ✓ **Check Logs tab** - See if request was intercepted

### Headers Not Showing?

- Some headers are protected (Host, Origin, Referer)
- Use custom headers with `X-` prefix
- Check Network tab in DevTools (F12 → Network)

### Using Chrome?

⚠️ Remember: Chrome can only **observe** requests, not modify them. Use Firefox for full functionality.

---

## 📚 Next Steps

Once you're comfortable with basic rules:

1. **Explore Advanced Features**
   - URL rewriting with variables
   - JSONPath for complex body modifications
   - Method-specific rules

2. **Create Rule Libraries**
   - Save rules for different projects
   - Export/import rules (future feature)

3. **Read Full Documentation**
   - See `README.md` for complete feature list
   - Check `BROWSER_SETUP.md` for technical details

---

## 🎯 Quick Reference

| Feature | How To |
|---------|--------|
| Add header | Rule → "+ Add Header Modification" |
| Add query param | Rule → "+ Add Query Modification" |
| Modify body | Rule → "+ Add Body Modification" |
| Rewrite URL | Rule → Enable URL Rewriting |
| View logs | Click "Logs" tab |
| Disable all | Toggle main switch |
| Full screen | Click "Open in Full Tab" |

---

**Happy Request Crafting! 🚀**

Need help? Check the [full README](README.md) or open an issue on GitHub.
