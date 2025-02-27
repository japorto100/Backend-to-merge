import { html, css, LitElement } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import SearchAPI from '../api/search-api.js';
import { getProviderTemplatesList, getProviderTemplate } from './provider-templates.js';
import '../../css/provider-dialog.css';

class SearchInterface extends LitElement {
    static properties = {
        mode: { type: String },
        query: { type: String },
        results: { type: Array },
        loading: { type: Boolean },
        error: { type: String },
        viewMode: { type: String }, // 'list', 'grid', 'split'
        providerFilters: { type: Object },
        timeRange: { type: String },
        sortBy: { type: String },
        language: { type: String },
        availableProviders: { type: Array },
        customProviders: { type: Array },
        selectedProviders: { type: Array }
    };

    constructor() {
        super();
        this.mode = 'all';
        this.query = '';
        this.results = [];
        this.loading = false;
        this.error = null;
        this.viewMode = 'list';
        this.timeRange = 'anytime';
        this.sortBy = 'relevance';
        this.language = 'en';

        // Built-in providers
        this.availableProviders = [
            { 
                id: 'universal', 
                name: 'Universal Search', 
                icon: '🔍',
                description: 'AI-powered universal search across all sources',
                isDefault: true,
                filters: ['mode', 'depth', 'focus']
            },
            { 
                id: 'web', 
                name: 'Web', 
                icon: '🌐',
                filters: ['region', 'site', 'type']
            },
            { 
                id: 'academic', 
                name: 'Academic', 
                icon: '📚',
                filters: ['journal', 'year', 'citation_count', 'field']
            },
            { 
                id: 'youtube', 
                name: 'YouTube', 
                icon: '▶️',
                filters: ['duration', 'channel', 'quality', 'caption']
            },
            { 
                id: 'wolfram', 
                name: 'Wolfram', 
                icon: '🧮',
                filters: ['category', 'complexity', 'format']
            },
            { 
                id: 'reddit', 
                name: 'Reddit', 
                icon: '📱',
                filters: ['subreddit', 'sort', 'time', 'flair']
            },
            { 
                id: 'github', 
                name: 'GitHub', 
                icon: '💻',
                filters: ['language', 'stars', 'forks', 'updated']
            },
            { 
                id: 'docs', 
                name: 'Documentation', 
                icon: '📖',
                filters: ['source', 'type', 'framework', 'version', 'local']
            },
            {
                id: 'local_docs',
                name: 'Local Documents',
                icon: '📂',
                filters: ['file_type', 'folder', 'date_modified', 'content_type']
            },
            { 
                id: 'metabase', 
                name: 'Analytics', 
                icon: '📊',
                filters: [
                    'dashboard',
                    'chart_type',
                    'time_range',
                    'data_source',
                    'refresh_rate'
                ]
            },
            {
                id: 'eu_opendata',
                name: 'EU Data Portal',
                icon: '🇪🇺',
                filters: {
                    country: ['CH', 'DE', 'FR', 'IT', 'AT'],
                    dataType: ['company', 'economic', 'research', 'public'],
                    language: ['de', 'fr', 'it', 'en'],
                    year: 'all',
                    format: 'all'
                },
                baseUrl: 'https://data.europa.eu/api/hub/search/datasets'
            },
            {
                id: 'apollo',
                name: 'Apollo.io',
                icon: '🎯',
                filters: {
                    region: ['CH', 'DACH', 'EU'],
                    companySize: 'all',
                    industry: 'all',
                    technology: 'all',
                    jobTitle: 'all'
                },
                apiKey: process.env.APOLLO_API_KEY,
                baseUrl: 'https://api.apollo.io/v1'
            },
            {
                id: 'zefix',
                name: 'Zefix',  // Schweizer Handelsregister
                icon: '🇨🇭',
                filters: {
                    canton: 'all',
                    legalForm: 'all',
                    status: 'active',
                    year: 'all'
                }
            },
            {
                id: 'swissfirms',
                name: 'Swissfirms',
                icon: '🏢',
                filters: {
                    region: 'all',
                    industry: 'all',
                    size: 'all'
                }
            }
        ];

        // Custom providers added by user
        this.customProviders = [];
        
        // Default to universal search
        this.selectedProviders = ['universal'];

        this.providerFilters = {
            universal: {
                mode: 'smart',  // 'smart', 'focused', 'comprehensive'
                depth: 'auto',  // 'auto', 'shallow', 'deep'
                focus: 'all'    // 'all', 'academic', 'news', 'technical'
            },
            web: {
                region: 'global',
                site: '',
                type: 'all'
            },
            academic: {
                journal: '',
                year: 'all',
                citation_count: 0,
                field: 'all'
            },
            youtube: {
                duration: 'any',
                channel: '',
                quality: 'any',
                caption: false
            },
            wolfram: {
                category: 'all',
                complexity: 'medium',
                format: 'simple'
            },
            reddit: {
                subreddit: '',
                sort: 'relevance',
                time: 'all',
                flair: ''
            },
            github: {
                language: 'any',
                stars: 0,
                forks: 0,
                updated: 'anytime'
            },
            docs: {
                source: 'all',
                type: 'all',
                framework: 'all',
                version: 'latest',
                local: false
            },
            local_docs: {
                file_type: [
                    'pdf',
                    'doc',
                    'docx',
                    'txt',
                    'md',
                    'json',
                    'csv',
                    'xls',
                    'xlsx'
                ],
                folder: '/',
                date_modified: 'any',
                content_type: 'all'
            },
            metabase: {
                dashboard: 'all',        // specific dashboard or 'all'
                chart_type: 'any',      // table, line, bar, etc.
                time_range: 'auto',     // last_day, last_week, last_month, custom
                data_source: 'all',     // specific database or 'all'
                refresh_rate: 'auto'    // real-time, hourly, daily, etc.
            }
        };
    }

