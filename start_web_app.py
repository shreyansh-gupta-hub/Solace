#!/usr/bin/env python3
"""
AI Therapist Web App Startup Script
Starts both backend and frontend servers for Phase 4

Copyright (c) 2025 Shreyansh Gupta
All Rights Reserved
https://shreygupta.vercel.app
"""

import subprocess
import sys
import os
import time
import signal
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    # Check Python dependencies
    try:
        import fastapi
        import uvicorn
        import openai
        from voice_tts_elevenlabs import ElevenLabsTherapistVoice
        print("✅ Python dependencies installed")
    except ImportError as e:
        print(f"❌ Missing Python dependency: {e}")
        print("Run: pip install -r requirements.txt")
        return False
    
    # Check if frontend directory exists
    frontend_path = Path("frontend")
    if not frontend_path.exists():
        print("❌ Frontend directory not found")
        return False
    
    # Check if package.json exists
    package_json_path = frontend_path / "package.json"
    if not package_json_path.exists():
        print("❌ Frontend package.json not found")
        return False
    
    # Check if node_modules exists
    node_modules_path = frontend_path / "node_modules"
    if not node_modules_path.exists():
        print("📦 Installing frontend dependencies...")
        try:
            result = subprocess.run(["npm", "install"], cwd="frontend", check=True, capture_output=True, text=True)
            print("✅ Frontend dependencies installed")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install frontend dependencies: {e}")
            print("Try running: cd frontend && npm install")
            return False
    
    print("✅ All dependencies ready")
    return True

def start_backend():
    """Start the FastAPI backend server"""
    print("🚀 Starting backend server (ElevenLabs + OpenAI)...")
    return subprocess.Popen([
        sys.executable, "api_server.py"
    ])

def start_frontend():
    """Start the React frontend server"""
    print("🌐 Starting React frontend server...")
    return subprocess.Popen([
        "npm", "start"
    ], cwd="frontend")

def main():
    """Main startup function"""
    print("🧠 AI Therapist Web App - Phase 4 Complete")
    print("=" * 60)
    print("🎤 ElevenLabs Sweet Voice + OpenAI GPT + React Frontend")
    print("=" * 60)
    
    # Check dependencies
    if not check_dependencies():
        print("\n💡 Setup Instructions:")
        print("1. Install Python deps: pip install -r requirements.txt")
        print("2. Install frontend deps: cd frontend && npm install")
        sys.exit(1)
    
    # Check environment variables
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  Warning: OPENAI_API_KEY not set in .env file")
        print("   The app will not work without this!")
        print("   Add your OpenAI API key to .env file")
    
    if not os.getenv("ELEVENLABS_API_KEY"):
        print("⚠️  Info: ELEVENLABS_API_KEY not set - using system TTS fallback")
        print("   For premium sweet voice, add ElevenLabs API key to .env")
    
    backend_process = None
    frontend_process = None
    
    try:
        # Start backend
        backend_process = start_backend()
        print("⏳ Waiting for backend to initialize...")
        time.sleep(5)  # Give backend time to start
        
        # Check if backend started successfully
        if backend_process.poll() is not None:
            print("❌ Backend failed to start")
            print("   Check your .env file and API keys")
            sys.exit(1)
        
        print("✅ Backend running on http://localhost:8000")
        
        # Start frontend
        frontend_process = start_frontend()
        print("⏳ Waiting for frontend to build and start...")
        time.sleep(10)  # Give frontend time to start
        
        print("✅ Frontend should be starting on http://localhost:3000")
        print("\n" + "=" * 60)
        print("🎉 AI Therapist Web App is ready!")
        print("📱 Open your browser to: http://localhost:3000")
        print("📚 API documentation: http://localhost:8000/docs")
        print("🎤 Features: Voice chat, sweet AI voice, empathetic conversations")
        print("🛑 Press Ctrl+C to stop both servers")
        print("=" * 60)
        
        # Wait for user to stop
        try:
            while True:
                time.sleep(1)
                
                # Check if processes are still running
                if backend_process.poll() is not None:
                    print("❌ Backend process stopped unexpectedly")
                    break
                    
        except KeyboardInterrupt:
            print("\n🛑 Shutting down servers...")
    
    finally:
        # Cleanup processes
        if backend_process:
            print("🛑 Stopping backend...")
            backend_process.terminate()
            try:
                backend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                backend_process.kill()
        
        if frontend_process:
            print("🛑 Stopping frontend...")
            frontend_process.terminate()
            try:
                frontend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                frontend_process.kill()
        
        print("✅ All servers stopped successfully")

if __name__ == "__main__":
    main()