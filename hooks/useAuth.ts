/**
 * hooks/useAuth.ts
 * Purpose: Manages authentication state and operations,Manages user authentication state, Handles login/signup/logout, Restores sessions on reload,**Exports:** `useAuth()` hook
 */

import { useState, useEffect } from 'react';
import { supabase } from '../src/supabaseClient';
import { User } from '../types';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let isInitializing = false;

    const loadProfile = async (userId: string, source: string) => {
      console.log(`📡 Fetching profile from ${source}...`);
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!mounted) return null;
        
        if (error) {
          console.error('❌ Profile fetch error:', error);
          setAuthError(`Profile error: ${error.message}`);
          setCurrentUser(null);
          return null;
        } else {
          console.log('✅ Profile loaded:', profile.name);
          setCurrentUser(profile);
          setAuthError(null);
          return profile;
        }
      } catch (error) {
        console.error('💥 Profile fetch exception:', error);
        setAuthError('Failed to load profile');
        return null;
      }
    };

    const initializeAuth = async () => {
      if (isInitializing) {
        console.log('⏭️ Already initializing, skipping...');
        return;
      }
      
      isInitializing = true;
      console.log('🔍 Initializing auth...');
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setAuthError("Session error: " + sessionError.message);
          setAuthLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('✅ Session found:', session.user.id);
          await loadProfile(session.user.id, 'initializeAuth');
          setAuthLoading(false);
        } else {
          console.log('ℹ️ No session found');
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('💥 Init error:', error);
        setAuthLoading(false);
      } finally {
        isInitializing = false;
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth event:', event, 'Session exists:', !!session);
      
      if (!mounted) return;
      
      if (event === 'INITIAL_SESSION' || (event === 'SIGNED_IN' && isInitializing)) {
        console.log('⏭️ Skipping event, handled by initializeAuth');
        return;
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setCurrentUser(null);
        setAuthError(null);
        setAuthLoading(false);
        return;
      }
      
      if (session?.user && event === 'SIGNED_IN') {
        console.log('👤 New login detected');
        await loadProfile(session.user.id, 'SIGNED_IN event');
        setAuthLoading(false);
      }
      
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token refreshed');
        await loadProfile(session.user.id, 'TOKEN_REFRESHED');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (identifier: string, secret: string) => {
    setAuthLoading(true);
    setAuthError(null);

    const email = identifier.includes('@') ? identifier : `${identifier}@stitchflow.app`;

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: secret,
    });

    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (name: string, email: string, secret: string) => {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: secret,
      options: {
        data: { 
          name: name,
          role: 'ADMIN',
        }
      }
    });

    if (error) {
      setAuthError(error.message);
    } else {
      alert("Admin account created! Please log in.");
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  return {
    currentUser,
    authLoading,
    authError,
    handleLogin,
    handleSignUp,
    handleLogout,
  };
}