    renderProviderFilters(provider) {
        const filters = this.providerFilters[provider.id];
        if (!filters) return '';

        return html`
            <div class="provider-filters">
                <h4>${provider.name} Filters</h4>
                ${provider.filters.map(filterKey => {
                    switch(filterKey) {
                        case 'duration':
                            return html`
                                <select @change="${e => this.updateFilter(provider.id, 'duration', e.target.value)}">
                                    <option value="any">Any Length</option>
                                    <option value="short">< 4 minutes</option>
                                    <option value="medium">4-20 minutes</option>
                                    <option value="long">> 20 minutes</option>
                                </select>
                            `;
                        case 'year':
                            return html`
                                <select @change="${e => this.updateFilter(provider.id, 'year', e.target.value)}">
                                    <option value="all">All Years</option>
                                    <option value="2024">2024</option>
                                    <option value="2023">2023</option>
                                    <option value="last5">Last 5 Years</option>
                                    <option value="last10">Last 10 Years</option>
                                </select>
                            `;
                        case 'citation_count':
                            return html`
                                <input 
                                    type="number" 
                                    placeholder="Min Citations"
                                    @change="${e => this.updateFilter(provider.id, 'citation_count', e.target.value)}"
                                >
                            `;
                        // ... weitere Filter-Typen
                    }
                })}
            </div>
        `;
    }

    async search() {
        if (!this.query.trim()) return;
        
        this.loading = true;
        this.error = null;

        try {
            const searchPromises = this.selectedProviders.map(providerId => {
                const provider = this.getAllProviders().find(p => p.id === providerId);
                
                if (!provider) {
                    throw new Error(`Provider ${providerId} not found`);
                }

                return SearchAPI.searchProvider(provider, {
                    query: this.query,
                    mode: this.mode,
                    filters: this.providerFilters[providerId],
                    timeRange: this.timeRange,
                    sortBy: this.sortBy,
                    language: this.language,
                    customHeaders: provider.customHeaders
                });
            });

            const results = await Promise.all(searchPromises);
            this.results = results.flat().sort((a, b) => this.rankResult(b) - this.rankResult(a));
        } catch (error) {
            this.error = error.message;
        } finally {
            this.loading = false;
        }
    }

