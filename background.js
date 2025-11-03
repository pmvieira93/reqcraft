// Background script for request interception

// Firefox/Chrome compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Detect if we're running in Manifest V3 (Chrome) or V2 (Firefox)
const isManifestV3 = browserAPI.runtime.getManifest().manifest_version === 3;
const supportsBlocking = !isManifestV3; // Only MV2 supports blocking

console.log(`ReqCraft running in Manifest V${isManifestV3 ? '3' : '2'} mode`);
if (!supportsBlocking) {
  console.warn('⚠️ Running in Chrome MV3: Blocking modifications are NOT supported. Extension will run in observation/logging mode only.');
  console.warn('⚠️ For full functionality, use Firefox with manifest-firefox.json');
}
console.log('[Background] Extension loaded successfully');

// Predefined functions for dynamic values
class DynamicFunctions {
  static randomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static randomInteger(min = 0, max = 1000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomDecimal(min = 0, max = 1000, decimals = 2) {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
  }

  static timestamp() {
    return Math.floor(Date.now() / 1000);
  }

  static isoTimestamp() {
    return new Date().toISOString();
  }

  static pastTimestamp(secondsAgo = 3600) {
    return Math.floor((Date.now() - (secondsAgo * 1000)) / 1000);
  }

  static pastIsoTimestamp(secondsAgo = 3600) {
    return new Date(Date.now() - (secondsAgo * 1000)).toISOString();
  }

  // Evaluate a string that may contain function calls
  static evaluateValue(value) {
    if (typeof value !== 'string') return value;

    // Pattern to match $functionName or $functionName(args)
    const pattern = /\$(\w+)(\(([^)]*)\))?/g;
    
    return value.replace(pattern, (match, funcName, argsWithParens, argsStr) => {
      // Check if the function exists
      if (typeof this[funcName] === 'function') {
        try {
          // Parse arguments if provided
          let args = [];
          if (argsStr) {
            // Split by comma and trim, handle numbers
            args = argsStr.split(',').map(arg => {
              arg = arg.trim();
              // Try to parse as number
              const num = Number(arg);
              if (!isNaN(num)) return num;
              // Remove quotes if present
              return arg.replace(/^["']|["']$/g, '');
            });
          }
          
          // Call the function with arguments
          const result = this[funcName](...args);
          return result.toString();
        } catch (e) {
          console.error(`Error evaluating function ${funcName}:`, e);
          return match; // Return original if error
        }
      }
      return match; // Return original if function not found
    });
  }
}

class RequestInterceptor {
  constructor() {
    this.isEnabled = true;
    this.debugMode = false;
    this.rules = [];
    this.logs = [];
    
    // Bind handlers once to maintain reference
    this.boundHandleBeforeRequest = this.handleBeforeRequest.bind(this);
    this.boundHandleBeforeSendHeaders = this.handleBeforeSendHeaders.bind(this);
    
    this.init();
  }

  async init() {
    console.log('[RequestInterceptor] Initializing...');
    try {
      // Load saved settings
      const data = await browserAPI.storage.local.get(['isEnabled', 'rules', 'logs', 'debugMode']);
      this.isEnabled = data.isEnabled ?? true;
      this.debugMode = data.debugMode ?? false;
      this.rules = data.rules || [];
      this.logs = data.logs || [];

      console.log('[RequestInterceptor] Loaded settings:', { 
        rulesCount: this.rules.length, 
        isEnabled: this.isEnabled,
        debugMode: this.debugMode,
        logsCount: this.logs.length,
        rules: this.rules
      });

      // Set up request listeners
      this.setupRequestListeners();
      console.log('[RequestInterceptor] Initialization complete');
    } catch (error) {
      console.error('[RequestInterceptor] Failed to initialize:', error);
      // Continue with defaults
      this.rules = [];
      this.logs = [];
      this.isEnabled = true;
    }
  }

  setupRequestListeners() {
    console.log('[setupRequestListeners] Setting up listeners...');
    console.log('[setupRequestListeners] isEnabled:', this.isEnabled);
    console.log('[setupRequestListeners] supportsBlocking:', supportsBlocking);
    
    // Remove existing listeners using bound references
    if (browserAPI.webRequest.onBeforeRequest.hasListener(this.boundHandleBeforeRequest)) {
      browserAPI.webRequest.onBeforeRequest.removeListener(this.boundHandleBeforeRequest);
      console.log('[setupRequestListeners] Removed existing onBeforeRequest listener');
    }
    if (browserAPI.webRequest.onBeforeSendHeaders.hasListener(this.boundHandleBeforeSendHeaders)) {
      browserAPI.webRequest.onBeforeSendHeaders.removeListener(this.boundHandleBeforeSendHeaders);
      console.log('[setupRequestListeners] Removed existing onBeforeSendHeaders listener');
    }

    // Add listeners if enabled
    if (this.isEnabled) {
      // Determine which options to use based on manifest version
      const onBeforeRequestOptions = supportsBlocking 
        ? ["blocking", "requestBody"]
        : ["requestBody"]; // MV3: observation only
      
      const onBeforeSendHeadersOptions = supportsBlocking
        ? ["blocking", "requestHeaders", "extraHeaders"]
        : ["requestHeaders", "extraHeaders"]; // MV3: observation only

      try {
        browserAPI.webRequest.onBeforeRequest.addListener(
          this.boundHandleBeforeRequest,
          { urls: ["<all_urls>"] },
          onBeforeRequestOptions
        );
        console.log('[setupRequestListeners] ✓ onBeforeRequest listener added');
        
        if (supportsBlocking) {
          console.log('[setupRequestListeners] ✓ Blocking webRequest enabled (Manifest V2)');
        } else {
          console.warn('[setupRequestListeners] ⚠️ Non-blocking mode (Manifest V3) - requests will be logged but NOT modified');
        }
      } catch (e) {
        console.error('[setupRequestListeners] Failed to add onBeforeRequest listener:', e);
      }

      try {
        browserAPI.webRequest.onBeforeSendHeaders.addListener(
          this.boundHandleBeforeSendHeaders,
          { urls: ["<all_urls>"] },
          onBeforeSendHeadersOptions
        );
        console.log('[setupRequestListeners] ✓ onBeforeSendHeaders listener added');
      } catch (e) {
        // Fallback without extraHeaders for Firefox
        try {
          const fallbackOptions = supportsBlocking
            ? ["blocking", "requestHeaders"]
            : ["requestHeaders"];
            
          browserAPI.webRequest.onBeforeSendHeaders.addListener(
            this.boundHandleBeforeSendHeaders,
            { urls: ["<all_urls>"] },
            fallbackOptions
          );
          console.log('[setupRequestListeners] ✓ onBeforeSendHeaders listener added (without extraHeaders)');
        } catch (e2) {
          console.error('[setupRequestListeners] Failed to add onBeforeSendHeaders listener:', e2);
        }
      }
    } else {
      console.log('[setupRequestListeners] Extension is disabled, no listeners added');
    }
  }

  handleBeforeRequest(details) {
    if (!this.isEnabled) return {};

    console.log(`[handleBeforeRequest] ${details.method} ${details.url}`);

    const activeRules = this.rules.filter(rule => rule.enabled);
    console.log(`[handleBeforeRequest] Active rules count: ${activeRules.length}`);
    
    let modified = false;
    let modifications = {};
    let bodyModificationRule = null;

    for (const rule of activeRules) {
      console.log(`[handleBeforeRequest] Checking rule: ${rule.name}`);
      console.log(`[handleBeforeRequest] Rule methods:`, rule.methods);
      console.log(`[handleBeforeRequest] Request method:`, details.method);
      
      if (this.matchesRule(details.url, details.method, rule)) {
        console.log(`[handleBeforeRequest] ✓ Rule matched: ${rule.name}`);
        
        // In MV3, we can only log, not modify
        if (!supportsBlocking) {
          console.warn(`[handleBeforeRequest] ⚠️ MV3 mode - observation only`);
          this.logRuleExecution(rule, details, 'observed-only');
          continue; // Skip modifications in MV3
        }
        
        // Handle query parameter modifications (must be done here with redirect)
        if (rule.queryModifications && rule.queryModifications.length > 0) {
          console.log(`[handleBeforeRequest] Processing query modifications`);
          // Check if modifications are already applied to the current URL
          if (!this.hasQueryModificationsApplied(details.url, rule.queryModifications)) {
            const newUrl = this.modifyQueryParams(details.url, rule.queryModifications);
            if (newUrl !== details.url) {
              modifications.redirectUrl = newUrl;
              modified = true;
              console.log(`[handleBeforeRequest] ✓ Query params modified`);
              this.logRuleExecution(rule, details, 'query-params');
            }
          }
        }

        // Handle URL rewriting (will override query param redirect if both exist)
        if (rule.urlRewrite && rule.urlRewrite.enabled && rule.urlRewrite.pattern && rule.urlRewrite.template) {
          console.log(`[handleBeforeRequest] Processing URL rewrite`);
          const newUrl = this.rewriteUrl(details.url, rule.urlRewrite);
          if (newUrl !== details.url) {
            modifications.redirectUrl = newUrl;
            modified = true;
            console.log(`[handleBeforeRequest] ✓ URL rewritten`);
            this.logRuleExecution(rule, details, 'url-rewrite');
          }
        }

        // Store body modification rule for later (handled in onBeforeSendHeaders)
        if (rule.bodyModification && rule.bodyModification.enabled && details.requestBody) {
          console.log(`[handleBeforeRequest] Body modification rule detected, will be handled in onBeforeSendHeaders`);
          bodyModificationRule = rule;
        }
      } else {
        console.log(`[handleBeforeRequest] ✗ Rule did not match: ${rule.name}`);
      }
    }

    // Store body modification info for onBeforeSendHeaders to handle
    if (bodyModificationRule) {
      this.pendingBodyModifications = this.pendingBodyModifications || new Map();
      this.pendingBodyModifications.set(details.requestId, {
        rule: bodyModificationRule,
        originalBody: details.requestBody,
        details: details
      });
    }

    return modified ? modifications : {};
  }

  hasQueryModificationsApplied(url, modifications) {
    try {
      const urlObj = new URL(url);
      
      // Check if all 'add' or 'modify' modifications are already present
      for (const mod of modifications) {
        if (!mod.enabled) continue;
        
        if (mod.action === 'add' || mod.action === 'modify') {
          // Evaluate the expected value
          const expectedValue = DynamicFunctions.evaluateValue(mod.value);
          const actualValue = urlObj.searchParams.get(mod.name);
          
          // For dynamic functions, we can't predict the exact value
          // So we just check if the parameter exists
          if (mod.value && mod.value.includes('$')) {
            if (!urlObj.searchParams.has(mod.name)) {
              return false;
            }
          } else {
            // For static values, check exact match
            if (actualValue !== expectedValue) {
              return false;
            }
          }
        }
      }
      
      return true;
    } catch (e) {
      return false;
    }
  }

  handleBeforeSendHeaders(details) {
    if (!this.isEnabled) return {};

    const activeRules = this.rules.filter(rule => rule.enabled);
    let headers = [...details.requestHeaders];
    let modified = false;

    for (const rule of activeRules) {
      if (this.matchesRule(details.url, details.method, rule)) {
        // In MV3, we can only log, not modify
        if (!supportsBlocking) {
          this.logRuleExecution(rule, details, 'observed-headers');
          continue; // Skip modifications in MV3
        }
        
        // Handle header modifications
        if (rule.headerModifications && rule.headerModifications.length > 0) {
          const modifiedHeaders = this.modifyHeaders(headers, rule.headerModifications);
          if (modifiedHeaders) {
            headers = modifiedHeaders;
            modified = true;
            this.logRuleExecution(rule, details, 'headers');
          }
        }
      }
    }

    return modified ? { requestHeaders: headers } : {};
  }

  matchesRule(url, method, rule) {
    console.log(`[matchesRule] Checking rule: ${rule.name}`);
    console.log(`[matchesRule] URL pattern: ${rule.urlPattern}`);
    console.log(`[matchesRule] Request URL: ${url}`);
    
    // Check URL pattern
    if (rule.urlPattern) {
      // Escape special regex chars except * which we want to convert to .*
      const pattern = rule.urlPattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')  // Escape special chars
        .replace(/\*/g, '.*');                    // Convert * to .*
      
      console.log(`[matchesRule] Regex pattern: ${pattern}`);
      const regex = new RegExp(pattern);
      const urlMatches = regex.test(url);
      console.log(`[matchesRule] URL matches: ${urlMatches}`);
      
      if (!urlMatches) {
        return false;
      }
    }

    // Check method - support both new array format and legacy single method
    console.log(`[matchesRule] Rule methods:`, rule.methods);
    console.log(`[matchesRule] Rule method (legacy):`, rule.method);
    console.log(`[matchesRule] Request method:`, method);
    
    if (rule.methods && Array.isArray(rule.methods)) {
      // New format: array of methods
      const methodMatches = rule.methods.length === 0 || rule.methods.includes(method);
      console.log(`[matchesRule] Method matches (array): ${methodMatches}`);
      
      if (rule.methods.length > 0 && !rule.methods.includes(method)) {
        return false;
      }
    } else if (rule.method) {
      // Legacy format: single method string
      const methodMatches = rule.method === 'ALL' || rule.method === method;
      console.log(`[matchesRule] Method matches (legacy): ${methodMatches}`);
      
      if (rule.method !== 'ALL' && rule.method !== method) {
        return false;
      }
    }

    console.log(`[matchesRule] ✓ Rule matched!`);
    return true;
  }

  rewriteUrl(originalUrl, rewriteRule) {
    try {
      const { pattern, template } = rewriteRule;
      if (!pattern || !template) return originalUrl;

      // Extract parameters using named groups
      const regex = new RegExp(pattern.replace(/\{(\w+)\}/g, '(?<$1>[^/]+)'));
      const match = originalUrl.match(regex);

      if (match && match.groups) {
        let newUrl = template;
        for (const [key, value] of Object.entries(match.groups)) {
          newUrl = newUrl.replace(`{${key}}`, value);
        }
        return newUrl;
      }
    } catch (e) {
      console.error('URL rewrite error:', e);
    }
    return originalUrl;
  }

  modifyRequestBody(requestBody, modifications) {
    try {
      if (!requestBody.raw || !requestBody.raw.length) return null;

      const bodyData = requestBody.raw[0];
      if (!bodyData.bytes) return null;

      // Check if there's an override action first (highest priority)
      const overrideRule = (modifications.rules || []).find(
        mod => mod.enabled && mod.action === 'override'
      );

      if (overrideRule) {
        // Override entire body with the provided JSON
        try {
          // Evaluate dynamic functions first
          const evaluatedValue = DynamicFunctions.evaluateValue(overrideRule.value);
          
          // Validate that the override value is valid JSON
          const newBodyJson = JSON.parse(evaluatedValue);
          
          // Recursively evaluate dynamic functions in nested values
          const evaluatedBodyJson = this.evaluateDynamicValuesInObject(newBodyJson);
          
          const newBodyString = JSON.stringify(evaluatedBodyJson);
          const encoder = new TextEncoder();
          return {
            raw: [{
              bytes: encoder.encode(newBodyString)
            }]
          };
        } catch (e) {
          console.error('Override body is not valid JSON:', e);
          return null;
        }
      }

      // Convert bytes to string
      const decoder = new TextDecoder();
      let bodyString = decoder.decode(bodyData.bytes);

      // Try to parse as JSON
      let bodyJson;
      try {
        bodyJson = JSON.parse(bodyString);
      } catch (e) {
        // Not JSON, handle as string modification if needed
        return null;
      }

      let modified = false;
      
      // Apply change/remove modifications first
      for (const mod of modifications.rules || []) {
        if (mod.enabled && mod.jsonPath && (mod.action === 'change' || mod.action === 'remove')) {
          const result = this.applyJsonPathModification(bodyJson, mod);
          if (result) {
            bodyJson = result;
            modified = true;
          }
        }
      }
      
      // Apply append modifications last (so they add to the root level)
      for (const mod of modifications.rules || []) {
        if (mod.enabled && mod.action === 'append') {
          const result = this.appendToBody(bodyJson, mod.value);
          if (result) {
            bodyJson = result;
            modified = true;
          }
        }
      }

      if (modified) {
        const newBodyString = JSON.stringify(bodyJson);
        const encoder = new TextEncoder();
        return {
          raw: [{
            bytes: encoder.encode(newBodyString)
          }]
        };
      }
    } catch (e) {
      console.error('Body modification error:', e);
    }
    return null;
  }

  applyJsonPathModification(obj, modification) {
    try {
      const { jsonPath, action, value } = modification;
      
      // Simple JSON path implementation for common cases like $.field or $.nested.field
      const pathParts = jsonPath.replace('$.', '').split('.');
      
      if (action === 'remove') {
        return this.removeJsonField(obj, pathParts);
      } else if (action === 'change') {
        return this.changeJsonField(obj, pathParts, value);
      }
    } catch (e) {
      console.error('JSON path modification error:', e);
    }
    return null;
  }

  appendToBody(obj, appendValue) {
    try {
      // Evaluate dynamic functions in the append value first
      const evaluatedValue = DynamicFunctions.evaluateValue(appendValue);
      
      // Parse the append value as JSON object
      const appendData = JSON.parse(evaluatedValue);
      
      // Ensure both are objects
      if (typeof obj !== 'object' || Array.isArray(obj)) {
        console.error('Can only append to JSON objects, not arrays or primitives');
        return null;
      }
      
      if (typeof appendData !== 'object' || Array.isArray(appendData)) {
        console.error('Append value must be a JSON object with key-value pairs');
        return null;
      }
      
      // Recursively evaluate dynamic functions in nested values
      const evaluatedAppendData = this.evaluateDynamicValuesInObject(appendData);
      
      // Merge the append data into the body at root level
      const objCopy = JSON.parse(JSON.stringify(obj));
      Object.assign(objCopy, evaluatedAppendData);
      
      return objCopy;
    } catch (e) {
      console.error('Append body error:', e);
      return null;
    }
  }

  evaluateDynamicValuesInObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.evaluateDynamicValuesInObject(item));
    }

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = DynamicFunctions.evaluateValue(value);
      } else if (typeof value === 'object') {
        result[key] = this.evaluateDynamicValuesInObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  removeJsonField(obj, pathParts) {
    const objCopy = JSON.parse(JSON.stringify(obj));
    let current = objCopy;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) return null;
      current = current[pathParts[i]];
    }
    
    if (current.hasOwnProperty(pathParts[pathParts.length - 1])) {
      delete current[pathParts[pathParts.length - 1]];
      return objCopy;
    }
    return null;
  }

  changeJsonField(obj, pathParts, newValue) {
    const objCopy = JSON.parse(JSON.stringify(obj));
    let current = objCopy;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    // Evaluate dynamic functions first
    const evaluatedValue = DynamicFunctions.evaluateValue(newValue);
    
    // Parse the value to determine its type
    let parsedValue = evaluatedValue;
    try {
      // Try to parse as JSON (for objects, arrays, numbers, booleans)
      parsedValue = JSON.parse(evaluatedValue);
    } catch (e) {
      // If it fails, treat as string
      // But check if it's a number
      const num = Number(evaluatedValue);
      if (!isNaN(num) && evaluatedValue.trim() !== '') {
        parsedValue = num;
      } else {
        parsedValue = evaluatedValue;
      }
    }
    
    current[pathParts[pathParts.length - 1]] = parsedValue;
    return objCopy;
  }

  modifyHeaders(headers, modifications) {
    const headerMap = new Map();
    
    // Build initial header map
    headers.forEach(header => {
      headerMap.set(header.name.toLowerCase(), header);
    });

    // Apply modifications
    modifications.forEach(mod => {
      if (!mod.enabled) return;
      
      const headerName = mod.name.toLowerCase();
      
      if (mod.action === 'remove') {
        headerMap.delete(headerName);
      } else if (mod.action === 'add' || mod.action === 'modify') {
        // Evaluate dynamic functions in the value
        const evaluatedValue = DynamicFunctions.evaluateValue(mod.value);
        headerMap.set(headerName, {
          name: mod.name,
          value: evaluatedValue
        });
      }
    });
    
    return Array.from(headerMap.values());
  }

  modifyQueryParams(url, modifications) {
    try {
      const urlObj = new URL(url);
      
      modifications.forEach(mod => {
        if (!mod.enabled) return;
        
        if (mod.action === 'remove') {
          urlObj.searchParams.delete(mod.name);
        } else if (mod.action === 'add' || mod.action === 'modify') {
          // Evaluate dynamic functions in the value
          const evaluatedValue = DynamicFunctions.evaluateValue(mod.value);
          urlObj.searchParams.set(mod.name, evaluatedValue);
        }
      });
      
      return urlObj.toString();
    } catch (e) {
      console.error('Query param modification error:', e);
      return url;
    }
  }

  logRuleExecution(rule, details, type) {
    const log = {
      timestamp: Date.now(),
      ruleName: rule.name,
      url: details.url,
      method: details.method,
      type: type
    };
    
    this.logs.unshift(log);
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100);
    }
    
    this.saveLogs();
  }

  async saveSettings() {
    try {
      await browserAPI.storage.local.set({
        isEnabled: this.isEnabled,
        rules: this.rules
      });
      console.log('Settings saved successfully:', { 
        rulesCount: this.rules.length, 
        isEnabled: this.isEnabled 
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  async saveLogs() {
    try {
      await browserAPI.storage.local.set({
        logs: this.logs
      });
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  async setEnabled(enabled) {
    this.isEnabled = enabled;
    this.setupRequestListeners();
    await this.saveSettings();
  }

  async addRule(rule) {
    rule.id = Date.now().toString();
    rule.enabled = true;
    this.rules.push(rule);
    await this.saveSettings();
    return rule;
  }

  async updateRule(ruleId, updates) {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex >= 0) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
      await this.saveSettings();
      return this.rules[ruleIndex];
    }
    return null;
  }

  async deleteRule(ruleId) {
    this.rules = this.rules.filter(r => r.id !== ruleId);
    await this.saveSettings();
  }

  async clearLogs() {
    this.logs = [];
    await this.saveLogs();
  }
}

// Initialize the interceptor
const interceptor = new RequestInterceptor();

// Listen for storage changes (debugging/verification)
browserAPI.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    console.log('Storage changed:', changes);
    if (changes.rules) {
      console.log('Rules updated - Old:', changes.rules.oldValue?.length || 0, 
                  'New:', changes.rules.newValue?.length || 0);
    }
  }
});

// Handle messages from popup
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Use proper promise handling for Firefox compatibility
  const handleAsync = async () => {
    try {
      switch (request.action) {
        case 'getStatus':
          return {
            isEnabled: interceptor.isEnabled,
            debugMode: interceptor.debugMode,
            rules: interceptor.rules,
            logs: interceptor.logs
          };

        case 'setEnabled':
          await interceptor.setEnabled(request.enabled);
          return { success: true };

        case 'addRule':
          const newRule = await interceptor.addRule(request.rule);
          return { success: true, rule: newRule };

        case 'updateRule':
          const updatedRule = await interceptor.updateRule(request.ruleId, request.updates);
          return { success: true, rule: updatedRule };

        case 'deleteRule':
          await interceptor.deleteRule(request.ruleId);
          return { success: true };

        case 'clearLogs':
          await interceptor.clearLogs();
          return { success: true };

        default:
          return { success: false, error: 'Unknown action' };
      }
    } catch (error) {
      console.error('Message handler error:', error);
      return { success: false, error: error.message };
    }
  };

  // Execute async handler and send response
  handleAsync()
    .then(sendResponse)
    .catch(error => {
      console.error('Fatal error in message handler:', error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // Keep the message channel open for async response
});
