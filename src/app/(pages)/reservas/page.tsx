'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/client';
import { getSessionClient } from '@/lib/authClient';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import { format, addDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiCheckCircle, FiArrowLeft, FiArrowRight, FiCreditCard } from 'react-icons/fi';
import 'react-datepicker/dist/react-datepicker.css';

// Tipos de datos
type Masaje = {
  id: number;
  nombre: string;
  descripcion_corta: string;
  duracion: number;
  precio: number;
  imagen_url: string;
};

type UserDetails = {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  rol: string;
};

// Configuración de horarios
const WORKING_HOURS = {
  start: 9,
  end: 19
};

const TIME_SLOT_INTERVAL = 30;

// Esquema de validación corregido y simplificado
const baseReservaSchema = z.object({
  tipoMasaje: z.number().min(1, 'Seleccione un tipo de masaje'),
  fecha: z.date().refine(date => isAfter(date, new Date()), {
    message: 'La fecha debe ser futura'
  }),
  hora: z.string().min(1, 'Seleccione una hora'),
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(8, 'Mínimo 8 caracteres'),
  comentarios: z.string().max(500, 'Máximo 500 caracteres').optional(),
  metodoPago: z.enum(['efectivo', 'transferencia'])
});

type ReservaFormData = z.infer<typeof baseReservaSchema>;

