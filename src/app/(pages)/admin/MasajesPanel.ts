'use client';

import React, { useState } from 'react';
import { FiEdit, FiTrash2, FiUpload } from 'react-icons/fi';
import { createClient } from '@/utils/supabase/client';

type Masaje = {
  id: string;
  nombre: string;
  descripcion_corta: string;
  descripcion_larga: string;
  precio: number;
  duracion: number;
  imagen_url: string | null;
};

interface Props {
  masajes: Masaje[];
  loadData: () => Promise<void>;
}

export default function MasajesPanel({ masajes, loadData }: Props) {
  const [nuevoMasaje, setNuevoMasaje] = useState({
    nombre: '',
    descripcion_corta: '',
    descripcion_larga: '',
    precio: '',
    duracion: '',
    imagen_url: null as File | null,
  });

  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editMasaje, setEditMasaje] = useState<Masaje | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const supabase = createClient();

  // Crear masaje
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubiendo(true);

    try {
      let imagen_url = null;
      if (nuevoMasaje.imagen_url) {
        const file = nuevoMasaje.imagen_url;
        const filePath = `masajes/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('masajes').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('masajes').getPublicUrl(filePath);
        imagen_url = data.publicUrl;
      }

      const { error: insertError } = await supabase.from('masajes').insert([{
        nombre: nuevoMasaje.nombre,
        descripcion_corta: nuevoMasaje.descripcion_corta,
        descripcion_larga: nuevoMasaje.descripcion_larga,
        precio: parseFloat(nuevoMasaje.precio),
        duracion: parseInt(nuevoMasaje.duracion),
        imagen_url,
      }]);

      if (insertError) throw insertError;

      setNuevoMasaje({ nombre: '', descripcion_corta: '', descripcion_larga: '', precio: '', duracion: '', imagen_url: null });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error al crear masaje');
    } finally {
      setSubiendo(false);
    }
  }

  // Editar masaje
  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editMasaje) return;
    setEditLoading(true);

    try {
      const updateData: any = {
        nombre: editMasaje.nombre,
        descripcion_corta: editMasaje.descripcion_corta,
        descripcion_larga: editMasaje.descripcion_larga,
        precio: parseFloat(editMasaje.precio as any),
        duracion: parseInt(editMasaje.duracion as any),
      };

      if (editFile) {
        const filePath = `masajes/${Date.now()}_${editFile.name}`;
        const { error: uploadError } = await supabase.storage.from('masajes').upload(filePath, editFile);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('masajes').getPublicUrl(filePath);
        updateData.imagen_url = data.publicUrl;
      }

      const { error } = await supabase.from('masajes').update(updateData).eq('id', editMasaje.id);
      if (error) throw error;

      setEditModalOpen(false);
      setEditMasaje(null);
      setEditFile(null);
      await loadData();
    } catch (err: any) {
      alert('Error al actualizar masaje: ' + (err.message || 'Error desconocido'));
    } finally {
      setEditLoading(false);
    }
  }

  // Eliminar masaje
  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);

    try {
      const { error } = await supabase.from('masajes').delete().eq('id', deleteId);
      if (error) throw error;

      setDeleteId(null);
      await loadData();
    } catch (err: any) {
      alert('Error al eliminar masaje: ' + (err.message || 'Error desconocido'));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Panel de Masajes</h2>

      {/* Form Crear */}
      <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Nombre"
          value={nuevoMasaje.nombre}
          onChange={e => setNuevoMasaje({ ...nuevoMasaje, nombre: e.target.value })}
          required
          className="border rounded p-2"
        />
        <input
          type="text"
          placeholder="Descripción corta"
          value={nuevoMasaje.descripcion_corta}
          onChange={e => setNuevoMasaje({ ...nuevoMasaje, descripcion_corta: e.target.value })}
          className="border rounded p-2"
        />
        <textarea
          placeholder="Descripción larga"
          value={nuevoMasaje.descripcion_larga}
          onChange={e => setNuevoMasaje({ ...nuevoMasaje, descripcion_larga: e.target.value })}
          className="border rounded p-2 md:col-span-2"
        />
        <input
          type="number"
          placeholder="Precio"
          value={nuevoMasaje.precio}
          onChange={e => setNuevoMasaje({ ...nuevoMasaje, precio: e.target.value })}
          required
          className="border rounded p-2"
          step="0.01"
        />
        <input
          type="number"
          placeholder="Duración (minutos)"
          value={nuevoMasaje.duracion}
          onChange={e => setNuevoMasaje({ ...nuevoMasaje, duracion: e.target.value })}
          required
          className="border rounded p-2"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer border border-gray-300 rounded p-2 flex items-center gap-2 w-max"
        >
          <FiUpload />
          {nuevoMasaje.imagen_url ? nuevoMasaje.imagen_url.name : 'Subir Imagen'}
        </label>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={e => setNuevoMasaje({ ...nuevoMasaje, imagen_url: e.target.files?.[0] || null })}
          accept="image/*"
        />
        <button
          type="submit"
          disabled={subiendo}
          className="bg-teal-600 text-white p-2 rounded disabled:opacity-50 col-span-full"
        >
          {subiendo ? 'Guardando...' : 'Crear Masaje'}
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>

      {/* Tabla de masajes */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Imagen</th>
              <th className="border border-gray-300 p-2">Nombre</th>
              <th className="border border-gray-300 p-2">Precio</th>
              <th className="border border-gray-300 p-2">Duración</th>
              <th className="border border-gray-300 p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {masajes.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2">
                  <img
                    src={m.imagen_url || 'https://placehold.co/40x40'}
                    alt={m.nombre}
                    className="w-10 h-10 object-cover rounded"
                  />
                </td>
                <td className="border border-gray-300 p-2">{m.nombre}</td>
                <td className="border border-gray-300 p-2">${m.precio.toFixed(2)}</td>
                <td className="border border-gray-300 p-2">{m.duracion} min</td>
                <td className="border border-gray-300 p-2 flex gap-2">
                  <button
                    onClick={() => {
                      setEditMasaje(m);
                      setEditModalOpen(true);
                      setEditFile(null);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                  >
                    <FiEdit /> Editar
                  </button>
                  <button
                    onClick={() => setDeleteId(m.id)}
                    className="text-red-600 hover:text-red-900 flex items-center gap-1"
                  >
                    <FiTrash2 /> Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Editar */}
      {editModalOpen && editMasaje && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleEdit}
            className="bg-white p-6 rounded max-w-lg w-full space-y-4"
          >
            <h3 className="text-xl font-bold">Editar Masaje</h3>
            <input
              type="text"
              value={editMasaje.nombre}
              onChange={e => setEditMasaje({ ...editMasaje, nombre: e.target.value })}
              required
              className="border p-2 rounded w-full"
            />
            <input
              type="text"
              value={editMasaje.descripcion_corta}
              onChange={e => setEditMasaje({ ...editMasaje, descripcion_corta: e.target.value })}
              className="border p-2 rounded w-full"
            />
            <textarea
              value={editMasaje.descripcion_larga}
              onChange={e => setEditMasaje({ ...editMasaje, descripcion_larga: e.target.value })}
              className="border p-2 rounded w-full"
            />
            <input
              type="number"
              value={editMasaje.precio}
              onChange={e => setEditMasaje({ ...editMasaje, precio: e.target.value })}
              required
              step="0.01"
              className="border p-2 rounded w-full"
            />
            <input
              type="number"
              value={editMasaje.duracion}
              onChange={e => setEditMasaje({ ...editMasaje, duracion: e.target.value })}
              required
              className="border p-2 rounded w-full"
            />
            <label
              htmlFor="edit-file-upload"
              className="cursor-pointer border border-gray-300 rounded p-2 flex items-center gap-2 w-max"
            >
              <FiUpload />
              {editFile ? editFile.name : (editMasaje.imagen_url ? 'Cambiar imagen' : 'Seleccionar imagen')}
            </label>
            <input
              id="edit-file-upload"
              type="file"
              className="hidden"
              onChange={e => setEditFile(e.target.files?.[0] || null)}
              accept="image/*"
            />

            <div className="flex gap-4 justify-end">
              <button
                type="submit"
                disabled={editLoading}
                className="bg-teal-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {editLoading ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditMasaje(null);
                  setEditFile(null);
                }}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded max-w-md w-full">
            <h3 className="text-xl font-bold text-red-600 mb-4">Eliminar Masaje</h3>
            <p className="mb-6">¿Seguro que quieres eliminar este masaje? Esta acción no se puede deshacer.</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {deleteLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
