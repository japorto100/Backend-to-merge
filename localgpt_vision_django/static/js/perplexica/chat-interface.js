import { html, css, LitElement } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import ChatAPI from '../api/chat-api.js';
import FilesAPI from '../api/files-api.js';

/**
 * Chat Interface Component
 * 
 * Vereinfachte Chat-Komponente ohne API-Testing Funktionalitäten
 */
class ChatInterface extends LitElement {
    static properties = {
        sessions: { type: Array },
        messages: { type: Array },
        activeSessionId: { type: String },
        messageInput: { type: String },
        loading: { type: Boolean },
        sendingMessage: { type: Boolean },
        error: { type: String },
        attachments: { type: Array },
        focusMode: { type: Boolean },
        suggestions: { type: Array },
        messageTypes: { type: Object },
        rewriteMessageId: { type: String },
        loadingMessages: { type: Array },
        typingIndicator: { type: Boolean },
        editingMessageId: { type: String },
        pinnedMessages: { type: Array },
        threadView: { type: Boolean },
        selectedThread: { type: String },
        chatTitle: { type: String },
        focusModeType: { type: String }, // 'none', 'minimal', 'zen', 'full'
        sharedMessages: { type: Array },
        copilotMode: { type: Boolean },
        copilotSuggestion: { type: String },
        copilotEnabled: { type: Boolean },
        performanceMetrics: { type: Object },
        debugInfo: { type: Object }
    };
    
    constructor() {
        super();
        this.sessions = [];
        this.messages = [];
        this.activeSessionId = null;
        this.messageInput = '';
        this.loading = false;
        this.sendingMessage = false;
        this.error = null;
        this.attachments = [];
        this.focusMode = false;
        this.suggestions = [];
        this.messageTypes = {
            SYSTEM: 'system',
            USER: 'user',
            ASSISTANT: 'assistant'
        };
        this.rewriteMessageId = null;
        this.loadingMessages = [];
        this.typingIndicator = false;
        this.editingMessageId = null;
        this.pinnedMessages = [];
        this.threadView = false;
        this.selectedThread = null;
        this.chatTitle = '';
        this.focusModeType = 'none';
        this.sharedMessages = [];
        this.copilotMode = false;
        this.copilotSuggestion = '';
        this.copilotEnabled = false;
        this.performanceMetrics = {
            avgResponseTime: 0,
            messageCount: 0,
            tokenUsage: 0,
            lastUpdateTime: null,
            cacheHitRate: 0,
            dbQueryCount: 0,
            memoryUsage: 0,
            activeConnections: 0,
            wsLatency: 0,
            apiCallsPerMinute: 0,
            errorRate: 0
        };
        this.debugInfo = {
            lastError: null,
            apiStatus: 'ok',
            wsStatus: 'connected',
            modelInfo: null,
            dbStatus: {
                connections: 0,
                queryLog: [],
                slowQueries: [],
                indexUsage: {}
            },
            cacheStatus: {
                size: 0,
                hits: 0,
                misses: 0,
                keys: []
            },
            systemStatus: {
                cpu: 0,
                memory: 0,
                uptime: 0
            }
        };
    }

    // Lifecycle methods
    connectedCallback() {
        super.connectedCallback();
        this.loadSessions();
    }

    updated(changedProperties) {
        if (changedProperties.has('messages')) {
            this.scrollToBottom();
        }
    }

    // Core chat functionality
    async loadSessions() {
        try {
            const sessions = await ChatAPI.getSessions();
            this.sessions = sessions;
            if (sessions.length > 0 && !this.activeSessionId) {
                this.selectSession(sessions[0].id);
            }
        } catch (error) {
            this.error = 'Failed to load chat sessions';
            console.error(error);
        }
    }

    async selectSession(sessionId) {
        if (this.activeSessionId === sessionId) return;
        
        try {
            this.activeSessionId = sessionId;
            this.messages = [];
            const messages = await ChatAPI.getMessages(sessionId);
            this.messages = messages;
            this.scrollToBottom();
        } catch (error) {
            this.error = 'Failed to load chat messages';
            console.error(error);
        }
    }

    // Focus Mode
    toggleFocusMode() {
        this.focusMode = !this.focusMode;
        document.body.classList.toggle('focus-mode', this.focusMode);
    }