    sortResults(a, b) {
        switch(this.sortBy) {
            case 'relevance':
                return b.relevance - a.relevance;
            case 'date':
                return new Date(b.date) - new Date(a.date);
            case 'popularity':
                return b.popularity - a.popularity;
            default:
                return 0;
        }
    }

    toggleProvider(providerId) {
        if (this.selectedProviders.includes(providerId)) {
            this.selectedProviders = this.selectedProviders.filter(id => id !== providerId);
        } else {
            this.selectedProviders = [...this.selectedProviders, providerId];
        }
        this.requestUpdate();
    }

    setViewMode(mode) {
        this.viewMode = mode;
    }

    updateFilter(providerId, filterKey, value) {
        this.providerFilters[providerId][filterKey] = value;
    }

    renderMetabaseResult(result) {
        return html`
            <div class="metabase-result">
                <iframe
                    src="${result.embedUrl}"
                    frameborder="0"
                    width="100%"
                    height="${result.height || '400px'}"
                    allowtransparency
                ></iframe>
                <div class="result-controls">
                    <button @click="${() => this.refreshChart(result.id)}">
                        Refresh
                    </button>
                    <button @click="${() => this.exportChart(result.id)}">
                        Export
                    </button>
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <div class="search-container">
                <!-- Search Header -->
                <div class="search-header">
                    <div class="search-input-container">
                        <input 
                            type="text"
                            .value="${this.query}"
                            @input="${e => this.query = e.target.value}"
                            @keyup="${e => e.key === 'Enter' && this.search()}"
                            placeholder="Search across multiple sources..."
                        >
                        <button @click="${this.search}" ?disabled="${this.loading}">
                            ${this.loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    <!-- Provider Selection -->
                    <div class="provider-selector">
                        ${this.renderProviderSelection()}
                    </div>

                    <!-- View Mode Selection -->
                    <div class="view-mode-selector">
                        <button @click="${() => this.setViewMode('list')}" class="${this.viewMode === 'list' ? 'active' : ''}">
                            List
                        </button>
                        <button @click="${() => this.setViewMode('grid')}" class="${this.viewMode === 'grid' ? 'active' : ''}">
                            Grid
                        </button>
                        <button @click="${() => this.setViewMode('split')}" class="${this.viewMode === 'split' ? 'active' : ''}">
                            Split
                        </button>
                    </div>
                </div>

                <!-- Global Filters -->
                <div class="global-filters">
                    <select .value="${this.timeRange}" @change="${e => this.timeRange = e.target.value}">
                        <option value="anytime">Any Time</option>
                        <option value="past_day">Past 24 Hours</option>
                        <option value="past_week">Past Week</option>
                        <option value="past_month">Past Month</option>
                        <option value="past_year">Past Year</option>
                    </select>

                    <select .value="${this.sortBy}" @change="${e => this.sortBy = e.target.value}">
                        <option value="relevance">Sort by Relevance</option>
                        <option value="date">Sort by Date</option>
                        <option value="popularity">Sort by Popularity</option>
                    </select>

                    <select .value="${this.language}" @change="${e => this.language = e.target.value}">
                        <option value="en">English</option>
                        <option value="de">German</option>
                        <option value="fr">French</option>
                        <option value="es">Spanish</option>
                    </select>
                </div>

                <!-- Active Provider Filters -->
                ${this.selectedProviders.map(providerId => {
                    const provider = this.getAllProviders().find(p => p.id === providerId);
                    return this.renderProviderFilters(provider);
                })}

                <!-- Results Container -->
                <div class="results-container ${this.viewMode}">
                    ${this.loading ? html`
                        <div class="loading">Searching...</div>
                    ` : this.error ? html`
                        <div class="error">${this.error}</div>
                    ` : html`
                        ${repeat(this.results, result => result.id, result => {
                            if (result.provider === 'metabase') {
                                return this.renderMetabaseResult(result);
                            } else {
                                return html`
                                    <div class="result-item">
                                        <h3>${result.title}</h3>
                                        <p>${result.snippet}</p>
                                        <div class="result-meta">
                                            <span>${result.provider}</span>
                                            <span>${result.date}</span>
                                        </div>
                                    </div>
                                `;
                            }
                        })}
                    `}
                </div>
            </div>
        `;
    }

