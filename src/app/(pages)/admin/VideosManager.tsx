'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff, FiChevronUp, FiChevronDown } from 'react-icons/fi';

type Video = {
  id: string;
  nombre: string;
  descripcion?: string;
  video_url: string;
  orden: number;
  activo: boolean;
  created_at: string;
};

export default function VideosManager() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    video: null as File | null
  });

  // Cargar videos
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('orden', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, video: file }));
    }
  };

  const uploadVideo = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('videosmasajes')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('videosmasajes')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.video && !editingVideo) {
      alert('Por favor selecciona un video');
      return;
    }

    try {
      setUploading(true);
      let videoUrl = editingVideo?.video_url || '';

      if (formData.video) {
        videoUrl = await uploadVideo(formData.video);
      }

      const videoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        video_url: videoUrl,
        orden: editingVideo?.orden || videos.length + 1
      };

      if (editingVideo) {
        // Actualizar video existente
        const { error } = await supabase
          .from('videos')
          .update(videoData)
          .eq('id', editingVideo.id);

        if (error) throw error;
      } else {
        // Crear nuevo video
        const { error } = await supabase
          .from('videos')
          .insert([videoData]);

        if (error) throw error;
      }

      setFormData({ nombre: '', descripcion: '', video: null });
      setEditingVideo(null);
      setShowForm(false);
      fetchVideos();
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Error al guardar el video');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      nombre: video.nombre,
      descripcion: video.descripcion || '',
      video: null
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este video?')) return;

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Error al eliminar el video');
    }
  };

  const toggleActive = async (video: Video) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ activo: !video.activo })
        .eq('id', video.id);

      if (error) throw error;
      fetchVideos();
    } catch (error) {
      console.error('Error toggling video status:', error);
    }
  };

  const moveVideo = async (video: Video, direction: 'up' | 'down') => {
    const currentIndex = videos.findIndex(v => v.id === video.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= videos.length) return;

    const targetVideo = videos[newIndex];
    const newOrden = targetVideo.orden;
    const targetOrden = video.orden;

    try {
      // Intercambiar órdenes
      await supabase
        .from('videos')
        .update({ orden: targetOrden })
        .eq('id', targetVideo.id);

      await supabase
        .from('videos')
        .update({ orden: newOrden })
        .eq('id', video.id);

      fetchVideos();
    } catch (error) {
      console.error('Error moving video:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Gestionar Videos</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingVideo(null);
            setFormData({ nombre: '', descripcion: '', video: null });
          }}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded flex items-center"
        >
          <FiPlus className="mr-2" />
          Agregar Video
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingVideo ? 'Editar Video' : 'Agregar Nuevo Video'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {editingVideo ? 'Video (dejar vacío para mantener el actual)' : 'Video'}
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="w-full p-2 border rounded"
                required={!editingVideo}
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={uploading}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {uploading ? 'Subiendo...' : (editingVideo ? 'Actualizar' : 'Guardar')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingVideo(null);
                  setFormData({ nombre: '', descripcion: '', video: null });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Videos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Video
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orden
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {videos.map((video, index) => (
              <tr key={video.id}>
                <td className="px-6 py-4">
                  <video
                    src={video.video_url}
                    className="h-16 w-24 object-cover rounded"
                    muted
                    preload="metadata"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{video.nombre}</div>
                    {video.descripcion && (
                      <div className="text-sm text-gray-500">{video.descripcion}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {video.orden}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    video.activo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {video.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium space-x-2">
                  <button
                    onClick={() => moveVideo(video, 'up')}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Mover arriba"
                  >
                    <FiChevronUp />
                  </button>
                  <button
                    onClick={() => moveVideo(video, 'down')}
                    disabled={index === videos.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Mover abajo"
                  >
                    <FiChevronDown />
                  </button>
                  <button
                    onClick={() => toggleActive(video)}
                    className={`${
                      video.activo ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                    }`}
                    title={video.activo ? 'Desactivar' : 'Activar'}
                  >
                    {video.activo ? <FiEyeOff /> : <FiEye />}
                  </button>
                  <button
                    onClick={() => handleEdit(video)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <FiEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 