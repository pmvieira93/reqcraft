// Content script - Injects interceptor into page context
// This bypasses Firefox's read-only fetch restriction

(function() {
  'use strict';
  
  console.log('[ReqCraft] Content script loading...');
  
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  // Create the page-level interceptor script
  const script = document.createElement('script');
  script.textContent = `
(function() {
  'use strict';
  console.log('[ReqCraft] Page interceptor injected');
  
  // Initialize in page context
  window.__requestInterceptorRules = window.__requestInterceptorRules || [];
  window.__requestInterceptorEnabled = window.__requestInterceptorEnabled !== false;
  window.__requestInterceptorDebug = window.__requestInterceptorDebug || false;
  
  function log(...args) {
    if (window.__requestInterceptorDebug) {
      console.log.apply(console, args);
    }
  }
  
  function logGroup(title) {
    if (window.__requestInterceptorDebug) {
      console.log('[ReqCraft] === ' + title + ' ===');
    }
  }
  
  // Listen for rule updates
  window.addEventListener('__updateRules', function(e) {
    if (e && e.detail && e.detail.rules) {
      window.__requestInterceptorRules = e.detail.rules;
      window.__requestInterceptorEnabled = e.detail.enabled;
      window.__requestInterceptorDebug = e.detail.debug || false;
      console.log('[ReqCraft] Rules updated:', window.__requestInterceptorRules.length, 'Debug:', window.__requestInterceptorDebug);
    }
  });
  
  function matchesRule(url, method, rule) {
    logGroup('matchesRule');
    log('[ReqCraft] Rule:', rule.name);
    log('[ReqCraft] URL pattern:', rule.urlPattern);
    log('[ReqCraft] Rule methods:', rule.methods);
    log('[ReqCraft] Checking URL:', url);
    log('[ReqCraft] Checking method:', method);
    
    if (!rule.enabled) {
      log('[ReqCraft] Rule not enabled');
      return false;
    }
    
    if (rule.urlPattern) {
      var pattern = rule.urlPattern;
      log('[ReqCraft] Original pattern:', pattern);
      // Build escaped pattern character by character
      var escaped = '';
      for (var i = 0; i < pattern.length; i++) {
        var c = pattern.charAt(i);
        if (c === '*') {
          escaped += '.*';
        } else if (c === '.' || c === '+' || c === '?' || c === '^' || c === '$' || 
                   c === '{' || c === '}' || c === '(' || c === ')' || c === '|' || 
                   c === '[' || c === ']' || c === '\\\\') {
          escaped += '\\\\' + c;
        } else {
          escaped += c;
        }
      }
      log('[ReqCraft] Transformed pattern:', escaped);
      var regex = new RegExp(escaped);
      var matches = regex.test(url);
      log('[ReqCraft] Regex match result:', matches);
      if (!matches) {
        log('[ReqCraft] URL does not match pattern');
        return false;
      }
    }
    
    if (rule.methods && Array.isArray(rule.methods) && rule.methods.length > 0) {
      const hasMethod = rule.methods.indexOf(method) !== -1;
      log('[ReqCraft] Method check:', hasMethod, '(looking for', method, 'in', rule.methods, ')');
      if (!hasMethod) {
        log('[ReqCraft] Method does not match');
        return false;
      }
    } else if (rule.method && rule.method !== 'ALL') {
      log('[ReqCraft] Legacy method check:', rule.method, 'vs', method);
      if (rule.method !== method) {
        log('[ReqCraft] Legacy method does not match');
        return false;
      }
    }
    
    log('[ReqCraft] ✅ Rule matches!');
    return true;
  }
  
  function evaluateValue(value) {
    if (typeof value !== 'string') return value;
    
    const pattern = /\\$(\w+)(\\(([^)]*)\\))?/g;
    return value.replace(pattern, (match, funcName, argsWithParens, argsStr) => {
      try {
        let args = [];
        if (argsStr) {
          args = argsStr.split(',').map(arg => {
            arg = arg.trim();
            const num = Number(arg);
            if (!isNaN(num)) return num;
            return arg.replace(/^["']|["']$/g, '');
          });
        }
        
        switch(funcName) {
          case 'randomString': {
            const length = args[0] || 10;
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
          }
          case 'randomUUID':
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
              const r = Math.random() * 16 | 0;
              const v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          case 'randomInteger':
            const min = args[0] || 0;
            const max = args[1] || 1000;
            return Math.floor(Math.random() * (max - min + 1)) + min;
          case 'randomDecimal': {
            const dmin = args[0] || 0;
            const dmax = args[1] || 1000;
            const decimals = args[2] || 2;
            const val = Math.random() * (dmax - dmin) + dmin;
            return parseFloat(val.toFixed(decimals));
          }
          case 'timestamp':
            return Math.floor(Date.now() / 1000);
          case 'isoTimestamp':
            return new Date().toISOString();
          case 'pastTimestamp': {
            const secondsAgo = args[0] || 3600;
            return Math.floor((Date.now() - (secondsAgo * 1000)) / 1000);
          }
          case 'pastIsoTimestamp': {
            const secondsAgo = args[0] || 3600;
            return new Date(Date.now() - (secondsAgo * 1000)).toISOString();
          }
          default:
            return match;
        }
      } catch (e) {
        return match;
      }
    });
  }
  
  function evaluateDynamicValues(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? evaluateValue(obj) : obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => evaluateDynamicValues(item));
    }
    
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = evaluateDynamicValues(value);
    }
    return result;
  }
  
    function modifyBody(url, method, body) {
    logGroup('modifyBody');
    log('[ReqCraft] URL:', url);
    log('[ReqCraft] Method:', method);
    log('[ReqCraft] Body:', body);
    
    if (!window.__requestInterceptorEnabled || !body) {
      log('[ReqCraft] Skipping - disabled or no body');
      return body;
    }
    
    var rules = window.__requestInterceptorRules || [];
    var matchingRules = rules.filter(function(rule) {
      var matches = matchesRule(url, method, rule);
      log('[ReqCraft] Rule "' + rule.name + '" matches:', matches);
      return matches;
    });
    
    log('[ReqCraft] Matching rules:', matchingRules.length);
    
    for (var i = 0; i < matchingRules.length; i++) {
      var rule = matchingRules[i];
      log('[ReqCraft] Processing rule:', rule.name);
      
      if (!rule.bodyModification || !rule.bodyModification.enabled) {
        log('[ReqCraft] Body modification not enabled');
        continue;
      }
      if (!rule.bodyModification.rules || rule.bodyModification.rules.length === 0) {
        log('[ReqCraft] No body modification rules');
        continue;
      }
      
      log('[ReqCraft] Body mod rules count:', rule.bodyModification.rules.length);
      
      try {
        var bodyObj = JSON.parse(body);
        var modified = false;
        
        for (var j = 0; j < rule.bodyModification.rules.length; j++) {
          var mod = rule.bodyModification.rules[j];
          
          log('[ReqCraft] Body mod rule:', JSON.stringify(mod));
          
          if (!mod || !mod.enabled) {
            log('[ReqCraft] Body mod rule disabled or invalid');
            continue;
          }
          
          if (!mod.action) {
            log('[ReqCraft] Body mod rule missing action');
            continue;
          }
          
          log('[ReqCraft] Applying body mod:', mod.action, mod.jsonPath);
          
          if (mod.action === 'override') {
            // If jsonPath is empty, replace entire body
            if (!mod.jsonPath || mod.jsonPath === '') {
              try {
                body = mod.value;
                modified = true;
                log('[ReqCraft] ✅ Body overridden entirely');
              } catch (e) {
                log('[ReqCraft] Override error:', e);
              }
            } else {
              // Override specific path
              bodyObj[mod.jsonPath] = mod.value;
              modified = true;
            }
          } else if (mod.action === 'append') {
            if (Array.isArray(bodyObj[mod.jsonPath])) {
              bodyObj[mod.jsonPath].push(mod.value);
            } else {
              bodyObj[mod.jsonPath] = mod.value;
            }
            modified = true;
          } else if (mod.action === 'change') {
            if (bodyObj[mod.jsonPath] !== undefined) {
              bodyObj[mod.jsonPath] = mod.value;
              modified = true;
            }
          } else if (mod.action === 'remove') {
            if (bodyObj[mod.jsonPath] !== undefined) {
              delete bodyObj[mod.jsonPath];
              modified = true;
            }
          }
        }
        
        if (modified) {
          // If body was completely overridden, it's already a string
          if (typeof body !== 'string') {
            body = JSON.stringify(bodyObj);
          }
          log('[ReqCraft] ✅ Body modified');
        }
      } catch (e) {
        log('[ReqCraft] Body mod error:', e);
      }
    }
    
    return body;
  }
  
  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = function() {
    const args = Array.prototype.slice.call(arguments);
    try {
      const resource = args[0];
      const init = args[1];
      const url = typeof resource === 'string' ? resource : resource.url;
      const method = (init && init.method ? init.method : 'GET').toUpperCase();
      
      console.log('[ReqCraft] 🌐 Fetch:', method, url);
      
      if (init && init.body && typeof init.body === 'string') {
        const modifiedBody = modifyBody(url, method, init.body);
        if (modifiedBody !== init.body) {
          args[1] = Object.assign({}, init, { body: modifiedBody });
        }
      }
    } catch (e) {
      console.error('[ReqCraft] Fetch error:', e);
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Intercept XMLHttpRequest
  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    let method = 'GET';
    let url = '';
    
    const originalOpen = xhr.open;
    xhr.open = function(m, u, ...rest) {
      method = m.toUpperCase();
      url = u;
      return originalOpen.call(this, m, u, ...rest);
    };
    
    const originalSend = xhr.send;
    xhr.send = function(body) {
      if (body && typeof body === 'string') {
        try {
          const modifiedBody = modifyBody(url, method, body);
          if (modifiedBody !== body) {
            console.log('[ReqCraft] ✅ XHR body modified');
            return originalSend.call(this, modifiedBody);
          }
        } catch (e) {
          console.error('[ReqCraft] XHR error:', e);
        }
      }
      return originalSend.call(this, body);
    };
    
    return xhr;
  };
  
  console.log('[ReqCraft] ✅ Interception active');
})();
  `;
  
  // Inject before page scripts
  (document.head || document.documentElement).appendChild(script);
  script.remove();
  
  // Send rules to page context
  function sendRules() {
    browserAPI.storage.local.get(['rules', 'isEnabled', 'debugMode'], (result) => {
      const rules = result.rules || [];
      const enabled = result.isEnabled !== false;
      const debug = result.debugMode || false;
      
      console.log('[ReqCraft] Sending', rules.length, 'rules to page (Debug:', debug, ')');
      
      // Clone the data into the page context (required for Firefox)
      const detail = { rules: rules, enabled: enabled, debug: debug };
      const clonedDetail = typeof cloneInto !== 'undefined' 
        ? cloneInto(detail, window) 
        : detail;
      
      window.dispatchEvent(new CustomEvent('__updateRules', {
        detail: clonedDetail
      }));
    });
  }
  
  // Initial send
  setTimeout(sendRules, 100);
  
  // Listen for changes
  browserAPI.storage.onChanged.addListener((changes) => {
    if (changes.rules || changes.isEnabled || changes.debugMode) {
      console.log('[ReqCraft] Storage changed, updating...');
      sendRules();
    }
  });
  
  console.log('[ReqCraft] ✅ Content script ready');
})();
