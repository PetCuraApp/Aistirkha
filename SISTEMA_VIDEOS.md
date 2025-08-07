# Sistema de Videos - Carrusel en Home

## 📋 **Estructura de la Base de Datos**

### **Tabla `videos`**
```sql
CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  video_url TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política para permitir lectura pública
CREATE POLICY "Allow public read access" ON videos
FOR SELECT USING (activo = true);

-- Política para permitir gestión solo a admins
CREATE POLICY "Allow admin management" ON videos
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

### **Bucket de Storage**
- **Nombre del bucket**: `videosmasajes`
- **Configuración**: Público para lectura
- **Estructura de archivos**: `videos/{timestamp}_{random}.{extension}`

## 🎬 **Componentes Implementados**

### **1. VideosManager.tsx**
- **Ubicación**: `src/app/(pages)/admin/VideosManager.tsx`
- **Funcionalidades**:
  - ✅ Subir videos al bucket de Supabase
  - ✅ Crear/editar/eliminar videos
  - ✅ Activar/desactivar videos
  - ✅ Reordenar videos (mover arriba/abajo)
  - ✅ Vista previa de videos
  - ✅ Gestión de metadatos (nombre, descripción)

### **2. VideoCarousel.tsx**
- **Ubicación**: `src/components/VideoCarousel.tsx`
- **Funcionalidades**:
  - ✅ Carrusel automático con autoplay
  - ✅ Controles de navegación (anterior/siguiente)
  - ✅ Indicadores de posición
  - ✅ Controles de reproducción (play/pause)
  - ✅ Toggle de autoplay
  - ✅ Transiciones suaves con Framer Motion
  - ✅ Overlay con información del video

### **3. Integración en Admin Panel**
- **Pestaña agregada**: "Videos" en el panel de administración
- **Icono**: FiVideo
- **Acceso**: Solo para usuarios con rol 'admin'

### **4. Integración en Home**
- **Reemplaza**: La imagen estática del hero section
- **Responsive**: Se adapta a móvil y desktop
- **Fallback**: No se muestra si no hay videos activos

## 🚀 **Configuración Requerida**

### **1. Crear el Bucket en Supabase**
```bash
# En el dashboard de Supabase:
1. Ir a Storage
2. Crear bucket llamado "videosmasajes"
3. Configurar como público
4. Configurar políticas de acceso
```

### **2. Políticas de Storage**
```sql
-- Política para permitir subida de videos solo a admins
CREATE POLICY "Allow admin uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'videosmasajes' AND 
  auth.jwt() ->> 'role' = 'admin'
);

-- Política para permitir lectura pública
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT USING (bucket_id = 'videosmasajes');

-- Política para permitir eliminación solo a admins
CREATE POLICY "Allow admin deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'videosmasajes' AND 
  auth.jwt() ->> 'role' = 'admin'
);
```

### **3. Variables de Entorno**
```env
# Ya configuradas para Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

## 📱 **Características del Carrusel**

### **Funcionalidades**
- **Autoplay**: Cambia automáticamente cada 8 segundos
- **Controles manuales**: Botones de navegación
- **Indicadores**: Puntos que muestran la posición actual
- **Contador**: Muestra "1 / 3" por ejemplo
- **Controles de reproducción**: Play/pause y toggle de autoplay
- **Responsive**: Se adapta a diferentes tamaños de pantalla

### **Animaciones**
- **Transiciones suaves** entre videos
- **Fade in/out** con Framer Motion
- **Hover effects** en controles
- **Loading states** mientras carga

### **Accesibilidad**
- **Controles de teclado** (flechas)
- **Screen reader friendly**
- **Contraste adecuado** en controles
- **Focus indicators** visibles

## 🎯 **Uso del Sistema**

### **Para Administradores**

1. **Acceder al Panel Admin**
   - Ir a `/admin`
   - Iniciar sesión como admin
   - Hacer clic en la pestaña "Videos"

2. **Subir un Video**
   - Hacer clic en "Agregar Video"
   - Completar nombre y descripción
   - Seleccionar archivo de video
   - Hacer clic en "Guardar"

3. **Gestionar Videos**
   - **Editar**: Hacer clic en el ícono de editar
   - **Eliminar**: Hacer clic en el ícono de eliminar
   - **Activar/Desactivar**: Hacer clic en el ícono de ojo
   - **Reordenar**: Usar flechas arriba/abajo

### **Para Usuarios**

1. **Ver el Carrusel**
   - Ir a la página principal (`/`)
   - Los videos se reproducen automáticamente
   - Usar controles para navegar manualmente

2. **Controles Disponibles**
   - **Flechas**: Navegar entre videos
   - **Puntos**: Ir directamente a un video
   - **Play/Pause**: Controlar reproducción
   - **AUTO**: Activar/desactivar autoplay

## 🔧 **Personalización**

### **Cambiar Intervalo de Autoplay**
```typescript
// En VideoCarousel.tsx, línea ~50
interval = setInterval(() => {
  setCurrentIndex((prev) => (prev + 1) % videos.length);
}, 8000); // Cambiar 8000 por el tiempo deseado en ms
```

### **Cambiar Altura del Carrusel**
```typescript
// En VideoCarousel.tsx, línea ~80
<div className="relative h-96 overflow-hidden rounded-lg shadow-lg">
// Cambiar h-96 por la altura deseada
```

### **Cambiar Estilo de Controles**
```typescript
// En VideoCarousel.tsx, modificar las clases CSS de los botones
className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
```

## 🐛 **Solución de Problemas**

### **Video no se reproduce**
- Verificar que el archivo sea compatible (MP4, WebM, etc.)
- Verificar que la URL sea pública
- Verificar permisos del bucket

### **Carrusel no aparece**
- Verificar que hay videos activos en la base de datos
- Verificar políticas de acceso a la tabla `videos`
- Revisar consola del navegador para errores

### **Error al subir video**
- Verificar tamaño del archivo (recomendado < 100MB)
- Verificar formato del archivo
- Verificar permisos del bucket
- Verificar rol de usuario (debe ser admin)

### **Videos no se cargan**
- Verificar conexión a Supabase
- Verificar variables de entorno
- Verificar políticas de RLS

## 📊 **Métricas y Monitoreo**

### **Logs Importantes**
```typescript
// En VideoCarousel.tsx
console.log('VideoCarousel: Fetched videos:', data?.length || 0);

// En VideosManager.tsx
console.log('VideosManager: Video uploaded successfully');
console.log('VideosManager: Video deleted successfully');
```

### **Métricas a Monitorear**
- Número de videos activos
- Tiempo de carga de videos
- Errores de reproducción
- Uso de controles manuales vs autoplay

## 🔒 **Seguridad**

### **Validaciones**
- ✅ Solo admins pueden subir/eliminar videos
- ✅ Solo videos activos se muestran en el carrusel
- ✅ Validación de tipos de archivo
- ✅ Límites de tamaño de archivo

### **Políticas de Acceso**
- ✅ Lectura pública para videos activos
- ✅ Escritura solo para admins
- ✅ Eliminación solo para admins

## 🚀 **Próximos Pasos**

1. **Crear la tabla `videos`** en Supabase
2. **Configurar el bucket `videosmasajes`**
3. **Aplicar las políticas de seguridad**
4. **Probar subida de videos** desde el admin panel
5. **Verificar el carrusel** en la página principal

## 📞 **Soporte**

Si encuentras problemas:
1. Revisar la consola del navegador
2. Verificar permisos de Supabase
3. Verificar configuración del bucket
4. Verificar políticas de RLS
5. Contactar al equipo de desarrollo 