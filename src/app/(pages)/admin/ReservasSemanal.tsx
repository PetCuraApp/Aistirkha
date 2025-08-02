// RUTA: components/admin/ReservasSemanal.tsx

'use client';

import { useState, useMemo } from 'react';
import { startOfWeek, endOfWeek, addDays, format, isToday, addWeeks, subWeeks, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Tipos y constantes se mantienen igual
type Reserva = {
  id: string;
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  usuario?: { nombre: string; };
  masaje?: { nombre: string; };
  nombre_invitado?: string;
};

type ReservasSemanalProps = {
  reservas: Reserva[];
  onReservaClick: (reserva: Reserva) => void;
};

const WORKING_HOURS_START = 9;
const WORKING_HOURS_END = 19;

export default function ReservasSemanal({ reservas, onReservaClick }: ReservasSemanalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  // Agrupamos las reservas con la clave de fecha corregida
  const reservasAgrupadas = useMemo(() => {
    const grouped: { [key: string]: Reserva[] } = {};
    if (!reservas || !Array.isArray(reservas)) {
      return grouped;
    }
    reservas.forEach(reserva => {
      // --- ¡ESTA ES LA LÍNEA CORREGIDA! ---
      // Extraemos solo la parte 'YYYY-MM-DD' de la fecha completa
      const fechaNormalizada = reserva.fecha.substring(0, 10);
      const key = `${fechaNormalizada}-${reserva.hora.substring(0, 2)}`; // Ahora la clave será "2025-08-04-10"

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(reserva);
    });
    return grouped;
  }, [reservas]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const timeSlots = Array.from({ length: WORKING_HOURS_END - WORKING_HOURS_START }, (_, i) => {
    const hour = WORKING_HOURS_START + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });
  
  const getStateColor = (estado: Reserva['estado']) => {
    switch (estado) {
      case 'confirmada': return 'bg-green-100 border-green-500 text-green-800';
      case 'pendiente': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'cancelada': return 'bg-red-100 border-red-500 text-red-800';
      case 'completada': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-400';
    }
  };
  
  const hasVisibleReservations = useMemo(() => {
    return reservas.some(reserva => {
        const reservaDate = parseISO(reserva.fecha);
        return reservaDate >= weekStart && reservaDate <= weekEnd;
    });
  }, [reservas, weekStart, weekEnd]);


  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-2 rounded-full hover:bg-gray-200"><FiChevronLeft size={20} /></button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">{format(weekStart, 'd MMM', { locale: es })} - {format(weekEnd, 'd MMM yyyy', { locale: es })}</h2>
          <button onClick={() => setCurrentDate(new Date())} className="text-sm text-teal-600 hover:underline">Ir a esta semana</button>
        </div>
        <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-2 rounded-full hover:bg-gray-200"><FiChevronRight size={20} /></button>
      </div>

      <div className="relative border-t border-l border-gray-200">
        <div className="grid grid-cols-8 -mr-px -mb-px">
          <div className="h-16"></div>
          {days.map(day => (
            <div key={day.toString()} className={`p-2 text-center border-r border-b border-gray-200 ${isToday(day) ? 'bg-teal-50' : 'bg-gray-50'}`}>
              <p className="text-sm font-medium text-gray-600 capitalize">{format(day, 'EEE', { locale: es })}</p>
              <p className={`text-2xl font-bold ${isToday(day) ? 'text-teal-600' : 'text-gray-800'}`}>{format(day, 'd')}</p>
            </div>
          ))}
          {timeSlots.map(time => (
            <div key={time} className="col-span-8 grid grid-cols-8">
              <div className="col-span-1 flex items-center justify-center p-2 border-r border-b border-gray-200"><span className="text-xs text-gray-500">{time}</span></div>
              {days.map(day => {
                const formattedDate = format(day, 'yyyy-MM-dd'); // Esto genera "2025-08-04"
                const hour = time.substring(0, 2);
                const cellKey = `${formattedDate}-${hour}`; // La clave que se busca es "2025-08-04-10"
                const cellReservas = reservasAgrupadas[cellKey] || [];
                return (
                  <div key={cellKey} className={`col-span-1 p-1 border-r border-b border-gray-200 min-h-[80px] ${isToday(day) ? 'bg-teal-50/50' : ''}`}>
                    {cellReservas.map(reserva => (
                      <div key={reserva.id} className={`p-1.5 rounded text-xs mb-1 border-l-4 ${getStateColor(reserva.estado)} cursor-pointer hover:shadow-md hover:scale-105 transition-transform duration-200`} onClick={() => onReservaClick(reserva)}>
                        <p className="font-semibold truncate">{reserva.usuario?.nombre || reserva.nombre_invitado}</p>
                        <p className="truncate">{reserva.masaje?.nombre}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {!hasVisibleReservations && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 pointer-events-none">
                <FiCalendar className="text-gray-300" size={64} />
                <p className="mt-4 text-lg font-medium text-gray-500">No hay reservas para esta semana</p>
                <p className="text-sm text-gray-400">Usa las flechas para navegar a otras semanas.</p>
            </div>
        )}
      </div>
    </div>
  );
}