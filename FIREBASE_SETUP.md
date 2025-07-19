# Firebase Setup Guide for AI Therapist

## Step 1: Firebase Console Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "ai-therapist" (or your preferred name)
4. Enable Google Analytics (optional)
5. Create the project

### 1.2 Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Save

### 1.3 Create Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select a location close to your users
5. Done

### 1.4 Generate Service Account Key
1. Go to Project Settings (gear icon)
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Save it as `firebase-service-account.json` in your project root

### 1.5 Get Web App Config
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Web" icon to add web app
4. Register app with nickname "ai-therapist-web"
5. Copy the Firebase config object

## Step 2: Environment Configuration

### 2.1 Backend Environment (.env)
Replace the placeholder values in your `.env` file:

```env
# Firebase Configuration (Backend)
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id-from-service-account
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id-from-service-account
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com

# Optional: Path to service account JSON file (for development)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### 2.2 Frontend Environment (frontend/.env)
Replace the placeholder values in your `frontend/.env` file:

```env
# Firebase Configuration (Frontend)
REACT_APP_FIREBASE_API_KEY=your-web-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Step 3: Firestore Security Rules

### 3.1 Update Firestore Rules
Go to Firestore Database > Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User's sessions
      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // User's insights
      match /insights/{insightId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // User's tokens
      match /tokens/{tokenId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Sessions - users can only access their own sessions
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Conversations - users can only access their own conversations
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
  }
}
```

## Step 4: Test the Setup

### 4.1 Test Backend Connection
Run your backend and check for Firebase connection messages:
```bash
python start_web_app.py
```

Look for:
- ✅ Firebase initialized with service account
- ✅ Firestore database connected

### 4.2 Test User Registration
1. Start your app
2. Try to create a new user account
3. Check Firebase Console > Authentication to see if user was created
4. Check Firestore Database to see if user document was created

## Step 5: Data Migration (Optional)

If you have existing SQLite data, you can migrate it:

### 5.1 Export SQLite Data
```python
# Run this script to export your SQLite data
import sqlite3
import json

def export_sqlite_data():
    conn = sqlite3.connect('ai_therapist.db')
    cursor = conn.cursor()
    
    # Export users
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    
    # Export sessions
    cursor.execute("SELECT * FROM sessions")
    sessions = cursor.fetchall()
    
    # Export conversations
    cursor.execute("SELECT * FROM conversations")
    conversations = cursor.fetchall()
    
    # Save to JSON files
    with open('users_export.json', 'w') as f:
        json.dump(users, f)
    
    with open('sessions_export.json', 'w') as f:
        json.dump(sessions, f)
    
    with open('conversations_export.json', 'w') as f:
        json.dump(conversations, f)
    
    conn.close()
    print("Data exported successfully!")

export_sqlite_data()
```

### 5.2 Import to Firebase
```python
# Run this script to import data to Firebase
from firebase_config import firebase_db
import json

def import_to_firebase():
    # Load exported data
    with open('users_export.json', 'r') as f:
        users = json.load(f)
    
    # Import users (you'll need to adapt this based on your data structure)
    for user in users:
        # Create user in Firebase
        # You'll need to adapt this based on your SQLite schema
        pass
    
    print("Data imported successfully!")

import_to_firebase()
```

## Step 6: Production Deployment

### 6.1 Secure Firestore Rules
Update your Firestore rules for production with more restrictive access.

### 6.2 Environment Variables
Set up environment variables in your production environment (Heroku, Vercel, etc.)

### 6.3 Firebase Hosting (Optional)
You can also deploy your frontend to Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Troubleshooting

### Common Issues:

1. **"Firebase not initialized"**
   - Check your service account key path
   - Verify environment variables are set correctly

2. **"Permission denied"**
   - Check Firestore security rules
   - Ensure user is authenticated

3. **"Project not found"**
   - Verify FIREBASE_PROJECT_ID is correct
   - Check if project exists in Firebase Console

4. **Authentication errors**
   - Verify Firebase Auth is enabled
   - Check if Email/Password provider is enabled

### Getting Help:
- Check Firebase Console for error logs
- Review Firestore usage in Firebase Console
- Check browser console for frontend errors
- Review server logs for backend errors

## Benefits of Firebase Migration

✅ **Scalability**: Handles millions of users automatically
✅ **Real-time**: Real-time updates and synchronization
✅ **Security**: Built-in authentication and security rules
✅ **Backup**: Automatic backups and disaster recovery
✅ **Analytics**: Built-in analytics and monitoring
✅ **Global**: CDN and global distribution
✅ **Offline**: Offline support for mobile apps
✅ **Cost-effective**: Pay only for what you use