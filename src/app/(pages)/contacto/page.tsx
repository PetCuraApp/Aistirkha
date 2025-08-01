'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiMapPin, FiPhone, FiMail, FiClock, FiSend, FiCheckCircle } from 'react-icons/fi';

const contactFormSchema = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  email: z.string().email({ message: 'Ingrese un email válido' }),
  telefono: z.string().min(8, { message: 'Ingrese un número de teléfono válido' }),
  asunto: z.string().min(3, { message: 'El asunto debe tener al menos 3 caracteres' }),
  mensaje: z.string().min(10, { message: 'El mensaje debe tener al menos 10 caracteres' }),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      nombre: '',
      email: '',
      telefono: '',
      asunto: '',
      mensaje: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Aquí se implementaría la lógica para enviar el formulario
      // Por ejemplo, usando un servicio como EmailJS, Formspree, o una API personalizada
      
      // Simulamos una respuesta exitosa después de 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSuccess(true);
      reset();
      
      // Resetear el estado de éxito después de 5 segundos
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (error) {
      setErrorMessage('Hubo un error al enviar el mensaje. Por favor, inténtelo de nuevo.');
      console.error('Error al enviar el formulario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contacto</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Estamos aquí para responder a tus preguntas y ayudarte a programar tu próxima sesión de masaje.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Información de contacto */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Información de Contacto</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FiMapPin className="h-6 w-6 text-teal-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Dirección</h3>
                  <p className="mt-1 text-gray-600">Av. Coronel Santiago Bueras 1070, Valdivia, Chile</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FiPhone className="h-6 w-6 text-teal-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Teléfono</h3>
                  <p className="mt-1 text-gray-600">+569 90658190</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FiMail className="h-6 w-6 text-teal-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Email</h3>
                  <p className="mt-1 text-gray-600">aistirkha@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FiClock className="h-6 w-6 text-teal-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Horario de Atención</h3>
                  <div className="mt-1 text-gray-600">
                    <p>Lunes a Viernes: 9:00 AM - 7:00 PM</p>
      
                  </div>
                </div>
              </div>
            </div>

            
          </motion.div>

          {/* Formulario de contacto */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Envíanos un Mensaje</h2>
            
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-md p-6 text-center"
              >
                <FiCheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-green-800 mb-2">¡Mensaje Enviado!</h3>
                <p className="text-green-700">
                  Gracias por contactarnos. Nos pondremos en contacto contigo lo antes posible.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    {...register('nombre')}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${errors.nombre ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Tu nombre"
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      {...register('email')}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="tu@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      {...register('telefono')}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${errors.telefono ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Tu número de teléfono"
                    />
                    {errors.telefono && (
                      <p className="mt-1 text-sm text-red-600">{errors.telefono.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="asunto" className="block text-sm font-medium text-gray-700 mb-1">
                    Asunto
                  </label>
                  <input
                    type="text"
                    id="asunto"
                    {...register('asunto')}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${errors.asunto ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Asunto de tu mensaje"
                  />
                  {errors.asunto && (
                    <p className="mt-1 text-sm text-red-600">{errors.asunto.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje
                  </label>
                  <textarea
                    id="mensaje"
                    rows={5}
                    {...register('mensaje')}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${errors.mensaje ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Escribe tu mensaje aquí..."
                  ></textarea>
                  {errors.mensaje && (
                    <p className="mt-1 text-sm text-red-600">{errors.mensaje.message}</p>
                  )}
                </div>

                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-teal-500 text-white py-3 px-4 rounded-md hover:bg-teal-600 transition-colors duration-200 flex items-center justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FiSend className="mr-2" />
                      Enviar Mensaje
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>

        {/* Mapa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="aspect-w-16 aspect-h-9 h-96 w-full">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2804.6570506888197!2d-73.24179662419326!3d-39.82990835193341!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9615ee67ba399b91%3A0x10acba5ea362b716!2sCoronel%20Santiago%20Bueras%201070%2C%20Valdivia%2C%20Los%20R%C3%ADos!5e1!3m2!1ses-419!2scl!4v1754075384306!5m2!1ses-419!2scl"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              title="Ubicación de Aistirkha"
            ></iframe>
          </div>
        </motion.div>
      </div>
    </div>
  );
}