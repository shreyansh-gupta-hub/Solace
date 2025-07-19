"""
Text-to-Speech Module using ElevenLabs API
Handles voice generation with emotion control for the AI therapist
"""

import os
import tempfile
import subprocess
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

# Optional audio imports for local development
try:
    import pygame
    from elevenlabs import play
    AUDIO_AVAILABLE = True
except ImportError:
    AUDIO_AVAILABLE = False
    print("⚠️ Audio libraries not available - voice playback disabled")

load_dotenv()

class ElevenLabsTherapistVoice:
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        
        # Set up ElevenLabs API
        self.elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
        
        # Check API availability
        self.api_available = self.check_api_availability()
        
        if self.api_available:
            self.client = ElevenLabs(api_key=self.elevenlabs_api_key)
        
        # Voice settings for different emotions using ElevenLabs voices
        # These are some of the sweetest, most therapeutic voices available
        self.voice_settings = {
            "calm": {
                "voice_id": "EXAVITQu4vr4xnSDxMaL",  # Bella - Sweet, calm female voice
                "stability": 0.75,
                "similarity_boost": 0.8,
                "style": 0.2,
                "use_speaker_boost": True
            },
            "supportive": {
                "voice_id": "ThT5KcBeYPX3keUQqHPh",  # Dorothy - Warm, supportive voice
                "stability": 0.8,
                "similarity_boost": 0.85,
                "style": 0.3,
                "use_speaker_boost": True
            },
            "encouraging": {
                "voice_id": "pNInz6obpgDQGcFmaJgB",  # Adam - Encouraging but can be made sweeter
                "stability": 0.7,
                "similarity_boost": 0.9,
                "style": 0.4,
                "use_speaker_boost": True
            },
            "empathetic": {
                "voice_id": "EXAVITQu4vr4xnSDxMaL",  # Bella - Very gentle and understanding
                "stability": 0.85,
                "similarity_boost": 0.75,
                "style": 0.1,
                "use_speaker_boost": True
            }
        }
        
        print("🎤 Initializing ElevenLabs TTS...")
        if self.api_available:
            print("✅ ElevenLabs API ready!")
            self._test_voices()
        else:
            print("⚠️  ElevenLabs API not available, will use system TTS fallback")
    
    def check_api_availability(self) -> bool:
        """Check if ElevenLabs API is available"""
        try:
            if not self.elevenlabs_api_key:
                print("❌ ELEVENLABS_API_KEY not found in environment")
                return False
            return True
        except Exception as e:
            print(f"❌ API check failed: {e}")
            return False
    
    def _test_voices(self):
        """Test available voices and show sweet voice options"""
        try:
            available_voices = self.client.voices.get_all()
            print("🎭 Available sweet voices for therapy:")
            for voice in available_voices.voices:
                if voice.voice_id in [v["voice_id"] for v in self.voice_settings.values()]:
                    print(f"   • {voice.name} ({voice.voice_id}) - {voice.category}")
        except Exception as e:
            print(f"⚠️  Could not fetch voice list: {e}")
    
    def generate_speech(self, text: str, emotion: str = "calm") -> Optional[str]:
        """
        Generate speech audio from text with specified emotion using ElevenLabs
        Returns path to generated audio file
        """
        try:
            if not text.strip():
                return None
            
            if self.api_available:
                return self._generate_with_elevenlabs(text, emotion)
            else:
                return self._generate_with_system_tts(text, emotion)
                
        except Exception as e:
            print(f"❌ Error generating speech: {e}")
            return self._generate_with_system_tts(text, emotion)  # Fallback
    
    def _generate_with_elevenlabs(self, text: str, emotion: str) -> Optional[str]:
        """Generate speech using ElevenLabs API"""
        try:
            print(f"🎤 Using ElevenLabs for {emotion} speech...")
            
            # Get voice settings for the emotion
            settings = self.voice_settings.get(emotion, self.voice_settings["calm"])
            
            # Generate speech with ElevenLabs using the correct client API
            audio = self.client.text_to_speech.convert(
                voice_id=settings["voice_id"],
                text=text,
                model_id="eleven_multilingual_v2",  # High quality model
                voice_settings={
                    "stability": settings["stability"],
                    "similarity_boost": settings["similarity_boost"],
                    "style": settings["style"],
                    "use_speaker_boost": settings["use_speaker_boost"]
                }
            )
            
            # Save the audio output
            output_path = os.path.join(self.temp_dir, f"elevenlabs_{hash(text)}_{emotion}.mp3")
            
            # Write the audio bytes to file
            with open(output_path, "wb") as f:
                for chunk in audio:
                    f.write(chunk)
            
            print(f"✅ ElevenLabs audio generated: {output_path}")
            return output_path
                
        except Exception as e:
            print(f"❌ ElevenLabs API error: {e}")
            print("🔄 Falling back to system TTS...")
            return self._generate_with_system_tts(text, emotion)
    
    def _generate_with_system_tts(self, text: str, emotion: str) -> Optional[str]:
        """Fallback: Generate speech using system TTS (macOS 'say' command)"""
        try:
            print(f"🎤 Using system TTS for {emotion} speech...")
            
            output_path = os.path.join(self.temp_dir, f"system_{hash(text)}_{emotion}.aiff")
            
            # Choose voice and rate based on emotion - optimized for sweet, therapeutic tone
            voice_settings = {
                "calm": {"voice": "Allison", "rate": 175},        # Sweet, gentle voice
                "supportive": {"voice": "Samantha", "rate": 165}, # Warm, caring pace  
                "encouraging": {"voice": "Allison", "rate": 185}, # Upbeat but sweet
                "empathetic": {"voice": "Fiona", "rate": 155}     # Very gentle, understanding Scottish accent
            }
            
            settings = voice_settings.get(emotion, voice_settings["calm"])
            voice_name = settings["voice"]
            rate = settings["rate"]
            
            # Generate speech with macOS 'say' command
            cmd = f'say -v {voice_name} -r {rate} -o "{output_path}" "{text}"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0 and os.path.exists(output_path):
                print(f"✅ System TTS audio generated: {output_path}")
                return output_path
            else:
                print(f"❌ System TTS failed: {result.stderr}")
                return None
                
        except Exception as e:
            print(f"❌ System TTS error: {e}")
            return None
    
    def play_audio(self, audio_path: str) -> bool:
        """Play the generated audio file"""
        try:
            if not os.path.exists(audio_path):
                print(f"❌ Audio file not found: {audio_path}")
                return False
            
            print("🔊 Playing audio...")
            
            # Use macOS 'afplay' command for reliable audio playback
            result = subprocess.run(['afplay', audio_path], 
                                  capture_output=True, 
                                  timeout=30)
            
            if result.returncode == 0:
                print("✅ Audio playback completed")
                return True
            else:
                print(f"❌ Audio playback failed with code: {result.returncode}")
                return False
            
        except subprocess.TimeoutExpired:
            print("❌ Audio playback timeout")
            return False
        except Exception as e:
            print(f"❌ Audio playback error: {e}")
            return False
    
    def speak(self, text: str, emotion: str = "calm", play_immediately: bool = True) -> Optional[str]:
        """
        Complete text-to-speech pipeline: generate and optionally play audio
        Returns path to audio file
        """
        print(f"🎤 Generating speech with {emotion} emotion...")
        
        audio_path = self.generate_speech(text, emotion)
        
        if audio_path and play_immediately:
            self.play_audio(audio_path)
        
        return audio_path
    
    def cleanup(self):
        """Clean up temporary files"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)
            print("🧹 Voice system cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")

# Emotion detection helper (same as before)
def detect_emotion_from_text(text: str) -> str:
    """
    Simple emotion detection to choose appropriate voice tone
    """
    text_lower = text.lower()
    
    if any(word in text_lower for word in ["sorry", "understand", "difficult", "hard", "struggle"]):
        return "empathetic"
    elif any(word in text_lower for word in ["great", "wonderful", "proud", "amazing", "excellent"]):
        return "encouraging"
    elif any(word in text_lower for word in ["support", "help", "here for you", "together"]):
        return "supportive"
    else:
        return "calm"

# Alias for backward compatibility
TherapistVoice = ElevenLabsTherapistVoice