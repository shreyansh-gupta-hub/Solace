"""
FastAPI Backend Server for AI Therapist
Restored original functionality with proper deployment fixes

Copyright (c) 2025 Shreyansh Gupta
All Rights Reserved
https://shreygupta.vercel.app
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import json
import asyncio
import os
import tempfile
import base64
import time
from datetime import datetime, timedelta

# Import your original modules
from therapist import AITherapist
from voice_stt import VoiceRecorder

# Optional Firebase import
try:
    from firebase_config import firebase_db
    FIREBASE_AVAILABLE = True
    print("✅ Firebase available")
except ImportError as e:
    FIREBASE_AVAILABLE = False
    firebase_db = None
    print(f"⚠️ Firebase not available: {e}")

app = FastAPI(title="AI Therapist API", version="4.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for active sessions
active_sessions = {}
active_websockets = {}

# Authentication setup
security = HTTPBearer(auto_error=False)

# Pydantic models for API requests
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class SessionConfig(BaseModel):
    enable_voice: bool = True
    voice_emotion: str = "calm"
    session_name: Optional[str] = None
    generation_mode: str = "default"

class UserSignup(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

# Authentication functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    print("🔐 get_current_user called")
    
    if not credentials:
        print("❌ No credentials provided")
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = credentials.credentials
    print(f"🔐 Token: {token[:30]}...")
    
    try:
        # Check if it's a demo token first
        if token.startswith("demo_token_"):
            print("✅ Demo token detected")
            parts = token.split("_")
            print(f"🔍 Token parts: {parts}")
            
            if len(parts) >= 3:
                username = parts[2]
                user_id = int(parts[3]) if len(parts) > 3 and parts[3].isdigit() else int(time.time())
            else:
                username = "demo_user"
                user_id = 1
            
            user_data = {
                "id": user_id,
                "username": username,
                "email": f"{username}@demo.com"
            }
            print(f"✅ Returning demo user: {user_data}")
            return user_data
        
        # Try Firebase validation if available
        if FIREBASE_AVAILABLE and firebase_db:
            try:
                user_data = firebase_db.validate_token(token)
                if user_data:
                    print("✅ Firebase token validated")
                    return user_data
            except Exception as e:
                print(f"⚠️ Firebase token validation failed: {e}")
        
        # If we reach here, token is invalid
        print("❌ Token validation failed - not demo token and Firebase failed")
        raise HTTPException(status_code=401, detail="Invalid token")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error in get_current_user: {e}")
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user if authenticated, otherwise return None"""
    if not credentials:
        return None
    
    try:
        # Use the same logic as get_current_user but return None on failure
        return await get_current_user(credentials)
    except HTTPException:
        return None
    except Exception as e:
        print(f"⚠️ Optional user validation error: {e}")
        return None

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.session_connections = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.session_connections[session_id] = websocket

    def disconnect(self, websocket: WebSocket, session_id: str):
        self.active_connections.remove(websocket)
        if session_id in self.session_connections:
            del self.session_connections[session_id]

    async def send_personal_message(self, message: str, session_id: str):
        if session_id in self.session_connections:
            websocket = self.session_connections[session_id]
            await websocket.send_text(message)

    async def send_json(self, data: dict, session_id: str):
        if session_id in self.session_connections:
            websocket = self.session_connections[session_id]
            await websocket.send_text(json.dumps(data))

manager = ConnectionManager()

