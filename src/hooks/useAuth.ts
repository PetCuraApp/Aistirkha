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
        console.log('useAuth: Initializing...');
        
        const session = await getSessionClient();
        console.log('useAuth: Session result:', !!session);
        
        if (session?.user) {
          console.log('useAuth: Getting user details...');
          const userDetails = await getUserDetailsClient();
          console.log('useAuth: User details found:', !!userDetails);
          
          if (userDetails) {
            setUser(userDetails as User);
            setIsAdmin(userDetails.rol === 'admin');
            console.log('useAuth: User set successfully');
          } else {
            setUser(null);
            setIsAdmin(false);
            console.log('useAuth: No user details found');
          }
        } else {
          setUser(null);
          setIsAdmin(false);
          console.log('useAuth: No session found');
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
        console.log('useAuth: Auth state change:', event, !!session);
        
        if (session?.user) {
          console.log('useAuth: Getting user details after auth change...');
          const userDetails = await getUserDetailsClient();
          console.log('useAuth: User details after auth change:', !!userDetails);
          
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
          console.log('useAuth: Clearing user after auth change');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('useAuth: Signing out...');
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      console.log('useAuth: Sign out successful');
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