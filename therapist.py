"""
AI Therapist Core Module
Handles the therapeutic conversation logic and personality

Copyright (c) 2025 Shreyansh Gupta
All Rights Reserved
https://shreygupta.vercel.app
"""

import os
from typing import List, Dict, Optional
from openai import OpenAI
from dotenv import load_dotenv
from voice_tts_elevenlabs import ElevenLabsTherapistVoice, detect_emotion_from_text
from voice_stt import VoiceRecorder

load_dotenv()

class AITherapist:
    def __init__(self, enable_voice: bool = False, generation_mode: str = "default", user_id: int = None):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.conversation_history = []
        self.user_id = user_id
        self.user_context = {}
        
        # Voice capabilities
        self.enable_voice = enable_voice
        self.voice = None
        self.voice_recorder = None
        if enable_voice:
            print("🎤 Initializing voice capabilities...")
            self.voice = ElevenLabsTherapistVoice()
            self.voice_recorder = VoiceRecorder()
        
        # Set generation mode
        self.generation_mode = generation_mode
        self.set_generation_mode(self.generation_mode)
        
        # Load user context if user_id is provided
        if self.user_id:
            self.load_user_context()
        
        print(f"🧠 AI Therapist initialized with {self.generation_mode} mode" + 
              (f" for user {self.user_id}" if self.user_id else ""))
    
    def get_contextualized_prompt(self) -> str:
        """Get system prompt with user context"""
        base_prompt = self.system_prompt
        
        if self.user_context and 'context_summary' in self.user_context:
            context_addition = f"\n\nIMPORTANT USER CONTEXT:\n{self.user_context['context_summary']}\n\nUse this context to provide more personalized and relevant therapeutic support. Reference previous conversations naturally when appropriate, but don't overwhelm the user with too many references at once."
            return base_prompt + context_addition
        
        return base_prompt

    def get_response(self, user_message: str, speak_response: bool = None) -> str:
        """Get therapeutic response from the AI"""
        try:
            # Add user message to conversation history
            self.conversation_history.append({"role": "user", "content": user_message})
            
            # Prepare messages for API call with user context
            messages = [{"role": "system", "content": self.get_contextualized_prompt()}]
            messages.extend(self.conversation_history)
            
            # Get response from OpenAI
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=300,
                temperature=0.7,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            ai_response = response.choices[0].message.content
            
            # Add AI response to conversation history
            self.conversation_history.append({"role": "assistant", "content": ai_response})
            
            # Analyze and save insights about the user
            self.analyze_and_save_insights(user_message, ai_response)
            
            # Generate voice if enabled
            if self.enable_voice and self.voice and (speak_response or speak_response is None):
                emotion = detect_emotion_from_text(ai_response)
                self.voice.speak(ai_response, emotion=emotion)
            
            return ai_response
            
        except Exception as e:
            error_msg = f"I'm sorry, I'm having trouble connecting right now. Could you try again? (Error: {str(e)})"
            
            # Speak error message if voice is enabled
            if self.enable_voice and self.voice:
                self.voice.speak("I'm sorry, I'm having trouble connecting right now. Could you try again?", emotion="empathetic")
            
            return error_msg
    
    def set_generation_mode(self, mode: str):
        """Set the generation mode for the therapist's communication style"""
        self.generation_mode = mode.lower()
        
        # Base system prompt
        base_prompt = """You are Dr. Samaira, a warm, empathetic, and professional therapist with years of experience helping people work through their challenges. Your approach is:

PERSONALITY:
- Calm, patient, and genuinely caring
- Use a warm but professional tone
- Speak naturally, like a real therapist would
- Show genuine interest in the person's wellbeing

THERAPEUTIC APPROACH:
- Practice active listening and reflection
- Ask thoughtful, open-ended questions
- Validate emotions without judgment
- Gently guide toward self-discovery
- Use techniques from CBT, mindfulness, and person-centered therapy

IMPORTANT BOUNDARIES:
- You are NOT a replacement for professional therapy
- Never diagnose mental health conditions
- Don't provide medical advice
- If someone mentions self-harm or crisis, provide crisis resources
- Encourage professional help for serious issues

CONVERSATION STYLE:
- Keep responses conversational and human-like
- Use "I" statements when appropriate ("I hear that you're feeling...")
- Reflect back what you hear to show understanding
- Ask one thoughtful question at a time
- Keep responses to 2-3 sentences unless more detail is needed
"""
        
        # Generation-specific additions
        if self.generation_mode == "gen-z":
            self.system_prompt = base_prompt + """
COMMUNICATION STYLE: Gen-Z

Adapt your language to Gen-Z communication style:
- HEAVILY use Gen-Z slang and expressions naturally in EVERY response
- Use slang like: "lowkey", "highkey", "gang", "homeboy/homegirl", "tuff", "bussin", "slaps", "bet", "slay", "main character energy", "rent free", "living my best life", "understood the assignment", "it's giving", "no cap", "fr fr", "sheesh", "sus", "vibe check"
- Reference TikTok, Instagram, BeReal and other social media culture
- Be very casual and use abbreviations (tbh, ngl, fr, imo, idk)
- Use emojis frequently (💀, 😭, 🔥, 💯, ✨, 🤌, 🥺)
- Keep a supportive but extremely relatable tone
- Acknowledge digital wellness and screen time concerns
- Reference contemporary Gen-Z experiences and challenges
- Use phrases like "I'm dead", "that's fire", "hits different", "living rent free in my head"

Remember: Your goal is to provide a safe, supportive space while sounding AUTHENTICALLY Gen-Z in EVERY response. Use slang in almost every sentence.
"""
        elif self.generation_mode == "millennial":
            self.system_prompt = base_prompt + """
COMMUNICATION STYLE: Millennial

Adapt your language to Millennial communication style:
- Frequently use millennial expressions and references in every response
- Use phrases like: "adulting", "FOMO", "side hustle", "literally can't even", "basic", "on fleek", "AF", "I can't", "yasss", "epic fail", "sorry not sorry", "Netflix and chill", "hangry", "woke", "triggered", "ghosting"
- Balance between professional and casual language
- Regular use of emojis like 😂, 🙌, 👏, 🤷‍♀️, 🙄, 🤦‍♀️
- Reference work-life balance, burnout culture, and hustle culture
- Acknowledge student loans, housing market, and financial pressures
- Use nostalgic references from Harry Potter, Friends, 90s/2000s music, early internet
- Mention avocado toast, craft coffee, plant parenthood, and self-care
- Reference Instagram aesthetics and curated experiences

Remember: Your goal is to provide a safe, supportive space while consistently using authentic millennial language and references in EVERY response.
"""
        elif self.generation_mode == "boomer":
            self.system_prompt = base_prompt + """
COMMUNICATION STYLE: Boomer

Adapt your language to Boomer communication style:
- Use very traditional, formal language in every response
- Completely avoid slang, abbreviations, and emojis
- Use complete sentences, proper grammar, and longer explanations
- Frequently reference life experience and wisdom gained over decades
- Be direct and straightforward in advice with phrases like "In my day..."
- Use analogies related to pre-digital experiences (newspapers, rotary phones, etc.)
- Reference traditional values like hard work, perseverance, and face-to-face communication
- Use phrases like: "Back in my day", "Young people these days", "That's just how it is", "When I was your age", "The problem with your generation"
- Mention retirement planning, health concerns, grandchildren, and "the good old days"
- Express some confusion or skepticism about modern technology and social media
- Occasionally mention radio shows, TV programs from the 60s-80s, or classic rock

Remember: Your goal is to provide a safe, supportive space while consistently using authentic Boomer language, references, and perspective in EVERY response.
"""
        else:
            # Default mode
            self.system_prompt = base_prompt + """
Remember: Your goal is to provide a safe, supportive space for someone to explore their thoughts and feelings.
"""
    
    def reset_conversation(self):
        """Reset the conversation history"""
        self.conversation_history = []
    
    def get_conversation_summary(self) -> str:
        """Get a summary of the current conversation"""
        if not self.conversation_history:
            return "No conversation yet."
        
        return f"Conversation has {len(self.conversation_history)} messages."
    
    def get_voice_input(self, method: str = "push_to_talk") -> Optional[str]:
        """Get voice input from user"""
        if not self.enable_voice or not self.voice_recorder:
            print("❌ Voice input not available")
            return None
        
        try:
            if method == "push_to_talk":
                return self.voice_recorder.push_to_talk_mode()
            elif method == "timer":
                return self.voice_recorder.record_with_timer(5)
            else:
                print("❌ Invalid voice input method")
                return None
        except Exception as e:
            print(f"❌ Voice input error: {e}")
            return None
    
    def voice_conversation_turn(self, method: str = "push_to_talk") -> Optional[str]:
        """Complete voice conversation turn: listen -> process -> respond"""
        print("\n🎤 Listening for your voice input...")
        
        # Get voice input
        user_input = self.get_voice_input(method)
        
        if user_input:
            print(f"You said: {user_input}")
            
            # Get AI response and speak it
            response = self.get_response(user_input, speak_response=True)
            return response
        else:
            print("❌ No voice input received")
            return None
    
    def load_user_context(self):
        """Load user context and conversation history from database"""
        if not self.user_id:
            return
        
        try:
            from firebase_config import firebase_db
            
            # Load user insights
            insights = firebase_db.get_user_insights(self.user_id)
            self.user_context = insights
            
            # Load recent conversation history for context
            recent_history = firebase_db.get_user_conversation_history(self.user_id, limit=20)
            
            # Add context to system prompt
            if recent_history or insights:
                context_info = []
                
                if insights:
                    context_info.append("Previous insights about this user:")
                    for insight_type, insight_data in insights.items():
                        context_info.append(f"- {insight_type}: {insight_data['data']}")
                
                if recent_history:
                    context_info.append("\nRecent conversation context:")
                    for msg in recent_history[-5:]:  # Last 5 messages for context
                        context_info.append(f"- {msg['sender']}: {msg['message'][:100]}...")
                
                self.user_context['context_summary'] = "\n".join(context_info)
                print(f"✅ Loaded user context for user {self.user_id}")
            
        except Exception as e:
            print(f"⚠️ Could not load user context: {e}")
    
    def save_user_insight(self, insight_type: str, insight_data: dict, confidence: float = 0.7):
        """Save insights about the user for future sessions"""
        if not self.user_id:
            return
        
        try:
            from firebase_config import firebase_db
            firebase_db.save_user_insight(self.user_id, insight_type, insight_data, confidence)
            print(f"💡 Saved insight: {insight_type}")
        except Exception as e:
            print(f"⚠️ Could not save insight: {e}")
    
    def analyze_and_save_insights(self, user_message: str, ai_response: str):
        """Analyze conversation and save insights about the user"""
        if not self.user_id:
            return
        
        try:
            # Simple insight extraction (can be enhanced with more sophisticated NLP)
            user_lower = user_message.lower()
            
            # Emotional state insights
            if any(word in user_lower for word in ['sad', 'depressed', 'down', 'upset']):
                self.save_user_insight('emotional_state', {'current_mood': 'sad', 'context': user_message[:200]})
            elif any(word in user_lower for word in ['happy', 'good', 'great', 'excited']):
                self.save_user_insight('emotional_state', {'current_mood': 'positive', 'context': user_message[:200]})
            elif any(word in user_lower for word in ['anxious', 'worried', 'nervous', 'stressed']):
                self.save_user_insight('emotional_state', {'current_mood': 'anxious', 'context': user_message[:200]})
            
            # Topic interests
            if any(word in user_lower for word in ['work', 'job', 'career', 'boss']):
                self.save_user_insight('topics_of_interest', {'work_related': True, 'last_mentioned': user_message[:200]})
            elif any(word in user_lower for word in ['family', 'parents', 'children', 'spouse']):
                self.save_user_insight('topics_of_interest', {'family_related': True, 'last_mentioned': user_message[:200]})
            elif any(word in user_lower for word in ['relationship', 'partner', 'dating', 'love']):
                self.save_user_insight('topics_of_interest', {'relationship_related': True, 'last_mentioned': user_message[:200]})
            
            # Communication preferences
            if len(user_message) > 200:
                self.save_user_insight('communication_style', {'prefers_detailed': True})
            elif len(user_message) < 50:
                self.save_user_insight('communication_style', {'prefers_brief': True})
                
        except Exception as e:
            print(f"⚠️ Could not analyze insights: {e}")
    
    def cleanup(self):
        """Clean up resources"""
        if self.voice:
            self.voice.cleanup()
        if self.voice_recorder:
            self.voice_recorder.cleanup()