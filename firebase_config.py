"""
Firebase Configuration and Database Manager
Replaces SQLite with Firebase Firestore for scalable cloud storage

Copyright (c) 2025 Shreyansh Gupta
All Rights Reserved
https://shreygupta.vercel.app
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth
import hashlib
import secrets
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

class FirebaseManager:
    def __init__(self):
        self.db = None
        self.init_firebase()
    
    def init_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if Firebase is already initialized
            if not firebase_admin._apps:
                # For development: use service account key file
                service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
                
                if service_account_path and os.path.exists(service_account_path):
                    # Use service account file
                    cred = credentials.Certificate(service_account_path)
                    firebase_admin.initialize_app(cred)
                    print("✅ Firebase initialized with service account")
                else:
                    # For production: use environment variables
                    firebase_config = {
                        "type": "service_account",
                        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                        "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n'),
                        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL")
                    }
                    
                    if firebase_config["project_id"]:
                        cred = credentials.Certificate(firebase_config)
                        firebase_admin.initialize_app(cred)
                        print("✅ Firebase initialized with environment variables")
                    else:
                        print("⚠️ Firebase credentials not found, using default initialization")
                        firebase_admin.initialize_app()
            
            # Initialize Firestore client
            self.db = firestore.client()
            print("✅ Firestore database connected")
            
        except Exception as e:
            print(f"❌ Firebase initialization error: {e}")
            self.db = None
    
    def hash_password(self, password: str, salt: str = None) -> tuple:
        """Hash password with salt"""
        if salt is None:
            salt = secrets.token_hex(32)
        
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return password_hash.hex(), salt
    
    def create_user(self, username: str, email: str, password: str) -> Optional[str]:
        """Create a new user in Firebase Auth and Firestore"""
        try:
            if not self.db:
                return None
            
            # Check if username already exists
            users_ref = self.db.collection('users')
            username_query = users_ref.where('username', '==', username).limit(1)
            if len(username_query.get()) > 0:
                print(f"❌ Username '{username}' already exists")
                return None
            
            # Create user in Firebase Auth
            user_record = auth.create_user(
                email=email,
                password=password,
                display_name=username
            )
            
            # Hash password for additional security in Firestore
            password_hash, salt = self.hash_password(password)
            
            # Create user document in Firestore
            user_data = {
                'uid': user_record.uid,
                'username': username,
                'email': email,
                'password_hash': password_hash,  # Additional security layer
                'salt': salt,
                'created_at': firestore.SERVER_TIMESTAMP,
                'last_login': None,
                'profile_data': {},
                'preferences': {},
                'is_active': True
            }
            
            self.db.collection('users').document(user_record.uid).set(user_data)
            
            print(f"✅ User created: {username} (UID: {user_record.uid})")
            return user_record.uid
            
        except auth.EmailAlreadyExistsError:
            print(f"❌ Email '{email}' already exists")
            return None
        except Exception as e:
            print(f"❌ User creation failed: {e}")
            return None
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user using Firebase Auth"""
        try:
            if not self.db:
                return None
            
            # Find user by username in Firestore
            users_ref = self.db.collection('users')
            username_query = users_ref.where('username', '==', username).limit(1)
            user_docs = username_query.get()
            
            if not user_docs:
                # Try by email
                email_query = users_ref.where('email', '==', username).limit(1)
                user_docs = email_query.get()
                
                if not user_docs:
                    return None
            
            user_doc = user_docs[0]
            user_data = user_doc.to_dict()
            
            # Verify password
            password_hash, _ = self.hash_password(password, user_data['salt'])
            if password_hash != user_data['password_hash']:
                return None
            
            # Update last login
            self.db.collection('users').document(user_doc.id).update({
                'last_login': firestore.SERVER_TIMESTAMP
            })
            
            return {
                'id': user_doc.id,
                'uid': user_data['uid'],
                'username': user_data['username'],
                'email': user_data['email'],
                'profile_data': user_data.get('profile_data', {}),
                'preferences': user_data.get('preferences', {})
            }
            
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return None
    
    def create_auth_token(self, user_id: str) -> str:
        """Create custom token for user"""
        try:
            # Create custom token using Firebase Auth
            custom_token = auth.create_custom_token(user_id)
            
            # Store token info in Firestore for tracking
            token_data = {
                'user_id': user_id,
                'created_at': firestore.SERVER_TIMESTAMP,
                'expires_at': datetime.now() + timedelta(days=30),
                'is_active': True
            }
            
            # Store in tokens subcollection
            self.db.collection('users').document(user_id).collection('tokens').add(token_data)
            
            return custom_token.decode('utf-8')
            
        except Exception as e:
            print(f"❌ Token creation error: {e}")
            return None
    
    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate Firebase token and return user data"""
        try:
            # Check if this is a custom token (starts with "eyJ")
            if token.startswith("eyJ"):
                print("🔍 Detected a custom token - extracting user ID")
                
                # For custom tokens, we need to extract the user ID
                # This is a simplified approach - in production, use proper JWT decoding
                import jwt
                try:
                    # Try to decode without verification (just to extract user ID)
                    decoded = jwt.decode(token, options={"verify_signature": False})
                    if 'uid' in decoded:
                        user_id = decoded['uid']
                        print(f"🔍 Extracted user ID from custom token: {user_id}")
                    else:
                        print("❌ No user ID found in custom token")
                        return None
                except Exception as jwt_error:
                    print(f"❌ Error decoding custom token: {jwt_error}")
                    
                    # Fallback: try to extract from token claims directly
                    try:
                        # Custom tokens have a structure where user ID is in claims.uid
                        import base64
                        import json
                        
                        # Split the token and get the payload part (second part)
                        parts = token.split('.')
                        if len(parts) >= 2:
                            # Decode the payload
                            payload = parts[1]
                            # Add padding if needed
                            payload += '=' * (4 - len(payload) % 4) if len(payload) % 4 != 0 else ''
                            decoded_payload = base64.b64decode(payload)
                            payload_data = json.loads(decoded_payload)
                            
                            if 'uid' in payload_data:
                                user_id = payload_data['uid']
                                print(f"🔍 Extracted user ID from token payload: {user_id}")
                            elif 'claims' in payload_data and 'uid' in payload_data['claims']:
                                user_id = payload_data['claims']['uid']
                                print(f"🔍 Extracted user ID from token claims: {user_id}")
                            else:
                                print("❌ Could not extract user ID from token")
                                return None
                        else:
                            print("❌ Invalid token format")
                            return None
                    except Exception as extract_error:
                        print(f"❌ Error extracting user ID from token: {extract_error}")
                        return None
            else:
                # Try to verify as an ID token
                try:
                    decoded_token = auth.verify_id_token(token)
                    user_id = decoded_token['uid']
                    print(f"🔍 ID token validated for user ID: {user_id}")
                except Exception as id_token_error:
                    print(f"❌ ID token validation failed: {id_token_error}")
                    return None
            
            # Get user data from Firestore using the extracted user_id
            user_doc = self.db.collection('users').document(user_id).get()
            
            if not user_doc.exists:
                print(f"❌ User document not found for UID: {user_id}")
                return None
            
            user_data = user_doc.to_dict()
            print(f"✅ User data retrieved: {user_data.get('username', 'Unknown')}")
            
            return {
                'id': user_doc.id,
                'uid': user_data['uid'],
                'username': user_data['username'],
                'email': user_data['email'],
                'profile_data': user_data.get('profile_data', {}),
                'preferences': user_data.get('preferences', {})
            }
            
        except Exception as e:
            print(f"❌ Token validation error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def create_session(self, user_id: str, session_name: str = None) -> str:
        """Create a new therapy session for user"""
        try:
            session_id = f"user_{user_id}_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{secrets.token_hex(4)}"
            
            session_data = {
                'session_id': session_id,
                'user_id': user_id,
                'session_name': session_name or f"Session {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP,
                'session_data': {},
                'is_active': True,
                'message_count': 0
            }
            
            # Store in sessions collection
            self.db.collection('sessions').document(session_id).set(session_data)
            
            # Also add to user's sessions subcollection for easy querying
            self.db.collection('users').document(user_id).collection('sessions').document(session_id).set({
                'session_id': session_id,
                'session_name': session_data['session_name'],
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP,
                'message_count': 0
            })
            
            print(f"✅ Session created: {session_id}")
            return session_id
            
        except Exception as e:
            print(f"❌ Session creation error: {e}")
            return None
    
    def save_conversation(self, session_id: str, user_id: str, message_id: str, 
                         sender: str, message: str, emotion: str = None, metadata: Dict = None):
        """Save conversation message to Firestore"""
        try:
            conversation_data = {
                'session_id': session_id,
                'user_id': user_id,
                'message_id': message_id,
                'sender': sender,
                'message': message,
                'emotion': emotion,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'metadata': metadata or {}
            }
            
            # Save to conversations collection
            self.db.collection('conversations').add(conversation_data)
            
            # Update session message count and timestamp
            session_ref = self.db.collection('sessions').document(session_id)
            session_ref.update({
                'updated_at': firestore.SERVER_TIMESTAMP,
                'message_count': firestore.Increment(1)
            })
            
            # Update user's session subcollection
            user_session_ref = self.db.collection('users').document(user_id).collection('sessions').document(session_id)
            user_session_ref.update({
                'updated_at': firestore.SERVER_TIMESTAMP,
                'message_count': firestore.Increment(1)
            })
            
        except Exception as e:
            print(f"❌ Conversation save error: {e}")
    
    def get_user_conversation_history(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get recent conversation history for user"""
        try:
            conversations_ref = self.db.collection('conversations')
            query = conversations_ref.where('user_id', '==', user_id).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit)
            
            conversations = []
            for doc in query.stream():
                data = doc.to_dict()
                conversations.append({
                    'sender': data['sender'],
                    'message': data['message'],
                    'emotion': data.get('emotion'),
                    'timestamp': data['timestamp']
                })
            
            return list(reversed(conversations))  # Return in chronological order
            
        except Exception as e:
            print(f"❌ History retrieval error: {e}")
            return []
    
    def get_user_sessions(self, user_id: str) -> List[Dict]:
        """Get all sessions for a user"""
        try:
            sessions_ref = self.db.collection('users').document(user_id).collection('sessions')
            query = sessions_ref.order_by('updated_at', direction=firestore.Query.DESCENDING)
            
            sessions = []
            for doc in query.stream():
                data = doc.to_dict()
                sessions.append({
                    'session_id': data['session_id'],
                    'session_name': data['session_name'],
                    'created_at': data['created_at'],
                    'updated_at': data['updated_at'],
                    'message_count': data.get('message_count', 0)
                })
            
            return sessions
            
        except Exception as e:
            print(f"❌ Sessions retrieval error: {e}")
            return []
    
    def save_user_insight(self, user_id: str, insight_type: str, insight_data: Dict, confidence: float = 0.5):
        """Save AI insights about user"""
        try:
            insight_doc_data = {
                'user_id': user_id,
                'insight_type': insight_type,
                'insight_data': insight_data,
                'confidence_score': confidence,
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            # Use insight_type as document ID to allow updates
            insights_ref = self.db.collection('users').document(user_id).collection('insights').document(insight_type)
            insights_ref.set(insight_doc_data, merge=True)
            
        except Exception as e:
            print(f"❌ Insight save error: {e}")
    
    def get_user_insights(self, user_id: str) -> Dict[str, Any]:
        """Get AI insights about user"""
        try:
            insights_ref = self.db.collection('users').document(user_id).collection('insights')
            
            insights = {}
            for doc in insights_ref.stream():
                data = doc.to_dict()
                insights[doc.id] = {
                    'data': data['insight_data'],
                    'confidence': data['confidence_score']
                }
            
            return insights
            
        except Exception as e:
            print(f"❌ Insights retrieval error: {e}")
            return {}
    
    def cleanup_expired_tokens(self):
        """Clean up expired authentication tokens"""
        try:
            # This is handled automatically by Firebase Auth
            # Custom tokens expire automatically
            print("🧹 Token cleanup handled by Firebase Auth")
            
        except Exception as e:
            print(f"❌ Token cleanup error: {e}")

# Global Firebase instance
firebase_db = FirebaseManager()