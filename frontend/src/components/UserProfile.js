/**
 * User Profile Component
 * Shows user info and session history
 * 
 * Copyright (c) 2025 Shreyansh Gupta
 * All Rights Reserved
 * https://shreygupta.vercel.app
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  History as HistoryIcon,
  Chat as ChatIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000';

const UserProfile = ({ open, onClose, user, onLogout }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && user) {
      fetchUserSessions();
    }
  }, [open, user]);

  const fetchUserSessions = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      console.log('🔐 UserProfile fetching sessions with token:', token ? token.substring(0, 30) + '...' : 'NO TOKEN');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Try to refresh the token first
      let refreshSuccessful = false;
      try {
        console.log('🔄 Attempting to refresh token...');
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
            console.log('✅ Token refreshed successfully');
            refreshSuccessful = true;
          }
        } else {
          const errorText = await refreshResponse.text();
          console.log(`⚠️ Token refresh failed with status ${refreshResponse.status}: ${errorText}`);
        }
      } catch (refreshError) {
        console.log('⚠️ Token refresh failed with error:', refreshError);
      }
      
      // Get the potentially refreshed token
      const currentToken = localStorage.getItem('auth_token');
      
      console.log('🔍 Fetching sessions with token:', refreshSuccessful ? 'refreshed token' : 'original token');
      const response = await fetch(`${API_BASE_URL}/api/auth/sessions`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('🔐 Sessions response status:', response.status);
      
      if (!response.ok) {
        let errorText = '';
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch {
          errorText = await response.text();
        }
        console.log('🔐 Sessions error response:', errorText);
        
        // If unauthorized, try to use demo sessions endpoint as fallback
        if (response.status === 401) {
          console.log('🔄 Trying demo sessions endpoint as fallback');
          const demoResponse = await fetch(`${API_BASE_URL}/api/sessions/demo`);
          
          if (demoResponse.ok) {
            const demoData = await demoResponse.json();
            setSessions(demoData.sessions || []);
            setError('Using demo sessions. Please try logging out and back in to fix authentication issues.');
            return;
          }
        }
        
        // Try the auth debug endpoint to get more information
        try {
          console.log('🧪 Trying auth debug endpoint for more information');
          const debugResponse = await fetch(`${API_BASE_URL}/api/test/auth-debug`, {
            headers: {
              'Authorization': `Bearer ${currentToken}`,
              'Content-Type': 'application/json'
            },
          });
          
          if (debugResponse.ok) {
            const debugData = await debugResponse.json();
            console.log('🧪 Auth debug result:', debugData);
            
            if (debugData.validation_error) {
              throw new Error(`Authentication error: ${debugData.validation_error}`);
            }
          }
        } catch (debugError) {
          console.log('🧪 Auth debug failed:', debugError);
        }
        
        throw new Error(`Failed to fetch sessions: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      setSessions(data.sessions || []);
      setError(''); // Clear any previous errors

    } catch (err) {
      console.error('Session fetch error:', err);
      setError(err.message || 'Failed to load sessions. Please try logging out and back in.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    onLogout();
    onClose();
  };

  const testAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      console.log('🧪 Testing auth with token:', token ? token.substring(0, 30) + '...' : 'NO TOKEN');
      
      const response = await fetch(`${API_BASE_URL}/api/test/auth-debug`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      const result = await response.json();
      console.log('🧪 Auth test result:', result);
      alert(`Auth test result: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error('🧪 Auth test failed:', error);
      alert(`Auth test failed: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%)',
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main',
                width: 56,
                height: 56
              }}
            >
              <PersonIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {user.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your Therapy Profile
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <Tooltip title="Logout">
              <IconButton onClick={handleLogout} color="error">
                <LogoutIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 4 }}>
        {/* User Info Card */}
        <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <PersonIcon color="primary" />
              Account Information
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body1">
                  <strong>Username:</strong> {user.username}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body1">
                  <strong>Email:</strong> {user.email}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Session History Card */}
        <Card elevation={2} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <HistoryIcon color="primary" />
              Therapy Sessions
              <Chip 
                label={sessions.length} 
                size="small" 
                color="primary" 
                sx={{ ml: 1 }}
              />
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">Loading sessions...</Typography>
              </Box>
            ) : sessions.length === 0 ? (
              <Box textAlign="center" py={4}>
                <PsychologyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No sessions yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start your first therapy session to begin your journey
                </Typography>
              </Box>
            ) : (
              <List sx={{ mt: 2 }}>
                {sessions.map((session, index) => (
                  <React.Fragment key={session.session_id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <ChatIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" fontWeight={500}>
                              {session.session_name}
                            </Typography>
                            <Chip 
                              label={`${session.message_count} messages`}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          </Box>
                        }
                        secondary={
                          <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <ScheduleIcon fontSize="small" />
                              <Typography variant="caption">
                                Started: {formatDate(session.created_at)}
                              </Typography>
                            </Box>
                            {session.updated_at !== session.created_at && (
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <ScheduleIcon fontSize="small" />
                                <Typography variant="caption">
                                  Last: {formatDate(session.updated_at)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < sessions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Alert 
          severity="info" 
          sx={{ 
            mt: 3, 
            borderRadius: 2,
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}
        >
          <Typography variant="body2">
            <strong>Privacy & Security:</strong> Your therapy sessions are encrypted and stored securely. 
            Only you have access to your conversation history, and we never share your personal information.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 3 }}>
        <Button
          variant="text"
          onClick={testAuth}
          sx={{ borderRadius: 2, mr: 'auto' }}
        >
          Test Auth
        </Button>
        <Button
          variant="outlined"
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          color="error"
          sx={{ borderRadius: 2 }}
        >
          Logout
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            borderRadius: 2,
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
          }}
        >
          Continue Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserProfile;