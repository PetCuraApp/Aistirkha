export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          email: string;
          nombre: string;
          apellido: string;
          fecha_nacimiento: string | null;
          sexo: string | null;
          peso: number | null;
          altura: number | null;
          rol: 'admin' | 'cliente';
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nombre: string;
          apellido: string;
          fecha_nacimiento?: string | null;
          sexo?: string | null;
          peso?: number | null;
          altura?: number | null;
          rol?: 'admin' | 'cliente';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nombre?: string;
          apellido?: string;
          fecha_nacimiento?: string | null;
          sexo?: string | null;
          peso?: number | null;
          altura?: number | null;
          rol?: 'admin' | 'cliente';
          created_at?: string;
        };
      };
      masajes: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string;
          duracion: number;
          precio: number;
          imagen_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion: string;
          duracion: number;
          precio: number;
          imagen_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string;
          duracion?: number;
          precio?: number;
          imagen_url?: string | null;
          created_at?: string;
        };
      };
      reservas: {
        Row: {
          id: string;
          usuario_id: string | null;
          masaje_id: string;
          fecha: string;
          hora: string;
          estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
          nombre_invitado: string | null;
          email_invitado: string | null;
          telefono_invitado: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          usuario_id?: string | null;
          masaje_id: string;
          fecha: string;
          hora: string;
          estado?: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
          nombre_invitado?: string | null;
          email_invitado?: string | null;
          telefono_invitado?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string | null;
          masaje_id?: string;
          fecha?: string;
          hora?: string;
          estado?: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
          nombre_invitado?: string | null;
          email_invitado?: string | null;
          telefono_invitado?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};