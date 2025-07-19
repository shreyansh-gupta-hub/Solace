/**
 * Session Actions Component
 * Shows recommended actions based on therapy session
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
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  AccessTime as TimeIcon,
  FitnessCenter as DifficultyIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000';

const SessionActions = ({ open, onClose, sessionId, authToken }) => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedActions, setCompletedActions] = useState([]);

  useEffect(() => {
    if (open && sessionId) {
      fetchSessionActions();
    }
  }, [open, sessionId]);

  const fetchSessionActions = async () => {
    setLoading(true);
    setError('');

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/actions`, {
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch actions: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      setActions(data.actions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSessionActions();
  };

  const handleActionComplete = (actionIndex) => {
    if (completedActions.includes(actionIndex)) {
      setCompletedActions(completedActions.filter(idx => idx !== actionIndex));
    } else {
      setCompletedActions([...completedActions, actionIndex]);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'primary';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCategoryColor = (category) => {
    const categoryColors = {
      'anxiety': '#8e24aa',
      'depression': '#5e35b1',
      'sleep': '#1e88e5',
      'mindfulness': '#43a047',
      'relaxation': '#00acc1',
      'reflection': '#fb8c00',
      'self-care': '#ec407a'
    };
    
    return categoryColors[category.toLowerCase()] || '#757575';
  };

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
          <Typography variant="h5" fontWeight={600}>
            Recommended Actions
          </Typography>
          <Box>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
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

      <DialogContent sx={{ px: 3 }}>
        <Typography variant="body1" color="text.secondary" paragraph>
          Based on your therapy session, here are some recommended actions to support your mental wellbeing:
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <CircularProgress />
          </Box>
        ) : actions.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No actions available. Try starting a new therapy session.
          </Alert>
        ) : (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {actions.map((action, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card 
                  elevation={3} 
                  sx={{ 
                    borderRadius: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: completedActions.includes(index) ? 0.7 : 1,
                    position: 'relative',
                    overflow: 'visible'
                  }}
                >
                  {completedActions.includes(index) && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: -10, 
                        right: -10, 
                        zIndex: 1,
                        bgcolor: 'success.main',
                        borderRadius: '50%'
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: 32, color: 'white' }} />
                    </Box>
                  )}
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" fontWeight={600}>
                        {action.title}
                      </Typography>
                      <Chip 
                        label={action.category}
                        size="small"
                        sx={{ 
                          bgcolor: getCategoryColor(action.category),
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                    
                    <Typography variant="body1" paragraph>
                      {action.description}
                    </Typography>
                    
                    <Box display="flex" gap={2} mt={2}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <TimeIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {action.duration}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <DifficultyIcon fontSize="small" color="action" />
                        <Chip 
                          label={action.difficulty} 
                          size="small" 
                          color={getDifficultyColor(action.difficulty)}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      variant={completedActions.includes(index) ? "outlined" : "contained"}
                      color={completedActions.includes(index) ? "success" : "primary"}
                      onClick={() => handleActionComplete(index)}
                      fullWidth
                      sx={{ borderRadius: 2 }}
                    >
                      {completedActions.includes(index) ? "Completed ✓" : "Mark as Complete"}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ borderRadius: 2 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionActions;