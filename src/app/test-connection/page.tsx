'use client';

import { useState, useEffect } from 'react';
import { supabase, ensureValidSession } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [masajesData, setMasajesData] = useState<any[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const testConnection = async () => {
      try {
        setConnectionStatus('Testing connection...');
        
        // Test 1: Verificar sesión
        const session = await ensureValidSession();
        setSessionInfo(session);
        
        if (!session) {
          setConnectionStatus('No session found');
          return;
        }

        setConnectionStatus('Session found, testing masajes table...');

        // Test 2: Cargar datos de masajes
        const { data, error } = await supabase
          .from('masajes')
          .select('*')
          .order('id', { ascending: true });

        if (error) {
          setError(`Error loading masajes: ${error.message}`);
          setConnectionStatus('Error loading masajes');
          return;
        }

        setMasajesData(data || []);
        setConnectionStatus(`Success! Loaded ${data?.length || 0} masajes`);
        
      } catch (err: any) {
        setError(`Connection error: ${err.message}`);
        setConnectionStatus('Connection failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>
        
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
            <p className={`font-medium ${
              connectionStatus.includes('Success') ? 'text-green-600' : 
              connectionStatus.includes('Error') ? 'text-red-600' : 
              'text-yellow-600'
            }`}>
              {connectionStatus}
            </p>
          </div>

          {/* Auth Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? user.nombre : 'Not authenticated'}</p>
              <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p><strong>Role:</strong> {user?.rol || 'N/A'}</p>
            </div>
          </div>

          {/* Session Info */}
          {sessionInfo && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Session Information</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(sessionInfo, null, 2)}
              </pre>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
              <h2 className="text-xl font-semibold mb-4 text-red-700">Error</h2>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Masajes Data */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Masajes Data</h2>
            {masajesData.length > 0 ? (
              <div className="space-y-4">
                {masajesData.map((masaje) => (
                  <div key={masaje.id} className="border p-4 rounded">
                    <h3 className="font-semibold">{masaje.nombre}</h3>
                    <p className="text-gray-600">{masaje.descripcion_corta}</p>
                    <p className="text-sm text-gray-500">
                      Precio: ${masaje.precio} | Duración: {masaje.duracion} min
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No masajes data available</p>
            )}
          </div>

          {/* Environment Variables */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2">
              <p><strong>SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</p>
              <p><strong>SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 