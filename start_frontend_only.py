#!/usr/bin/env python3
"""
Start only the React frontend for development
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    """Start the React frontend development server"""
    print("🌐 Starting React Frontend Development Server")
    print("=" * 50)
    
    # Check if frontend directory exists
    frontend_path = Path("frontend")
    if not frontend_path.exists():
        print("❌ Frontend directory not found")
        sys.exit(1)
    
    # Check if node_modules exists
    node_modules_path = frontend_path / "node_modules"
    if not node_modules_path.exists():
        print("📦 Installing frontend dependencies...")
        try:
            subprocess.run(["npm", "install"], cwd="frontend", check=True)
            print("✅ Frontend dependencies installed")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install frontend dependencies: {e}")
            sys.exit(1)
    
    print("🚀 Starting React development server...")
    print("📱 Frontend will be available at: http://localhost:3000")
    print("🔗 Make sure backend is running at: http://localhost:8000")
    print("🛑 Press Ctrl+C to stop")
    print("=" * 50)
    
    try:
        # Start the React development server
        subprocess.run(["npm", "start"], cwd="frontend")
    except KeyboardInterrupt:
        print("\n🛑 Frontend server stopped")

if __name__ == "__main__":
    main()