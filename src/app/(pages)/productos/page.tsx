'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MassageCard from '@/components/MassageCard';
import { supabase, ensureValidSession } from '@/utils/supabase/client';

type Masaje = {
  id: string;
  nombre: string;
  descripcion_corta: string;
  descripcion_larga: string;
  duracion: number;
  precio: number;
  imagen_url: string;
};

export default function ProductosPage() {
  const [masajes, setMasajes] = useState<Masaje[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar masajes
  useEffect(() => {
    async function fetchMasajes() {
      try {
        console.log('ProductosPage: Starting to fetch masajes...');
        setLoading(true);
        
        // Verificar sesión antes de cargar datos
        const session = await ensureValidSession();
        console.log('ProductosPage: Session check result:', session ? 'valid' : 'invalid');
        
        const { data, error } = await supabase
          .from('masajes')
          .select('*')
          .order('id', { ascending: true });

        if (error) {
          console.error('ProductosPage: Error fetching masajes:', error);
        } else {
          console.log('ProductosPage: Successfully fetched masajes:', data?.length || 0, 'items');
          setMasajes((data as unknown as Masaje[]) || []);
        }
      } catch (error) {
        console.error('ProductosPage: Error in fetchMasajes:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMasajes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Nuestros Masajes</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre nuestra variedad de masajes terapéuticos diseñados para mejorar tu bienestar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {masajes.map((masaje, index) => (
            <motion.div
              key={masaje.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <MassageCard
                id={masaje.id}
                nombre={masaje.nombre}
                descripcion={masaje.descripcion_larga}
                precio={masaje.precio}
                duracion={masaje.duracion}
                imagen={masaje.imagen_url}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
