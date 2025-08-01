'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/client';
import { getSessionClient, getUserDetailsClient } from '@/lib/authClient';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import { format, addDays, setHours, setMinutes, isAfter, isBefore, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiCalendar, FiClock, FiUser, FiMail, FiPhone, FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import 'react-datepicker/dist/react-datepicker.css';

type Masaje = {
  id: string;
  nombre: string;
  descripcion_corta: string;
  duracion: number;
  precio: number;
  imagen_url: string;
};

// Horarios disponibles (9:00 AM a 7:00 PM)
const horariosDisponibles = Array.from({ length: 11 }, (_, i) => {
  const hour = i + 9;
  return {
    value: `${hour}:00`,
    label: `${hour}:00 ${hour < 12 ? 'AM' : 'PM'}`.replace('12:00 PM', '12:00 PM'),
  };
});

// Esquema de validación para el formulario
const reservaSchema = z.object({
  tipoMasaje: z.string().min(1, { message: 'Seleccione un tipo de masaje' }),
  fecha: z.date({
    required_error: 'Seleccione una fecha',
    invalid_type_error: 'Fecha inválida',
  }),
  hora: z.string().min(1, { message: 'Seleccione una hora' }),
  nombre: z.string().optional(),
  email: z.string().optional(),
  telefono: z.string().optional(),
  comentarios: z.string().optional(),
  metodoPago: z.enum(['tarjeta', 'efectivo'], { message: 'Seleccione un método de pago' }),
});

// Creamos un contexto para saber si el usuario está logueado
const UserContext = createContext<{ isLoggedIn: boolean }>({ isLoggedIn: false });

type ReservaFormData = z.infer<typeof reservaSchema>;

// Esquema de validación condicional que se aplicará solo si el usuario no está logueado
const validarCamposInvitado = (data: ReservaFormData, isLoggedIn: boolean) => {
  // Si el usuario está logueado, no necesitamos validar estos campos
  if (isLoggedIn) return true;
  
  // Si no está logueado, validamos que haya completado los campos
  if (!data.nombre) {
    return { path: 'nombre', message: 'El nombre es requerido si no estás logueado.' };
  }
  if (!data.email) {
    return { path: 'email', message: 'El email es requerido si no estás logueado.' };
  }
  if (!data.telefono) {
    return { path: 'telefono', message: 'El teléfono es requerido si no estás logueado.' };
  }
  
  return true;
};

export default function ReservasPage() {
  // ...existing hooks y efectos...

  // Función para manejar el envío del formulario
  const onSubmit = async (data: ReservaFormData) => {
    setIsSubmitting(true);
    if (!isLoggedIn) {
      const validacion = validarCamposInvitado(data, isLoggedIn);
      if (validacion !== true) {
        alert(`Error de validación: ${validacion.message}`);
        setIsSubmitting(false);
        return;
      }
    }
    try {
      if (!data.tipoMasaje || !data.fecha || !data.hora) {
        alert('Por favor completa todos los campos requeridos.');
        setIsSubmitting(false);
        return;
      }
      console.log('Datos recibidos en submit:', data);
      const fechaHora = new Date(data.fecha);
      const [hours, minutes] = data.hora.split(':').map(Number);
      fechaHora.setHours(hours, minutes, 0, 0);
      console.log('Fecha y hora formateada:', fechaHora.toISOString());
      const reservaData: any = {
        // Siempre convertir el id del masaje a número
        masaje_id: Number(data.tipoMasaje),
        fecha: fechaHora.toISOString(),
        estado: 'confirmada',
        hora: data.hora,
      };
      if (isLoggedIn && userSession?.user) {
        reservaData.usuario_id = userSession.user.id;
      } else {
        reservaData.nombre_invitado = data.nombre;
        reservaData.email_invitado = data.email;
        reservaData.telefono_invitado = data.telefono;
        reservaData.usuario_id = null;
      }
      console.log('Datos a insertar en Supabase:', reservaData);
      const supabase = createClient();
      const { error } = await supabase
        .from('reservas')
        .insert(reservaData);
      if (error) {
        console.error('Error Supabase:', error);
        let mensajeError = 'Ha ocurrido un error al procesar tu reserva. Por favor, intenta nuevamente.';
        if (error.code === '23505') {
          mensajeError = 'Ya existe una reserva para esta fecha y hora. Por favor, selecciona otro horario.';
        } else if (error.code === '23503') {
          mensajeError = 'El tipo de masaje seleccionado no está disponible. Por favor, selecciona otro.';
        } else if (error.message) {
          mensajeError = `Error: ${error.message}`;
        }
        alert(mensajeError);
        setIsSubmitting(false);
        return;
      }
      setReservaExitosa(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error al procesar la reserva:', error);
      alert('Ha ocurrido un error al procesar tu reserva. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const [masajesDisponibles, setMasajesDisponibles] = useState<Masaje[]>([]);
  useEffect(() => {
    async function fetchMasajes() {
      const supabase = createClient();
      const { data, error } = await supabase.from('masajes').select('*').order('id', { ascending: true });
      if (error) {
        console.error('Error fetching masajes:', error);
      } else {
        setMasajesDisponibles((data as unknown as Masaje[]) || []);
      }
    }
    fetchMasajes();
  }, []);
  const searchParams = useSearchParams();
  const masajeIdParam = searchParams.get('masaje');

  const [paso, setPaso] = useState(1);
  const [reservaExitosa, setReservaExitosa] = useState(false);
  const [fechasOcupadas, setFechasOcupadas] = useState<Date[]>([]);
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReservaFormData>({
    resolver: zodResolver(reservaSchema),
    defaultValues: {
      tipoMasaje: masajeIdParam || '',
      metodoPago: 'efectivo',
    },
  });

  const tipoMasajeSeleccionado = watch('tipoMasaje');
  const fechaSeleccionada = watch('fecha');

  // Efecto para cargar fechas y horas ocupadas (simulado)
  useEffect(() => {
    // Simulación de fechas ocupadas (en un caso real, esto vendría de la base de datos)
    const fechasSimuladas = [
      new Date(2023, 11, 25), // 25 de diciembre
      new Date(2024, 0, 1),  // 1 de enero
      new Date(2024, 4, 1),  // 1 de mayo
    ];
    setFechasOcupadas(fechasSimuladas);

    // Si hay un masaje preseleccionado desde la URL
    if (masajeIdParam) {
      setValue('tipoMasaje', masajeIdParam);
    }
  }, [masajeIdParam, setValue]);
  
  // Efecto para cargar los datos del usuario si está logueado
  useEffect(() => {
    async function cargarDatosUsuario() {
      try {
        console.log('Verificando sesión de usuario en reservas/page.tsx');
        const session = await getSessionClient();
        if (session?.user) {
          console.log('Sesión encontrada:', session.user.id);
          setIsLoggedIn(true);
          setUserSession(session);
          console.log('Obteniendo detalles del usuario...');
          const userDetails = await getUserDetailsClient();
          // Validar que userDetails tenga las propiedades esperadas
          if (userDetails && typeof userDetails === 'object' && 'nombre' in userDetails) {
            const safeUser = userDetails as any;
            setValue('nombre', safeUser.nombre || session.user.user_metadata?.full_name || '');
            setValue('email', safeUser.email || session.user.email || '');
            setValue('telefono', safeUser.telefono || session.user.user_metadata?.phone || '');
            console.log('Datos del usuario cargados automáticamente:', safeUser);
          } else {
            setValue('nombre', session.user.user_metadata?.full_name || '');
            setValue('email', session.user.email || '');
            setValue('telefono', session.user.user_metadata?.phone || '');
            console.log('Datos de autenticación cargados automáticamente');
          }
        } else {
          console.log('No se encontró sesión de usuario');
          setIsLoggedIn(false);
          setUserSession(null);
        }
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        setIsLoggedIn(false);
        setUserSession(null);
      }
    }
    cargarDatosUsuario();
  }, [setValue]);

  // Efecto para cargar horas ocupadas cuando se selecciona una fecha
  useEffect(() => {
    if (fechaSeleccionada) {
      // Simulación de horas ocupadas para la fecha seleccionada (en un caso real, esto vendría de la base de datos)
      const horasSimuladas = ['10:00', '14:00', '16:00'];
      setHorasOcupadas(horasSimuladas);
    }
  }, [fechaSeleccionada]);

  // Función para filtrar fechas disponibles en el calendario
  const filtrarFechasDisponibles = (date: Date) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // No permitir fechas pasadas ni fechas ocupadas
    const esFechaValida = isAfter(date, hoy) && !fechasOcupadas.some(fechaOcupada => 
      fechaOcupada.getDate() === date.getDate() && 
      fechaOcupada.getMonth() === date.getMonth() && 
      fechaOcupada.getFullYear() === date.getFullYear()
    );

    // No permitir domingos
    return esFechaValida && date.getDay() !== 0;
  };

  // Función para avanzar al siguiente paso
  const avanzarPaso = () => {
    setPaso(paso + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para retroceder al paso anterior
  const retrocederPaso = () => {
    setPaso(paso - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para manejar el envío del formulario

  // Obtener el masaje seleccionado
  const masajeSeleccionado = masajesDisponibles.find(m => String(m.id) === String(tipoMasajeSeleccionado));

  // Renderizar la confirmación de reserva exitosa
  if (reservaExitosa) {
    return (
      <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full text-center"
        >
          <div className="flex justify-center mb-6">
            <FiCheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Reserva Confirmada!</h1>
          <p className="text-xl text-gray-600 mb-6">
            Tu reserva ha sido procesada exitosamente. En breve te contactaremos para confirmar tu cita.
          </p>
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles de la Reserva:</h2>
            <div className="space-y-3">
              <p className="flex items-center text-gray-700">
                <FiUser className="mr-2 text-teal-500" /> 
                <span className="font-medium">Nombre:</span> 
                <span className="ml-2">{watch('nombre')}</span>
              </p>
              <p className="flex items-center text-gray-700">
                <FiCalendar className="mr-2 text-teal-500" /> 
                <span className="font-medium">Fecha:</span> 
                <span className="ml-2">{fechaSeleccionada ? format(fechaSeleccionada, 'dd/MM/yyyy', { locale: es }) : ''}</span>
              </p>
              <p className="flex items-center text-gray-700">
                <FiClock className="mr-2 text-teal-500" /> 
                <span className="font-medium">Hora:</span> 
                <span className="ml-2">{watch('hora')}</span>
              </p>
              <p className="flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 3l-6 6m0 0V4m0 5h5M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
                <span className="font-medium">Servicio:</span> 
                <span className="ml-2">{masajeSeleccionado?.nombre}</span>
              </p>
              <p className="flex items-center text-gray-700">
                <FiCreditCard className="mr-2 text-teal-500" /> 
                <span className="font-medium">Método de Pago:</span> 
                <span className="ml-2">{watch('metodoPago') === 'tarjeta' ? 'Tarjeta de Crédito/Débito' : 'Efectivo'}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="bg-gray-100 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              Volver al Inicio
            </a>
            
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Reserva tu Sesión de Masaje</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Completa el formulario para agendar tu próxima cita y comenzar tu camino hacia el bienestar.
          </p>
        </motion.div>

        {/* Pasos de la reserva */}
        <div className="mb-12">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`rounded-full h-10 w-10 flex items-center justify-center ${paso >= 1 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <div className={`h-1 w-16 sm:w-24 ${paso >= 2 ? 'bg-teal-500' : 'bg-gray-200'}`}></div>
              <div className={`rounded-full h-10 w-10 flex items-center justify-center ${paso >= 2 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <div className={`h-1 w-16 sm:w-24 ${paso >= 3 ? 'bg-teal-500' : 'bg-gray-200'}`}></div>
              <div className={`rounded-full h-10 w-10 flex items-center justify-center ${paso >= 3 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                3
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-2 text-sm text-gray-600">
            <div className="w-24 text-center">Servicio</div>
            <div className="w-24 text-center">Fecha y Hora</div>
            <div className="w-24 text-center">Datos y Pago</div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          {/* Paso 1: Selección de Masaje */}
          {paso === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6" style={{ color: 'var(--heading-text)' }}>Selecciona el Tipo de Masaje</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {masajesDisponibles.length > 0 ? (
                  masajesDisponibles.map((masaje) => (
                    <div
                      key={masaje.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${tipoMasajeSeleccionado === masaje.id ? 'border-teal-500 bg-teal-50 shadow-md' : 'border-gray-200 hover:border-teal-300 hover:shadow-sm'}`}
                      onClick={() => setValue('tipoMasaje', String(masaje.id))}
                      style={{ borderColor: tipoMasajeSeleccionado === masaje.id ? 'var(--teal-500, #14b8a6)' : 'var(--input-border)' }}
                    >
                      <div className="flex items-center mb-2">
                        <input
                          type="radio"
                          id={`masaje-${masaje.id}`}
                          value={String(masaje.id)}
                          {...register('tipoMasaje')}
                          className="h-4 w-4 text-teal-500 focus:ring-teal-400"
                          checked={tipoMasajeSeleccionado === String(masaje.id)}
                          onChange={() => setValue('tipoMasaje', String(masaje.id))}
                          style={{ accentColor: 'var(--teal-500)' }}
                        />
                        <label htmlFor={`masaje-${masaje.id}`} className="ml-2 text-lg font-medium text-gray-900" style={{ color: 'var(--heading-text)' }}>
                          {masaje.nombre}
                        </label>
                      </div>
                      <p className="text-gray-600 text-sm mb-3" style={{ color: 'var(--gray-600)' }}>{masaje.descripcion_corta}</p>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center text-gray-500" style={{ color: 'var(--gray-500)' }}>
                          <FiClock className="mr-1" /> {masaje.duracion} min
                        </span>
                        <span className="font-semibold text-teal-600" style={{ color: 'var(--teal-500)' }}>${masaje.precio}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Cargando masajes...</p>
                )}
              </div>
              
              {errors.tipoMasaje && (
                <p className="text-red-500 text-sm mb-4">{errors.tipoMasaje.message}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={avanzarPaso}
                  disabled={!tipoMasajeSeleccionado}
                  className={`bg-teal-500 text-white px-6 py-3 rounded-md hover:bg-teal-600 transition-colors duration-200 flex items-center ${!tipoMasajeSeleccionado ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Continuar
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {/* Paso 2: Selección de Fecha y Hora */}
          {paso === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Selecciona Fecha y Hora</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de la Cita
                  </label>
                  <div className="relative">
                    <Controller
                      control={control}
                      name="fecha"
                      render={({ field }) => {
                        return (
                          <DatePicker
                            selected={field.value}
                            onChange={(date) => field.onChange(date)}
                            filterDate={filtrarFechasDisponibles}
                            minDate={new Date()}
                            maxDate={addDays(new Date(), 60)}
                            locale={es}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Selecciona una fecha"
                            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${errors.fecha ? 'border-red-300' : 'border-gray-300'}`}
                          />
                        );
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de la Cita
                  </label>
                  <div className="relative">
                    <select
                      {...register('hora')}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${errors.hora ? 'border-red-300' : 'border-gray-300'}`}
                      defaultValue=""
                    >
                      <option value="" disabled>Selecciona una hora</option>
                      {horariosDisponibles.map((horario) => (
                        <option
                          key={horario.value}
                          value={horario.value}
                          disabled={horasOcupadas.includes(horario.value)}
                        >
                          {horario.label}
                          {horasOcupadas.includes(horario.value) ? ' (Ocupada)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.hora && (
                    <p className="text-red-500 text-sm mt-1">{errors.hora.message}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={avanzarPaso}
                  disabled={!fechaSeleccionada || !watch('hora')}
                  className={`bg-teal-500 text-white px-6 py-3 rounded-md hover:bg-teal-600 transition-colors duration-200 flex items-center ${(!fechaSeleccionada || !watch('hora')) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Continuar
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {/* Paso 3: Datos Personales y Pago */}
          {paso === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Completa tus Datos y Método de Pago</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {isLoggedIn ? (
                  // Si el usuario está logueado, mostrar sus datos en modo de solo lectura
                  <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Información del Usuario</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <FiUser className="text-teal-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-500">Nombre</p>
                          <p className="font-medium">{watch('nombre')}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FiMail className="text-teal-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{watch('email')}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FiPhone className="text-teal-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-500">Teléfono</p>
                          <p className="font-medium">{watch('telefono')}</p>
                        </div>
                      </div>
                    </div>
                    <input type="hidden" {...register('nombre')} />
                    <input type="hidden" {...register('email')} />
                    <input type="hidden" {...register('telefono')} />
                  </div>
                ) : (
                  // Si el usuario no está logueado, mostrar campos para completar
                  <>
                    <div>
                      <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="nombre"
                          {...register('nombre')}
                          className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${errors.nombre ? 'border-red-300' : 'border-gray-300'}`}
                          placeholder="Tu nombre completo"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                          <FiUser />
                        </div>
                      </div>
                      {errors.nombre && (
                        <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="email"
                          {...register('email')}
                          className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                          placeholder="tu@email.com"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                          <FiMail />
                        </div>
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          id="telefono"
                          {...register('telefono')}
                          className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${errors.telefono ? 'border-red-300' : 'border-gray-300'}`}
                          placeholder="Tu número de teléfono"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                          <FiPhone />
                        </div>
                      </div>
                      {errors.telefono && (
                        <p className="text-red-500 text-sm mt-1">{errors.telefono.message}</p>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="metodoPago" className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="pago-tarjeta"
                        value="tarjeta"
                        {...register('metodoPago')}
                        className="h-4 w-4 text-teal-500 focus:ring-teal-400"
                        disabled
                      />
                      <label htmlFor="pago-tarjeta" className="ml-2 text-gray-400">
                        Tarjeta de Crédito/Débito (Próximamente)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="pago-efectivo"
                        value="efectivo"
                        {...register('metodoPago')}
                        className="h-4 w-4 text-teal-500 focus:ring-teal-400"
                      />
                      <label htmlFor="pago-efectivo" className="ml-2 text-gray-700">
                        Pagar en Efectivo (en el local)
                      </label>
                    </div>
                  </div>
                  {errors.metodoPago && (
                    <p className="text-red-500 text-sm mt-1">{errors.metodoPago.message}</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="comentarios" className="block text-sm font-medium text-gray-700 mb-1">
                  Comentarios o Instrucciones Especiales (Opcional)
                </label>
                <textarea
                  id="comentarios"
                  {...register('comentarios')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                  placeholder="¿Alguna información adicional que debamos saber?"
                ></textarea>
              </div>

              {/* Resumen de la reserva */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de la Reserva:</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Servicio:</span>
                    <span className="font-medium">{masajeSeleccionado?.nombre}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium">{fechaSeleccionada ? format(fechaSeleccionada, 'dd/MM/yyyy', { locale: es }) : ''}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Hora:</span>
                    <span className="font-medium">{watch('hora')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Duración:</span>
                    <span className="font-medium">{masajeSeleccionado?.duracion} minutos</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between items-center font-bold">
                      <span>Total:</span>
                      <span className="text-teal-600">${masajeSeleccionado?.precio}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={retrocederPaso}
                  className="bg-gray-100 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors duration-200 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || Object.keys(errors).length > 0}
                  className={`bg-teal-500 text-white px-6 py-3 rounded-md hover:bg-teal-600 transition-colors duration-200 flex items-center ${isSubmitting || Object.keys(errors).length > 0 ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    <>
                      Confirmar Reserva
                      <FiCheckCircle className="ml-2" />
                    </>
                  )}
                </button>
                {isSubmitting && (
                  <p className="text-gray-500 text-sm mt-2">Procesando tu reserva...</p>
                )}
                {!isSubmitting && Object.keys(errors).length > 0 && (
                  <div className="text-red-500 text-sm mt-2">
                    <span>Completa todos los campos requeridos para confirmar la reserva.</span>
                    <ul className="list-disc ml-4">
                      {Object.entries(errors).map(([key, err]: any) => (
                        <li key={key}>{err.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
}