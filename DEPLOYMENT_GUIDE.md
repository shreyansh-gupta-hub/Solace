# 🚀 AI Therapist Deployment Guide

## 📋 **Pre-Deployment Checklist**

### Security (CRITICAL)
- [ ] ⚠️ **Regenerate ALL API keys** (OpenAI, ElevenLabs, Firebase)
- [ ] Update `.env` with new keys
- [ ] Test application locally with new keys
- [ ] Verify `.env` files are in `.gitignore`

### Firebase Setup
- [ ] Firebase project created and configured
- [ ] Firestore database created
- [ ] Firebase Authentication enabled
- [ ] Firestore security rules implemented
- [ ] Frontend Firebase config updated

### Application Testing
- [ ] Backend starts without errors
- [ ] Frontend builds successfully
- [ ] User registration works
- [ ] User login works
- [ ] Voice features work
- [ ] Conversations save to Firebase

## 🌐 **Deployment Options**

### Option 1: Railway (Recommended - Easiest)
### Option 2: Render (Free Tier Available)
### Option 3: Heroku (Popular)
### Option 4: Vercel + Railway (Frontend + Backend)
### Option 5: Firebase Hosting + Cloud Run
### Option 6: DigitalOcean App Platform

---

## 🚂 **Option 1: Railway (Recommended)**

### Why Railway?
- ✅ Easy Python deployment
- ✅ Automatic HTTPS
- ✅ Environment variables support
- ✅ Git-based deployment
- ✅ Free tier available

### Steps:

#### 1. Prepare for Railway
```bash
# Create railway.json
echo '{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python start_web_app.py",
    "healthcheckPath": "/api"
  }
}' > railway.json
```

#### 2. Deploy Backend
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set environment variables in Railway dashboard:
   - `OPENAI_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - etc.

#### 3. Deploy Frontend
1. Create new Railway service for frontend
2. Set build command: `cd frontend && npm run build`
3. Set start command: `cd frontend && npx serve -s build -p $PORT`

---

## 🎨 **Option 2: Render (Free Tier)**

### Why Render?
- ✅ Free tier available
- ✅ Automatic SSL
- ✅ Easy deployment
- ✅ Good for startups

### Steps:

#### 1. Create render.yaml
```yaml
services:
  - type: web
    name: ai-therapist-backend
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "python start_web_app.py"
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: ELEVENLABS_API_KEY
        sync: false
      - key: FIREBASE_PROJECT_ID
        sync: false

  - type: web
    name: ai-therapist-frontend
    env: node
    buildCommand: "cd frontend && npm install && npm run build"
    startCommand: "cd frontend && npx serve -s build -p $PORT"
    envVars:
      - key: REACT_APP_FIREBASE_API_KEY
        sync: false
```

#### 2. Deploy
1. Go to [Render.com](https://render.com)
2. Connect GitHub repository
3. Set environment variables
4. Deploy

---

## ☁️ **Option 3: Heroku**

### Steps:

#### 1. Create Procfile
```
web: python start_web_app.py
```

#### 2. Create runtime.txt
```
python-3.12.0
```

#### 3. Deploy
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-ai-therapist-app

# Set environment variables
heroku config:set OPENAI_API_KEY=your-key
heroku config:set ELEVENLABS_API_KEY=your-key
# ... set all environment variables

# Deploy
git push heroku main
```

---

## ⚡ **Option 4: Vercel + Railway (Split Deployment)**

### Frontend on Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel

# Set environment variables in Vercel dashboard
```

### Backend on Railway
- Follow Railway steps above for backend only

---

## 🔥 **Option 5: Firebase Hosting + Cloud Run**

### Frontend on Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init
firebase login
firebase init hosting

# Build and deploy
cd frontend
npm run build
firebase deploy --only hosting
```

### Backend on Cloud Run
```bash
# Create Dockerfile
# Deploy to Google Cloud Run
```

---

## 🌊 **Option 6: DigitalOcean App Platform**

### Steps:
1. Create `.do/app.yaml`
2. Connect GitHub repository
3. Set environment variables
4. Deploy

---

## 📁 **Required Deployment Files**

Let me create the necessary deployment files for you:

### 1. Railway Configuration
### 2. Render Configuration  
### 3. Heroku Configuration
### 4. Docker Configuration
### 5. Vercel Configuration

---

## 🔧 **Environment Variables for Production**

### Backend Environment Variables
```
OPENAI_API_KEY=your-production-openai-key
ELEVENLABS_API_KEY=your-production-elevenlabs-key
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
```

### Frontend Environment Variables
```
REACT_APP_FIREBASE_API_KEY=your-firebase-web-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

---

## 🎯 **Recommended Deployment Strategy**

### For Beginners: Railway
- Easiest setup
- Good free tier
- Automatic HTTPS
- Simple environment variable management

### For Production: Vercel + Railway
- Vercel for frontend (fast CDN)
- Railway for backend (Python support)
- Best performance
- Scalable

### For Enterprise: Google Cloud
- Firebase Hosting + Cloud Run
- Maximum scalability
- Advanced monitoring
- Enterprise features

---

## 🔍 **Post-Deployment Checklist**

### Testing
- [ ] Application loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Voice features work
- [ ] Database operations work
- [ ] HTTPS is enabled
- [ ] CORS is configured correctly

### Monitoring
- [ ] Set up error monitoring
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Monitor API usage
- [ ] Set up billing alerts

### Security
- [ ] Firestore security rules active
- [ ] API keys secured
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled (if needed)

---

## 🆘 **Troubleshooting Common Issues**

### Build Failures
- Check Python version compatibility
- Verify all dependencies in requirements.txt
- Check for missing environment variables

### Runtime Errors
- Check logs for specific error messages
- Verify API keys are correct
- Check Firebase configuration
- Verify network connectivity

### CORS Issues
- Update CORS settings in FastAPI
- Check frontend API base URL
- Verify domain configuration

---

## 📞 **Support Resources**

- Railway: https://docs.railway.app/
- Render: https://render.com/docs
- Heroku: https://devcenter.heroku.com/
- Vercel: https://vercel.com/docs
- Firebase: https://firebase.google.com/docs