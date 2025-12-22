// Security Copilot Chat Extension - Main Logic

class SecurityCopilotChat {
    constructor() {
        this.accessToken = null;
        this.sessionId = null;
        this.sessionName = null;
        this.workspaceId = 'default';
        this.config = {};
        this.userEmail = null;
        
        this.init();
    }

    async init() {
        // Load configuration
        await this.loadConfig();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check authentication status
        await this.checkAuthStatus();
    }

    async loadConfig() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['tenantId', 'clientId', 'workspaceId', 'sessionId', 'sessionName'], (result) => {
                this.config = {
                    tenantId: result.tenantId || '',
                    clientId: result.clientId || '',
                    workspaceId: result.workspaceId || 'default'
                };
                this.workspaceId = this.config.workspaceId;
                this.sessionId = result.sessionId || null;
                this.sessionName = result.sessionName || null;
                
                // Update UI with saved values
                if (this.config.tenantId) document.getElementById('tenantId').value = this.config.tenantId;
                if (this.config.clientId) document.getElementById('clientId').value = this.config.clientId;
                if (this.config.workspaceId) document.getElementById('workspaceId').value = this.config.workspaceId;
                
                this.updateSessionDisplay();
                
                resolve();
            });
        });
    }

    setupEventListeners() {
        // Auth buttons
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) loginBtn.addEventListener('click', () => this.login());
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
        
        // Settings buttons
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.toggleSettings());
        
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', () => this.toggleSettings());
        
        // Chat buttons
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
        
        const newSessionBtn = document.getElementById('newSessionBtn');
        if (newSessionBtn) newSessionBtn.addEventListener('click', () => this.createNewSession());
        
        // Session name modal buttons
        const createSessionBtn = document.getElementById('createSessionBtn');
        if (createSessionBtn) createSessionBtn.addEventListener('click', () => this.confirmCreateSession());
        
        const cancelSessionBtn = document.getElementById('cancelSessionBtn');
        if (cancelSessionBtn) cancelSessionBtn.addEventListener('click', () => this.hideSessionNameModal());
        
        // Session ID click to copy
        const sessionIdEl = document.getElementById('sessionId');
        if (sessionIdEl) {
            sessionIdEl.addEventListener('click', () => {
                if (this.sessionId) {
                    navigator.clipboard.writeText(this.sessionId).then(() => {
                        this.showSuccess('Session ID copied to clipboard!');
                    });
                }
            });
        }
        
        // Enter key in session name input
        const sessionNameInput = document.getElementById('sessionNameInput');
        if (sessionNameInput) {
            sessionNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.confirmCreateSession();
                }
            });
        }
        
        // Enter key in textarea
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }

    toggleSettings() {
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            settingsPanel.classList.toggle('hidden');
            console.log('Settings panel toggled, hidden:', settingsPanel.classList.contains('hidden'));
        } else {
            console.error('Settings panel not found!');
        }
    }

    updateSessionDisplay() {
        const sessionNameEl = document.getElementById('sessionName');
        const sessionIdEl = document.getElementById('sessionId');
        
        if (sessionNameEl && this.sessionName) {
            sessionNameEl.textContent = this.sessionName;
        }
        
        if (sessionIdEl && this.sessionId) {
            sessionIdEl.textContent = `ID: ${this.sessionId}`;
            sessionIdEl.title = 'Click to copy';
        } else if (sessionIdEl) {
            sessionIdEl.textContent = '';
        }
    }

    showSessionNameModal() {
        const modal = document.getElementById('sessionNameModal');
        const input = document.getElementById('sessionNameInput');
        
        if (modal && input) {
            modal.classList.remove('hidden');
            input.value = '';
            input.focus();
        }
    }

    hideSessionNameModal() {
        const modal = document.getElementById('sessionNameModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async confirmCreateSession() {
        const input = document.getElementById('sessionNameInput');
        const sessionName = input ? input.value.trim() : '';
        
        this.sessionId = null;
        this.sessionName = sessionName || `Session-${new Date().toLocaleString()}`;
        await chrome.storage.local.remove(['sessionId']);
        
        document.getElementById('chatMessages').innerHTML = '';
        this.hideSessionNameModal();
        
        try {
            // Create session immediately on Security Copilot
            await this.createSession();
            
            const sessionLink = `https://securitycopilot.microsoft.com/sessions/${this.sessionId}`;
            this.addMessage(`New Session started\n\nYou can access it at ${sessionLink}`, 'system');
        } catch (error) {
            console.error('Error creating session:', error);
            this.showError('Failed to create session: ' + error.message);
        }
    }

    async saveSettings() {
        const tenantId = document.getElementById('tenantId').value.trim();
        const clientId = document.getElementById('clientId').value.trim();
        const workspaceId = document.getElementById('workspaceId').value.trim() || 'default';

        if (!tenantId || !clientId) {
            this.showError('Please enter both Tenant ID and Client ID');
            return;
        }

        // Validate Tenant ID format (GUID)
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!guidRegex.test(tenantId)) {
            this.showError('Invalid Tenant ID format. Must be a valid GUID.');
            return;
        }

        // Validate Client ID format (GUID)
        if (!guidRegex.test(clientId)) {
            this.showError('Invalid Client ID format. Must be a valid GUID.');
            return;
        }

        return new Promise((resolve) => {
            chrome.storage.local.set({
                tenantId: tenantId,
                clientId: clientId,
                workspaceId: workspaceId
            }, () => {
                this.config = { tenantId, clientId, workspaceId };
                this.workspaceId = workspaceId;
                this.toggleSettings();
                this.showSuccess('Settings saved successfully!');
                resolve();
            });
        });
    }

    async checkAuthStatus() {
        const token = await this.getStoredToken();
        
        if (token && !this.isTokenExpired(token)) {
            this.accessToken = token.accessToken;
            this.userEmail = token.userEmail;
            this.showChatInterface();
        } else {
            // Clear expired or invalid token
            if (token) {
                await chrome.storage.local.remove(['accessToken', 'tokenExpiry', 'userEmail', 'sessionId']);
            }
            this.showAuthInterface();
        }
    }

    async getStoredToken() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['accessToken', 'tokenExpiry', 'userEmail'], (result) => {
                if (result.accessToken && result.tokenExpiry && result.userEmail) {
                    resolve({
                        accessToken: result.accessToken,
                        expiry: result.tokenExpiry,
                        userEmail: result.userEmail
                    });
                } else {
                    resolve(null);
                }
            });
        });
    }

    isTokenExpired(token) {
        return Date.now() >= token.expiry;
    }

    async login() {
        if (!this.config.tenantId || !this.config.clientId) {
            this.showError('Please configure Tenant ID and Client ID in settings first');
            this.toggleSettings();
            return;
        }

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'authenticate',
                tenantId: this.config.tenantId,
                clientId: this.config.clientId
            });

            if (response.success) {
                this.accessToken = response.accessToken;
                this.userEmail = response.userEmail;
                
                // Store token
                await chrome.storage.local.set({
                    accessToken: response.accessToken,
                    tokenExpiry: response.expiry,
                    userEmail: response.userEmail
                });
                
                this.showChatInterface();
            } else {
                this.showError(response.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Authentication failed: ' + error.message);
        }
    }

    async logout() {
        await chrome.storage.local.remove(['accessToken', 'tokenExpiry', 'userEmail', 'sessionId']);
        this.accessToken = null;
        this.sessionId = null;
        this.userEmail = null;
        this.showAuthInterface();
        document.getElementById('chatMessages').innerHTML = '';
    }

    showAuthInterface() {
        document.getElementById('authSection').classList.remove('hidden');
        document.getElementById('chatSection').classList.add('hidden');
    }

    showChatInterface() {
        document.getElementById('authSection').classList.add('hidden');
        document.getElementById('chatSection').classList.remove('hidden');
        document.getElementById('userEmail').textContent = this.userEmail || '';
        
        // Load existing session if available
        this.loadExistingSession();
    }

    async loadExistingSession() {
        const result = await chrome.storage.local.get(['sessionId']);
        if (result.sessionId) {
            this.sessionId = result.sessionId;
        }
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Disable input
        input.disabled = true;
        document.getElementById('sendBtn').disabled = true;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        this.showTyping(true);
        
        try {
            // Create session if needed
            if (!this.sessionId) {
                await this.createSession();
            }
            
            // Submit prompt
            const promptId = await this.submitPrompt(message);
            
            // Evaluate prompt
            const evaluationId = await this.evaluatePrompt(promptId);
            
            // Wait for completion and get result
            const result = await this.waitForEvaluation(promptId, evaluationId);
            
            // Add response to chat
            this.addMessage(result, 'assistant');
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('Error: ' + error.message, 'error');
        } finally {
            // Re-enable input
            input.disabled = false;
            document.getElementById('sendBtn').disabled = false;
            this.showTyping(false);
            input.focus();
        }
    }

    async createSession() {
        const uri = `https://graph.microsoft.com/beta/security/securityCopilot/workspaces/${this.workspaceId}/sessions`;
        
        const displayName = this.sessionName || `ChatViaExtension-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}`;
        
        const response = await fetch(uri, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                displayName: displayName
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to create session: ${response.statusText}`);
        }
        
        const data = await response.json();
        this.sessionId = data.id;
        this.sessionName = displayName;
        
        // Store session ID and name
        await chrome.storage.local.set({ 
            sessionId: this.sessionId,
            sessionName: this.sessionName 
        });
        
        this.updateSessionDisplay();
        
        return this.sessionId;
    }

    async submitPrompt(message) {
        const uri = `https://graph.microsoft.com/beta/security/securityCopilot/workspaces/${this.workspaceId}/sessions/${this.sessionId}/prompts`;
        
        const response = await fetch(uri, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: message,
                type: 'prompt'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to submit prompt: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.id;
    }

    async evaluatePrompt(promptId) {
        const uri = `https://graph.microsoft.com/beta/security/securityCopilot/workspaces/${this.workspaceId}/sessions/${this.sessionId}/prompts/${promptId}/evaluations`;
        
        const response = await fetch(uri, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        if (!response.ok) {
            throw new Error(`Failed to evaluate prompt: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.id;
    }

    async waitForEvaluation(promptId, evaluationId) {
        const uri = `https://graph.microsoft.com/beta/security/securityCopilot/workspaces/${this.workspaceId}/sessions/${this.sessionId}/prompts/${promptId}/evaluations/${evaluationId}`;
        
        let state = 'unknown';
        let attempts = 0;
        const maxAttempts = 60; // 30 seconds timeout
        
        while (state !== 'completed' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const response = await fetch(uri, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to get evaluation status: ${response.statusText}`);
            }
            
            const data = await response.json();
            state = data.state;
            
            if (state === 'completed') {
                return data.result.content;
            }
            
            attempts++;
        }
        
        throw new Error('Evaluation timeout');
    }

    async createNewSession() {
        // Check if user is authenticated
        if (!this.accessToken) {
            this.showError('Please sign in before creating a new session');
            return;
        }
        
        // Show modal for session name input
        this.showSessionNameModal();
    }

    parseMarkdown(text) {
        // Escape HTML to prevent XSS
        const escapeHtml = (str) => {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        };

        // Sanitize URLs to prevent javascript: and data: URI XSS
        const sanitizeUrl = (url) => {
            const trimmed = url.trim().toLowerCase();
            if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
                return '#';
            }
            return url;
        };

        let html = escapeHtml(text);

        // Code blocks (```language\ncode\n```)
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${escapeHtml(lang || 'plaintext')}">${code.trim()}</code></pre>`;
        });

        // Tables
        const lines = html.split('\n');
        let inTable = false;
        let tableHtml = '';
        let processedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
            const isTableDivider = /^\|[\s:-]+\|/.test(line.trim());
            
            if (isTableRow && !inTable) {
                inTable = true;
                tableHtml = '<table class="markdown-table"><thead><tr>';
                const headers = line.split('|').filter(h => h.trim());
                headers.forEach(h => {
                    tableHtml += `<th>${h.trim()}</th>`;
                });
                tableHtml += '</tr></thead><tbody>';
            } else if (isTableDivider && inTable) {
                // Skip divider line
                continue;
            } else if (isTableRow && inTable) {
                tableHtml += '<tr>';
                const cells = line.split('|').filter(c => c.trim());
                cells.forEach(c => {
                    tableHtml += `<td>${c.trim()}</td>`;
                });
                tableHtml += '</tr>';
            } else if (inTable) {
                tableHtml += '</tbody></table>';
                processedLines.push(tableHtml);
                tableHtml = '';
                inTable = false;
                processedLines.push(line);
            } else {
                processedLines.push(line);
            }
        }
        
        if (inTable) {
            tableHtml += '</tbody></table>';
            processedLines.push(tableHtml);
        }
        
        html = processedLines.join('\n');

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.+?)_/g, '<em>$1</em>');

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Links with URL sanitization
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            return `<a href="${sanitizeUrl(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        });

        // Unordered lists
        html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
        html = html.replace(/^- (.+)$/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Ordered lists
        html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');

        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');

        return '<p>' + html + '</p>';
    }

    addMessage(content, type) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Render markdown for assistant and system messages
        if (type === 'assistant' || type === 'system') {
            contentDiv.innerHTML = this.parseMarkdown(content);
        } else {
            contentDiv.textContent = content;
        }
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTyping(show) {
        const indicator = document.getElementById('typingIndicator');
        if (show) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }

    showSuccess(message) {
        // Temporary success message (you could add a dedicated element)
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.backgroundColor = '#10b981';
        errorDiv.classList.remove('hidden');
        
        setTimeout(() => {
            errorDiv.classList.add('hidden');
            errorDiv.style.backgroundColor = '';
        }, 3000);
    }
}

// Initialize the chat when popup opens
document.addEventListener('DOMContentLoaded', () => {
    new SecurityCopilotChat();
});
