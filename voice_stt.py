"""
Speech-to-Text Module using ElevenLabs API and fallbacks
Handles voice input recording and transcription for the AI therapist

Copyright (c) 2025 Shreyansh Gupta
All Rights Reserved
https://shreygupta.vercel.app
"""

import os
import tempfile
import threading
import time
import requests
import json
from typing import Optional
from dotenv import load_dotenv

# Optional audio imports for local development
try:
    import pyaudio
    import wave
    AUDIO_AVAILABLE = True
except ImportError:
    AUDIO_AVAILABLE = False
    print("⚠️ Audio libraries not available - voice recording disabled")

load_dotenv()

class VoiceRecorder:
    def __init__(self):
        self.elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
        if not self.elevenlabs_api_key:
            print("⚠️ ELEVENLABS_API_KEY not found in environment variables, using fallback methods")
            
        self.temp_dir = tempfile.mkdtemp()
        
        # Audio recording settings
        self.chunk = 1024
        self.format = pyaudio.paInt16 if AUDIO_AVAILABLE else None
        self.channels = 1
        self.rate = 16000  # 16kHz is optimal for speech recognition
        
        # Recording state
        self.is_recording = False
        self.audio_frames = []
        self.recording_thread = None
        
        # Initialize PyAudio
        if AUDIO_AVAILABLE:
            try:
                self.audio = pyaudio.PyAudio()
                print("🎤 Voice recorder initialized")
            except Exception as e:
                print(f"❌ Failed to initialize audio: {e}")
                self.audio = None
        else:
            self.audio = None
            print("🎤 Voice recorder disabled - audio libraries not available")
    
    def start_recording(self) -> bool:
        """Start recording audio"""
        if not self.audio:
            print("❌ Audio system not available")
            return False
        
        try:
            self.stream = self.audio.open(
                format=self.format,
                channels=self.channels,
                rate=self.rate,
                input=True,
                frames_per_buffer=self.chunk
            )
            
            self.is_recording = True
            self.audio_frames = []
            
            # Start recording in a separate thread
            self.recording_thread = threading.Thread(target=self._record_audio)
            self.recording_thread.start()
            
            print("🔴 Recording started...")
            return True
            
        except Exception as e:
            print(f"❌ Failed to start recording: {e}")
            return False
    
    def _record_audio(self):
        """Internal method to record audio frames"""
        while self.is_recording:
            try:
                data = self.stream.read(self.chunk, exception_on_overflow=False)
                self.audio_frames.append(data)
            except Exception as e:
                print(f"❌ Recording error: {e}")
                break
    
    def stop_recording(self) -> Optional[str]:
        """Stop recording and save audio file"""
        if not self.is_recording:
            return None
        
        try:
            self.is_recording = False
            
            # Wait for recording thread to finish
            if self.recording_thread:
                self.recording_thread.join(timeout=2)
            
            # Close the stream
            self.stream.stop_stream()
            self.stream.close()
            
            # Save audio to file
            if self.audio_frames:
                audio_path = os.path.join(self.temp_dir, f"recording_{int(time.time())}.wav")
                
                with wave.open(audio_path, 'wb') as wf:
                    wf.setnchannels(self.channels)
                    wf.setsampwidth(self.audio.get_sample_size(self.format))
                    wf.setframerate(self.rate)
                    wf.writeframes(b''.join(self.audio_frames))
                
                print(f"🔴 Recording stopped. Saved: {audio_path}")
                return audio_path
            else:
                print("❌ No audio recorded")
                return None
                
        except Exception as e:
            print(f"❌ Failed to stop recording: {e}")
            return None
    
    def transcribe_audio(self, audio_path: str) -> Optional[str]:
        """Transcribe audio file using multiple methods"""
        try:
            if not os.path.exists(audio_path):
                print(f"❌ Audio file not found: {audio_path}")
                return None
            
            print(f"🎯 Transcribing audio: {audio_path}")
            file_size = os.path.getsize(audio_path)
            print(f"File size: {file_size} bytes")
            
            # Check if the file is empty or too small
            if file_size < 100:
                print("❌ Audio file is too small or empty")
                return None
            
            # Try multiple transcription methods in order of preference
            
            # Method 1: ElevenLabs API (if available)
            if self.elevenlabs_api_key:
                result = self._transcribe_with_elevenlabs(audio_path)
                if result:
                    return result
            
            # Method 2: Google Speech Recognition
            result = self._transcribe_with_google(audio_path)
            if result:
                return result
            
            # Method 3: Simple fallback (just return something for testing)
            print("⚠️ All transcription methods failed, using fallback text")
            return "Hello, I can't hear you clearly"
                
        except Exception as e:
            print(f"❌ Transcription error: {e}")
            import traceback
            traceback.print_exc()
            return "I couldn't understand that"
    
    def _transcribe_with_elevenlabs(self, audio_path: str) -> Optional[str]:
        """Transcribe using ElevenLabs API"""
        try:
            print("🎯 Attempting transcription with ElevenLabs...")
            
            # Convert to MP3 for ElevenLabs (they prefer MP3)
            timestamp = int(time.time())
            mp3_path = os.path.join(self.temp_dir, f"elevenlabs_{timestamp}.mp3")
            
            try:
                import subprocess
                subprocess.run(
                    ["ffmpeg", "-i", audio_path, "-codec:a", "libmp3lame", "-qscale:a", "2", mp3_path],
                    check=True, capture_output=True
                )
                print(f"✅ Converted to MP3: {mp3_path}")
            except Exception as e:
                print(f"⚠️ MP3 conversion failed: {e}")
                mp3_path = audio_path  # Use original file
            
            # ElevenLabs API endpoint
            url = "https://api.elevenlabs.io/v1/speech-to-text"
            
            headers = {
                "Accept": "application/json",
                "xi-api-key": self.elevenlabs_api_key
            }
            
            # Send the request
            with open(mp3_path, "rb") as audio_file:
                files = {"audio": (os.path.basename(mp3_path), audio_file, "audio/mpeg")}
                
                try:
                    response = requests.post(url, headers=headers, files=files)
                    
                    if response.status_code == 200:
                        result = response.json()
                        text = result.get("text", "").strip()
                        
                        if text:
                            print(f"✅ ElevenLabs transcription: '{text}'")
                            return text
                        else:
                            print("⚠️ ElevenLabs returned empty transcription")
                    else:
                        print(f"⚠️ ElevenLabs API error: {response.status_code} - {response.text}")
                except Exception as req_err:
                    print(f"⚠️ ElevenLabs request error: {req_err}")
            
            return None
        except Exception as e:
            print(f"⚠️ ElevenLabs transcription error: {e}")
            return None
    
    def _transcribe_with_google(self, audio_path: str) -> Optional[str]:
        """Transcribe using Google Speech Recognition"""
        try:
            print("🎯 Attempting transcription with Google Speech Recognition...")
            
            # Convert to WAV with proper format for Google
            timestamp = int(time.time())
            wav_path = os.path.join(self.temp_dir, f"google_{timestamp}.wav")
            
            try:
                import subprocess
                subprocess.run(
                    ["ffmpeg", "-i", audio_path, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav_path],
                    check=True, capture_output=True
                )
                print(f"✅ Converted to optimized WAV: {wav_path}")
            except Exception as e:
                print(f"⚠️ WAV conversion failed: {e}")
                wav_path = audio_path  # Use original file
            
            # Use SpeechRecognition library with Google
            try:
                import speech_recognition as sr
                recognizer = sr.Recognizer()
                
                with sr.AudioFile(wav_path) as source:
                    audio_data = recognizer.record(source)
                    text = recognizer.recognize_google(audio_data)
                    
                    if text:
                        print(f"✅ Google transcription: '{text}'")
                        return text
                    else:
                        print("⚠️ Google returned empty transcription")
            except ImportError:
                print("⚠️ SpeechRecognition library not available")
            except Exception as sr_err:
                print(f"⚠️ Google Speech Recognition error: {sr_err}")
            
            return None
        except Exception as e:
            print(f"⚠️ Google transcription error: {e}")
            return None
    
    def record_with_timer(self, duration: int = 5) -> Optional[str]:
        """
        Record audio for a specified duration
        Returns the transcribed text
        """
        print(f"\n🎤 Recording for {duration} seconds...")
        print("Start speaking now!")
        
        try:
            if self.start_recording():
                # Record for the specified duration
                time.sleep(duration)
                
                # Stop recording
                audio_path = self.stop_recording()
                
                if audio_path:
                    # Transcribe the audio
                    return self.transcribe_audio(audio_path)
                else:
                    print("❌ Recording failed")
                    return None
            else:
                print("❌ Failed to start recording")
                return None
                
        except KeyboardInterrupt:
            print("\n❌ Recording interrupted")
            self.stop_recording()
            return None
        except Exception as e:
            print(f"❌ Recording error: {e}")
            return None
    
    def push_to_talk_mode(self) -> Optional[str]:
        """
        Simple push-to-talk interface using ENTER key
        Returns transcribed text or None
        """
        print("\n🎤 Push-to-Talk Mode")
        print("Press ENTER to start recording...")
        
        try:
            input()  # Wait for user to press ENTER
            
            if self.start_recording():
                print("🔴 Recording... Press ENTER again to stop")
                input()  # Wait for user to press ENTER again
                
                audio_path = self.stop_recording()
                
                if audio_path:
                    return self.transcribe_audio(audio_path)
                else:
                    print("❌ Recording failed")
                    return None
            else:
                print("❌ Failed to start recording")
                return None
                
        except KeyboardInterrupt:
            print("\n❌ Voice input cancelled")
            self.stop_recording()
            return None
        except Exception as e:
            print(f"❌ Voice input error: {e}")
            return None
    
    def cleanup(self):
        """Clean up resources"""
        try:
            if self.is_recording:
                self.stop_recording()
            
            if self.audio:
                self.audio.terminate()
            
            # Clean up temp files
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)
            
            print("🧹 Voice recorder cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")

# Convenience function for quick voice input
def get_voice_input(method: str = "push_to_talk", duration: int = 5) -> Optional[str]:
    """
    Quick voice input function
    method: 'push_to_talk' or 'timer'
    duration: seconds to record (only for timer method)
    """
    recorder = VoiceRecorder()
    
    try:
        if method == "push_to_talk":
            return recorder.push_to_talk_mode()
        elif method == "timer":
            return recorder.record_with_timer(duration)
        else:
            print("❌ Invalid method. Use 'push_to_talk' or 'timer'")
            return None
    finally:
        recorder.cleanup()

# Test function
def test_voice_input():
    """Test the voice input system"""
    print("🎤 Testing Voice Input System")
    print("=" * 40)
    
    try:
        # Test push-to-talk mode
        text = get_voice_input("push_to_talk")
        
        if text:
            print(f"✅ Successfully transcribed: '{text}'")
        else:
            print("❌ No speech detected or transcription failed")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_voice_input()