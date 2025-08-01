'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiAward, FiHeart, FiUsers, FiThumbsUp } from 'react-icons/fi';

const teamMembers = [
  {
    id: 1,
    name: 'Katherine Quiroz',
    role: 'Fundadora & Terapeuta',
    bio: 'Con más de 7 años de experiencia en masajes terapéuticos, Katherine fundó Aistirkha con la visión de crear un espacio dedicado al bienestar integral.',
    image: '/images/katherine.jpg',
  },

];

const values = [
  {
    icon: <FiHeart className="h-8 w-8 text-teal-500" />,
    title: 'Pasión por el Bienestar',
    description: 'Nos dedicamos a mejorar la calidad de vida de nuestros clientes a través de técnicas de masaje personalizadas.',
  },
  {
    icon: <FiAward className="h-8 w-8 text-teal-500" />,
    title: 'Excelencia Profesional',
    description: 'Nuestro equipo está formado por terapeutas certificados con amplia experiencia y formación continua.',
  },
  {
    icon: <FiUsers className="h-8 w-8 text-teal-500" />,
    title: 'Atención Personalizada',
    description: 'Cada tratamiento se adapta a las necesidades específicas de cada cliente, garantizando resultados óptimos.',
  },
  {
    icon: <FiThumbsUp className="h-8 w-8 text-teal-500" />,
    title: 'Compromiso con la Calidad',
    description: 'Utilizamos técnicas y productos naturales, aprobechando las propiedades y el poder de las plantas medicinales, para ofrecer la mejor experiencia posible.',
  },
];

export default function NosotrosPage() {
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Sección de Introducción */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sobre Nosotros</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre quiénes somos y nuestra pasión por el bienestar y la salud a través del arte del masaje terapéutico.
          </p>
        </motion.div>

        {/* Historia */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20"
        >
          <div className="relative h-96 rounded-lg overflow-hidden shadow-xl">
            <Image
              src="/images/masaje1.png "
              alt="Historia de Aistirkha Massage"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Nuestra Historia</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Aistirkha nació en 2018,con una visión clara: crear un espacio donde las personas pudieran encontrar alivio, relajación y bienestar a través de técnicas de masaje profesionales y personalizadas.
              </p>
              <p>
                Comenzo con masaje a domicilio. Actualmente contamos un espacio acogedor para realizar diferentes tipos de masajes. Manteniendo siempre la esencia y los valores que nos definen: profesionalidad, atención personalizada y pasión por el bienestar.
              </p>
              <p>
                A lo largo de estos años, hemos tenido el privilegio de ayudar a miles de clientes a mejorar su calidad de vida, aliviar dolores crónicos y encontrar momentos de paz en medio de sus ajetreadas vidas.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Misión y Visión */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20"
        >
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="bg-teal-100 text-teal-500 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Nuestra Misión
            </h2>
            <p className="text-gray-600">
              Proporcionar servicios de masaje terapéutico, adaptados a las necesidades individuales de cada cliente, para mejorar su bienestar físico y emocional. Donde cada persona se sienta valorada y atendida con el máximo cuidado y respeto.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="bg-teal-100 text-teal-500 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </span>
              Nuestra Visión
            </h2>
            <p className="text-gray-600">
              Ser reconocidos por nuestras terapias manuales y masajes terapéuticos, destacando por la excelencia en el servicio, y el impacto positivo en la salud y bienestar de nuestra comunidad. Aspiramos a expandir nuestro alcance para llevar los beneficios del masaje terapéutico a más personas, manteniendo siempre nuestros estándares de calidad y atención personalizada.
            </p>
          </div>
        </motion.div>

        {/* Valores */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Nuestros Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 text-center"
              >
                <div className="flex justify-center mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Equipo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Nuestro Equipo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative h-64">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="rounded-t-lg"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-teal-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        
      </div>
    </div>
  );
}