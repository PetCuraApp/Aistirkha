import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const checkUser = async () => {
      try {
        setIsLoading(true);
        console.log('useAuth: Checking user session...');
        
        const session = await getSessionClient();
        console.log('useAuth: Session result:', session ? 'exists' : 'null');
        
        if (session?.user) {
          console.log('useAuth: User found, getting details...');
          const userDetails = await getUserDetailsClient();
          console.log('useAuth: User details:', userDetails);
          
          if (userDetails) {
            setUser(userDetails as User);
            setIsAdmin(userDetails.rol === 'admin');
            console.log('useAuth: User set successfully');
          } else {
            console.log('useAuth: No user details found');
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          console.log('useAuth: No session found');
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
        console.log('useAuth: Auth state change:', event, session ? 'session exists' : 'no session');
        
        if (session?.user) {
          console.log('useAuth: Auth state change - getting user details...');
          const userDetails = await getUserDetailsClient();
          console.log('useAuth: Auth state change - user details:', userDetails);
          
          if (userDetails) {
            setUser(userDetails as User);
            setIsAdmin(userDetails.rol === 'admin');
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          console.log('useAuth: Auth state change - clearing user');
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