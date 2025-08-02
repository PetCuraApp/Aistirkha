// RUTA: app/admin/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiCalendar, FiUsers, FiDollarSign, FiEdit, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import type { Database } from '@/types/supabase';
import { getSessionClient, getUserDetailsClient } from '@/lib/authClient';
import { createClient } from '@/utils/supabase/client';
import ReservasSemanal from '@/app/(pages)/admin/ReservasSemanal';

type Reserva = {
  id: string;
  usuario_id: string;
  masaje_id: string;
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  creada_en: string;
  usuario?: {
    nombre: string;
    email: string;
    telefono: string;
  };
  masaje?: {
    nombre: string;
    precio: number;
    duracion: number;
  };
  nombre_invitado?: string;
  email_invitado?: string;
  telefono_invitado?: string;
};

type Usuario = {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  rol: 'admin' | 'cliente';
  creado_en: string;
};

type Tab = 'reservas' | 'usuarios' | 'masajes';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('reservas');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [masajes, setMasajes] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const session = await getSessionClient();
        if (!session) {
          router.push('/auth');
          return;
        }

        const userData = await getUserDetailsClient();
        if (!userData || (userData as { rol: string }).rol !== 'admin') {
          router.push('/home');
          return;
        }

        setIsAdmin(true);
      } catch (err: any) {
        setError('No tienes permiso para acceder a esta página.');
        setLoading(false);
      }
    };
    checkAdminStatus();
  }, [router]);

  useEffect(() => {
    const loadData = async () => {
      if (!isAdmin) return;
      setLoading(true);
      setError(null);
  
      try {
        const supabaseClient = createClient();
        if (tab === 'reservas') {
          console.log('[AdminPage] Cargando datos de reservas...');
          const { data, error } = await supabaseClient.from('reservas').select(`*, usuario:usuarios(nombre, email, telefono), masaje:masajes(nombre, precio, duracion)`).order('fecha', { ascending: false });
          if (error) throw error;
          console.log('[AdminPage] Reservas cargadas:', data);
          setReservas(data as Reserva[]);
        }
        // ... Lógica para cargar otros tabs si es necesario
      } catch (err: any) {
        const errorMessage = `Error al cargar ${tab}: ${err.message}`;
        console.error(errorMessage, err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
  
    if (isAdmin) {
      loadData();
    }
  }, [tab, isAdmin]);

  const deleteReserva = async (id: string) => {
    try {
      const supabaseClient = createClient();
      const { error } = await supabaseClient.from('reservas').delete().eq('id', id);
      if (error) throw error;
      setReservas(prev => prev.filter(reserva => reserva.id !== id));
    } catch (err: any) {
      alert(`Error al eliminar reserva: ${err.message}`);
    }
  };

  const handleDeleteFromModal = async () => {
    if (!selectedReserva) return;
    if (confirm('¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.')) {
      await deleteReserva(selectedReserva.id);
      setSelectedReserva(null);
    }
  };

  const updateReservaStatus = async (id: string, estado: Reserva['estado']) => {
    try {
      const supabaseClient = createClient();
      const { data: updatedReserva, error } = await supabaseClient.from('reservas').update({ estado }).eq('id', id).select().single();
      if (error) throw error;
      setReservas(prev => prev.map(reserva => (reserva.id === id ? { ...reserva, estado: updatedReserva.estado } : reserva)));
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  if (!isAdmin && loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div></div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center"><div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md max-w-md"><p>{error}</p><button onClick={() => router.push('/home')} className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Volver al inicio</button></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="mt-1 text-sm text-gray-500">Gestiona reservas, usuarios y masajes del sistema</p>
          </div>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex"><button onClick={() => setTab('reservas')} className={`${tab === 'reservas' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}><FiCalendar className="mr-2" />Reservas</button>{/* Otros botones de tabs */}</nav>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div></div>
            ) : error ? (
              <div className="flex justify-center py-12"><div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md max-w-md"><p>{error}</p></div></div>
            ) : tab === 'reservas' ? (
              <ReservasSemanal 
                reservas={reservas} 
                onReservaClick={(reserva) => setSelectedReserva(reserva)} 
              />
            ) : tab === 'usuarios' ? (
              <div>{/* Contenido de la pestaña de Usuarios */}</div>
            ) : tab === 'masajes' ? (
              <div>{/* Contenido de la pestaña de Masajes */}</div>
            ) : null}
          </div>
        </div>
      </motion.div>

      {/* MODAL DE DETALLES DE RESERVA */}
      {selectedReserva && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className={`p-4 rounded-t-lg border-b-4 ${selectedReserva.estado === 'confirmada' ? 'border-green-500' : selectedReserva.estado === 'pendiente' ? 'border-yellow-500' : selectedReserva.estado === 'cancelada' ? 'border-red-500' : 'border-blue-500'}`}>
              <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-gray-800">Detalles de la Reserva</h2><button onClick={() => setSelectedReserva(null)} className="text-gray-400 hover:text-gray-600"><FiX size={24} /></button></div>
              <p className="text-sm text-gray-500">{selectedReserva.masaje?.nombre} - {new Date(selectedReserva.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las {selectedReserva.hora}</p>
            </div>
            <div className="p-6 space-y-4">
              <div><h3 className="font-semibold text-gray-700 mb-2">Cliente</h3><div className="text-sm text-gray-600"><p><strong>Nombre:</strong> {selectedReserva.usuario?.nombre || selectedReserva.nombre_invitado}</p><p><strong>Email:</strong> {selectedReserva.usuario?.email || selectedReserva.email_invitado}</p><p><strong>Teléfono:</strong> {selectedReserva.usuario?.telefono || selectedReserva.telefono_invitado}</p></div></div>
              <div><h3 className="font-semibold text-gray-700 mb-2">Servicio</h3><div className="text-sm text-gray-600"><p><strong>Precio:</strong> ${selectedReserva.masaje?.precio?.toFixed(2) || 'N/A'}</p><p><strong>Duración:</strong> {selectedReserva.masaje?.duracion || 'N/A'} minutos</p></div></div>
            </div>
            <div className="bg-gray-50 p-4 rounded-b-lg flex flex-wrap items-center justify-end gap-2">
              {selectedReserva.estado === 'pendiente' && (<button onClick={() => { updateReservaStatus(selectedReserva.id, 'confirmada'); setSelectedReserva(null); }} className="bg-green-600 text-white px-3 py-2 text-sm rounded-md hover:bg-green-700 flex items-center"><FiCheck className="mr-1" /> Confirmar</button>)}
              {(selectedReserva.estado === 'pendiente' || selectedReserva.estado === 'confirmada') && (<button onClick={() => { updateReservaStatus(selectedReserva.id, 'cancelada'); setSelectedReserva(null); }} className="bg-orange-500 text-white px-3 py-2 text-sm rounded-md hover:bg-orange-600 flex items-center"><FiX className="mr-1" /> Cancelar</button>)}
              {selectedReserva.estado === 'confirmada' && (<button onClick={() => { updateReservaStatus(selectedReserva.id, 'completada'); setSelectedReserva(null); }} className="bg-blue-600 text-white px-3 py-2 text-sm rounded-md hover:bg-blue-700 flex items-center"><FiCheck className="mr-1" /> Completar</button>)}
              <button onClick={handleDeleteFromModal} className="bg-red-600 text-white px-3 py-2 text-sm rounded-md hover:bg-red-700 flex items-center"><FiTrash2 className="mr-1" /> Eliminar</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}