// Popup script for ReqCraft
class PopupManager {
  constructor() {
    this.currentRule = null;
    this.isEnabled = true;
    this.debugMode = false;
    this.rules = [];
    this.logs = [];
    this.init();
  }

  async init() {
    // Detect if opened in a tab vs popup
    this.detectViewMode();
    
    this.bindEvents();
    await this.loadStatus();
    this.renderRules();
    this.renderLogs();
  }

  detectViewMode() {
    // Check if we're in a popup or a tab
    // Popups have limited window dimensions
    const isPopup = window.innerWidth <= 600 && window.innerHeight <= 800;
    
    if (!isPopup) {
      // We're in a full tab
      document.body.classList.add('full-tab');
    }
  }

  bindEvents() {
    // Open in tab button
    document.getElementById('openInTabBtn').addEventListener('click', () => {
      this.openInTab();
    });

    // Master toggle
    document.getElementById('masterToggle').addEventListener('click', () => {
      this.toggleMasterSwitch();
    });

    // Debug toggle
    document.getElementById('debugToggle').addEventListener('click', () => {
      this.toggleDebugMode();
    });

    // Help icon
    document.getElementById('helpIcon').addEventListener('click', () => {
      this.showHelpPopup();
    });

    document.getElementById('helpPopupClose').addEventListener('click', () => {
      this.hideHelpPopup();
    });

    document.getElementById('helpPopup').addEventListener('click', (e) => {
      if (e.target.id === 'helpPopup') {
        this.hideHelpPopup();
      }
    });

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Add rule button
    document.getElementById('addRuleBtn').addEventListener('click', () => {
      this.openRuleModal();
    });

    // Clear logs button
    document.getElementById('clearLogsBtn').addEventListener('click', () => {
      this.clearLogs();
    });

    // Modal events
    document.querySelector('.close-btn').addEventListener('click', () => {
      this.closeRuleModal();
    });

    document.getElementById('cancelBtn').addEventListener('click', () => {
      this.closeRuleModal();
    });

    document.getElementById('ruleModal').addEventListener('click', (e) => {
      if (e.target.id === 'ruleModal') {
        this.closeRuleModal();
      }
    });

    // Rule form
    document.getElementById('ruleForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveRule();
    });

    // Add modification buttons
    document.getElementById('addHeaderBtn').addEventListener('click', () => {
      this.addModification('header');
    });

    document.getElementById('addQueryBtn').addEventListener('click', () => {
      this.addModification('query');
    });

    document.getElementById('addBodyBtn').addEventListener('click', () => {
      this.addModification('body');
    });

