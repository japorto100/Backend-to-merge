# RAG Project Analysis

## Project Structure

python
localGPT-Vision/
├── app.py # Main Flask application
├── logger.py # Logging configuration
├── models/ # Core model functionality
│ ├── indexer.py # Document indexing
│ ├── retriever.py # Document retrieval
│ ├── responder.py # Response generation
│ ├── model_loader.py # Model loading utilities
│ └── converters.py # File conversion utilities
├── static/ # Static assets
│ ├── css/
│ │ ├── style.css # Main stylesheet
│ │ └── styles.css # Additional styles
│ └── images/ # Image storage
├── templates/ # HTML templates
│ ├── base.html # Base template
│ ├── chat.html # Chat interface
│ ├── chat_messages.html # Message components
│ └── settings.html # Settings page
├── sessions/ # Session storage
├── .gitignore # Git ignore rules
├── README.md # Project documentation
└── requirements.txt # Project dependencies



## Core Components

### 1. Models
- **Indexer**: Uses Byaldi for document indexing
- **Retriever**: Handles document retrieval
- **Responder**: Manages response generation
- **Model Loader**: Supports multiple VLMs:
  - Qwen2-VL-7B-Instruct
  - LLAMA-3.2-11B-Vision
  - Pixtral-12B-2409
  - Molmo-7B-O-0924
  - Google Gemini
  - OpenAI GPT-4
  - LLAMA-3.2 with Ollama

### 2. Frontend
Located in `/templates` and `/static`:

#### Template Files
- `templates/base.html` - Base template with common layout and imports
- `templates/chat.html` - Main chat interface
- `templates/chat_messages.html` - Chat message components
- `templates/settings.html` - Settings page configuration

#### Static Files
- `static/css/style.css` - Main stylesheet
- `static/js/script.js` - Frontend JavaScript functionality
- `static/images/` - Directory for storing uploaded and processed images

#### Technologies Used
- **Bootstrap 5.3.x**
  - Responsive grid system
  - Modal dialogs
  - Form components
  - Navigation elements
  
- **jQuery 3.x**
  - AJAX requests for real-time updates
  - DOM manipulation
  - Event handling
  
- **Custom JavaScript**
  - WebSocket connections for real-time chat
  - File upload handling
  - Session management
  - Dynamic UI updates

#### Key Features
- **Chat Interface**
  - Real-time message updates
  - Message history display
  - File upload progress
  - Image preview
  
- **Session Management**
  - Session creation/switching
  - Session renaming
  - Session deletion
  
- **File Management**
  - Drag-and-drop file upload
  - Multiple file selection
  - Upload progress indication
  - File type validation
  
- **Settings Panel**
  - Model selection
  - Image dimension configuration
  - API key management
  
- **Responsive Design**
  - Mobile-friendly layout
  - Adaptive UI components
  - Flexible chat container

#### Frontend-Backend Integration
- RESTful API endpoints in `app.py`:
  ```python
  @app.route('/chat', methods=['GET', 'POST'])
  @app.route('/switch_session/<session_id>')
  @app.route('/rename_session', methods=['POST'])
  @app.route('/delete_session/<session_id>', methods=['POST'])
  @app.route('/settings', methods=['GET', 'POST'])
  @app.route('/get_indexed_files/<session_id>')
  ```

#### Asset Management
- Images stored in: `static/images/<session_id>/`
- Uploaded files in: `uploaded_documents/<session_id>/`
- Session data in: `sessions/<session_id>.json`

### 3. Backend (Flask)
- RESTful API endpoints
- Session handling
- File management
- Model integration

### 4. Dependencies
Key dependencies include:
- Flask
- Byaldi
- Torch
- Various ML models
- Image processing libraries

## Features
1. Document Management
   - Upload PDFs and images
   - Automatic indexing
   - File conversion

2. Chat Interface
   - Real-time messaging
   - Image display
   - Session management

3. Model Integration
   - Multiple VLM support
   - Configurable settings
   - Response generation

4. Session Handling
   - Create/rename/delete sessions
   - Persistent storage
   - Multi-user support

## Technical Details

### Storage
- Documents: `uploaded_documents/`
- Images: `static/images/`
- Sessions: `sessions/`
- Indexes: `.byaldi/`

### API Endpoints
1. Chat Operations
   - `/chat` (GET/POST)
   - `/new_session` (GET)
   - `/switch_session/<session_id>` (GET)
   - `/rename_session` (POST)
   - `/delete_session` (POST)

2. Settings
   - `/settings` (GET/POST)

3. File Operations
   - `/get_indexed_files/<session_id>` (GET)

### Security
- File upload validation
- Session management
- Error handling
- Logging system

## Performance Considerations
1. Image Processing
   - Configurable image dimensions
   - Efficient storage
   - Caching mechanisms

2. Model Management
   - Model caching
   - Device optimization
   - Memory management

3. Session Handling
   - Persistent storage
   - Clean-up mechanisms
   - Error recovery

## Development Requirements
- Python 3.10+
- GPU support (recommended)
- Storage capacity for indexes
- Memory for model loading