# API endpoints
@app.get("/api")
async def api_info():
    """API information endpoint"""
    return {
        "name": "AI Therapist API",
        "version": "4.0.0",
        "status": "running",
        "features": ["chat", "voice", "websocket", "authentication"],
        "websocket_url": "ws://localhost:8000/ws/{session_id}",
        "endpoints": {
            "chat": "/api/chat/{session_id}",
            "voice": "/api/voice/synthesize",
            "transcribe": "/api/voice/transcribe",
            "session": "/api/session/create"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    # Check OpenAI API key
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_status = "configured" if openai_key and openai_key.startswith("sk-") else "missing"
    
    # Check ElevenLabs API key
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    elevenlabs_status = "configured" if elevenlabs_key else "missing"
    
    return {
        "status": "healthy", 
        "phase": "4", 
        "features": ["chat", "voice", "websocket"],
        "firebase": FIREBASE_AVAILABLE,
        "openai_api": openai_status,
        "elevenlabs_api": elevenlabs_status,
        "active_sessions": len(active_sessions)
    }

# Authentication endpoints
@app.post("/api/auth/signup")
async def signup(user_data: dict):
    """User registration endpoint"""
    try:
        print(f"🔐 Raw signup data received: {user_data}")
        print(f"🔐 Data type: {type(user_data)}")
        
        # Handle both dict and Pydantic model input
        if hasattr(user_data, 'username'):
            username = user_data.username
            email = user_data.email
            password = user_data.password
        else:
            username = user_data.get("username", "")
            email = user_data.get("email", "")
            password = user_data.get("password", "")
        
        print(f"🔐 Parsed - username: '{username}', email: '{email}', password: {'*' * len(password) if password else 'EMPTY'}")
        
        # Validate input
        if not username:
            print("❌ Username is empty")
            raise HTTPException(status_code=400, detail="Username is required")
        
        if len(username) < 3:
            print(f"❌ Username too short: {len(username)} chars")
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        
        if not password:
            print("❌ Password is empty")
            raise HTTPException(status_code=400, detail="Password is required")
        
        if len(password) < 8:
            print(f"❌ Password too short: {len(password)} chars")
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
            
        # Check for uppercase letter
        if not any(c.isupper() for c in password):
            print("❌ Password missing uppercase letter")
            raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
            
        # Check for lowercase letter
        if not any(c.islower() for c in password):
            print("❌ Password missing lowercase letter")
            raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
            
        # Check for number
        if not any(c.isdigit() for c in password):
            print("❌ Password missing number")
            raise HTTPException(status_code=400, detail="Password must contain at least one number")
            
        # Check for special character
        import re
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
            print("❌ Password missing special character")
            raise HTTPException(status_code=400, detail="Password must contain at least one special character")
        
        if not email:
            print("❌ Email is empty")
            raise HTTPException(status_code=400, detail="Email is required")
        
        if "@" not in email:
            print(f"❌ Invalid email format: {email}")
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        print(f"✅ Input validation passed")
        print(f"🔥 Firebase available: {FIREBASE_AVAILABLE}")
        print(f"🔥 Firebase DB: {firebase_db is not None}")
        
        if not FIREBASE_AVAILABLE or not firebase_db:
            # Demo mode fallback
            print("🎭 Using demo mode for signup")
            demo_user_id = int(time.time())
            demo_token = f"demo_token_{username}_{demo_user_id}"
            
            result = {
                "message": "User created successfully (demo mode)",
                "token": demo_token,
                "user": {
                    "id": demo_user_id,
                    "username": username,
                    "email": email
                },
                "status": "success"
            }
            print(f"✅ Demo signup successful: {result}")
            return result
        
        # Real Firebase signup
        print("🔥 Attempting Firebase user creation...")
        user_id = firebase_db.create_user(username, email, password)
        print(f"🔥 Firebase user creation result: {user_id}")
        
        if not user_id:
            print("❌ Firebase user creation failed - user exists")
            raise HTTPException(status_code=400, detail="Username or email already exists")
        
        print("🔥 Creating auth token...")
        token = firebase_db.create_auth_token(user_id)
        print(f"🔥 Auth token creation result: {token is not None}")
        
        if not token:
            print("❌ Auth token creation failed")
            raise HTTPException(status_code=500, detail="Failed to create authentication token")
        
        result = {
            "message": "User created successfully",
            "token": token,
            "user": {
                "id": user_id,
                "username": username,
                "email": email
            },
            "status": "success"
        }
        print(f"✅ Firebase signup successful: {result}")
        return result
        
    except HTTPException as http_error:
        print(f"❌ HTTP Exception in signup: {http_error.detail}")
        raise
    except Exception as e:
        error_msg = f"Signup failed: {str(e)}"
        print(f"❌ Unexpected error in signup: {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/auth/login")
async def login(login_data: dict):
    """User login endpoint"""
    try:
        # Handle both dict and Pydantic model input
        if hasattr(login_data, 'username'):
            username = login_data.username
            password = login_data.password
        else:
            username = login_data.get("username", "")
            password = login_data.get("password", "")
        
        print(f"🔐 Login attempt for username: {username}")
        
        # Validate input
        if not username:
            raise HTTPException(status_code=400, detail="Username is required")
        
        if not password:
            raise HTTPException(status_code=400, detail="Password is required")
        
        if not FIREBASE_AVAILABLE or not firebase_db:
            # Demo mode fallback
            print("✅ Login successful (demo mode)")
            return {
                "message": "Login successful (demo mode)",
                "token": f"demo_token_{username}_{int(time.time())}",
                "user": {
                    "id": int(time.time()),
                    "username": username
                },
                "status": "success"
            }
        
        # Real Firebase login
        user_data = firebase_db.authenticate_user(username, password)
        
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid username/email or password")
        
        token = firebase_db.create_auth_token(user_data['id'])
        
        if not token:
            raise HTTPException(status_code=500, detail="Failed to create authentication token")
        
        print(f"✅ Login successful for user: {username}")
        return {
            "message": "Login successful",
            "token": token,
            "user": user_data,
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Login failed: {str(e)}"
        print(f"❌ {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/api/auth/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return {"user": current_user}

@app.get("/api/auth/sessions")
async def get_user_sessions(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get user's therapy sessions"""
    print(f"🔍 Sessions endpoint reached!")
    
    # Handle case where no credentials are provided
    if not credentials:
        print("⚠️ No credentials provided, returning demo sessions")
        return {
            "sessions": [
                {
                    "session_id": "demo_session_1",
                    "session_name": "Getting Started (No Auth)",
                    "created_at": datetime.now().isoformat(),
                    "message_count": 5,
                    "last_activity": datetime.now().isoformat()
                }
            ],
            "message": "Demo sessions (no authentication provided)"
        }
    
    token = credentials.credentials
    print(f"🔐 Token received: {token[:30]}...")
    
    # Try to get user from token
    try:
        current_user = None
        
        # Check if it's a demo token
        if token.startswith("demo_token_"):
            print("✅ Demo token detected")
            parts = token.split("_")
            print(f"🔍 Token parts: {parts}")
            
            if len(parts) >= 3:
                username = parts[2]
                user_id = int(parts[3]) if len(parts) > 3 and parts[3].isdigit() else int(time.time())
            else:
                username = "demo_user"
                user_id = 1
            
            current_user = {
                "id": user_id,
                "username": username,
                "email": f"{username}@demo.com"
            }
            print(f"✅ Demo user: {current_user}")
        
        # If we have a user, return their sessions
        if current_user:
            print("🎭 Returning demo sessions for authenticated user")
            return {
                "sessions": [
                    {
                        "session_id": "demo_session_1",
                        "session_name": "Getting Started",
                        "created_at": datetime.now().isoformat(),
                        "message_count": 5,
                        "last_activity": datetime.now().isoformat()
                    },
                    {
                        "session_id": "demo_session_2", 
                        "session_name": "Stress Management",
                        "created_at": (datetime.now() - timedelta(days=1)).isoformat(),
                        "message_count": 12,
                        "last_activity": (datetime.now() - timedelta(hours=2)).isoformat()
                    }
                ],
                "message": f"Demo sessions for {current_user['username']}"
            }
        else:
            print("❌ Could not authenticate user")
            raise HTTPException(status_code=401, detail="Invalid token")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in sessions endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.get("/api/sessions/demo")
async def get_demo_sessions():
    """Get demo sessions without authentication (for testing)"""
    return {
        "sessions": [
            {
                "session_id": "demo_session_1",
                "session_name": "Getting Started",
                "created_at": datetime.now().isoformat(),
                "message_count": 5,
                "last_activity": datetime.now().isoformat()
            },
            {
                "session_id": "demo_session_2", 
                "session_name": "Stress Management",
                "created_at": (datetime.now() - timedelta(days=1)).isoformat(),
                "message_count": 12,
                "last_activity": (datetime.now() - timedelta(hours=2)).isoformat()
            }
        ],
        "message": "Demo sessions (no auth required)"
    }

@app.get("/api/test/auth-debug")
async def auth_debug(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Debug endpoint for authentication testing"""
    print("🧪 Auth debug endpoint called")
    
    if not credentials:
        return {
            "status": "no_auth",
            "message": "No authentication credentials provided",
            "timestamp": datetime.now().isoformat()
        }
    
    token = credentials.credentials
    token_preview = token[:30] + "..." if token else "None"
    print(f"🧪 Auth debug token: {token_preview}")
    
    # Check if it's a demo token
    is_demo = token.startswith("demo_token_") if token else False
    is_firebase_custom = token.startswith("eyJ") if token else False
    
    # Try to validate the token
    user_data = None
    validation_error = None
    token_info = {}
    
    # Try to decode token for debugging
    if token and token.startswith("eyJ"):
        try:
            import jwt
            import base64
            import json
            
            # Try to decode without verification
            parts = token.split('.')
            if len(parts) >= 2:
                # Decode the payload
                payload = parts[1]
                # Add padding if needed
                payload += '=' * (4 - len(payload) % 4) if len(payload) % 4 != 0 else ''
                decoded_payload = base64.b64decode(payload)
                payload_data = json.loads(decoded_payload)
                
                # Extract token info for debugging
                token_info = {
                    "decoded_payload": payload_data,
                    "token_format": "JWT",
                    "has_uid": "uid" in payload_data,
                    "has_claims_uid": "claims" in payload_data and "uid" in payload_data["claims"],
                    "expiration": payload_data.get("exp", "unknown"),
                    "issued_at": payload_data.get("iat", "unknown")
                }
                
                # Check if token is expired
                if "exp" in payload_data:
                    exp_time = datetime.fromtimestamp(payload_data["exp"])
                    now = datetime.now()
                    token_info["is_expired"] = exp_time < now
                    token_info["expires_at"] = exp_time.isoformat()
                    token_info["time_remaining"] = (exp_time - now).total_seconds() if exp_time > now else "expired"
        except Exception as decode_error:
            token_info["decode_error"] = str(decode_error)
    
    try:
        if is_demo:
            parts = token.split("_")
            if len(parts) >= 3:
                username = parts[2]
                user_id = int(parts[3]) if len(parts) > 3 and parts[3].isdigit() else int(time.time())
            else:
                username = "demo_user"
                user_id = 1
            
            user_data = {
                "id": user_id,
                "username": username,
                "email": f"{username}@demo.com"
            }
        elif FIREBASE_AVAILABLE and firebase_db:
            user_data = firebase_db.validate_token(token)
    except Exception as e:
        validation_error = str(e)
        print(f"🧪 Validation error: {e}")
        import traceback
        traceback.print_exc()
    
    # Check if Firebase is properly configured
    firebase_config = {
        "initialized": FIREBASE_AVAILABLE,
        "db_available": firebase_db is not None,
        "project_id": os.getenv("FIREBASE_PROJECT_ID", "not_set"),
        "client_email_set": os.getenv("FIREBASE_CLIENT_EMAIL") is not None,
        "private_key_set": os.getenv("FIREBASE_PRIVATE_KEY") is not None
    }
    
    return {
        "status": "success" if user_data else "error",
        "token_type": "demo" if is_demo else "firebase_custom" if is_firebase_custom else "unknown",
        "token_preview": token_preview,
        "token_info": token_info,
        "user_data": user_data,
        "validation_error": validation_error,
        "firebase_config": firebase_config,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/conversations/{session_id}")
async def get_conversation_history(session_id: str, current_user: dict = Depends(get_optional_user)):
    """Get conversation history for a session"""
    if not FIREBASE_AVAILABLE or not firebase_db:
        return {"messages": [], "message": "Firebase not available - using demo mode"}
    
    try:
        user_id = current_user['id'] if current_user else None
        if not user_id:
            return {"messages": [], "message": "Authentication required"}
        
        conversations = firebase_db.get_conversation_history(user_id, session_id)
        return {"messages": conversations, "session_id": session_id}
    except Exception as e:
        print(f"❌ Error fetching conversation history: {e}")
        return {"messages": [], "error": str(e)}

@app.get("/api/sessions/{session_id}/actions")
async def get_session_actions(session_id: str, current_user: dict = Depends(get_optional_user)):
    """Get recommended actions based on the current therapy session"""
    try:
        # Check if session exists
        if session_id not in active_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = active_sessions[session_id]
        
        # Get conversation history
        conversation_history = []
        user_id = current_user['id'] if current_user else None
        
        if user_id and FIREBASE_AVAILABLE and firebase_db:
            try:
                conversation_history = firebase_db.get_conversation_history(user_id, session_id)
            except Exception as e:
                print(f"❌ Error fetching conversation history: {e}")
        
        # If no history in database, use in-memory messages
        if not conversation_history and "messages" in session:
            conversation_history = session.get("messages", [])
        
        # Generate actions based on conversation
        actions = []
        
        # Default actions if no conversation history
        if not conversation_history:
            actions = [
                {
                    "title": "Practice Deep Breathing",
                    "description": "Take 5 minutes to practice deep breathing exercises",
                    "category": "relaxation",
                    "difficulty": "easy",
                    "duration": "5 minutes"
                },
                {
                    "title": "Mindfulness Meditation",
                    "description": "Try a short mindfulness meditation session",
                    "category": "mindfulness",
                    "difficulty": "medium",
                    "duration": "10 minutes"
                },
                {
                    "title": "Journal Your Thoughts",
                    "description": "Write down your thoughts and feelings in a journal",
                    "category": "reflection",
                    "difficulty": "easy",
                    "duration": "15 minutes"
                }
            ]
        else:
            # Analyze conversation to generate personalized actions
            # This is a simplified version - in a real app, you'd use NLP or ML
            
            # Check for anxiety-related keywords
            anxiety_keywords = ["anxiety", "anxious", "worry", "stress", "panic", "overwhelm"]
            depression_keywords = ["sad", "depression", "depressed", "hopeless", "unmotivated", "tired"]
            sleep_keywords = ["sleep", "insomnia", "tired", "exhausted", "rest", "fatigue"]
            
            # Convert conversation to text for analysis
            conversation_text = " ".join([msg.get("message", "") for msg in conversation_history])
            conversation_text = conversation_text.lower()
            
            # Check for themes
            has_anxiety = any(keyword in conversation_text for keyword in anxiety_keywords)
            has_depression = any(keyword in conversation_text for keyword in depression_keywords)
            has_sleep_issues = any(keyword in conversation_text for keyword in sleep_keywords)
            
            # Add relevant actions based on themes
            if has_anxiety:
                actions.append({
                    "title": "Anxiety Relief Exercise",
                    "description": "Practice the 5-4-3-2-1 grounding technique to reduce anxiety",
                    "category": "anxiety",
                    "difficulty": "easy",
                    "duration": "5 minutes"
                })
                actions.append({
                    "title": "Progressive Muscle Relaxation",
                    "description": "Tense and relax each muscle group to release physical tension",
                    "category": "anxiety",
                    "difficulty": "medium",
                    "duration": "15 minutes"
                })
            
            if has_depression:
                actions.append({
                    "title": "Mood Boosting Activity",
                    "description": "Do one small activity that usually brings you joy",
                    "category": "depression",
                    "difficulty": "medium",
                    "duration": "20 minutes"
                })
                actions.append({
                    "title": "Gratitude Practice",
                    "description": "Write down three things you're grateful for today",
                    "category": "depression",
                    "difficulty": "easy",
                    "duration": "5 minutes"
                })
            
            if has_sleep_issues:
                actions.append({
                    "title": "Sleep Hygiene Review",
                    "description": "Review and improve your bedtime routine for better sleep",
                    "category": "sleep",
                    "difficulty": "medium",
                    "duration": "30 minutes"
                })
                actions.append({
                    "title": "Evening Wind-Down",
                    "description": "Practice a calming routine 1 hour before bedtime",
                    "category": "sleep",
                    "difficulty": "easy",
                    "duration": "15 minutes"
                })
            
            # Always add some general wellness actions
            actions.append({
                "title": "Mindful Walking",
                "description": "Take a short walk while focusing on your senses",
                "category": "mindfulness",
                "difficulty": "easy",
                "duration": "10 minutes"
            })
            
            actions.append({
                "title": "Self-Compassion Break",
                "description": "Practice being kind to yourself during difficult moments",
                "category": "self-care",
                "difficulty": "medium",
                "duration": "5 minutes"
            })
        
        return {
            "session_id": session_id,
            "actions": actions,
            "message": "Recommended actions based on your therapy session"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating session actions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate actions: {str(e)}")

@app.post("/api/auth/refresh")
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Refresh authentication token"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = credentials.credentials
    print(f"🔄 Token refresh requested: {token[:30]}...")
    
    try:
        # Check if it's a demo token first
        if token.startswith("demo_token_"):
            print("✅ Demo token detected, generating new demo token")
            parts = token.split("_")
            
            if len(parts) >= 3:
                username = parts[2]
                user_id = int(parts[3]) if len(parts) > 3 and parts[3].isdigit() else int(time.time())
            else:
                username = "demo_user"
                user_id = int(time.time())
            
            # Generate a new demo token with updated timestamp
            new_token = f"demo_token_{username}_{int(time.time())}"
            
            return {
                "message": "Token refreshed successfully (demo mode)",
                "token": new_token,
                "user": {
                    "id": user_id,
                    "username": username,
                    "email": f"{username}@demo.com"
                }
            }
        
        # Try Firebase validation if available
        if FIREBASE_AVAILABLE and firebase_db:
            try:
                # First try to validate the token
                user_data = firebase_db.validate_token(token)
                if user_data:
                    print("✅ Firebase token validated")
                    
                    # Generate a new token
                    new_token = firebase_db.create_auth_token(user_data['id'])
                    
                    if new_token:
                        return {
                            "message": "Token refreshed successfully",
                            "token": new_token,
                            "user": user_data
                        }
            except Exception as e:
                print(f"⚠️ Firebase token validation failed: {e}")
                
                # If validation fails, try to extract user ID from token for debugging
                try:
                    import jwt
                    import base64
                    import json
                    
                    # Try to decode without verification
                    if token.startswith("eyJ"):
                        # Split the token and get the payload part
                        parts = token.split('.')
                        if len(parts) >= 2:
                            # Decode the payload
                            payload = parts[1]
                            # Add padding if needed
                            payload += '=' * (4 - len(payload) % 4) if len(payload) % 4 != 0 else ''
                            decoded_payload = base64.b64decode(payload)
                            payload_data = json.loads(decoded_payload)
                            
                            print(f"🔍 Token payload: {payload_data}")
                            
                            # Try to extract user ID
                            user_id = None
                            if 'uid' in payload_data:
                                user_id = payload_data['uid']
                            elif 'claims' in payload_data and 'uid' in payload_data['claims']:
                                user_id = payload_data['claims']['uid']
                            
                            if user_id:
                                print(f"🔍 Extracted user ID from token: {user_id}")
                                
                                # Try to get user data directly
                                user_doc = firebase_db.db.collection('users').document(user_id).get()
                                if user_doc.exists:
                                    user_data = user_doc.to_dict()
                                    
                                    # Generate a new token
                                    new_token = firebase_db.create_auth_token(user_id)
                                    
                                    if new_token:
                                        return {
                                            "message": "Token refreshed successfully (recovered)",
                                            "token": new_token,
                                            "user": {
                                                'id': user_doc.id,
                                                'uid': user_data['uid'],
                                                'username': user_data['username'],
                                                'email': user_data['email']
                                            }
                                        }
                    
                except Exception as extract_error:
                    print(f"❌ Error extracting user ID from token: {extract_error}")
        
        # If we reach here, token is invalid
        raise HTTPException(status_code=401, detail="Invalid token")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error in refresh_token: {e}")
        raise HTTPException(status_code=500, detail=f"Token refresh error: {str(e)}")

@app.post("/api/auth/logout")
async def logout():
    """Logout user"""
    return {"message": "Logged out successfully"}

# Session management
@app.post("/api/session/create")
async def create_session(config: SessionConfig, current_user: dict = Depends(get_optional_user)):
    """Create a new therapy session"""
    user_id = current_user['id'] if current_user else None
    
    # Generate session ID
    if current_user and FIREBASE_AVAILABLE and firebase_db:
        try:
            session_id = firebase_db.create_session(user_id, config.session_name)
        except:
            session_id = f"temp_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(active_sessions)}"
    else:
        session_id = f"temp_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(active_sessions)}"
    
    try:
        # Initialize therapist for this session with user context
        therapist = AITherapist(
            enable_voice=config.enable_voice,
            generation_mode=config.generation_mode,
            user_id=user_id
        )
        
        active_sessions[session_id] = {
            "therapist": therapist,
            "config": config.model_dump(),  # Store as dict for easier manipulation
            "created_at": datetime.now(),
            "message_count": 0,
            "user_id": user_id
        }
        
        # Generate personalized welcome message
        if current_user:
            welcome_message = f"Welcome back, {current_user['username']}! I'm Dr. Samaira, and I remember our previous conversations. How are you feeling today?"
        else:
            welcome_message = "Hello! I'm Dr. Samaira, your AI therapist. I'm here to listen and support you. How are you feeling today?"
        
        return {
            "session_id": session_id,
            "status": "created",
            "config": config.model_dump(),
            "welcome_message": welcome_message,
            "user_authenticated": current_user is not None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

# Chat endpoints
@app.post("/api/chat/{session_id}")
async def chat_endpoint(session_id: str, chat_request: dict, current_user: dict = Depends(get_optional_user)):
    """Handle text-based chat messages"""
    
    # Get or create session
    if session_id not in active_sessions:
        user_id = current_user['id'] if current_user else None
        try:
            therapist = AITherapist(enable_voice=True, generation_mode="default", user_id=user_id)
            active_sessions[session_id] = {
                "therapist": therapist,
                "config": {"enable_voice": True, "generation_mode": "default", "voice_emotion": "calm", "session_name": None},
                "created_at": datetime.now(),
                "message_count": 0,
                "user_id": user_id
            }
        except Exception as session_error:
            raise HTTPException(status_code=500, detail=f"Session creation error: {str(session_error)}")
    
    session = active_sessions[session_id]
    therapist = session["therapist"]
    
    # Update session user_id if user is now authenticated
    if current_user and not session.get("user_id"):
        session["user_id"] = current_user['id']
        therapist.user_id = current_user['id']
    
    try:
        # Get message from request
        message = chat_request.get("message", "")
        enable_voice = chat_request.get("enable_voice", True)
        generation_mode = chat_request.get("generation_mode", None)
        
        # Update generation mode if specified
        if generation_mode and generation_mode != therapist.generation_mode:
            therapist.set_generation_mode(generation_mode)
        
        # Get AI response (don't speak it here, let frontend handle voice)
        response = therapist.get_response(message, speak_response=False)
        session["message_count"] += 1
        
        # Save conversation to database if user is authenticated
        user_id = session.get("user_id")
        if user_id and FIREBASE_AVAILABLE and firebase_db:
            try:
                # Save user message
                firebase_db.save_conversation(
                    user_id=user_id,
                    session_id=session_id,
                    role="user",
                    content=message,
                    timestamp=datetime.now()
                )
                
                # Save AI response
                firebase_db.save_conversation(
                    user_id=user_id,
                    session_id=session_id,
                    role="assistant",
                    content=response,
                    timestamp=datetime.now()
                )
            except Exception as db_error:
                print(f"Failed to save conversation: {db_error}")
        
        return {
            "response": response,
            "session_id": session_id,
            "message_count": session["message_count"],
            "generation_mode": therapist.generation_mode,
            "enable_voice": enable_voice
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint_legacy(chat_request: ChatMessage):
    """Legacy chat endpoint for backward compatibility"""
    session_id = chat_request.session_id or "default"
    return await chat_endpoint(session_id, {"message": chat_request.message, "enable_voice": True})

# OpenAI TTS API
async def openai_tts(message: str, emotion: str = "calm"):
    """OpenAI TTS API call"""
    try:
        from openai import OpenAI
        
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        client = OpenAI(api_key=openai_key)
        
        # Map emotion to voice
        voice_map = {
            "calm": "alloy",
            "supportive": "nova", 
            "empathetic": "shimmer",
            "encouraging": "echo",
            "default": "alloy"
        }
        
        voice = voice_map.get(emotion, "alloy")
        
        print(f"🔄 OpenAI TTS API call for: '{message[:50]}...' with voice: {voice}")
        
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=message,
            response_format="mp3"
        )
        
        # Get audio content
        audio_content = response.content
        audio_data = base64.b64encode(audio_content).decode()
        
        word_count = len(message.split())
        estimated_duration = max(1, (word_count / 180) * 60)
        
        print(f"✅ OpenAI TTS successful: {len(audio_content)} bytes")
        
        return {
            "audio_data": audio_data,
            "audio_format": "mp3",
            "emotion": emotion,
            "message": message,
            "estimated_duration": estimated_duration,
            "word_count": word_count
        }
        
    except Exception as e:
        error_msg = f"OpenAI TTS error: {str(e)}"
        print(f"❌ {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

# Direct ElevenLabs API fallback
async def direct_elevenlabs_tts(message: str, emotion: str = "calm"):
    """Direct ElevenLabs API call as fallback"""
    import requests
    
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    if not elevenlabs_key:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
    
    # Use Rachel voice (doesn't require voices_read permission)
    voice_id = "21m00Tcm4TlvDq8ikWAM"
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": elevenlabs_key
    }
    
    data = {
        "text": message,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }
    
    print(f"🔄 Direct ElevenLabs API call for: '{message[:50]}...'")
    response = requests.post(url, json=data, headers=headers, timeout=30)
    
    if response.status_code == 200:
        audio_data = base64.b64encode(response.content).decode()
        word_count = len(message.split())
        estimated_duration = max(1, (word_count / 180) * 60)
        
        print(f"✅ Direct ElevenLabs successful: {len(response.content)} bytes")
        
        return {
            "audio_data": audio_data,
            "audio_format": "mp3",
            "emotion": emotion,
            "message": message,
            "estimated_duration": estimated_duration,
            "word_count": word_count
        }
    else:
        error_msg = f"ElevenLabs API error: {response.status_code} - {response.text}"
        print(f"❌ {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

# Voice endpoints
@app.post("/api/voice/synthesize")
async def synthesize_voice(message: str, emotion: str = "calm", session_id: str = "default"):
    """Generate voice audio from text"""
    try:
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        print(f"🎤 TTS Request: message='{message[:50]}...', emotion={emotion}, session={session_id}")
        
        # Check if session exists, create if not
        if session_id not in active_sessions:
            print(f"⚠️ Session {session_id} not found, creating temporary session")
            therapist = AITherapist(enable_voice=True, generation_mode="default")
            active_sessions[session_id] = {
                "therapist": therapist,
                "config": {"enable_voice": True, "generation_mode": "default", "voice_emotion": "calm", "session_name": None},
                "created_at": datetime.now(),
                "message_count": 0,
                "user_id": None
            }
        
        session = active_sessions[session_id]
        therapist = session["therapist"]
        
        # Try OpenAI TTS first (most reliable and cost-effective)
        print("🔄 Trying OpenAI TTS first...")
        try:
            return await openai_tts(message, emotion)
        except Exception as openai_error:
            print(f"⚠️ OpenAI TTS failed: {openai_error}")
            
            # Fallback to ElevenLabs voice class
            if not therapist.voice:
                print("⚠️ Voice not enabled, trying to initialize ElevenLabs...")
                try:
                    from voice_tts_elevenlabs import ElevenLabsTherapistVoice
                    therapist.voice = ElevenLabsTherapistVoice()
                    print("✅ ElevenLabs voice initialized")
                    
                    # Test if the voice actually works
                    if not hasattr(therapist.voice, 'speak') or not therapist.voice.api_available:
                        print("⚠️ Voice initialized but not functional, using direct ElevenLabs API")
                        return await direct_elevenlabs_tts(message, emotion)
                        
                except Exception as voice_init_error:
                    print(f"❌ ElevenLabs voice initialization failed: {voice_init_error}")
                    print("🔄 Using direct ElevenLabs API...")
                    return await direct_elevenlabs_tts(message, emotion)
        
        # Generate audio
        print("🎤 Generating audio...")
        try:
            audio_path = therapist.voice.speak(message, emotion=emotion, play_immediately=False)
            print(f"🎤 Audio generation completed, path: {audio_path}")
            
            if audio_path and os.path.exists(audio_path):
                # Read audio file and encode as base64
                with open(audio_path, "rb") as audio_file:
                    audio_content = audio_file.read()
                    audio_data = base64.b64encode(audio_content).decode()
                
                # Estimate duration based on text length
                word_count = len(message.split())
                estimated_duration = max(1, (word_count / 180) * 60)  # seconds
                
                print(f"✅ TTS successful: {len(audio_content)} bytes -> {len(audio_data)} chars base64")
                
                # Clean up the temporary file
                try:
                    os.unlink(audio_path)
                    print(f"🧹 Cleaned up audio file: {audio_path}")
                except:
                    pass
                
                return {
                    "audio_data": audio_data,
                    "audio_format": "mp3" if audio_path.endswith(".mp3") else "aiff",
                    "emotion": emotion,
                    "message": message,
                    "estimated_duration": estimated_duration,
                    "word_count": word_count
                }
            else:
                print(f"❌ Audio file not found or empty: {audio_path}")
                print("🔄 Falling back to OpenAI TTS...")
                try:
                    return await openai_tts(message, emotion)
                except Exception as openai_fallback_error:
                    print(f"⚠️ OpenAI TTS fallback failed: {openai_fallback_error}")
                    print("🔄 Final fallback to direct ElevenLabs API...")
                    return await direct_elevenlabs_tts(message, emotion)
                
        except Exception as voice_error:
            print(f"❌ Voice generation error: {voice_error}")
            print("🔄 Falling back to OpenAI TTS...")
            try:
                return await openai_tts(message, emotion)
            except Exception as openai_fallback_error:
                print(f"⚠️ OpenAI TTS fallback failed: {openai_fallback_error}")
                print("🔄 Final fallback to direct ElevenLabs API...")
                try:
                    return await direct_elevenlabs_tts(message, emotion)
                except Exception as final_fallback_error:
                    print(f"❌ All TTS methods failed: {final_fallback_error}")
                    raise HTTPException(status_code=500, detail=f"All voice synthesis methods failed: {str(final_fallback_error)}")
            
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Voice synthesis error: {str(e)}"
        print(f"❌ {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/voice/transcribe")
async def transcribe_voice(audio_file: UploadFile = File(...), session_id: str = "default"):
    """Transcribe voice audio to text using OpenAI Whisper"""
    
    temp_path = None
    try:
        print(f"🎧 STT Request: {audio_file.filename}, content_type: {audio_file.content_type}")
        
        # Read audio content
        content = await audio_file.read()
        
        if len(content) < 100:
            print("⚠️ Audio file too small")
            return {
                "transcription": "",
                "session_id": session_id,
                "status": "no_audio_data"
            }
        
        print(f"📁 Audio file size: {len(content)} bytes")
        
        # Determine file extension
        filename = audio_file.filename or "audio.webm"
        if filename.endswith('.wav'):
            suffix = '.wav'
        elif filename.endswith('.mp3'):
            suffix = '.mp3'
        elif filename.endswith('.m4a'):
            suffix = '.m4a'
        else:
            suffix = '.webm'  # Default for browser recordings
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name
        
        print(f"💾 Saved to: {temp_path}")
        
        # Try OpenAI Whisper first (most reliable)
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            print("🔍 Using OpenAI Whisper...")
            with open(temp_path, "rb") as audio:
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio,
                    response_format="text"
                )
            
            print(f"✅ OpenAI Whisper successful: '{transcription[:50]}...'")
            
            return {
                "transcription": transcription,
                "session_id": session_id,
                "status": "success"
            }
            
        except Exception as openai_error:
            print(f"⚠️ OpenAI Whisper failed: {openai_error}")
            
            # Fallback: Try using VoiceRecorder if available
            try:
                recorder = VoiceRecorder()
                transcription = recorder.transcribe_audio(temp_path)
                recorder.cleanup()
                
                if transcription and transcription.strip():
                    print(f"✅ VoiceRecorder fallback successful: '{transcription[:50]}...'")
                    return {
                        "transcription": transcription,
                        "session_id": session_id,
                        "status": "success"
                    }
                else:
                    raise Exception("Empty transcription")
                    
            except Exception as recorder_error:
                print(f"⚠️ VoiceRecorder fallback failed: {recorder_error}")
                
                # Final fallback: Return a helpful message
                print("⚠️ All transcription methods failed, returning fallback")
                return {
                    "transcription": "I couldn't understand the audio. Could you please try speaking again or type your message?",
                    "session_id": session_id,
                    "status": "fallback"
                }
        
    except Exception as e:
        error_msg = f"Transcription error: {str(e)}"
        print(f"❌ {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)
    finally:
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
                print(f"🧹 Cleaned up: {temp_path}")
            except:
                pass

# WebSocket endpoint for real-time communication
@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    
    # Initialize session if not exists
    if session_id not in active_sessions:
        therapist = AITherapist(enable_voice=True, generation_mode="default")
        active_sessions[session_id] = {
            "therapist": therapist,
            "config": {"enable_voice": True, "generation_mode": "default", "voice_emotion": "calm", "session_name": None},
            "created_at": datetime.now(),
            "message_count": 0,
            "user_id": None
        }
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            session = active_sessions[session_id]
            therapist = session["therapist"]
            
            if message_data.get("type") == "chat":
                message = message_data.get("message", "")
                
                # Get AI response
                response = therapist.get_response(message, speak_response=False)
                session["message_count"] += 1
                
                # Send response back
                await manager.send_json({
                    "type": "response",
                    "message": response,
                    "session_id": session_id,
                    "message_count": session["message_count"]
                }, session_id)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)

# Session management endpoints
@app.post("/api/session/{session_id}/mode")
async def set_generation_mode(session_id: str, mode_request: dict):
    """Set the generation mode for a session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    therapist = session["therapist"]
    
    try:
        new_mode = mode_request.get("mode", "default")
        
        print(f"🔄 Changing generation mode from {therapist.generation_mode} to {new_mode} for session {session_id}")
        
        # Update the therapist's generation mode
        therapist.set_generation_mode(new_mode)
        
        # Update session config (now always a dictionary)
        session["config"]["generation_mode"] = new_mode
        
        print(f"✅ Generation mode changed successfully to {new_mode}")
        
        return {
            "status": "success",
            "session_id": session_id,
            "new_mode": new_mode,
            "message": f"Generation mode changed to {new_mode}"
        }
        
    except Exception as e:
        error_msg = f"Failed to set generation mode: {str(e)}"
        print(f"❌ {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.delete("/api/session/{session_id}")
async def end_session(session_id: str):
    """End a therapy session and cleanup resources"""
    if session_id in active_sessions:
        session = active_sessions[session_id]
        therapist = session["therapist"]
        
        # Cleanup therapist resources
        if hasattr(therapist, 'cleanup'):
            therapist.cleanup()
        
        # Remove from active sessions
        del active_sessions[session_id]
        
        return {"status": "session_ended", "session_id": session_id}
    else:
        raise HTTPException(status_code=404, detail="Session not found")

@app.get("/api/sessions")
async def list_sessions():
    """List all active sessions (for debugging)"""
    sessions_info = {}
    for session_id, session in active_sessions.items():
        sessions_info[session_id] = {
            "created_at": session["created_at"].isoformat(),
            "message_count": session["message_count"],
            "config": session["config"]
        }
    return {"active_sessions": sessions_info, "total": len(active_sessions)}

@app.get("/api/session/{session_id}")
async def get_session(session_id: str, current_user: dict = Depends(get_optional_user)):
    """Get session information"""
    # Check if session is active in memory
    if session_id in active_sessions:
        session = active_sessions[session_id]
        return {
            "session_id": session_id,
            "created_at": session["created_at"].isoformat(),
            "message_count": session["message_count"],
            "config": session["config"],
            "user_id": session.get("user_id"),
            "status": "active"
        }
    
    # Try to restore session from Firebase
    if FIREBASE_AVAILABLE and firebase_db and current_user:
        try:
            session_data = firebase_db.get_session(session_id, current_user['id'])
            if session_data:
                return {
                    "session_id": session_id,
                    "created_at": session_data.get("created_at", ""),
                    "message_count": session_data.get("message_count", 0),
                    "config": session_data.get("config", {}),
                    "user_id": session_data.get("user_id"),
                    "status": "stored"
                }
        except Exception as e:
            print(f"❌ Error fetching session from Firebase: {e}")
    
    raise HTTPException(status_code=404, detail="Session not found")

@app.post("/api/session/{session_id}/restore")
async def restore_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Restore a previous session"""
    if session_id in active_sessions:
        return {"message": "Session already active", "session_id": session_id}
    
    if not FIREBASE_AVAILABLE or not firebase_db:
        raise HTTPException(status_code=501, detail="Session restore not available - Firebase not configured")
    
    try:
        user_id = current_user['id']
        session_data = firebase_db.get_session(session_id, user_id)
        
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Restore the session
        config = session_data.get("config", {"enable_voice": True, "generation_mode": "default"})
        
        # Initialize therapist for restored session
        therapist = AITherapist(
            enable_voice=config.get("enable_voice", True),
            generation_mode=config.get("generation_mode", "default"),
            user_id=user_id
        )
        
        active_sessions[session_id] = {
            "therapist": therapist,
            "config": config,
            "created_at": datetime.now(),  # Use current time for active session
            "message_count": session_data.get("message_count", 0),
            "user_id": user_id
        }
        
        return {
            "message": "Session restored successfully",
            "session_id": session_id,
            "config": config,
            "message_count": session_data.get("message_count", 0)
        }
        
    except Exception as e:
        error_msg = f"Failed to restore session: {str(e)}"
        print(f"❌ {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/api/session/{session_id}/mode")
async def get_generation_mode(session_id: str):
    """Get current generation mode for a session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    therapist = session["therapist"]
    
    return {
        "session_id": session_id,
        "current_mode": therapist.generation_mode,
        "available_modes": ["default", "gen-z", "millennial", "boomer"]
    }

@app.post("/api/test/tts")
async def test_tts():
    """Test TTS with OpenAI API"""
    try:
        # Test OpenAI TTS first
        try:
            result = await openai_tts("Hello, this is a test of the OpenAI text to speech system.", "calm")
            return {
                "status": "success",
                "provider": "OpenAI",
                "message": "OpenAI TTS test completed",
                "audio_length": len(result["audio_data"]) if "audio_data" in result else 0
            }
        except Exception as openai_error:
            print(f"OpenAI TTS test failed: {openai_error}")
            
            # Fallback to ElevenLabs
            result = await direct_elevenlabs_tts("Hello, this is a test of the ElevenLabs text to speech system.", "calm")
            return {
                "status": "success",
                "provider": "ElevenLabs",
                "message": "ElevenLabs TTS test completed (OpenAI failed)",
                "audio_length": len(result["audio_data"]) if "audio_data" in result else 0,
                "openai_error": str(openai_error)
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@app.get("/api/test/auth")
async def test_auth_get():
    """Simple GET test for auth endpoints"""
    return {
        "status": "auth endpoints reachable",
        "firebase_available": FIREBASE_AVAILABLE,
        "firebase_db": firebase_db is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/user/recent")
async def get_recent_activity(current_user: dict = Depends(get_current_user)):
    """Get user's recent activity and conversations"""
    if not FIREBASE_AVAILABLE or not firebase_db:
        return {
            "sessions": [],
            "recent_messages": [],
            "message": "Demo mode - no persistent data available"
        }
    
    try:
        user_id = current_user['id']
        
        # Get recent sessions
        sessions = firebase_db.get_user_sessions(user_id, limit=5)
        
        # Get recent conversations
        recent_conversations = []
        for session in sessions[:3]:  # Get conversations from last 3 sessions
            try:
                messages = firebase_db.get_conversation_history(user_id, session['session_id'], limit=5)
                if messages:
                    recent_conversations.extend(messages)
            except Exception as e:
                print(f"Error fetching conversation for session {session['session_id']}: {e}")
        
        return {
            "sessions": sessions,
            "recent_messages": recent_conversations[-10:],  # Last 10 messages
            "user": current_user
        }
        
    except Exception as e:
        error_msg = f"Failed to fetch recent activity: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            "sessions": [],
            "recent_messages": [],
            "error": error_msg
        }

@app.get("/api/user/summary")
async def get_conversation_summary(current_user: dict = Depends(get_current_user)):
    """Get AI-generated summary of user's conversations"""
    try:
        user_id = current_user['id']
        
        # Handle demo mode
        if str(user_id).isdigit() and current_user.get('username', '').startswith('demo'):
            return {
                "summary": "Welcome to Dr. Samaira! This is a demo account. Your conversations in demo mode help you explore the features of our AI therapy platform. Start a real conversation to see personalized insights and summaries of your therapeutic journey.",
                "key_topics": ["Demo Mode", "Getting Started", "AI Therapy"],
                "session_count": 2,
                "message_count": 8,
                "user": current_user["username"]
            }
        
        # Get current session messages if available
        current_session_messages = []
        user_sessions = [sid for sid, session in active_sessions.items() if session.get("user_id") == user_id]
        
        if user_sessions:
            # Get messages from the most recent active session
            recent_session_id = user_sessions[-1]
            session = active_sessions[recent_session_id]
            if hasattr(session["therapist"], "conversation_history"):
                current_session_messages = session["therapist"].conversation_history[-20:]  # Last 20 messages
        
        # Get recent conversations from Firebase if available
        firebase_messages = []
        if FIREBASE_AVAILABLE and firebase_db:
            try:
                sessions = firebase_db.get_user_sessions(user_id, limit=3)
                for session_data in sessions:
                    messages = firebase_db.get_conversation_history(user_id, session_data['session_id'], limit=10)
                    firebase_messages.extend(messages)
            except Exception as e:
                print(f"Error fetching Firebase conversations: {e}")
        
        # Combine all messages
        all_messages = firebase_messages + current_session_messages
        
        if not all_messages:
            return {
                "summary": "No conversations found to summarize.",
                "key_topics": [],
                "session_count": 0,
                "message_count": 0
            }
        
        # Create summary using OpenAI
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            # Prepare conversation text for summarization
            conversation_text = ""
            user_messages = []
            ai_messages = []
            
            for msg in all_messages[-30:]:  # Last 30 messages for summary
                if isinstance(msg, dict):
                    role = msg.get("role", "")
                    content = msg.get("content", "")
                elif hasattr(msg, "role"):
                    role = msg.role
                    content = msg.content
                else:
                    continue
                
                if role == "user":
                    user_messages.append(content)
                    conversation_text += f"User: {content}\n"
                elif role == "assistant":
                    ai_messages.append(content)
                    conversation_text += f"Dr. Samaira: {content}\n"
            
            # Generate summary
            summary_prompt = f"""
            Please provide a compassionate and professional summary of this therapy conversation between a user and Dr. Samaira (AI therapist). 
            
            Focus on:
            1. Main topics discussed
            2. User's emotional state and concerns
            3. Progress or insights gained
            4. Key therapeutic themes
            
            Conversation:
            {conversation_text[-2000:]}  # Last 2000 chars to avoid token limits
            
            Provide a summary in 2-3 paragraphs that would be helpful for continuity of care.
            """
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": summary_prompt}],
                max_tokens=300,
                temperature=0.3
            )
            
            summary = response.choices[0].message.content
            
            # Extract key topics (simple keyword extraction)
            key_topics = []
            common_topics = ["anxiety", "stress", "depression", "relationships", "work", "family", "sleep", "emotions", "goals", "self-care"]
            conversation_lower = conversation_text.lower()
            
            for topic in common_topics:
                if topic in conversation_lower:
                    key_topics.append(topic.title())
            
            return {
                "summary": summary,
                "key_topics": key_topics[:5],  # Top 5 topics
                "session_count": len(set([msg.get("session_id") for msg in firebase_messages if isinstance(msg, dict) and msg.get("session_id")])),
                "message_count": len(all_messages),
                "user": current_user["username"]
            }
            
        except Exception as openai_error:
            print(f"OpenAI summary generation failed: {openai_error}")
            
            # Fallback: Simple text-based summary
            total_messages = len(all_messages)
            user_msg_count = len([m for m in all_messages if (isinstance(m, dict) and m.get("role") == "user") or (hasattr(m, "role") and m.role == "user")])
            
            return {
                "summary": f"You have had {total_messages} total messages across your therapy sessions. You've shared {user_msg_count} messages with Dr. Samaira, covering various topics related to your mental health and wellbeing. Your conversations show engagement with the therapeutic process.",
                "key_topics": ["General Wellbeing", "Mental Health"],
                "session_count": len(user_sessions) + len(set([msg.get("session_id") for msg in firebase_messages if isinstance(msg, dict) and msg.get("session_id")])),
                "message_count": total_messages,
                "user": current_user["username"]
            }
        
    except Exception as e:
        error_msg = f"Failed to generate conversation summary: {str(e)}"
        print(f"❌ {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/api/test/auth-debug")
async def test_auth_debug(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Debug authentication token"""
    try:
        if not credentials:
            return {
                "error": "No credentials provided",
                "help": "Make sure you're sending Authorization: Bearer <token> header"
            }
        
        token = credentials.credentials
        print(f"🔍 Debug token: {token}")
        
        # Try to parse as demo token
        demo_info = {}
        if token.startswith("demo_token_"):
            parts = token.split("_")
            demo_info = {
                "is_demo_token": True,
                "parts": parts,
                "parts_count": len(parts),
                "username": parts[2] if len(parts) > 2 else "unknown",
                "timestamp": parts[3] if len(parts) > 3 else "unknown"
            }
        
        return {
            "token_received": token[:50] + "..." if len(token) > 50 else token,
            "token_length": len(token),
            "starts_with_demo": token.startswith("demo_token_"),
            "firebase_available": FIREBASE_AVAILABLE,
            "firebase_db_available": firebase_db is not None,
            "demo_info": demo_info
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/test/simple")
async def test_simple():
    """Simple test endpoint without authentication"""
    return {
        "message": "API is working",
        "timestamp": datetime.now().isoformat(),
        "firebase_available": FIREBASE_AVAILABLE
    }

@app.get("/api/test/signup")
async def test_signup_simple():
    """Simple signup test with hardcoded data"""
    try:
        result = await signup({
            "username": "testuser456",
            "email": "testuser456@example.com", 
            "password": "password123"
        })
        return {
            "test": "signup",
            "status": "success",
            "result": result
        }
    except Exception as e:
        return {
            "test": "signup",
            "status": "error",
            "error": str(e)
        }

@app.post("/api/test/auth")
async def test_auth():
    """Test authentication endpoints"""
    try:
        print("🧪 Starting auth test...")
        
        # Test signup
        test_data = {
            "username": "testuser123",
            "email": "test@example.com",
            "password": "testpass123"
        }
        print(f"🧪 Testing signup with: {test_data}")
        
        signup_result = await signup(test_data)
        print(f"🧪 Signup result: {signup_result}")
        
        # Test login
        login_data = {
            "username": "testuser123",
            "password": "testpass123"
        }
        print(f"🧪 Testing login with: {login_data}")
        
        login_result = await login(login_data)
        print(f"🧪 Login result: {login_result}")
        
        return {
            "status": "success",
            "signup": signup_result,
            "login": login_result
        }
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Auth test failed: {error_msg}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "error": error_msg
        }

# Mount static files at the end, after all API routes are defined
try:
    if os.path.exists("frontend/build"):
        app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")
        # Serve index.html for the root path
        @app.get("/")
        async def serve_frontend():
            return FileResponse("frontend/build/index.html")
        
        # Mount the rest of the frontend files
        app.mount("/", StaticFiles(directory="frontend/build"), name="frontend")
    else:
        @app.get("/")
        async def read_root():
            """Serve the main frontend page"""
            return HTMLResponse(content="""
            <html>
                <head><title>AI Therapist API</title></head>
                <body>
                    <h1>🧠 AI Therapist API - Phase 4</h1>
                    <p>Backend server is running successfully!</p>
                    <ul>
                        <li><strong>API Docs:</strong> <a href="/docs">/docs</a></li>
                        <li><strong>WebSocket:</strong> ws://localhost:8000/ws/{session_id}</li>
                        <li><strong>Chat API:</strong> POST /api/chat</li>
                        <li><strong>Voice API:</strong> POST /api/voice</li>
                    </ul>
                </body>
            </html>
            """)
except Exception as e:
    print(f"Frontend serving error: {e}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print("🚀 Starting AI Therapist API Server - Phase 4")
    print(f"📱 Web interface will be available at: http://localhost:{port}")
    print(f"📚 API documentation: http://localhost:{port}/docs")
    uvicorn.run(app, host="0.0.0.0", port=port)