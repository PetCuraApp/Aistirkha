// RUTA: app/admin/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiCalendar, FiUsers, FiDollarSign, FiEdit, FiTrash2, FiCheck, FiX, FiUpload, FiVideo } from 'react-icons/fi';
import { getSessionClient, getUserDetailsClient } from '@/lib/authClient';
import { supabase } from '@/utils/supabase/client';
import ReservasSemanal from '@/app/(pages)/admin/ReservasSemanal'; // Asegúrate de que la ruta sea correcta 
import VideosManager from '@/app/(pages)/admin/VideosManager';
import type { Reserva } from '@/types/admin';

type Usuario = {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  rol: 'admin' | 'cliente';
  creado_en: string;
};

type Tab = 'reservas' | 'usuarios' | 'masajes' | 'videos';

export default function AdminPage() {
  // Estados originales
  const [tab, setTab] = useState<Tab>('reservas');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [masajes, setMasajes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // Estado para el nuevo calendario
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  // --- ESTADOS ORIGINALES PARA MASAJES Y USUARIOS (RESTAURADOS 1:1) ---
  const [editMasaje, setEditMasaje] = useState<any | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [nuevoMasaje, setNuevoMasaje] = useState({
    nombre: '',
    descripcion_corta: '',
    descripcion_larga: '',
    precio: '',
    duracion: '',
    imagen_url: null as File | null,
  });
  const [subiendo, setSubiendo] = useState(false);
  const [errorMasaje, setErrorMasaje] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const session = await getSessionClient();
        if (!session) { router.push('/auth'); return; }
        const userData = await getUserDetailsClient();
        if (!userData || (userData as { rol: string }).rol !== 'admin') { router.push('/home'); return; }
        setIsAdmin(true);
      } catch (err: any) { setError('No tienes permiso para acceder a esta página.'); setLoading(false); }
    };
    checkAdminStatus();
  }, [router]);

  // Mover loadData al scope principal del componente
  useEffect(() => {
    if (isAdmin) { loadData(); }
  }, [tab, isAdmin]);


  // --- FUNCIONES DE ACCIÓN (COMPLETAS Y RESTAURADAS) ---

  // Definir loadData en el scope principal del componente
  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
    
      if (tab === 'reservas') {
        const { data, error } = await supabase.from('reservas').select(`*, usuario:usuarios(nombre, email, telefono), masaje:masajes(nombre, precio, duracion)`).order('fecha', { ascending: false });
        if (error) throw error;
        setReservas(data as Reserva[]);
      } else if (tab === 'usuarios') {
        const { data, error } = await supabase.from('usuarios').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setUsuarios(data as Usuario[]);
      } else if (tab === 'masajes') {
        const { data, error } = await supabase.from('masajes').select('*').order('id', { ascending: true });
        if (error) throw error;
        setMasajes(data);
      }
    } catch (err: any) { setError(`Error al cargar ${tab}: ${err.message}`); } 
    finally { setLoading(false); }
  };

  const updateReservaStatus = async (id: string, estado: Reserva['estado']) => {
    try {
      
      const { data: updatedReserva, error } = await supabase.from('reservas').update({ estado }).eq('id', id).select().single();
      if (error) throw error;
      setReservas(prev => prev.map(r => (r.id === id ? { ...r, ...updatedReserva } : r)));
    } catch (err: any) { alert(`Error al actualizar estado: ${err.message}`); }
  };
  
  const deleteReserva = async (id: string) => {
    try {
      
      const { error } = await supabase.from('reservas').delete().eq('id', id);
      if (error) throw error;
      setReservas(prev => prev.filter(reserva => reserva.id !== id));
    } catch (err: any) { alert(`Error al eliminar reserva: ${err.message}`); }
  };

  const handleDeleteFromModal = async () => {
    if (!selectedReserva) return;
    if (confirm('¿Seguro que deseas eliminar esta reserva?')) {
      await deleteReserva(selectedReserva.id);
      setSelectedReserva(null);
    }
  };

  const updateUserRole = async (id: string, rol: Usuario['rol']) => {
    if (!confirm(`¿Seguro que quieres cambiar el rol a ${rol}?`)) return;
    try {
       
        const { error } = await supabase.from('usuarios').update({ rol }).eq('id', id);
        if (error) throw error;
        setUsuarios(usuarios.map(u => (u.id === id ? { ...u, rol } : u)));
    } catch (err: any) { alert(`Error al actualizar rol: ${err.message}`); }
  };
  
  const deleteUser = async (id: string) => {
    if (!confirm('¿Estás seguro? Se eliminará el usuario y todas sus reservas.')) return;
    try {
      
      await supabase.from('reservas').delete().eq('usuario_id', id);
      await supabase.from('usuarios').delete().eq('id', id);
      setUsuarios(usuarios.filter(u => u.id !== id));
    } catch (err: any) { alert(`Error al eliminar usuario: ${err.message}`); }
  };

  const handleCreateMasaje = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMasaje(null);
    setSubiendo(true);
    
    try {
      let imagen_url = null;
      if (nuevoMasaje.imagen_url) {
        const file = nuevoMasaje.imagen_url;
        const filePath = `masajes/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('masajes').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('masajes').getPublicUrl(filePath);
        imagen_url = urlData?.publicUrl;
      }
      const { error: insertError } = await supabase.from('masajes').insert([{ ...nuevoMasaje, precio: parseFloat(nuevoMasaje.precio), duracion: parseInt(nuevoMasaje.duracion), imagen_url }]);
      if (insertError) throw insertError;
      setNuevoMasaje({ nombre: '', descripcion_corta: '', descripcion_larga: '', precio: '', duracion: '', imagen_url: null });
      await loadData();
    } catch (err: any) { setErrorMasaje(err.message); } 
    finally { setSubiendo(false); }
  };
  
  const handleUpdateMasaje = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditLoading(true);
    
    try {
        const updateData: { [key: string]: any } = {
            nombre: editMasaje.nombre,
            descripcion_corta: editMasaje.descripcion_corta,
            descripcion_larga: editMasaje.descripcion_larga,
            precio: parseFloat(editMasaje.precio),
            duracion: parseInt(editMasaje.duracion),
        };

        if (editFile) {
            const filePath = `masajes/${Date.now()}_${editFile.name}`;
            const { error: uploadError } = await supabase.storage.from('masajes').upload(filePath, editFile);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('masajes').getPublicUrl(filePath);
            updateData.imagen_url = urlData.publicUrl;
        }

        const { error } = await supabase.from('masajes').update(updateData).eq('id', editMasaje.id);
        if (error) throw error;
        
        setEditModalOpen(false);
        setEditMasaje(null);
        setEditFile(null);
        await loadData();
    } catch (err: any) { alert('Error al actualizar masaje: ' + (err.message || err)); } 
    finally { setEditLoading(false); }
  };
  
  const handleDeleteMasaje = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from('masajes').delete().eq('id', deleteId);
      if (error) throw error;
      setDeleteId(null);
      await loadData();
    } catch (err: any) { alert('Error al eliminar masaje: ' + (err.message || err)); } 
    finally { setDeleteLoading(false); }
  };


  if (!isAdmin && loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><div className="bg-red-50 p-4 rounded-md"><p>{error}</p><button onClick={() => router.push('/home')} className="mt-4 bg-red-600 text-white px-4 py-2 rounded">Volver</button></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b"><h1 className="text-2xl font-bold">Panel de Administración</h1><p className="mt-1 text-sm text-gray-500">Gestiona reservas, usuarios y masajes.</p></div>
          <div className="border-b"><nav className="-mb-px flex">
            <button onClick={() => setTab('reservas')} className={`${tab === 'reservas' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'} py-4 px-6 border-b-2 font-medium text-sm flex items-center`}><FiCalendar className="mr-2" />Reservas</button>
            <button onClick={() => setTab('usuarios')} className={`${tab === 'usuarios' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'} py-4 px-6 border-b-2 font-medium text-sm flex items-center`}><FiUsers className="mr-2" />Usuarios</button>
            <button onClick={() => setTab('masajes')} className={`${tab === 'masajes' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'} py-4 px-6 border-b-2 font-medium text-sm flex items-center`}><FiDollarSign className="mr-2" />Masajes</button>
            <button onClick={() => setTab('videos')} className={`${tab === 'videos' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'} py-4 px-6 border-b-2 font-medium text-sm flex items-center`}><FiVideo className="mr-2" />Videos</button>
          </nav></div>
          
          <div className="p-4">
            {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div></div>
             : error ? <div className="flex justify-center py-12"><div className="bg-red-50 p-4 rounded-md"><p>{error}</p></div></div>
             : tab === 'reservas' ? <ReservasSemanal reservas={reservas} onReservaClick={(reserva) => setSelectedReserva(reserva)} />
             : tab === 'usuarios' ? (
                <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th><th className="px-6 py-3 text-left text-xs font-medium">Contacto</th><th className="px-6 py-3 text-left text-xs font-medium">Rol</th><th className="px-6 py-3 text-left text-xs font-medium">Acciones</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{usuarios.map(u => (<tr key={u.id}><td className="px-6 py-4"><div className="font-medium">{u.nombre}</div><div className="text-sm text-gray-500">{u.id}</div></td><td className="px-6 py-4">{u.email}</td><td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>{u.rol}</span></td><td className="px-6 py-4 text-sm font-medium"><button onClick={() => updateUserRole(u.id, u.rol === 'admin' ? 'cliente' : 'admin')} className="text-indigo-600 hover:text-indigo-900">Cambiar Rol</button><button onClick={() => deleteUser(u.id)} className="text-red-600 hover:text-red-900 ml-4">Eliminar</button></td></tr>))}</tbody></table></div>
             )
             : tab === 'masajes' ? (
                <div>
                  <h2 className="text-xl font-bold mb-4">Gestionar Masajes</h2>
                  <div className="bg-white p-4 rounded shadow mb-6">
                    <form onSubmit={handleCreateMasaje} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700">Nombre</label><input type="text" value={nuevoMasaje.nombre} onChange={e => setNuevoMasaje({ ...nuevoMasaje, nombre: e.target.value })} required className="mt-1 block w-full border rounded px-3 py-2"/></div>
                      <div><label className="block text-sm font-medium text-gray-700">Descripción corta</label><input type="text" value={nuevoMasaje.descripcion_corta} onChange={e => setNuevoMasaje({ ...nuevoMasaje, descripcion_corta: e.target.value })} className="mt-1 block w-full border rounded px-3 py-2"/></div>
                      <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Descripción larga</label><textarea rows={3} value={nuevoMasaje.descripcion_larga} onChange={e => setNuevoMasaje({ ...nuevoMasaje, descripcion_larga: e.target.value })} className="mt-1 block w-full border rounded px-3 py-2"/></div>
                      <div><label className="block text-sm font-medium text-gray-700">Precio</label><input type="number" step="0.01" value={nuevoMasaje.precio} onChange={e => setNuevoMasaje({ ...nuevoMasaje, precio: e.target.value })} required className="mt-1 block w-full border rounded px-3 py-2"/></div>
                      <div><label className="block text-sm font-medium text-gray-700">Duración (minutos)</label><input type="number" value={nuevoMasaje.duracion} onChange={e => setNuevoMasaje({ ...nuevoMasaje, duracion: e.target.value })} required className="mt-1 block w-full border rounded px-3 py-2"/></div>
                      <div className="md:col-span-2"><label htmlFor="file-upload" className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 w-max"><FiUpload /><span>{nuevoMasaje.imagen_url ? nuevoMasaje.imagen_url.name : 'Subir Imagen'}</span></label><input id="file-upload" type="file" className="sr-only" onChange={e => setNuevoMasaje({ ...nuevoMasaje, imagen_url: e.target.files?.[0] || null })}/></div>
                      <div className="md:col-span-2"><button type="submit" disabled={subiendo} className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50">{subiendo ? 'Guardando...' : 'Guardar Masaje'}</button>{errorMasaje && <span className="text-red-600 text-sm ml-4">{errorMasaje}</span>}</div>
                    </form>
                  </div>
                  <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium">Imagen</th><th className="px-6 py-3 text-left text-xs font-medium">Nombre</th><th className="px-6 py-3 text-left text-xs font-medium">Precio</th><th className="px-6 py-3 text-left text-xs font-medium">Duración</th><th className="px-6 py-3 text-left text-xs font-medium">Acciones</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{masajes.map(m => (<tr key={m.id}><td className="px-6 py-4"><img src={m.imagen_url || 'https://placehold.co/40x40'} alt={m.nombre} className="h-10 w-10 rounded-full object-cover"/></td><td className="px-6 py-4">{m.nombre}</td><td className="px-6 py-4">${m.precio}</td><td className="px-6 py-4">{m.duracion} min</td><td className="px-6 py-4 text-sm font-medium"><button onClick={() => { setEditMasaje(m); setEditModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900">Editar</button><button onClick={() => setDeleteId(m.id)} className="text-red-600 hover:text-red-900 ml-4">Eliminar</button></td></tr>))}</tbody></table></div>
                </div>
             )
             : tab === 'videos' ? <VideosManager />
             : null}
          </div>
        </div>
      </motion.div>
      
      {/* --- MODALES COMPLETOS Y RESTAURADOS --- */}

      {selectedReserva && ( <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg shadow-xl w-full max-w-lg"><div className={`p-4 rounded-t-lg border-b-4 ${selectedReserva.estado === 'confirmada'?'border-green-500':selectedReserva.estado==='pendiente'?'border-yellow-500':selectedReserva.estado==='cancelada'?'border-red-500':'border-blue-500'}`}><div className="flex justify-between items-center"><h2 className="text-xl font-bold">Detalles de Reserva</h2><button onClick={()=>setSelectedReserva(null)} className="text-gray-400 hover:text-gray-600"><FiX size={24}/></button></div><p className="text-sm text-gray-500">{selectedReserva.masaje?.nombre} - {new Date(selectedReserva.fecha+'T00:00:00').toLocaleDateString('es-ES',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} a las {selectedReserva.hora}</p></div><div className="p-6 space-y-4"><div><h3 className="font-semibold text-gray-700 mb-2">Cliente</h3><div className="text-sm text-gray-600"><p><strong>Nombre:</strong> {selectedReserva.usuario?.nombre || selectedReserva.nombre_invitado}</p><p><strong>Email:</strong> {selectedReserva.usuario?.email || selectedReserva.email_invitado}</p><p><strong>Teléfono:</strong> {selectedReserva.usuario?.telefono || selectedReserva.telefono_invitado}</p></div></div><div><h3 className="font-semibold text-gray-700 mb-2">Servicio</h3><div className="text-sm text-gray-600"><p><strong>Precio:</strong> ${selectedReserva.masaje?.precio?.toFixed(2)||'N/A'}</p><p><strong>Duración:</strong> {selectedReserva.masaje?.duracion||'N/A'} min</p></div></div></div><div className="bg-gray-50 p-4 rounded-b-lg flex flex-wrap items-center justify-end gap-2">{selectedReserva.estado==='pendiente'&&(<button onClick={()=>{updateReservaStatus(selectedReserva.id,'confirmada');setSelectedReserva(null);}} className="bg-green-600 text-white px-3 py-2 text-sm rounded hover:bg-green-700 flex items-center"><FiCheck className="mr-1"/>Confirmar</button>)}{(selectedReserva.estado==='pendiente'||selectedReserva.estado==='confirmada')&&(<button onClick={()=>{updateReservaStatus(selectedReserva.id,'cancelada');setSelectedReserva(null);}} className="bg-orange-500 text-white px-3 py-2 text-sm rounded hover:bg-orange-600 flex items-center"><FiX className="mr-1"/>Cancelar</button>)}{selectedReserva.estado==='confirmada'&&(<button onClick={()=>{updateReservaStatus(selectedReserva.id,'completada');setSelectedReserva(null);}} className="bg-blue-600 text-white px-3 py-2 text-sm rounded hover:bg-blue-700 flex items-center"><FiCheck className="mr-1"/>Completar</button>)}<button onClick={handleDeleteFromModal} className="bg-red-600 text-white px-3 py-2 text-sm rounded hover:bg-red-700 flex items-center"><FiTrash2 className="mr-1"/>Eliminar</button></div></motion.div></div> )}
      {editModalOpen && editMasaje && ( <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg"><h3 className="text-lg font-bold mb-4">Editar masaje</h3><form onSubmit={handleUpdateMasaje}><div className="space-y-4"><input type="text" value={editMasaje.nombre} onChange={e => setEditMasaje({...editMasaje, nombre:e.target.value})} required className="w-full p-2 border rounded"/> <textarea value={editMasaje.descripcion_larga} onChange={e => setEditMasaje({...editMasaje, descripcion_larga:e.target.value})} className="w-full p-2 border rounded"/> <input type="number" value={editMasaje.precio} onChange={e => setEditMasaje({...editMasaje, precio:e.target.value})} required className="w-full p-2 border rounded"/> <input type="number" value={editMasaje.duracion} onChange={e => setEditMasaje({...editMasaje, duracion:e.target.value})} required className="w-full p-2 border rounded"/> <div><label htmlFor="edit-file-upload" className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 w-max"><FiUpload /><span>{editFile ? editFile.name : (editMasaje.imagen_url ? 'Cambiar imagen' : 'Seleccionar imagen')}</span></label><input id="edit-file-upload" type="file" className="sr-only" accept="image/*" onChange={e => setEditFile(e.target.files?.[0] || null)}/></div></div><div className="flex gap-4 mt-6"><button type="submit" disabled={editLoading} className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50">{editLoading?'Guardando...':'Guardar'}</button><button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={()=>{setEditModalOpen(false);setEditFile(null);}}>Cancelar</button></div></form></div></div> )}
      {deleteId && ( <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"><h3 className="text-lg font-bold mb-4 text-red-600">¿Eliminar masaje?</h3><p className="mb-4">Esta acción no se puede deshacer. ¿Seguro?</p><div className="flex gap-4 justify-end"><button onClick={handleDeleteMasaje} disabled={deleteLoading} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50">{deleteLoading?'Eliminando...':'Eliminar'}</button><button className="bg-gray-300 px-4 py-2 rounded" onClick={()=>setDeleteId(null)}>Cancelar</button></div></div></div> )}
    </div>
  );
}