# 🧠 Solace - AI Therapist  

A production-ready **voice-enabled AI therapist** with a sweet, empathetic voice, therapeutic conversations, and a beautiful web interface.  

---

## 🌟 Key Highlights  

- 💬 **Therapeutic Conversations**: Context-aware AI therapist "Dr. Samaira" with professional therapeutic boundaries.  
- 🎤 **Voice Capabilities**: Whisper STT + ElevenLabs TTS for real-time, emotion-aware voice therapy.  
- 🌐 **Beautiful Web Interface**: React.js + Material-UI frontend with responsive design.  
- ⚡ **Real-Time Interaction**: WebSocket-powered seamless chat and voice sessions.  
- 🔒 **Secure & Scalable**: Firebase authentication, Firestore persistence, and enterprise-level data protection.  

---

## 🛠 Tech Stack  

- **AI/LLM**: OpenAI GPT-4o-mini  
- **TTS**: ElevenLabs API + system TTS fallback  
- **STT**: OpenAI Whisper API  
- **Backend**: FastAPI with WebSocket support  
- **Frontend**: React.js + Material-UI  
- **Voice**: Web Audio API  
- **Cloud & Auth**: Firebase Authentication + Firestore  
- **Deployment**: Docker-ready, AWS/GCP compatible  

---

## 🔥 Features  

### 💬 Conversations  
- Empathetic and context-aware AI therapy  
- Crisis resources & professional boundaries  
- AI memory for personalized responses  

### 🎤 Voice Interface  
- Sweet, therapeutic voice optimized for calm, supportive interactions  
- Real-time voice-to-voice conversations  
- Push-to-talk & auto-listening options  
- Clear visual feedback during voice sessions  

### 🌐 Web Experience  
- Modern, responsive UI with gradient therapeutic themes  
- Multi-user session support  
- Accessible design with keyboard navigation  
- Cross-device sync for therapy sessions  

### 🔧 Technical Capabilities  
- Persistent conversation storage in Firestore  
- Secure user authentication via Firebase Auth  
- Error handling & intelligent fallbacks for voice services  
- Monitoring, analytics & privacy compliance ready  

---

## 🚀 Quick Start  

### 1. Clone & Install  
```bash
git clone https://github.com/yourusername/solace.git
cd solace
pip install -r requirements.txt
```

### 2. Configure Environment  
Create a `.env` file:  
```env
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ENABLE_VOICE=true
DEFAULT_VOICE_EMOTION=calm
```

### 3. Run Application  
```bash
python start_web_app.py
```
Visit 👉 [http://localhost:3000](http://localhost:3000)  

---

## 📱 Usage  

### Web Interface  
1. Open browser at `http://localhost:3000`  
2. Log in with Firebase Authentication  
3. Start a voice or text session with **Dr. Samaira**  
4. Switch seamlessly between text, voice, or hybrid modes  

### API Integration Example  
```javascript
// Create session
const session = await fetch('/api/session/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

// Send message
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: "I'm feeling anxious today", session_id })
});
```  

---

## 📊 API Endpoints  

- `GET /` → Web interface  
- `POST /api/session/create` → Create therapy session  
- `POST /api/chat` → Send text message  
- `POST /api/voice/transcribe` → Voice to text  
- `POST /api/voice/synthesize` → Text to voice  
- `WebSocket /ws/{session_id}` → Real-time communication  

---

## 🏗 Architecture  

```
Frontend (React.js) ↔ WebSocket/REST API ↔ FastAPI Backend ↔ AI Therapist Core
     ↓                        ↓                    ↓              ↓
Material-UI Components    JSON Messages      Session Management   OpenAI GPT
Voice Recording          Real-time Updates   Voice Processing     ElevenLabs TTS
Audio Playback           CORS Support        File Handling        Whisper STT
```

---

## 🧪 Testing  

```bash
# Test ElevenLabs TTS
python test_elevenlabs_tts.py

# Test voice conversation flow
python test_phase3.py

# Run complete demo
python demo_all_phases.py
```

---

## 🎯 Production Deployment  

- Deploy on **AWS/GCP** with Docker  
- Firebase handles **auth, database, and real-time sync**  
- Built-in monitoring and analytics hooks  
- Privacy and ethics compliance ready for mental health use cases  

---

## 🤝 Contributing  

We welcome contributions to enhance **Solace**. Ideal areas:  
- UI/UX improvements  
- New therapeutic voice models  
- Advanced analytics & dashboards  
- Additional privacy & compliance features  

---

## 📄 License  

Built for educational and therapeutic purposes.  
⚠️ Ensure compliance with healthcare regulations in your region before production use.  

---

**💙 Solace – Helping people feel better with AI therapy.**  
