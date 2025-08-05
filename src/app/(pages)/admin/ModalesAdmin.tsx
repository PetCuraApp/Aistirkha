'use client';

import { FiCheck, FiTrash2, FiX, FiUpload } from 'react-icons/fi';
import { motion } from 'framer-motion';

type Reserva = {
  id: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  fecha: string;
  hora: string;
  usuario?: {
    nombre: string;
    email: string;
    telefono: string;
  };
  nombre_invitado?: string;
  email_invitado?: string;
  telefono_invitado?: string;
  masaje?: {
    nombre: string;
    precio: number;
    duracion: number;
  };
};

type Masaje = {
  id: string;
  nombre: string;
  descripcion_larga: string;
  precio: number | string;
  duracion: number | string;
  imagen_url?: string;
};

type Props = {
  selectedReserva: Reserva | null;
  setSelectedReserva: (r: Reserva | null) => void;
  updateReservaStatus: (id: string, estado: Reserva['estado']) => void;
  handleDeleteFromModal: () => void;

  editModalOpen: boolean;
  setEditModalOpen: (open: boolean) => void;
  editMasaje: Masaje | null;
  setEditMasaje: (m: Masaje | null) => void;
  editFile: File | null;
  setEditFile: (f: File | null) => void;
  editLoading: boolean;
  handleUpdateMasaje: (e: React.FormEvent<HTMLFormElement>) => void;

  deleteId: string | null;
  setDeleteId: (id: string | null) => void;
  handleDeleteMasaje: () => void;
  deleteLoading: boolean;
};

export default function ModalesAdmin({
  selectedReserva,
  setSelectedReserva,
  updateReservaStatus,
  handleDeleteFromModal,

  editModalOpen,
  setEditModalOpen,
  editMasaje,
  setEditMasaje,
  editFile,
  setEditFile,
  editLoading,
  handleUpdateMasaje,

  deleteId,
  setDeleteId,
  handleDeleteMasaje,
  deleteLoading
}: Props) {
  return (
    <>
      {selectedReserva && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className={`p-4 rounded-t-lg border-b-4 ${selectedReserva.estado === 'confirmada' ? 'border-green-500' : selectedReserva.estado === 'pendiente' ? 'border-yellow-500' : selectedReserva.estado === 'cancelada' ? 'border-red-500' : 'border-blue-500'}`}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Detalles de Reserva</h2>
                <button onClick={() => setSelectedReserva(null)} className="text-gray-400 hover:text-gray-600">
                  <FiX size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-500">
                {selectedReserva.masaje?.nombre} - {new Date(selectedReserva.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} a las {selectedReserva.hora}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Cliente</h3>
                <div className="text-sm text-gray-600">
                  <p><strong>Nombre:</strong> {selectedReserva.usuario?.nombre || selectedReserva.nombre_invitado}</p>
                  <p><strong>Email:</strong> {selectedReserva.usuario?.email || selectedReserva.email_invitado}</p>
                  <p><strong>Teléfono:</strong> {selectedReserva.usuario?.telefono || selectedReserva.telefono_invitado}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Servicio</h3>
                <div className="text-sm text-gray-600">
                  <p><strong>Precio:</strong> ${selectedReserva.masaje?.precio?.toFixed(2) || 'N/A'}</p>
                  <p><strong>Duración:</strong> {selectedReserva.masaje?.duracion || 'N/A'} min</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-b-lg flex flex-wrap items-center justify-end gap-2">
              {selectedReserva.estado === 'pendiente' && (
                <button onClick={() => { updateReservaStatus(selectedReserva.id, 'confirmada'); setSelectedReserva(null); }} className="bg-green-600 text-white px-3 py-2 text-sm rounded hover:bg-green-700 flex items-center">
                  <FiCheck className="mr-1" />Confirmar
                </button>
              )}
              {(selectedReserva.estado === 'pendiente' || selectedReserva.estado === 'confirmada') && (
                <button onClick={() => { updateReservaStatus(selectedReserva.id, 'cancelada'); setSelectedReserva(null); }} className="bg-orange-500 text-white px-3 py-2 text-sm rounded hover:bg-orange-600 flex items-center">
                  <FiX className="mr-1" />Cancelar
                </button>
              )}
              {selectedReserva.estado === 'confirmada' && (
                <button onClick={() => { updateReservaStatus(selectedReserva.id, 'completada'); setSelectedReserva(null); }} className="bg-blue-600 text-white px-3 py-2 text-sm rounded hover:bg-blue-700 flex items-center">
                  <FiCheck className="mr-1" />Completar
                </button>
              )}
              <button onClick={handleDeleteFromModal} className="bg-red-600 text-white px-3 py-2 text-sm rounded hover:bg-red-700 flex items-center">
                <FiTrash2 className="mr-1" />Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {editModalOpen && editMasaje && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Editar masaje</h3>
            <form onSubmit={handleUpdateMasaje}>
              <div className="space-y-4">
                <input
                  type="text"
                  value={editMasaje.nombre}
                  onChange={e => setEditMasaje({ ...editMasaje, nombre: e.target.value })}
                  required
                  className="w-full p-2 border rounded"
                />
                <textarea
                  value={editMasaje.descripcion_larga}
                  onChange={e => setEditMasaje({ ...editMasaje, descripcion_larga: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  value={editMasaje.precio}
                  onChange={e => setEditMasaje({ ...editMasaje, precio: e.target.value })}
                  required
                  className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  value={editMasaje.duracion}
                  onChange={e => setEditMasaje({ ...editMasaje, duracion: e.target.value })}
                  required
                  className="w-full p-2 border rounded"
                />
                <div>
                  <label htmlFor="edit-file-upload" className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 w-max">
                    <FiUpload />
                    <span>{editFile ? editFile.name : (editMasaje.imagen_url ? 'Cambiar imagen' : 'Seleccionar imagen')}</span>
                  </label>
                  <input
                    id="edit-file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={e => setEditFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50"
                >
                  {editLoading ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => { setEditModalOpen(false); setEditFile(null); }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-red-600">¿Eliminar masaje?</h3>
            <p className="mb-4">Esta acción no se puede deshacer. ¿Seguro?</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleDeleteMasaje}
                disabled={deleteLoading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setDeleteId(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
