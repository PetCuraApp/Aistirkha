'use client';

import { FiUsers } from 'react-icons/fi';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Usuario } from '@/types/usuarios';

export default function UsuariosPanel({ usuarios, setUsuarios }: {
  usuarios: Usuario[];
  setUsuarios: (usuarios: Usuario[]) => void;
}) {
  const [loading, setLoading] = useState(false);

  const updateUserRole = async (id: string, rol: Usuario['rol']) => {
    if (!confirm(`¿Seguro que quieres cambiar el rol a ${rol}?`)) return;
    try {
      const supabaseClient = createClient();
      const { error } = await supabaseClient.from('usuarios').update({ rol }).eq('id', id);
      if (error) throw error;
      setUsuarios(usuarios.map(u => (u.id === id ? { ...u, rol } : u)));
    } catch (err: any) {
      alert(`Error al actualizar rol: ${err.message}`);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('¿Estás seguro? Se eliminará el usuario y todas sus reservas.')) return;
    setLoading(true);
    try {
      const supabaseClient = createClient();
      await supabaseClient.from('reservas').delete().eq('usuario_id', id);
      await supabaseClient.from('usuarios').delete().eq('id', id);
      setUsuarios(usuarios.filter(u => u.id !== id));
    } catch (err: any) {
      alert(`Error al eliminar usuario: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
            <th className="px-6 py-3 text-left text-xs font-medium">Contacto</th>
            <th className="px-6 py-3 text-left text-xs font-medium">Rol</th>
            <th className="px-6 py-3 text-left text-xs font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {usuarios.map(u => (
            <tr key={u.id}>
              <td className="px-6 py-4">
                <div className="font-medium">{u.nombre}</div>
                <div className="text-sm text-gray-500">{u.id}</div>
              </td>
              <td className="px-6 py-4">{u.email}</td>
              <td className="px-6 py-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                  {u.rol}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-medium">
                <button
                  onClick={() => updateUserRole(u.id, u.rol === 'admin' ? 'cliente' : 'admin')}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Cambiar Rol
                </button>
                <button
                  onClick={() => deleteUser(u.id)}
                  className="text-red-600 hover:text-red-900 ml-4"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
