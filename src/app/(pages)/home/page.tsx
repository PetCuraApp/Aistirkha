'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiAward, FiUsers, FiRefreshCw } from 'react-icons/fi';
import { createClient } from '@/utils/supabase/client';

type MasajePreview = {
  id: string;
  nombre: string;
  descripcion_corta?: string;
  descripcion?: string;
  duracion: number;
  precio: number;
  imagen_url?: string;
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const CACHE_EXPIRY = 3600000; // 1 hora en ms

export default function HomePage() {
  const [masajesPreview, setMasajesPreview] = useState<MasajePreview[]>([]);
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'error'>('loading');
  const [retryCount, setRetryCount] = useState(0);

  const fetchMasajes = async (attempt = 0): Promise<void> => {
    try {
      setLoadingState('loading');
      const supabase = createClient();
      
      // Verificar sesión activa
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.refreshSession();
      }

      const { data, error } = await supabase
        .from('masajes')
        .select('*')
        .order('id', { ascending: true })
        .limit(3);

      if (error) throw error;

      // Actualizar estado y caché
      setMasajesPreview(data || []);
      localStorage.setItem('masajesCache', JSON.stringify(data || []));
      localStorage.setItem('masajesTimestamp', Date.now().toString());
      setLoadingState('success');
      setRetryCount(0);
      
    } catch (error) {
      console.error('Error fetching masajes:', error);
      
      if (attempt < MAX_RETRIES - 1) {
        setRetryCount(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchMasajes(attempt + 1);
      }
      
      // Fallback a caché si está disponible
      const cachedData = localStorage.getItem('masajesCache');
      const cacheTime = localStorage.getItem('masajesTimestamp');
      
      if (cachedData && cacheTime && (Date.now() - Number(cacheTime) < CACHE_EXPIRY)) {
        setMasajesPreview(JSON.parse(cachedData));
        setLoadingState('success');
      } else {
        setLoadingState('error');
      }
    }
  };

  useEffect(() => {
    // Cargar datos iniciales desde caché si están frescos
    const cachedData = localStorage.getItem('masajesCache');
    const cacheTime = localStorage.getItem('masajesTimestamp');
    
    if (cachedData && cacheTime) {
      const isCacheFresh = Date.now() - Number(cacheTime) < CACHE_EXPIRY;
      if (isCacheFresh) {
        setMasajesPreview(JSON.parse(cachedData));
        setLoadingState('success');
      }
    }

    // Luego intentar cargar datos frescos
    fetchMasajes();

    // Configurar recarga periódica cada 5 minutos
    const reloadInterval = setInterval(fetchMasajes, 300000);
    
    return () => clearInterval(reloadInterval);
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  // Componente de esqueleto para loading
  const ServiceSkeleton = () => (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg animate-pulse">
      <div className="bg-gray-200 h-64 w-full"></div>
      <div className="p-6">
        <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-5/6 bg-gray-200 rounded mb-6"></div>
        <div className="flex justify-between">
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/masaje1.png"
            alt="Masaje terapéutico"
            fill
            style={{ objectFit: 'cover' }}
            priority
            className="brightness-50"
          />
        </div>

        <motion.div
          className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
            variants={fadeIn}
          >
            Experimenta el Arte del Bienestar
          </motion.h1>
          <motion.p
            className="text-xl sm:text-2xl mb-8 text-gray-200"
            variants={fadeIn}
          >
            Descubre nuestros masajes terapéuticos diseñados para tu relajación y salud.
          </motion.p>
          <motion.div variants={fadeIn}>
            <Link
              href="/reservas"
              className="bg-card-background text-heading-text px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-100 transition-colors duration-300 inline-flex items-center space-x-2 border border-teal-600"
              prefetch
            >
              <FiCalendar className="h-5 w-5" />
              <span>Reserva Ahora</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">¿Por qué elegirnos?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              En Aistirkha nos dedicamos a proporcionar experiencias de bienestar.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FiAward className="h-10 w-10 text-teal-500" />,
                title: 'Profesionales Certificados',
                description: 'Nuestro equipo está formado por terapeutas certificados con años de experiencia.',
              },
              {
                icon: <FiUsers className="h-10 w-10 text-teal-500" />,
                title: 'Atención Personalizada',
                description: 'Cada sesión se adapta a tus necesidades específicas y preferencias.',
              },
              {
                icon: <FiCalendar className="h-10 w-10 text-teal-500" />,
                title: 'Reservas Online',
                description: 'Sistema de reservas fácil y rápido para tu comodidad.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-lg shadow-md text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Nuestros Servicios</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre nuestra variedad de masajes terapéuticos para mejorar tu bienestar.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingState === 'loading' && (
              <>
                <ServiceSkeleton />
                <ServiceSkeleton />
                <ServiceSkeleton />
              </>
            )}

            {loadingState === 'error' && (
              <div className="col-span-3 text-center py-12">
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 inline-block max-w-md">
                  <p className="font-medium">No pudimos cargar los servicios en este momento</p>
                  <p className="text-sm mt-2">Intento {retryCount} de {MAX_RETRIES}</p>
                  <button 
                    onClick={() => fetchMasajes()} 
                    className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded inline-flex items-center"
                  >
                    <FiRefreshCw className="mr-2" />
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {loadingState === 'success' && masajesPreview.map((service, index) => (
              <motion.div
                key={service.id}
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="relative h-64">
                  <Image
                    src={service.imagen_url || '/images/masaje-default.jpg'}
                    alt={service.nombre}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index < 3}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{service.nombre}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {service.descripcion_corta || service.descripcion || 'Servicio de masaje profesional'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-teal-600 font-bold">${service.precio}</span>
                    <span className="text-gray-500 flex items-center">
                      <FiClock className="mr-1" /> {service.duracion} min
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {loadingState === 'success' && masajesPreview.length > 0 && (
            <motion.div
              className="text-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link
                href="/productos"
                className="text-teal-600 font-medium hover:text-teal-700 transition-colors duration-200 inline-flex items-center"
                prefetch
              >
                Ver todos los servicios
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background text-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">¿Listo para relajarte?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Reserva tu sesión ahora y comienza tu viaje hacia el bienestar y la relajación.
            </p>
            <Link
              href="/reservas"
              className="bg-card-background text-heading-text px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-100 transition-colors duration-300 inline-flex items-center space-x-2 border border-teal-600"
              prefetch
            >
              <FiCalendar className="h-5 w-5" />
              <span>Reserva tu Cita</span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}