    // Message Rewrite
    async rewriteMessage(messageId) {
        this.rewriteMessageId = messageId;
        const message = this.messages.find(m => m.id === messageId);
        if (!message) return;

        try {
            const rewrittenMessage = await ChatAPI.rewriteMessage(
                this.activeSessionId,
                messageId
            );
            
            // Replace old message with rewritten one
            this.messages = this.messages.map(m => 
                m.id === messageId ? rewrittenMessage : m
            );
        } catch (error) {
            this.error = 'Failed to rewrite message';
            console.error(error);
        } finally {
            this.rewriteMessageId = null;
        }
    }

    // Auto-Complete & Suggestions
    async updateSuggestions(input) {
        if (!input || input.length < 2) {
            this.suggestions = [];
            return;
        }

        try {
            this.suggestions = await ChatAPI.getSuggestions(input);
        } catch (error) {
            console.error('Failed to get suggestions:', error);
            this.suggestions = [];
        }
    }

    applySuggestion(suggestion) {
        this.messageInput = suggestion;
        this.suggestions = [];
    }

    // Loading States
    addLoadingMessage() {
        const loadingId = `loading-${Date.now()}`;
        this.loadingMessages = [...this.loadingMessages, loadingId];
        return loadingId;
    }

    removeLoadingMessage(loadingId) {
        this.loadingMessages = this.loadingMessages.filter(id => id !== loadingId);
    }

    // Enhanced Message Sending
    async sendMessage() {
        if (!this.messageInput.trim() && !this.attachments.length) return;

        const loadingId = this.addLoadingMessage();
        this.sendingMessage = true;

        try {
            const message = await ChatAPI.sendMessage(
                this.activeSessionId,
                this.messageInput,
                this.attachments,
                this.messageTypes.USER
            );

            this.messages = [...this.messages, message];
            this.messageInput = '';
            this.attachments = [];
            this.scrollToBottom();
        } catch (error) {
            this.error = 'Failed to send message';
            console.error(error);
        } finally {
            this.sendingMessage = false;
            this.removeLoadingMessage(loadingId);
        }
    }

