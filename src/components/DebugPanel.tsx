'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, ensureValidSession } from '@/utils/supabase/client';

export default function DebugPanel() {
  const { user, isLoading, isAdmin } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateDebugInfo = async () => {
      try {
        const session = await ensureValidSession();
        const localStorageData = typeof window !== 'undefined' ? {
          'supabase.auth.token': localStorage.getItem('supabase.auth.token'),
          'masajesCache': localStorage.getItem('masajesCache'),
          'masajesTimestamp': localStorage.getItem('masajesTimestamp'),
        } : {};

        setDebugInfo({
          timestamp: new Date().toISOString(),
          session: session ? {
            user: session.user?.id,
            email: session.user?.email,
            expiresAt: session.expires_at,
          } : null,
          authState: {
            user: user ? { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol } : null,
            isLoading,
            isAdmin,
            isAuthenticated: !!user,
          },
          localStorage: localStorageData,
          environment: {
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
            supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
          }
        });
      } catch (error) {
        console.error('DebugPanel: Error updating debug info:', error);
      }
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [user, isLoading, isAdmin]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-full z-50 shadow-lg hover:bg-red-600 transition-colors"
        title="Debug Panel"
      >
        🐛
      </button>
    );
  }

  return (
    <div className="fixed inset-0 md:inset-auto md:bottom-4 md:right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-full md:max-w-md max-h-full md:max-h-96 overflow-auto z-50 m-4 md:m-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-sm">Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Timestamp:</strong> {debugInfo.timestamp}
        </div>
        
        <div>
          <strong>Session:</strong>
          <pre className="bg-gray-100 p-1 rounded text-xs overflow-auto max-h-20">
            {JSON.stringify(debugInfo.session, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>Auth State:</strong>
          <pre className="bg-gray-100 p-1 rounded text-xs overflow-auto max-h-20">
            {JSON.stringify(debugInfo.authState, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>LocalStorage:</strong>
          <pre className="bg-gray-100 p-1 rounded text-xs overflow-auto max-h-20">
            {JSON.stringify(debugInfo.localStorage, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>Environment:</strong>
          <pre className="bg-gray-100 p-1 rounded text-xs overflow-auto max-h-20">
            {JSON.stringify(debugInfo.environment, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 