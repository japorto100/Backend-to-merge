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
 * A Bruno component for the chat interface
 */
class ChatInterface extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            font-family: var(--bruno-font-family, sans-serif);
        }
        
        .chat-container {
            display: flex;
            height: 100%;
        }
        
        .sidebar {
            width: 250px;
            background-color: var(--bruno-sidebar-bg, #f5f5f5);
            border-right: 1px solid var(--bruno-border-color, #e0e0e0);
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }
        
        .sidebar-header {
            padding: 15px;
            border-bottom: 1px solid var(--bruno-border-color, #e0e0e0);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .session-list {
            flex: 1;
            overflow-y: auto;
        }
        
        .session-item {
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 1px solid var(--bruno-border-color, #e0e0e0);
            transition: background-color 0.2s;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .session-item:hover {
            background-color: var(--bruno-hover-bg, #e9e9e9);
        }
        
        .session-item.active {
            background-color: var(--bruno-active-bg, #e0e0e0);
            font-weight: bold;
        }
        
        .session-title {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
        }
        
        .session-actions {
            display: flex;
            gap: 5px;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        .session-item:hover .session-actions {
            opacity: 1;
        }
        
        .action-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 2px;
            color: var(--bruno-text-color, #333);
            opacity: 0.7;
        }
        
        .action-btn:hover {
            opacity: 1;
        }
        
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .chat-header {
            padding: 15px;
            border-bottom: 1px solid var(--bruno-border-color, #e0e0e0);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 15px;
        }
        
        .message {
            margin-bottom: 20px;
            max-width: 80%;
        }
        
        .message.user {
            margin-left: auto;
            background-color: var(--bruno-user-msg-bg, #e3f2fd);
            border-radius: 15px 15px 0 15px;
            padding: 10px 15px;
        }
        
        .message.assistant {
            margin-right: auto;
            background-color: var(--bruno-assistant-msg-bg, #f5f5f5);
            border-radius: 15px 15px 15px 0;
            padding: 10px 15px;
        }
        
        .message.system {
            margin: 0 auto;
            background-color: var(--bruno-system-msg-bg, #fff3cd);
            border-radius: 10px;
            padding: 8px 12px;
            font-style: italic;
            max-width: 60%;
            text-align: center;
        }
        
        .message-content {
            word-break: break-word;
        }
        
        .message-content img {
            max-width: 100%;
            border-radius: 5px;
        }
        
        .message-content pre {
            background-color: var(--bruno-code-bg, #f0f0f0);
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
        }
        
        .message-content code {
            font-family: monospace;
            background-color: var(--bruno-inline-code-bg, #f0f0f0);
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        .message-timestamp {
            font-size: 0.8em;
            color: var(--bruno-timestamp-color, #999);
            margin-top: 5px;
            text-align: right;
        }
        
        .chat-input-container {
            padding: 15px;
            border-top: 1px solid var(--bruno-border-color, #e0e0e0);
            display: flex;
            flex-direction: column;
        }
        
        .attachments-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .attachment-item {
            display: flex;
            align-items: center;
            background-color: var(--bruno-attachment-bg, #f0f0f0);
            border-radius: 5px;
            padding: 5px 10px;
        }
        
        .attachment-name {
            margin-right: 10px;
            font-size: 0.9em;
        }
        
        .remove-attachment {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--bruno-danger-color, #dc3545);
            padding: 0;
        }
        
        .input-row {
            display: flex;
            gap: 10px;
        }
        
        .message-input {
            flex: 1;
            padding: 10px;
            border: 1px solid var(--bruno-border-color, #ccc);
            border-radius: 5px;
            font-family: inherit;
            resize: none;
            min-height: 40px;
            max-height: 200px;
        }
        
        .send-btn {
            background-color: var(--bruno-primary-color, #4a90e2);
            color: white;
            border: none;
            border-radius: 5px;
            padding: 0 15px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .send-btn:hover {
            background-color: var(--bruno-primary-hover, #3a80d2);
        }
        
        .send-btn:disabled {
            background-color: var(--bruno-disabled-color, #cccccc);
            cursor: not-allowed;
        }
        
        .attach-btn {
            background-color: var(--bruno-secondary-color, #6c757d);
            color: white;
            border: none;
            border-radius: 5px;
            padding: 0 15px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .attach-btn:hover {
            background-color: var(--bruno-secondary-hover, #5a6268);
        }
        
        .file-selector {
            position: absolute;
            bottom: 80px;
            right: 20px;
            width: 300px;
            max-height: 400px;
            overflow-y: auto;
            background-color: white;
            border: 1px solid var(--bruno-border-color, #ccc);
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            z-index: 100;
        }
        
        .file-selector-header {
            padding: 10px;
            border-bottom: 1px solid var(--bruno-border-color, #ccc);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .file-list {
            padding: 10px;
        }
        
        .file-item {
            padding: 8px;
            border-bottom: 1px solid var(--bruno-border-color, #eee);
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .file-item:hover {
            background-color: var(--bruno-hover-bg, #f5f5f5);
        }
        
        .file-upload-btn {
            display: block;
            width: 100%;
            padding: 10px;
            background-color: var(--bruno-primary-color, #4a90e2);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-align: center;
            margin-top: 10px;
        }
        
        .file-upload-btn:hover {
            background-color: var(--bruno-primary-hover, #3a80d2);
        }
        
        .error {
            color: var(--bruno-danger-color, #dc3545);
            margin-top: 10px;
            font-size: 0.9em;
        }
        
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--bruno-text-muted, #6c757d);
        }
        
        .empty-state-icon {
            font-size: 3em;
            margin-bottom: 20px;
        }
        
        .empty-state-text {
            font-size: 1.2em;
            margin-bottom: 20px;
        }
        
        .empty-state-btn {
            background-color: var(--bruno-primary-color, #4a90e2);
            color: white;
            border: none;
            border-radius: 5px;
            padding: 10px 20px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .empty-state-btn:hover {
            background-color: var(--bruno-primary-hover, #3a80d2);
        }
    `;
    
    static properties = {
        sessions: { type: Array },
        activeSessionId: { type: String },
        messages: { type: Array },
        messageInput: { type: String },
        attachments: { type: Array },
        availableFiles: { type: Array },
        showFileSelector: { type: Boolean },
        sendingMessage: { type: Boolean },
        error: { type: String },
        loading: { type: Boolean }
    };
    
    constructor() {
        super();
        this.sessions = [];
        this.activeSessionId = null;
        this.messages = [];
        this.messageInput = '';
        this.attachments = [];
        this.availableFiles = [];
        this.showFileSelector = false;
        this.sendingMessage = false;
        this.error = null;
        this.loading = true;
    }
    
    connectedCallback() {
        super.connectedCallback();
        this.loadSessions();
        this.loadAvailableFiles();
    }
    
    async loadSessions() {
        try {
            this.loading = true;
            const sessions = await ChatAPI.getSessions();
            this.sessions = sessions;
            
            if (sessions.length > 0 && !this.activeSessionId) {
                this.selectSession(sessions[0].id);
            }
            
            this.loading = false;
        } catch (error) {
            this.error = 'Failed to load chat sessions';
            this.loading = false;
            console.error(error);
        }
    }
    
    async loadAvailableFiles() {
        try {
            const files = await FilesAPI.getFiles();
            this.availableFiles = files;
        } catch (error) {
            this.error = 'Failed to load available files';
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
            
            // Scroll to bottom
            this.updateComplete.then(() => this.scrollToBottom());
        } catch (error) {
            this.error = 'Failed to load chat messages';
            console.error(error);
        }
    }
    
    async createNewSession() {
        try {
            const title = prompt('Enter a title for the new chat:');
            if (!title) return;
            
            const newSession = await ChatAPI.createSession(title);
            this.sessions = [...this.sessions, newSession];
            this.selectSession(newSession.id);
        } catch (error) {
            this.error = 'Failed to create new chat session';
            console.error(error);
        }
    }
    
    async deleteSession(sessionId, event) {
        event.stopPropagation();
        
        if (!confirm('Are you sure you want to delete this chat?')) return;
        
        try {
            await ChatAPI.deleteSession(sessionId);
            
            // Remove from sessions list
            this.sessions = this.sessions.filter(s => s.id !== sessionId);
            
            // If the active session was deleted, select another one
            if (this.activeSessionId === sessionId) {
                this.activeSessionId = null;
                this.messages = [];
                
                if (this.sessions.length > 0) {
                    this.selectSession(this.sessions[0].id);
                }
            }
        } catch (error) {
            this.error = 'Failed to delete chat session';
            console.error(error);
        }
    }
    
    async renameSession(sessionId, event) {
        event.stopPropagation();
        
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) return;
        
        const newTitle = prompt('Enter a new title for the chat:', session.title);
        if (!newTitle || newTitle === session.title) return;
        
        try {
            const updatedSession = await ChatAPI.updateSession(sessionId, { title: newTitle });
            
            // Update in sessions list
            this.sessions = this.sessions.map(s => 
                s.id === sessionId ? { ...s, title: updatedSession.title } : s
            );
        } catch (error) {
            this.error = 'Failed to rename chat session';
            console.error(error);
        }
    }
    
    async sendMessage() {
        if (!this.messageInput.trim() || !this.activeSessionId) return;
        
        const content = this.messageInput.trim();
        this.messageInput = '';
        
        // Add user message to the list immediately
        const userMessage = {
            id: 'temp-' + Date.now(),
            role: 'user',
            content: content,
            attachments: this.attachments.map(att => att.id),
            created_at: new Date().toISOString()
        };
        
        this.messages = [...this.messages, userMessage];
        
        // Add a placeholder for the AI response
        const aiPlaceholder = {
            id: 'placeholder-' + Date.now(),
            role: 'assistant',
            content: '...',
            created_at: new Date().toISOString(),
            isPlaceholder: true
        };
        
        this.messages = [...this.messages, aiPlaceholder];
        
        // Scroll to bottom
        this.updateComplete.then(() => this.scrollToBottom());
        
        try {
            this.sendingMessage = true;
            
            // Send the message to the API
            const response = await ChatAPI.sendMessage(
                this.activeSessionId, 
                content,
                this.attachments.map(att => att.id)
            );
            
            // Replace the placeholder with the actual response
            this.messages = this.messages.filter(msg => !msg.isPlaceholder);
            this.messages = [...this.messages, response.ai_message];
            
            // Clear attachments
            this.attachments = [];
            
            this.sendingMessage = false;
            
            // Scroll to bottom
            this.updateComplete.then(() => this.scrollToBottom());
        } catch (error) {
            // Remove the placeholder
            this.messages = this.messages.filter(msg => !msg.isPlaceholder);
            
            // Add error message
            this.messages = [...this.messages, {
                id: 'error-' + Date.now(),
                role: 'system',
                content: 'Error: Failed to send message. Please try again.',
                created_at: new Date().toISOString()
            }];
            
            this.sendingMessage = false;
            this.error = 'Failed to send message';
            console.error(error);
        }
    }
    
    scrollToBottom() {
        const chatMessages = this.shadowRoot.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    handleInputChange(event) {
        this.messageInput = event.target.value;
    }
    
    toggleFileSelector() {
        this.showFileSelector = !this.showFileSelector;
    }
    
    attachFile(file) {
        // Check if already attached
        if (this.attachments.some(att => att.id === file.id)) return;
        
        this.attachments = [...this.attachments, file];
        this.showFileSelector = false;
    }
    
    removeAttachment(fileId) {
        this.attachments = this.attachments.filter(att => att.id !== fileId);
    }
    
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Upload the file
        const formData = new FormData();
        formData.append('file', file);
        
        fetch('/api/models/files/', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Add to attachments
            this.attachments = [...this.attachments, data];
            
            // Refresh available files
            this.loadAvailableFiles();
        })
        .catch(error => {
            console.error('Error uploading file:', error);
            this.error = 'Failed to upload file';
        });
        
        // Reset the input
        event.target.value = '';
    }
    
    renderMarkdown(content) {
        // Convert markdown to HTML and sanitize
        const html = marked.parse(content);
        const sanitized = DOMPurify.sanitize(html);
        return unsafeHTML(sanitized);
    }
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }
    
    render() {
        return html`
            <div class="chat-container">
                <div class="sidebar">
                    <div class="sidebar-header">
                        <h3>Chats</h3>
                        <button @click="${this.createNewSession}" class="action-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="session-list">
                        ${this.loading ? html`<div class="loading">Loading...</div>` : ''}
                        
                        ${this.sessions.length === 0 && !this.loading ? html`
                            <div class="empty-sessions">No chats yet</div>
                        ` : ''}
                        
                        ${repeat(this.sessions, session => session.id, session => html`
                            <div class="session-item ${session.id === this.activeSessionId ? 'active' : ''}"
                                 @click="${() => this.selectSession(session.id)}">
                                <div class="session-title">${session.title}</div>
                                <div class="session-actions">
                                    <button @click="${(e) => this.renameSession(session.id, e)}" class="action-btn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                                        </svg>
                                    </button>
                                    <button @click="${(e) => this.deleteSession(session.id, e)}" class="action-btn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `)}
                    </div>
                </div>
                
                <div class="main-content">
                    ${this.activeSessionId ? html`
                        <div class="chat-header">
                            <h3>${this.sessions.find(s => s.id === this.activeSessionId)?.title || 'Chat'}</h3>
                        </div>
                        
                        <div class="chat-messages">
                            ${repeat(this.messages, message => message.id, message => html`
                                <div class="message ${message.role}">
                                    <div class="message-content">
                                        ${this.renderMarkdown(message.content)}
                                    </div>
                                    <div class="message-timestamp">
                                        ${this.formatTimestamp(message.created_at)}
                                    </div>
                                </div>
                            `)}
                        </div>
                        
                        <div class="chat-input-container">
                            ${this.attachments.length > 0 ? html`
                                <div class="attachments-container">
                                    ${repeat(this.attachments, att => att.id, att => html`
                                        <div class="attachment-item">
                                            <span class="attachment-name">${att.original_filename}</span>
                                            <button @click="${() => this.removeAttachment(att.id)}" class="remove-attachment">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    `)}
                                </div>
                            ` : ''}
                            
                            <div class="input-row">
                                <textarea 
                                    class="message-input" 
                                    placeholder="Type your message..." 
                                    .value="${this.messageInput}"
                                    @input="${this.handleInputChange}"
                                    @keydown="${e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), this.sendMessage())}"
                                ></textarea>
                                
                                <button 
                                    class="attach-btn"
                                    @click="${this.toggleFileSelector}"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
                                    </svg>
                                </button>
                                
                                <button 
                                    class="send-btn"
                                    @click="${this.sendMessage}"
                                    ?disabled="${!this.messageInput.trim() || this.sendingMessage}"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
                                    </svg>
                                </button>
                            </div>
                            
                            ${this.showFileSelector ? html`
                                <div class="file-selector">
                                    <div class="file-selector-header">
                                        <h4>Select a file</h4>
                                        <button @click="${this.toggleFileSelector}" class="action-btn">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    <div class="file-selector-content">
                                        <div class="file-upload-area">
                                            <label for="file-upload" class="file-upload-label">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                                    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                                                </svg>
                                                <span>Upload a file</span>
                                            </label>
                                            <input id="file-upload" type="file" @change="${this.handleFileUpload}" />
                                        </div>
                                        
                                        <div class="available-files">
                                            <h5>Your files</h5>
                                            ${this.loadingFiles ? html`<div class="loading">Loading files...</div>` : ''}
                                            
                                            ${this.availableFiles.length === 0 && !this.loadingFiles ? html`
                                                <div class="empty-files">No files available</div>
                                            ` : ''}
                                            
                                            ${repeat(this.availableFiles, file => file.id, file => html`
                                                <div class="file-item" @click="${() => this.attachFile(file)}">
                                                    <div class="file-icon">
                                                        ${file.file_type === 'image' ? html`
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                                                                <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                                                            </svg>
                                                        ` : file.file_type === 'document' ? html`
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z"/>
                                                                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
                                                            </svg>
                                                        ` : html`
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                                                            </svg>
                                                        `}
                                                    </div>
                                                    <div class="file-details">
                                                        <div class="file-name">${file.original_filename}</div>
                                                        <div class="file-meta">${file.file_type} · ${this.formatFileSize(file.file_size)}</div>
                                                    </div>
                                                </div>
                                            `)}
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    ` : html`
                        <div class="empty-chat">
                            <div class="empty-chat-content">
                                <h2>Welcome to the Chat</h2>
                                <p>Start a new conversation or select an existing one from the sidebar.</p>
                                <button @click="${this.createNewSession}" class="new-chat-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z"/>
                                    </svg>
                                    New Chat
                                </button>
                            </div>
                        </div>
                    `}
                </div>
            </div>
            
            ${this.error ? html`
                <div class="error-toast">
                    ${this.error}
                    <button @click="${() => this.error = null}" class="close-error">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                    </button>
                </div>
            ` : ''}
            
            ${this.showRenameDialog ? html`
                <div class="dialog-overlay">
                    <div class="dialog">
                        <h3>Rename Chat</h3>
                        <input type="text" .value="${this.renameInput}" @input="${e => this.renameInput = e.target.value}" />
                        <div class="dialog-actions">
                            <button @click="${this.cancelRename}" class="cancel-btn">Cancel</button>
                            <button @click="${this.confirmRename}" class="confirm-btn">Rename</button>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
    }
    
    static properties = {
        sessions: { type: Array },
        messages: { type: Array },
        activeSessionId: { type: String },
        messageInput: { type: String },
        loading: { type: Boolean },
        sendingMessage: { type: Boolean },
        error: { type: String },
        showRenameDialog: { type: Boolean },
        renameInput: { type: String },
        renameSessionId: { type: String },
        attachments: { type: Array },
        showFileSelector: { type: Boolean },
        availableFiles: { type: Array },
        loadingFiles: { type: Boolean }
    };
    
    constructor() {
        super();
        this.sessions = [];
        this.messages = [];
        this.activeSessionId = null;
        this.messageInput = '';
        this.loading = true;
        this.sendingMessage = false;
        this.error = null;
        this.showRenameDialog = false;
        this.renameInput = '';
        this.renameSessionId = null;
        this.attachments = [];
        this.showFileSelector = false;
        this.availableFiles = [];
        this.loadingFiles = false;
    }
    
    connectedCallback() {
        super.connectedCallback();
        this.loadSessions();
    }
    
    updated(changedProperties) {
        if (changedProperties.has('activeSessionId') && this.activeSessionId) {
            this.loadMessages(this.activeSessionId);
        }
        
        if (changedProperties.has('messages')) {
            this.scrollToBottom();
        }
        
        if (changedProperties.has('showFileSelector') && this.showFileSelector) {
            this.loadAvailableFiles();
        }
    }
    
    async loadSessions() {
        this.loading = true;
        try {
            const sessions = await ChatAPI.getSessions();
            this.sessions = sessions;
            
            // If there are sessions but no active session, select the first one
            if (sessions.length > 0 && !this.activeSessionId) {
                this.selectSession(sessions[0].id);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
            this.error = 'Failed to load chat sessions';
        } finally {
            this.loading = false;
        }
    }
    
    async loadMessages(sessionId) {
        if (!sessionId) return;
        
        this.loading = true;
        try {
            const messages = await ChatAPI.getMessages(sessionId);
            this.messages = messages;
        } catch (error) {
            console.error('Error loading messages:', error);
            this.error = 'Failed to load messages';
        } finally {
            this.loading = false;
        }
    }
    
    async loadAvailableFiles() {
        this.loadingFiles = true;
        try {
            const files = await FilesAPI.getFiles();
            this.availableFiles = files;
        } catch (error) {
            console.error('Error loading files:', error);
            this.error = 'Failed to load files';
        } finally {
            this.loadingFiles = false;
        }
    }
    
    selectSession(sessionId) {
        this.activeSessionId = sessionId;
        this.attachments = []; // Clear attachments when switching sessions
    }
    
    async createNewSession() {
        try {
            const newSession = await ChatAPI.createSession('New Chat', 'gpt-3.5-turbo');
            this.sessions = [...this.sessions, newSession];
            this.selectSession(newSession.id);
        } catch (error) {
            console.error('Error creating new session:', error);
            this.error = 'Failed to create new chat';
        }
    }
    
    async sendMessage() {
        if (!this.messageInput.trim() || !this.activeSessionId || this.sendingMessage) return;
        
        const content = this.messageInput.trim();
        this.messageInput = '';
        this.sendingMessage = true;
        
        // Add user message to the UI immediately
        const tempUserMessage = {
            id: `temp-${Date.now()}`,
            content: content,
            role: 'user',
            created_at: new Date().toISOString()
        };
        
        this.messages = [...this.messages, tempUserMessage];
        
        try {
            // Send the message to the API
            const response = await ChatAPI.sendMessage(
                this.activeSessionId, 
                content, 
                this.attachments.map(att => att.id)
            );
            
            // Replace the temporary message with the actual one from the API
            this.messages = this.messages.filter(m => m.id !== tempUserMessage.id);
            this.messages = [...this.messages, ...response.messages];
            
            // Clear attachments after sending
            this.attachments = [];
        } catch (error) {
            console.error('Error sending message:', error);
            this.error = 'Failed to send message';
            
            // Remove the temporary message if there was an error
            this.messages = this.messages.filter(m => m.id !== tempUserMessage.id);
        } finally {
            this.sendingMessage = false;
        }
    }
    
    async deleteSession(sessionId, event) {
        // Prevent the click from selecting the session
        event.stopPropagation();
        
        if (confirm('Are you sure you want to delete this chat?')) {
            try {
                await ChatAPI.deleteSession(sessionId);
                
                // Remove from the list
                this.sessions = this.sessions.filter(s => s.id !== sessionId);
                
                // If the active session was deleted, select another one or clear
                if (this.activeSessionId === sessionId) {
                    this.activeSessionId = this.sessions.length > 0 ? this.sessions[0].id : null;
                    this.messages = [];
                }
            } catch (error) {
                console.error('Error deleting session:', error);
                this.error = 'Failed to delete chat';
            }
        }
    }
    
    renameSession(sessionId, event) {
        // Prevent the click from selecting the session
        event.stopPropagation();
        
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            this.renameSessionId = sessionId;
            this.renameInput = session.title;
            this.showRenameDialog = true;
        }
    }
    
    async confirmRename() {
        if (!this.renameInput.trim() || !this.renameSessionId) {
            this.cancelRename();
            return;
        }
        
        try {
            const updatedSession = await ChatAPI.updateSession(this.renameSessionId, {
                title: this.renameInput.trim()
            });
            
            // Update the session in the list
            this.sessions = this.sessions.map(s => 
                s.id === this.renameSessionId ? updatedSession : s
            );
            
            this.cancelRename();
        } catch (error) {
            console.error('Error renaming session:', error);
            this.error = 'Failed to rename chat';
        }
    }
    
    cancelRename() {
        this.showRenameDialog = false;
        this.renameInput = '';
        this.renameSessionId = null;
    }
    
    scrollToBottom() {
        const chatMessages = this.shadowRoot.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    handleInputChange(event) {
        this.messageInput = event.target.value;
    }
    
    toggleFileSelector() {
        this.showFileSelector = !this.showFileSelector;
    }
    
    attachFile(file) {
        // Check if already attached
        if (this.attachments.some(att => att.id === file.id)) return;
        
        this.attachments = [...this.attachments, file];
        this.showFileSelector = false;
    }
    
    removeAttachment(fileId) {
        this.attachments = this.attachments.filter(att => att.id !== fileId);
    }
    
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Upload the file
        const formData = new FormData();
        formData.append('file', file);
        
        fetch('/api/models/files/', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Add to attachments
            this.attachments = [...this.attachments, data];
            
            // Refresh available files
            this.loadAvailableFiles();
        })
        .catch(error => {
            console.error('Error uploading file:', error);
            this.error = 'Failed to upload file';
        });
        
        // Reset the input
        event.target.value = '';
    }
    
    renderMarkdown(content) {
        // Convert markdown to HTML and sanitize
        const html = marked.parse(content);
        const sanitized = DOMPurify.sanitize(html);
        return unsafeHTML(sanitized);
    }
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
}

customElements.define('bruno-chat-interface', ChatInterface);

export default ChatInterface;