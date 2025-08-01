'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiDollarSign, FiX, FiCalendar } from 'react-icons/fi';

type MassageCardProps = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion: number;
  imagen: string;
};

export default function MassageCard({ id, nombre, descripcion, precio, duracion, imagen }: MassageCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
      >
        <div className="relative h-48 w-full">
          <Image
            src={imagen}
            alt={nombre}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-xl font-semibold text-gray-800">{nombre}</h3>
          <p className="mt-2 text-gray-600 line-clamp-2">{descripcion}</p>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center text-gray-700">
              <FiClock className="mr-1" />
              <span>{duracion} min</span>
            </div>
            <div className="flex items-center text-gray-700">
              <FiDollarSign className="mr-1" />
              <span>${precio.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm font-medium"
            >
              Ver detalles
            </button>
            <Link
              href={`/reservas?masaje=${id}`}
              className="flex-1 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 transition-colors duration-200 text-center text-sm font-medium flex items-center justify-center"
            >
              <FiCalendar className="mr-2" />
              Reservar
            </Link>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-56 w-full">
                <Image
                  src={imagen}
                  alt={nombre}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                >
                  <FiX className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800">{nombre}</h3>
                <div className="mt-4 flex justify-between">
                  <div className="flex items-center text-gray-700">
                    <FiClock className="mr-2 text-teal-500" />
                    <span>{duracion} minutos</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <FiDollarSign className="mr-1 text-teal-500" />
                    <span className="text-lg font-semibold">${precio.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-medium text-gray-800 mb-2">Descripción</h4>
                  <p className="text-gray-600">{descripcion}</p>
                </div>
                <div className="mt-6">
                  <Link
                    href={`/reservas?masaje=${id}`}
                    className="w-full bg-teal-500 text-white py-3 px-4 rounded-md hover:bg-teal-600 transition-colors duration-200 text-center block font-medium"
                  >
                    Reservar ahora
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}