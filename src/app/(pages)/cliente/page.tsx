'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiCalendar, FiUser, FiEdit, FiTrash2, FiClock, FiMapPin, FiDollarSign } from 'react-icons/fi';
import Link from 'next/link';
import type { Database } from '@/types/supabase';
import { supabase } from '@/utils/supabase/client';
import { getSessionClient, getUserDetailsClient } from '@/lib/authClient';

type Reserva = {
  id: string;
  usuario_id: string;
  masaje_id: string;
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  creada_en: string;
  masaje: {
    nombre: string;
    precio: number;
    duracion: number;
    descripcion: string;
  };
};

type Usuario = {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  rol: 'admin' | 'cliente';
  creado_en: string;
};

type Tab = 'reservas' | 'perfil';

export default function ClientePage() {
  const [tab, setTab] = useState<Tab>('reservas');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
  });
  const router = useRouter();
  

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('Verificando estado de autenticación en cliente/page.tsx');
        // Verificar si el usuario está autenticado usando la función actualizada
        const session = await getSessionClient();
        
        if (!session) {
          console.log('No hay sesión activa, redirigiendo a /auth');
          router.push('/auth');
          return;
        }

        console.log('Sesión activa, obteniendo detalles del usuario');
        // Cargar datos del usuario usando la función actualizada
        const userData = await getUserDetailsClient();

        if (!userData) {
          console.error('No se pudieron obtener los datos del usuario');
          throw new Error('No se pudieron obtener los datos del usuario');
        }

        console.log('Datos del usuario obtenidos:', userData);

        if (
          userData &&
          typeof userData === 'object' &&
          'id' in userData &&
          'email' in userData &&
          'nombre' in userData &&
          'telefono' in userData &&
          'rol' in userData
        ) {
          const safeUser = userData as any;
          setUsuario(safeUser as Usuario);
          setFormData({
            nombre: safeUser.nombre || '',
            telefono: safeUser.telefono || '',
          });
        } else {
          setUsuario(null);
          setFormData({
            nombre: '',
            telefono: '',
          });
        }

        // Cargar reservas del usuario
        loadReservas(session.user.id);
      } catch (err: any) {
        console.error('Error al verificar estado de autenticación:', err);
        setError('Error al cargar datos de usuario');
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [router, supabase]);

  const loadReservas = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Cargando reservas para el usuario:', userId);
      // usuario_id puede ser string | null según el tipo generado
      // usuario_id es string | null en la tabla, pero aquí siempre será string
      // usuario_id es string | null en la tabla, pero aquí siempre será string
      // Solo pasamos string, nunca null
      const { data, error } = await supabase
        .from('reservas')
        .select('*, masajes(nombre, precio, duracion, descripcion_corta)')
        .eq('usuario_id', userId as any)
        .order('fecha', { ascending: true });

      if (error) throw error;
      // Mapear para que 'masaje' apunte a 'masajes'
      const reservasMapeadas = (data || []).map((reserva: any) => ({
        ...reserva,
        masaje: reserva.masajes
      }));
      console.log('Reservas cargadas:', reservasMapeadas.length, 'reservas encontradas');
      setReservas(reservasMapeadas);
    } catch (err: any) {
      console.error('Error al cargar reservas:', err);
      setError(`Error al cargar reservas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usuario) return;
    
    try {
      console.log('Actualizando perfil para el usuario:', usuario.id);
      const { error } = await supabase
        .from('usuarios')
        .update({
          nombre: formData.nombre,
          telefono: formData.telefono,
        } as any)
        .eq('id', usuario.id as any);

      if (error) throw error;

      console.log('Perfil actualizado correctamente');
      // Actualizar el estado del usuario
      setUsuario(prev => prev ? {
        ...prev,
        nombre: formData.nombre,
        telefono: formData.telefono,
      } : null);

      setEditMode(false);
      alert('Perfil actualizado correctamente');
    } catch (err: any) {
      console.error('Error al actualizar perfil:', err);
      alert(`Error al actualizar perfil: ${err.message}`);
    }
  };

  const cancelReserva = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      return;
    }

    try {
      console.log('Cancelando reserva:', id);
      const { error } = await supabase
        .from('reservas')
        .update({ estado: 'cancelada' } as any)
        .eq('id', id as any);

      if (error) throw error;

      console.log('Reserva cancelada correctamente');
      // Actualizar la lista de reservas
      setReservas(reservas.map(reserva => 
        reserva.id === id ? { ...reserva, estado: 'cancelada' } : reserva
      ));

      alert('Reserva cancelada correctamente');
    } catch (err: any) {
      console.error('Error al cancelar reserva:', err);
      alert(`Error al cancelar reserva: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Cerrando sesión desde cliente/page.tsx...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error al cerrar sesión:', error.message);
        throw error;
      }
      
      console.log('Sesión cerrada correctamente');
      router.push('/home');
      router.refresh();
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error.message || error);
    }
  };

  if (loading && !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error && !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md max-w-md">
          <p>{error}</p>
          <button 
            onClick={() => router.push('/auth')} 
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Mi Cuenta</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona tus reservas y datos personales
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setTab('reservas')}
                className={`${tab === 'reservas' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
              >
                <FiCalendar className="mr-2" />
                Mis Reservas
              </button>
              <button
                onClick={() => setTab('perfil')}
                className={`${tab === 'perfil' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
              >
                <FiUser className="mr-2" />
                Mi Perfil
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-4">
            {tab === 'reservas' ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Mis Reservas</h2>
                  <Link 
                    href="/reservas" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                  >
                    <FiCalendar className="mr-2" />
                    Nueva Reserva
                  </Link>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                  </div>
                ) : reservas.length === 0 ? (
                  <div className="text-center py-12">
                    <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes reservas</h3>
                    <p className="mt-1 text-sm text-gray-500">Comienza reservando tu primer masaje.</p>
                    <div className="mt-6">
                      <Link
                        href="/reservas"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                      >
                        <FiCalendar className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Reservar ahora
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reservas.map((reserva) => (
                      <div key={reserva.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className={`px-4 py-5 sm:px-6 ${reserva.estado === 'confirmada' ? 'bg-green-50' : reserva.estado === 'pendiente' ? 'bg-yellow-50' : reserva.estado === 'cancelada' ? 'bg-red-50' : 'bg-blue-50'}`}> 
                          <h3 className="text-lg leading-6 font-medium text-gray-900">{reserva.masaje?.nombre}</h3>
                          {reserva.masaje?.descripcion && (
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">{reserva.masaje.descripcion.substring(0, 100)}...</p>
                          )}
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                          <dl className="sm:divide-y sm:divide-gray-200">
                            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <FiCalendar className="mr-2 text-gray-400" /> Fecha
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {new Date(reserva.fecha).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </dd>
                            </div>
                            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <FiClock className="mr-2 text-gray-400" /> Hora
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {reserva.hora}
                              </dd>
                            </div>
                            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <FiMapPin className="mr-2 text-gray-400" /> Estado
                              </dt>
                              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  reserva.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                                  reserva.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                  reserva.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {reserva.estado === 'confirmada' ? 'Confirmada' :
                                  reserva.estado === 'pendiente' ? 'Pendiente' :
                                  reserva.estado === 'cancelada' ? 'Cancelada' :
                                  'Completada'}
                                </span>
                              </dd>
                            </div>
                            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <FiDollarSign className="mr-2 text-gray-400" /> Precio
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                ${reserva.masaje?.precio.toFixed(2)}
                              </dd>
                            </div>
                          </dl>
                        </div>
                        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                          {(reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && (
                            <button
                              onClick={() => cancelReserva(reserva.id)}
                              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <FiTrash2 className="mr-2" /> Cancelar Reserva
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-lg mx-auto">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Información Personal</h2>
                
                {editMode ? (
                  <form onSubmit={updateProfile} className="space-y-6">
                    <div>
                      <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        id="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={usuario?.email || ''}
                        disabled
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">El email no se puede cambiar</p>
                    </div>

                    <div>
                      <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        id="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                      >
                        Guardar Cambios
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Datos de la cuenta</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Información personal y de contacto</p>
                    </div>
                    <div className="border-t border-gray-200">
                      <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{usuario?.nombre}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Email</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{usuario?.email}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{usuario?.telefono}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Rol</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              usuario?.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {usuario?.rol === 'admin' ? 'Administrador' : 'Cliente'}
                            </span>
                          </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {usuario?.creado_en ? new Date(usuario.creado_en).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            }) : 'N/A'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
                      <button
                        onClick={() => setEditMode(true)}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                      >
                        <FiEdit className="mr-2" /> Editar Perfil
                      </button>
                      <button
                        onClick={handleLogout}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}