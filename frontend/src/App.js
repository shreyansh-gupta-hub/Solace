/**
 * Dr. Samaira AI Therapist - Main Application
 * 
 * Copyright (c) 2025 Shreyansh Gupta
 * All Rights Reserved
 * https://shreygupta.vercel.app
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Slide,
  Fade,
  AppBar,
  Toolbar,
  Switch,
  FormControlLabel,
  Card,
  Grid,
  Snackbar
} from '@mui/material';
import {
  Send as SendIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Psychology as PsychologyIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Favorite as FavoriteIcon,
  AutoAwesome as AutoAwesomeIcon,
  Spa as SpaIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import ChatMessage from './components/ChatMessage';
import VoiceControls from './components/VoiceControls';
import FirebaseAuthModal from './components/FirebaseAuthModal';
import UserProfile from './components/UserProfile';
import SessionActions from './components/SessionActions';
import './App.css';
import './mobile-styles.css';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000';

// Welcome Screen Component
const WelcomeScreen = ({ onStart, isLoading, onShowAuth, user, onLogout }) => (
  <Fade in timeout={1000}>
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <Card
        elevation={24}
        sx={{
          maxWidth: 500,
          p: 4,
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4
        }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            bgcolor: 'transparent',
            mx: 'auto',
            mb: 3,
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
          }}
        >
          <img 
            src="/app-icon.png" 
            alt="Dr. Samaira" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              borderRadius: '50%'
            }} 
          />
        </Avatar>
        
        <Typography variant="h4" fontWeight={700} color="#333" gutterBottom>
          {user ? `Welcome back, ${user.username}!` : 'Welcome to Dr. Samaira'}
        </Typography>
        
        <Typography variant="h6" color="text.secondary" paragraph>
          Your AI Therapy Companion
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
          I'm here to provide a safe, supportive space for you to share your thoughts and feelings. 
          Our conversations are confidential and designed to help you process emotions and find clarity.
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={4}>
            <Box textAlign="center">
              <SpaIcon sx={{ fontSize: 32, color: '#667eea', mb: 1 }} />
              <Typography variant="caption" display="block">
                Mindful Listening
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <VolumeUpIcon sx={{ fontSize: 32, color: '#667eea', mb: 1 }} />
              <Typography variant="caption" display="block">
                Voice Support
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <FavoriteIcon sx={{ fontSize: 32, color: '#667eea', mb: 1 }} />
              <Typography variant="caption" display="block">
                Emotional Care
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Box display="flex" flexDirection="column" gap={2} alignItems="center">
          <Button
            variant="contained"
            size="large"
            onClick={onStart}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
            sx={{
              py: 1.5,
              px: 4,
              borderRadius: 3,
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                boxShadow: '0 6px 25px rgba(102, 126, 234, 0.6)',
              }
            }}
          >
            {isLoading ? 'Connecting...' : 'Start Your Session'}
          </Button>
          
          {!user && (
            <Button
              variant="outlined"
              size="medium"
              onClick={onShowAuth}
              startIcon={<PersonIcon />}
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#764ba2',
                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                }
              }}
            >
              Sign In to Save Progress
            </Button>
          )}
          
          {user && (
            <Box display="flex" flexDirection="column" alignItems="center" gap={1} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Your sessions will be saved automatically
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={onLogout}
                startIcon={<LogoutIcon />}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.04)',
                  }
                }}
              >
                Switch Account
              </Button>
            </Box>
          )}
        </Box>
        
        <Box mt={4} sx={{ opacity: 0.7 }}>
          <Typography variant="caption" display="block" color="text.secondary">
            Created by{' '}
            <a 
              href="https://shreygupta.vercel.app" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#667eea', textDecoration: 'none', fontWeight: 'bold' }}
            >
              Shreyansh Gupta
            </a>
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            © {new Date().getFullYear()} All Rights Reserved
          </Typography>
        </Box>
      </Card>
    </Box>
  </Fade>
);

function App() {
  // State management
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [sessionStats, setSessionStats] = useState({ messageCount: 0, sessionTime: 0 });
  const [darkMode] = useState(false); // setDarkMode removed as it's not used yet
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [generationMode, setGenerationMode] = useState('default');
  const [interfaceMode, setInterfaceMode] = useState('chat'); // 'chat' or 'voice'
  const [actionsModalOpen, setActionsModalOpen] = useState(false);
  
  // Authentication state
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [conversationSummary, setConversationSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const sessionStartTime = useRef(null);
  
  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Initialize authentication on app load
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setAuthToken(token);
        
        // Try to refresh the token on app load
        const refreshToken = async () => {
          try {
            const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              if (refreshData.token) {
                // Update token in localStorage
                localStorage.setItem('auth_token', refreshData.token);
                setAuthToken(refreshData.token);
                console.log('🔄 Token refreshed successfully on app load');
              }
            }
          } catch (refreshError) {
            console.log('⚠️ Token refresh failed on app load:', refreshError);
          }
        };
        
        refreshToken();
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
  }, []);
  
  // Session timer
  useEffect(() => {
    if (sessionId && sessionStartTime.current) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        setSessionStats(prev => ({ ...prev, sessionTime: elapsed }));
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [sessionId]);
  
  // Initialize therapy session
  const initializeSession = async () => {
    try {
      setIsLoading(true);
      sessionStartTime.current = Date.now();
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add auth header if user is logged in
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/session/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          enable_voice: voiceEnabled,
          voice_emotion: 'supportive',
          session_name: user ? `${user.username}'s Session` : 'Web Therapy Session',
          generation_mode: generationMode
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const data = await response.json();
      setSessionId(data.session_id);
      setConnectionStatus('connected');
      setShowWelcome(false);
      
      // Add welcome message with animation delay
      setTimeout(() => {
        const welcomeMessage = {
          id: 1,
          text: data.welcome_message || "Hello! I'm Dr. Samaira, your AI therapist companion. I'm here to listen and support you through whatever you're going through. How are you feeling today?",
          sender: 'therapist',
          timestamp: new Date().toISOString(),
          emotion: 'supportive'
        };
        
        setMessages([welcomeMessage]);
        
        // Play welcome message if voice is enabled
        if (voiceEnabled && data.welcome_message) {
          setTimeout(() => synthesizeAndPlayVoice(data.welcome_message, 'supportive'), 1000);
        }
      }, 500);
      
      setNotification({
        open: true,
        message: 'Session started successfully! Dr. Samaira is ready to help.',
        severity: 'success'
      });
      
      setError(null);
    } catch (err) {
      setError('Failed to connect to Dr. Samaira. Please check your connection and try again.');
      setConnectionStatus('error');
      setNotification({
        open: true,
        message: 'Connection failed. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Synthesize and play voice - returns a Promise that resolves when audio finishes
  const synthesizeAndPlayVoice = async (text, emotion = 'supportive') => {
    if (!voiceEnabled || !sessionId) return Promise.resolve();
    
    try {
      const voiceResponse = await fetch(`${API_BASE_URL}/api/voice/synthesize?message=${encodeURIComponent(text)}&emotion=${emotion}&session_id=${sessionId}`, {
        method: 'POST'
      });
      
      if (voiceResponse.ok) {
        const voiceData = await voiceResponse.json();
        if (voiceData.audio_data) {
          console.log(`🎤 Playing AI voice (estimated duration: ${voiceData.estimated_duration}s)`);
          return playAudioFromBase64(voiceData.audio_data, voiceData.audio_format);
        }
      }
      return Promise.resolve();
    } catch (voiceError) {
      console.error('Voice synthesis error:', voiceError);
      return Promise.resolve();
    }
  };
  
  // Send text message
  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) return;
    
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setSessionStats(prev => ({ ...prev, messageCount: prev.messageCount + 1 }));
    
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    setTypingIndicator(true);
    
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add auth header if user is logged in
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/chat/${sessionId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: messageToSend,
          enable_voice: voiceEnabled,
          generation_mode: generationMode
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Simulate typing delay for better UX
      setTimeout(() => {
        const therapistMessage = {
          id: Date.now() + 1,
          text: data.response,
          sender: 'therapist',
          timestamp: data.timestamp,
          emotion: data.emotion,
          audioUrl: data.audio_url
        };
        
        setMessages(prev => [...prev, therapistMessage]);
        setTypingIndicator(false);
        
        // Generate and play voice if enabled
        if (voiceEnabled && data.response) {
          synthesizeAndPlayVoice(data.response, data.emotion).then(() => {
            // If in voice interface mode, start listening again AFTER AI finishes speaking
            if (interfaceMode === 'voice' && !isListening) {
              // Wait for voice to completely finish before starting to listen again
              setTimeout(() => {
                setIsListening(true);
              }, 1000); // Give a 1-second buffer after voice finishes
            }
          });
        }
      }, 1000 + Math.random() * 1000); // Random delay for natural feel
      
    } catch (err) {
      setError('Failed to send message. Please try again.');
      setTypingIndicator(false);
      console.error('Send message error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Play audio from base64 data - returns a Promise that resolves when audio finishes
  const playAudioFromBase64 = (audioData, format) => {
    return new Promise((resolve, reject) => {
      try {
        const audioBlob = new Blob([
          Uint8Array.from(atob(audioData), c => c.charCodeAt(0))
        ], { type: `audio/${format}` });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(); // Resolve when audio finishes playing
        };
        
        audio.onerror = (error) => {
          console.error('Error playing audio:', error);
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };
        
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
          URL.revokeObjectURL(audioUrl);
          reject(error);
        });
      } catch (error) {
        console.error('Error processing audio:', error);
        reject(error);
      }
    });
  };
  
  // Handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };
  
  // Reset conversation
  const resetConversation = async () => {
    if (!sessionId) return;
    
    try {
      const headers = {};
      
      // Add auth header if user is logged in
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      await fetch(`${API_BASE_URL}/api/session/${sessionId}`, {
        method: 'DELETE',
        headers,
      });
    } catch (err) {
      console.error('Error ending session:', err);
    }
    
    setMessages([]);
    setSessionId(null);
    setSessionStats({ messageCount: 0, sessionTime: 0 });
    setShowWelcome(true);
    setConnectionStatus('disconnected');
    
    setNotification({
      open: true,
      message: 'Session ended. You can start a new session anytime.',
      severity: 'info'
    });
  };
  
  // Toggle voice mode
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    setNotification({
      open: true,
      message: `Voice ${!voiceEnabled ? 'enabled' : 'disabled'}`,
      severity: 'info'
    });
  };
  
  // Change generation mode
  const changeGenerationMode = async (mode) => {
    if (!sessionId || mode === generationMode) return;
    
    try {
      setIsLoading(true);
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add auth header if user is logged in
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/mode`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          generation_mode: mode
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to change generation mode');
      }
      
      setGenerationMode(mode);
      
      setNotification({
        open: true,
        message: `Switched to ${mode.charAt(0).toUpperCase() + mode.slice(1)} mode`,
        severity: 'success'
      });
      
      // Add system message about mode change
      const modeChangeMessage = {
        id: Date.now(),
        text: `Dr. Samaira is now speaking in ${mode === 'gen-z' ? 'Gen-Z' : mode === 'millennial' ? 'Millennial' : mode === 'boomer' ? 'Boomer' : 'Default'} mode.`,
        sender: 'system',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, modeChangeMessage]);
      
    } catch (err) {
      setError('Failed to change generation mode. Please try again.');
      console.error('Change generation mode error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle interface mode between chat and voice
  const toggleInterfaceMode = () => {
    const newMode = interfaceMode === 'chat' ? 'voice' : 'chat';
    setInterfaceMode(newMode);
    setNotification({
      open: true,
      message: `Switched to ${newMode} interface`,
      severity: 'info'
    });
  };
  
  // Authentication handlers
  const handleAuthSuccess = (userData, token) => {
    setUser(userData);
    setAuthToken(token);
    setNotification({
      open: true,
      message: `Welcome, ${userData.username}!`,
      severity: 'success'
    });
  };
  
  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    // Reset session if active
    if (sessionId) {
      resetConversation();
    }
    
    setNotification({
      open: true,
      message: 'Logged out successfully',
      severity: 'info'
    });
  };
  
  const openAuthModal = () => {
    setAuthModalOpen(true);
  };
  
  const openProfileModal = () => {
    setProfileModalOpen(true);
  };

  // Fetch conversation summary
  const fetchConversationSummary = async () => {
    if (!authToken || !user) {
      setError('Please log in to view conversation summary');
      return;
    }

    setSummaryLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/summary`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const summaryData = await response.json();
        setConversationSummary(summaryData);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to fetch conversation summary');
      }
    } catch (error) {
      console.error('Error fetching conversation summary:', error);
      setError('Failed to load conversation summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Fetch summary when settings open and user is logged in
  useEffect(() => {
    if (settingsOpen && authToken && user && !conversationSummary) {
      fetchConversationSummary();
    }
  }, [settingsOpen, authToken, user]);
  
  // Handle voice message from VoiceControls
  const handleVoiceMessage = (transcription) => {
    if (transcription && transcription.trim()) {
      const userMessage = {
        id: Date.now(),
        text: transcription,
        sender: 'user',
        timestamp: new Date().toISOString(),
        isVoice: true
      };
      
      setMessages(prev => [...prev, userMessage]);
      setSessionStats(prev => ({ ...prev, messageCount: prev.messageCount + 1 }));
      sendVoiceMessage(transcription);
    }
  };
  
  // Send voice message to backend
  const sendVoiceMessage = async (message) => {
    if (!sessionId || isLoading) return;
    
    setIsLoading(true);
    setTypingIndicator(true);
    
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add auth header if user is logged in
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/chat/${sessionId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: message,
          enable_voice: voiceEnabled,
          generation_mode: generationMode
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send voice message');
      }
      
      const data = await response.json();
      
      setTimeout(() => {
        const therapistMessage = {
          id: Date.now() + 1,
          text: data.response,
          sender: 'therapist',
          timestamp: data.timestamp,
          emotion: data.emotion
        };
        
        setMessages(prev => [...prev, therapistMessage]);
        setTypingIndicator(false);
        
        if (voiceEnabled && data.response) {
          synthesizeAndPlayVoice(data.response, data.emotion).then(() => {
            // Voice finished playing, can now listen again if in voice mode
            console.log('AI voice finished speaking');
          });
        }
      }, 800);
      
    } catch (err) {
      setError('Failed to send voice message. Please try again.');
      setTypingIndicator(false);
      console.error('Voice message error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format session time
  const formatSessionTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  if (showWelcome) {
    return (
      <React.Fragment>
        <WelcomeScreen 
          onStart={initializeSession} 
          isLoading={isLoading} 
          onShowAuth={openAuthModal}
          user={user}
          onLogout={handleLogout}
        />
        
        {/* Authentication Modal - Available on welcome screen */}
        <FirebaseAuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </React.Fragment>
    );
  }
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: darkMode 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Modern App Bar */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Toolbar className="mobile-toolbar">
          <Avatar sx={{ bgcolor: 'transparent', mr: 2 }} className="mobile-avatar">
            <img 
              src="/app-icon.png" 
              alt="Dr. Samaira" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                borderRadius: '50%'
              }} 
            />
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Box display="flex" alignItems="center">
              <Typography variant="h6" fontWeight={600} color="white" className="mobile-title">
                Dr. Samaira
              </Typography>
              <Chip
                label="Made with ❤️ by Shreyansh"
                size="small"
                component="a"
                href="https://shreygupta.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                clickable
                className="mobile-hidden"
                sx={{ 
                  ml: 2, 
                  background: 'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)',
                  color: '#333',
                  fontWeight: 500,
                  '&:hover': {
                    transform: 'scale(1.05)'
                  },
                  transition: 'transform 0.2s ease'
                }}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip 
                label={connectionStatus} 
                color={connectionStatus === 'connected' ? 'success' : 'error'}
                size="small"
                variant="outlined"
                className="mobile-chip"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              />
              {sessionStats.sessionTime > 0 && (
                <Chip 
                  label={`${formatSessionTime(sessionStats.sessionTime)}`}
                  size="small"
                  variant="outlined"
                  className="mobile-chip"
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                />
              )}
            </Box>
          </Box>
          
          <Box display="flex" gap={0.5} alignItems="center">
            {/* Authentication Section */}
            {user ? (
              <Box display="flex" alignItems="center" gap={0.5} mr={1}>
                <Tooltip title="View Profile">
                  <IconButton onClick={openProfileModal} sx={{ color: 'white' }}>
                    <Avatar 
                      sx={{ 
                        width: 28, 
                        height: 28, 
                        bgcolor: 'rgba(255,255,255,0.2)',
                        fontSize: '0.75rem'
                      }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Typography variant="body2" className="mobile-hidden" sx={{ color: 'rgba(255,255,255,0.9)', mr: 1 }}>
                  {user.username}
                </Typography>
              </Box>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={openAuthModal}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  mr: 1,
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1,
                  minWidth: 'unset',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Sign In
              </Button>
            )}
            
            <Tooltip title="Toggle Voice">
              <IconButton onClick={toggleVoice} sx={{ color: 'white', padding: { xs: '4px', sm: '8px' } }}>
                {voiceEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title={`Switch to ${interfaceMode === 'chat' ? 'Voice' : 'Chat'} Interface`}>
              <IconButton onClick={toggleInterfaceMode} sx={{ color: 'white', padding: { xs: '4px', sm: '8px' } }}>
                {interfaceMode === 'chat' ? <RecordVoiceOverIcon fontSize="small" /> : <ChatIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Toggle Fullscreen" className="mobile-hidden">
              <IconButton onClick={toggleFullscreen} sx={{ color: 'white', padding: { xs: '4px', sm: '8px' } }}>
                {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Get Recommended Actions">
              <IconButton 
                onClick={() => setActionsModalOpen(true)} 
                disabled={!sessionId}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  padding: { xs: '4px', sm: '8px' },
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                  },
                  ml: 0.5
                }}
              >
                <AutoAwesomeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Settings">
              <IconButton onClick={() => setSettingsOpen(true)} sx={{ color: 'white' }}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="End Session">
              <IconButton onClick={resetConversation} sx={{ color: 'white' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ py: 3, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        {/* Error Alert */}
        {error && (
          <Slide direction="down" in={!!error}>
            <Alert 
              severity="error" 
              sx={{ mb: 2 }} 
              onClose={() => setError(null)}
              variant="filled"
            >
              {error}
            </Alert>
          </Slide>
        )}
        
        {/* Chat Messages Container */}
        <Paper 
          elevation={8}
          sx={{ 
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            background: darkMode 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
          {/* Messages Area */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                voiceEnabled={voiceEnabled}
                darkMode={darkMode}
              />
            ))}
            
            {/* Typing Indicator */}
            {typingIndicator && (
              <Fade in>
                <Box display="flex" alignItems="center" gap={2} p={2}>
                  <Avatar sx={{ bgcolor: 'transparent', width: 32, height: 32 }}>
                    <img 
                      src="/app-icon.png" 
                      alt="Dr. Samaira" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        borderRadius: '50%'
                      }} 
                    />
                  </Avatar>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      backgroundColor: '#f5f5f5',
                      borderRadius: '18px 18px 18px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Dr. Samaira is typing
                    </Typography>
                    <Box className="typing-dots">
                      <CircularProgress size={16} />
                    </Box>
                  </Paper>
                </Box>
              </Fade>
            )}
            
            {messages.length > 0 && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  my: 3 
                }}
              >
                <Button
                  variant="contained"
                  onClick={() => setActionsModalOpen(true)}
                  startIcon={<AutoAwesomeIcon />}
                  sx={{ 
                    borderRadius: 20,
                    px: 3,
                    py: 1,
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      boxShadow: '0 6px 25px rgba(102, 126, 234, 0.6)',
                    }
                  }}
                >
                  Get Personalized Actions
                </Button>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>
          
          {/* Input Area - Chat Mode */}
          {interfaceMode === 'chat' && (
            <Box sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <Box display="flex" gap={2} alignItems="flex-end">
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Share what's on your mind..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading || !sessionId}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
                      }
                    }
                  }}
                />
                
                <Button
                  variant="contained"
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading || !sessionId}
                  endIcon={<SendIcon />}
                  sx={{
                    py: 1.5,
                    px: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      boxShadow: '0 6px 25px rgba(102, 126, 234, 0.6)',
                    },
                    '&:disabled': {
                      background: 'rgba(0,0,0,0.12)',
                      boxShadow: 'none'
                    }
                  }}
                >
                  Send
                </Button>
              </Box>
              
              {/* Generation Mode Pills */}
              <Box display="flex" justifyContent="center" mt={2} gap={1}>
                <Chip
                  label="Default"
                  variant={generationMode === 'default' ? 'filled' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={() => changeGenerationMode('default')}
                  sx={{ opacity: generationMode === 'default' ? 1 : 0.7 }}
                />
                <Chip
                  label="Gen-Z"
                  variant={generationMode === 'gen-z' ? 'filled' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={() => changeGenerationMode('gen-z')}
                  sx={{ opacity: generationMode === 'gen-z' ? 1 : 0.7 }}
                />
                <Chip
                  label="Millennial"
                  variant={generationMode === 'millennial' ? 'filled' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={() => changeGenerationMode('millennial')}
                  sx={{ opacity: generationMode === 'millennial' ? 1 : 0.7 }}
                />
                <Chip
                  label="Boomer"
                  variant={generationMode === 'boomer' ? 'filled' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={() => changeGenerationMode('boomer')}
                  sx={{ opacity: generationMode === 'boomer' ? 1 : 0.7 }}
                />
              </Box>
            </Box>
          )}
          
          {/* Voice Interface Mode */}
          {interfaceMode === 'voice' && (
            <Box sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.1)', textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Voice Conversation Mode
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {isListening 
                  ? "🎤 Listening... Speak to Dr. Samaira" 
                  : "Tap the microphone button below to speak with Dr. Samaira"}
              </Typography>
              
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                💡 Auto-listening is now disabled by default. The AI will wait for you to finish speaking before responding.
              </Typography>
              
              <Box display="flex" justifyContent="center" mb={2}>
                <Button
                  variant="contained"
                  color={isListening ? "secondary" : "primary"}
                  onClick={() => setIsListening(!isListening)}
                  disabled={isLoading || !sessionId}
                  startIcon={isListening ? <VolumeOffIcon /> : <VolumeUpIcon />}
                  sx={{
                    py: 1.5,
                    px: 3,
                    borderRadius: 3,
                    background: isListening 
                      ? 'linear-gradient(45deg, #f44336 30%, #ff5722 90%)'
                      : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      boxShadow: '0 6px 25px rgba(102, 126, 234, 0.6)',
                    },
                    animation: isListening ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  {isListening ? "Stop Listening" : "Start Voice Input"}
                </Button>
              </Box>
              
              <Chip
                label="Auto-listening mode"
                color="primary"
                variant="outlined"
                size="small"
                sx={{ mt: 1, mb: 2 }}
              />
              
              {/* Generation Mode Pills */}
              <Box display="flex" justifyContent="center" mt={3} gap={1}>
                <Chip
                  label="Default"
                  variant={generationMode === 'default' ? 'filled' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={() => changeGenerationMode('default')}
                  sx={{ opacity: generationMode === 'default' ? 1 : 0.7 }}
                />
                <Chip
                  label="Gen-Z"
                  variant={generationMode === 'gen-z' ? 'filled' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={() => changeGenerationMode('gen-z')}
                  sx={{ opacity: generationMode === 'gen-z' ? 1 : 0.7 }}
                />
                <Chip
                  label="Millennial"
                  variant={generationMode === 'millennial' ? 'filled' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={() => changeGenerationMode('millennial')}
                  sx={{ opacity: generationMode === 'millennial' ? 1 : 0.7 }}
                />
                <Chip
                  label="Boomer"
                  variant={generationMode === 'boomer' ? 'filled' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={() => changeGenerationMode('boomer')}
                  sx={{ opacity: generationMode === 'boomer' ? 1 : 0.7 }}
                />
              </Box>
            </Box>
          )}
        </Paper>
        
        {/* Voice Controls - Only show in chat mode */}
        {voiceEnabled && interfaceMode === 'chat' && (
          <VoiceControls 
            isListening={isListening}
            onToggleListening={() => setIsListening(!isListening)}
            sessionId={sessionId}
            onVoiceMessage={handleVoiceMessage}
            darkMode={darkMode}
          />
        )}
        
        {/* Enhanced Settings Dialog */}
        <Dialog 
          open={settingsOpen} 
          onClose={() => setSettingsOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)'
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <SettingsIcon color="primary" />
              <Typography variant="h6">Session Settings</Typography>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            <Grid container spacing={3}>
              {/* Conversation Summary Section - Only for logged in users */}
              {user && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <PsychologyIcon color="primary" />
                      <Typography variant="subtitle1">
                        Conversation Summary
                      </Typography>
                      <Button 
                        size="small" 
                        onClick={fetchConversationSummary}
                        disabled={summaryLoading}
                        startIcon={summaryLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
                      >
                        {summaryLoading ? 'Loading...' : 'Refresh'}
                      </Button>
                    </Box>
                    
                    {conversationSummary ? (
                      <Box>
                        <Box display="flex" gap={2} mb={2}>
                          <Chip 
                            label={`${conversationSummary.message_count} Messages`} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                          <Chip 
                            label={`${conversationSummary.session_count} Sessions`} 
                            size="small" 
                            color="secondary" 
                            variant="outlined" 
                          />
                        </Box>
                        
                        <Typography variant="body2" paragraph sx={{ mb: 2 }}>
                          {conversationSummary.summary}
                        </Typography>
                        
                        {conversationSummary.key_topics && conversationSummary.key_topics.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                              Key Topics Discussed:
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              {conversationSummary.key_topics.map((topic, index) => (
                                <Chip 
                                  key={index}
                                  label={topic} 
                                  size="small" 
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    ) : summaryLoading ? (
                      <Box display="flex" alignItems="center" gap={2}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">
                          Generating your conversation summary...
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Your conversation summary will appear here after you start chatting with Dr. Samaira.
                      </Typography>
                    )}
                  </Card>
                </Grid>
              )}

              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Voice Settings
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={voiceEnabled}
                        onChange={toggleVoice}
                        color="primary"
                      />
                    }
                    label="Enable Voice Responses"
                  />
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Interface Mode
                    </Typography>
                    <Button
                      variant={interfaceMode === 'chat' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setInterfaceMode('chat')}
                      sx={{ mr: 1, mt: 1 }}
                    >
                      Chat Interface
                    </Button>
                    <Button
                      variant={interfaceMode === 'voice' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setInterfaceMode('voice')}
                      sx={{ mt: 1 }}
                    >
                      Voice Interface
                    </Button>
                  </Box>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Communication Style
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Choose how Dr. Samaira communicates with you:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    <Button
                      variant={generationMode === 'default' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => changeGenerationMode('default')}
                    >
                      Default
                    </Button>
                    <Button
                      variant={generationMode === 'gen-z' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => changeGenerationMode('gen-z')}
                    >
                      Gen-Z
                    </Button>
                    <Button
                      variant={generationMode === 'millennial' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => changeGenerationMode('millennial')}
                    >
                      Millennial
                    </Button>
                    <Button
                      variant={generationMode === 'boomer' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => changeGenerationMode('boomer')}
                    >
                      Boomer
                    </Button>
                  </Box>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Session Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Session ID: {sessionId || 'Not connected'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Messages: {sessionStats.messageCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {formatSessionTime(sessionStats.sessionTime)}
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    About Dr. Samaira
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dr. Samaira is an AI therapist designed to provide supportive, 
                    empathetic conversations. This is a safe space for you to express 
                    your thoughts and feelings. Dr. Samaira can adapt her communication style
                    to match different generational preferences.
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Developer Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Developed by Shreyansh Gupta
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    component="a" 
                    href="https://shreygupta.vercel.app" 
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<AutoAwesomeIcon />}
                  >
                    Visit Portfolio
                  </Button>
                  <Typography variant="caption" display="block" sx={{ mt: 2, opacity: 0.7 }}>
                    © {new Date().getFullYear()} All Rights Reserved
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setSettingsOpen(false)} variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setNotification({ ...notification, open: false })} 
            severity={notification.severity}
            variant="filled"
            sx={{ borderRadius: 2 }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
        
        {/* Copyright Footer */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            p: 1,
            textAlign: 'center',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(5px)',
            color: 'white',
            fontSize: '0.75rem',
            zIndex: 10
          }}
        >
          <Typography variant="caption" component="div">
            © {new Date().getFullYear()} Dr. Samaira AI Therapist | Developed by{' '}
            <a 
              href="https://shreygupta.vercel.app" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 'bold' }}
            >
              Shreyansh Gupta
            </a>
            {' '} | All Rights Reserved
          </Typography>
        </Box>
      </Container>
      
      {/* Authentication Modal */}
      <FirebaseAuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      
      {/* User Profile Modal */}
      <UserProfile
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
      
      {/* Session Actions Modal */}
      <SessionActions
        open={actionsModalOpen}
        onClose={() => setActionsModalOpen(false)}
        sessionId={sessionId}
        authToken={authToken}
      />
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;