export default function ReservasPage() {
  const supabase = createClient();
  const [masajes, setMasajes] = useState<Masaje[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors, isValid }
  } = useForm<ReservaFormData>({
    resolver: zodResolver(baseReservaSchema),
    mode: 'onChange',
    defaultValues: {
      tipoMasaje: undefined as any,
      fecha: undefined,
      hora: '',
      nombre: '',
      email: '',
      telefono: '',
      comentarios: '',
      metodoPago: 'efectivo',
    },
  });

  const selectedDate = watch('fecha');
  const tipoMasaje = watch('tipoMasaje');
  const metodoPago = watch('metodoPago');

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar tipos de masaje
        const { data: masajesData, error: masajesError } = await supabase
          .from('masajes')
          .select('*')
          .order('nombre', { ascending: true });
        
        if (!masajesError && masajesData) {
          setMasajes(masajesData.map(m => ({
            ...m,
            id: Number(m.id)
          })));
        }

        // Verificar sesión del usuario
        const session = await getSessionClient();
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Obtener detalles del usuario
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', session.user.email)
            .single();
          
          if (!userError && userData) {
            setUserDetails({
              id: userData.id,
              email: userData.email,
              nombre: userData.nombre,
              telefono: userData.telefono,
              rol: userData.rol
            });
            
            // Establecer valores del formulario
            setValue('nombre', userData.nombre || '');
            setValue('email', session.user.email || '');
            setValue('telefono', userData.telefono || '');
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase, setValue]);

  // Obtener horarios disponibles
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (!selectedDate) return;
      
      try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const { data: existingReservas, error } = await supabase
          .from('reservas')
          .select('hora')
          .eq('fecha', formattedDate);
        
        if (error) throw error;

        const allSlots = generateTimeSlots();
        const reservedTimes = existingReservas?.map(r => r.hora) || [];
        const available = allSlots.filter(slot => !reservedTimes.includes(slot));
        
        setAvailableTimes(available);
      } catch (err) {
        console.error('Error fetching available times:', err);
        setAvailableTimes([]);
      }
    };

    if (selectedDate) {
      fetchAvailableTimes();
    }
  }, [selectedDate, supabase]);

  // Generar franjas horarias
  const generateTimeSlots = () => {
    const slots: string[] = [];
    const startHour = WORKING_HOURS.start;
    const endHour = WORKING_HOURS.end;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += TIME_SLOT_INTERVAL) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  // Validar paso 3 según si el usuario está logueado o no
  const validateStep3 = async () => {
    if (user) {
      return await trigger('metodoPago');
    } else {
      return await trigger(['nombre', 'email', 'telefono', 'metodoPago']);
    }
  };

  // Avanzar al siguiente paso
  const nextStep = async () => {
    let isValid = false;
    
    switch (step) {
      case 1:
        isValid = await trigger('tipoMasaje');
        break;
      case 2:
        isValid = await trigger(['fecha', 'hora']);
        break;
      case 3:
        isValid = await validateStep3();
        break;
      default:
        isValid = false;
    }

    if (isValid) {
      setStep(prev => prev + 1);
    } else {
      if (step === 3 && !metodoPago) {
        setError('Por favor seleccione un método de pago');
      }
    }
  };

  // Enviar formulario
  const onSubmit = async (data: ReservaFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const masajeSeleccionado = masajes.find(m => m.id === data.tipoMasaje);
      if (!masajeSeleccionado) throw new Error('No se encontró el masaje seleccionado');

      const reservaData = {
        masaje_id: data.tipoMasaje,
        fecha: format(data.fecha, 'yyyy-MM-dd'),
        hora: data.hora,
        duracion: masajeSeleccionado.duracion,
        precio: masajeSeleccionado.precio,
        estado: 'pendiente',
        metodo_pago: data.metodoPago,
        comentarios: data.comentarios || null,
        usuario_id: user?.id || null,
        nombre_invitado: !user ? data.nombre : null,
        email_invitado: !user ? data.email : null,
        telefono_invitado: !user ? data.telefono : null,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('reservas')
        .insert(reservaData)
        .select();
      
      if (insertError) throw insertError;

      setSuccess(true);
      reset();
    } catch (err: any) {
      console.error('Error creating reservation:', err);
      setError(err.message || 'Error al realizar la reserva. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retroceder al paso anterior
  const prevStep = () => setStep(prev => prev - 1);

  // Reiniciar formulario
  const resetForm = () => {
    setSuccess(false);
    setStep(1);
    reset();
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden my-8">
      <div className="p-6 md:p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Reserva tu sesión de masaje</h1>
        
        {/* Indicador de pasos */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                ${step === stepNumber ? 'bg-blue-600 text-white' : 
                  step > stepNumber ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {stepNumber}
              </div>
              <span className="text-sm mt-2 text-gray-600">
                {stepNumber === 1 ? 'Servicio' : stepNumber === 2 ? 'Fecha/Hora' : stepNumber === 3 ? 'Datos' : 'Confirmar'}
              </span>
            </div>
          ))}
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Estado de éxito */}
        {success ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <FiCheckCircle className="text-green-600 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Reserva confirmada!</h2>
            <p className="text-gray-600 mb-8">Hemos recibido correctamente tu reserva. En breve nos contactaremos contigo.</p>
            <button
              onClick={resetForm}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
            >
              Hacer otra reserva
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {/* Paso 1: Selección de masaje */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-800">Selecciona tu masaje</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {masajes.map((masaje) => (
                      <div 
                        key={masaje.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all
                          ${tipoMasaje === masaje.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                        onClick={() => {
                          setValue('tipoMasaje', masaje.id);
                          trigger('tipoMasaje');
                        }}
                      >
                        <h3 className="font-medium text-gray-800">{masaje.nombre}</h3>
                        <p className="text-sm text-gray-600 mt-1">{masaje.descripcion_corta}</p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-blue-600 font-medium">${masaje.precio}</span>
                          <span className="text-sm text-gray-500">{masaje.duracion} min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.tipoMasaje && <p className="text-red-500 text-sm">{errors.tipoMasaje.message}</p>}
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!tipoMasaje}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg disabled:bg-gray-400 transition duration-200 flex items-center"
                    >
                      Siguiente <FiArrowRight className="ml-2" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Paso 2: Fecha y hora */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-800">Selecciona fecha y hora</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                      <Controller
                        control={control}
                        name="fecha"
                        render={({ field }) => (
                          <DatePicker
                            selected={field.value}
                            onChange={(date) => {
                              field.onChange(date);
                              setValue('hora', '');
                            }}
                            minDate={new Date()}
                            maxDate={addDays(new Date(), 30)}
                            dateFormat="dd/MM/yyyy"
                            locale={es}
                            placeholderText="Selecciona una fecha"
                            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                      />
                      {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                      <select
                        {...register('hora')}
                        disabled={!selectedDate}
                        className="w-full p-2 border rounded-md disabled:bg-gray-100 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">{selectedDate ? 'Selecciona una hora' : 'Primero selecciona una fecha'}</option>
                        {availableTimes.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      {errors.hora && <p className="text-red-500 text-sm mt-1">{errors.hora.message}</p>}
                    </div>
                  </div>
                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="text-gray-600 hover:text-gray-800 font-medium py-2 px-6 rounded-lg border border-gray-300 hover:border-gray-400 transition duration-200 flex items-center"
                    >
                      <FiArrowLeft className="mr-2" /> Atrás
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!selectedDate || !watch('hora')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg disabled:bg-gray-400 transition duration-200 flex items-center"
                    >
                      Siguiente <FiArrowRight className="ml-2" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Paso 3: Datos personales */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-800">Tus datos</h2>
                  
                  {!user ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                        <input
                          {...register('nombre')}
                          className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Tu nombre"
                        />
                        {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                        <input
                          {...register('email')}
                          type="email"
                          className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="tu@email.com"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                          {...register('telefono')}
                          className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+56 9 1234 5678"
                        />
                        {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono.message}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                          {...register('nombre')}
                          className="w-full p-2 bg-gray-100 rounded-md"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                        <input
                          {...register('email')}
                          className="w-full p-2 bg-gray-100 rounded-md"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                          {...register('telefono')}
                          className="w-full p-2 bg-gray-100 rounded-md"
                          readOnly
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <label className={`border rounded-lg p-4 cursor-pointer transition-all
                        ${watch('metodoPago') === 'transferencia' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                        <input
                          type="radio"
                          {...register('metodoPago')}
                          value="transferencia"
                          className="hidden"
                        />
                        <div className="flex items-center">
                          <FiCreditCard className="text-gray-500 mr-3" />
                          <span>Transferencia</span>
                        </div>
                      </label>
                      <label className={`border rounded-lg p-4 cursor-pointer transition-all
                        ${watch('metodoPago') === 'efectivo' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                        <input
                          type="radio"
                          {...register('metodoPago')}
                          value="efectivo"
                          className="hidden"
                        />
                        <div className="flex items-center">
                          <span className="mr-3">💵</span>
                          <span>Efectivo</span>
                        </div>
                      </label>
                    </div>
                    {errors.metodoPago && <p className="text-red-500 text-sm mt-1">{errors.metodoPago.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios adicionales (opcional)</label>
                    <textarea
                      {...register('comentarios')}
                      rows={3}
                      className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Alergias, lesiones, preferencias especiales..."
                    />
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="text-gray-600 hover:text-gray-800 font-medium py-2 px-6 rounded-lg border border-gray-300 hover:border-gray-400 transition duration-200 flex items-center"
                    >
                      <FiArrowLeft className="mr-2" /> Atrás
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg disabled:bg-gray-400 transition duration-200 flex items-center"
                    >
                      Revisar reserva <FiArrowRight className="ml-2" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Paso 4: Confirmación */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-800">Confirma tu reserva</h2>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <h3 className="font-medium text-lg text-gray-800 border-b pb-2">Detalles de la reserva</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">Servicio:</p>
                        <p className="font-medium">{masajes.find(m => m.id === watch('tipoMasaje'))?.nombre || 'No seleccionado'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">Duración:</p>
                        <p className="font-medium">{masajes.find(m => m.id === watch('tipoMasaje'))?.duracion || '--'} minutos</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">Fecha:</p>
                        <p className="font-medium">
                          {watch('fecha') ? format(watch('fecha'), 'EEEE dd/MM/yyyy', { locale: es }) : 'No seleccionada'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">Hora:</p>
                        <p className="font-medium">{watch('hora') || 'No seleccionada'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">Precio:</p>
                        <p className="font-medium text-blue-600">
                          ${masajes.find(m => m.id === watch('tipoMasaje'))?.precio || '--'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">Método de pago:</p>
                        <p className="font-medium capitalize">
                          {watch('metodoPago') === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Datos de contacto</h4>
                      <p className="text-gray-800">{watch('nombre')}</p>
                      <p className="text-gray-600 text-sm">{watch('email')}</p>
                      <p className="text-gray-600 text-sm">{watch('telefono') || 'No proporcionado'}</p>
                    </div>
                    {watch('comentarios') && (
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Comentarios adicionales</h4>
                        <p className="text-gray-600">{watch('comentarios')}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="text-gray-600 hover:text-gray-800 font-medium py-2 px-6 rounded-lg border border-gray-300 hover:border-gray-400 transition duration-200 flex items-center"
                    >
                      <FiArrowLeft className="mr-2" /> Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg disabled:bg-gray-400 transition duration-200 flex items-center"
                    >
                      {isSubmitting ? 'Confirmando...' : 'Confirmar reserva'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        )}
      </div>
    </div>
  );
}