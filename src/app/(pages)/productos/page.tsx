
'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MassageCard from '@/components/MassageCard';
import { createClient } from '@/utils/supabase/client';

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

  useEffect(() => {
    async function fetchMasajes() {
      const supabase = createClient();
      const { data, error } = await supabase.from('masajes').select('*').order('id', { ascending: true });
      if (error) {
        console.error('Error fetching masajes:', error);
      } else {
        setMasajes((data as unknown as Masaje[]) || []);
      }
    }
    fetchMasajes();
  }, []);

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