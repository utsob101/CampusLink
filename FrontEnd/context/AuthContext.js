import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileCache, setProfileCache] = useState({}); // Cache for profile data
  const [lastFetch, setLastFetch] = useState(0); // Timestamp of last fetch
  const [isDemoUser, setIsDemoUser] = useState(false); // Track if user is demo

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('jwt_token');
        if (token) {
          const data = await api.me();
          if (data?.user) {
            setUser({ id: data.user.id, email: data.user.email });
            setProfile(data.user);
          }
        }
      } catch (error) {
        console.warn('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const fetchUserProfile = async (_userId) => {
    try {
      // Check cache first
      const cacheKey = `profile_self`;
      const cachedProfile = profileCache[cacheKey];
      const now = Date.now();
      
      // Use cached data if it's less than 5 minutes old
      if (cachedProfile && (now - lastFetch) < 300000) {
        setProfile(cachedProfile);
        return cachedProfile;
      }
      const { user: profileData } = await api.me();
      if (profileData) {
        setProfile(profileData);
        setProfileCache(prev => ({ ...prev, [cacheKey]: profileData }));
        setLastFetch(now);
        return profileData;
      }
    } catch (error) {
      console.warn('Profile fetch exception:', error);
      
      // If we have cached data, use it
      const cacheKey = `profile_self`;
      const cachedProfile = profileCache[cacheKey];
      if (cachedProfile) {
        setProfile(cachedProfile);
        return cachedProfile;
      }
    }
    
    return null;
  };

  const signUp = async (email, password, metadata = {}) => {
    try {
      console.log('[AuthContext] Starting signup for:', email);
      const data = await api.register(email, password, metadata);
      
      if (!data) {
        throw new Error('No data returned from registration');
      }
      
      if (!data.token) {
        throw new Error('No token returned from registration');
      }
      
      if (!data.user) {
        throw new Error('No user data returned from registration');
      }
      
      console.log('[AuthContext] ✓ Signup successful:', data.user.email);
      
      // DO NOT auto-login - user must login manually after registration
      // setUser({ id: data.user.id, email: data.user.email });
      // setProfile(data.user);
      
      return { data: { user: data.user, token: data.token }, error: null };
    } catch (error) {
      console.error('[AuthContext] Signup error:', error.message);
      
      // Provide more specific error messages
      let errorMessage = error.message;
      
      if (error.status === 409) {
        errorMessage = 'User already registered';
      } else if (error.status === 400) {
        errorMessage = 'Invalid email or password';
      } else if (error.status === 0 || error.message.includes('Network')) {
        errorMessage = 'Network error - cannot reach server';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout';
      }
      
      return { 
        data: null, 
        error: { 
          message: errorMessage,
          status: error.status,
          originalError: error 
        } 
      };
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log('[AuthContext] Starting signin for:', email);
      const data = await api.login(email, password);
      
      if (!data) {
        throw new Error('No data returned from login');
      }
      
      if (!data.token) {
        throw new Error('No token returned from login');
      }
      
      if (!data.user) {
        throw new Error('No user data returned from login');
      }
      
      console.log('[AuthContext] Signin successful:', data.user.email);
      setUser({ id: data.user.id, email: data.user.email });
      setProfile(data.user);
      return { data: { user: data.user, token: data.token }, error: null };
    } catch (error) {
      console.error('[AuthContext] Signin error:', error.message);
      
      // Provide more specific error messages
      let errorMessage = error.message;
      
      if (error.status === 401) {
        errorMessage = 'Invalid credentials';
      } else if (error.status === 400) {
        errorMessage = 'Invalid email or password';
      } else if (error.status === 0 || error.message.includes('Network')) {
        errorMessage = 'Network error - cannot reach server';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout';
      }
      
      return { 
        data: null, 
        error: { 
          message: errorMessage,
          status: error.status,
          originalError: error 
        } 
      };
    }
  };

  const signOut = async () => {
    try {
      // Clear cached session
      await api.logout();
      // Clear profile cache
      setProfileCache({});
      setProfile(null);
      setIsDemoUser(false);
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error) {
      console.error('Signout exception:', error);
      return { error };
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error('Cannot update profile without user');
      }

      const { user: updated } = await api.updateMe(updates);
      if (updated) {
        setProfile(updated);
        const cacheKey = `profile_self`;
        setProfileCache(prev => ({ ...prev, [cacheKey]: updated }));
      }
      return { data: updated, error: null };
    } catch (error) {
      console.error('Profile update exception:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    session,
    loading,
    profile,
    isDemoUser,
    signUp,
    signIn,
    signOut,
    updateProfile,
    fetchUserProfile,
    setUser,
    setProfile,
    setIsDemoUser,
    // Helper functions for access control
    isDemo: () => isDemoUser || user?.id === 'demo-user-123',
    canWrite: () => !isDemoUser && user?.id !== 'demo-user-123',
    canCreate: () => !isDemoUser && user?.id !== 'demo-user-123',
    canEdit: () => !isDemoUser && user?.id !== 'demo-user-123',
    canDelete: () => !isDemoUser && user?.id !== 'demo-user-123',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
