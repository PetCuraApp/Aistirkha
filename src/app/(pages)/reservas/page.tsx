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
  // ...código de la página de reservas...
}