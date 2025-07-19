# 🧠 AI Therapist - Complete Voice-Enabled Web Application

A production-ready AI therapist with sweet voice, empathetic conversations, and beautiful web interface.

## 🎉 Project Status: Phase 4 Complete!

All phases successfully implemented and ready for production deployment.

## Project Phases

### ✅ Phase 1: Core Functionality (COMPLETE)
- Text-based AI therapist using OpenAI GPT-4o-mini
- Empathetic personality and therapeutic prompts
- Professional therapeutic boundaries and safety

### ✅ Phase 2: Text-to-Speech (COMPLETE)
- ElevenLabs integration for sweet, therapeutic voice
- Emotion-controlled speech generation (calm, supportive, encouraging, empathetic)
- Real-time audio playback with system TTS fallback

### ✅ Phase 3: Speech-to-Text (COMPLETE)
- OpenAI Whisper API integration for accurate transcription
- Voice input processing with push-to-talk interface
- Full voice conversation flow (voice-to-voice therapy sessions)

### ✅ Phase 4: Frontend & Real-Time Interaction (COMPLETE)
- Beautiful React.js web interface with Material-UI
- Real-time WebSocket communication
- Web-based voice recording and playback
- Multi-user session management
- Responsive design for all devices

### 🚀 Phase 5: Production & Scaling (READY)
- Cloud deployment (AWS/GCP)
- Database integration for session persistence
- User authentication and security
- Monitoring and analytics
- Privacy compliance and ethics features

## 🛠 Tech Stack

- **AI/LLM**: OpenAI GPT-4o-mini for therapeutic conversations
- **TTS**: ElevenLabs API with sweet, caring voices + system TTS fallback
- **STT**: OpenAI Whisper API for accurate speech recognition
- **Backend**: FastAPI with WebSocket support
- **Frontend**: React.js with Material-UI components
- **Voice**: Web Audio API for recording, real-time audio processing
- **Deployment**: Docker-ready, cloud-native architecture

## 🔥 Firebase Integration Features

### Cloud-Native Architecture
- **Firebase Authentication**: Secure user accounts with email/password
- **Firestore Database**: Scalable NoSQL database for user data and conversations
- **Real-time Sync**: Instant synchronization across devices
- **Global Scale**: Handles millions of users automatically
- **Enterprise Security**: Built-in security rules and data protection

### User Experience
- **Persistent Sessions**: All conversations saved to the cloud
- **Cross-Device Access**: Access your therapy sessions from any device
- **AI Memory**: Personalized responses based on conversation history
- **Secure Authentication**: Industry-standard Firebase Auth

## 🎤 Voice Interface Features

### Improved Speech-to-Speech Experience
- **Smart Listening**: AI waits for you to finish speaking before responding
- **Auto-listening Control**: Disabled by default, can be enabled for hands-free conversations
- **Clear Visual Feedback**: Different icons for voice toggle vs interface mode
- **ElevenLabs Integration**: High-quality, therapeutic voice synthesis
- **Timing Optimization**: Proper delays between AI speech and listening activation

### Voice Interface Modes
- **Chat Mode**: Traditional text-based interface with optional voice responses
- **Voice Mode**: Full speech-to-speech conversation experience
- **Hybrid Mode**: Mix of text input with voice responses

## 🚀 Quick Start

### Option 1: Web Application (Recommended)
```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Start both backend and frontend
python start_web_app.py

# 4. Open browser to http://localhost:3000
```

### Option 2: Command Line Interface
```bash
# For terminal-based voice conversations
python main.py
```

### Option 3: API Server Only
```bash
# For API development and testing
python api_server.py
# Visit http://localhost:8000/docs for API documentation
```

## 🔑 Environment Setup

Create a `.env` file with your API keys:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional (for premium voice quality)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Voice Settings
ENABLE_VOICE=true
DEFAULT_VOICE_EMOTION=calm
```

## 🌟 Key Features

### 💬 Therapeutic Conversations
- Empathetic AI therapist "Dr. Sarah"
- Professional therapeutic boundaries
- Context-aware conversation memory
- Crisis resource recommendations

### 🎤 Voice Capabilities
- **Sweet, caring voice** optimized for therapy
- **Emotion-aware speech** (calm, supportive, encouraging, empathetic)
- **Real-time voice input** with accurate transcription
- **Web-based recording** with visual feedback

### 🌐 Web Interface
- **Beautiful, therapeutic design** with gradient backgrounds
- **Responsive layout** for desktop, tablet, and mobile
- **Real-time messaging** via WebSockets
- **Professional UI** with Material-UI components
- **Accessibility features** and keyboard navigation

### 🔧 Technical Features
- **Multi-user sessions** with concurrent support
- **Intelligent fallbacks** for voice services
- **Error handling** and user feedback
- **Session management** and cleanup
- **API documentation** with OpenAPI/Swagger

## 📱 Usage Examples

### Web Interface
1. Visit http://localhost:3000
2. Click the microphone to start voice conversation
3. Speak naturally - Dr. Sarah will respond with voice
4. Switch between text and voice modes seamlessly

### API Integration
```javascript
// Create therapy session
const session = await fetch('/api/session/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enable_voice: true })
});

// Send message
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    message: "I'm feeling anxious today",
    session_id: sessionId 
  })
});
```

## 🏗 Architecture

```
Frontend (React.js) ↔ WebSocket/REST API ↔ FastAPI Backend ↔ AI Therapist Core
     ↓                        ↓                    ↓              ↓
Material-UI Components    JSON Messages      Session Management   OpenAI GPT
Voice Recording          Real-time Updates   Voice Processing     ElevenLabs TTS
Audio Playback           CORS Support        File Handling        Whisper STT
```

## 📊 API Endpoints

- `GET /` - Web interface
- `POST /api/session/create` - Create therapy session
- `POST /api/chat` - Send text message
- `POST /api/voice/transcribe` - Voice to text
- `POST /api/voice/synthesize` - Text to voice
- `WebSocket /ws/{session_id}` - Real-time communication

## 🧪 Testing

```bash
# Test voice capabilities
python test_elevenlabs_tts.py

# Test Phase 3 (full voice conversation)
python test_phase3.py

# Test all phases
python demo_all_phases.py
```

## 🎯 Production Ready

The AI Therapist is now production-ready with:
- ✅ Complete voice conversation capabilities
- ✅ Beautiful, responsive web interface
- ✅ Real-time communication
- ✅ Multi-user session support
- ✅ Professional error handling
- ✅ Comprehensive API documentation
- ✅ Docker-ready architecture

## 🤝 Contributing

This project demonstrates a complete AI therapist implementation from concept to production-ready web application. Perfect for:
- Mental health applications
- Voice AI demonstrations
- Therapeutic chatbot research
- Full-stack AI application examples

## 📄 License

Built for educational and therapeutic purposes. Please ensure compliance with healthcare regulations in your jurisdiction.

---

**🎉 Ready to help people feel better with AI therapy!** 💙# Solace
# Solace
