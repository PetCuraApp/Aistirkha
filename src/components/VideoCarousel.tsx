'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiPlay, FiPause, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { supabase } from '@/utils/supabase/client';

type Video = {
  id: string;
  nombre: string;
  descripcion?: string;
  video_url: string;
  orden: number;
  activo: boolean;
};

export default function VideoCarousel() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useAlternativePlayer, setUseAlternativePlayer] = useState(false);
  const [testVideoUrl, setTestVideoUrl] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Obtener videos de Supabase
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        console.log('VideoCarousel: Fetching videos...');
        
        // Intentar obtener videos de Supabase
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('activo', true)
          .order('orden', { ascending: true });

        if (error) {
          console.error('VideoCarousel: Error fetching videos:', error);
          setVideoError('Error al cargar los videos');
          // Usar video de prueba si hay error
          setVideos([{
            id: 'test',
            nombre: 'Video de Prueba',
            descripcion: 'Este es un video de prueba de W3Schools',
            video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
            orden: 1,
            activo: true
          }]);
          setVideoError(null);
          setIsLoading(false);
          return;
        }

        console.log('VideoCarousel: Fetched videos:', data?.length || 0);
        
        // Si no hay videos, usar video de prueba
        if (!data || data.length === 0) {
          console.log('VideoCarousel: No videos found, using test video');
          setVideos([{
            id: 'test',
            nombre: 'Video de Prueba',
            descripcion: 'Este es un video de prueba de W3Schools',
            video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
            orden: 1,
            activo: true
          }]);
        } else {
          setVideos(data);
        }
        
        setVideoError(null);
      } catch (error) {
        console.error('VideoCarousel: Unexpected error:', error);
        setVideoError('Error inesperado al cargar videos');
        // Usar video de prueba si hay error
        setVideos([{
          id: 'test',
          nombre: 'Video de Prueba',
          descripcion: 'Este es un video de prueba de W3Schools',
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          orden: 1,
          activo: true
        }]);
        setVideoError(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Gestionar autoplay
  useEffect(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }

   

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [autoplay, videos.length, currentIndex, isPlaying]);

  // Iniciar reproducción cuando cambia el video actual
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      setVideoError(null);
    }
  }, [currentIndex, videos]);

  // Funciones de navegación
  const nextSlide = () => {
    if (videos.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }
  };

  const prevSlide = () => {
    if (videos.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Funciones de control de reproducción
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error('VideoCarousel: Error playing video:', error);
          setVideoError('Error al reproducir el video');
        });
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleAutoplay = () => {
    setAutoplay(!autoplay);
  };

  // Manejadores de eventos de video
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      console.log('VideoCarousel: Video metadata loaded, duration:', videoRef.current.duration);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    console.log('VideoCarousel: Video playing');
  };

  const handlePause = () => {
    setIsPlaying(false);
    console.log('VideoCarousel: Video paused');
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('VideoCarousel: Video error:', e);
    const videoElement = e.currentTarget;
    let errorMessage = 'Error al cargar el video';
    
    if (videoElement.error) {
      console.error('VideoCarousel: Código de error:', videoElement.error.code);
      console.error('VideoCarousel: Mensaje de error:', videoElement.error.message);
      
      // Mensajes de error más específicos según el código
      switch (videoElement.error.code) {
        case 1: // MEDIA_ERR_ABORTED
          errorMessage = 'La reproducción del video fue abortada';
          break;
        case 2: // MEDIA_ERR_NETWORK
          errorMessage = 'Error de red al cargar el video';
          break;
        case 3: // MEDIA_ERR_DECODE
          errorMessage = 'Error al decodificar el video. Puede ser un problema de formato o corrupción';
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          errorMessage = 'El formato de video no es compatible con este navegador';
          break;
        default:
          errorMessage = `Error al reproducir el video: ${videoElement.error.message}`;
      }
    }
    
    setVideoError(errorMessage);
    setIsPlaying(false);
  };

  const handleCanPlay = () => {
    console.log('VideoCarousel: Video can play');
    setVideoError(null);
  };

  const handleLoadedData = () => {
    console.log('VideoCarousel: Video data loaded');
    console.log('VideoCarousel: Video dimensions:', 
      videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
    console.log('VideoCarousel: Container dimensions:', 
      videoRef.current?.parentElement?.clientWidth, 'x', 
      videoRef.current?.parentElement?.clientHeight);
    setVideoError(null);
    
    // Forzar repintado del video
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      videoRef.current.currentTime = 0.01;
      setTimeout(() => {
        if (videoRef.current) videoRef.current.currentTime = currentTime;
      }, 50);
    }
  };

  // Formatear tiempo (segundos a MM:SS)
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Si no hay videos, no mostrar nada
  if (videos.length === 0) {
    if (isLoading) {
      return (
        <div className="relative h-96 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p>Cargando videos...</p>
          </div>
        </div>
      );
    }
    return null;
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="relative h-96 md:h-[500px] lg:h-[600px] bg-gray-900 rounded-lg overflow-hidden">
      {/* Panel de depuración - Solo visible en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 z-50 text-xs">
          <div className="flex flex-wrap gap-1">
            
        
            
            
            
          </div>
        </div>
      )}
      {/* Video actual */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-full h-full" style={{ zIndex: 1 }}>
            {/* Video principal */}
            <>
                {/* Video principal - mostrar solo si no se usa el reproductor alternativo */}
                   {!useAlternativePlayer && (
                     <video
                       ref={videoRef}
                       src={testVideoUrl || currentVideo?.video_url}
                       className="w-full h-full"
                       muted={isMuted}
                       playsInline
                       preload="auto"
                       controls={true}
                       autoPlay={false}
                       loop={false}
                       onTimeUpdate={handleTimeUpdate}
                       onLoadedMetadata={handleLoadedMetadata}
                       onPlay={handlePlay}
                       onPause={handlePause}
                       onError={handleError}
                       onCanPlay={() => {
                         console.log('VideoCarousel: Video can play');
                         handleCanPlay();
                         // Intentar reproducir manualmente después de que pueda reproducirse
                         if (isPlaying && videoRef.current) {
                           videoRef.current.play().catch(e => 
                             console.error('VideoCarousel: Error playing video:', e)
                           );
                         }
                       }}
                       onLoadedData={handleLoadedData}
                       onLoadStart={() => console.log("VideoCarousel: Video load started")}
                       onWaiting={() => console.log('VideoCarousel: Video waiting')}
                       onStalled={() => console.log('VideoCarousel: Video stalled')}
                       style={{ 
                         objectFit: "contain", 
                         backgroundColor: "black",
                         width: "90%",
                         height: "90%",
                         display: "block",
                         zIndex: 1,
                         position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)"
                       }}
                     />
                   )}
                   
                   {/* Alternativa: iframe para reproducir el video */}
                   {useAlternativePlayer && (
                     <iframe 
                       src={testVideoUrl || currentVideo?.video_url}
                       className="absolute inset-0 w-full h-full"
                       style={{ zIndex: 2 }}
                       frameBorder="0"
                       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                       allowFullScreen
                     ></iframe>
                   )}
                  
                  {/* Botón para alternar entre reproductores */}
                 
                   
                   {/* Video HTML5 básico como último recurso */}
                   {!useAlternativePlayer && testVideoUrl && (
                     <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 5 }}>
                       <video 
                         src={testVideoUrl}
                         width="640" 
                         height="360"
                         controls
                         autoPlay
                         muted
                         style={{ maxWidth: '100%', maxHeight: '100%' }}
                       />
                     </div>
                   )}
                

                 

              </>
          
          {/* Mensaje de error */}
          {videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
              <div className="text-white text-center">
                <p className="text-lg font-semibold mb-2">Error de Video</p>
                <p className="text-sm">{videoError}</p>
                <p className="text-xs mt-2">URL: {currentVideo?.video_url}</p>
              </div>
            </div>
          )}
          
          {/* Overlay con información */}
         

          {/* Controles personalizados */}
        
        </div>
        </motion.div>
      </AnimatePresence>

      {/* Controles de navegación */}
      {videos.length > 1 && (
        <>
          {/* Botones de navegación */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all z-50"
            style={{ zIndex: 50 }}
          >
            <FiChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all z-50"
            style={{ zIndex: 50 }}
          >
            <FiChevronRight size={24} />
          </button>

          {/* Indicadores con nombres de videos */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-4 z-50" style={{ zIndex: 50 }}>
            {videos.map((video, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`px-3 py-1 rounded-full transition-all text-xs ${
                  index === currentIndex
                    ? 'bg-white text-black font-medium'
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">{video.nombre}</div>
                  
                </div>
              </button>
            ))}
          </div>

          {/* Contador */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm z-50" style={{ zIndex: 50 }}>
            {currentIndex + 1} / {videos.length}
          </div>
        </>
      )}
    </div>
  );
}