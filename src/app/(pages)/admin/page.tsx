'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiCalendar, FiUsers, FiDollarSign, FiEdit, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import type { Database } from '@/types/supabase';
import { getSessionClient, getUserDetailsClient } from '@/lib/authClient';
import { createClient } from '@/utils/supabase/client';

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
  // Eliminar reserva por id
  const deleteReserva = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      const supabaseClient = createClient();
      const { error } = await supabaseClient
        .from('reservas')
        .delete()
        .eq('id', id as any);
      if (error) throw error;
      // Actualizar la lista de reservas
      setReservas(reservas.filter(reserva => reserva.id !== id));
      // Limpiar caché
      setCache(prev => ({ ...prev, reservas: reservas.filter(reserva => reserva.id !== id) }));
    } catch (err: any) {
      console.error('Error al eliminar reserva:', err);
      alert(`Error al eliminar reserva: ${err.message}`);
    }
  };
  const [editReserva, setEditReserva] = useState<any | null>(null);
  const [editReservaModalOpen, setEditReservaModalOpen] = useState(false);
  const [editReservaLoading, setEditReservaLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('reservas');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [masajes, setMasajes] = useState<any[]>([]); // tipar luego
  // Caché local para cada tab
  const [cache, setCache] = useState<{ reservas?: Reserva[]; usuarios?: Usuario[]; masajes?: any[] }>({});
  const [editMasaje, setEditMasaje] = useState<any | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Estado para formulario de masaje
  const [nuevoMasaje, setNuevoMasaje] = useState({
    nombre: '',
    descripcion_corta: '',
    descripcion_larga: '',
    precio: '',
    duracion: '',
    imagen: null as File | null,
  });
  const [subiendo, setSubiendo] = useState(false);
  const [errorMasaje, setErrorMasaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        console.log('Verificando estado de administrador en admin/page.tsx');
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

        console.log('Rol del usuario:', userData.rol);
        if (userData.rol !== 'admin') {
          console.log('Usuario no es administrador, redirigiendo a /home');
          // Redirigir a usuarios no administradores
          router.push('/home');
          return;
        }

        console.log('Usuario confirmado como administrador');
        setIsAdmin(true);
        loadData();
      } catch (err: any) {
        console.error('Error al verificar estado de administrador:', err);
        setError('No tienes permiso para acceder a esta página');
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [router, supabase]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    console.log(`Cargando datos de ${tab}...`);

    try {
      const supabaseClient = createClient();
      let data: any, error: any;
      if (tab === 'reservas') {
        ({ data, error } = await supabaseClient
          .from('reservas')
          .select(`
            *,
            usuario:usuarios(nombre, email, telefono),
            masaje:masajes(nombre, precio, duracion)
          `)
          .order('fecha', { ascending: false }));
        if (error) {
          setReservas([]);
          setError('No se pudieron cargar las reservas. Intenta nuevamente.');
        } else if (!data || data.length === 0) {
          setReservas([]);
          setError('No hay reservas disponibles.');
        } else {
          setReservas(data as unknown as Reserva[]);
          setError(null);
          setCache(prev => ({ ...prev, reservas: data as unknown as Reserva[] }));
        }
      } else if (tab === 'usuarios') {
        ({ data, error } = await supabaseClient
          .from('usuarios')
          .select('*')
          .order('created_at', { ascending: false }));
        if (error) {
          setUsuarios([]);
          setError('No se pudieron cargar los usuarios. Intenta nuevamente.');
        } else if (!data || data.length === 0) {
          setUsuarios([]);
          setError('No hay usuarios disponibles.');
        } else {
          setUsuarios(data as unknown as Usuario[]);
          setError(null);
          setCache(prev => ({ ...prev, usuarios: data as unknown as Usuario[] }));
        }
      } else if (tab === 'masajes') {
        ({ data, error } = await supabaseClient
          .from('masajes')
          .select('*')
          .order('created_at', { ascending: false }));
        if (error) {
          setMasajes([]);
          setError('No se pudieron cargar los masajes. Intenta nuevamente.');
        } else if (!data || data.length === 0) {
          setMasajes([]);
          setError('No hay masajes registrados.');
        } else {
          setMasajes(data as unknown as any[]);
          setError(null);
          setCache(prev => ({ ...prev, masajes: data as unknown as any[] }));
        }
      }
    } catch (err: any) {
      console.error(`Error al cargar ${tab}:`, err);
      setError(`Error al cargar ${tab}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      // Si hay datos en caché, usarlos y no recargar
      if (tab === 'reservas' && cache.reservas) {
        setReservas(cache.reservas);
        setLoading(false);
        return;
      }
      if (tab === 'usuarios' && cache.usuarios) {
        setUsuarios(cache.usuarios);
        setLoading(false);
        return;
      }
      if (tab === 'masajes' && cache.masajes) {
        setMasajes(cache.masajes);
        setLoading(false);
        return;
      }
      loadData();
    }
  }, [tab, isAdmin, cache]);

  const updateReservaStatus = async (id: string, estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada') => {
    setLoading(true);
    setError(null);
    console.log(`Cargando datos de ${tab}...`);

    try {
      const supabaseClient = createClient();
      let data: any, error: any;
      if (tab === 'reservas') {
        ({ data, error } = await supabaseClient
          .from('reservas')
          .select(`
            *,
            usuario:usuarios(nombre, email, telefono),
            masaje:masajes(nombre, precio, duracion)
          `)
          .order('fecha', { ascending: false }));
        if (error) throw error;
        setReservas(data as unknown as Reserva[]);
        setCache(prev => ({ ...prev, reservas: data as unknown as Reserva[] }));
      } else if (tab === 'usuarios') {
        ({ data, error } = await supabaseClient
          .from('usuarios')
          .select('*')
          .order('created_at', { ascending: false }));
        if (error) throw error;
        setUsuarios(data as unknown as Usuario[]);
        setCache(prev => ({ ...prev, usuarios: data as unknown as Usuario[] }));
      } else if (tab === 'masajes') {
        ({ data, error } = await supabaseClient
          .from('masajes')
          .select('*')
          .order('created_at', { ascending: false }));
        if (error) {
          setMasajes([]);
          setError('No se pudieron cargar los masajes. Intenta nuevamente.');
        } else if (!data || data.length === 0) {
          setMasajes([]);
          setError('No hay masajes registrados.');
        } else {
          setMasajes(data as unknown as any[]);
          setError(null);
          setCache(prev => ({ ...prev, masajes: data as unknown as any[] }));
        }
      }
    } catch (err: any) {
      console.error(`Error al cargar ${tab}:`, err);
      setError(`Error al cargar ${tab}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (id: string, rol: 'admin' | 'cliente') => {
    try {
      console.log(`Actualizando rol de usuario ${id} a ${rol}...`);
      const supabaseClient = createClient();
      const { error } = await supabaseClient
        .from('usuarios')
        .update({ rol } as any)
        .eq('id', id as any);
  // Eliminar reserva por id
  const deleteReserva = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      const supabaseClient = createClient();
      const { error } = await supabaseClient
        .from('reservas')
        .delete()
        .eq('id', id as any);
      if (error) throw error;
      // Actualizar la lista de reservas
      setReservas(reservas.filter(reserva => reserva.id !== id));
      // Limpiar caché
      setCache(prev => ({ ...prev, reservas: reservas.filter(reserva => reserva.id !== id) }));
    } catch (err: any) {
      console.error('Error al eliminar reserva:', err);
      alert(`Error al eliminar reserva: ${err.message}`);
    }
  };

      if (error) throw error;

      console.log('Rol de usuario actualizado correctamente');
      setUsuarios(usuarios.map(usuario => 
        usuario.id === id ? { ...usuario, rol } : usuario
      ));
    } catch (err: any) {
      console.error('Error al actualizar rol de usuario:', err);
      alert(`Error al actualizar rol: ${err.message}`);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer y eliminará todas sus reservas.')) {
      return;
    }

    try {
      console.log(`Eliminando usuario ${id} y sus reservas asociadas...`);
      const supabaseClient = createClient();
      // Primero eliminar las reservas asociadas al usuario
      console.log('Eliminando reservas asociadas al usuario...');
      const { error: reservasError } = await supabaseClient
        .from('reservas')
        .delete()
        .eq('usuario_id', id as any);

      if (reservasError) throw reservasError;
      console.log('Reservas eliminadas correctamente');

      // Luego eliminar el usuario de la tabla usuarios
      console.log('Eliminando usuario de la tabla usuarios...');
      const { error: usuarioError } = await supabaseClient
        .from('usuarios')
        .delete()
        .eq('id', id as any);

      if (usuarioError) throw usuarioError;
      console.log('Usuario eliminado de la tabla usuarios correctamente');

      // Finalmente, eliminar el usuario de la autenticación
      // Nota: Esto requiere una función en el backend o un trigger en Supabase
      // ya que la eliminación de usuarios de auth requiere permisos especiales
      console.log('Nota: El usuario permanecerá en la tabla de autenticación de Supabase');

      console.log('Usuario eliminado completamente');
      setUsuarios(usuarios.filter(usuario => usuario.id !== id));
    } catch (err: any) {
      console.error('Error al eliminar usuario:', err);
      alert(`Error al eliminar usuario: ${err.message}`);
    }
  };

  if (!isAdmin && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md max-w-md">
          <p>{error}</p>
          <button 
            onClick={() => router.push('/home')} 
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Volver al inicio
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
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona reservas, usuarios y configuraciones del sistema
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
                Reservas
              </button>
              <button
                onClick={() => setTab('usuarios')}
                className={`${tab === 'usuarios' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
              >
                <FiUsers className="mr-2" />
                Usuarios
              </button>
              <button
                onClick={() => setTab('masajes')}
                className={`${tab === 'masajes' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
              >
                <FiDollarSign className="mr-2" />
                Masajes
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
              </div>
            ) : error ? (
              <div className="flex justify-center py-12">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md max-w-md">
                  <p>{error}</p>
                </div>
              </div>
            ) : tab === 'reservas' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reservas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No hay reservas disponibles</td>
                      </tr>
                    ) : (
                      reservas.map((reserva) => (
                        <tr key={reserva.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {reserva.usuario ? (
                              <>
                                <div className="text-sm font-medium text-gray-900">{reserva.usuario?.nombre}</div>
                                <div className="text-sm text-gray-500">{reserva.usuario?.email}</div>
                                <div className="text-sm text-gray-500">{reserva.usuario?.telefono}</div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">Invitado</span>
                                  <span className="text-sm font-medium text-gray-900">{reserva.nombre_invitado || '-'}</span>
                                </div>
                                <div className="text-sm text-gray-500">{reserva.email_invitado || '-'}</div>
                                <div className="text-sm text-gray-500">{reserva.telefono_invitado || '-'}</div>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{reserva.masaje?.nombre}</div>
                            <div className="text-sm text-gray-500">{reserva.masaje?.duracion} minutos</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{new Date(reserva.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                            <div className="text-sm text-gray-500">{reserva.hora}</div>
                            <button className="ml-2 text-blue-600 hover:text-blue-900 text-xs underline" onClick={() => { setEditReserva(reserva); setEditReservaModalOpen(true); }}>Editar</button>
                          </td>
                {/* Modal de edición de reserva */}
                {editReservaModalOpen && editReserva && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                      <h3 className="text-lg font-bold mb-4">Editar fecha y hora de reserva</h3>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setEditReservaLoading(true);
                          try {
                            const { error } = await supabase.from('reservas').update({
                              fecha: editReserva.fecha,
                              hora: editReserva.hora,
                            }).eq('id', editReserva.id);
                            if (error) throw error;
                            setEditReservaModalOpen(false);
                            setEditReserva(null);
                            await loadData();
                          } catch (err: any) {
                            alert('Error al actualizar reserva: ' + (err.message || err));
                          } finally {
                            setEditReservaLoading(false);
                          }
                        }}
                      >
                        <div className="mb-2">
                          <label className="block text-sm font-medium text-gray-700">Fecha</label>
                          <input type="date" className="mt-1 block w-full border rounded px-3 py-2" value={editReserva.fecha?.slice(0,10) || ''} onChange={e => setEditReserva({ ...editReserva, fecha: e.target.value })} required />
                        </div>
                        <div className="mb-2">
                          <label className="block text-sm font-medium text-gray-700">Hora</label>
                          <input type="time" className="mt-1 block w-full border rounded px-3 py-2" value={editReserva.hora || ''} onChange={e => setEditReserva({ ...editReserva, hora: e.target.value })} required />
                        </div>
                        <div className="flex gap-4 mt-4">
                          <button type="submit" disabled={editReservaLoading} className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50">{editReservaLoading ? 'Guardando...' : 'Guardar cambios'}</button>
                          <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => { setEditReservaModalOpen(false); setEditReserva(null); }}>Cancelar</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              reserva.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                              reserva.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                              reserva.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {reserva.estado === 'confirmada' ? 'Confirmada' : reserva.estado === 'pendiente' ? 'Pendiente' : reserva.estado === 'cancelada' ? 'Cancelada' : 'Completada'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <FiDollarSign className="text-gray-400 mr-1" />
                              {reserva.masaje?.precio.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {reserva.estado === 'pendiente' && (
                                <button onClick={() => updateReservaStatus(reserva.id, 'confirmada')} className="text-green-600 hover:text-green-900 flex items-center" title="Confirmar"><FiCheck className="mr-1" /> Confirmar</button>
                              )}
                              {(reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && (
                                <button onClick={() => updateReservaStatus(reserva.id, 'cancelada')} className="text-red-600 hover:text-red-900 flex items-center" title="Cancelar"><FiX className="mr-1" /> Cancelar</button>
                              )}
                              {reserva.estado === 'confirmada' && (
                                <button onClick={() => updateReservaStatus(reserva.id, 'completada')} className="text-blue-600 hover:text-blue-900 flex items-center" title="Marcar como completada"><FiCheck className="mr-1" /> Completar</button>
                              )}
                              <button onClick={() => deleteReserva(reserva.id)} className="text-red-600 hover:text-red-900 flex items-center" title="Eliminar"><FiTrash2 className="mr-1" /> Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : tab === 'usuarios' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de registro</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usuarios.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No hay usuarios disponibles</td>
                      </tr>
                    ) : (
                      usuarios.map((usuario) => (
                        <tr key={usuario.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{usuario.nombre}</div>
                            <div className="text-sm text-gray-500">{usuario.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{usuario.email}</div>
                            <div className="text-sm text-gray-500">{usuario.telefono}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${usuario.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>{usuario.rol === 'admin' ? 'Administrador' : 'Cliente'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(usuario.creado_en).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {usuario.rol === 'cliente' ? (
                                <button onClick={() => updateUserRole(usuario.id, 'admin')} className="text-purple-600 hover:text-purple-900 flex items-center" title="Hacer administrador"><FiEdit className="mr-1" /> Hacer Admin</button>
                              ) : (
                                <button onClick={() => updateUserRole(usuario.id, 'cliente')} className="text-green-600 hover:text-green-900 flex items-center" title="Hacer cliente"><FiEdit className="mr-1" /> Hacer Cliente</button>
                              )}
                              <button onClick={() => deleteUser(usuario.id)} className="text-red-600 hover:text-red-900 flex items-center" title="Eliminar"><FiTrash2 className="mr-1" /> Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : tab === 'masajes' ? (
              <div>
                <h2 className="text-xl font-bold mb-4">Gestionar Masajes</h2>
                {/* Formulario para agregar masaje */}
                <div className="bg-white p-4 rounded shadow mb-6">
                  <p className="mb-2 text-sm text-gray-600">Agrega un nuevo masaje al sistema. Incluye nombre, descripción, precio, duración y una imagen.</p>
                  <form
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setErrorMasaje(null);
                      setSubiendo(true);
                      try {
                        console.log('[Masajes] Iniciando submit...');
                        if (!nuevoMasaje.nombre || !nuevoMasaje.descripcion_corta || !nuevoMasaje.descripcion_larga || !nuevoMasaje.precio || !nuevoMasaje.duracion) {
                          setErrorMasaje('Todos los campos excepto imagen son obligatorios.');
                          setSubiendo(false);
                          return;
                        }
                        let imagen_url = null;
                        if (nuevoMasaje.imagen) {
                          console.log('[Masajes] Subiendo imagen al bucket...');
                          const file = nuevoMasaje.imagen;
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${Date.now()}_${file.name}`;
                          const filePath = `masajes/${fileName}`;
                          console.log('[Masajes] filePath:', filePath);
                          const { data: uploadData, error: uploadError } = await supabase.storage.from('masajes').upload(filePath, file);
                          console.log('[Masajes] uploadData:', uploadData);
                          if (uploadError) {
                            console.error('[Masajes] Error al subir imagen:', uploadError);
                            throw uploadError;
                          }
                          // Obtener URL pública
                          const { data: urlData } = supabase.storage.from('masajes').getPublicUrl(filePath);
                          imagen_url = urlData?.publicUrl;
                          console.log('[Masajes] imagen_url:', imagen_url);
                        }
                        console.log('[Masajes] Insertando masaje en la tabla...');
                        const { error: insertError, data: insertData } = await supabase.from('masajes').insert([
                          {
                            nombre: nuevoMasaje.nombre,
                            descripcion_corta: nuevoMasaje.descripcion_corta,
                            descripcion_larga: nuevoMasaje.descripcion_larga,
                            precio: parseFloat(nuevoMasaje.precio),
                            duracion: parseInt(nuevoMasaje.duracion),
                            imagen_url,
                          },
                        ]);
                        console.log('[Masajes] insertData:', insertData);
                        if (insertError) {
                          console.error('[Masajes] Error al insertar masaje:', insertError);
                          throw insertError;
                        }
                        // Limpiar formulario y recargar
                        setNuevoMasaje({ nombre: '', descripcion_corta: '', descripcion_larga: '', precio: '', duracion: '', imagen: null });
                        await loadData();
                      } catch (err: any) {
                        console.error('[Masajes] Error en submit:', err);
                        setErrorMasaje(err.message || 'Error al crear masaje');
                      } finally {
                        setSubiendo(false);
                      }
                    }}
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre</label>
                      <input type="text" className="mt-1 block w-full border rounded px-3 py-2" value={nuevoMasaje.nombre} onChange={e => setNuevoMasaje({ ...nuevoMasaje, nombre: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Descripción corta</label>
                      <input type="text" className="mt-1 block w-full border rounded px-3 py-2" value={nuevoMasaje.descripcion_corta} onChange={e => setNuevoMasaje({ ...nuevoMasaje, descripcion_corta: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Descripción larga</label>
                      <textarea className="mt-1 block w-full border rounded px-3 py-2" rows={3} value={nuevoMasaje.descripcion_larga} onChange={e => setNuevoMasaje({ ...nuevoMasaje, descripcion_larga: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Precio</label>
                      <input type="number" step="0.01" className="mt-1 block w-full border rounded px-3 py-2" value={nuevoMasaje.precio} onChange={e => setNuevoMasaje({ ...nuevoMasaje, precio: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duración (minutos)</label>
                      <input type="number" className="mt-1 block w-full border rounded px-3 py-2" value={nuevoMasaje.duracion} onChange={e => setNuevoMasaje({ ...nuevoMasaje, duracion: e.target.value })} required />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Imagen (opcional)</label>
                      <input type="file" accept="image/*" className="mt-1 block w-full" onChange={e => setNuevoMasaje({ ...nuevoMasaje, imagen: e.target.files?.[0] || null })} />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-4 mt-2">
                      <button type="submit" disabled={subiendo} className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50">{subiendo ? 'Guardando...' : 'Guardar masaje'}</button>
                      {errorMasaje && <span className="text-red-600 text-sm">{errorMasaje}</span>}
                    </div>
                  </form>
                </div>
                {/* Listado de masajes */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción corta</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción larga</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duración</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imagen</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {masajes.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No hay masajes registrados</td>
                        </tr>
                      ) : (
                        masajes.map((masaje: any) => (
                          <tr key={masaje.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{masaje.nombre}</td>
                            <td className="px-6 py-4 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis" style={{maxWidth: '140px'}}>
                              {masaje.descripcion_corta && masaje.descripcion_corta.length > 40
                                ? masaje.descripcion_corta.slice(0, 40) + '...'
                                : masaje.descripcion_corta}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis" style={{maxWidth: '180px'}}>
                              {masaje.descripcion_larga && masaje.descripcion_larga.length > 60
                                ? masaje.descripcion_larga.slice(0, 60) + '...'
                                : masaje.descripcion_larga}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">${masaje.precio?.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{masaje.duracion} min</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {masaje.imagen_url ? (
                                <img src={masaje.imagen_url} alt={masaje.nombre} className="h-12 w-12 object-cover rounded" />
                              ) : (
                                <span className="text-gray-400">Sin imagen</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button className="text-blue-600 hover:text-blue-900 mr-2" onClick={() => { setEditMasaje(masaje); setEditModalOpen(true); }}>Editar</button>
                              <button className="text-red-600 hover:text-red-900" onClick={() => setDeleteId(masaje.id)}>Eliminar</button>
                            </td>
                          </tr>
                        ))
                      )}
                {/* Modal de edición */}
                {editModalOpen && editMasaje && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                      <h3 className="text-lg font-bold mb-4">Editar masaje</h3>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setEditLoading(true);
                          try {
                            const { error } = await supabase.from('masajes').update({
                              nombre: editMasaje.nombre,
                              descripcion_corta: editMasaje.descripcion_corta,
                              descripcion_larga: editMasaje.descripcion_larga,
                              precio: parseFloat(editMasaje.precio),
                              duracion: parseInt(editMasaje.duracion),
                            }).eq('id', editMasaje.id);
                            if (error) throw error;
                            setEditModalOpen(false);
                            setEditMasaje(null);
                            await loadData();
                          } catch (err: any) {
                            alert('Error al actualizar masaje: ' + (err.message || err));
                          } finally {
                            setEditLoading(false);
                          }
                        }}
                      >
                        <div className="mb-2">
                          <label className="block text-sm font-medium text-gray-700">Nombre</label>
                          <input type="text" className="mt-1 block w-full border rounded px-3 py-2" value={editMasaje.nombre} onChange={e => setEditMasaje({ ...editMasaje, nombre: e.target.value })} required />
                        </div>
                        <div className="mb-2">
                          <label className="block text-sm font-medium text-gray-700">Descripción corta</label>
                          <input type="text" className="mt-1 block w-full border rounded px-3 py-2" value={editMasaje.descripcion_corta} onChange={e => setEditMasaje({ ...editMasaje, descripcion_corta: e.target.value })} required />
                        </div>
                        <div className="mb-2">
                          <label className="block text-sm font-medium text-gray-700">Descripción larga</label>
                          <textarea className="mt-1 block w-full border rounded px-3 py-2" rows={3} value={editMasaje.descripcion_larga} onChange={e => setEditMasaje({ ...editMasaje, descripcion_larga: e.target.value })} required />
                        </div>
                        <div className="mb-2">
                          <label className="block text-sm font-medium text-gray-700">Precio</label>
                          <input type="number" step="0.01" className="mt-1 block w-full border rounded px-3 py-2" value={editMasaje.precio} onChange={e => setEditMasaje({ ...editMasaje, precio: e.target.value })} required />
                        </div>
                        <div className="mb-2">
                          <label className="block text-sm font-medium text-gray-700">Duración (minutos)</label>
                          <input type="number" className="mt-1 block w-full border rounded px-3 py-2" value={editMasaje.duracion} onChange={e => setEditMasaje({ ...editMasaje, duracion: e.target.value })} required />
                        </div>
                        <div className="flex gap-4 mt-4">
                          <button type="submit" disabled={editLoading} className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50">{editLoading ? 'Guardando...' : 'Guardar cambios'}</button>
                          <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => { setEditModalOpen(false); setEditMasaje(null); }}>Cancelar</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                {/* Modal de confirmación de eliminación */}
                {deleteId && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                      <h3 className="text-lg font-bold mb-4 text-red-600">¿Eliminar masaje?</h3>
                      <p className="mb-4">Esta acción no se puede deshacer. ¿Seguro que deseas eliminar este masaje?</p>
                      <div className="flex gap-4">
                        <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50" disabled={deleteLoading}
                          onClick={async () => {
                            setDeleteLoading(true);
                            try {
                              const { error } = await supabase.from('masajes').delete().eq('id', deleteId);
                              if (error) throw error;
                              setDeleteId(null);
                              await loadData();
                            } catch (err: any) {
                              alert('Error al eliminar masaje: ' + (err.message || err));
                            } finally {
                              setDeleteLoading(false);
                            }
                          }}
                        >{deleteLoading ? 'Eliminando...' : 'Eliminar'}</button>
                        <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setDeleteId(null)}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}