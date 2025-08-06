import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import { getSessionClient, getUserDetailsClient } from '@/lib/authClient';

export interface User {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  rol: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    const checkUser = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;
      
      try {
        setIsLoading(true);
        
        const session = await getSessionClient();
        
        if (session?.user) {
          const userDetails = await getUserDetailsClient();
          
          if (userDetails) {
            setUser(userDetails as User);
            setIsAdmin(userDetails.rol === 'admin');
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('useAuth: Error checking user:', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userDetails = await getUserDetailsClient();
          
          if (userDetails) {
            setUser(userDetails as User);
            setIsAdmin(userDetails.rol === 'admin');
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('useAuth: Error signing out:', error);
    }
  };

  return {
    user,
    isLoading,
    isAdmin,
    signOut,
    isAuthenticated: !!user
  };
} 