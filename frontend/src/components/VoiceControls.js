/**
 * Dr. Samaira AI Therapist - Voice Controls Component
 * 
 * Copyright (c) 2025 Shreyansh Gupta
 * All Rights Reserved
 * https://shreygupta.vercel.app
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Fab,
  Typography,
  Paper,
  LinearProgress,
  Tooltip,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Chip,
  IconButton,
  Slide,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Close as CloseIcon,
  VolumeUp as VolumeUpIcon
} from '@mui/icons-material';

// Voice Wave Animation Component
const VoiceWave = ({ isActive }) => (
  <Box className="voice-wave" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, height: 20 }}>
    {[...Array(5)].map((_, i) => (
      <Box
        key={i}
        className="voice-wave-bar"
        sx={{
          width: 3,
          height: isActive ? '16px' : '4px',
          background: 'linear-gradient(to top, #667eea, #764ba2)',
          borderRadius: 2,
          transition: 'height 0.3s ease',
          animation: isActive ? `voiceWave 1s infinite ease-in-out ${i * 0.1}s` : 'none',
          '@keyframes voiceWave': {
            '0%, 100%': { height: '4px' },
            '50%': { height: '16px' }
          }
        }}
      />
    ))}
  </Box>
);

const VoiceControls = ({ isListening, onToggleListening, sessionId, onVoiceMessage, darkMode }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceError, setVoiceError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [recordingQuality, setRecordingQuality] = useState('good');
  const [autoMode, setAutoMode] = useState(false); // Auto-listening mode disabled by default
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const autoListenTimeoutRef = useRef(null);
  
  // Initialize media recorder and audio analysis
  useEffect(() => {
    if (sessionId) {
      initializeMediaRecorder();
    }
    
    return () => {
      cleanup();
    };
  }, [sessionId]);
  
  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(err => console.error('Error closing audio context:', err));
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (autoListenTimeoutRef.current) {
      clearTimeout(autoListenTimeoutRef.current);
    }
  };
  
  const initializeMediaRecorder = async () => {
    try {
      console.log('Initializing media recorder...');
      
      // Request microphone access with optimal settings for speech recognition
      const constraints = { 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        } 
      };
      
      console.log('Requesting microphone with constraints:', constraints);
      
      // First try with ideal constraints
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        console.log('Microphone access granted with ideal settings');
      } catch (constraintError) {
        console.warn('Could not get microphone with ideal settings, trying with default settings:', constraintError);
        
        // Fallback to basic audio constraints
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        console.log('Microphone access granted with default settings');
      }
      
      // Setup audio analysis for visualization
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
        console.log('Audio analysis initialized');
      } catch (audioContextError) {
        console.warn('Could not initialize audio analysis:', audioContextError);
      }
      
      setVoiceError(null);
      
      // Test if we can actually create a MediaRecorder
      try {
        const testRecorder = new MediaRecorder(streamRef.current);
        console.log('MediaRecorder test successful with mime type:', testRecorder.mimeType);
        testRecorder.stop();
      } catch (recorderError) {
        console.error('MediaRecorder test failed:', recorderError);
        setVoiceError('Your browser may not fully support audio recording. Results may vary.');
      }
    } catch (err) {
      console.error('Error initializing media recorder:', err);
      setVoiceError(`Microphone access denied: ${err.message}. Please enable microphone permissions.`);
    }
  };
  
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateLevel = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const normalizedLevel = Math.min(average / 128, 1);
      
      setAudioLevel(normalizedLevel);
      
      // Determine recording quality based on audio level
      if (normalizedLevel > 0.6) {
        setRecordingQuality('excellent');
      } else if (normalizedLevel > 0.3) {
        setRecordingQuality('good');
      } else if (normalizedLevel > 0.1) {
        setRecordingQuality('fair');
      } else {
        setRecordingQuality('poor');
      }
      
      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };
  
  const startRecording = async () => {
    if (!streamRef.current) {
      setVoiceError('Microphone not available');
      return false;
    }
    
    try {
      // Reset audio chunks
      audioChunksRef.current = [];
      
      // Find the best supported audio format
      let mimeType = '';
      const formats = [
        'audio/wav',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp3',
        'audio/ogg;codecs=opus',
        'audio/ogg'
      ];
      
      for (const format of formats) {
        if (MediaRecorder.isTypeSupported(format)) {
          mimeType = format;
          console.log(`Using audio format: ${mimeType}`);
          break;
        }
      }
      
      // Create a new MediaRecorder instance
      const options = mimeType ? { mimeType } : {};
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
      
      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`Received audio chunk: ${event.data.size} bytes`);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        processRecording();
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setVoiceError(`Recording error: ${event.error}`);
      };
      
      // Start recording - request data more frequently for better quality
      mediaRecorderRef.current.start(250); // Collect data every 250ms
      console.log('Recording started with format:', mediaRecorderRef.current.mimeType);
      
      // Start audio level monitoring
      monitorAudioLevel();
      
      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          // Request additional data every second
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.requestData();
          }
          
          if (prev >= 60) { // Max 60 seconds
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      setVoiceError(`Recording failed: ${error.message}`);
      return false;
    }
  };
  
  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        console.log('Recording stopped');
      }
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      return true;
    } catch (error) {
      console.error('Error stopping recording:', error);
      setVoiceError(`Failed to stop recording: ${error.message}`);
      return false;
    }
  };
  
  const processRecording = async () => {
    if (!audioChunksRef.current || audioChunksRef.current.length === 0) {
      setVoiceError('No audio recorded. Please try again.');
      setIsProcessing(false);
      
      // If in auto mode, restart listening after a short delay
      if (autoMode) {
        scheduleAutoListening();
      }
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log(`Processing ${audioChunksRef.current.length} audio chunks`);
      
      // Create audio blob - try different formats for better compatibility
      let audioBlob;
      let fileName;
      
      // Try to use WAV format if supported
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        fileName = 'recording.wav';
      } 
      // Try MP3 format
      else if (MediaRecorder.isTypeSupported('audio/mp3')) {
        audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        fileName = 'recording.mp3';
      }
      // Fallback to WebM
      else {
        audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        fileName = 'recording.webm';
      }
      
      console.log(`Audio blob size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
      
      if (audioBlob.size < 100) {
        throw new Error('Audio recording too short or empty');
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('audio_file', audioBlob, fileName);
      formData.append('session_id', sessionId || 'default');
      
      // Get API base URL
      const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000';
      
      // Send to transcription API
      console.log(`Sending audio to transcription API as ${fileName}...`);
      const response = await fetch(`${API_BASE_URL}/api/voice/transcribe`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Transcription response:', data);
      
      if (data.transcription && data.transcription.trim()) {
        if (onVoiceMessage) {
          onVoiceMessage(data.transcription);
        }
        setVoiceError(null);
      } else {
        // Even if no speech is detected, we'll use a fallback message
        // This ensures the conversation continues
        const fallbackMessage = "I'm listening but couldn't hear you clearly. Could you please repeat that?";
        if (onVoiceMessage) {
          onVoiceMessage(fallbackMessage);
        }
        setVoiceError('No speech detected. Using fallback message to continue conversation.');
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      setVoiceError(`Failed to process voice: ${err.message}`);
      
      // Use fallback message to keep conversation going even if there's an error
      const fallbackMessage = "I'm having trouble hearing you. Could you please try again?";
      if (onVoiceMessage) {
        onVoiceMessage(fallbackMessage);
      }
    } finally {
      setIsProcessing(false);
      setRecordingTime(0);
      setAudioLevel(0);
      audioChunksRef.current = [];
      
      // If in auto mode, restart listening after AI responds
      if (autoMode) {
        scheduleAutoListening();
      }
    }
  };
  
  // Schedule auto-listening after AI response - only if auto mode is enabled
  const scheduleAutoListening = () => {
    if (!autoMode) return; // Don't schedule if auto mode is disabled
    
    if (autoListenTimeoutRef.current) {
      clearTimeout(autoListenTimeoutRef.current);
    }
    
    // Wait for 3 seconds after AI response before starting to listen again
    // This gives more time for the AI voice to finish speaking
    autoListenTimeoutRef.current = setTimeout(() => {
      if (autoMode && !isRecording && !isProcessing) {
        console.log('Auto-listening mode: Starting recording automatically after AI finished speaking');
        handleVoiceRecord();
      }
    }, 3000); // Increased delay to 3 seconds
  };
  
  const handleVoiceRecord = async () => {
    if (!sessionId) {
      setVoiceError('No active session');
      return;
    }
    
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      stopRecording();
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingTime(0);
      setVoiceError(null);
      const started = await startRecording();
      
      if (!started) {
        setIsRecording(false);
      }
    }
    
    if (onToggleListening) {
      onToggleListening();
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getQualityColor = (quality) => {
    const colors = {
      excellent: '#4caf50',
      good: '#8bc34a',
      fair: '#ff9800',
      poor: '#f44336'
    };
    return colors[quality] || colors.fair;
  };
  
  if (!showControls) {
    return (
      <Fab
        color="primary"
        onClick={() => setShowControls(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
          '&:hover': {
            boxShadow: '0 12px 40px rgba(102, 126, 234, 0.6)',
          }
        }}
      >
        <MicIcon />
      </Fab>
    );
  }
  
  return (
    <Slide direction="up" in={showControls} timeout={300}>
      <Paper 
        elevation={12}
        className="mobile-voice-controls"
        sx={{ 
          position: 'fixed',
          bottom: 24,
          right: 24,
          borderRadius: 4,
          background: darkMode 
            ? 'rgba(30, 30, 30, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          minWidth: { xs: 240, sm: 280 },
          maxWidth: { xs: 280, sm: 320 },
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          zIndex: 1200
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <VolumeUpIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>
                Voice Controls
              </Typography>
            </Box>
            
            <Box display="flex" gap={0.5}>
              <Tooltip title={autoMode ? "Auto-listening ON" : "Auto-listening OFF"}>
                <IconButton 
                  size="small" 
                  onClick={() => setAutoMode(!autoMode)}
                  color={autoMode ? "primary" : "default"}
                >
                  <VolumeUpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Minimize">
                <IconButton size="small" onClick={() => setShowControls(false)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Recording Status */}
          {isRecording && (
            <Fade in>
              <Card 
                variant="outlined" 
                sx={{ 
                  mb: 2, 
                  background: 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)',
                  borderColor: '#f44336'
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: '#f44336',
                        animation: 'pulse 1s infinite'
                      }} 
                    />
                    <Typography variant="body2" fontWeight={600} color="#f44336">
                      Recording {formatTime(recordingTime)}
                    </Typography>
                    <Chip 
                      label={recordingQuality}
                      size="small"
                      sx={{ 
                        bgcolor: getQualityColor(recordingQuality),
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20
                      }}
                    />
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={(recordingTime / 60) * 100} 
                    sx={{ 
                      mb: 1,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(244, 67, 54, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #f44336, #ff5722)',
                        borderRadius: 3
                      }
                    }}
                  />
                  
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" color="text.secondary">
                      Audio Level:
                    </Typography>
                    <VoiceWave isActive={audioLevel > 0.1} />
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(audioLevel * 100)}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          )}
          
          {/* Processing Status */}
          {isProcessing && (
            <Fade in>
              <Card variant="outlined" sx={{ mb: 2, bgcolor: 'rgba(102, 126, 234, 0.05)' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="primary" fontWeight={600}>
                      Processing your voice...
                    </Typography>
                  </Box>
                  <LinearProgress 
                    sx={{ 
                      mt: 1,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                        borderRadius: 2
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Fade>
          )}
          
          {/* Voice Recording Button */}
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Tooltip title={
              isProcessing ? "Processing..." :
              isRecording ? "Stop Recording" : 
              "Start Voice Recording"
            }>
              <Fab
                color={isRecording ? "secondary" : "primary"}
                onClick={handleVoiceRecord}
                disabled={isProcessing || !streamRef.current}
                size="large"
                sx={{
                  width: 72,
                  height: 72,
                  background: isRecording 
                    ? 'linear-gradient(45deg, #f44336 30%, #ff5722 90%)'
                    : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  boxShadow: isRecording 
                    ? '0 8px 32px rgba(244, 67, 54, 0.4)'
                    : '0 8px 32px rgba(102, 126, 234, 0.4)',
                  animation: isRecording ? 'pulse 2s infinite' : 'none',
                  '&:hover': {
                    boxShadow: isRecording 
                      ? '0 12px 40px rgba(244, 67, 54, 0.6)'
                      : '0 12px 40px rgba(102, 126, 234, 0.6)',
                    transform: 'scale(1.05)'
                  },
                  '&:disabled': {
                    background: 'rgba(0,0,0,0.12)',
                    boxShadow: 'none'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {isProcessing ? (
                  <CircularProgress size={32} sx={{ color: 'white' }} />
                ) : isRecording ? (
                  <StopIcon sx={{ fontSize: 32 }} />
                ) : (
                  <MicIcon sx={{ fontSize: 32 }} />
                )}
              </Fab>
            </Tooltip>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              textAlign="center"
              sx={{ maxWidth: 200 }}
            >
              {isProcessing 
                ? 'Processing your voice...' 
                : isRecording 
                  ? 'Tap to stop recording' 
                  : 'Tap and speak to Dr. Samaira'}
            </Typography>
            
            {/* Recording Tips */}
            {!isRecording && !isProcessing && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                  💡 Speak clearly for best results
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                  ⏱️ Max recording time: 60 seconds
                </Typography>
                <Chip
                  label={autoMode ? "Auto-listening ON" : "Auto-listening OFF"}
                  size="small"
                  color={autoMode ? "primary" : "default"}
                  variant={autoMode ? "filled" : "outlined"}
                  onClick={() => setAutoMode(!autoMode)}
                  sx={{ mt: 1 }}
                />
              </Box>
            )}
          </Box>
        </CardContent>
        
        {/* Error Snackbar */}
        <Snackbar
          open={!!voiceError}
          autoHideDuration={6000}
          onClose={() => setVoiceError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setVoiceError(null)} 
            severity="error" 
            variant="filled"
            sx={{ borderRadius: 2 }}
          >
            {voiceError}
          </Alert>
        </Snackbar>
      </Paper>
    </Slide>
  );
};

export default VoiceControls;