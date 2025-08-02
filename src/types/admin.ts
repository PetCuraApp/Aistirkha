// RUTA: src/types/admin.ts

export type Reserva = {
  id: string;
  usuario_id: string | null; // Puede ser nulo para invitados
  masaje_id: number; // Suponiendo que es un número
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  creada_en: string;
  usuario?: {
    nombre: string;
    email: string;
    telefono: string;
  } | null;
  masaje?: {
    nombre: string;
    precio: number;
    duracion: number;
  } | null;
  nombre_invitado?: string | null;
  email_invitado?: string | null;
  telefono_invitado?: string | null;
};