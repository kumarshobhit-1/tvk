"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthContext } from "@/context/auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // If user is logged in, ensure session cookie exists
      if (user) {
        try {
          // Check if we already have a session cookie
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
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
