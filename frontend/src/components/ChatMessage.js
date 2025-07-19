/**
 * Dr. Samaira AI Therapist - Chat Message Component
 * 
 * Copyright (c) 2025 Shreyansh Gupta
 * All Rights Reserved
 * https://shreygupta.vercel.app
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Fade,
  Collapse,
  Card
} from '@mui/material';
import {
  Person as PersonIcon,
  Psychology as PsychologyIcon,
  VolumeUp as VolumeUpIcon,
  Favorite as FavoriteIcon,
  SentimentSatisfied as HappyIcon,
  SentimentNeutral as CalmIcon,
  SentimentDissatisfied as EmpathyIcon,
  AutoAwesome as SparkleIcon,
  Mic as MicIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';

const ChatMessage = ({ message, voiceEnabled, darkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isTherapist = message.sender === 'therapist';
  const isVoiceMessage = message.isVoice;
  
  // Get emotion icon and color
  const getEmotionConfig = (emotion) => {
    const configs = {
      encouraging: {
        icon: <HappyIcon fontSize="small" />,
        color: '#4caf50',
        gradient: 'linear-gradient(45deg, #4caf50, #81c784)',
        label: 'Encouraging'
      },
      empathetic: {
        icon: <EmpathyIcon fontSize="small" />,
        color: '#ff9800',
        gradient: 'linear-gradient(45deg, #ff9800, #ffb74d)',
        label: 'Empathetic'
      },
      supportive: {
        icon: <FavoriteIcon fontSize="small" />,
        color: '#e91e63',
        gradient: 'linear-gradient(45deg, #e91e63, #f06292)',
        label: 'Supportive'
      },
      calm: {
        icon: <CalmIcon fontSize="small" />,
        color: '#2196f3',
        gradient: 'linear-gradient(45deg, #2196f3, #64b5f6)',
        label: 'Calm'
      }
    };
    return configs[emotion] || configs.calm;
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Now';
    
    try {
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Now';
      }
      
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.warn('Invalid timestamp:', timestamp, error);
      return 'Now';
    }
  };
  
  // Play audio
  const playAudio = async () => {
    if (message.audioUrl) {
      setIsPlaying(true);
      try {
        const audio = new Audio(message.audioUrl);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => setIsPlaying(false);
        await audio.play();
      } catch (error) {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      }
    }
  };
  
  const emotionConfig = message.emotion ? getEmotionConfig(message.emotion) : null;
  
  // Handle system messages differently
  if (message.sender === 'system') {
    return (
      <Fade in timeout={400}>
        <Box
          className="chat-message system-message"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
            px: 1
          }}
        >
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              borderRadius: 3,
              maxWidth: '80%'
            }}
          >
            <Typography
              variant="body2"
              align="center"
              color="text.secondary"
              sx={{ fontStyle: 'italic' }}
            >
              {message.text}
            </Typography>
          </Paper>
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in timeout={400}>
      <Box
        className="chat-message"
        sx={{
          display: 'flex',
          justifyContent: isTherapist ? 'flex-start' : 'flex-end',
          mb: 3,
          alignItems: 'flex-start',
          gap: 2,
          px: 1
        }}
      >
        {/* Therapist Avatar */}
        {isTherapist && (
          <Avatar 
            className="mobile-message-avatar"
            sx={{ 
              bgcolor: emotionConfig ? emotionConfig.color : '#667eea',
              background: emotionConfig ? emotionConfig.gradient : 'linear-gradient(45deg, #667eea, #764ba2)',
              width: 44,
              height: 44,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <PsychologyIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
          </Avatar>
        )}
        
        {/* Message Content */}
        <Box sx={{ maxWidth: '75%', minWidth: '200px' }} className="mobile-message">
          {/* Message Header (for therapist) */}
          {isTherapist && (
            <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                Dr. Samaira
              </Typography>
              {emotionConfig && (
                <Chip
                  icon={emotionConfig.icon}
                  label={emotionConfig.label}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    background: emotionConfig.gradient,
                    color: 'white',
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: 'white',
                      fontSize: '0.75rem'
                    }
                  }}
                />
              )}
              {isVoiceMessage && (
                <Tooltip title="Voice Message">
                  <MicIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                </Tooltip>
              )}
            </Box>
          )}
          
          {/* Message Bubble */}
          <Paper
            elevation={isTherapist ? 2 : 8}
            className="mobile-message-content"
            sx={{
              p: 2.5,
              background: isTherapist 
                ? (darkMode 
                    ? 'linear-gradient(135deg, #2a2a3e 0%, #1e1e2e 100%)'
                    : 'linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%)')
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: isTherapist ? (darkMode ? '#ffffff' : '#333') : 'white',
              borderRadius: isTherapist ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
              border: isTherapist 
                ? (darkMode 
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(102, 126, 234, 0.1)')
                : 'none',
              boxShadow: isTherapist 
                ? '0 4px 20px rgba(0, 0, 0, 0.08)'
                : '0 8px 32px rgba(102, 126, 234, 0.3)',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isTherapist 
                  ? '0 8px 30px rgba(0, 0, 0, 0.12)'
                  : '0 12px 40px rgba(102, 126, 234, 0.4)',
              }
            }}
          >
            {/* Sparkle effect for therapist messages */}
            {isTherapist && (
              <SparkleIcon 
                sx={{ 
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  fontSize: 16,
                  color: emotionConfig ? emotionConfig.color : '#667eea',
                  opacity: 0.6
                }}
              />
            )}
            
            <Typography 
              variant="body1" 
              sx={{ 
                lineHeight: 1.5,
                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                fontWeight: isTherapist ? 400 : 500
              }}
            >
              {message.text}
            </Typography>
            
            {/* Message Footer */}
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              mt={1.5}
              sx={{ opacity: 0.8 }}
            >
              <Box display="flex" alignItems="center" gap={0.5}>
                <TimeIcon sx={{ fontSize: 12 }} />
                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                  {formatTime(message.timestamp)}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                {/* Voice message indicator */}
                {isVoiceMessage && (
                  <Tooltip title="Voice Message">
                    <Chip
                      icon={<MicIcon />}
                      label="Voice"
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        borderColor: isTherapist ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                        color: isTherapist ? '#667eea' : 'white',
                        '& .MuiChip-icon': {
                          fontSize: 12
                        }
                      }}
                    />
                  </Tooltip>
                )}
                
                {/* Audio playback button */}
                {isTherapist && voiceEnabled && message.audioUrl && (
                  <Tooltip title={isPlaying ? "Playing..." : "Play Audio"}>
                    <IconButton 
                      size="small" 
                      onClick={playAudio}
                      disabled={isPlaying}
                      sx={{ 
                        color: darkMode ? '#ffffff' : '#667eea',
                        '&:hover': {
                          backgroundColor: 'rgba(102, 126, 234, 0.1)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <VolumeUpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {/* Expand button for long messages */}
                {message.text.length > 200 && (
                  <Tooltip title={expanded ? "Show less" : "Show more"}>
                    <IconButton 
                      size="small" 
                      onClick={() => setExpanded(!expanded)}
                      sx={{ 
                        color: isTherapist ? (darkMode ? '#ffffff' : '#667eea') : 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(102, 126, 234, 0.1)'
                        }
                      }}
                    >
                      {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Paper>
          
          {/* Expanded content for long messages */}
          <Collapse in={expanded}>
            <Card 
              variant="outlined" 
              sx={{ 
                mt: 1, 
                p: 2, 
                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                borderColor: 'rgba(102, 126, 234, 0.2)'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Message details and additional context could go here...
              </Typography>
            </Card>
          </Collapse>
        </Box>
        
        {/* User Avatar */}
        {!isTherapist && (
          <Avatar 
            className="mobile-message-avatar"
            sx={{ 
              bgcolor: '#764ba2',
              background: 'linear-gradient(45deg, #764ba2, #667eea)',
              width: 44,
              height: 44,
              boxShadow: '0 4px 12px rgba(118, 75, 162, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <PersonIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
          </Avatar>
        )}
      </Box>
    </Fade>
  );
};

export default ChatMessage;