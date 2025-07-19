/**
 * Firebase Authentication Modal Component
 * Handles user login and signup with Firebase Auth
 * 
 * Copyright (c) 2025 Shreyansh Gupta
 * All Rights Reserved
 * https://shreygupta.vercel.app
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Login as LoginIcon,
  PersonAdd as SignupIcon
} from '@mui/icons-material';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const FirebaseAuthModal = ({ open, onClose, onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState(0); // 0 = login, 1 = signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Form data
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginPayload = {
        username: loginData.email, // Use email as username
        password: loginData.password
      };
      
      console.log('🔐 Attempting login with:', { 
        username: loginPayload.username, 
        password: '***' 
      });
      
      // Use backend API instead of direct Firebase
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user_data', JSON.stringify({
        id: result.user.id,
        username: result.user.username,
        email: result.user.email || loginData.email
      }));

      // Call success callback
      if (onAuthSuccess) {
        onAuthSuccess({
          id: result.user.id,
          username: result.user.username,
          email: result.user.email || loginData.email
        }, result.token);
      }
      
      // Close modal
      onClose();

    } catch (err) {
      console.error('Login error:', err);
      console.error('Login error details:', {
        message: err.message,
        response: err.response,
        status: err.status
      });
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (signupData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(signupData.password)) {
      setError('Password must contain at least one uppercase letter');
      setLoading(false);
      return;
    }
    
    // Check for lowercase letter
    if (!/[a-z]/.test(signupData.password)) {
      setError('Password must contain at least one lowercase letter');
      setLoading(false);
      return;
    }
    
    // Check for number
    if (!/[0-9]/.test(signupData.password)) {
      setError('Password must contain at least one number');
      setLoading(false);
      return;
    }
    
    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(signupData.password)) {
      setError('Password must contain at least one special character');
      setLoading(false);
      return;
    }

    try {
      const signupPayload = {
        username: signupData.username,
        email: signupData.email,
        password: signupData.password
      };
      
      console.log('🔐 Attempting signup with:', { 
        username: signupPayload.username, 
        email: signupPayload.email,
        password: '***' 
      });
      
      // Use backend API instead of direct Firebase
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Signup failed');
      }

      // Store token and user data
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user_data', JSON.stringify({
        id: result.user.id,
        username: result.user.username,
        email: result.user.email
      }));

      // Call success callback
      if (onAuthSuccess) {
        onAuthSuccess({
          id: result.user.id,
          username: result.user.username,
          email: result.user.email
        }, result.token);
      }
      
      // Close modal
      onClose();

    } catch (err) {
      console.error('Signup error:', err);
      console.error('Signup error details:', {
        message: err.message,
        response: err.response,
        status: err.status
      });
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please use a different email or try logging in.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please check your email or sign up.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const handleClose = () => {
    setError('');
    setLoginData({ email: '', password: '' });
    setSignupData({ username: '', email: '', password: '', confirmPassword: '' });
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%)',
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
          Welcome to Dr. Samaira
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to save your therapy sessions and continue your journey
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            centered
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem'
              }
            }}
          >
            <Tab 
              icon={<LoginIcon />} 
              label="Sign In" 
              iconPosition="start"
            />
            <Tab 
              icon={<SignupIcon />} 
              label="Sign Up" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Login Form */}
        {activeTab === 0 && (
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              margin="normal"
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              margin="normal"
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !loginData.email || !loginData.password}
              startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
              sx={{
                py: 1.5,
                borderRadius: 3,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  boxShadow: '0 6px 25px rgba(102, 126, 234, 0.6)',
                }
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>
        )}

        {/* Signup Form */}
        {activeTab === 1 && (
          <Box component="form" onSubmit={handleSignup}>
            <TextField
              fullWidth
              label="Username"
              value={signupData.username}
              onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
              margin="normal"
              required
              disabled={loading}
              helperText="At least 3 characters"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              margin="normal"
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={signupData.password}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
              margin="normal"
              required
              disabled={loading}
              helperText="Must have 8+ chars, uppercase, lowercase, number, and special char"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={signupData.confirmPassword}
              onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
              margin="normal"
              required
              disabled={loading}
              error={signupData.confirmPassword && signupData.password !== signupData.confirmPassword}
              helperText={
                signupData.confirmPassword && signupData.password !== signupData.confirmPassword
                  ? 'Passwords do not match'
                  : ''
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={
                loading || 
                !signupData.username || 
                !signupData.email || 
                !signupData.password || 
                !signupData.confirmPassword ||
                signupData.password !== signupData.confirmPassword
              }
              startIcon={loading ? <CircularProgress size={20} /> : <SignupIcon />}
              sx={{
                py: 1.5,
                borderRadius: 3,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  boxShadow: '0 6px 25px rgba(102, 126, 234, 0.6)',
                }
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">
            or
          </Typography>
        </Divider>

        <Box textAlign="center">
          <Button
            variant="text"
            onClick={handleClose}
            sx={{ 
              color: 'text.secondary',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'transparent',
                color: 'primary.main'
              }
            }}
          >
            Continue as Guest
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 3, justifyContent: 'center' }}>
        <Typography variant="caption" color="text.secondary" textAlign="center">
          By signing up, you agree to our Terms of Service and Privacy Policy.
          <br />
          Your therapy sessions are private and secure with Firebase.
        </Typography>
      </DialogActions>
    </Dialog>
  );
};

export default FirebaseAuthModal;