    renderProviderSelection() {
        return html`
            <div class="provider-selection">
                ${this.getAllProviders().map(provider => html`
                    <button 
                        class="provider-button ${this.selectedProviders.includes(provider.id) ? 'active' : ''}"
                        @click="${() => this.toggleProvider(provider.id)}">
                        <span class="icon">${provider.icon}</span>
                        ${provider.name}
                    </button>
                `)}
                <button class="add-provider" @click="${this._showAddProviderDialog}">
                    + Add Source
                </button>
            </div>
        `;
    }

    // Add new custom provider
    addCustomProvider(provider) {
        // Validiere Provider-Daten
        if (!provider.id || !provider.name) {
            console.error('Provider ID and name are required');
            return;
        }
        
        // Standardwerte setzen
        const newProvider = {
            id: provider.id,
            name: provider.name,
            icon: provider.icon || '🔍',
            filters: provider.filters || [],
            baseUrl: provider.baseUrl || '',
            apiKey: provider.apiKey || '',
            customHeaders: provider.customHeaders || {},
            providerType: provider.providerType || 'custom',
            config: provider.config || {}
        };
        
        // Provider-spezifische Konfiguration
        if (provider.providerType === 'database') {
            newProvider.config.database_url = provider.databaseUrl;
        } else if (provider.providerType === 'graphql') {
            newProvider.config.graphql_endpoint = provider.graphqlEndpoint;
        } else if (provider.providerType === 'filesystem') {
            newProvider.config.filesystem_path = provider.filesystemPath;
        } else if (provider.providerType === 'streaming') {
            newProvider.config.streaming_endpoint = provider.streamingEndpoint;
        } else if (provider.providerType === 'enterprise') {
            // LDAP, FTP, etc.
            Object.assign(newProvider.config, provider.enterpriseConfig || {});
        }
        
        this.customProviders = [...this.customProviders, newProvider];
        
        // Füge Provider zur Datenbank hinzu
        this._saveProviderToDatabase(newProvider);
    }

