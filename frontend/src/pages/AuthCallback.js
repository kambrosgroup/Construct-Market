import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../App';
import axios from 'axios';
import { toast } from 'sonner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        toast.error('Authentication failed');
        navigate('/login');
        return;
      }

      const sessionId = sessionIdMatch[1];

      try {
        const response = await axios.post(
          `${API}/auth/google/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);

        await checkAuth();

        if (response.data.needs_onboarding) {
          navigate('/onboarding', { state: { user: response.data } });
        } else {
          toast.success('Welcome back!');
          if (response.data.role === 'builder') navigate('/builder');
          else if (response.data.role === 'provider') navigate('/provider');
          else if (response.data.role === 'admin') navigate('/admin');
          else navigate('/dashboard');
        }
      } catch (error) {
        console.error('Auth error:', error);
        toast.error('Authentication failed');
        navigate('/login');
      }
    };

    processAuth();
  }, [navigate, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
