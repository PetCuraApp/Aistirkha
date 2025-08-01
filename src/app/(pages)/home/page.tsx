'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiAward, FiUsers } from 'react-icons/fi';

export default function HomePage() {
  type MasajePreview = {
    id: string;
    nombre: string;
    descripcion_corta?: string;
    descripcion?: string;
    duracion: number;
    precio: number;
    imagen_url?: string;
  };
  const [masajesPreview, setMasajesPreview] = useState<MasajePreview[]>([]);

  useEffect(() => {
    async function fetchMasajesPreview() {
      const supabase = require('@/utils/supabase/client').createClient();
      const { data, error } = await supabase.from('masajes').select('*').order('id', { ascending: true }).limit(3);
      if (!error && data) {
        setMasajesPreview(data);
      }
    }
    fetchMasajesPreview();
  }, []);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
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
          animate={isLoaded ? "visible" : "hidden"}
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
            {masajesPreview.length > 0 ? (
              masajesPreview.map((service, index) => (
                <motion.div
                  key={service.id}
                  className="bg-white rounded-lg overflow-hidden shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <div className="relative h-64">
                    <Image
                      src={service.imagen_url || '/images/masaje1.png'}
                      alt={service.nombre}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">{service.nombre}</h3>
                    <p className="text-gray-600 mb-4">{service.descripcion_corta || service.descripcion || ''}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-teal-600 font-bold">${service.precio}</span>
                      <span className="text-gray-500 flex items-center">
                        <FiClock className="mr-1" /> {service.duracion} min
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <p>Cargando masajes...</p>
            )}
          </div>

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