    // UI helpers
    scrollToBottom() {
        const chatMessages = this.shadowRoot.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    renderMarkdown(content) {
        const html = marked.parse(content);
        const sanitized = DOMPurify.sanitize(html);
        return unsafeHTML(sanitized);
    }

    // Event handlers
    handleInputChange(event) {
        this.messageInput = event.target.value;
    }

    handleKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    // Message Threading
    async startThread(messageId) {
        this.selectedThread = messageId;
        this.threadView = true;
        try {
            const threadMessages = await ChatAPI.getThreadMessages(messageId);
            this.messages = threadMessages;
        } catch (error) {
            this.error = 'Failed to load thread';
            console.error(error);
        }
    }

    // Message Editing
    async editMessage(messageId) {
        this.editingMessageId = messageId;
        const message = this.messages.find(m => m.id === messageId);
        if (!message) return;
        this.messageInput = message.content;
    }

    async saveEdit() {
        if (!this.editingMessageId) return;

        try {
            const updatedMessage = await ChatAPI.updateMessage(
                this.editingMessageId,
                this.messageInput
            );
            
            this.messages = this.messages.map(m => 
                m.id === this.editingMessageId ? updatedMessage : m
            );
            this.messageInput = '';
            this.editingMessageId = null;
        } catch (error) {
            this.error = 'Failed to update message';
            console.error(error);
        }
    }

    // Message Pinning
    togglePinMessage(messageId) {
        const isPinned = this.pinnedMessages.includes(messageId);
        if (isPinned) {
            this.pinnedMessages = this.pinnedMessages.filter(id => id !== messageId);
        } else {
            this.pinnedMessages = [...this.pinnedMessages, messageId];
        }
    }

    // Typing Indicator
    startTyping() {
        if (!this.typingIndicator) {
            this.typingIndicator = true;
            ChatAPI.sendTypingStatus(this.activeSessionId, true);
        }
    }

    stopTyping() {
        if (this.typingIndicator) {
            this.typingIndicator = false;
            ChatAPI.sendTypingStatus(this.activeSessionId, false);
        }
    }

    // Enhanced Message Rendering
    renderMessage(message) {
        const isEditing = this.editingMessageId === message.id;
        const isPinned = this.pinnedMessages.includes(message.id);

        return html`
            <div class="message ${message.type} 
                              ${isEditing ? 'editing' : ''} 
                              ${isPinned ? 'pinned' : ''}">
                ${this.renderMessageHeader(message)}
                
                <div class="message-content">
                    ${isEditing ? html`
                        <textarea
                            .value="${this.messageInput}"
                            @input="${this.handleInputChange}"
                            @keypress="${this.handleKeyPress}"
                        ></textarea>
                        <div class="edit-actions">
                            <button @click="${this.saveEdit}">Save</button>
                            <button @click="${() => this.editingMessageId = null}">Cancel</button>
                        </div>
                    ` : html`
                        ${this.renderMarkdown(message.content)}
                    `}
                </div>

                <div class="message-actions">
                    ${message.type === this.messageTypes.USER ? html`
                        <button @click="${() => this.editMessage(message.id)}">
                            Edit
                        </button>
                    ` : ''}
                    <button @click="${() => this.togglePinMessage(message.id)}">
                        ${isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button @click="${() => this.startThread(message.id)}">
                        Thread
                    </button>
                </div>
            </div>
        `;
    }

    renderMessageHeader(message) {
        return html`
            <div class="message-header">
                <span class="message-timestamp">
                    ${this.formatTimestamp(message.timestamp)}
                </span>
                ${message.edited ? html`
                    <span class="message-edited">(edited)</span>
                ` : ''}
                ${this.pinnedMessages.includes(message.id) ? html`
                    <span class="message-pinned">📌</span>
                ` : ''}
            </div>
        `;
    }

    // Main render method
    render() {
        return html`
            <div class="chat-container ${this.focusMode ? 'focus-mode' : ''}">
                <div class="chat-sidebar">
                    <button @click="${this.createNewSession}" class="new-chat-btn">
                        New Chat
                    </button>
                    <div class="sessions-list">
                        ${this.sessions.map(session => html`
                            <div class="session-item ${session.id === this.activeSessionId ? 'active' : ''}"
                                 @click="${() => this.selectSession(session.id)}">
                                ${session.title}
                            </div>
                        `)}
                    </div>
                </div>
                
                <div class="chat-main">
                    ${this.threadView ? this.renderThreadView() : this.renderMainView()}
                </div>

                ${this.renderPinnedMessages()}
            </div>
            
            ${this.error ? html`
                <div class="error-toast">
                    ${this.error}
                    <button @click="${() => this.error = null}">×</button>
                </div>
            ` : ''}
        `;
    }

    static styles = css`
        .focus-mode {
            background: var(--bruno-focus-bg, #1a1a1a);
            color: var(--bruno-focus-text, #ffffff);
        }

        .loading-indicator {
            display: flex;
            gap: 4px;
            padding: 8px;
        }

        .dot {
            width: 8px;
            height: 8px;
            background: currentColor;
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out;
        }

        .suggestions {
            position: absolute;
            bottom: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid var(--bruno-border-color);
            border-radius: 4px;
            max-height: 200px;
            overflow-y: auto;
        }

        .suggestion {
            padding: 8px;
            cursor: pointer;
        }

        .suggestion:hover {
            background: var(--bruno-hover-bg);
        }

        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }

        .message.pinned {
            border-left: 3px solid var(--bruno-accent-color, #ffd700);
        }

        .message.editing {
            background: var(--bruno-editing-bg, #f0f0f0);
        }

        .message-header {
            display: flex;
            gap: 8px;
            font-size: 0.8em;
            color: var(--bruno-text-secondary);
        }

        .edit-actions {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }

        .pinned-messages {
            position: fixed;
            top: 0;
            right: 0;
            max-width: 300px;
            background: white;
            border-left: 1px solid var(--bruno-border-color);
            padding: 16px;
        }

        .focus-mode-minimal {
            --bruno-bg: #fafafa;
            --bruno-text: #333;
        }

        .focus-mode-zen {
            --bruno-bg: #000;
            --bruno-text: #fff;
        }

        .focus-mode-full {
            --bruno-bg: #1a1a1a;
            --bruno-text: #fff;
            --bruno-sidebar-width: 0px;
        }

        .message-actions {
            opacity: 0;
            transition: opacity 0.2s;
        }

        .message:hover .message-actions {
            opacity: 1;
        }

        .copilot-container {
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 300px;
            background: var(--bruno-bg-secondary);
            border-left: 1px solid var(--bruno-border-color);
            padding: 16px;
        }

        .copilot-suggestion {
            font-family: monospace;
            padding: 8px;
            background: var(--bruno-code-bg);
            border-radius: 4px;
            margin-top: 8px;
        }

        .debug-panel {
            position: fixed;
            bottom: 0;
            right: 0;
            background: var(--bruno-bg-secondary);
            padding: 16px;
            border-top-left-radius: 8px;
            border: 1px solid var(--bruno-border-color);
            max-width: 400px;
            max-height: 600px;
            overflow-y: auto;
        }

        .metrics-section, .debug-section {
            margin-bottom: 16px;
            padding: 8px;
            background: var(--bruno-bg-tertiary);
            border-radius: 4px;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
        }

        .query-item {
            font-family: monospace;
            font-size: 0.8em;
            padding: 4px;
            background: var(--bruno-code-bg);
            margin: 2px 0;
            border-radius: 2px;
        }

        .slow-queries {
            max-height: 150px;
            overflow-y: auto;
        }
    `;

    // Enhanced Focus Mode
    setFocusMode(type) {
        this.focusModeType = type;
        document.body.className = `focus-mode-${type}`;
    }

    // Share functionality
    async shareMessage(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (!message) return;

        try {
            const shareUrl = await ChatAPI.createShareLink(messageId);
            await navigator.clipboard.writeText(shareUrl);
            this.sharedMessages = [...this.sharedMessages, messageId];
        } catch (error) {
            this.error = 'Failed to share message';
            console.error(error);
        }
    }

    // Auto Title Generation
    updateChatTitle() {
        if (this.messages.length > 0) {
            const firstMessage = this.messages[0].content;
            this.chatTitle = firstMessage.substring(0, 30) + '...';
            document.title = `${this.chatTitle} - Chat`;
        }
    }

    // Chat Export/Import
    exportChat() {
        const chatData = {
            title: this.chatTitle,
            messages: this.messages,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(chatData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${this.activeSessionId}.json`;
        a.click();
    }

    async importChat(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const chatData = JSON.parse(text);
            
            // Create new session with imported data
            const sessionId = await ChatAPI.createSession(chatData);
            this.selectSession(sessionId);
        } catch (error) {
            this.error = 'Failed to import chat';
            console.error(error);
        }
    }

    // Enhanced Message Actions
    renderMessageActions(message) {
        return html`
            <div class="message-actions">
                <button @click="${() => this.shareMessage(message.id)}">
                    ${this.sharedMessages.includes(message.id) ? 'Shared' : 'Share'}
                </button>
                <button @click="${() => this.editMessage(message.id)}">
                    Edit
                </button>
                <button @click="${() => this.togglePinMessage(message.id)}">
                    ${this.pinnedMessages.includes(message.id) ? 'Unpin' : 'Pin'}
                </button>
                <button @click="${() => this.startThread(message.id)}">
                    Thread
                </button>
            </div>
        `;
    }

    // Focus Mode Selector
    renderFocusModeSelector() {
        return html`
            <div class="focus-mode-selector">
                <select @change="${(e) => this.setFocusMode(e.target.value)}">
                    <option value="none">Normal Mode</option>
                    <option value="minimal">Minimal</option>
                    <option value="zen">Zen Mode</option>
                    <option value="full">Full Focus</option>
                </select>
            </div>
        `;
    }

    // Copilot Mode
    toggleCopilot() {
        this.copilotMode = !this.copilotMode;
        if (this.copilotMode) {
            this.startCopilot();
        } else {
            this.stopCopilot();
        }
    }

    async startCopilot() {
        this.copilotEnabled = true;
        await ChatAPI.enableCopilot(this.activeSessionId);
    }

    stopCopilot() {
        this.copilotEnabled = false;
        this.copilotSuggestion = '';
        ChatAPI.disableCopilot(this.activeSessionId);
    }

    async updateCopilotSuggestion(input) {
        if (!this.copilotEnabled || input.length < 2) return;

        try {
            const suggestion = await ChatAPI.getCopilotSuggestion(input);
            this.copilotSuggestion = suggestion;
        } catch (error) {
            console.error('Copilot suggestion failed:', error);
            this.copilotSuggestion = '';
        }
    }

    // Performance Monitoring
    updatePerformanceMetrics(data) {
        const now = Date.now();
        this.performanceMetrics = {
            ...this.performanceMetrics,
            messageCount: this.performanceMetrics.messageCount + 1,
            avgResponseTime: this.calculateAvgResponseTime(data.timestamp),
            tokenUsage: this.calculateTokenUsage(data.content),
            lastUpdateTime: now,
            cacheHitRate: data.cacheStats?.hitRate || 0,
            dbQueryCount: data.dbStats?.queryCount || 0,
            memoryUsage: data.systemStats?.memoryUsage || 0,
            activeConnections: data.networkStats?.connections || 0,
            wsLatency: data.networkStats?.wsLatency || 0,
            apiCallsPerMinute: data.apiStats?.callsPerMinute || 0,
            errorRate: data.errorStats?.rate || 0
        };
    }

    // Debug Information
    updateDebugInfo(info) {
        this.debugInfo = {
            ...this.debugInfo,
            ...info,
            lastUpdate: new Date().toISOString(),
            dbStatus: {
                connections: info.dbStats?.connections || 0,
                queryLog: info.dbStats?.recentQueries || [],
                slowQueries: info.dbStats?.slowQueries || [],
                indexUsage: info.dbStats?.indexStats || {}
            },
            cacheStatus: {
                size: info.cacheStats?.size || 0,
                hits: info.cacheStats?.hits || 0,
                misses: info.cacheStats?.misses || 0,
                keys: info.cacheStats?.keys || []
            },
            systemStatus: {
                cpu: info.systemStats?.cpuUsage || 0,
                memory: info.systemStats?.memoryUsage || 0,
                uptime: info.systemStats?.uptime || 0
            }
        };
    }

    renderCopilotView() {
        if (!this.copilotMode) return '';

        return html`
            <div class="copilot-container ${this.copilotEnabled ? 'active' : ''}">
                <div class="copilot-header">
                    <span>Copilot Mode ${this.copilotEnabled ? '(Active)' : '(Inactive)'}</span>
                    <button @click="${this.toggleCopilot}">
                        ${this.copilotEnabled ? 'Disable' : 'Enable'} Copilot
                    </button>
                </div>
                <div class="copilot-suggestion">
                    ${this.copilotSuggestion}
                </div>
            </div>
        `;
    }

    renderDebugPanel() {
        return html`
            <div class="debug-panel">
                <h3>Debug Information</h3>
                
                <div class="metrics-section">
                    <h4>Performance</h4>
                    <div class="metrics-grid">
                        <div>Messages: ${this.performanceMetrics.messageCount}</div>
                        <div>Avg Response: ${this.performanceMetrics.avgResponseTime}ms</div>
                        <div>Cache Hit Rate: ${this.performanceMetrics.cacheHitRate}%</div>
                        <div>DB Queries: ${this.performanceMetrics.dbQueryCount}</div>
                        <div>Memory: ${this.formatBytes(this.performanceMetrics.memoryUsage)}</div>
                        <div>WS Latency: ${this.performanceMetrics.wsLatency}ms</div>
                        <div>API Calls/min: ${this.performanceMetrics.apiCallsPerMinute}</div>
                        <div>Error Rate: ${this.performanceMetrics.errorRate}%</div>
                    </div>
                </div>

                <div class="debug-section">
                    <h4>Database</h4>
                    <div>Connections: ${this.debugInfo.dbStatus.connections}</div>
                    <div class="slow-queries">
                        <h5>Slow Queries</h5>
                        ${this.debugInfo.dbStatus.slowQueries.map(query => html`
                            <div class="query-item">${query.sql} (${query.duration}ms)</div>
                        `)}
                    </div>
                </div>

                <div class="debug-section">
                    <h4>Cache</h4>
                    <div>Size: ${this.formatBytes(this.debugInfo.cacheStatus.size)}</div>
                    <div>Hit Ratio: ${this.calculateHitRatio()}%</div>
                </div>

                <div class="debug-section">
                    <h4>System</h4>
                    <div>CPU: ${this.debugInfo.systemStatus.cpu}%</div>
                    <div>Memory: ${this.formatBytes(this.debugInfo.systemStatus.memory)}</div>
                    <div>Uptime: ${this.formatUptime(this.debugInfo.systemStatus.uptime)}</div>
                </div>
            </div>
        `;
    }

    // Utility Funktionen
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    }

    calculateHitRatio() {
        const { hits, misses } = this.debugInfo.cacheStatus;
        const total = hits + misses;
        return total === 0 ? 0 : ((hits / total) * 100).toFixed(1);
    }
}

customElements.define('bruno-chat-interface', ChatInterface);

export default ChatInterface;