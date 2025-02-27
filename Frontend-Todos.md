# Frontend Requirements & TODOs

## Frontend Dependencies
```json
{
  "dependencies": {
    // Core UI Framework
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "typescript": "latest",
    
    // Styling & UI Components
    "tailwindcss": "latest",
    "chakra-ui": "latest",
    "@chakra-ui/react": "latest",
    "@emotion/react": "latest",
    "@emotion/styled": "latest",
    "framer-motion": "latest",
    
    // State Management & Data Fetching
    "redux": "latest",
    "@reduxjs/toolkit": "latest",
    "react-query": "latest",
    "axios": "latest",
    
    // Development Tools
    "@types/react": "latest",
    "@types/node": "latest",
    "eslint": "latest",
    "prettier": "latest"
  }
}
```

## UI Migration Plan (basierend auf Perplexica)

### 1. Core Features
- [ ] Implementiere Perplexica's Split View Layout
  - [ ] Suchleiste mit Modusauswahl
  - [ ] Ergebnisbereich
  - [ ] Chat Interface
  - [ ] Dokumentenvorschau

### 2. Search Modes UI
- [ ] All Mode Interface
- [ ] Writing Assistant Mode
- [ ] Academic Search Mode
- [ ] YouTube Search Mode
- [ ] Wolfram Alpha Integration
- [ ] Reddit Search Interface

### 3. Analytics Dashboard
- [ ] WhatsApp Chat Analyse Visualisierung
- [ ] Dokumentenanalyse Übersicht
- [ ] Themen-Clustering Ansicht
- [ ] Zeitliche Analyse-Darstellung

### 4. Mobile Optimization
- [ ] Responsive Design Implementation
- [ ] Touch-freundliche Interfaces
- [ ] Mobile-First Navigation
- [ ] Progressive Web App Setup

### 5. Theme System
```typescript
interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  layout: 'split' | 'single' | 'compact'
}
```

### 6. Component Library
- [ ] SearchBar
  - [ ] Mode Selector ❌
  - [ ] Auto-Suggestions ✅
  - [ ] Voice Input ❌
- [ ] ResultsContainer
  - [ ] List View ❌
  - [ ] Grid View ❌
  - [ ] Split View ❌
- [ ] AnalyticsPanel
  - [ ] Charts ❌
  - [ ] Graphs ❌
  - [ ] Data Tables ❌
- [ ] DocumentViewer
  - [ ] PDF Viewer ❌
  - [ ] Image Viewer ❌
  - [ ] Code Viewer ❌
- [x] BrunoDebugInterface
  - [x] API Testing Interface
  - [x] Performance Monitoring
  - [x] Debug Tools Integration
  - [x] Export Functionality
- [x] ChatInterface
  - [x] Message Components
    - [x] User Message
    - [x] Assistant Message
    - [x] System Message
    - [x] Loading States
    - [x] Error States
  - [x] Input Features
    - [x] Markdown Support
    - [x] File Attachments
    - [x] Auto-Complete
    - [x] Suggestions
  - [x] Session Management
    - [x] Create/Delete Sessions
    - [x] Rename Sessions
    - [x] Session List
  - [x] Advanced Features
    - [x] Focus Mode
    - [x] Message Rewrite
    - [x] Message Actions (Copy, Edit, Delete)
  - [x] UI/UX
    - [x] Responsive Design
    - [x] Theme Support
    - [x] Accessibility
    - [x] Keyboard Shortcuts

### 7. State Management
```typescript
interface AppState {
  search: {
    mode: SearchMode
    query: string
    results: SearchResult[]
  }
  analytics: {
    activeView: AnalyticsView
    data: AnalyticsData
  }
  ui: {
    theme: ThemeConfig
    layout: LayoutType
    sidebar: boolean
  }
}
```

### 8. API Integration
- [ ] Backend API Client Setup
- [ ] WebSocket Integration für Real-Time Updates
- [ ] Error Handling & Loading States
- [ ] Caching Strategy

### 9. Performance Optimierung
- [ ] Code Splitting
- [ ] Lazy Loading
- [ ] Image Optimization
- [ ] Bundle Size Optimization

### 10. Testing Setup
- [ ] Unit Tests (Jest)
- [ ] Integration Tests (Cypress)
- [ ] E2E Tests
- [ ] Performance Tests

### 11. Dokumentation
- [ ] Component Documentation
- [ ] API Integration Guide
- [ ] Theme Customization Guide
- [ ] Contributing Guidelines

### 12. Chat Integration
- [x] Chat Backend Integration
  - [x] WebSocket Setup für Real-Time Messages
  - [x] Message Queue Management
  - [x] Typing Indicators
  - [x] Read Receipts
- [x] Chat Features
  - [x] Message Threading
  - [x] Rich Media Support
  - [x] Code Highlighting
  - [x] Link Preview
- [x] Chat Analytics
  - [x] Message Statistics
  - [x] Usage Patterns
  - [x] Performance Metrics

### 13. Metabase Integration
- [ ] Core Integration
  - [ ] Metabase Client Setup
  - [ ] Authentication & Session Management
  - [ ] Error Handling
  - [ ] Caching Strategy

- [ ] Dashboard Components
  - [ ] MetabaseEmbed Component
    - [ ] iFrame Management
    - [ ] Responsive Sizing
    - [ ] Loading States
    - [ ] Error Boundaries
  - [ ] Dashboard Controls
    - [ ] Refresh Button
    - [ ] Time Range Selector
    - [ ] Export Options
    - [ ] Filter Interface

- [ ] Analytics Panel Integration
  - [ ] Custom Chart Components
    - [ ] Line Charts
    - [ ] Bar Charts
    - [ ] Tables
    - [ ] KPI Cards
  - [ ] Real-time Updates
    - [ ] WebSocket Connection
    - [ ] Auto-Refresh Logic
    - [ ] Data Sync
  - [ ] Interactive Features
    - [ ] Drill-Down Support
    - [ ] Cross-Filtering
    - [ ] Custom Parameters

- [ ] State Management
  ```typescript
  interface MetabaseState {
    dashboards: {
      active: string
      list: Dashboard[]
      filters: DashboardFilter[]
    }
    charts: {
      data: Record<string, ChartData>
      loading: boolean
      error: Error | null
    }
    settings: {
      refreshRate: number
      defaultTimeRange: string
      embedSettings: EmbedSettings
    }
  }
  ```

- [ ] UI/UX Enhancements
  - [ ] Theme Integration
    - [ ] Light/Dark Mode Support
    - [ ] Custom Color Schemes
    - [ ] Brand Alignment
  - [ ] Responsive Design
    - [ ] Mobile Layout
    - [ ] Tablet Layout
    - [ ] Desktop Layout
  - [ ] Loading States
    - [ ] Skeleton Screens
    - [ ] Progress Indicators
    - [ ] Error States

- [ ] Performance Optimizations
  - [ ] Lazy Loading für Charts
  - [ ] Data Caching
  - [ ] Request Batching
  - [ ] Memory Management 