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
  fecha: z.date(),
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
  const supabase = createClient();
  const [masajes, setMasajes] = useState<Masaje[]>([]);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);

  // Formulario
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    getValues,
    trigger,
    reset
  } = useForm<ReservaFormData>({
    resolver: zodResolver(reservaSchema),
    defaultValues: {
      tipoMasaje: '',
      fecha: undefined,
      hora: '',
      nombre: '',
      email: '',
      telefono: '',
      comentarios: '',
      metodoPago: undefined as any,
    },
  });

  // Cargar masajes y usuario
  useEffect(() => {
    const fetchMasajes = async () => {
      const { data, error } = await supabase.from('masajes').select('*');
      if (!error) setMasajes(data as Masaje[]);
    };
    fetchMasajes();
    const getUser = async () => {
      const session = await getSessionClient();
      setUser(session?.user ?? null);
      if (session?.user) {
        const details = await getUserDetailsClient();
        setUserDetails(details);
        setValue('nombre', details?.full_name || '');
        setValue('email', details?.email || '');
        setValue('telefono', details?.telefono || '');
      }
    };
    getUser();
  }, [supabase, setValue]);

  // Actualizar horarios disponibles según la fecha
  useEffect(() => {
    if (!selectedDate) return;
    const fetchReservas = async () => {
      const { data, error } = await supabase
        .from('reservas')
        .select('hora')
        .eq('fecha', format(selectedDate, 'yyyy-MM-dd'));
      const reservadas = (data || []).map((r: any) => r.hora);
      // Horarios cada 5 minutos de 9:00 a 19:00
      const times: string[] = [];
      for (let h = 9; h < 19; h++) {
        for (let m = 0; m < 60; m += 5) {
          const t = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          if (!reservadas.includes(t)) times.push(t);
        }
      }
      setAvailableTimes(times);
    };
    fetchReservas();
  }, [selectedDate, supabase]);

  // Validación condicional para invitados
  const validateGuestFields = (data: ReservaFormData) => {
    if (user) return true;
    if (!data.nombre) return { path: 'nombre', message: 'El nombre es requerido.' };
    if (!data.email) return { path: 'email', message: 'El email es requerido.' };
    if (!data.telefono) return { path: 'telefono', message: 'El teléfono es requerido.' };
    return true;
  };

  // Enviar reserva
  const onSubmit = async (data: ReservaFormData) => {
    setLoading(true);
    setError(null);
    // Validación extra para invitados
    const guestValidation = validateGuestFields(data);
    if (guestValidation !== true) {
      setError((guestValidation as any).message);
      setLoading(false);
      return;
    }
    try {
      const insertData: any = {
        masaje_id: data.tipoMasaje,
        fecha: format(data.fecha, 'yyyy-MM-dd'),
        hora: data.hora,
        estado: 'pendiente',
        created_at: new Date().toISOString(),
        metodo_pago: data.metodoPago,
        comentarios: data.comentarios,
      };
      if (user) {
        insertData.usuario_id = user.id;
      } else {
        insertData.email_invitado = data.email;
        insertData.nombre_invitado = data.nombre;
        insertData.telefono_invitado = data.telefono;
      }
      const { error: insertError } = await supabase.from('reservas').insert([insertData]);
      if (insertError) throw insertError;
      setSuccess(true);
      reset();
      setStep(1);
    } catch (e: any) {
      setError('Error al reservar. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizado de pasos
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Reserva tu hora</h1>
      {success && (
        <div className="flex flex-col items-center text-green-600 mb-4">
          <FiCheckCircle size={48} />
          <p className="mt-2">¡Reserva realizada con éxito!</p>
        </div>
      )}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {!success && (
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Paso 1: Selección de masaje */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <label className="block mb-2 font-semibold">Tipo de masaje</label>
              <select {...register('tipoMasaje')} className="w-full border rounded p-2 mb-4">
                <option value="">Selecciona un masaje</option>
                {masajes.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre} - ${m.precio}</option>
                ))}
              </select>
              {errors.tipoMasaje && <span className="text-red-500 text-sm">{errors.tipoMasaje.message as string}</span>}
              <button type="button" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={async () => {
                const valid = await trigger('tipoMasaje');
                if (valid) setStep(2);
              }}>Siguiente</button>
            </motion.div>
          )}

          {/* Paso 2: Selección de fecha y hora */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <label className="block mb-2 font-semibold">Selecciona la fecha y hora</label>
              <div className="flex gap-4 mb-4">
                <Controller
                  control={control}
                  name="fecha"
                  render={({ field }) =>
                    React.createElement(DatePicker as any, {
                      ...field,
                      selected: selectedDate,
                      onChange: (date: Date | null) => {
                        setSelectedDate(date);
                        setValue('fecha', date as Date);
                        setValue('hora', '');
                        setSelectedTime('');
                      },
                      minDate: new Date(),
                      dateFormat: 'yyyy-MM-dd',
                      locale: es,
                      className: 'border rounded p-2',
                      placeholderText: 'Selecciona fecha',
                    })
                  }
                />
                <div>
                  <label className="block text-sm mb-1">Hora</label>
                  <select
                    className="border rounded p-2"
                    value={selectedTime}
                    onChange={e => {
                      setSelectedTime(e.target.value);
                      setValue('hora', e.target.value);
                    }}
                    disabled={!selectedDate}
                  >
                    <option value="">Selecciona hora</option>
                    {availableTimes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(errors.fecha || errors.hora) && <span className="text-red-500 text-sm">{(errors.fecha?.message || errors.hora?.message) as string}</span>}
              <div className="flex justify-between mt-4">
                <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => setStep(1)}>Atrás</button>
                <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded" onClick={async () => {
                  const valid = await trigger(['fecha', 'hora']);
                  if (valid && selectedTime) setStep(3);
                }}>Siguiente</button>
              </div>
            </motion.div>
          )}

          {/* Paso 3: Datos personales y pago */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {!user && (
                <>
                  <label className="block mb-2 font-semibold">Nombre</label>
                  <input {...register('nombre')} className="w-full border rounded p-2 mb-2" />
                  {errors.nombre && <span className="text-red-500 text-sm">{errors.nombre.message as string}</span>}
                  <label className="block mb-2 font-semibold">Email</label>
                  <input {...register('email')} className="w-full border rounded p-2 mb-2" />
                  {errors.email && <span className="text-red-500 text-sm">{errors.email.message as string}</span>}
                  <label className="block mb-2 font-semibold">Teléfono</label>
                  <input {...register('telefono')} className="w-full border rounded p-2 mb-2" />
                  {errors.telefono && <span className="text-red-500 text-sm">{errors.telefono.message as string}</span>}
                </>
              )}
              <label className="block mb-2 font-semibold">Comentarios (opcional)</label>
              <textarea {...register('comentarios')} className="w-full border rounded p-2 mb-2" />
              <label className="block mb-2 font-semibold">Método de pago</label>
              <select {...register('metodoPago')} className="w-full border rounded p-2 mb-2">
                <option value="">Selecciona método de pago</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="efectivo">Efectivo</option>
              </select>
              {errors.metodoPago && <span className="text-red-500 text-sm">{errors.metodoPago.message as string}</span>}
              <div className="flex justify-between mt-4">
                <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => setStep(2)}>Atrás</button>
                <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded" onClick={async () => {
                  const valid = await trigger();
                  if (valid) setStep(4);
                }}>Siguiente</button>
              </div>
            </motion.div>
          )}

          {/* Paso 4: Resumen y confirmación */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-xl font-semibold mb-4">Resumen de la reserva</h2>
              <ul className="mb-4">
                <li><b>Masaje:</b> {masajes.find(m => m.id == getValues('tipoMasaje'))?.nombre}</li>
                <li><b>Fecha:</b> {getValues('fecha') ? format(getValues('fecha') as Date, 'yyyy-MM-dd') : ''}</li>
                <li><b>Hora:</b> {getValues('hora')}</li>
                {!user && <>
                  <li><b>Nombre:</b> {getValues('nombre')}</li>
                  <li><b>Email:</b> {getValues('email')}</li>
                  <li><b>Teléfono:</b> {getValues('telefono')}</li>
                </>}
                <li><b>Método de pago:</b> {getValues('metodoPago')}</li>
                {getValues('comentarios') && <li><b>Comentarios:</b> {getValues('comentarios')}</li>}
              </ul>
              <div className="flex justify-between">
                <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => setStep(3)}>Atrás</button>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded flex items-center" disabled={loading}>
                  {loading ? 'Reservando...' : 'Confirmar reserva'}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      )}
    </div>
  );
}