    // Custom multi-select combobox
    this.initMultiSelect();
  }

  initMultiSelect() {
    const multiselect = document.getElementById('methodsMultiselect');
    const selected = document.getElementById('methodsSelected');
    const dropdown = document.getElementById('methodsDropdown');

    // Toggle dropdown on click
    selected.addEventListener('click', (e) => {
      e.stopPropagation();
      multiselect.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!multiselect.contains(e.target)) {
        multiselect.classList.remove('open');
      }
    });

    // Handle checkbox changes
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateMultiSelectDisplay();
      });
    });

    // Prevent dropdown from closing when clicking inside
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  updateMultiSelectDisplay() {
    const selected = document.getElementById('methodsSelected');
    const checkboxes = document.querySelectorAll('#methodsDropdown input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
      selected.textContent = 'Select methods...';
      selected.style.color = '#9ca3af';
    } else {
      const selectedMethods = Array.from(checkboxes).map(cb => cb.value);
      selected.textContent = selectedMethods.join(', ');
      selected.style.color = '#334155';
    }
  }

  async loadStatus() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading status:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        
        if (!response) {
          console.error('No response from background script');
          reject(new Error('No response from background script'));
          return;
        }

        this.isEnabled = response.isEnabled;
        this.debugMode = response.debugMode || false;
        this.rules = response.rules || [];
        this.logs = response.logs || [];
        console.log('Status loaded:', { 
          rulesCount: this.rules.length, 
          isEnabled: this.isEnabled,
          debugMode: this.debugMode
        });
        this.updateMasterToggle();
        this.updateDebugToggle();
        resolve();
      });
    });
  }

  async toggleMasterSwitch() {
    this.isEnabled = !this.isEnabled;
    this.updateMasterToggle();
    
    chrome.runtime.sendMessage({ 
      action: 'setEnabled', 
      enabled: this.isEnabled 
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error toggling switch:', chrome.runtime.lastError);
        // Revert on error
        this.isEnabled = !this.isEnabled;
        this.updateMasterToggle();
      }
    });
  }

  openInTab() {
    // Get the extension's base URL
    const extensionUrl = chrome.runtime.getURL('popup.html');
    
    // Open in a new tab
    chrome.tabs.create({ url: extensionUrl }, () => {
      // Close the popup
      window.close();
    });
  }

  updateMasterToggle() {
    const toggle = document.getElementById('masterToggle');
    if (this.isEnabled) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
  }

  async toggleDebugMode() {
    this.debugMode = !this.debugMode;
    this.updateDebugToggle();
    
    // Save to storage using browser API
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    await browserAPI.storage.local.set({ debugMode: this.debugMode });
    
    console.log('Debug mode:', this.debugMode ? 'enabled' : 'disabled');
  }

  updateDebugToggle() {
    const toggle = document.getElementById('debugToggle');
    if (this.debugMode) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Refresh content if needed
    if (tabName === 'logs') {
      this.loadStatus().then(() => this.renderLogs());
    }
  }

  renderRules() {
    const container = document.getElementById('rulesList');
    
    if (this.rules.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No rules yet</h3>
          <p>Create your first rule to start intercepting requests</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.rules.map(rule => {
      // Format methods display
      let methodsDisplay = 'ALL';
      if (rule.methods && Array.isArray(rule.methods) && rule.methods.length > 0) {
        methodsDisplay = rule.methods.join(', ');
      } else if (rule.method && rule.method !== 'ALL') {
        // Legacy support for old single method format
        methodsDisplay = rule.method;
      }
      
      return `
        <div class="rule-item">
          <div class="rule-header">
            <div class="rule-name">${this.escapeHtml(rule.name)}</div>
            <div class="rule-toggle ${rule.enabled ? 'active' : ''}" data-rule-id="${rule.id}"></div>
          </div>
          <div class="rule-details">
            ${rule.urlPattern || 'All URLs'} • ${methodsDisplay}
          </div>
          <div class="rule-actions">
            <button class="edit-rule-btn" data-rule-id="${rule.id}">Edit</button>
            <button class="delete-rule-btn" data-rule-id="${rule.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Bind rule toggle events
    container.querySelectorAll('.rule-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const ruleId = e.target.dataset.ruleId;
        this.toggleRule(ruleId);
      });
    });

    // Bind edit button events
    container.querySelectorAll('.edit-rule-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ruleId = e.target.dataset.ruleId;
        this.editRule(ruleId);
      });
    });

    // Bind delete button events
    container.querySelectorAll('.delete-rule-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ruleId = e.target.dataset.ruleId;
        this.deleteRule(ruleId);
      });
    });
  }

  renderLogs() {
    const container = document.getElementById('logsList');
    
    if (this.logs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No logs yet</h3>
          <p>Logs will appear here when rules are triggered</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.logs.slice(0, 20).map(log => `
      <div class="log-item">
        <div class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</div>
        <div class="log-url">${log.method} ${this.escapeHtml(log.url)}</div>
        <div style="font-size: 10px; color: #10b981;">Rule: ${this.escapeHtml(log.ruleName)}</div>
      </div>
    `).join('');
  }

  async toggleRule(ruleId) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      const originalEnabled = rule.enabled;
      const newEnabled = !rule.enabled;
      
      // Optimistically update UI
      rule.enabled = newEnabled;
      this.renderRules();
      
      try {
        await this.updateRule(ruleId, { enabled: newEnabled });
        console.log('Rule toggled successfully:', ruleId);
      } catch (error) {
        console.error('Failed to toggle rule:', error);
        // Revert on error
        rule.enabled = originalEnabled;
        this.renderRules();
        alert('Failed to toggle rule: ' + error.message);
      }
    }
  }

  async deleteRule(ruleId) {
    if (confirm('Are you sure you want to delete this rule?')) {
      chrome.runtime.sendMessage({ 
        action: 'deleteRule', 
        ruleId 
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error deleting rule:', chrome.runtime.lastError);
          alert('Failed to delete rule: ' + chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.success) {
          console.log('Rule deleted successfully');
          this.rules = this.rules.filter(r => r.id !== ruleId);
          this.renderRules();
        } else {
          console.error('Failed to delete rule:', response?.error);
          alert('Failed to delete rule: ' + (response?.error || 'Unknown error'));
        }
      });
    }
  }

  editRule(ruleId) {
    this.currentRule = this.rules.find(r => r.id === ruleId);
    this.openRuleModal(true);
  }

  async updateRule(ruleId, updates) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ 
        action: 'updateRule', 
        ruleId, 
        updates 
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Unknown error'));
        }
      });
    });
  }

  async clearLogs() {
    chrome.runtime.sendMessage({ action: 'clearLogs' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error clearing logs:', chrome.runtime.lastError);
        alert('Failed to clear logs: ' + chrome.runtime.lastError.message);
        return;
      }
      
      if (response && response.success) {
        this.logs = [];
        this.renderLogs();
      }
    });
  }

  openRuleModal(isEdit = false) {
    const modal = document.getElementById('ruleModal');
    const title = document.querySelector('.modal-title');
    const form = document.getElementById('ruleForm');
    
    title.textContent = isEdit ? 'Edit Rule' : 'Add New Rule';
    
    if (isEdit && this.currentRule) {
      this.populateForm(this.currentRule);
    } else {
      form.reset();
      this.clearModifications();
      // Reset multi-select to defaults
      const methodCheckboxes = document.querySelectorAll('#methodsDropdown input[type="checkbox"]');
      methodCheckboxes.forEach(checkbox => {
        checkbox.checked = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(checkbox.value);
      });
      this.updateMultiSelectDisplay();
    }
    
    modal.classList.add('active');
  }

  closeRuleModal() {
    const modal = document.getElementById('ruleModal');
    modal.classList.remove('active');
    this.currentRule = null;
    this.clearModifications();
    // Close the multiselect dropdown
    document.getElementById('methodsMultiselect').classList.remove('open');
  }

  showHelpPopup() {
    document.getElementById('helpPopup').classList.add('active');
  }

  hideHelpPopup() {
    document.getElementById('helpPopup').classList.remove('active');
  }

  populateForm(rule) {
    const form = document.getElementById('ruleForm');
    
    form.name.value = rule.name || '';
    form.urlPattern.value = rule.urlPattern || '';
    
    // Handle methods - support both new array format and legacy single method
    const methodCheckboxes = document.querySelectorAll('#methodsDropdown input[type="checkbox"]');
    
    // Uncheck all first
    methodCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    if (rule.methods && Array.isArray(rule.methods)) {
      // New format: array of methods
      methodCheckboxes.forEach(checkbox => {
        if (rule.methods.includes(checkbox.value)) {
          checkbox.checked = true;
        }
      });
    } else if (rule.method && rule.method !== 'ALL') {
      // Legacy format: single method string
      methodCheckboxes.forEach(checkbox => {
        if (checkbox.value === rule.method) {
          checkbox.checked = true;
        }
      });
    } else {
      // ALL methods or no method specified - check all common ones
      methodCheckboxes.forEach(checkbox => {
        if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(checkbox.value)) {
          checkbox.checked = true;
        }
      });
    }
    
    // Update the display
    this.updateMultiSelectDisplay();
    
    // URL Rewrite
    if (rule.urlRewrite) {
      form.urlRewriteEnabled.checked = rule.urlRewrite.enabled || false;
      form.urlRewritePattern.value = rule.urlRewrite.pattern || '';
      form.urlRewriteTemplate.value = rule.urlRewrite.template || '';
    }

    // Populate modifications
    this.clearModifications();
    
    if (rule.headerModifications) {
      rule.headerModifications.forEach(mod => {
        this.addModification('header', mod);
      });
    }
    
    if (rule.queryModifications) {
      rule.queryModifications.forEach(mod => {
        this.addModification('query', mod);
      });
    }
    
    if (rule.bodyModification && rule.bodyModification.rules) {
      rule.bodyModification.rules.forEach(mod => {
        this.addModification('body', mod);
      });
    }
  }

  clearModifications() {
    document.getElementById('headerModifications').innerHTML = '';
    document.getElementById('queryModifications').innerHTML = '';
    document.getElementById('bodyModifications').innerHTML = '';
  }

  addModification(type, existing = null) {
    const containers = {
      header: document.getElementById('headerModifications'),
      query: document.getElementById('queryModifications'),
      body: document.getElementById('bodyModifications')
    };
    
    const container = containers[type];
    if (!container) return;

    const modDiv = document.createElement('div');
    modDiv.className = 'modification-item';
    
    if (type === 'body') {
      modDiv.innerHTML = `
        <select name="bodyAction" class="mod-action body-action-select">
          <option value="append" ${existing?.action === 'append' ? 'selected' : ''}>Append</option>
          <option value="change" ${existing?.action === 'change' ? 'selected' : ''}>Change</option>
          <option value="remove" ${existing?.action === 'remove' ? 'selected' : ''}>Remove</option>
          <option value="override" ${existing?.action === 'override' ? 'selected' : ''}>Override</option>
        </select>
        <input type="text" placeholder="JSON Path (e.g., $.user.id)" name="jsonPath" value="${existing?.jsonPath || ''}" class="mod-input mod-input-wide json-path-input">
        <textarea placeholder="Append JSON (e.g., {&quot;key1&quot;: &quot;value1&quot;, &quot;key2&quot;: 123})" name="bodyValue" class="mod-textarea json-body-textarea append-textarea" style="display: none;">${existing?.value || ''}</textarea>
        <textarea placeholder="Override JSON Body (e.g., {&quot;key&quot;: &quot;value&quot;})" name="bodyValue" class="mod-textarea json-body-textarea override-textarea" style="display: none;">${existing?.value || ''}</textarea>
        <input type="text" placeholder="Value (string, number, JSON object/array)" name="bodyValueSimple" value="${existing?.value || ''}" class="mod-input mod-input-wide body-value-input">
        <button type="button" class="remove-mod-btn" title="Remove modification">×</button>
        <label class="mod-checkbox" style="grid-column: 1 / -1;">
          <input type="checkbox" name="bodyEnabled" ${existing?.enabled !== false ? 'checked' : ''}>
          <span>Enabled</span>
        </label>
      `;
      
      // Add event listener to toggle between different input types
      const actionSelect = modDiv.querySelector('.body-action-select');
      const jsonPathInput = modDiv.querySelector('.json-path-input');
      const bodyValueInput = modDiv.querySelector('.body-value-input');
      const appendTextarea = modDiv.querySelector('.append-textarea');
      const overrideTextarea = modDiv.querySelector('.override-textarea');
      
      const updateBodyFields = () => {
        // Hide all first
        jsonPathInput.style.display = 'none';
        bodyValueInput.style.display = 'none';
        appendTextarea.style.display = 'none';
        overrideTextarea.style.display = 'none';
        
        if (actionSelect.value === 'append') {
          appendTextarea.style.display = 'block';
          appendTextarea.style.gridColumn = '2 / 4';
        } else if (actionSelect.value === 'override') {
          overrideTextarea.style.display = 'block';
          overrideTextarea.style.gridColumn = '2 / 4';
        } else if (actionSelect.value === 'remove') {
          jsonPathInput.style.display = 'block';
          jsonPathInput.placeholder = 'JSON Path (e.g., $.user.id)';
        } else if (actionSelect.value === 'change') {
          jsonPathInput.style.display = 'block';
          bodyValueInput.style.display = 'block';
          jsonPathInput.placeholder = 'JSON Path (e.g., $.user.id)';
          bodyValueInput.placeholder = 'Value: "text", 123, {"obj":"val"}, [1,2,3]';
        }
      };
      
      actionSelect.addEventListener('change', updateBodyFields);
      updateBodyFields(); // Initialize on load
    } else {
      modDiv.innerHTML = `
        <select name="${type}Action" class="mod-action">
          <option value="add" ${existing?.action === 'add' ? 'selected' : ''}>Add</option>
          <option value="modify" ${existing?.action === 'modify' ? 'selected' : ''}>Modify</option>
          <option value="remove" ${existing?.action === 'remove' ? 'selected' : ''}>Remove</option>
        </select>
        <input type="text" placeholder="Name" name="${type}Name" value="${existing?.name || ''}" class="mod-input">
        <input type="text" placeholder="Value" name="${type}Value" value="${existing?.value || ''}" class="mod-input">
        <button type="button" class="remove-mod-btn" title="Remove modification">×</button>
        <label class="mod-checkbox" style="grid-column: 1 / -1;">
          <input type="checkbox" name="${type}Enabled" ${existing?.enabled !== false ? 'checked' : ''}>
          <span>Enabled</span>
        </label>
      `;
    }
    
    // Add remove functionality
    modDiv.querySelector('.remove-mod-btn').addEventListener('click', () => {
      modDiv.remove();
    });
    
    container.appendChild(modDiv);
  }

  async saveRule() {
    const form = document.getElementById('ruleForm');
    const formData = new FormData(form);
    
    // Collect selected methods from custom multi-select
    const checkedBoxes = document.querySelectorAll('#methodsDropdown input[type="checkbox"]:checked');
    const selectedMethods = Array.from(checkedBoxes).map(cb => cb.value);
    
    // Validate at least one method is selected
    if (selectedMethods.length === 0) {
      alert('Please select at least one HTTP method');
      return;
    }
    
    const rule = {
      name: formData.get('name'),
      urlPattern: formData.get('urlPattern'),
      methods: selectedMethods, // New: array of methods
      urlRewrite: {
        enabled: formData.get('urlRewriteEnabled') === 'on',
        pattern: formData.get('urlRewritePattern'),
        template: formData.get('urlRewriteTemplate')
      },
      headerModifications: this.collectModifications('header'),
      queryModifications: this.collectModifications('query'),
      bodyModification: {
        enabled: true,
        rules: this.collectModifications('body')
      }
    };

    console.log('Saving rule:', rule);

    if (this.currentRule) {
      // Update existing rule
      chrome.runtime.sendMessage({
        action: 'updateRule',
        ruleId: this.currentRule.id,
        updates: rule
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error updating rule:', chrome.runtime.lastError);
          alert('Failed to update rule: ' + chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.success) {
          console.log('Rule updated successfully');
          Object.assign(this.currentRule, rule);
          this.renderRules();
          this.closeRuleModal();
        } else {
          console.error('Failed to update rule:', response?.error);
          alert('Failed to update rule: ' + (response?.error || 'Unknown error'));
        }
      });
    } else {
      // Add new rule
      chrome.runtime.sendMessage({
        action: 'addRule',
        rule: rule
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error adding rule:', chrome.runtime.lastError);
          alert('Failed to add rule: ' + chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.success) {
          console.log('Rule added successfully:', response.rule);
          this.rules.push(response.rule);
          this.renderRules();
          this.closeRuleModal();
        } else {
          console.error('Failed to add rule:', response?.error);
          alert('Failed to add rule: ' + (response?.error || 'Unknown error'));
        }
      });
    }
  }

  collectModifications(type) {
    const container = document.getElementById(`${type}Modifications`);
    const modifications = [];
    
    container.querySelectorAll('.modification-item').forEach(item => {
      if (type === 'body') {
        const action = item.querySelector(`[name="bodyAction"]`).value;
        const mod = {
          action: action,
          enabled: item.querySelector(`[name="bodyEnabled"]`).checked
        };
        
        if (action === 'append' || action === 'override') {
          // For append and override actions, use the textarea value
          const textareas = item.querySelectorAll(`[name="bodyValue"]`);
          let textarea = null;
          
          // Find the visible textarea
          textareas.forEach(ta => {
            if (ta.style.display !== 'none') {
              textarea = ta;
            }
          });
          
          mod.value = textarea ? textarea.value : '';
          mod.jsonPath = ''; // No JSON path for append/override
        } else {
          // For change/remove actions, use JSON path and simple input
          mod.jsonPath = item.querySelector(`[name="jsonPath"]`).value;
          const simpleInput = item.querySelector(`[name="bodyValueSimple"]`);
          mod.value = simpleInput ? simpleInput.value : '';
        }
        
        // Only add if there's a valid jsonPath (for change/remove) or if it's append/override action
        if (mod.jsonPath || action === 'append' || action === 'override') {
          modifications.push(mod);
        }
      } else {
        const mod = {
          action: item.querySelector(`[name="${type}Action"]`).value,
          name: item.querySelector(`[name="${type}Name"]`).value,
          value: item.querySelector(`[name="${type}Value"]`).value,
          enabled: item.querySelector(`[name="${type}Enabled"]`).checked
        };
        if (mod.name) {
          modifications.push(mod);
        }
      }
    });
    
    return modifications;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the popup manager
const popupManager = new PopupManager();