    // Speichere Provider in der Datenbank
    async _saveProviderToDatabase(provider) {
        try {
            const response = await fetch('/api/providers/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this._getCsrfToken()
                },
                body: JSON.stringify({
                    name: provider.name,
                    provider_type: provider.providerType,
                    api_key: provider.apiKey,
                    base_url: provider.baseUrl,
                    custom_headers: provider.customHeaders,
                    config: provider.config,
                    is_active: true
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save provider');
            }
            
            const data = await response.json();
            console.log('Provider saved:', data);
        } catch (error) {
            console.error('Error saving provider:', error);
        }
    }

    // CSRF Token aus Cookie holen
    _getCsrfToken() {
        const name = 'csrftoken=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        
        for (let i = 0; i < cookieArray.length; i++) {
            let cookie = cookieArray[i].trim();
            if (cookie.indexOf(name) === 0) {
                return cookie.substring(name.length, cookie.length);
            }
        }
        
        return '';
    }

    // Dialog zum Hinzufügen eines neuen Providers
    _showAddProviderDialog() {
        const dialog = document.createElement('dialog');
        dialog.className = 'provider-dialog';
        
        // Hole Provider-Vorlagen
        const templates = getProviderTemplatesList();
        
        dialog.innerHTML = `
            <div class="provider-dialog-content">
                <h2>Provider hinzufügen</h2>
                
                <div class="provider-tabs">
                    <button class="tab-btn active" data-tab="template">Vorlage verwenden</button>
                    <button class="tab-btn" data-tab="custom">Benutzerdefiniert</button>
                    <button class="tab-btn" data-tab="url">Von URL erkennen</button>
                </div>
                
                <div class="tab-content" id="template-tab">
                    <div class="template-list">
                        ${templates.map(template => `
                            <div class="template-item" data-id="${template.id}">
                                <div class="template-icon">${template.icon}</div>
                                <div class="template-info">
                                    <h3>${template.name}</h3>
                                    <p>${template.description}</p>
                                    ${template.requiresApiKey ? 
                                        '<span class="api-key-required">API-Key erforderlich</span>' : 
                                        '<span class="no-api-key">Kein API-Key erforderlich</span>'
                                    }
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="tab-content hidden" id="custom-tab">
                    <form id="custom-provider-form">
                        <div class="form-group">
                            <label for="provider-id">ID</label>
                            <input type="text" id="provider-id" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="provider-name">Name</label>
                            <input type="text" id="provider-name" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="provider-icon">Icon</label>
                            <input type="text" id="provider-icon" value="🔍">
                        </div>
                        
                        <div class="form-group">
                            <label for="provider-type">Provider Type</label>
                            <select id="provider-type">
                                <option value="web">Web Scraping</option>
                                <option value="api">REST API</option>
                                <option value="graphql">GraphQL API</option>
                                <option value="database">Database</option>
                                <option value="filesystem">Filesystem</option>
                                <option value="streaming">Streaming</option>
                                <option value="enterprise">Enterprise (LDAP/FTP)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="provider-url">Base URL</label>
                            <input type="url" id="provider-url">
                        </div>
                        
                        <div class="form-group">
                            <label for="provider-api-key">API Key</label>
                            <input type="password" id="provider-api-key">
                        </div>
                        
                        <div class="form-group">
                            <label for="provider-headers">Custom Headers (JSON)</label>
                            <textarea id="provider-headers" rows="3"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="provider-config">Additional Config (JSON)</label>
                            <textarea id="provider-config" rows="5"></textarea>
                        </div>
                    </form>
                </div>
                
                <div class="tab-content hidden" id="url-tab">
                    <div class="url-detection-form">
                        <div class="form-group">
                            <label for="detect-url">URL zur Analyse</label>
                            <input type="url" id="detect-url" placeholder="https://example.com">
                        </div>
                        
                        <button id="detect-btn" type="button">Provider-Typ erkennen</button>
                        
                        <div id="detection-result" class="detection-result hidden">
                            <h3>Erkannter Provider-Typ: <span id="detected-type">-</span></h3>
                            <div id="detection-details"></div>
                        </div>
                    </div>
                </div>
                
                <div class="dialog-actions">
                    <button id="cancel-btn" type="button">Abbrechen</button>
                    <button id="save-btn" type="button">Provider hinzufügen</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        dialog.showModal();
        
        // Tab-Wechsel
        const tabBtns = dialog.querySelectorAll('.tab-btn');
        const tabContents = dialog.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                // Tabs umschalten
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Inhalte umschalten
                tabContents.forEach(content => {
                    content.classList.add('hidden');
                });
                dialog.querySelector(`#${tabId}-tab`).classList.remove('hidden');
            });
        });
        
        // Vorlage auswählen
        const templateItems = dialog.querySelectorAll('.template-item');
        templateItems.forEach(item => {
            item.addEventListener('click', () => {
                templateItems.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
            });
        });
        
        // Provider-Typ erkennen
        const detectBtn = dialog.querySelector('#detect-btn');
        detectBtn.addEventListener('click', async () => {
            const url = dialog.querySelector('#detect-url').value;
            if (!url) return;
            
            detectBtn.disabled = true;
            detectBtn.textContent = 'Erkenne...';
            
            try {
                const result = await this._detectProviderType(url);
                
                dialog.querySelector('#detected-type').textContent = result.providerType;
                
                const detailsDiv = dialog.querySelector('#detection-details');
                detailsDiv.innerHTML = `
                    <div class="detection-config">
                        <h4>Erkannte Konfiguration:</h4>
                        <pre>${JSON.stringify(result.config || {}, null, 2)}</pre>
                    </div>
                    
                    ${result.apiKeyRequired ? 
                        '<div class="api-key-notice">Dieser Provider benötigt einen API-Key</div>' : 
                        ''
                    }
                    
                    <button id="use-detection-btn" type="button">Diese Konfiguration verwenden</button>
                `;
                
                dialog.querySelector('#detection-result').classList.remove('hidden');
                
                // Erkannte Konfiguration verwenden
                dialog.querySelector('#use-detection-btn').addEventListener('click', () => {
                    // Wechsle zum benutzerdefinierten Tab
                    tabBtns.forEach(b => b.classList.remove('active'));
                    dialog.querySelector('[data-tab="custom"]').classList.add('active');
                    
                    tabContents.forEach(content => {
                        content.classList.add('hidden');
                    });
                    dialog.querySelector('#custom-tab').classList.remove('hidden');
                    
                    // Fülle das Formular mit erkannten Werten
                    const urlParts = new URL(url);
                    const domain = urlParts.hostname.replace('www.', '');
                    
                    dialog.querySelector('#provider-id').value = domain.split('.')[0];
                    dialog.querySelector('#provider-name').value = 
                        domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0];
                    dialog.querySelector('#provider-type').value = result.providerType;
                    dialog.querySelector('#provider-url').value = url;
                    
                    if (result.config) {
                        dialog.querySelector('#provider-config').value = 
                            JSON.stringify(result.config, null, 2);
                    }
                });
            } catch (error) {
                console.error('Error detecting provider type:', error);
                dialog.querySelector('#detection-result').innerHTML = `
                    <div class="error-message">
                        Fehler bei der Erkennung: ${error.message}
                    </div>
                `;
                dialog.querySelector('#detection-result').classList.remove('hidden');
            } finally {
                detectBtn.disabled = false;
                detectBtn.textContent = 'Provider-Typ erkennen';
            }
        });
        
        // Abbrechen
        dialog.querySelector('#cancel-btn').addEventListener('click', () => {
            dialog.close();
            dialog.remove();
        });
        
        // Provider hinzufügen
        dialog.querySelector('#save-btn').addEventListener('click', () => {
            const activeTab = dialog.querySelector('.tab-btn.active').dataset.tab;
            
            if (activeTab === 'template') {
                // Provider aus Vorlage erstellen
                const selectedTemplate = dialog.querySelector('.template-item.selected');
                if (!selectedTemplate) {
                    alert('Bitte wählen Sie eine Vorlage aus');
                    return;
                }
                
                const templateId = selectedTemplate.dataset.id;
                const template = getProviderTemplate(templateId);
                
                // Wenn API-Key erforderlich ist, nach diesem fragen
                if (template.requiresApiKey) {
                    const apiKey = prompt(`Bitte geben Sie den API-Key für ${template.name} ein:`);
                    if (!apiKey) {
                        alert('API-Key ist erforderlich');
                        return;
                    }
                    
                    // Provider mit API-Key erstellen
                    this.addCustomProvider({
                        id: templateId,
                        name: template.name,
                        icon: template.icon,
                        providerType: template.providerType,
                        baseUrl: template.baseUrl,
                        apiKey: apiKey,
                        config: template.defaultConfig
                    });
                } else {
                    // Provider ohne API-Key erstellen
                    this.addCustomProvider({
                        id: templateId,
                        name: template.name,
                        icon: template.icon,
                        providerType: template.providerType,
                        baseUrl: template.baseUrl,
                        config: template.defaultConfig
                    });
                }
            } else if (activeTab === 'custom') {
                // Benutzerdefinierten Provider erstellen
                const form = dialog.querySelector('#custom-provider-form');
                
                const provider = {
                    id: form.querySelector('#provider-id').value,
                    name: form.querySelector('#provider-name').value,
                    icon: form.querySelector('#provider-icon').value,
                    providerType: form.querySelector('#provider-type').value,
                    baseUrl: form.querySelector('#provider-url').value,
                    apiKey: form.querySelector('#provider-api-key').value
                };
                
                // Custom Headers parsen
                try {
                    const headersText = form.querySelector('#provider-headers').value;
                    if (headersText) {
                        provider.customHeaders = JSON.parse(headersText);
                    }
                } catch (error) {
                    alert('Ungültiges JSON-Format in Custom Headers');
                    return;
                }
                
                // Config parsen
                try {
                    const configText = form.querySelector('#provider-config').value;
                    if (configText) {
                        provider.config = JSON.parse(configText);
                    }
                } catch (error) {
                    alert('Ungültiges JSON-Format in Config');
                    return;
                }
                
                this.addCustomProvider(provider);
            } else if (activeTab === 'url') {
                // Provider aus erkannter URL erstellen
                const detectionResult = dialog.querySelector('#detection-result');
                if (detectionResult.classList.contains('hidden')) {
                    alert('Bitte führen Sie zuerst eine Erkennung durch');
                    return;
                }
                
                const url = dialog.querySelector('#detect-url').value;
                const urlParts = new URL(url);
                const domain = urlParts.hostname.replace('www.', '');
                const providerType = dialog.querySelector('#detected-type').textContent;
                
                // Config aus dem Pre-Element extrahieren
                let config = {};
                try {
                    const configText = dialog.querySelector('.detection-config pre').textContent;
                    if (configText) {
                        config = JSON.parse(configText);
                    }
                } catch (error) {
                    console.error('Error parsing config:', error);
                }
                
                // API-Key abfragen, wenn erforderlich
                let apiKey = '';
                if (dialog.querySelector('.api-key-notice')) {
                    apiKey = prompt(`Bitte geben Sie den API-Key für ${domain} ein:`);
                    if (!apiKey) {
                        alert('API-Key ist erforderlich');
                        return;
                    }
                }
                
                this.addCustomProvider({
                    id: domain.split('.')[0],
                    name: domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0],
                    icon: '🔍',
                    providerType: providerType,
                    baseUrl: url,
                    apiKey: apiKey,
                    config: config
                });
            }
            
            dialog.close();
            dialog.remove();
        });
    }

    // Get all available providers (built-in + custom)
    getAllProviders() {
        return [...this.availableProviders, ...this.customProviders];
    }

    // Füge diese neue Methode hinzu
    async _detectProviderType(url) {
        this.loading = true;
        try {
            const response = await fetch('/api/detect-provider-type/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this._getCsrfToken()
                },
                body: JSON.stringify({ url })
            });
            
            if (!response.ok) {
                throw new Error('Failed to detect provider type');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error detecting provider type:', error);
            return { providerType: 'web' }; // Fallback auf Web Scraping
        } finally {
            this.loading = false;
        }
    }

    // Füge diese Methode hinzu
    async _validateApiKey(providerType, baseUrl, apiKey) {
        try {
            const response = await fetch('/api/validate-api-key/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this._getCsrfToken()
                },
                body: JSON.stringify({
                    provider_type: providerType,
                    base_url: baseUrl,
                    api_key: apiKey
                })
            });
            
            const data = await response.json();
            return {
                valid: response.ok,
                message: data.message || 'API-Key validiert'
            };
        } catch (error) {
            return {
                valid: false,
                message: 'Fehler bei der Validierung: ' + error.message
            };
        }
    }

    static styles = css`
        .search-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
        }

        .search-header {
            position: sticky;
            top: 0;
            background: var(--search-bg, white);
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
        }

        .search-input-container {
            display: flex;
            gap: 0.5rem;
        }

        .search-input-container input {
            flex: 1;
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
        }

        .provider-selector {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
        }

        .provider-btn {
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
        }

        .provider-btn.active {
            background: var(--primary-color);
            color: white;
        }

        .results-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .results-container.grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }

        .results-container.split {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }

        .result-item {
            padding: 1rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
        }

        .result-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.8em;
            color: var(--text-secondary);
        }

        .global-filters {
            display: flex;
            gap: 1rem;
            margin: 1rem 0;
            padding: 1rem;
            background: var(--filter-bg, #f5f5f5);
            border-radius: 4px;
        }

        .provider-filters {
            margin: 0.5rem 0;
            padding: 1rem;
            background: var(--provider-filter-bg, #fff);
            border: 1px solid var(--border-color);
            border-radius: 4px;
        }

        select, input {
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            background: white;
        }
    `;
}

customElements.define('perplexica-search-interface', SearchInterface);

export default SearchInterface; 