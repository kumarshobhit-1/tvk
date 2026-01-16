"use client";

import { useEffect } from "react";
import { useAuth } from "./use-auth";

export const useSessionSync = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    const syncSession = async () => {
      if (!user || loading) return;
      
      // Check if we already have a session cookie by making a test request
      try {
        const testResponse = await fetch('/api/session-check', { 
          method: 'GET',
          credentials: 'include' 
        });
        
        if (!testResponse.ok) {
          // No valid session, create one
          const idToken = await user.getIdToken(true);
          
          const response = await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          
          if (!response.ok) {
            console.error('Failed to sync session:', await response.text());
          }
        }
      } catch (error) {
        console.error('Session sync error:', error);
      }
    };

    syncSession();
  }, [user, loading]);
};